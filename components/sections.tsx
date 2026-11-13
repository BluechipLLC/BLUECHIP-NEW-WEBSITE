import Link from 'next/link';
import type { ReactNode } from 'react';
import { services, type ServiceSlug } from '@/content/services';

/**
 * Links to /start stay plain anchors: the Start a Project dialog opens on click (see
 * StartProjectProvider) and the URL still works without JavaScript. Everything else routes
 * through next/link.
 */
export function SiteLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (/^\/start(\/|\?|$)/.test(href)) return <a className={className} href={href}>{children}</a>;
  return <Link className={className} href={href}>{children}</Link>;
}

export const Button = ({ href = '/start', children = 'Start a project' }: { href?: string; children?: ReactNode }) => (
  <SiteLink className="button" href={href}>{children} <span>&gt;</span></SiteLink>
);

export const TextLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <SiteLink className="text-link" href={href}>{children} <span>&gt;</span></SiteLink>
);

export function PageHead({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: ReactNode }) {
  return (
    <section className="page-head">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export function Faq({ items, open }: { items: [question: string, answer: string][]; open?: boolean }) {
  return items.map(([question, answer]) => (
    <details key={question} open={open}>
      <summary>{question}</summary>
      <p>{answer}</p>
    </details>
  ));
}

const launchStages: [string, string][] = [
  ['Discover', 'Business, audience, goals, direction.'],
  ['Build the Brand', 'Identity, logo system, type, color, guidelines.'],
  ['Go Digital', 'Website and essential digital pieces.'],
  ['Bring It to Life', 'Packaging, signage, print, or vehicles, as agreed.'],
  ['Hand It Over', 'Final assets, brand guide, working website.'],
];

export function LaunchSteps() {
  return (
    <ol className="steps">
      {launchStages.map(([name, description], i) => (
        <li key={name}>
          <span>{`0${i + 1}`}</span>
          <h3>{name}</h3>
          <p>{description}</p>
        </li>
      ))}
    </ol>
  );
}

export function LaunchSection() {
  return (
    <section className="section launch">
      <span className="eyebrow">BLUECHIP LAUNCH &gt;</span>
      <div className="split-heading">
        <h2>Have an idea?<br />We’ll take it from here.</h2>
        <p>
          You have the idea. We’ll help build the brand around it. From your identity and website to the materials you need to
          launch, Bluechip brings everything together.
        </p>
      </div>
      <LaunchSteps />
      <div className="launch-bottom">
        <p>You’ll have one person to talk to. We coordinate everyone involved in the agreed work, and you review and approve it at each stage.</p>
        <div className="actions">
          <Button href="/start?service=launch">Launch your brand</Button>
          <TextLink href="/launch">What’s included</TextLink>
        </div>
      </div>
    </section>
  );
}

const ctaSteps: [string, string][] = [
  ['Discover', 'We talk through your business and goals.'],
  ['Define', 'We put scope, timeline, and cost in writing.'],
  ['Design', 'You see the work early and share feedback.'],
  ['Deliver', 'We launch, hand over files, or coordinate production.'],
];

export function FinalCta() {
  return (
    <section className="section final-cta">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LET’S MAKE SOMETHING GOOD</span>
          <h2>Have something in mind?</h2>
          <p>Whether you know exactly what you need or you’re still figuring it out, we’d love to hear about your project.</p>
        </div>
        <Button />
      </div>
      <p>A rough idea is fine. We’ll agree on scope and cost before any work starts.</p>
      <ol className="steps">
        {ctaSteps.map(([name, description], i) => (
          <li key={name}>
            <h3><span>{`0${i + 1} \u00a0`}</span>{name}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Founder() {
  return (
    <section className="section founder">
      <div className="founder-art">
        <img src="/assets/niko.webp" alt="Niko, founder of Bluechip" loading="lazy" />
      </div>
      <div>
        <span className="eyebrow">A STUDIO WITH A PERSON BEHIND IT</span>
        <h2>Built by someone who<br />cares about the details.</h2>
        <p>Bluechip started with a straightforward idea: good businesses deserve good design.</p>
        <p className="byline"><strong>Niko</strong> &nbsp; Founder of Bluechip</p>
        <TextLink href="/about">Read the story</TextLink>
      </div>
    </section>
  );
}

const nattyStages: [string, string, string][] = [
  ['Brand Identity', 'A distinctive identity for Natty.', '/assets/natty-4.webp'],
  ['Campaign', 'Natty brand imagery.', '/assets/natty-3.webp'],
  ['Packaging', 'Product labels and packaging artwork.', '/assets/natty-1.webp'],
];

export function NattyShowcase() {
  return (
    <>
      <div className="natty-meta">
        <b>natty.</b>
        <span style={{ fontSize: 12 }}>Consumer wellness brand</span>
        <span className="tag">Created by Bluechip’s founder</span>
      </div>
      <div className="natty-grid">
        {nattyStages.map(([name, description, image], i) => (
          <div className="natty-stage" key={name}>
            <div className="art"><img className="natty-image" src={image} alt={`${name} for Natty`} loading="lazy" /></div>
            <div className="stage-caption">
              <small>{`0${i + 1}`}</small>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Flat illustrative concepts used on the services overview until real project art replaces them. */
const concepts = {
  'brand-art': (
    <div className="brand-card"><b>Cold<br />Harbor</b><span>COFFEE COMPANY</span></div>
  ),
  'web-art': (
    <div className="browser">
      <div className="browser-top"><b>natty.</b><span>Good things, naturally. &nbsp; ☰</span></div>
      <div className="browser-body"><b>Your daily<br />good thing.</b><i>natty.</i></div>
    </div>
  ),
  'sign-art': <div className="sign">THE DEN<small>BARBER COMPANY</small></div>,
};

const panelServices: [ServiceSlug, keyof typeof concepts, string][] = [
  ['branding', 'brand-art', 'Identity systems, guidelines, packaging.'],
  ['websites', 'web-art', 'Design, development, and launch.'],
  ['signage', 'sign-art', 'Storefronts, interiors, and vehicles.'],
];

export function ServicePanels() {
  return (
    <div className="service-panels">
      {panelServices.map(([slug, art, description], i) => (
        <Link className="service-panel" href={`/services/${slug}`} key={slug}>
          <div className={`art ${art}`} role="img" aria-label="Illustrative design concept">
            {concepts[art]}
            <span className="art-label">Illustrative concept</span>
          </div>
          <div className="panel-caption">
            <div>
              <h3><small>{`0${i + 1}`}</small>{services[slug].title}</h3>
              <p>{description}</p>
            </div>
            <span className="arrow">&gt;</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
