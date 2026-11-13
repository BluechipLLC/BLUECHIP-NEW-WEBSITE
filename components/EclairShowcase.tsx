'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const slides = [
  'Iced latte campaign with Éclair Bakery bags and cups',
  'Éclair Bakery logo on a burgundy pattern',
  'Brand guidelines with logo variations, colors, and typefaces',
  'Fresh éclairs campaign with branded cups and pastry box',
  'Éclair Bakery storefront sign and iced latte cup',
  'Buy one, get one promotion with napkins and an iced latte',
];

type RevealMode = 'hover' | 'activated' | null;

/**
 * A testimonial card over the Éclair Bakery cover. Moving the mouse onto the artwork, or
 * activating it, reveals a slide gallery; Escape or leaving the card hides it again.
 */
export function EclairShowcase() {
  const showcase = useRef<HTMLElement>(null);
  const cover = useRef<HTMLButtonElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const modeRef = useRef<RevealMode>(null);
  const target = useRef(0);
  const currentRef = useRef(0);
  const hoverDismissed = useRef(false);
  const hoverExitTimer = useRef<number | undefined>(undefined);
  const refocusCover = useRef(false);
  const [mode, setMode] = useState<RevealMode>(null);
  // Only the cover slide loads with the page; the rest arrive on first reveal.
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(0);

  // Focus moves after render: the cover stays inert until the preview is shown again.
  useEffect(() => {
    if (mode === 'activated') track.current?.focus({ preventScroll: true });
    if (!mode && refocusCover.current) {
      refocusCover.current = false;
      cover.current?.focus({ preventScroll: true });
    }
  }, [mode]);

  useEffect(() => () => clearTimeout(hoverExitTimer.current), []);

  // Arrow-key steps continue from wherever a swipe or scroll settled.
  useEffect(() => {
    const slider = track.current!;
    const settle = () => { target.current = currentRef.current; };
    slider.addEventListener('scrollend', settle);
    return () => slider.removeEventListener('scrollend', settle);
  }, []);

  function updateCurrent(index: number) {
    currentRef.current = index;
    setCurrent(index);
  }

  function reveal(next: Exclude<RevealMode, null>) {
    if (modeRef.current) return;
    setLoaded(true);
    modeRef.current = next;
    setMode(next);
  }

  function conceal() {
    clearTimeout(hoverExitTimer.current);
    if (!modeRef.current) return;
    refocusCover.current = Boolean(gallery.current?.contains(document.activeElement));
    modeRef.current = null;
    setMode(null);
  }

  function stepSlide(direction: number) {
    const slider = track.current!;
    target.current = Math.max(0, Math.min(slides.length - 1, target.current + direction));
    slider.scrollTo({ left: slider.clientWidth * target.current, behavior: 'auto' });
  }

  const isMouse = (event: PointerEvent) => event.pointerType === 'mouse';

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      hoverDismissed.current = Boolean(showcase.current?.matches(':hover'));
      conceal();
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepSlide(event.key === 'ArrowLeft' ? -1 : 1);
    }
  }

  return (
    <section
      ref={showcase}
      id="eclair-project"
      className="eclair-showcase"
      aria-label="Éclair Bakery project"
      data-revealed={mode ?? undefined}
      onPointerEnter={event => { if (isMouse(event)) clearTimeout(hoverExitTimer.current); }}
      onPointerLeave={event => {
        if (!isMouse(event)) return;
        hoverDismissed.current = false;
        if (modeRef.current === 'hover') hoverExitTimer.current = window.setTimeout(conceal, 90);
      }}
    >
      <div className="eclair-preview" inert={Boolean(mode)}>
        <button
          ref={cover}
          className="eclair-cover"
          type="button"
          aria-label="View Éclair Bakery project"
          aria-controls="eclair-gallery"
          aria-expanded={Boolean(mode)}
          // Only reveal when the mouse moves onto the artwork. Scrolling the card under a
          // stationary cursor would otherwise trigger repeated layout changes.
          onPointerMove={event => { if (isMouse(event) && !hoverDismissed.current) reveal('hover'); }}
          onClick={() => reveal('activated')}
        />
        <figure className="home-testimonial">
          <span className="home-testimonial-mark" aria-hidden="true">“</span>
          <blockquote>
            <p>I just had to let you know that everyone LOVED your work!</p>
            <p>
              Honestly, no one expected you to come up with something like this, and you did such a fantastic job! You
              really helped us get past that stage where we felt stuck and didn’t know how to bring everything together.
            </p>
            <p>Thank you so much for all the work you put into this. We really appreciate it!</p>
          </blockquote>
          <figcaption>Éclair Bakery</figcaption>
        </figure>
      </div>
      <div id="eclair-gallery" ref={gallery} className="eclair-gallery" inert={!mode} onKeyDown={onKeyDown}>
        <div
          ref={track}
          className="eclair-slides"
          role="region"
          aria-label="Éclair Bakery presentation slides"
          tabIndex={0}
          onClick={() => { if (modeRef.current === 'activated') conceal(); }}
          onScroll={event => {
            const slider = event.currentTarget;
            if (!slider.clientWidth) return;
            const index = Math.round(slider.scrollLeft / slider.clientWidth);
            if (index !== currentRef.current) updateCurrent(index);
          }}
        >
          {(loaded ? slides : slides.slice(0, 1)).map((alt, index) => (
            <div className="eclair-slide" key={index}>
              <img src={`/assets/eclair/slide-${index + 1}.webp`} width={1680} height={1088} alt={alt} loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
        <div className="eclair-gallery-controls">
          <button type="button" data-slide-step="-1" aria-label="Previous slide" disabled={current === 0} onClick={() => stepSlide(-1)}>←</button>
          <span className="eclair-slide-status" aria-live="polite">{mode ? `${current + 1} / ${slides.length}` : ''}</span>
          <button type="button" data-slide-step="1" aria-label="Next slide" disabled={current === slides.length - 1} onClick={() => stepSlide(1)}>→</button>
        </div>
      </div>
    </section>
  );
}
