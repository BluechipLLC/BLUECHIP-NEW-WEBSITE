# Bluechip website

The website for Bluechip Branding & Design: the portfolio, service pages, and the Start a Project inquiry flow with Cal.com booking. Built with Next.js (App Router), React and TypeScript.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` to set variables locally. Without them the site still runs: inquiries are saved to `./data/inquiries` and the visitor sees a saved receipt instead of an emailed confirmation, and online booking shows a fallback message.

## Check

```sh
npm run check      # lint, typecheck, tests
npm run build      # production build
npm start          # serve the build on port 3000
```

GitHub Actions runs lint, typecheck, tests and build on every push and pull request (`.github/workflows/ci.yml`).

## Project structure

| Path | Contents |
|---|---|
| `app/` | Routes. Every page is prerendered; `api/project/[action]` handles inquiries; `portfolio-media/[client]` serves each client's gallery as static JSON. Also `sitemap.ts`, `robots.ts`, icons and the social preview image. |
| `components/` | Header (navigation, merge animation, chip logo), footer, page sections, the portfolio board, the Éclair showcase, and the Start a Project dialog. |
| `content/` | Site copy and data: services, case studies, clients and the portfolio media list (`client-media.json`). |
| `lib/` | Portfolio board ordering (`portfolio.ts`), page metadata, and the inquiry backend (`lib/inquiry/`). |
| `styles/` | Global CSS, imported once in `app/layout.tsx`. |
| `public/assets/` | Images and video. |
| `tests/` | Vitest suites for the inquiry API and portfolio ordering. |

Links to `/start` are plain anchors. The Start a Project dialog intercepts them and opens in place, so they still work without JavaScript and visiting `/start` directly opens the dialog. Use `SiteLink` from `components/sections.tsx` when a link could point to `/start`.

The personal founder phone section is not on the site. Add it back from git history once a number is approved.

## Deployment

Run `npm run build` and `npm start` on a Node host, behind a reverse proxy that terminates HTTPS. Set `TRUST_PROXY` to the number of proxies in front of the app, so rate limiting sees the visitor's address. Set `NEXT_PUBLIC_SITE_URL` to the production URL before building, because canonical links, the sitemap and social previews use it.

Inquiries are stored as private JSON files in `BLUECHIP_INQUIRY_DIR`. That directory must be a persistent, backed-up volume outside `public/`. Run one Node process per store. The per-inquiry lock only works within one process, so scaling out or moving to a serverless host such as Vercel needs a shared store: implement `InquiryStore` from `lib/inquiry/store.ts` against a database and pass it to `createInquiryApi`.

Set server variables through the host's secret settings. No credentials belong in source control.

### Cal.com

1. In Bluechip's Cal.com account, connect the calendar, set the availability and time zone, and create a personal event type named **Free Project Consultation**. Set its only duration to **20 minutes**, leave payments and success redirects off, and keep attendee email notifications on. Use the full-name booking field. In the Booking Form settings, lock the email field when prefilled so the booking stays associated with the inquiry.
2. Add a hidden, optional **Short Text** booking question with the identifier `bluechip_reference`. Bluechip passes the reference and prefills name and email. The other project details stay in the matching Bluechip record. The service fetches the booking URL from the event type, so no separate embed URL is required. See [Cal.com booking questions](https://site.cal.com/features/booking-questions) and [Cal.com embeds](https://cal.com/help/embedding/adding-embed).
3. Set `CALCOM_API_KEY` to a server-only key from the Cal.com host account and `CALCOM_EVENT_TYPE_ID` to the event's numeric ID. The server uses bearer authentication with the [event-type endpoint](https://cal.com/docs/api-reference/v2/event-types/get-an-event-type) at version `2026-06-12` and the [booking endpoint](https://cal.com/docs/api-reference/v2/bookings/get-a-booking) at version `2026-02-25`. A personal account key suits one Bluechip calendar. No OAuth app is required.
4. For background updates, set `CALCOM_WEBHOOK_SECRET` and use the same secret when adding an event-type webhook at `https://<bluechip-host>/api/project/cal-webhook`. Keep the default payload and enable Booking Created, Booking Rescheduled, and Booking Canceled. The endpoint checks the signature over the raw body before fetching the authoritative booking. In-page confirmation can run without webhooks. Background changes need the webhook. See [Cal.com webhooks](https://cal.com/docs/developing/guides/automation/webhooks).
5. In a staging preview, check that the embed shows the account's actual availability and local time zone. With an authorized test appointment, verify the hidden reference, host and attendee emails, and rescheduling and cancellation. The automated suite uses mock provider responses and creates no appointments.

### Inquiries and email

- Verify a sender domain in Resend, then set `RESEND_API_KEY`, `BLUECHIP_INQUIRY_FROM` (the verified sender), and `BLUECHIP_INQUIRY_TO` (the Bluechip inbox). The server saves the inquiry before asking Resend to deliver its notification. If Resend is missing or fails, the visitor receives an honest saved receipt, and the record identifies the notification status for manual follow-up. Test delivery to the configured inbox before launch. See [Resend's send-email endpoint](https://resend.com/docs/api-reference/emails/send-email) and [idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys).
- The persisted record holds the project and contact details, timestamps, source, status, and linked Cal.com booking. The same record is reused for retries, for a switch from booking to inquiry, and for webhook updates. Keep abandoned booking drafts and completed inquiries subject to Bluechip's retention policy.
- A future Mergum adapter can use the stable record ID as its upsert key. This website has no verified Mergum API contract.
