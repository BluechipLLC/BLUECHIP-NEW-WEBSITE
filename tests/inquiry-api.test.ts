import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { createInquiryApi } from '@/lib/inquiry/api';
import type { InquiryRecord } from '@/lib/inquiry/store';

type Api = ReturnType<typeof createInquiryApi>;
type Init = { headers: Record<string, string>; body?: string };

const project = () => ({
  token: randomUUID(), business: 'Example Studio', name: 'Example Contact', email: 'contact@example.test',
  category: 'production', services: ['Vehicle Wraps & Graphics'], description: 'Graphics for two vehicles.',
});

async function request(api: Api, action: string, input: unknown, headers: Record<string, string> = {}) {
  const response = await api(action, new Request(`http://localhost/api/project/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1', ...headers },
    body: JSON.stringify(input),
  }));
  return { code: response.status, headers: response.headers, body: await response.json() };
}

const cleanup: string[] = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'bluechip-inquiry-test-'));
  cleanup.push(directory);
  const read = async (id: string) => JSON.parse(await readFile(join(directory, `${id}.json`), 'utf8')) as Required<InquiryRecord>;
  return { directory, env: { BLUECHIP_INQUIRY_DIR: directory }, read };
}

const unexpected = async (): Promise<Response> => { throw new Error('Unexpected provider call'); };

describe('inquiry API', () => {
  test('validates independently of Cal, saves once, and reports missing notification configuration', async () => {
    const { env, read, directory } = await fixture();
    const api = createInquiryApi({ env, fetcher: unexpected });
    const input = project();
    expect((await request(api, 'submit', { ...input, description: ' ' })).code).toBe(422);
    expect((await request(api, 'submit', { ...input, services: ['Brand Identity'] })).code).toBe(422);
    expect((await request(api, 'submit', input, { 'sec-fetch-site': 'cross-site' })).code).toBe(403);
    expect((await request(api, 'calendar', input)).code).toBe(503);
    expect((await request(api, 'unknown', input)).code).toBe(404);
    expect(await readdir(directory)).toEqual([]);
    const first = await request(api, 'submit', input);
    expect(first.code).toBe(200);
    expect(first.body.notification).toBe('unconfigured');
    expect(first.headers.get('Cache-Control')).toBe('no-store');
    const retry = await request(createInquiryApi({ env }), 'submit', { ...input, business: 'Different business' });
    expect(retry.body.id).toBe(first.body.id);
    const record = await read(first.body.id);
    expect(record.project.business).toBe(input.business);
    expect(record.status).toBe('submitted');
    expect(record.submittedAt).toBeTruthy();
    expect(await readdir(directory)).toHaveLength(1);
  });

  test('rejects oversized and non-JSON bodies', async () => {
    const { env } = await fixture();
    const api = createInquiryApi({ env, fetcher: unexpected });
    expect((await request(api, 'submit', { ...project(), description: 'x'.repeat(70 * 1024) })).code).toBe(413);
    const text = await api('submit', new Request('http://localhost/api/project/submit', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' }));
    expect(text.status).toBe(415);
  });

  test('rate limits by the address the trusted proxy appended, not a spoofed first hop', async () => {
    const { env } = await fixture();
    const api = createInquiryApi({ env: { ...env, TRUST_PROXY: '1' }, fetcher: unexpected });
    const invalid = { token: 'not-a-token' };
    for (let i = 0; i < 60; i++) {
      expect((await request(api, 'submit', invalid, { 'x-forwarded-for': `10.0.0.${i}, 203.0.113.7` })).code).toBe(400);
    }
    expect((await request(api, 'submit', invalid, { 'x-forwarded-for': '10.9.9.9, 203.0.113.7' })).code).toBe(429);
    expect((await request(api, 'submit', invalid, { 'x-forwarded-for': '203.0.113.8' })).code).toBe(400);
  });

  test('reports provider failure and serializes concurrent retries without duplicate accepted email', async () => {
    const { env, read } = await fixture();
    const input = project();
    const keys: string[] = [];
    const api = createInquiryApi({
      env: { ...env, RESEND_API_KEY: 're_test', BLUECHIP_INQUIRY_FROM: 'from@example.test', BLUECHIP_INQUIRY_TO: 'to@example.test' },
      fetcher: async (url, init) => {
        const options = init as Init;
        expect(url).toBe('https://api.resend.com/emails');
        expect(options.headers.Authorization).toBe('Bearer re_test');
        expect(JSON.parse(options.body!).reply_to).toBe(input.email);
        const key = options.headers['Idempotency-Key'];
        expect((await read(key.split('/')[1])).status).toBe('submitted');
        keys.push(key);
        return keys.length === 1 ? new Response(null, { status: 500 }) : Response.json({ id: 'provider-message-id' });
      },
    });
    const failed = await request(api, 'submit', input);
    expect(failed.body.notification).toBe('failed');
    expect((await read(failed.body.id)).notification).toBe('failed');
    const retries = await Promise.all([request(api, 'submit', input), request(api, 'submit', input)]);
    expect(retries.every(result => result.body.notification === 'sent')).toBe(true);
    expect(keys).toEqual([keys[0], keys[0]]);
    expect((await read(failed.body.id)).notification).toBe('sent');
  });

  test('uses server-verified booking data and reconciles signed, replayed and out-of-order webhooks', async () => {
    const { env, read, directory } = await fixture();
    const bookings = new Map<string, Record<string, unknown>>();
    const secret = 'webhook-test-secret';
    const bookingUrl = 'https://cal.com/bluechip-example/free-project-consultation';
    const api = createInquiryApi({
      env: { ...env, CALCOM_API_KEY: 'cal_test', CALCOM_EVENT_TYPE_ID: '20', CALCOM_WEBHOOK_SECRET: secret },
      fetcher: async (url, init) => {
        const options = init as Init;
        expect(options.headers.Authorization).toBe('Bearer cal_test');
        if (url === 'https://api.cal.com/v2/event-types/20') {
          expect(options.headers['cal-api-version']).toBe('2026-06-12');
          return Response.json({ status: 'success', data: { id: 20, lengthInMinutes: 20, bookingUrl, bookingFields: [{ slug: 'bluechip_reference', hidden: true }] } });
        }
        expect(url).toMatch(/^https:\/\/api\.cal\.com\/v2\/bookings\//);
        expect(options.headers['cal-api-version']).toBe('2026-02-25');
        const data = bookings.get(url.split('/').at(-1)!);
        return data ? Response.json({ status: 'success', data }) : new Response(null, { status: 404 });
      },
    });
    const input = project();
    const calendar = await request(api, 'calendar', input);
    expect(calendar.code).toBe(200);
    const id = calendar.body.reference as string;
    expect(id).toMatch(/^[a-f0-9]{64}$/);
    expect(id).not.toBe(input.token);
    expect(calendar.body.link).toBe('bluechip-example/free-project-consultation');
    expect(calendar.body.contact).toEqual({ name: input.name, email: input.email });
    expect(JSON.stringify(calendar.body)).not.toContain('cal_test');
    expect((await read(id)).status).toBe('booking_started');
    expect((await request(api, 'verify-booking', { token: input.token, uid: 'made-up', status: 'accepted' })).code).toBe(404);

    const original = {
      id: 25, uid: 'original-booking', status: 'accepted', eventTypeId: 20, duration: 20,
      start: '2026-11-15T15:00:00Z', updatedAt: '2026-11-12T16:00:00Z',
      bookingFieldsResponses: { bluechip_reference: id }, attendees: [{ email: input.email, timeZone: 'America/New_York' }],
    };
    bookings.set(original.uid, { ...original, eventTypeId: 999 });
    expect((await request(api, 'verify-booking', { token: input.token, uid: original.uid })).code).toBe(409);
    bookings.set(original.uid, { ...original, status: 'pending' });
    expect((await request(api, 'verify-booking', { token: input.token, uid: original.uid })).body.status).toBe('booking_pending');
    bookings.set(original.uid, original);
    const confirmed = await request(api, 'verify-booking', { token: input.token, uid: original.uid });
    expect(confirmed.body).toEqual({ status: 'booking_confirmed', start: original.start, timeZone: 'America/New_York' });
    expect((await request(api, 'calendar', input)).body.booking.status).toBe('booking_confirmed');

    const webhook = (triggerEvent: string, uid: string, valid = true) => {
      const payload = { triggerEvent, payload: { uid } };
      const signature = createHmac('sha256', valid ? secret : 'invalid').update(JSON.stringify(payload)).digest('hex');
      return request(api, 'cal-webhook', payload, { 'x-cal-signature-256': signature });
    };
    const moved = { ...original, id: 26, uid: 'moved-booking', start: '2026-11-16T15:00:00Z', updatedAt: '2026-11-12T17:00:00Z', rescheduledFromUid: original.uid };
    bookings.set(original.uid, { ...original, status: 'cancelled', rescheduledToUid: moved.uid });
    bookings.set(moved.uid, moved);
    expect((await webhook('BOOKING_RESCHEDULED', moved.uid, false)).code).toBe(401);
    expect((await read(id)).booking.uid).toBe(original.uid);
    expect((await webhook('BOOKING_RESCHEDULED', moved.uid)).code).toBe(200);
    expect((await read(id)).booking.uid).toBe(moved.uid);
    await webhook('BOOKING_CREATED', original.uid);
    expect((await read(id)).booking.start).toBe(moved.start);
    bookings.set(moved.uid, { ...moved, status: 'cancelled', updatedAt: '2026-11-12T18:00:00Z' });
    await webhook('BOOKING_CANCELLED', moved.uid);
    const cancelled = await read(id);
    expect(cancelled.status).toBe('booking_cancelled');
    await webhook('BOOKING_CANCELLED', moved.uid);
    expect(await read(id)).toEqual(cancelled);
    const submitted = await request(api, 'submit', input);
    expect(submitted.body.id).toBe(id);
    expect(await readdir(directory)).toEqual([`${id}.json`]);
  });
});
