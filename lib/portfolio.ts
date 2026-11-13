import { clientMedia, type MediaItem } from '@/content/client-media';
import { clients, fallbackClientDescription } from '@/content/clients';

/** What a tile needs to draw itself. Kept small so the full media list stays on the server. */
export type TileMedia = Pick<MediaItem, 'src' | 'type' | 'label' | 'ratio' | 'background' | 'poster' | 'hasAudio' | 'homepagePreview'>;

export type Tile = {
  client: number;
  mediaIndex: number;
  media: TileMedia | null;
};

export type ClientSummary = {
  name: string;
  slug: string;
  color: string;
  caseStudy?: string;
  description: string;
  mediaCount: number;
};

export type HomeBoardData = {
  clients: ClientSummary[];
  cards: Tile[];
  /** Live previews shown beside each client's first tile, by client index. */
  previews: Record<number, Tile[]>;
};

export type WorkFeedData = {
  clients: ClientSummary[];
  cards: Tile[];
};

export const clientSlug = (name: string) =>
  name.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const mediaFor = (name: string) => clientMedia[name] ?? [];

function tileMedia(item: MediaItem): TileMedia {
  const { src, type, label, ratio, background, poster, hasAudio, homepagePreview } = item;
  return { src, type, label, ratio, background, poster, hasAudio, homepagePreview };
}

function summaries(): ClientSummary[] {
  return clients.map(client => ({
    name: client.name,
    slug: clientSlug(client.name),
    color: client.color,
    caseStudy: client.caseStudy,
    description: client.description ?? fallbackClientDescription,
    mediaCount: mediaFor(client.name).length,
  }));
}

/** Push each client's tile for one round, so clients interleave instead of clustering. */
function addRound(cards: Tile[], groups: Tile[][], round: number) {
  for (const items of groups) if (items[round]) cards.push(items[round]);
}

/** The home page board: one logo-led tile per client first, then further logo variants. */
export function homeBoard(): HomeBoardData {
  const clientCards: Tile[][] = clients.map((client, index) => {
    const images = mediaFor(client.name)
      .map((item, mediaIndex) => ({ client: index, mediaIndex, item }))
      .filter(({ item }) => item.type === 'image' && !item.homepagePreview);
    // Bring the first logo forward so it follows the lead image.
    if (images.length > 2) {
      const logoIndex = images.findIndex(({ item }, i) => i > 0 && /logo/i.test(item.label));
      if (logoIndex > 1) images.splice(1, 0, images.splice(logoIndex, 1)[0]);
    }
    // The home board only shows logos (and Shlerk's profile artwork).
    return images
      .filter(({ item }) => !item.galleryOnly && (/logo/i.test(item.label) || (client.name === 'Shlerk' && /pfp/i.test(item.label))))
      .map(({ client: c, mediaIndex, item }) => ({ client: c, mediaIndex, media: tileMedia(item) }));
  });

  const cards: Tile[] = [];
  const featured = clientCards.slice(0, 8);
  const others = clientCards.slice(8);
  addRound(cards, featured, 0);
  addRound(cards, featured, 1);
  addRound(cards, others, 0);
  const longest = Math.max(...clientCards.map(items => items.length));
  for (let round = 1; round < longest; round++) {
    if (round > 1) addRound(cards, featured, round);
    addRound(cards, others, round);
  }

  const previews: Record<number, Tile[]> = {};
  clients.forEach((client, index) => {
    const items = mediaFor(client.name)
      .map((item, mediaIndex) => ({ client: index, mediaIndex, media: tileMedia(item) }))
      .filter(({ media }) => media.homepagePreview);
    // Previews sit beside the client's first tile, so only clients with a tile get them.
    if (items.length && clientCards[index].length) previews[index] = items;
  });

  return { clients: summaries(), cards, previews };
}

/** The /work feed: every media item, interleaved across clients. */
export function workFeed(): WorkFeedData {
  const groups: Tile[][] = clients.map((client, index) =>
    mediaFor(client.name).map((item, mediaIndex) => ({ client: index, mediaIndex, media: tileMedia(item) })),
  );
  const cards: Tile[] = [];
  const longest = Math.max(...groups.map(items => items.length));
  for (let round = 0; round < longest; round++) addRound(cards, groups, round);
  return { clients: summaries(), cards };
}

export type GalleryItem = Pick<MediaItem, 'src' | 'type' | 'label' | 'poster' | 'hasAudio'>;

/** Full gallery for one client's detail panel, loaded on demand. */
export function galleryFor(slug: string): GalleryItem[] | null {
  const client = clients.find(c => clientSlug(c.name) === slug);
  if (!client) return null;
  return mediaFor(client.name).map(({ src, type, label, poster, hasAudio }) => ({ src, type, label, poster, hasAudio }));
}

export const gallerySlugs = () => clients.map(client => clientSlug(client.name));
