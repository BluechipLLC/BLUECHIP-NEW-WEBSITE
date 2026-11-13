import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EclairShowcase } from '@/components/EclairShowcase';
import { PageTransition } from '@/components/navigation';
import { HomeBoard } from '@/components/portfolio/HomeBoard';
import { serviceOrder, services, type ServiceSlug } from '@/content/services';
import { defaultDescription, defaultTitle } from '@/content/site';
import { homeBoard } from '@/lib/portfolio';

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description: defaultDescription,
  alternates: { canonical: '/' },
  openGraph: { title: defaultTitle, description: defaultDescription, url: '/' },
};

const serviceIcons: Record<ServiceSlug, ReactNode> = {
  branding: <path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5" />,
  websites: <><rect x="2.5" y="3.5" width="19" height="13" rx="2" /><path d="M10 17v3m4-3v3m-6 0h8" /></>,
  signage: <><rect x="3" y="5" width="18" height="8" rx="1.5" /><path d="M7 3v2m10-2v2m-7 8v7m4-7v7" /></>,
  printing: <><path d="M6 8V3h12v5M6 17H3v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6h-3M17 11h1" /><path d="M6 14h12v7H6z" /></>,
};

export default function HomePage() {
  return (
    <PageTransition>
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-content">
          <h1 id="home-hero-title">Every business<br /> has a next chapter.</h1>
          <p>We help businesses launch, grow, and refresh their brand with design, signage, websites, and production that make a lasting impression.</p>
          <div className="home-hero-actions">
            <a className="home-button" href="/start">Let’s talk about your project <span aria-hidden="true">›</span></a>
            <a className="home-hero-link" href="#portfolio">Explore our work <span aria-hidden="true">›</span></a>
          </div>
        </div>
      </section>

      <section className="home-hero-intro" aria-labelledby="home-hero-intro-title">
        <div className="home-hero-intro-copy">
          <h2 id="home-hero-intro-title">A full-service creative partner.</h2>
          <p>From brand identity and websites to signage and production, we bring every piece together for a consistent, professional presence.</p>
        </div>
        <div className="home-hero-service-grid">
          {serviceOrder.map(slug => (
            <Link className="home-hero-service" href={`/services/${slug}`} key={slug}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {serviceIcons[slug]}
              </svg>
              <h3>{services[slug].name}</h3>
              <p>{services[slug].homeDescription}</p>
              <span className="home-hero-service-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading"><h2 className="home-work-title">Check Out Our Work</h2></div>
        <HomeBoard data={homeBoard()} />
      </section>

      <EclairShowcase />

      <section className="chapter-section">
        <div className="chapter-heading">
          <h2>What can we help you <span>create?</span></h2>
          <p>Big plans, small projects, and everything in between. Tell us what you’re working on.</p>
        </div>
        <div className="chapter-cards">
          <a className="chapter-card chapter-launch" href="/start?service=launch">
            <span className="chapter-label">01 / LAUNCH</span>
            <h3>Starting something new?</h3>
            <p>From your first logo to your opening-day essentials, we’ll help bring your business to life.</p>
            <span className="chapter-link">Let’s launch &gt;</span>
            <img src="/assets/cold-harbor-2.webp" alt="" loading="lazy" />
          </a>
          <a className="chapter-card chapter-refresh" href="/start?service=refresh">
            <span className="chapter-label">02 / REFRESH</span>
            <h3>Ready for a fresh look?</h3>
            <p>Give your business a fresh identity that reflects where you’re headed.</p>
            <span className="chapter-link">Let’s refresh &gt;</span>
            <span className="chapter-graphic" aria-hidden="true">NEXT<br />CHAPTER.</span>
          </a>
        </div>
        <div className="chapter-other-strip">
          <div>
            <h3>Just need something done?</h3>
            <p>From a single sign to a custom website, no project needs to be a complete rebrand.</p>
          </div>
          <a href="/start">Tell us what you need &gt;</a>
        </div>
      </section>
    </PageTransition>
  );
}
