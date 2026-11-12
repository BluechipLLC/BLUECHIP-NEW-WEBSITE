import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, timelines, budgets, contactMethods, limits } from '../dist/inquiry-fields.mjs';
import { createInquiryStore } from './inquiry-store.mjs';

const prefix = '/api/project/';
const tokenPattern = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const referencePattern = /^[a-f0-9]{64}$/;
const bookingUidPattern = /^[\w-]{1,150}$/;
const bookingEvents = new Set(['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED']);
const digest = value => createHash('sha256').update(value).digest('hex');
const unavailable = 'Online scheduling is unavailable right now. You can still send your project inquiry.';

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function reply(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new RequestError(415, 'Expected a JSON request.');
  }
  const maxSize = 64 * 1024;
  if (Number(req.headers['content-length']) > maxSize) throw new RequestError(413, 'The request is too large.');
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxSize) {
      req.resume();
      throw new RequestError(413, 'The request is too large.');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parse(body) {
  try {
    const value = JSON.parse(body);
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  } catch {}
  throw new RequestError(400, 'Invalid request.');
}

function textField(value, label, max, required = false) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if ((required && !normalized) || normalized.length > max || /[\u0000-\u0008\u000b-\u001f\u007f]/.test(normalized)) {
    throw new RequestError(422, `Check the ${label} and try again.`);
  }
  return normalized;
}

function choice(value, choices, label) {
  if (value == null || value === '') return '';
  if (!choices.includes(value)) throw new RequestError(422, `Choose a valid ${label}.`);
  return value;
}

function validate(input) {
  const { category, services } = input;
  if (!Object.hasOwn(categories, category)) throw new RequestError(422, 'Choose a project category.');
  const allowed = categories[category].services;
  if (!Array.isArray(services) || !services.length || services.length > allowed.length || !services.every(service => allowed.includes(service))) {
    throw new RequestError(422, 'Choose at least one service for this project category.');
  }
  const email = textField(input.email, 'email address', limits.email, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RequestError(422, 'Enter a valid email address.');
  return {
    business: textField(input.business, 'business name', limits.business, true),
    name: textField(input.name, 'full name', limits.name, true),
    email,
    phone: textField(input.phone, 'phone number', limits.phone),
    category,
    services: allowed.filter(service => services.includes(service)),
    description: textField(input.description, 'project description', limits.description, true),
    timeline: choice(input.timeline, timelines, 'timeline'),
    budget: choice(input.budget, budgets, 'budget'),
    contactMethod: choice(input.contactMethod, contactMethods, 'contact method'),
  };
}

export function createInquiryApi({ env = process.env, fetcher = fetch } = {}) {
  const directory = resolve(env.BLUECHIP_INQUIRY_DIR || './data/inquiries');
  const publicRoot = fileURLToPath(new URL('../dist', import.meta.url));
  if (directory === publicRoot || directory.startsWith(publicRoot + sep)) throw new Error('Inquiry storage must be outside dist.');
  const store = createInquiryStore(directory);
  const eventTypeId = Number(env.CALCOM_EVENT_TYPE_ID);
  const emailConfigured = Boolean(env.RESEND_API_KEY && env.BLUECHIP_INQUIRY_FROM && env.BLUECHIP_INQUIRY_TO);
  let cachedEvent;

  async function calGet(resource, version) {
    if (!env.CALCOM_API_KEY || !Number.isSafeInteger(eventTypeId) || eventTypeId < 1) throw new RequestError(503, unavailable);
    try {
      const response = await fetcher(`https://api.cal.com/v2/${resource}`, {
        headers: { Authorization: `Bearer ${env.CALCOM_API_KEY}`, 'cal-api-version': version },
        signal: AbortSignal.timeout(6500),
      });
      if (response.status === 404) throw new RequestError(404, 'Cal.com has not made this booking available yet.');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && !Array.isArray(result.data)) return result.data;
      }
    } catch (error) {
      if (error instanceof RequestError) throw error;
    }
    throw new RequestError(503, unavailable);
  }

  async function calendarLink() {
    if (cachedEvent?.expires > Date.now()) return cachedEvent.link;
    try {
      const event = await calGet(`event-types/${eventTypeId}`, '2026-06-12');
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
      if (error.status === 503) throw error;
    }
    throw new RequestError(503, unavailable);
  }

  async function notify(record) {
    if (!emailConfigured) return 'unconfigured';
    const project = record.project;
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
          Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `bluechip-project/${record.id}`,
        },
        body: JSON.stringify({ from: env.BLUECHIP_INQUIRY_FROM, to: [env.BLUECHIP_INQUIRY_TO], reply_to: project.email, subject: 'New Bluechip project inquiry', text }),
        signal: AbortSignal.timeout(6500),
      });
      if (response.ok && (await response.json()).id) return 'sent';
    } catch {}
    return 'failed';
  }

  async function saveProject(id, project, submit) {
    return store.lock(id, async () => {
      const existing = await store.read(id);
      const now = new Date().toISOString();
      const record = existing ?? { id, source: 'bluechip-website', createdAt: now, status: 'booking_started' };
      if (!record.submittedAt && !record.booking) record.project = project;
      if (submit && !record.submittedAt) {
        record.submittedAt = now;
        if (!record.booking) record.status = 'submitted';
      }
      if (submit || !record.booking) await store.write(record);
      if (submit && record.notification !== 'sent') {
        record.notification = await notify(record);
        await store.write(record);
      }
      return record;
    });
  }

  async function reconcile(uid, requestedId) {
    if (typeof uid !== 'string' || !bookingUidPattern.test(uid)) throw new RequestError(400, 'Invalid booking reference.');
    const first = await calGet(`bookings/${uid}`, '2026-02-25');
    const id = first.bookingFieldsResponses?.bluechip_reference;
    if (typeof id !== 'string' || !referencePattern.test(id) || (requestedId && requestedId !== id)) return null;
    return store.lock(id, async () => {
      const record = await store.read(id);
      if (!record) return null;
      let booking = first;
      const lineage = new Set([uid]);
      while (bookingUidPattern.test(booking.rescheduledToUid ?? '') && !lineage.has(booking.rescheduledToUid) && lineage.size < 12) {
        lineage.add(booking.rescheduledToUid);
        booking = await calGet(`bookings/${booking.rescheduledToUid}`, '2026-02-25');
      }
      if (booking.rescheduledToUid || booking.eventTypeId !== eventTypeId || booking.duration !== 20 ||
        booking.bookingFieldsResponses?.bluechip_reference !== id) return null;
      const attendee = booking.attendees?.find(person => person.email?.toLowerCase() === record.project.email);
      if (!attendee) return null;
      const status = {
        accepted: 'booking_confirmed', pending: 'booking_pending', cancelled: 'booking_cancelled',
        canceled: 'booking_cancelled', rejected: 'booking_cancelled',
      }[booking.status];
      if (!status || !Number.isFinite(Date.parse(booking.start))) return null;
      const previous = record.booking;
      const newAfterCancellation = record.status === 'booking_cancelled' && Date.parse(booking.createdAt) > Date.parse(previous?.updatedAt);
      if (previous && (Date.parse(previous.updatedAt) > Date.parse(booking.updatedAt) ||
        (!lineage.has(previous.uid) && booking.rescheduledFromUid !== previous.uid && !newAfterCancellation))) return null;
      record.status = status;
      record.booking = { id: booking.id, uid: booking.uid, start: booking.start, timeZone: attendee.timeZone, updatedAt: booking.updatedAt };
      await store.write(record);
      return { status, start: record.booking.start, timeZone: record.booking.timeZone };
    });
  }

  const buckets = new Map();
  let rateWindow = 0;
  function checkRate(req) {
    const window = Math.floor(Date.now() / 60000);
    if (window !== rateWindow) { buckets.clear(); rateWindow = window; }
    const address = req.socket.remoteAddress;
    const count = (buckets.get(address) ?? 0) + 1;
    if (count > 60) throw new RequestError(429, 'Too many attempts. Please try again in a minute.');
    buckets.set(address, count);
  }

  return async (req, res, pathname) => {
    if (!pathname.startsWith('/api/')) return false;
    try {
      if (!pathname.startsWith(prefix)) throw new RequestError(404, 'Unknown endpoint.');
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new RequestError(405, 'Use POST for this endpoint.');
      }
      const action = pathname.slice(prefix.length);
      if (action === 'cal-webhook') {
        const signature = req.headers['x-cal-signature-256'];
        if (!env.CALCOM_WEBHOOK_SECRET || typeof signature !== 'string' || !referencePattern.test(signature)) {
          throw new RequestError(401, 'Invalid webhook signature.');
        }
        const raw = await readBody(req);
        const expected = createHmac('sha256', env.CALCOM_WEBHOOK_SECRET).update(raw).digest();
        if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new RequestError(401, 'Invalid webhook signature.');
        const event = parse(raw);
        if (bookingEvents.has(event.triggerEvent) && typeof event.payload?.uid === 'string') await reconcile(event.payload.uid);
        reply(res, 200, { received: true });
        return true;
      }
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new RequestError(403, 'Open the inquiry on the Bluechip website.');
      checkRate(req);
      const body = parse(await readBody(req));
      if (typeof body.token !== 'string' || !tokenPattern.test(body.token)) throw new RequestError(400, 'Invalid inquiry reference.');
      const id = digest(body.token);
      if (action === 'submit') {
        const record = await saveProject(id, validate(body), true);
        reply(res, 200, { id, notification: record.notification });
      } else if (action === 'calendar') {
        const project = validate(body);
        const link = await calendarLink();
        const record = await saveProject(id, project, false);
        const booking = record.booking ? await reconcile(record.booking.uid, id) : null;
        if (record.booking && !booking) throw new RequestError(503, unavailable);
        if (booking && booking.status !== 'booking_cancelled') {
          reply(res, 200, { booking });
        } else {
          reply(res, 200, { link, reference: id, contact: { name: record.project.name, email: record.project.email } });
        }
      } else if (action === 'verify-booking') {
        if (!await store.read(id)) throw new RequestError(404, 'The inquiry was not found.');
        const booking = await reconcile(body.uid, id);
        if (!booking) throw new RequestError(409, 'The booking could not be matched to this inquiry.');
        reply(res, 200, booking);
      } else {
        throw new RequestError(404, 'Unknown endpoint.');
      }
    } catch (error) {
      if (!(error instanceof RequestError)) console.error('Bluechip inquiry request failed:', error.code ?? error.name);
      reply(res, error.status ?? 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
    }
    return true;
  };
}
