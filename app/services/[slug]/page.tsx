import { notFound } from 'next/navigation';
import { Button, Faq, FinalCta, PageHead, TextLink } from '@/components/sections';
import { isServiceSlug, serviceOrder, services } from '@/content/services';
import { pageMetadata } from '@/lib/metadata';

export const dynamicParams = false;

export function generateStaticParams() {
  return serviceOrder.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const service = services[slug];
  return pageMetadata({
    title: service.title === service.name ? service.name : `${service.name}: ${service.title}`,
    description: `${service.summary} ${service.deliverables.slice(0, 4).join(', ')}, and more from Bluechip.`,
    path: `/services/${slug}`,
  });
}

const sharedFaq: [string, string][] = [
  ['How much does it cost?', 'Every project is scoped individually. Deliverables, timeline, and cost are agreed before work begins.'],
  ['Can you connect this to our other creative work?', 'Yes. Our services can be designed together under one creative direction. Bluechip Launch brings the pieces together.'],
];
const signageFaq: [string, string] = [
  'Who handles fabrication and installation?',
  'Bluechip designs and coordinates with fabricators and installers. Production costs and permit responsibilities are set in your project scope.',
];

export default async function ServicePage({ params }: PageProps<'/services/[slug]'>) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();
  const service = services[slug];
  return (
    <>
      <PageHead eyebrow="SERVICES" title={`${service.title}.`} description={service.summary} />
      <section className="content-section">
        <h2>Designed around your business.</h2>
        <p>We start by understanding your business, audience, and goals. You review the work at agreed stages, with clear expectations from the first conversation.</p>
        <Button href={`/start?service=${slug}`}>{`Start a ${service.projectNoun} project`}</Button>
      </section>
      <section className="content-section">
        <h2>Typical deliverables</h2>
        <div className="deliverables">
          {service.deliverables.map(item => <span key={item}>{item}</span>)}
        </div>
      </section>
      <section className="content-section">
        <h2>A clear process.</h2>
        <p>Discover &gt; Define &gt; Design &gt; Deliver</p>
        <Faq items={slug === 'signage' ? [...sharedFaq, signageFaq] : sharedFaq} />
      </section>
      <section className="content-section">
        <TextLink href="/launch">Explore Bluechip Launch</TextLink>
      </section>
      <FinalCta />
    </>
  );
}
