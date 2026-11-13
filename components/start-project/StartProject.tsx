'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { budgets, categories, contactMethods, limits, timelines, type CategoryKey } from '@/lib/inquiry/fields';
import { calOrigin, calQueue } from './cal-embed';
import { applyService, clearDraft, draftFields, freshDraft, readDraft, saveDraft, servicesFor, type Draft, type DraftField } from './draft';

const steps = [
  ['Project type', 'Let’s make something happen.', 'Tell us a little about what you’re working on.'],
  ['Services', 'What do you need?', 'Choose all the services that fit your project.'],
  ['Project details', 'Tell us about your project.', 'A rough idea is enough to get started.'],
  ['Contact', 'How can we reach you?', 'Tell us who to get in touch with.'],
  ['Next steps', 'How would you like to get started?', 'Pick the option that works for you.'],
] as const;
const lastStep = steps.length - 1;
const calendarError = 'The calendar could not load. You can try again or send your project inquiry instead.';
const interrupted = 'The connection was interrupted. Please try again.';

type Booking = { status: 'booking_confirmed' | 'booking_pending' | 'booking_cancelled'; start: string; timeZone?: string };
type CalendarLink = { link: string; reference: string; contact: { name: string; email: string } };

type Screen =
  | { kind: 'step'; index: number }
  | { kind: 'done'; heading: string; description: string; appointment?: string }
  | { kind: 'receipt'; id: string }
  | { kind: 'calendar'; calendar: CalendarLink };

/** Errors whose message is written for visitors (from the API); anything else gets a generic message. */
class VisitorError extends Error {}

async function post<T>(action: string, payload: unknown): Promise<T> {
  const response = await fetch(`/api/project/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok) throw new VisitorError(result.error || interrupted);
  return result as T;
}

function formatAppointment(booking: Booking) {
  const format = (timeZone?: string) => new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone,
  }).format(new Date(booking.start));
  try { return format(booking.timeZone); } catch { return format(); }
}

type StartProjectApi = { open: (trigger: HTMLElement | null, url: URL) => void };
const StartProjectContext = createContext<StartProjectApi | null>(null);
export const useStartProject = () => useContext(StartProjectContext)!;

/**
 * Hosts the Start a Project dialog. Any same-origin link to `/start` opens it in place, so the
 * header, footer and page links stay plain anchors that still work without JavaScript.
 */
export function StartProjectProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const viewRef = useRef(0);
  const focusOnView = useRef(true);
  const bookingUid = useRef<string | undefined>(undefined);
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [view, setView] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifyVisible, setVerifyVisible] = useState(false);
  const busyRef = useRef(false);

  const currentDraft = () => (draftRef.current ??= readDraft());

  const setDraft = useCallback((next: Draft) => {
    draftRef.current = next;
    setDraftState(next);
    saveDraft(next);
  }, []);

  const resetDraft = useCallback(() => {
    const next = freshDraft();
    draftRef.current = next;
    setDraftState(next);
    bookingUid.current = undefined;
    clearDraft();
  }, []);

  const show = useCallback((next: Screen, { focus = true, error: initialError = '' } = {}) => {
    viewRef.current += 1;
    focusOnView.current = focus;
    setView(viewRef.current);
    setScreen(next);
    setStatus('');
    setError(initialError);
    setVerifyVisible(false);
  }, []);

  // Each new screen starts at the top and, unless opened silently, moves focus to its heading.
  useEffect(() => {
    if (!screen) return;
    if (scroller.current) scroller.current.scrollTop = 0;
    if (focusOnView.current) title.current?.focus({ preventScroll: true });
  }, [view, screen]);

  const isCurrent = (originalView: number) => () => Boolean(dialog.current?.open) && viewRef.current === originalView;

  async function run(message: string, operation: (current: () => boolean) => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const current = isCurrent(viewRef.current);
    const active = document.activeElement as HTMLElement | null;
    setStatus(message);
    setError('');
    try {
      await operation(current);
    } catch (cause) {
      if (current()) {
        setStatus('');
        setError(cause instanceof VisitorError && cause.message ? cause.message : interrupted);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
      if (current() && document.activeElement === document.body) active?.focus();
    }
  }

  function payload() {
    const value = currentDraft();
    const category = value.category as CategoryKey;
    return {
      token: value.token,
      category,
      services: value.selections[category],
      ...Object.fromEntries(draftFields.map(key => [key, value[key]])),
    };
  }

  const open = useCallback((link: HTMLElement | null, url: URL) => {
    const element = dialog.current;
    if (!element || element.open) return;
    trigger.current = link;
    const service = url.searchParams.get('service') || location.pathname.match(/^\/services\/([^/]+)/)?.[1];
    const next = applyService(currentDraft(), service);
    setDraft(next);
    if (next.receipt) show({ kind: 'receipt', id: next.receipt.id }, { focus: false });
    else show({ kind: 'step', index: 0 }, { focus: false });
    element.showModal();
    // The heading renders with the new screen; focus it once it exists.
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }, [setDraft, show]);

  // Open from any plain left click on a same-origin /start link.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !/^\/start\/?$/.test(url.pathname)) return;
      event.preventDefault();
      open(link, url);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  function onClose() {
    viewRef.current += 1;
    setScreen(null);
    setStatus('');
    setError('');
    trigger.current?.focus({ preventScroll: true });
  }

  // ----- Actions ----------------------------------------------------------------------

  function showBooking(booking: Booking) {
    if (booking.status === 'booking_confirmed') {
      show({
        kind: 'done',
        heading: 'You’re on the calendar!',
        description: 'We’re looking forward to hearing about your project. Check your email for your appointment details.',
        appointment: formatAppointment(booking),
      });
      resetDraft();
    } else if (booking.status === 'booking_pending') {
      show({ kind: 'done', heading: 'Your consultation was requested.', description: 'Cal.com is waiting for confirmation. Check your email for updates.' });
    } else {
      show({ kind: 'step', index: lastStep }, { error: 'This appointment was canceled. You can choose another time or send your inquiry.' });
    }
  }

  function submit() {
    return run('Sending your project inquiry…', async current => {
      const result = await post<{ id: string; notification: string }>('submit', payload());
      if (result.notification === 'sent') {
        resetDraft();
        if (current()) {
          show({
            kind: 'done',
            heading: 'Your project is in good hands.',
            description: 'Thanks for reaching out! We’ve received your project details and will be in touch soon.',
          });
        }
        return;
      }
      setDraft({ ...currentDraft(), receipt: { id: result.id } });
      if (current()) show({ kind: 'receipt', id: result.id });
    });
  }

  function calendar() {
    return run('Opening the consultation calendar…', async current => {
      const result = await post<{ booking?: Booking } & Partial<CalendarLink>>('calendar', payload());
      if (!current()) return;
      if (result.booking) showBooking(result.booking);
      else {
        bookingUid.current = undefined;
        show({ kind: 'calendar', calendar: result as CalendarLink });
      }
    });
  }

  function verifyBooking() {
    if (!bookingUid.current) return;
    const uid = bookingUid.current;
    return run('Checking your booking with Cal.com…', async current => {
      try {
        const booking = await post<Booking>('verify-booking', { token: currentDraft().token, uid });
        if (current()) showBooking(booking);
      } catch {
        if (!current()) return;
        setVerifyVisible(true);
        throw new VisitorError('We couldn’t verify the booking yet. Check your email for an update from Cal.com, or check again here.');
      }
    });
  }

  // ----- Forms ------------------------------------------------------------------------

  function update(field: DraftField, value: string) {
    setDraft({ ...currentDraft(), [field]: value });
  }

  function onInput(event: FormEvent<HTMLElement>) {
    const target = event.target as HTMLInputElement;
    target.setCustomValidity?.('');
    setError('');
  }

  function onSubmit(event: FormEvent<HTMLFormElement>, index: number) {
    event.preventDefault();
    const form = event.currentTarget;
    for (const field of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[required]:not([type="radio"]),textarea[required]')) {
      if (!field.value.trim()) {
        field.setCustomValidity('Please fill in this field.');
        field.reportValidity();
        return;
      }
    }
    const value = currentDraft();
    if (index === 1 && !value.selections[value.category as CategoryKey]?.length) {
      setError('Choose at least one service.');
      form.querySelector('input')?.focus();
      return;
    }
    show({ kind: 'step', index: index + 1 });
  }

  // While a request runs, buttons announce themselves as disabled and ignore clicks
  // (requests are also guarded inside `run`).
  const busyProps = busy ? { 'aria-disabled': true as const } : {};
  const unlessBusy = (action: () => unknown) => () => { if (!busy) action(); };
  const backButton = (index: number) => (
    <button type="button" className="project-back" {...busyProps} onClick={unlessBusy(() => show({ kind: 'step', index: index - 1 }))}>Back</button>
  );
  const sendButton = <button type="button" className="project-primary" {...busyProps} onClick={() => submit()}>Send Project Inquiry</button>;
  const doneButton = <button type="button" className="project-primary" onClick={() => dialog.current?.close()}>Done</button>;

  function selectField(name: DraftField, label: string, options: readonly string[]) {
    return (
      <label>
        {label} <span className="project-optional">(optional)</span>
        <select name={name} value={draft?.[name] ?? ''} onChange={event => update(name, event.target.value)}>
          <option value="">Select an option</option>
          {options.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
    );
  }

  function stepBody(index: number, value: Draft) {
    const category = value.category as CategoryKey;
    if (index === 0) {
      return (
        <fieldset>
          <legend className="project-sr">Project category</legend>
          <div className="project-categories">
            {(Object.keys(categories) as CategoryKey[]).map(key => (
              <label key={key} className="project-option">
                <input
                  type="radio"
                  name="category"
                  value={key}
                  required
                  checked={value.category === key}
                  onChange={() => setDraft({ ...currentDraft(), category: key })}
                />
                <span className="project-option-copy"><strong>{categories[key].label}</strong><span>{categories[key].description}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    if (index === 1) {
      const selected = value.selections[category] ?? [];
      return (
        <fieldset aria-describedby="project-service-hint">
          <legend className="project-sr">Requested services</legend>
          <span id="project-service-hint" className="project-sr">Select at least one service.</span>
          <div className="project-services">
            {servicesFor(category).map(service => (
              <label key={service} className="project-option">
                <input
                  type="checkbox"
                  name="services"
                  value={service}
                  checked={selected.includes(service)}
                  onChange={event => {
                    const current = currentDraft();
                    const chosen = current.selections[category] ?? [];
                    const nextChosen = event.target.checked ? [...chosen, service] : chosen.filter(item => item !== service);
                    // Keep the category's own order, as the original form did.
                    const ordered = servicesFor(category).filter(item => nextChosen.includes(item));
                    setDraft({ ...current, selections: { ...current.selections, [category]: ordered } });
                  }}
                />
                <span className="project-option-copy"><strong>{service}</strong></span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    if (index === 2) {
      return (
        <>
          <label>
            Business Name
            <input name="business" required autoComplete="organization" maxLength={limits.business} value={value.business ?? ''} onChange={event => update('business', event.target.value)} />
          </label>
          <label>
            Project Description
            <textarea
              name="description"
              required
              maxLength={limits.description}
              rows={4}
              placeholder="Tell us a little about your business and what you’re looking to accomplish."
              value={value.description ?? ''}
              onChange={event => update('description', event.target.value)}
            />
          </label>
          <div className="project-fields">
            {selectField('timeline', 'Ideal Timeline', timelines)}
            {selectField('budget', 'Estimated Budget', budgets)}
          </div>
        </>
      );
    }
    return (
      <div className="project-fields">
        <label>
          Full Name
          <input name="name" required autoComplete="name" maxLength={limits.name} value={value.name ?? ''} onChange={event => update('name', event.target.value)} />
        </label>
        <label>
          Email Address
          <input name="email" type="email" required autoComplete="email" maxLength={limits.email} value={value.email ?? ''} onChange={event => update('email', event.target.value)} />
        </label>
        <label>
          Phone Number <span className="project-optional">(optional)</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={limits.phone} value={value.phone ?? ''} onChange={event => update('phone', event.target.value)} />
        </label>
        {selectField('contactMethod', 'Preferred Contact Method', contactMethods)}
      </div>
    );
  }

  function content(): { heading: string; intro: string; body: ReactNode } | null {
    if (!screen || !draft) return null;
    if (screen.kind === 'step') {
      const [, heading, intro] = steps[screen.index];
      if (screen.index === lastStep) {
        return {
          heading,
          intro,
          body: (
            <>
              <div className="project-paths">
                <section>
                  <h3>Book a Free Consultation</h3>
                  <p>Schedule a quick 20-minute conversation to discuss your project and explore the next steps.</p>
                  <button type="button" className="project-primary" {...busyProps} onClick={() => calendar()}>Choose a Time <span aria-hidden="true">›</span></button>
                </section>
                <section>
                  <h3>Submit Your Project</h3>
                  <p>Send us the details and we’ll review your project before getting back to you.</p>
                  {sendButton}
                </section>
              </div>
              <div className="project-actions">{backButton(screen.index)}</div>
            </>
          ),
        };
      }
      return {
        heading,
        intro,
        body: (
          <form onSubmit={event => onSubmit(event, screen.index)} onInput={onInput}>
            {stepBody(screen.index, draft)}
            <div className="project-actions">
              {screen.index > 0 && backButton(screen.index)}
              <button type="submit" className="project-primary">Continue <span aria-hidden="true">›</span></button>
            </div>
          </form>
        ),
      };
    }
    if (screen.kind === 'done') {
      return {
        heading: screen.heading,
        intro: screen.description,
        body: (
          <>
            <div className="project-confirmation">{screen.appointment && <p className="project-appointment">{screen.appointment}</p>}</div>
            <div className="project-actions">{doneButton}</div>
          </>
        ),
      };
    }
    if (screen.kind === 'receipt') {
      return {
        heading: 'Your project is in good hands.',
        intro: 'Thanks for reaching out! We’ve received your project details.',
        body: (
          <>
            <div className="project-confirmation">
              <p>
                We couldn’t send the automatic notification. If you’d like to follow up, email{' '}
                <a href="mailto:info@bluechipbranding.net">info@bluechipbranding.net</a> and mention your reference.
              </p>
              <p className="project-reference">Reference: {screen.id}</p>
              <button type="button" className="project-back" {...busyProps} onClick={() => submit()}>Retry notification</button>
              <button type="button" className="project-back" {...busyProps} onClick={unlessBusy(() => { resetDraft(); show({ kind: 'step', index: 0 }); })}>
                Start another project
              </button>
            </div>
            <div className="project-actions">{doneButton}</div>
          </>
        ),
      };
    }
    return {
      heading: 'Choose a time.',
      intro: 'Free Project Consultation · 20 minutes',
      body: (
        <CalendarEmbed
          key={view}
          calendar={screen.calendar}
          isCurrent={() => isCurrent(view)()}
          setStatus={setStatus}
          setError={setError}
          onBooked={uid => {
            if (bookingUid.current) return;
            bookingUid.current = uid;
            verifyBooking();
          }}
          actions={retryVisible => (
            <div className="project-actions project-calendar-actions">
              <button type="button" className="project-back" {...busyProps} onClick={unlessBusy(() => show({ kind: 'step', index: lastStep }))}>Back to options</button>
              <button type="button" className="project-back" hidden={!retryVisible} {...busyProps} onClick={() => calendar()}>Retry calendar</button>
              <button type="button" className="project-back" hidden={!verifyVisible} {...busyProps} onClick={() => verifyBooking()}>Check booking again</button>
              {sendButton}
            </div>
          )}
        />
      ),
    };
  }

  // `content()` only builds JSX; the refs it mentions are read inside event handlers, not while rendering.
  // eslint-disable-next-line react-hooks/refs
  const current = content();
  const stepIndex = screen?.kind === 'step' ? screen.index : null;

  return (
    <StartProjectContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialog}
        id="start-project"
        aria-labelledby="project-title"
        className={screen?.kind === 'calendar' ? 'project-booking' : undefined}
        onClose={onClose}
      >
        <div className="project-shell">
          <header className="project-header">
            <span>Start a project</span>
            <button className="project-close" type="button" aria-label="Close project inquiry" onClick={() => dialog.current?.close()}>
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="project-scroll" ref={scroller}>
            <div className="project-progress" hidden={stepIndex === null}>
              <p>{stepIndex !== null && `Step ${stepIndex + 1} of ${steps.length} · ${steps[stepIndex][0]}`}</p>
              <ol aria-hidden="true">
                {steps.map((_, i) => <li key={i} className={stepIndex !== null && i <= stepIndex ? 'project-progress-active' : undefined} />)}
              </ol>
            </div>
            <section className="project-step" aria-labelledby="project-title">
              <h2 id="project-title" tabIndex={-1} ref={title}>{current?.heading}</h2>
              <p className="project-intro">{current?.intro}</p>
              <div className="project-content">{current?.body}</div>
              <p className="project-message" role="status">{status}</p>
              <p className="project-error" role="alert">{error}</p>
            </section>
          </div>
        </div>
      </dialog>
    </StartProjectContext.Provider>
  );
}

let calendarCount = 0;

type CalendarProps = {
  calendar: CalendarLink;
  isCurrent: () => boolean;
  setStatus: (message: string) => void;
  setError: (message: string) => void;
  onBooked: (uid: string) => void;
  actions: (retryVisible: boolean) => ReactNode;
};

/** Mounts Cal.com's inline booking calendar for one inquiry. */
function CalendarEmbed({ calendar, isCurrent, setStatus, setError, onBooked, actions }: CalendarProps) {
  const mount = useRef<HTMLDivElement>(null);
  const [retryVisible, setRetryVisible] = useState(false);
  // Cal.com callbacks outlive renders; keep the latest handlers without remounting the embed.
  const latest = useRef({ isCurrent, setStatus, setError, onBooked });
  useEffect(() => { latest.current = { isCurrent, setStatus, setError, onBooked }; });

  useEffect(() => {
    const element = mount.current!;
    const handlers = () => latest.current;
    handlers().setStatus('Loading available appointments…');
    const fail = () => {
      if (!handlers().isCurrent()) return;
      handlers().setStatus('');
      handlers().setError(calendarError);
      setRetryVisible(true);
    };
    const timeout = window.setTimeout(fail, 14000);
    const onLoadError = () => { clearTimeout(timeout); fail(); };
    element.addEventListener('cal-load-error', onLoadError, { once: true });

    const cal = calQueue();
    const namespace = `bluechip-project-${++calendarCount}`;
    cal('init', namespace, { origin: calOrigin });
    const embed = cal.ns[namespace];
    embed('on', { action: 'linkReady', callback: () => {
      clearTimeout(timeout);
      if (!handlers().isCurrent()) return;
      handlers().setStatus('');
      handlers().setError('');
      setRetryVisible(false);
    } });
    embed('on', { action: 'linkFailed', callback: () => { clearTimeout(timeout); fail(); } });
    embed('on', { action: 'bookingSuccessfulV2', callback: (event: { detail?: { data?: { uid?: string } } }) => {
      if (!handlers().isCurrent()) return;
      const uid = event.detail?.data?.uid;
      if (!uid) {
        handlers().setError('We couldn’t verify the booking here. Check your email for an update from Cal.com.');
        return;
      }
      handlers().onBooked(uid);
    } });
    embed('inline', {
      elementOrSelector: element,
      calLink: calendar.link,
      config: { layout: 'month_view', theme: 'light', name: calendar.contact.name, email: calendar.contact.email, bluechip_reference: calendar.reference },
    });
    return () => {
      clearTimeout(timeout);
      element.removeEventListener('cal-load-error', onLoadError);
      element.replaceChildren();
    };
  }, [calendar]);

  return (
    <>
      <div className="project-calendar" aria-label="Cal.com booking calendar" ref={mount} />
      {actions(retryVisible)}
    </>
  );
}
