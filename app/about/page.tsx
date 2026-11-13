import { PageTransition } from '@/components/navigation';
import { Faq, FinalCta, Founder, PageHead } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'About',
  description: 'Bluechip is an independent branding, website, and signage studio in Massachusetts, founded by Niko. Good businesses deserve good design.',
  path: '/about',
});

const principles: [string, string][] = [
  ['You talk to the designer.', 'The person in your first conversation is the person doing the work.'],
  ['Scope comes first.', 'You get deliverables, timeline, and cost in writing before work begins.'],
  ['You see work early.', 'We share direction before it’s polished, so feedback can still change it.'],
  ['You know who else is involved.', 'Fabricators, installers, and printers are coordinated partners.'],
];

export default function AboutPage() {
  return (
    <PageTransition>
      <PageHead
        eyebrow="ABOUT BLUECHIP"
        title={<>Good businesses<br />deserve good design.</>}
        description="An independent branding, website, and signage studio in Massachusetts, founded by Niko."
      />
      <Founder />
      <section className="content-section">
        <h2>How we work</h2>
        <Faq items={principles} open />
      </section>
      <FinalCta />
    </PageTransition>
  );
}
