export type CaseStudy = {
  slug: string;
  name: string;
  /** Subtitle under the case study heading. */
  description: string;
  images: string[];
};

const portfolioNote = 'A selection of design work from the Bluechip portfolio.';
const images = (slug: string, count: number) => Array.from({ length: count }, (_, i) => `/assets/${slug}-${i + 1}.webp`);

/** Case studies in /work order. Natty comes first. */
export const caseStudies: CaseStudy[] = [
  {
    slug: 'natty',
    name: 'Natty',
    description: 'Consumer wellness · Brand identity and packaging · Created by Bluechip’s founder',
    images: images('natty', 4),
  },
  { slug: 'cold-harbor', name: 'Cold Harbor Coffee Co.', description: portfolioNote, images: images('cold-harbor', 4) },
  { slug: 'the-den', name: 'The Den Barber Co.', description: portfolioNote, images: images('the-den', 4) },
  { slug: 'owned-by', name: 'Cafe Owned By', description: portfolioNote, images: images('owned-by', 4) },
  { slug: 'conways', name: 'Conway’s Landscaping', description: portfolioNote, images: images('conways', 2) },
];

export const findCaseStudy = (slug: string) => caseStudies.find(study => study.slug === slug);
