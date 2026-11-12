(() => {
  if (pagePath(location.pathname) === '/start') return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const topLevel = new Set(['/', '/work', '/services', '/about', '/launch']);
  const scrollPositions = new Map();
  const entryKey = 'bluechipNavigationEntry';
  let sequence = 0;
  let activeUrl = new URL(location.href);
  let currentEntry = ensureEntry();
  let transition;
  let fallbackAnimation;
  let navigation = 0;
  history.scrollRestoration = 'manual';

  function newEntry() {
    return `${performance.timeOrigin}-${++sequence}`;
  }

  function ensureEntry() {
    const existing = history.state?.[entryKey];
    if (existing) return existing;
    const id = newEntry();
    history.replaceState({ ...history.state, [entryKey]: id }, '');
    return id;
  }

  function supportsPage(url) {
    const path = pagePath(url.pathname);
    if (topLevel.has(path)) return true;
    const [, section, slug, extra] = path.split('/');
    if (!slug || extra) return false;
    if (section === 'services') return Object.hasOwn(services, slug);
    return section === 'work' && projects.some(([id]) => id === slug);
  }

  function scrollToDestination(url, position) {
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

  function navigate(url, push, entry) {
    const request = ++navigation;
    transition?.skipTransition();
    fallbackAnimation?.cancel();
    const commit = () => {
      if (request !== navigation) return;
      if (push) history.pushState({ [entryKey]: entry }, '', url);
      activeUrl = url;
      currentEntry = entry;
      document.dispatchEvent(new Event('bluechip:before-render'));
      renderPage(pagePath(url.pathname));
      document.dispatchEvent(new Event('bluechip:render'));
      scrollToDestination(url, push ? undefined : scrollPositions.get(entry));
      const heading = main.querySelector('h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    if (!reducedMotion.matches && document.startViewTransition) {
      const next = document.startViewTransition(commit);
      transition = next;
      next.ready.catch(() => {});
      next.finished.catch(() => {}).finally(() => { if (transition === next) transition = undefined; });
    } else {
      commit();
      if (!reducedMotion.matches) {
        const style = getComputedStyle(main);
        fallbackAnimation = main.animate(
          [{ transform: 'translateY(var(--page-scroll-distance))', opacity: 0.6 }, { transform: 'none', opacity: 1 }],
          {
            duration: parseFloat(style.getPropertyValue('--page-scroll-duration')),
            easing: style.getPropertyValue('--page-scroll-easing').trim(),
          },
        );
      }
    }
  }

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href);
    if (url.origin !== location.origin || !supportsPage(url)) return;
    if (pagePath(url.pathname) === pagePath(activeUrl.pathname) && url.search === activeUrl.search) {
      if (url.hash) return;
      event.preventDefault();
      if (activeUrl.hash) {
        scrollPositions.set(currentEntry, scrollY);
        currentEntry = newEntry();
        history.pushState({ [entryKey]: currentEntry }, '', url);
        activeUrl = url;
      }
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      return;
    }
    event.preventDefault();
    scrollPositions.set(currentEntry, scrollY);
    navigate(url, true, newEntry());
  });

  window.addEventListener('popstate', event => {
    const url = new URL(location.href);
    if (!supportsPage(url)) return;
    scrollPositions.set(currentEntry, scrollY);
    const entry = ensureEntry();
    if (pagePath(url.pathname) === pagePath(activeUrl.pathname) && url.search === activeUrl.search) {
      activeUrl = url;
      currentEntry = entry;
      if (event.state?.[entryKey]) scrollToDestination(url, scrollPositions.get(entry));
      return;
    }
    navigate(url, false, entry);
  });
})();
