import { FinalCta, LaunchSection, PageHead, ServicePanels } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';

export const metadata = pageMetadata({
  title: 'Services',
  description: 'Branding, websites, signage, and printing from one creative partner. Build a brand, take it online, and bring it into the world.',
  path: '/services',
});

export default function ServicesPage() {
  return (
    <>
      <PageHead eyebrow="WHAT WE DO" title={<>Three disciplines.<br />One creative partner.</>} description="Build a brand, take it online, bring it into the world." />
      <section className="section" style={{ paddingTop: 0 }}>
        <ServicePanels />
      </section>
      <LaunchSection />
      <FinalCta />
    </>
  );
}
