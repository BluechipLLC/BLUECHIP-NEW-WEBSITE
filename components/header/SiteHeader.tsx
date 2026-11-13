'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { serviceOrder, services } from '@/content/services';
import { ChipLogo } from './ChipLogo';
import { NavSelector, type NavItem, type PreviewProps } from './NavSelector';
import { useHeaderMerge } from './useHeaderMerge';

const desktopItems: NavItem[] = [
  { href: '/', label: 'Home', home: true },
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services', services: true },
  { href: '/about', label: 'About' },
  { href: '/launch', label: 'Launch' },
];
const mobileItems: NavItem[] = desktopItems.map(({ href, label, home }) => ({ href, label, home }));

/** Renders the header, then the page (`children`), then the mobile menu, matching the original document order. */
export function SiteHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const scrolledRef = useRef(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { expanded, mediaCompact } = useHeaderMerge(header, pathname);

  // ----- Mobile island ----------------------------------------------------------------

  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const closeIsland = useCallback(() => {
    const menu = dialog.current!;
    if (!menu.open || menu.dataset.closing === 'true') return;
    menu.dataset.expanded = String(scrolledRef.current);
    menu.dataset.closing = 'true';
    setMenuOpen(false);
    const duration = reduceMotion() ? 0 : scrolledRef.current ? 420 : 480;
    closeTimer.current = window.setTimeout(() => {
      menu.close();
      delete menu.dataset.closing;
      menuButton.current?.focus({ preventScroll: true });
    }, duration);
  }, []);

  // Closing fires the dialog's `close` event, which resets `menuOpen`.
  const closeIslandNow = useCallback(() => {
    const menu = dialog.current!;
    clearTimeout(closeTimer.current);
    if (menu.open) menu.close();
    delete menu.dataset.closing;
  }, []);

  function toggleIsland() {
    const menu = dialog.current!;
    if (menu.open) {
      closeIsland();
      return;
    }
    clearTimeout(closeTimer.current);
    delete menu.dataset.closing;
    menu.dataset.expanded = String(scrolledRef.current);
    menu.showModal();
    setMenuOpen(true);
  }

  useEffect(() => {
    scrolledRef.current = expanded || mediaCompact;
  }, [expanded, mediaCompact]);

  // Route changes close menus straight away.
  const [menusPath, setMenusPath] = useState(pathname);
  if (menusPath !== pathname) {
    setMenusPath(pathname);
    setServicesOpen(false);
  }
  useEffect(() => closeIslandNow(), [pathname, closeIslandNow]);

  useEffect(() => {
    const desktop = matchMedia('(min-width:1024px)');
    const onChange = (event: MediaQueryListEvent) => { if (event.matches) closeIslandNow(); };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, [closeIslandNow]);

  // ----- Services dropdown ------------------------------------------------------------

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element).closest?.('.nav-services')) setServicesOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setServicesOpen(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const servicesMenu = (preview: PreviewProps, current: 'page' | undefined) => (
    <div
      className="nav-services"
      data-preview={preview['data-preview']}
      onPointerEnter={preview.onPointerEnter}
      onMouseEnter={() => setServicesOpen(true)}
      onMouseLeave={event => { if (!event.currentTarget.contains(document.activeElement)) setServicesOpen(false); }}
      onFocus={event => {
        preview.onFocus();
        if (event.target.id !== 'services-toggle') setServicesOpen(true);
      }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setServicesOpen(false); }}
    >
      <Link href="/services" aria-current={current}>Services</Link>
      <button
        id="services-toggle"
        type="button"
        aria-label="Show services"
        aria-expanded={servicesOpen}
        onClick={() => setServicesOpen(open => !open)}
      >
        &gt;
      </button>
      <div className="dropdown" hidden={!servicesOpen}>
        {serviceOrder.map(slug => (
          <Link key={slug} href={`/services/${slug}`}>{services[slug].name}</Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <header ref={header} className="natty-header" data-expanded={String(expanded)} data-media-compact={String(mediaCompact)}>
        <span className="header-surface" aria-hidden="true" />
        <svg className="header-merge" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="header-merge-color">
              <stop stopColor="var(--paper)" />
              <stop offset="1" stopColor="var(--blue)" />
            </linearGradient>
          </defs>
          <path fill="url(#header-merge-color)" />
        </svg>
        <ChipLogo light={pathname === '/'} />
        <NavSelector
          as="nav"
          ariaLabel="Main navigation"
          indicatorClassName="nav-indicator"
          labels
          items={desktopItems}
          pathname={pathname}
          renderServices={servicesMenu}
        />
        <a className="button nav-cta" href="/start">Start a project <span>&gt;</span></a>
        <button
          ref={menuButton}
          id="menu"
          type="button"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={toggleIsland}
        >
          <span /><span /><span />
        </button>
      </header>
      {children}
      <dialog
        ref={dialog}
        id="mobile-menu"
        aria-label="Main navigation"
        onCancel={event => { event.preventDefault(); closeIsland(); }}
        onClose={() => {
          setMenuOpen(false);
          // Closing always hands focus back to the menu button, as the original did.
          menuButton.current?.focus();
        }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const outside = event.clientY > bounds.bottom || event.clientY < bounds.top || event.clientX < bounds.left || event.clientX > bounds.right;
          if (outside) closeIsland();
        }}
      >
        <NavSelector
          as="div"
          className="mobile-island-links"
          indicatorClassName="mobile-nav-indicator"
          items={mobileItems}
          pathname={pathname}
        />
        <button id="close-menu" type="button" aria-label="Close navigation" onClick={closeIsland}>×</button>
      </dialog>
    </>
  );
}
