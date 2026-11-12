import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createInquiryApi } from '../lib/inquiry-api.mjs';

const project = () => ({
  token: randomUUID(), business: 'Example Studio', name: 'Example Contact', email: 'contact@example.test',
  category: 'production', services: ['Vehicle Wraps & Graphics'], description: 'Graphics for two vehicles.',
});

function request(api, action, input, headers = {}) {
  const raw = Buffer.from(JSON.stringify(input));
  const req = Object.assign(Readable.from([raw]), {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, socket: { remoteAddress: '127.0.0.1' },
  });
  return new Promise((resolve, reject) => {
    const res = {
      writeHead(code, responseHeaders) { this.code = code; this.headers = responseHeaders; },
      end(body) { resolve({ code: this.code, headers: this.headers, body: JSON.parse(body) }); },
      setHeader() {},
    };
    api(req, res, `/api/project/${action}`).catch(reject);
  });
}

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'bluechip-inquiry-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, env: { BLUECHIP_INQUIRY_DIR: directory }, read: async id => JSON.parse(await readFile(join(directory, `${id}.json`))) };
}

test('validates independently of Cal, saves once, and reports missing notification configuration', async t => {
  const { env, read, directory } = await fixture(t);
  const api = createInquiryApi({ env, fetcher: () => assert.fail('Unexpected provider call') });
  const input = project();
  assert.equal((await request(api, 'submit', { ...input, description: ' ' })).code, 422);
  assert.equal((await request(api, 'submit', { ...input, services: ['Brand Identity'] })).code, 422);
  assert.equal((await request(api, 'submit', input, { 'sec-fetch-site': 'cross-site' })).code, 403);
  assert.equal((await request(api, 'calendar', input)).code, 503);
  assert.deepEqual(await readdir(directory), []);
  const first = await request(api, 'submit', input);
  assert.equal(first.code, 200);
  assert.equal(first.body.notification, 'unconfigured');
  assert.equal(first.headers['Cache-Control'], 'no-store');
  const retry = await request(createInquiryApi({ env }), 'submit', { ...input, business: 'Different business' });
  assert.equal(first.body.id, retry.body.id);
  const record = await read(first.body.id);
  assert.equal(record.project.business, input.business);
  assert.equal(record.status, 'submitted');
  assert.ok(record.submittedAt);
  assert.equal(await readdir(directory).then(files => files.length), 1);
});

test('reports provider failure and serializes concurrent retries without duplicate accepted email', async t => {
  const { env, read } = await fixture(t);
  const input = project();
  const keys = [];
  const api = createInquiryApi({
    env: { ...env, RESEND_API_KEY: 're_test', BLUECHIP_INQUIRY_FROM: 'from@example.test', BLUECHIP_INQUIRY_TO: 'to@example.test' },
    fetcher: async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      assert.equal(options.headers.Authorization, 'Bearer re_test');
      const message = JSON.parse(options.body);
      assert.equal(message.reply_to, input.email);
      const key = options.headers['Idempotency-Key'];
      const id = key.split('/')[1];
      assert.equal((await read(id)).status, 'submitted');
      keys.push(key);
      return keys.length === 1 ? new Response(null, { status: 500 }) : Response.json({ id: 'provider-message-id' });
    },
  });
  const failed = await request(api, 'submit', input);
  assert.equal(failed.body.notification, 'failed');
  assert.equal((await read(failed.body.id)).notification, 'failed');
  const retries = await Promise.all([request(api, 'submit', input), request(api, 'submit', input)]);
  assert.ok(retries.every(result => result.body.notification === 'sent'));
  assert.deepEqual(keys, [keys[0], keys[0]]);
  assert.equal((await read(failed.body.id)).notification, 'sent');
});

test('uses server-verified booking data and reconciles signed, replayed and out-of-order webhooks', async t => {
  const { env, read, directory } = await fixture(t);
  const bookings = new Map();
  const secret = 'webhook-test-secret';
  const bookingUrl = 'https://cal.com/bluechip-example/free-project-consultation';
  const api = createInquiryApi({
    env: { ...env, CALCOM_API_KEY: 'cal_test', CALCOM_EVENT_TYPE_ID: '20', CALCOM_WEBHOOK_SECRET: secret },
    fetcher: async (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer cal_test');
      if (url === 'https://api.cal.com/v2/event-types/20') {
        assert.equal(options.headers['cal-api-version'], '2026-06-12');
        return Response.json({ status: 'success', data: { id: 20, lengthInMinutes: 20, bookingUrl, bookingFields: [{ slug: 'bluechip_reference', hidden: true }] } });
      }
      assert.match(url, /^https:\/\/api\.cal\.com\/v2\/bookings\//);
      assert.equal(options.headers['cal-api-version'], '2026-02-25');
      const data = bookings.get(url.split('/').at(-1));
      return data ? Response.json({ status: 'success', data }) : new Response(null, { status: 404 });
    },
  });
  const input = project();
  const calendar = await request(api, 'calendar', input);
  assert.equal(calendar.code, 200);
  const id = calendar.body.reference;
  assert.match(id, /^[a-f0-9]{64}$/);
  assert.notEqual(id, input.token);
  assert.equal(calendar.body.link, 'bluechip-example/free-project-consultation');
  assert.deepEqual(calendar.body.contact, { name: input.name, email: input.email });
  assert.ok(!JSON.stringify(calendar).includes('cal_test'));
  assert.equal((await read(id)).status, 'booking_started');
  assert.equal((await request(api, 'verify-booking', { token: input.token, uid: 'made-up', status: 'accepted' })).code, 404);

  const original = {
    id: 25, uid: 'original-booking', status: 'accepted', eventTypeId: 20, duration: 20,
    start: '2026-11-15T15:00:00Z', updatedAt: '2026-11-12T16:00:00Z',
    bookingFieldsResponses: { bluechip_reference: id }, attendees: [{ email: input.email, timeZone: 'America/New_York' }],
  };
  bookings.set(original.uid, { ...original, eventTypeId: 999 });
  assert.equal((await request(api, 'verify-booking', { token: input.token, uid: original.uid })).code, 409);
  bookings.set(original.uid, { ...original, status: 'pending' });
  assert.equal((await request(api, 'verify-booking', { token: input.token, uid: original.uid })).body.status, 'booking_pending');
  bookings.set(original.uid, original);
  const confirmed = await request(api, 'verify-booking', { token: input.token, uid: original.uid });
  assert.deepEqual(confirmed.body, { status: 'booking_confirmed', start: original.start, timeZone: 'America/New_York' });
  assert.equal((await request(api, 'calendar', input)).body.booking.status, 'booking_confirmed');

  const webhook = (triggerEvent, uid, valid = true) => {
    const payload = { triggerEvent, payload: { uid } };
    const signature = createHmac('sha256', valid ? secret : 'invalid').update(JSON.stringify(payload)).digest('hex');
    return request(api, 'cal-webhook', payload, { 'x-cal-signature-256': signature });
  };
  const moved = { ...original, id: 26, uid: 'moved-booking', start: '2026-11-16T15:00:00Z', updatedAt: '2026-11-12T17:00:00Z', rescheduledFromUid: original.uid };
  bookings.set(original.uid, { ...original, status: 'cancelled', rescheduledToUid: moved.uid });
  bookings.set(moved.uid, moved);
  assert.equal((await webhook('BOOKING_RESCHEDULED', moved.uid, false)).code, 401);
  assert.equal((await read(id)).booking.uid, original.uid);
  assert.equal((await webhook('BOOKING_RESCHEDULED', moved.uid)).code, 200);
  assert.equal((await read(id)).booking.uid, moved.uid);
  await webhook('BOOKING_CREATED', original.uid);
  assert.equal((await read(id)).booking.start, moved.start);
  bookings.set(moved.uid, { ...moved, status: 'cancelled', updatedAt: '2026-11-12T18:00:00Z' });
  await webhook('BOOKING_CANCELLED', moved.uid);
  const cancelled = await read(id);
  assert.equal(cancelled.status, 'booking_cancelled');
  await webhook('BOOKING_CANCELLED', moved.uid);
  assert.deepEqual(await read(id), cancelled);
  const submitted = await request(api, 'submit', input);
  assert.equal(submitted.body.id, id);
  assert.deepEqual(await readdir(directory), [`${id}.json`]);
});
