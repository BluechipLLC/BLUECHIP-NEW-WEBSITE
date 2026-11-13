import type { ClientSummary, GalleryItem, Tile, TileMedia } from '@/lib/portfolio';

/**
 * The portfolio board is driven imperatively: preview videos move between a tile and the
 * detail panel without restarting, which React reconciliation cannot express. React renders
 * the static frame (viewport, grid, pagination, status) and this module fills the grid.
 */

export type CaseStudyCard = { slug: string; name: string; image: string };

export type PortfolioOptions = {
  mode: 'home' | 'work';
  host: HTMLElement;
  clients: ClientSummary[];
  cards: Tile[];
  previews?: Record<number, Tile[]>;
  caseStudies?: CaseStudyCard[];
  /** Client-side navigation for links created here. */
  navigate: (href: string) => void;
};

type WorkView = { filter: 'all' | 'case-studies'; shown: number };

const fallbackRatios = [16 / 9, 1, 3 / 4, 1, 3 / 2, 2 / 3, 1, 4 / 3, 16 / 9, 1, 3 / 4, 1, 3 / 2, 1, 2 / 3, 4 / 3, 16 / 9, 3 / 4, 1, 1];
const batchSize = 24;
const galleries = new Map<string, Promise<GalleryItem[]>>();

function loadGallery(slug: string) {
  let gallery = galleries.get(slug);
  if (!gallery) {
    gallery = fetch(`/portfolio-media/${slug}`).then(response => {
      if (!response.ok) throw new Error(`Gallery ${slug} failed to load`);
      return response.json() as Promise<GalleryItem[]>;
    });
    gallery.catch(() => galleries.delete(slug));
    galleries.set(slug, gallery);
  }
  return gallery;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Let modified clicks open new tabs; route plain clicks through the app router. */
function routeLink(link: HTMLAnchorElement, navigate: (href: string) => void) {
  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(link.getAttribute('href')!);
  });
}

export const announceMediaLayout = () => document.dispatchEvent(new Event('bluechip:media-layout'));

export function mountPortfolio({ mode, host, clients, cards, previews = {}, caseStudies = [], navigate }: PortfolioOptions) {
  const workFeed = mode === 'work';
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const viewport = host.querySelector<HTMLElement>('.client-viewport')!;
  const grid = host.querySelector<HTMLElement>('.client-board')!;
  const more = host.querySelector<HTMLButtonElement>('.board-load-more')!;
  const wall = more.parentElement!;
  const status = host.querySelector<HTMLElement>('.board-status')!;
  const filters = [...host.querySelectorAll<HTMLButtonElement>('[data-work-filter]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // The home board groups a client's live previews with that client's first tile.
  const leadTiles = new Set<Tile>();
  if (!workFeed) {
    const seen = new Set<number>();
    for (const card of cards) {
      if (!seen.has(card.client)) {
        seen.add(card.client);
        leadTiles.add(card);
      }
    }
  }

  // ----- Video previews ---------------------------------------------------------------

  const nearbyVideos = new Set<HTMLVideoElement>();
  const visibleVideos = new Set<HTMLVideoElement>();
  const requestedPlayback = new WeakSet<HTMLVideoElement>();
  let transferredPreview: { video: HTMLVideoElement; tile: HTMLElement; poster: HTMLImageElement; sound: HTMLButtonElement | null } | null = null;

  function loadPreview(video: HTMLVideoElement) {
    if (!video.hasAttribute('src') && video.dataset.src) video.src = video.dataset.src;
  }

  function reserveSound(video: HTMLVideoElement) {
    for (const other of host.querySelectorAll('video')) {
      if (other !== video && !other.muted) other.muted = true;
    }
  }

  function enforceOneSound(event: Event) {
    const video = event.target;
    if (video instanceof HTMLVideoElement && !video.dataset.silent && !video.paused && !video.muted && video.volume > 0) {
      reserveSound(video);
    }
  }
  for (const type of ['play', 'volumechange']) host.addEventListener(type, enforceOneSound, { capture: true, signal });

  function syncVideo(video: HTMLVideoElement) {
    const canPlay = !reducedMotion.matches || requestedPlayback.has(video);
    if (visibleVideos.has(video) && !document.hidden && canPlay && !viewport.hidden) {
      loadPreview(video);
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  const preloadVideos = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        nearbyVideos.add(video);
        if (!reducedMotion.matches) loadPreview(video);
      } else {
        nearbyVideos.delete(video);
      }
    }
  }, { rootMargin: '720px 0px' });

  const playVideos = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (video === transferredPreview?.video) continue;
      if (entry.isIntersecting) visibleVideos.add(video);
      else visibleVideos.delete(video);
      syncVideo(video);
    }
  }, { threshold: 0.01 });

  if (!workFeed) {
    document.addEventListener('visibilitychange', () => visibleVideos.forEach(syncVideo), { signal });
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) nearbyVideos.forEach(loadPreview);
      visibleVideos.forEach(syncVideo);
    }, { signal });
  }

  function addSoundControl(tile: HTMLElement, video: HTMLVideoElement, name: string) {
    const card = el('div', 'client-video-card');
    const sound = el('button', 'client-video-sound');
    sound.type = 'button';
    const update = () => {
      const muted = video.muted || video.volume === 0;
      sound.textContent = muted ? 'Unmute' : 'Mute';
      sound.setAttribute('aria-label', `${sound.textContent} ${name} video`);
    };
    sound.addEventListener('click', () => {
      if (!video.muted && video.volume > 0) {
        video.muted = true;
        return;
      }
      requestedPlayback.add(video);
      reserveSound(video);
      loadPreview(video);
      if (video.volume === 0) video.volume = 1;
      video.muted = false;
      video.play().catch(() => { video.muted = true; });
    });
    video.addEventListener('volumechange', update);
    update();
    card.append(tile, sound);
    return card;
  }

  // ----- Tiles ------------------------------------------------------------------------

  function tileRatio(media: TileMedia | null, position: number) {
    if (media?.ratio && (workFeed || media.homepagePreview)) return Math.max(0.52, Math.min(3, media.ratio));
    if (media?.ratio) return Math.max(0.6, Math.min(1.8, media.ratio));
    return fallbackRatios[position % fallbackRatios.length];
  }

  function createTile({ client, media, mediaIndex }: Tile, position: number): HTMLElement {
    const { name, color } = clients[client];
    const tile = el('button', 'client-tile');
    tile.type = 'button';
    tile.style.backgroundColor = media?.background || color;
    tile.style.aspectRatio = String(tileRatio(media, position));

    if (workFeed && media) {
      const image = el('img', 'client-tile-media');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      const source = media.type === 'video' ? media.poster : media.src;
      if (source) image.src = source;
      tile.classList.add('has-preview');
      tile.setAttribute('aria-label', `${name}: ${media.label}${media.type === 'video' ? ', play video' : ''}`);
      tile.append(image);
      if (media.type === 'video') {
        const badge = el('span', 'work-video-badge', '▶');
        badge.setAttribute('aria-hidden', 'true');
        tile.append(badge);
      }
    } else if (media?.homepagePreview) {
      tile.setAttribute('aria-label', `${name}: ${media.label}`);
      if (media.type === 'video') {
        const video = el('video', 'client-tile-media');
        video.setAttribute('aria-hidden', 'true');
        if (media.hasAudio === false) video.dataset.silent = 'true';
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.preload = media.hasAudio ? 'metadata' : 'auto';
        video.loop = true;
        if (media.poster) video.poster = media.poster;
        video.dataset.src = media.src;
        preloadVideos.observe(video);
        playVideos.observe(video);
        tile.append(video);
      } else {
        const image = el('img', 'client-tile-media');
        image.setAttribute('aria-hidden', 'true');
        image.src = media.src;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        tile.append(image);
      }
      tile.classList.add('has-preview');
    } else if (media) {
      tile.style.backgroundImage = `url("${media.src}")`;
      tile.classList.add('has-image');
    }

    tile.addEventListener('click', () => openDetail(client, mediaIndex, tile, media));
    tile.append(el('strong', undefined, name), el('span', undefined, 'See more >'));
    if (!workFeed && media?.homepagePreview && media.type === 'video' && media.hasAudio) {
      return addSoundControl(tile, tile.querySelector('video')!, name);
    }
    return tile;
  }

  // ----- Rendering and paging ---------------------------------------------------------

  let filter: WorkView['filter'] = 'all';
  let shown = 0;
  let rendered = 0;

  function render(end = shown) {
    const batch = workFeed ? el('div', 'work-media-batch') : grid;
    cards.slice(rendered, end).forEach((card, offset) => {
      const tile = createTile(card, rendered + offset);
      const clientPreviews = previews[card.client];
      if (clientPreviews?.length && leadTiles.has(card)) {
        const group = el('div', 'client-tile-group');
        group.append(tile, ...clientPreviews.map(preview => createTile(preview, rendered + offset)));
        grid.append(group);
      } else {
        batch.append(tile);
      }
    });
    if (workFeed && batch.childElementCount) grid.append(batch);
    rendered = end;
    more.hidden = shown >= cards.length;
    wall.hidden = workFeed && more.hidden;
    status.textContent = `${shown} of ${cards.length} ${workFeed ? 'media items' : 'projects'} shown.`;
    announceMediaLayout();
  }

  function saveWorkView() {
    const view: WorkView = { filter, shown };
    history.replaceState({ ...history.state, bluechipWork: view }, '');
  }

  function renderCases() {
    const caseGrid = el('div', 'work-case-grid');
    for (const study of caseStudies) {
      const link = el('a', 'work-case-card');
      link.href = `/work/${study.slug}`;
      routeLink(link, navigate);
      const image = el('img');
      image.src = study.image;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      link.append(image, el('h2', undefined, study.name));
      caseGrid.append(link);
    }
    grid.append(caseGrid);
    wall.hidden = true;
    status.textContent = `${caseStudies.length} case studies shown.`;
    announceMediaLayout();
  }

  function changeFilter(next: WorkView['filter']) {
    filter = next;
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.workFilter === filter));
    restorePreview();
    grid.replaceChildren();
    grid.setAttribute('aria-label', filter === 'all' ? 'Portfolio media' : 'Case studies');
    rendered = 0;
    if (filter === 'case-studies') renderCases();
    else while (rendered < shown) render(Math.min(rendered + batchSize, shown));
  }

  function loadMore(focus = false) {
    if (filter !== 'all' || shown >= cards.length) return;
    shown = Math.min(shown + (workFeed ? batchSize : 4), cards.length);
    render();
    if (workFeed) {
      saveWorkView();
      if (focus) grid.lastElementChild?.querySelector('button')?.focus();
    }
  }

  // ----- Detail panel -----------------------------------------------------------------

  let detail: HTMLElement | null = null;
  let returnFocus: HTMLElement | null = null;
  let returnTileTop = 0;

  function moveVideo(video: HTMLVideoElement, container: HTMLElement) {
    // A state-preserving move keeps the decoded frame and playback running.
    const movable = container as HTMLElement & { moveBefore?: (node: Node, child: Node | null) => void };
    if (movable.moveBefore) movable.moveBefore(video, null);
    else container.append(video);
  }

  function restorePreview() {
    if (!transferredPreview) return;
    const { video, tile, poster, sound } = transferredPreview;
    video.getAnimations().forEach(animation => animation.cancel());
    video.pause();
    video.controls = false;
    video.loop = true;
    video.removeAttribute('aria-label');
    video.setAttribute('aria-hidden', 'true');
    video.classList.add('client-tile-media');
    moveVideo(video, tile);
    poster.remove();
    if (sound) sound.hidden = false;
    preloadVideos.observe(video);
    playVideos.observe(video);
    transferredPreview = null;
  }

  function openPreview(video: HTMLVideoElement, tile: HTMLElement, stage: HTMLElement, name: string) {
    preloadVideos.unobserve(video);
    playVideos.unobserve(video);
    nearbyVideos.delete(video);
    visibleVideos.delete(video);
    const poster = el('img', 'client-tile-media');
    poster.alt = '';
    poster.src = video.poster;
    tile.append(poster);
    const sound = tile.parentElement?.querySelector<HTMLButtonElement>('.client-video-sound') ?? null;
    if (sound) sound.hidden = true;
    transferredPreview = { video, tile, poster, sound };
    video.classList.remove('client-tile-media');
    video.removeAttribute('aria-hidden');
    video.setAttribute('aria-label', `${name} motion artwork`);
    video.controls = true;
    video.loop = false;
    moveVideo(video, stage);
    loadPreview(video);
    if (video.paused) video.play().catch(() => {});
    if (!reducedMotion.matches) video.animate([{ scale: 0.975 }, { scale: 1 }], { duration: 200, easing: 'ease-out' });
  }

  type DetailState = { liked: boolean; comments: string[] };

  function openDetail(clientIndex: number, initialSlide: number, tile: HTMLElement, initialMedia: TileMedia | null) {
    restorePreview();
    const preview = tile.querySelector('video');
    returnFocus = tile;
    returnTileTop = tile.getBoundingClientRect().top;
    if (!detail) {
      detail = el('section', 'client-detail');
      viewport.before(detail);
    }
    const client = clients[clientIndex];
    const { name, color } = client;
    const key = `bluechip-detail-${clientIndex}`;
    let state: DetailState = { liked: false, comments: [] };
    try { state = { ...state, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}

    detail.replaceChildren();
    const close = el('button', 'detail-close', '>');
    close.setAttribute('aria-label', 'Back to projects');
    close.onclick = () => closeDetail();
    const panel = el('div', 'detail-panel');
    const visual = el('div', 'detail-visual');
    visual.style.background = color;
    visual.append(close);
    panel.append(visual);
    detail.append(panel);

    if (client.mediaCount) {
      const stage = el('div', 'detail-media-stage');
      visual.append(stage);
      const controls = el('div', 'detail-media-controls');
      const previous = el('button', undefined, 'Previous');
      previous.type = 'button';
      previous.setAttribute('aria-label', 'Previous media');
      const next = el('button', undefined, 'Next');
      next.type = 'button';
      next.setAttribute('aria-label', 'Next media');
      const count = el('span');
      count.setAttribute('aria-live', 'polite');
      let current = initialSlide;
      const owner = detail;

      function showItem(item: Pick<GalleryItem, 'src' | 'type' | 'label' | 'poster' | 'hasAudio'>, resumePreview: boolean) {
        restorePreview();
        stage.replaceChildren();
        if (resumePreview && preview) {
          openPreview(preview, tile, stage, name);
        } else if (item.type === 'video') {
          const video = el('video');
          video.src = item.src;
          if (item.hasAudio === false) video.dataset.silent = 'true';
          video.controls = true;
          video.playsInline = true;
          video.preload = 'metadata';
          if (item.poster) video.poster = item.poster;
          video.setAttribute('aria-label', `${name} motion artwork`);
          stage.append(video);
          if (workFeed && resumePreview) video.play().catch(() => {});
        } else {
          const image = el('img');
          image.src = item.src;
          image.alt = `${name} project artwork: ${item.label}`;
          image.loading = 'lazy';
          stage.append(image);
        }
        count.textContent = `${current + 1} / ${client.mediaCount}`;
      }

      async function step(direction: number) {
        const gallery = await loadGallery(client.slug).catch(() => null);
        // Ignore a late response if the panel closed or switched client meanwhile.
        if (!gallery || detail !== owner || !owner.isConnected) return;
        current = (current + direction + gallery.length) % gallery.length;
        showItem(gallery[current], false);
      }

      previous.onclick = () => step(-1);
      next.onclick = () => step(1);
      controls.append(previous, count, next);
      if (client.mediaCount > 1) {
        visual.append(controls);
        loadGallery(client.slug).catch(() => {});
      }
      if (initialMedia) showItem(initialMedia, true);
      else step(0);
    } else {
      visual.append(el('span', undefined, name));
    }

    const info = el('div', 'detail-info');
    const like = el('button', 'detail-like');
    const syncLike = () => {
      like.textContent = state.liked ? '♥ 1 like' : '♡ 0 likes';
      like.setAttribute('aria-pressed', String(state.liked));
    };
    const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} };
    syncLike();
    like.onclick = () => { state.liked = !state.liked; save(); syncLike(); };

    const list = el('ul', 'detail-comments');
    const showComments = () => list.replaceChildren(...state.comments.map(comment => el('li', undefined, comment)));
    showComments();
    const form = el('form', 'detail-comment-form');
    const input = el('textarea');
    input.placeholder = 'Add a comment';
    input.setAttribute('aria-label', 'Add a comment');
    input.maxLength = 500;
    input.required = true;
    const submit = el('button', 'button', 'Post comment');
    form.append(input, submit);
    form.onsubmit = event => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      state.comments.push(value);
      save();
      showComments();
      input.value = '';
    };

    const top = el('div', 'detail-top');
    top.append(like);
    const heading = el('div', 'detail-heading');
    heading.append(el('span', 'eyebrow', 'BLUECHIP PROJECT'), el('h3', undefined, name));
    const description = el('div', 'detail-description');
    description.append(el('h4', undefined, 'Description'), el('p', undefined, client.description));
    info.append(top, heading);
    if (client.caseStudy) {
      const link = el('a', 'detail-project-link', 'View project');
      link.href = `/work/${client.caseStudy}`;
      routeLink(link, navigate);
      info.append(link);
    }
    const note = el('p', 'detail-note', 'Preview only: likes and comments are saved in this browser, not shared publicly.');
    info.append(description, el('h4', undefined, 'Comments'), note, list, form);
    panel.append(info);

    announceMediaLayout();
    close.focus({ preventScroll: true });
    detail.scrollIntoView({ behavior: preview || reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
  }

  function closeDetail({ restorePosition = true } = {}) {
    if (!detail) return;
    restorePreview();
    detail.remove();
    detail = null;
    if (restorePosition && returnFocus?.isConnected) {
      window.scrollBy({ top: returnFocus.getBoundingClientRect().top - returnTileTop, behavior: 'instant' });
      returnFocus.focus({ preventScroll: true });
    }
    returnFocus = null;
    announceMediaLayout();
  }

  document.addEventListener('keydown', event => { if (event.key === 'Escape' && detail) closeDetail(); }, { signal });
  more.addEventListener('click', () => loadMore(true), { signal });

  // ----- Start ------------------------------------------------------------------------

  grid.replaceChildren();
  let moreObserver: IntersectionObserver | undefined;
  if (workFeed) {
    const saved = (history.state as { bluechipWork?: Partial<WorkView> } | null)?.bluechipWork;
    shown = Math.min(Math.max(batchSize, Number.isInteger(saved?.shown) ? saved!.shown! : 0), cards.length);
    changeFilter(saved?.filter === 'case-studies' ? 'case-studies' : 'all');
    for (const button of filters) {
      button.addEventListener('click', () => {
        if (button.dataset.workFilter === filter) return;
        closeDetail({ restorePosition: false });
        changeFilter(button.dataset.workFilter === 'case-studies' ? 'case-studies' : 'all');
        saveWorkView();
      }, { signal });
    }
    moreObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) loadMore();
    }, { rootMargin: '500px 0px' });
    moreObserver.observe(wall);
  } else {
    shown = Math.min(16, cards.length);
    render();
  }

  return () => {
    lifecycle.abort();
    restorePreview();
    preloadVideos.disconnect();
    playVideos.disconnect();
    moreObserver?.disconnect();
    host.querySelectorAll('video').forEach(video => video.pause());
    detail?.remove();
    grid.replaceChildren();
  };
}
