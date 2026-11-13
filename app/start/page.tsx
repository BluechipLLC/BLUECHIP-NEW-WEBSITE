import { PageTransition } from '@/components/navigation';
import { PageHead } from '@/components/sections';
import { OpenOnLoad } from '@/components/start-project/OpenOnLoad';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Start a project',
  description: 'Tell Bluechip what you’re working on, then book a free 20-minute consultation or send your project inquiry.',
  path: '/start',
});

export default function StartPage() {
  return (
    <PageTransition>
      <PageHead eyebrow="LET’S GET STARTED" title="Start a project." description="Tell us what you’re working on, then book a free consultation or send your inquiry." />
      <section className="section" style={{ paddingTop: 0 }}>
        <a href="/start" className="button" data-project-entry="">Start a project <span>&gt;</span></a>
      </section>
      <OpenOnLoad />
    </PageTransition>
  );
}
