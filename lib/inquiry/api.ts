import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { categories } from './fields';
import { createFileStore, type InquiryRecord, type InquiryStore, type Project } from './store';
import { RequestError, validateProject } from './validate';

const tokenPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const referencePattern = /^[a-f0-9]{64}$/;
const bookingUidPattern = /^[\w-]{1,150}$/;
const bookingEvents = new Set(['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED']);
const maxBodySize = 64 * 1024;
const unavailable = 'Online scheduling is unavailable right now. You can still send your project inquiry.';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');

type Env = Record<string, string | undefined>;
type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CalBooking = {
  id: number;
  uid: string;
  status: string;
  start: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  eventTypeId: number;
  rescheduledToUid?: string;
  rescheduledFromUid?: string;
  bookingFieldsResponses?: Record<string, unknown>;
  attendees?: { email?: string; timeZone?: string }[];
};

type CalEventType = {
  id: number;
  bookingUrl: string;
  lengthInMinutes: number;
  price?: number;
  successRedirectUrl?: string;
  bookingRequiresAuthentication?: boolean;
  emailSettings?: { disableEmailsToAttendees?: boolean };
  bookingFields?: { slug: string }[];
};

export type BookingResult = { status: 'booking_confirmed' | 'booking_pending' | 'booking_cancelled'; start: string; timeZone?: string };

function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function readBody(request: Request) {
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Expected a JSON request.');
  }
  if (Number(request.headers.get('content-length')) > maxBodySize) throw new RequestError(413, 'The request is too large.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodySize) {
        await reader.cancel();
        throw new RequestError(413, 'The request is too large.');
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

function parse(body: Buffer): Record<string, unknown> {
  try {
    const value = JSON.parse(body.toString('utf8'));
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  } catch {}
  throw new RequestError(400, 'Invalid request.');
}

/**
 * The client address for rate limiting. Behind `TRUST_PROXY` reverse proxies, each proxy appends
 * the address it saw, so the trustworthy entry is that many places from the right. Without a
 * proxy the header may be supplied by the client, which makes the limit best-effort only.
 */
function clientAddress(request: Request, env: Env) {
  const hops = Math.max(1, Number.parseInt(env.TRUST_PROXY ?? '', 10) || 1);
  const entries = (request.headers.get('x-forwarded-for') ?? '').split(',').map(entry => entry.trim()).filter(Boolean);
  return entries[entries.length - hops] ?? entries[0] ?? 'unknown';
}

export function createInquiryApi({ env = process.env as Env, fetcher = fetch as Fetcher, store }: { env?: Env; fetcher?: Fetcher; store?: InquiryStore } = {}) {
  if (!store) {
    // Runtime paths, not build inputs: keep the bundler from tracing the whole project.
    const directory = resolve(/*turbopackIgnore: true*/ env.BLUECHIP_INQUIRY_DIR || './data/inquiries');
    const publicRoot = resolve(/*turbopackIgnore: true*/ 'public');
    if (directory === publicRoot || directory.startsWith(publicRoot + sep)) throw new Error('Inquiry storage must be outside public/.');
    store = createFileStore(directory);
  }
  const records = store;
  const eventTypeId = Number(env.CALCOM_EVENT_TYPE_ID);
  const emailConfigured = Boolean(env.RESEND_API_KEY && env.BLUECHIP_INQUIRY_FROM && env.BLUECHIP_INQUIRY_TO);
  let cachedEvent: { link: string; expires: number } | undefined;

  async function calGet<T>(resource: string, version: string): Promise<T> {
    if (!env.CALCOM_API_KEY || !Number.isSafeInteger(eventTypeId) || eventTypeId < 1) throw new RequestError(503, unavailable);
    try {
      const response = await fetcher(`https://api.cal.com/v2/${resource}`, {
        headers: { Authorization: `Bearer ${env.CALCOM_API_KEY}`, 'cal-api-version': version },
        signal: AbortSignal.timeout(6500),
      });
      if (response.status === 404) throw new RequestError(404, 'Cal.com has not made this booking available yet.');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && !Array.isArray(result.data)) return result.data as T;
      }
    } catch (error) {
      if (error instanceof RequestError) throw error;
    }
    throw new RequestError(503, unavailable);
  }

  /** The booking link, used only if the event type is set up as the README describes. */
  async function calendarLink() {
    if (cachedEvent && cachedEvent.expires > Date.now()) return cachedEvent.link;
    try {
      const event = await calGet<CalEventType>(`event-types/${eventTypeId}`, '2026-06-12');
      const url = new URL(event.bookingUrl);
      if (event.id === eventTypeId && event.lengthInMinutes === 20 && !event.price &&
        !event.successRedirectUrl && !event.bookingRequiresAuthentication && !event.emailSettings?.disableEmailsToAttendees &&
        ['https://cal.com', 'https://app.cal.com'].includes(url.origin) &&
        event.bookingFields?.some(field => field.slug === 'bluechip_reference')) {
        const link = url.pathname.replace(/^\/+|\/+$/g, '');
        if (link) {
          cachedEvent = { link, expires: Date.now() + 60000 };
          return link;
        }
      }
    } catch (error) {
      if (error instanceof RequestError && error.status === 503) throw error;
    }
    throw new RequestError(503, unavailable);
  }

  async function notify(record: InquiryRecord): Promise<InquiryRecord['notification']> {
    if (!emailConfigured) return 'unconfigured';
    const project = record.project!;
    const text = [
      `Inquiry: ${record.id}`, `Business: ${project.business}`, `Contact: ${project.name}`,
      `Email: ${project.email}`, `Phone: ${project.phone || '—'}`, `Preferred contact: ${project.contactMethod || '—'}`,
      `Category: ${categories[project.category].label}`, `Services: ${project.services.join(', ')}`,
      `Timeline: ${project.timeline || '—'}`, `Budget: ${project.budget || '—'}`, '', project.description,
    ].join('\n');
    try {
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `bluechip-project/${record.id}`,
        },
        body: JSON.stringify({ from: env.BLUECHIP_INQUIRY_FROM, to: [env.BLUECHIP_INQUIRY_TO], reply_to: project.email, subject: 'New Bluechip project inquiry', text }),
        signal: AbortSignal.timeout(6500),
      });
      if (response.ok && (await response.json()).id) return 'sent';
    } catch {}
    return 'failed';
  }

  async function saveProject(id: string, project: Project, submit: boolean) {
    return records.lock(id, async () => {
      const existing = await records.read(id);
      const now = new Date().toISOString();
      const record: InquiryRecord = existing ?? { id, source: 'bluechip-website', createdAt: now, status: 'booking_started' };
      // Details are fixed once submitted or booked; later retries reuse the stored record.
      if (!record.submittedAt && !record.booking) record.project = project;
      if (submit && !record.submittedAt) {
        record.submittedAt = now;
        if (!record.booking) record.status = 'submitted';
      }
      if (submit || !record.booking) await records.write(record);
      if (submit && record.notification !== 'sent') {
        record.notification = await notify(record);
        await records.write(record);
      }
      return record;
    });
  }

  /** Match a Cal.com booking (following reschedules) to its inquiry and store the result. */
  async function reconcile(uid: unknown, requestedId?: string): Promise<BookingResult | null> {
    if (typeof uid !== 'string' || !bookingUidPattern.test(uid)) throw new RequestError(400, 'Invalid booking reference.');
    const first = await calGet<CalBooking>(`bookings/${uid}`, '2026-02-25');
    const id = first.bookingFieldsResponses?.bluechip_reference;
    if (typeof id !== 'string' || !referencePattern.test(id) || (requestedId && requestedId !== id)) return null;
    return records.lock(id, async () => {
      const record = await records.read(id);
      if (!record?.project) return null;
      let booking = first;
      const lineage = new Set([uid]);
      while (bookingUidPattern.test(booking.rescheduledToUid ?? '') && !lineage.has(booking.rescheduledToUid!) && lineage.size < 12) {
        lineage.add(booking.rescheduledToUid!);
        booking = await calGet<CalBooking>(`bookings/${booking.rescheduledToUid}`, '2026-02-25');
      }
      if (booking.rescheduledToUid || booking.eventTypeId !== eventTypeId || booking.duration !== 20 ||
        booking.bookingFieldsResponses?.bluechip_reference !== id) return null;
      const attendee = booking.attendees?.find(person => person.email?.toLowerCase() === record.project!.email);
      if (!attendee) return null;
      const status = ({
        accepted: 'booking_confirmed', pending: 'booking_pending', cancelled: 'booking_cancelled',
        canceled: 'booking_cancelled', rejected: 'booking_cancelled',
      } as const)[booking.status as 'accepted'];
      if (!status || !Number.isFinite(Date.parse(booking.start))) return null;
      const previous = record.booking;
      const newAfterCancellation = record.status === 'booking_cancelled' && Date.parse(booking.createdAt) > Date.parse(previous?.updatedAt ?? '');
      // Ignore stale or out-of-order updates, and bookings unrelated to the stored one.
      if (previous && (Date.parse(previous.updatedAt) > Date.parse(booking.updatedAt) ||
        (!lineage.has(previous.uid) && booking.rescheduledFromUid !== previous.uid && !newAfterCancellation))) return null;
      record.status = status;
      record.booking = { id: booking.id, uid: booking.uid, start: booking.start, timeZone: attendee.timeZone, updatedAt: booking.updatedAt };
      await records.write(record);
      return { status, start: record.booking.start, timeZone: record.booking.timeZone };
    });
  }

  const buckets = new Map<string, number>();
  let rateWindow = 0;
  function checkRate(request: Request) {
    const window = Math.floor(Date.now() / 60000);
    if (window !== rateWindow) {
      buckets.clear();
      rateWindow = window;
    }
    const address = clientAddress(request, env);
    const count = (buckets.get(address) ?? 0) + 1;
    if (count > 60) throw new RequestError(429, 'Too many attempts. Please try again in a minute.');
    buckets.set(address, count);
  }

  /** Handle `POST /api/project/<action>` (the route only accepts POST). */
  return async function handle(action: string, request: Request): Promise<Response> {
    try {
      if (action === 'cal-webhook') {
        const signature = request.headers.get('x-cal-signature-256');
        if (!env.CALCOM_WEBHOOK_SECRET || !signature || !referencePattern.test(signature)) throw new RequestError(401, 'Invalid webhook signature.');
        const raw = await readBody(request);
        const expected = createHmac('sha256', env.CALCOM_WEBHOOK_SECRET).update(raw).digest();
        if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new RequestError(401, 'Invalid webhook signature.');
        const event = parse(raw) as { triggerEvent?: string; payload?: { uid?: unknown } };
        if (bookingEvents.has(event.triggerEvent ?? '') && typeof event.payload?.uid === 'string') await reconcile(event.payload.uid);
        return json(200, { received: true });
      }
      if (request.headers.get('sec-fetch-site') === 'cross-site') throw new RequestError(403, 'Open the inquiry on the Bluechip website.');
      checkRate(request);
      const body = parse(await readBody(request));
      if (typeof body.token !== 'string' || !tokenPattern.test(body.token)) throw new RequestError(400, 'Invalid inquiry reference.');
      // The browser keeps the token; only its hash is stored and shown as the reference.
      const id = digest(body.token);
      if (action === 'submit') {
        const record = await saveProject(id, validateProject(body), true);
        return json(200, { id, notification: record.notification });
      }
      if (action === 'calendar') {
        const project = validateProject(body);
        const link = await calendarLink();
        const record = await saveProject(id, project, false);
        const booking = record.booking ? await reconcile(record.booking.uid, id) : null;
        if (record.booking && !booking) throw new RequestError(503, unavailable);
        if (booking && booking.status !== 'booking_cancelled') return json(200, { booking });
        return json(200, { link, reference: id, contact: { name: record.project!.name, email: record.project!.email } });
      }
      if (action === 'verify-booking') {
        if (!await records.read(id)) throw new RequestError(404, 'The inquiry was not found.');
        const booking = await reconcile(body.uid, id);
        if (!booking) throw new RequestError(409, 'The booking could not be matched to this inquiry.');
        return json(200, booking);
      }
      throw new RequestError(404, 'Unknown endpoint.');
    } catch (error) {
      if (!(error instanceof RequestError)) {
        console.error('Bluechip inquiry request failed:', (error as NodeJS.ErrnoException)?.code ?? (error as Error)?.name);
        return json(500, { error: 'Something went wrong. Please try again.' });
      }
      return json(error.status, { error: error.message });
    }
  };
}
