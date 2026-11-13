export type ServiceSlug = 'branding' | 'websites' | 'signage' | 'printing';

export type Service = {
  slug: ServiceSlug;
  /** Short name used in navigation. */
  name: string;
  /** Page title on the service page. */
  title: string;
  summary: string;
  deliverables: string[];
  /** One-line description on the home page service grid. */
  homeDescription: string;
  /** Button label: "Start a … project". */
  projectNoun: string;
};

export const services: Record<ServiceSlug, Service> = {
  branding: {
    slug: 'branding',
    name: 'Branding',
    title: 'Brand Identity',
    summary: 'A clear, consistent identity your business can use everywhere.',
    deliverables: ['Brand strategy', 'Logo system', 'Typography', 'Color palette', 'Brand guidelines', 'Packaging'],
    homeDescription: 'Build a strong, memorable identity for your business.',
    projectNoun: 'branding',
  },
  websites: {
    slug: 'websites',
    name: 'Websites',
    title: 'Digital Experiences',
    summary: 'A website that’s easy to use, easy to update, and built to last.',
    deliverables: ['Site strategy', 'Sitemap', 'UX/UI design', 'Responsive build', 'Content setup', 'Launch', 'Handover'],
    homeDescription: 'Modern, effective websites that look great and work hard.',
    projectNoun: 'website',
  },
  signage: {
    slug: 'signage',
    name: 'Signage',
    title: 'Brand Applications',
    summary: 'Signs that help people find you and match the rest of your brand.',
    deliverables: ['Exterior and interior signs', 'Wayfinding', 'Vehicle graphics', 'Production files', 'Fabricator coordination'],
    homeDescription: 'High-impact signage and graphics for any space.',
    projectNoun: 'signage',
  },
  printing: {
    slug: 'printing',
    name: 'Printing',
    title: 'Printing',
    summary: 'Printed pieces that bring your brand into the hands of your customers.',
    deliverables: ['Business cards', 'Brochures', 'Print design', 'Production files', 'Printer coordination'],
    homeDescription: 'Business cards, brochures, and print materials that carry your brand.',
    projectNoun: 'printing',
  },
};

/** Navigation and home-grid order. */
export const serviceOrder: ServiceSlug[] = ['branding', 'websites', 'signage', 'printing'];

export const isServiceSlug = (value: string): value is ServiceSlug => Object.hasOwn(services, value);
