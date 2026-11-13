'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import type { HomeBoardData } from '@/lib/portfolio';
import { mountPortfolio } from './mount-portfolio';

export function HomeBoard({ data }: { data: HomeBoardData }) {
  const host = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Layout effect: the board must exist before navigation restores the scroll position.
  useLayoutEffect(() => mountPortfolio({ mode: 'home', host: host.current!, ...data, navigate: href => router.push(href) }), [data, router]);

  return (
    <div className="portfolio-wireframe portfolio-feed" id="portfolio" ref={host}>
      <div className="board-caption">
        <span>SELECTED CLIENTS</span>
        <span className="composition-label" aria-hidden="true" />
      </div>
      <p className="board-intro">A selection of businesses and brands we have worked with.</p>
      <div className="client-viewport">
        <div className="client-board" aria-label="Client projects" />
      </div>
      <div className="board-blur-wall">
        <button type="button" className="button board-load-more">Load more</button>
        <Link className="board-all-link" href="/work">View all projects <span aria-hidden="true">&gt;</span></Link>
      </div>
      <p className="board-footnote">A selection of identity and design work from the Bluechip portfolio.</p>
      <span className="board-status" role="status" aria-live="polite" />
      <div className="portfolio-more"><p>Explore the full portfolio.</p></div>
    </div>
  );
}
