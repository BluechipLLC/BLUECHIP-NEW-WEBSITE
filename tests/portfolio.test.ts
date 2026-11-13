import { describe, expect, test } from 'vitest';
import { clientSlug, galleryFor, gallerySlugs, homeBoard, workFeed } from '@/lib/portfolio';

describe('portfolio board data', () => {
  test('home board keeps the original order: 19 logo tiles, Cold Harbor first, previews beside their client', () => {
    const board = homeBoard();
    expect(board.cards).toHaveLength(19);
    expect(board.cards[0].media?.src).toBe('/assets/client-media/00-14.webp');
    expect(board.cards.every(card => card.media && !card.media.homepagePreview)).toBe(true);
    const natty = board.clients.findIndex(client => client.name === 'Natty');
    expect(board.previews[natty].map(tile => tile.media?.type)).toEqual(['video']);
    expect(Object.keys(board.previews)).toHaveLength(2);
  });

  test('work feed lists every media item, interleaved by client', () => {
    const feed = workFeed();
    expect(feed.cards).toHaveLength(899);
    expect(feed.cards.slice(0, 3).map(card => feed.clients[card.client].name)).toEqual(['Cold Harbor', 'Natty', 'The Den']);
  });

  test('every client has a unique gallery slug that resolves', () => {
    const slugs = gallerySlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(clientSlug('Conway’s Landscaping')).toBe('conways-landscaping');
    for (const slug of slugs) expect(galleryFor(slug)).not.toBeNull();
    expect(galleryFor('nope')).toBeNull();
  });
});
