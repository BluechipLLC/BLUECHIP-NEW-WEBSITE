# BLUECHIP NEW WEBSITE

Bluechip Branding & Design website wireframe, including the responsive interactive portfolio board and founder contact section.

## Run locally

Requires Node.js 20.11 or newer. No dependencies to install.

```sh
npm run dev
```

Open http://localhost:4176.

## Check

```sh
npm run check
node tests/board-layout.test.mjs
node --test tests/inquiry-api.test.mjs
```

## Project structure

- `dist/`: website HTML, CSS, and JavaScript
- `server.mjs`: local preview server
- `tests/`: portfolio layout checks

This is a wireframe with flat-color project placeholders. The personal founder phone CTA remains inactive until a number is explicitly approved. Uploading this repository does not deploy the website.

## Start a Project setup

The five-step dialog opens from the existing project links. The `/start` URL also opens it directly. The website uses its existing Node server for the project API. Serve the website and API together over HTTPS in production. A static-only deployment can display the form, but cannot accept inquiries or verify bookings.

Set the server variables from `.env.example` through the host’s secret settings. To load a local `.env`, run `node --env-file=.env server.mjs` instead of `npm run dev`. No credentials belong in `dist/` or source control.

### Cal.com

1. In Bluechip’s Cal.com account, connect the calendar, set the availability and time zone, and create a personal event type named **Free Project Consultation**. Set its only duration to **20 minutes**, leave payments and success redirects off, and keep attendee email notifications on. Use the full-name booking field. In the Booking Form settings, lock the email field when prefilled so the booking stays associated with the inquiry.
2. Add a hidden, optional **Short Text** booking question with the identifier `bluechip_reference`. Bluechip passes the reference and prefills name and email. The other project details stay in the matching Bluechip record. The service fetches the booking URL from the event type, so no separate embed URL is required. See [Cal.com booking questions](https://site.cal.com/features/booking-questions) and [Cal.com embeds](https://cal.com/help/embedding/adding-embed).
3. Set `CALCOM_API_KEY` to a server-only key from the Cal.com host account and `CALCOM_EVENT_TYPE_ID` to the event’s numeric ID. The server uses bearer authentication with the [event-type endpoint](https://cal.com/docs/api-reference/v2/event-types/get-an-event-type) at version `2026-06-12` and the [booking endpoint](https://cal.com/docs/api-reference/v2/bookings/get-a-booking) at version `2026-02-25`. A personal account key suits one Bluechip calendar. No OAuth app is required.
4. For background updates, set `CALCOM_WEBHOOK_SECRET` and use the same secret when adding an event-type webhook at `https://<bluechip-host>/api/project/cal-webhook`. Keep the default payload and enable Booking Created, Booking Rescheduled, and Booking Canceled. The endpoint checks the signature over the raw body before fetching the authoritative booking. In-page confirmation can run without webhooks. Background changes need the webhook. See [Cal.com webhooks](https://cal.com/docs/developing/guides/automation/webhooks).
5. In a staging preview, check that the embed shows the account’s actual availability and local time zone. With an authorized test appointment, verify the hidden reference, host and attendee emails, and rescheduling and cancellation. The automated suite uses mock provider responses and creates no appointments.

### Inquiries and email

- Set `BLUECHIP_INQUIRY_DIR` to a backed-up private directory on a persistent volume, outside `dist/`. This repository has no existing database. The current store uses private JSON files and atomic writes, with per-inquiry locking within a single Node process. Run one process per store. Horizontal scaling requires a shared transactional store. Keep abandoned booking drafts and completed inquiries subject to Bluechip’s retention policy.
- Verify a sender domain in Resend, then set `RESEND_API_KEY`, `BLUECHIP_INQUIRY_FROM` (the verified sender), and `BLUECHIP_INQUIRY_TO` (the Bluechip inbox). The server saves the inquiry before asking Resend to deliver its notification. If Resend is missing or fails, the visitor receives an honest saved receipt, and the record identifies the notification status for manual follow-up. Test delivery to the configured inbox before launch. See [Resend’s send-email endpoint](https://resend.com/docs/api-reference/emails/send-email) and [idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys).
- The persisted record holds the project and contact details, timestamps, source, status, and linked Cal.com booking. The same record is reused for retries, for a switch from booking to inquiry, and for webhook updates. A future Mergum adapter can use the stable record ID as its upsert key. This website checkout has no verified Mergum API contract.
