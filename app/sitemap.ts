import type { MetadataRoute } from 'next';
import { caseStudies } from '@/content/projects';
import { serviceOrder } from '@/content/services';
import { siteUrl } from '@/content/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    '/work',
    ...caseStudies.map(({ slug }) => `/work/${slug}`),
    '/services',
    ...serviceOrder.map(slug => `/services/${slug}`),
    '/launch',
    '/about',
    '/start',
  ];
  return paths.map(path => ({ url: `${siteUrl}${path === '/' ? '' : path}`, priority: path === '/' ? 1 : 0.7 }));
}
