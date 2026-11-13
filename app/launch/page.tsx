import { PageTransition } from '@/components/navigation';
import { Faq, FinalCta, LaunchSection, NattyShowcase, PageHead } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Bluechip Launch',
  description: 'Your brand identity, website, and launch materials, designed as one custom project with one scope, one timeline, and one point of contact.',
  path: '/launch',
});

const questions: [string, string][] = [
  ['How much does it cost?', 'We quote after a first conversation, based on the stages and applications you need.'],
  ['How long does it take?', 'Your proposal includes a timeline based on your agreed scope.'],
  ['Can I skip a stage?', 'Yes. If you already have a logo or a website, we scope around what exists.'],
  ['How involved will I be?', 'You join discovery and review work at set points. We coordinate the work between those conversations.'],
];

export default function LaunchPage() {
  return (
    <PageTransition>
      <PageHead
        eyebrow="BLUECHIP LAUNCH"
        title={<>From first idea.<br />To first impression.</>}
        description="Your brand identity, website, and launch materials, designed as one custom project."
      />
      <LaunchSection />
      <section className="section together"><NattyShowcase /></section>
      <section className="content-section">
        <h2>What’s included is agreed together.</h2>
        <p>One scope, one timeline, and one point of contact. Nothing is premade: every brand is designed for the business it belongs to.</p>
        <h2>Outside the creative scope</h2>
        <p>
          Business formation, legal work, regulatory approvals, manufacturing, inventory, sourcing, sign fabrication and
          installation, and marketing campaigns are not included unless separately agreed.
        </p>
        <Faq items={questions} />
      </section>
      <FinalCta />
    </PageTransition>
  );
}
