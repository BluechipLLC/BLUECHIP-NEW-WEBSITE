import { PageTransition } from '@/components/navigation';
import { WorkPortfolio } from '@/components/portfolio/WorkPortfolio';
import { caseStudies } from '@/content/projects';
import { pageMetadata } from '@/lib/metadata';
import { workFeed } from '@/lib/portfolio';

export const metadata = pageMetadata({
  title: 'Work',
  description: 'Branding, packaging, websites, and signage Bluechip has designed for businesses across Western Massachusetts and beyond.',
  path: '/work',
});

const caseStudyCards = caseStudies.map(({ slug, name, images }) => ({ slug, name, image: images[0] }));

export default function WorkPage() {
  return (
    <PageTransition>
      <section className="section work-feed">
        <h1>Work</h1>
        <WorkPortfolio data={workFeed()} caseStudies={caseStudyCards} />
      </section>
    </PageTransition>
  );
}
