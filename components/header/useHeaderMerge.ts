'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Tracks whether the header has collapsed into its floating pill (`expanded`) or stepped aside
 * for a media gallery (`mediaCompact`), and draws the liquid bridge between the pill and the
 * "Start a project" capsule while they merge.
 */
export function useHeaderMerge(header: RefObject<HTMLElement | null>, pathname: string) {
  const [state, setState] = useState({ expanded: false, mediaCompact: false });
  const current = useRef(state);
  const initialized = useRef(false);

  useEffect(() => {
    const frame = header.current!;
    const surface = frame.querySelector<HTMLElement>('.header-surface')!;
    const action = frame.querySelector<HTMLElement>('.nav-cta')!;
    const bridge = frame.querySelector<SVGPathElement>('.header-merge path')!;
    const bridgeColor = frame.querySelector<SVGLinearGradientElement>('#header-merge-color')!;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let mergeFrame = 0;
    let scrollFrame = 0;

    function animateHeaderMerge(wasJoined: boolean) {
      cancelAnimationFrame(mergeFrame);
      const end = performance.now() + 360;
      if (!action.style.getPropertyValue('--capsule-opacity')) {
        action.style.setProperty('--capsule-opacity', wasJoined ? '0' : '1');
        action.style.setProperty('--merge-label', wasJoined ? '#00529c' : 'white');
      }

      function draw(now: number) {
        if (now >= end || reduceMotion.matches) {
          bridge.removeAttribute('d');
          action.style.removeProperty('--capsule-opacity');
          action.style.removeProperty('--merge-label');
          return;
        }
        const bounds = frame.getBoundingClientRect();
        const pill = surface.getBoundingClientRect();
        const capsule = action.getBoundingClientRect();
        // On mobile the surface reaches the capsule from the menu side.
        const mobile = bounds.width < 1024;
        const direction = mobile ? -1 : 1;
        const pillEdge = mobile ? pill.left : pill.right;
        const capsuleEdge = mobile ? capsule.right : capsule.left;
        const gap = (capsuleEdge - pillEdge) * direction;
        const covered = Math.max(0, Math.min(1, -gap / (capsule.width * 0.8)));
        action.style.setProperty('--capsule-opacity', String(1 - covered));
        action.style.setProperty('--merge-label', covered < 0.48 ? 'white' : '#00529c');

        const reach = 96;
        const radius = Math.min(pill.height, capsule.height) / 2;
        if (gap < reach && gap > -radius && radius > 0) {
          const strength = Math.min(1, (reach - gap) / reach);
          const a = pillEdge - bounds.left - direction * radius * 0.65;
          const b = capsuleEdge - bounds.left + direction * radius * 0.65;
          const ay = pill.top - bounds.top + pill.height / 2;
          const by = capsule.top - bounds.top + capsule.height / 2;
          const neck = radius * 0.62 * strength;
          const edge = radius * (0.28 + 0.48 * strength);
          const mid = (a + b) / 2;
          const center = (ay + by) / 2;
          bridgeColor.setAttribute('x1', mobile ? '100%' : '0%');
          bridgeColor.setAttribute('x2', mobile ? '0%' : '100%');
          bridge.setAttribute('opacity', String(strength * Math.min(1, 1 + gap / radius) * Number(getComputedStyle(surface).opacity)));
          bridge.setAttribute('d', `M ${a} ${ay - edge}
            C ${mid} ${ay - edge} ${mid} ${center - neck} ${mid} ${center - neck}
            S ${mid} ${by - edge} ${b} ${by - edge}
            L ${b} ${by + edge}
            C ${mid} ${by + edge} ${mid} ${center + neck} ${mid} ${center + neck}
            S ${mid} ${ay + edge} ${a} ${ay + edge} Z`);
        } else {
          bridge.removeAttribute('d');
        }
        mergeFrame = requestAnimationFrame(draw);
      }

      mergeFrame = requestAnimationFrame(draw);
    }

    function syncHeader() {
      const hero = document.querySelector('main .home-hero');
      const scrolled = scrollY > 0;
      // On Home, give the services section room before the gallery takes over.
      const galleryEntry = hero ? Math.min(innerHeight * 0.25, 180) : innerHeight * 0.75;
      const galleryExit = hero ? galleryEntry : innerHeight * 0.25;
      const compact = scrolled && [...document.querySelectorAll('main .client-viewport, main .client-detail')].some(media => {
        const bounds = media.getBoundingClientRect();
        return bounds.height > 0 && bounds.top <= galleryEntry && bounds.bottom > galleryExit;
      });
      const previous = current.current;
      const wasJoined = previous.expanded || previous.mediaCompact;
      if (initialized.current && scrolled !== wasJoined && !reduceMotion.matches) animateHeaderMerge(wasJoined);
      initialized.current = true;
      const next = { expanded: scrolled && !compact, mediaCompact: compact };
      if (next.expanded !== previous.expanded || next.mediaCompact !== previous.mediaCompact) {
        current.current = next;
        setState(next);
      }
    }

    function queueHeaderSync() {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        syncHeader();
      });
    }

    window.addEventListener('scroll', queueHeaderSync, { passive: true });
    window.addEventListener('resize', queueHeaderSync);
    document.addEventListener('bluechip:media-layout', queueHeaderSync);
    syncHeader();
    return () => {
      window.removeEventListener('scroll', queueHeaderSync);
      window.removeEventListener('resize', queueHeaderSync);
      document.removeEventListener('bluechip:media-layout', queueHeaderSync);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(mergeFrame);
    };
  }, [header, pathname]);

  return state;
}
