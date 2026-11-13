import { galleryFor, gallerySlugs } from '@/lib/portfolio';

// One static JSON gallery per client, fetched when a visitor opens a project's detail panel.
export const dynamicParams = false;

export function generateStaticParams() {
  return gallerySlugs().map(client => ({ client }));
}

export async function GET(_request: Request, { params }: RouteContext<'/portfolio-media/[client]'>) {
  const { client } = await params;
  const gallery = galleryFor(client);
  if (!gallery) return new Response('Not found', { status: 404 });
  return Response.json(gallery);
}
