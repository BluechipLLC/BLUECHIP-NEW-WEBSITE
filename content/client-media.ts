import raw from './client-media.json';

export type MediaItem = {
  src: string;
  type: 'image' | 'video';
  label: string;
  ratio?: number;
  background?: string;
  poster?: string;
  /** Only shown in the project detail gallery and the /work feed, never on the home board. */
  galleryOnly?: boolean;
  /** Shown beside the client's logo on the home board, with live video. */
  homepagePreview?: boolean;
  hasAudio?: boolean;
};

/** Media per client name. Order matters: it drives board and gallery order. */
export const clientMedia = raw as Record<string, MediaItem[]>;
