'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import type { WorkFeedData } from '@/lib/portfolio';
import { mountPortfolio, type CaseStudyCard } from './mount-portfolio';

export function WorkPortfolio({ data, caseStudies }: { data: WorkFeedData; caseStudies: CaseStudyCard[] }) {
  const host = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(
    () => mountPortfolio({ mode: 'work', host: host.current!, ...data, caseStudies, navigate: href => router.push(href) }),
    [data, caseStudies, router],
  );

  return (
    <div className="portfolio-wireframe work-portfolio" id="portfolio" ref={host}>
      <div className="work-filters" role="group" aria-label="Filter work">
        <button type="button" data-work-filter="all" aria-pressed="true" aria-controls="work-results">All media</button>
        <button type="button" data-work-filter="case-studies" aria-pressed="false" aria-controls="work-results">Case studies</button>
      </div>
      <div className="client-viewport">
        <div className="client-board" id="work-results" aria-label="Portfolio media" />
      </div>
      <div className="work-feed-pagination">
        <button type="button" className="button board-load-more">Load more</button>
      </div>
      <span className="board-status" role="status" aria-live="polite" />
    </div>
  );
}
