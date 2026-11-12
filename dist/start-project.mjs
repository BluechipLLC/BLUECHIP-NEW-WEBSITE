import { categories, timelines, budgets, contactMethods, limits } from './inquiry-fields.mjs';

const steps = [
  ['Project type', 'Let’s make something happen.', 'Tell us a little about what you’re working on.'],
  ['Services', 'What do you need?', 'Choose all the services that fit your project.'],
  ['Project details', 'Tell us about your project.', 'A rough idea is enough to get started.'],
  ['Contact', 'How can we reach you?', 'Tell us who to get in touch with.'],
  ['Next steps', 'How would you like to get started?', 'Pick the option that works for you.'],
];
const presets = {
  branding: { launch: ['Brand Identity'], refresh: ['Rebranding'], production: ['Logo & Graphic Design'] },
  websites: { launch: ['Website Design & Development'], refresh: ['Website Redesign'], production: ['Website Development'] },
  signage: { launch: ['Storefront Signage'], refresh: ['Signage & Storefront Graphics'], production: ['Signs & Banners'] },
  printing: { launch: ['Printed Materials'], refresh: ['Marketing Materials'], production: ['Business Cards & Print'] },
  'vehicle-wraps': { launch: ['Vehicle Graphics'], production: ['Vehicle Wraps & Graphics'] },
};
const fields = ['business', 'description', 'timeline', 'budget', 'name', 'email', 'phone', 'contactMethod'];
const draftKey = 'bluechip-project-draft';
const calOrigin = 'https://app.cal.com';
const calendarError = 'The calendar could not load. You can try again or send your project inquiry instead.';

function readDraft() {
  try {
    const current = JSON.parse(sessionStorage.getItem(draftKey));
    if (current?.token && current.selections) return current;
    const old = JSON.parse(localStorage.getItem('bluechip-inquiry'));
    if (old) {
      const category = old.services?.includes('launch') ? 'launch' : old.services?.includes('refresh') ? 'refresh' : 'production';
      return {
        token: crypto.randomUUID(), category, business: old.company, description: old.message,
        name: old.name, email: old.email, phone: old.phone,
        timeline: timelines.includes(old.timeline) ? old.timeline : '',
        budget: budgets.includes(old.budget) ? old.budget : '',
        selections: { [category]: old.services?.flatMap(service => presets[service]?.[category] ?? []) ?? [] },
      };
    }
  } catch {}
  return freshDraft();
}

function freshDraft() {
  return { token: crypto.randomUUID(), category: '', selections: {} };
}

const dialog = document.createElement('dialog');
dialog.id = 'start-project';
dialog.setAttribute('aria-labelledby', 'project-title');
dialog.innerHTML = `
  <div class="project-shell">
    <header class="project-header">
      <span>Start a project</span>
      <button class="project-close" type="button" aria-label="Close project inquiry"><span aria-hidden="true">×</span></button>
    </header>
    <div class="project-scroll">
      <div class="project-progress"><p></p><ol aria-hidden="true">${steps.map(() => '<li></li>').join('')}</ol></div>
      <section class="project-step" aria-labelledby="project-title">
        <h2 id="project-title" tabindex="-1"></h2>
        <p class="project-intro"></p>
        <div class="project-content"></div>
        <p class="project-message" role="status"></p>
        <p class="project-error" role="alert"></p>
      </section>
    </div>
  </div>`;
document.body.append(dialog);
const title = dialog.querySelector('#project-title');
const intro = dialog.querySelector('.project-intro');
const progress = dialog.querySelector('.project-progress');
const content = dialog.querySelector('.project-content');
const scroller = dialog.querySelector('.project-scroll');
const status = dialog.querySelector('.project-message');
const error = dialog.querySelector('.project-error');
const closeButton = dialog.querySelector('.project-close');
let draft = readDraft();
let step = 0;
let trigger;
let view = 0;
let busy = false;
let bookingUid;
let calendarCount = 0;

function save() {
  try { sessionStorage.setItem(draftKey, JSON.stringify(draft)); } catch {}
}

function reset() {
  draft = freshDraft();
  bookingUid = undefined;
  try {
    sessionStorage.removeItem(draftKey);
    localStorage.removeItem('bluechip-inquiry');
  } catch {}
}

function render(heading, description, html, focus = true) {
  view++;
  title.textContent = heading;
  intro.textContent = description;
  content.innerHTML = html;
  status.textContent = '';
  error.textContent = '';
  scroller.scrollTop = 0;
  if (focus) title.focus({ preventScroll: true });
}

function option(name, value, label, description, checked, type) {
  return `<label class="project-option"><input type="${type}" name="${name}" value="${value}" ${checked ? 'checked' : ''}${type === 'radio' ? ' required' : ''}>
    <span class="project-option-copy"><strong>${label}</strong>${description ? `<span>${description}</span>` : ''}</span></label>`;
}

function select(name, label, options) {
  return `<label>${label} <span class="project-optional">(optional)</span><select name="${name}">
    <option value="">Select an option</option>${options.map(item => `<option>${item}</option>`).join('')}</select></label>`;
}

const back = '<button type="button" data-project="back" class="project-back">Back</button>';
const next = '<button type="submit" class="project-primary">Continue <span aria-hidden="true">›</span></button>';
const close = '<button type="button" data-project="close" class="project-primary">Done</button>';
const send = '<button type="button" data-project="submit" class="project-primary">Send Project Inquiry</button>';

function showStep(index, focus = true) {
  step = index;
  dialog.classList.remove('project-booking');
  progress.hidden = false;
  progress.querySelector('p').textContent = `Step ${index + 1} of ${steps.length} · ${steps[index][0]}`;
  [...progress.querySelectorAll('li')].forEach((item, i) => item.classList.toggle('project-progress-active', i <= index));
  const [, heading, description] = steps[index];
  if (index === 4) {
    render(heading, description, `<div class="project-paths">
      <section><h3>Book a Free Consultation</h3><p>Schedule a quick 20-minute conversation to discuss your project and explore the next steps.</p>
      <button type="button" data-project="calendar" class="project-primary">Choose a Time <span aria-hidden="true">›</span></button></section>
      <section><h3>Submit Your Project</h3><p>Send us the details and we’ll review your project before getting back to you.</p>${send}</section>
      </div><div class="project-actions">${back}</div>`, focus);
    return;
  }
  const markup = [
    () => `<fieldset><legend class="project-sr">Project category</legend><div class="project-categories">${Object.entries(categories).map(([key, item]) => option('category', key, item.label, item.description, draft.category === key, 'radio')).join('')}</div></fieldset>`,
    () => `<fieldset aria-describedby="project-service-hint"><legend class="project-sr">Requested services</legend><span id="project-service-hint" class="project-sr">Select at least one service.</span>
      <div class="project-services">${categories[draft.category].services.map(service => option('services', service.replaceAll('&', '&amp;'), service, '', draft.selections[draft.category]?.includes(service), 'checkbox')).join('')}</div></fieldset>`,
    () => `<label>Business Name<input name="business" required autocomplete="organization" maxlength="${limits.business}"></label>
      <label>Project Description<textarea name="description" required maxlength="${limits.description}" rows="4" placeholder="Tell us a little about your business and what you’re looking to accomplish."></textarea></label>
      <div class="project-fields">${select('timeline', 'Ideal Timeline', timelines)}${select('budget', 'Estimated Budget', budgets)}</div>`,
    () => `<div class="project-fields"><label>Full Name<input name="name" required autocomplete="name" maxlength="${limits.name}"></label>
      <label>Email Address<input name="email" type="email" required autocomplete="email" maxlength="${limits.email}"></label>
      <label>Phone Number <span class="project-optional">(optional)</span><input name="phone" type="tel" autocomplete="tel" maxlength="${limits.phone}"></label>
      ${select('contactMethod', 'Preferred Contact Method', contactMethods)}</div>`,
  ][index]();
  render(heading, description, `<form>${markup}<div class="project-actions">${index ? back : ''}${next}</div></form>`, focus);
  const form = content.querySelector('form');
  for (const key of fields) if (form.elements[key]) form.elements[key].value = draft[key] ?? '';
}

function capture(form) {
  const data = new FormData(form);
  if (step === 0 && data.get('category')) draft.category = data.get('category');
  if (step === 1) draft.selections[draft.category] = data.getAll('services');
  for (const key of fields) if (data.has(key)) draft[key] = data.get(key);
  save();
}

function openProject(link, url) {
  if (dialog.open) return;
  trigger = link;
  const service = url.searchParams.get('service') || location.pathname.match(/^\/services\/([^/]+)/)?.[1];
  if (service === 'launch' || service === 'refresh') draft.category = service;
  if (Object.hasOwn(presets, service)) {
    draft.category ||= 'production';
    for (const [category, choices] of Object.entries(presets[service])) {
      draft.selections[category] = [...new Set([...(draft.selections[category] ?? []), ...choices])];
    }
  }
  save();
  if (draft.receipt) showReceipt(draft.receipt, false);
  else showStep(0, false);
  dialog.showModal();
  title.focus({ preventScroll: true });
}

async function post(action, payload) {
  const response = await fetch(`/api/project/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

function projectPayload() {
  return {
    token: draft.token, category: draft.category, services: draft.selections[draft.category],
    ...Object.fromEntries(fields.map(key => [key, draft[key]])),
  };
}

async function run(message, operation) {
  if (busy) return;
  busy = true;
  const originalView = view;
  const active = document.activeElement;
  status.textContent = message;
  error.textContent = '';
  const buttons = [...content.querySelectorAll('button')];
  buttons.forEach(button => button.setAttribute('aria-disabled', 'true'));
  try {
    await operation(() => dialog.open && view === originalView);
  } catch (cause) {
    if (dialog.open && view === originalView) {
      status.textContent = '';
      error.textContent = cause instanceof Error && cause.name === 'Error' && cause.message ? cause.message : 'The connection was interrupted. Please try again.';
    }
  } finally {
    busy = false;
    buttons.forEach(button => button.removeAttribute('aria-disabled'));
    if (dialog.open && view === originalView && document.activeElement === document.body) active?.focus();
  }
}

function confirmation(heading, description, extra = '', focus = true) {
  dialog.classList.remove('project-booking');
  progress.hidden = true;
  render(heading, description, `<div class="project-confirmation">${extra}</div><div class="project-actions">${close}</div>`, focus);
}

function showReceipt(receipt, focus = true) {
  confirmation('Your project is in good hands.', 'Thanks for reaching out! We’ve received your project details.',
    `<p>We couldn’t send the automatic notification. If you’d like to follow up, email <a href="mailto:info@bluechipbranding.net">info@bluechipbranding.net</a> and mention your reference.</p>
    <p class="project-reference"></p><button type="button" class="project-back" data-project="submit">Retry notification</button>
    <button type="button" class="project-back" data-project="new">Start another project</button>`, focus);
  content.querySelector('.project-reference').textContent = `Reference: ${receipt.id}`;
}

async function submit() {
  await run('Sending your project inquiry…', async current => {
    const result = await post('submit', projectPayload());
    if (result.notification === 'sent') {
      reset();
      if (current()) confirmation('Your project is in good hands.', 'Thanks for reaching out! We’ve received your project details and will be in touch soon.');
      return;
    }
    draft.receipt = { id: result.id };
    save();
    if (current()) showReceipt(draft.receipt);
  });
}

function showBooking(booking) {
  if (booking.status === 'booking_confirmed') {
    confirmation('You’re on the calendar!', 'We’re looking forward to hearing about your project. Check your email for your appointment details.', '<p class="project-appointment"></p>');
    const format = timeZone => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone }).format(new Date(booking.start));
    const date = content.querySelector('.project-appointment');
    try { date.textContent = format(booking.timeZone); } catch { date.textContent = format(); }
    reset();
  } else if (booking.status === 'booking_pending') {
    confirmation('Your consultation was requested.', 'Cal.com is waiting for confirmation. Check your email for updates.');
  } else {
    showStep(4);
    error.textContent = 'This appointment was canceled. You can choose another time or send your inquiry.';
  }
}

function calQueue() {
  if (!window.Cal) {
    const cal = (...args) => {
      const [command, namespace] = args;
      if (command === 'init' && typeof namespace === 'string') {
        if (!cal.ns[namespace]) {
          const queue = (...instruction) => queue.q.push(instruction);
          queue.q = [];
          cal.ns[namespace] = queue;
        }
        cal.ns[namespace](...args);
        cal.q.push(['initNamespace', namespace]);
        return;
      }
      cal.q.push(args);
    };
    cal.q = [];
    cal.ns = {};
    cal.loaded = true;
    window.Cal = cal;
    const script = document.createElement('script');
    script.src = `${calOrigin}/embed/embed.js`;
    script.async = true;
    script.addEventListener('error', () => {
      if (window.Cal === cal) delete window.Cal;
      script.remove();
      dialog.querySelector('.project-calendar')?.dispatchEvent(new Event('cal-load-error'));
    });
    document.head.append(script);
  }
  return window.Cal;
}

async function verifyBooking() {
  if (!bookingUid) return;
  await run('Checking your booking with Cal.com…', async current => {
    try {
      const booking = await post('verify-booking', { token: draft.token, uid: bookingUid });
      if (current()) showBooking(booking);
    } catch {
      if (!current()) return;
      content.querySelector('[data-project="verify"]').hidden = false;
      throw new Error('We couldn’t verify the booking yet. Check your email for an update from Cal.com, or check again here.');
    }
  });
}

function mountCalendar({ link, reference, contact }) {
  dialog.classList.add('project-booking');
  progress.hidden = true;
  render('Choose a time.', 'Free Project Consultation · 20 minutes', `<div class="project-calendar" aria-label="Cal.com booking calendar"></div>
    <div class="project-actions project-calendar-actions">
      <button type="button" class="project-back" data-project="choices">Back to options</button>
      <button type="button" class="project-back" data-project="calendar" hidden>Retry calendar</button>
      <button type="button" class="project-back" data-project="verify" hidden>Check booking again</button>
      ${send}
    </div>`);
  const mount = content.querySelector('.project-calendar');
  const currentView = view;
  const current = () => dialog.open && view === currentView;
  status.textContent = 'Loading available appointments…';
  const fail = () => {
    if (!current()) return;
    status.textContent = '';
    error.textContent = calendarError;
    content.querySelector('[data-project="calendar"]').hidden = false;
  };
  const timeout = setTimeout(fail, 14000);
  mount.addEventListener('cal-load-error', () => { clearTimeout(timeout); fail(); }, { once: true });
  const cal = calQueue();
  const namespace = `bluechip-project-${++calendarCount}`;
  cal('init', namespace, { origin: calOrigin });
  const embed = cal.ns[namespace];
  embed('on', { action: 'linkReady', callback: () => {
    clearTimeout(timeout);
    if (!current()) return;
    status.textContent = '';
    error.textContent = '';
    content.querySelector('[data-project="calendar"]').hidden = true;
  } });
  embed('on', { action: 'linkFailed', callback: () => { clearTimeout(timeout); fail(); } });
  embed('on', { action: 'bookingSuccessfulV2', callback: event => {
    if (!current() || bookingUid) return;
    const uid = event.detail?.data?.uid;
    if (!uid) {
      error.textContent = 'We couldn’t verify the booking here. Check your email for an update from Cal.com.';
      return;
    }
    bookingUid = uid;
    verifyBooking();
  } });
  embed('inline', {
    elementOrSelector: mount, calLink: link,
    config: { layout: 'month_view', theme: 'light', name: contact.name, email: contact.email, bluechip_reference: reference },
  });
}

async function calendar() {
  await run('Opening the consultation calendar…', async current => {
    const result = await post('calendar', projectPayload());
    if (!current()) return;
    if (result.booking) showBooking(result.booking);
    else {
      bookingUid = undefined;
      mountCalendar(result);
    }
  });
}

closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  view++;
  content.replaceChildren();
  trigger?.focus({ preventScroll: true });
});
dialog.addEventListener('input', event => {
  if (!event.target.form) return;
  event.target.setCustomValidity?.('');
  error.textContent = '';
  capture(event.target.form);
});
dialog.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target;
  for (const field of form.querySelectorAll('input[required]:not([type="radio"]),textarea[required]')) {
    if (!field.value.trim()) {
      field.setCustomValidity('Please fill in this field.');
      field.reportValidity();
      return;
    }
  }
  capture(form);
  if (step === 1 && !draft.selections[draft.category]?.length) {
    error.textContent = 'Choose at least one service.';
    form.querySelector('input').focus();
    return;
  }
  showStep(step + 1);
});
dialog.addEventListener('click', event => {
  const action = event.target.closest('[data-project]')?.dataset.project;
  if (busy && action !== 'close') return;
  if (action === 'back') showStep(step - 1);
  if (action === 'choices') showStep(4);
  if (action === 'close') dialog.close();
  if (action === 'new') { reset(); showStep(0); }
  if (action === 'submit') submit();
  if (action === 'calendar') calendar();
  if (action === 'verify') verifyBooking();
});

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || !/^\/start\/?$/.test(url.pathname)) return;
  event.preventDefault();
  openProject(link, url);
});
if (/^\/start\/?$/.test(location.pathname)) openProject(document.querySelector('[data-project-entry]'), new URL(location.href));
