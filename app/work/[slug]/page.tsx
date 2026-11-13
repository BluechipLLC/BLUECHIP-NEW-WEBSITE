import { notFound } from 'next/navigation';
import { FinalCta, PageHead } from '@/components/sections';
import { caseStudies, findCaseStudy } from '@/content/projects';
import { pageMetadata } from '@/lib/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/work/[slug]'>) {
  const study = findCaseStudy((await params).slug);
  if (!study) return {};
  return pageMetadata({
    title: study.name,
    description: `${study.name}: ${study.slug === 'natty' ? 'brand identity and packaging for a consumer wellness brand, created by Bluechip’s founder.' : 'brand identity and design work by Bluechip Branding & Design.'}`,
    path: `/work/${study.slug}`,
  });
}

export default async function CaseStudyPage({ params }: PageProps<'/work/[slug]'>) {
  const study = findCaseStudy((await params).slug);
  if (!study) notFound();
  return (
    <>
      <PageHead eyebrow="SELECTED WORK" title={study.name} description={study.description} />
      <section className="section project-gallery" style={{ paddingTop: 0 }}>
        {study.images.map((src, i) => (
          <img key={src} src={src} alt={`${study.name} project artwork ${i + 1}`} loading="lazy" />
        ))}
      </section>
      <FinalCta />
    </>
  );
}
