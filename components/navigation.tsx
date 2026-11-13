'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, ViewTransition, type ReactNode } from 'react';

/** Animates a page in and out on navigation (see the `.page-scroll` rules in page-transition.css). */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-scroll" exit="page-scroll" default="none">
      {children}
    </ViewTransition>
  );
}

/** After client-side navigation, move focus to the new page's heading, as a full page load would reset it. */
export function RouteFocus() {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = document.querySelector<HTMLElement>('main h1');
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
