'use client';

import Link from 'next/link';
import { Fragment, useState, type CSSProperties, type ReactNode } from 'react';

export type NavItem = { href: string; label: string; home?: boolean; services?: boolean };

/** Props each entry spreads onto its root so hovering or focusing it moves the indicator. */
export type PreviewProps = {
  'data-preview': string;
  onPointerEnter: () => void;
  onFocus: () => void;
};

type Props = {
  as: 'nav' | 'div';
  ariaLabel?: string;
  className?: string;
  indicatorClassName: string;
  /** Repeat the labels inside the sliding indicator (desktop only). */
  labels?: boolean;
  items: NavItem[];
  pathname: string;
  /** Renders the Services entry (the header owns its dropdown). */
  renderServices?: (preview: PreviewProps, current: 'page' | undefined) => ReactNode;
};

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** A link row with a sliding indicator that previews the hovered or focused item. */
export function NavSelector({ as: Container, ariaLabel, className, indicatorClassName, labels, items, pathname, renderServices }: Props) {
  // Home is only offered away from the home page.
  const visible = items.filter(item => !(item.home && pathname === '/'));
  const active = visible.findIndex(item => !item.home && isActive(pathname, item.href));
  const [hovered, setHovered] = useState<number | null>(null);
  const selected = hovered ?? active;

  const preview = (index: number): PreviewProps => ({
    'data-preview': String(index === selected),
    onPointerEnter: () => setHovered(index),
    onFocus: () => setHovered(index),
  });

  return (
    <Container
      aria-label={ariaLabel}
      className={className}
      data-preview={String(selected >= 0)}
      style={{ '--nav-index': Math.max(0, selected) } as CSSProperties}
      onPointerLeave={() => setHovered(null)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(null); }}
    >
      <span className={indicatorClassName} aria-hidden="true">
        {labels && (
          <span className="nav-indicator-labels" inert>
            {visible.map(item => (
              <span key={item.href}>
                {item.label}
                {item.services && renderServices && <span className="nav-indicator-arrow">&gt;</span>}
              </span>
            ))}
          </span>
        )}
      </span>
      {visible.map((item, index) => {
        const current = index === active ? 'page' : undefined;
        if (item.services && renderServices) {
          return <Fragment key={item.href}>{renderServices(preview(index), current)}</Fragment>;
        }
        return (
          <Link key={item.href} href={item.href} className={item.home ? 'nav-home' : undefined} aria-current={current} {...preview(index)}>
            {item.label}
          </Link>
        );
      })}
    </Container>
  );
}
