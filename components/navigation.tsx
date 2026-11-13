'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { caseStudies } from '@/content/projects';
import { isServiceSlug } from '@/content/services';

/**
 * Page-to-page navigation behaviour, ported from the original site:
 * - the whole page slides out and in as one view transition (styles/page-transition.css),
 *   on link clicks and on back/forward, while the header stays put;
 * - a link to the page you are already on smooth-scrolls to the top;
 * - each history entry remembers its scroll position;
 * - after navigating, focus moves to the new page's heading.
 * Next still does the routing; this only decides when it happens and what surrounds it.
 */

const entryKey = 'bluechipNavigationEntry';
const topLevel = new Set(['/', '/work', '/services', '/about', '/launch']);
const pagePath = (pathname: string) => pathname.replace(/\/$/, '') || '/';

/** Pages that take part in animated navigation. `/start` opens the project dialog instead. */
function supportsPage(url: URL) {
  const path = pagePath(url.pathname);
  if (topLevel.has(path)) return true;
  const [, section, slug, extra] = path.split('/');
  if (!slug || extra) return false;
  if (section === 'services') return isServiceSlug(slug);
  return section === 'work' && caseStudies.some(study => study.slug === slug);
}

type Pending = { finish: () => void; push: boolean; url: URL; entry: string; fallback: boolean };
type ReplayedPopState = PopStateEvent & { bluechipReplay?: boolean };

export function PageNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const pending = useRef<Pending | null>(null);
  const scrollPositions = useRef(new Map<string, number>());
  const currentEntry = useRef('');
  const activeUrl = useRef<URL | null>(null);
  const transition = useRef<ViewTransition | undefined>(undefined);
  const fallbackAnimation = useRef<Animation | undefined>(undefined);
  const sequence = useRef(0);

  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const newEntry = () => `${performance.timeOrigin}-${++sequence.current}`;
    const ensureEntry = () => {
      const existing = history.state?.[entryKey] as string | undefined;
      if (existing) return existing;
      const id = newEntry();
      history.replaceState({ ...history.state, [entryKey]: id }, '');
      return id;
    };
    const samePage = (url: URL) => pagePath(url.pathname) === pagePath(activeUrl.current!.pathname) && url.search === activeUrl.current!.search;

    history.scrollRestoration = 'manual';
    activeUrl.current = new URL(location.href);
    currentEntry.current = ensureEntry();

    /** Run `change` (which makes Next render the destination) inside a whole-page view transition. */
    function navigate(url: URL, push: boolean, entry: string, change: () => void) {
      transition.current?.skipTransition();
      fallbackAnimation.current?.cancel();
      pending.current?.finish();
      const animate = !reducedMotion.matches;
      const commit = () => new Promise<void>(resolve => {
        const timeout = window.setTimeout(resolve, 4000);
        pending.current = { finish: () => { clearTimeout(timeout); resolve(); }, push, url, entry, fallback: animate && !document.startViewTransition };
        change();
      });
      if (animate && document.startViewTransition) {
        const next = document.startViewTransition(commit);
        transition.current = next;
        next.ready.catch(() => {});
        next.finished.catch(() => {}).finally(() => { if (transition.current === next) transition.current = undefined; });
      } else {
        commit();
      }
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href);
      if (url.origin !== location.origin || !supportsPage(url)) return;
      if (samePage(url)) {
        if (url.hash) return;
        event.preventDefault();
        if (activeUrl.current!.hash) {
          scrollPositions.current.set(currentEntry.current, scrollY);
          currentEntry.current = newEntry();
          history.pushState({ [entryKey]: currentEntry.current }, '', url);
          activeUrl.current = url;
        }
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
        return;
      }
      event.preventDefault();
      scrollPositions.current.set(currentEntry.current, scrollY);
      navigate(url, true, newEntry(), () => router.push(url.pathname + url.search + url.hash, { scroll: false }));
    }

    function onPopState(event: ReplayedPopState) {
      if (event.bluechipReplay) return;
      const url = new URL(location.href);
      if (!supportsPage(url)) return;
      scrollPositions.current.set(currentEntry.current, scrollY);
      const state = event.state as Record<string, unknown> | null;
      const entry = (state?.[entryKey] as string | undefined) ?? ensureEntry();
      if (samePage(url)) {
        activeUrl.current = url;
        currentEntry.current = entry;
        if (state?.[entryKey]) scrollToDestination(url, scrollPositions.current.get(entry));
        return;
      }
      // Hold Next's own handler until the outgoing page has been captured, then replay the event for it.
      event.stopImmediatePropagation();
      navigate(url, false, entry, () => {
        const replay: ReplayedPopState = new PopStateEvent('popstate', { state });
        replay.bluechipReplay = true;
        window.dispatchEvent(replay);
      });
    }

    // Capture phase: these must run before Next's link and history handlers.
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState, true);
    };
  }, [router]);

  // The destination page has rendered: place the scroll, move focus, and let the transition play.
  useLayoutEffect(() => {
    const navigation = pending.current;
    if (!navigation) {
      if (activeUrl.current) activeUrl.current = new URL(location.href);
      return;
    }
    pending.current = null;
    if (navigation.push) history.replaceState({ ...history.state, [entryKey]: navigation.entry }, '');
    activeUrl.current = navigation.url;
    currentEntry.current = navigation.entry;
    scrollToDestination(navigation.url, navigation.push ? undefined : scrollPositions.current.get(navigation.entry));
    const main = document.querySelector<HTMLElement>('main');
    const heading = main?.querySelector<HTMLElement>('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    if (navigation.fallback && main) {
      const style = getComputedStyle(main);
      fallbackAnimation.current = main.animate(
        [{ transform: 'translateY(var(--page-scroll-distance))', opacity: 0.6 }, { transform: 'none', opacity: 1 }],
        { duration: parseFloat(style.getPropertyValue('--page-scroll-duration')), easing: style.getPropertyValue('--page-scroll-easing').trim() },
      );
    }
    navigation.finish();
  }, [pathname]);

  return null;
}

function scrollToDestination(url: URL, position: number | undefined) {
  if (position !== undefined) {
    window.scrollTo({ top: position, behavior: 'instant' });
    return;
  }
  if (url.hash) {
    let id = url.hash.slice(1);
    try { id = decodeURIComponent(id); } catch {}
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'instant' });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
