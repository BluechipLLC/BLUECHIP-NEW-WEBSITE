function mountPortfolio() {
 const host=document.querySelector('.portfolio-wireframe');if(!host)return;
 const lifecycle = new AbortController();
 const grid=host.querySelector('.portfolio-board');grid.className='client-board';grid.setAttribute('aria-label','Client projects');
 const workFeed = host.classList.contains('work-portfolio');
 const filters = [...host.querySelectorAll('[data-work-filter]')];
 host.querySelector('.project-presentation')?.remove();
 if (!workFeed) {
   host.querySelector('.board-caption span').textContent = 'SELECTED CLIENTS';
   host.querySelector('.board-intro').textContent = 'A selection of businesses and brands we have worked with.';
 }
 const clients=[
 ['Cold Harbor','#173e39','cold-harbor'],['Natty','#d2242d','natty'],['The Den','#25201b','the-den'],['Cafe Owned By','#102b43','owned-by'],['Conway’s Landscaping','#426f39','conways'],['Bradley Landscaping','#334d32'],['Monson Self Storage','#4a5560'],['Eastern Security Safe','#354554'],['Shuflr','#38567a'],['Macy Lee','#c4222b'],['Alexis Rose Photography','#514445'],['Mackoul Electric','#344a59'],['Why Buy Rentals','#3f4c9c'],['Tree Wizard','#3a543d'],['Aqua Dreams','#387e96'],['Shlerk','#15182d'],['Mestek','#4d5a64'],['Dargie’s Vinyl Dreams','#52565c'],['Elite Tree & Snow','#536357'],['Lunch Ladies','#68625a'],['Italian Feast','#625b56'],['Richard Neal','#465261']
 ];
 const ratios=[16/9,1,3/4,1,3/2,2/3,1,4/3,16/9,1,3/4,1,3/2,1,2/3,4/3,16/9,3/4,1,1];
 let shown=0;const viewport=document.createElement('div');viewport.className='client-viewport';grid.before(viewport);viewport.append(grid);
 const wall=document.createElement('div');wall.className='board-blur-wall';const more=document.createElement('button');more.type='button';more.className='button board-load-more';more.textContent='Load more';wall.append(more);const fullLink=host.querySelector('.portfolio-more a');if(fullLink){fullLink.className='board-all-link';wall.append(fullLink)}viewport.after(wall);
 const status=host.querySelector('.board-status');
 if (workFeed) wall.className = 'work-feed-pagination';
 const clientCards=clients.map(([name],index)=>{const images=(clientMedia[name]||[]).map((item,mediaIndex)=>({index,item,mediaIndex})).filter(({item})=>item.type==='image'&&!item.homepagePreview);if(images.length>2){const logoIndex=images.findIndex(({item},i)=>i>0&&/logo/i.test(item.label));if(logoIndex>1)images.splice(1,0,images.splice(logoIndex,1)[0])}return images.length?images:[{index,item:null,mediaIndex:0}]}); const cards=[];const homepage=location.pathname==='/'||location.pathname==='/index.html';if(homepage)clientCards.forEach((items,index)=>{clientCards[index]=items.filter(({item})=>item&&!item.galleryOnly&&(/logo/i.test(item.label)||(clients[index][0]==='Shlerk'&&/pfp/i.test(item.label))));});const addRound=(group,round)=>group.forEach(items=>{if(items[round])cards.push(items[round])});addRound(clientCards.slice(0,8),0);addRound(clientCards.slice(0,8),1);addRound(clientCards.slice(8),0);for(let round=1;round<Math.max(...clientCards.map(items=>items.length));round++){if(round>1)addRound(clientCards.slice(0,8),round);addRound(clientCards.slice(8),round)}
 const previewsByClient = clients.map(([name]) => (clientMedia[name] || [])
   .map((item, mediaIndex) => ({ item, mediaIndex }))
   .filter(({ item }) => item.homepagePreview));
 if (workFeed) {
   const mediaByClient = clients.map(([name], index) => (clientMedia[name] || [])
     .map((item, mediaIndex) => ({ index, item, mediaIndex })));
   cards.length = 0;
   const longest = Math.max(...mediaByClient.map(media => media.length));
   for (let round = 0; round < longest; round++) addRound(mediaByClient, round);
 }
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const nearbyVideos = new Set();
 const visibleVideos = new Set();
 const requestedPlayback = new WeakSet();

 function loadPreview(video) {
   if (!video.hasAttribute('src')) video.src = video.dataset.src;
 }

 function reserveSound(video) {
   for (const other of host.querySelectorAll('video')) {
     if (other !== video && !other.muted) other.muted = true;
   }
 }

 function enforceOneSound(event) {
   const video = event.target;
   if (video instanceof HTMLVideoElement && !video.dataset.silent && !video.paused && !video.muted && video.volume > 0) {
     reserveSound(video);
   }
 }

 for (const type of ['play', 'volumechange']) {
   host.addEventListener(type, enforceOneSound, { capture: true, signal: lifecycle.signal });
 }

 function syncVideo(video) {
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
     if (entry.isIntersecting) {
       nearbyVideos.add(entry.target);
       if (!reducedMotion.matches) loadPreview(entry.target);
     } else {
       nearbyVideos.delete(entry.target);
     }
   }
 }, { rootMargin: '720px 0px' });
 const playVideos = new IntersectionObserver(entries => {
   for (const entry of entries) {
     if (entry.target === transferredPreview?.video) continue;
     if (entry.isIntersecting) visibleVideos.add(entry.target);
     else visibleVideos.delete(entry.target);
     syncVideo(entry.target);
   }
 }, { threshold: 0.01 });

 if (homepage) {
   document.addEventListener('visibilitychange', () => visibleVideos.forEach(syncVideo), { signal: lifecycle.signal });
   reducedMotion.addEventListener('change', () => {
     if (!reducedMotion.matches) nearbyVideos.forEach(loadPreview);
     visibleVideos.forEach(syncVideo);
   }, { signal: lifecycle.signal });
 }

 function addSoundControl(tile, video, name) {
   const card = document.createElement('div');
   card.className = 'client-video-card';
   const sound = document.createElement('button');
   sound.type = 'button';
   sound.className = 'client-video-sound';
   function update() {
     const muted = video.muted || video.volume === 0;
     sound.textContent = muted ? 'Unmute' : 'Mute';
     sound.setAttribute('aria-label', `${sound.textContent} ${name} video`);
   }
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

 function createTile({ index, item, mediaIndex }, position) {
   const [name, color] = clients[index];
   const tile = document.createElement('button');
   tile.type = 'button';
   tile.className = 'client-tile';
   tile.style.backgroundColor = item?.background || color;
   tile.style.aspectRatio = (workFeed || item?.homepagePreview) && item?.ratio
     ? Math.max(0.52, Math.min(3, item.ratio)) : item?.ratio
     ? Math.max(0.6, Math.min(1.8, item.ratio)) : ratios[position % ratios.length];

   if (workFeed && item) {
     const image = document.createElement('img');
     image.className = 'client-tile-media';
     image.alt = '';
     image.loading = 'lazy';
     image.decoding = 'async';
     const source = item.type === 'video' ? item.poster : item.src;
     if (source) image.src = source;
     tile.classList.add('has-preview');
     tile.setAttribute('aria-label', `${name}: ${item.label}${item.type === 'video' ? ', play video' : ''}`);
     tile.append(image);
     if (item.type === 'video') {
       const badge = document.createElement('span');
       badge.className = 'work-video-badge';
       badge.setAttribute('aria-hidden', 'true');
       badge.textContent = '▶';
       tile.append(badge);
     }
   } else if (item?.homepagePreview) {
     const media = document.createElement(item.type === 'video' ? 'video' : 'img');
     media.className = 'client-tile-media';
     media.setAttribute('aria-hidden', 'true');
     tile.setAttribute('aria-label', `${name}: ${item.label}`);
     if (item.type === 'video') {
       if (item.hasAudio === false) media.dataset.silent = 'true';
       media.muted = true;
       media.defaultMuted = true;
       media.playsInline = true;
       media.preload = item.hasAudio ? 'metadata' : 'auto';
       media.loop = true;
       media.poster = item.poster;
       media.dataset.src = item.src;
       preloadVideos.observe(media);
       playVideos.observe(media);
     } else {
       media.src = item.src;
       media.alt = '';
       media.loading = 'lazy';
       media.decoding = 'async';
     }
     tile.classList.add('has-preview');
     tile.append(media);
   } else if (item) {
     tile.style.backgroundImage = `url("${item.src}")`;
     tile.classList.add('has-image');
   }
   tile.addEventListener('click', () => openDetail(index, mediaIndex, tile));
   const label = document.createElement('strong');
   label.textContent = name;
   const action = document.createElement('span');
   action.textContent = 'See more >';
   tile.append(label, action);
   if (!workFeed && item?.homepagePreview && item.type === 'video' && item.hasAudio) {
     return addSoundControl(tile, tile.querySelector('video'), name);
   }
   return tile;
 }

 grid.replaceChildren();
 const batchSize = 24;
 let filter = 'all';
 let rendered = 0;
 function render(end = shown) {
   const batch = workFeed ? document.createElement('div') : grid;
   if (workFeed) batch.className = 'work-media-batch';
   cards.slice(rendered, end).forEach((card, offset) => {
     const tile = createTile(card, rendered + offset);
     const previews = previewsByClient[card.index];
     if (homepage && previews.length && card === clientCards[card.index][0]) {
       const group = document.createElement('div');
       group.className = 'client-tile-group';
       group.append(tile, ...previews.map(preview => createTile({ ...preview, index: card.index }, rendered + offset)));
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
   document.dispatchEvent(new Event('bluechip:media-layout'));
 }

 function saveWorkView() {
   history.replaceState({ ...history.state, bluechipWork: { filter, shown } }, '');
 }

 function renderCases() {
   const caseGrid = document.createElement('div');
   caseGrid.className = 'work-case-grid';
   const caseStudies = [['natty', 'Natty'], ...projects];
   for (const [slug, name] of caseStudies) {
     const link = document.createElement('a');
     link.className = 'work-case-card';
     link.href = `/work/${slug}`;
     const image = document.createElement('img');
     image.src = projectImages[slug][0];
     image.alt = '';
     image.loading = 'lazy';
     image.decoding = 'async';
     const title = document.createElement('h2');
     title.textContent = name;
     link.append(image, title);
     caseGrid.append(link);
   }
   grid.append(caseGrid);
   wall.hidden = true;
   status.textContent = `${caseStudies.length} case studies shown.`;
   document.dispatchEvent(new Event('bluechip:media-layout'));
 }

 function changeFilter(next) {
   filter = next;
   for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.workFilter === filter));
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

 let detail = null;
 let returnFocus = null;
 let returnTileTop = 0;
 let transferredPreview = null;

 function moveVideo(video, container) {
   // A state-preserving move keeps the decoded frame and playback running.
   if (container.moveBefore) container.moveBefore(video, null);
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

 function openPreview(video, tile, stage, name) {
   preloadVideos.unobserve(video);
   playVideos.unobserve(video);
   nearbyVideos.delete(video);
   visibleVideos.delete(video);
   const poster = document.createElement('img');
   poster.className = 'client-tile-media';
   poster.alt = '';
   poster.src = video.poster;
   tile.append(poster);
   const sound = tile.parentElement.querySelector('.client-video-sound');
   if (sound) sound.hidden = true;
   transferredPreview = { video, tile, poster, sound };
   video.classList.remove('client-tile-media');
   video.removeAttribute('aria-hidden');
   video.setAttribute('aria-label', `${name} motion artwork`);
   video.controls = true;
   video.loop = false;
   moveVideo(video, stage);
   if (!video.hasAttribute('src')) video.src = video.dataset.src;
   if (video.paused) video.play().catch(() => {});
   if (!reducedMotion.matches) {
     video.animate([{ scale: 0.975 }, { scale: 1 }], { duration: 200, easing: 'ease-out' });
   }
 }
 const descriptions={'cold-harbor':'A coffee brand identity expressed across packaging, pattern and everyday objects.','natty':'A consumer wellness brand created by Bluechip’s founder, with identity and packaging artwork.','the-den':'A barber brand presented through identity and branded applications.','owned-by':'A café identity explored across packaging and promotional concepts.','conways':'A landscaping identity with logo and business card artwork.'};
 function openDetail(index, initialSlide, tile) {
  restorePreview();
  const preview = tile.querySelector('video');
  returnFocus = tile;
  returnTileTop = tile.getBoundingClientRect().top;
  if (!detail) {
    detail = document.createElement('section');
    detail.className = 'client-detail';
    viewport.before(detail);
  }
  const [name,color,id]=clients[index],key='bluechip-detail-'+index;let state={liked:false,comments:[]};try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
  detail.replaceChildren();const close=document.createElement('button');close.className='detail-close';close.textContent='>';close.setAttribute('aria-label','Back to projects');close.onclick=()=>closeDetail();
  const panel = document.createElement('div');
  panel.className = 'detail-panel';
  const visual = document.createElement('div');
  visual.className = 'detail-visual';
  visual.style.background = color;
  visual.append(close);
  panel.append(visual);
  detail.append(panel);

  const media = clientMedia[name] || [];
  if (media.length) {
    const stage = document.createElement('div');
    stage.className = 'detail-media-stage';
    visual.append(stage);
    const controls = document.createElement('div');
    controls.className = 'detail-media-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = 'Previous';
    previous.setAttribute('aria-label', 'Previous media');
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'Next';
    next.setAttribute('aria-label', 'Next media');
    const count = document.createElement('span');
    count.setAttribute('aria-live', 'polite');
    let current = initialSlide;

    function showSlide(resumePreview = false) {
      restorePreview();
      stage.replaceChildren();
      const item = media[current];
      if (resumePreview && preview) {
        openPreview(preview, tile, stage, name);
      } else {
        const element = document.createElement(item.type === 'video' ? 'video' : 'img');
        element.src = item.src;
        if (item.type === 'video') {
          if (item.hasAudio === false) element.dataset.silent = 'true';
          element.controls = true;
          element.playsInline = true;
          element.preload = 'metadata';
          if (item.poster) element.poster = item.poster;
          element.setAttribute('aria-label', `${name} motion artwork`);
        } else {
          element.alt = `${name} project artwork: ${item.label}`;
          element.loading = 'lazy';
        }
        stage.append(element);
        if (workFeed && resumePreview && tile && item.type === 'video') element.play().catch(() => {});
      }
      count.textContent = `${current + 1} / ${media.length}`;
    }

    previous.onclick = () => { current = (current - 1 + media.length) % media.length; showSlide(); };
    next.onclick = () => { current = (current + 1) % media.length; showSlide(); };
    controls.append(previous, count, next);
    if (media.length > 1) visual.append(controls);
    showSlide(true);
  } else {
    const visualName = document.createElement('span');
    visualName.textContent = name;
    visual.append(visualName);
  }
  const info=document.createElement('div');info.className='detail-info';const label=document.createElement('span');label.className='eyebrow';label.textContent='BLUECHIP PROJECT';const title=document.createElement('h3');title.textContent=name;const desc=document.createElement('p');desc.textContent=descriptions[id]||'A project from the Bluechip portfolio. More details are coming soon.';
  const like=document.createElement('button');like.className='detail-like';const syncLike=()=>{like.textContent=state.liked?'♥ 1 like':'♡ 0 likes';like.setAttribute('aria-pressed',String(state.liked))};const save=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch{}};syncLike();like.onclick=()=>{state.liked=!state.liked;save();syncLike()};
  const commentsTitle=document.createElement('h4');commentsTitle.textContent='Comments';const note=document.createElement('p');note.className='detail-note';note.textContent='Preview only: likes and comments are saved in this browser, not shared publicly.';const list=document.createElement('ul');list.className='detail-comments';function showComments(){list.replaceChildren();state.comments.forEach(c=>{const li=document.createElement('li');li.textContent=c;list.append(li)})}showComments();const form=document.createElement('form');form.className='detail-comment-form';const input=document.createElement('textarea');input.placeholder='Add a comment';input.setAttribute('aria-label','Add a comment');input.maxLength=500;input.required=true;const submit=document.createElement('button');submit.className='button';submit.textContent='Post comment';form.append(input,submit);form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(!value)return;state.comments.push(value);save();showComments();input.value=''};
  const top=document.createElement('div');top.className='detail-top';top.append(like);const heading=document.createElement('div');heading.className='detail-heading';heading.append(label,title);const description=document.createElement('div');description.className='detail-description';const descriptionHeading=document.createElement('h4');descriptionHeading.textContent='Description';description.append(descriptionHeading,desc);info.append(top,heading);if(id){const link=document.createElement('a');link.href='/work/'+id;link.className='detail-project-link';link.textContent='View project';info.append(link)}info.append(description,commentsTitle,note,list,form);panel.append(info);
  document.dispatchEvent(new Event('bluechip:media-layout'));
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
   document.dispatchEvent(new Event('bluechip:media-layout'));
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail)closeDetail()}, { signal: lifecycle.signal });
 more.addEventListener('click', () => loadMore(true));
 let moreObserver;
 if (workFeed) {
   const saved = history.state?.bluechipWork;
   shown = Math.min(Math.max(batchSize, Number.isInteger(saved?.shown) ? saved.shown : 0), cards.length);
   changeFilter(saved?.filter === 'case-studies' ? 'case-studies' : 'all');
   for (const button of filters) button.addEventListener('click', () => {
     if (button.dataset.workFilter === filter) return;
     closeDetail({ restorePosition: false });
     changeFilter(button.dataset.workFilter);
     saveWorkView();
   });
   if ('IntersectionObserver' in window) {
     moreObserver = new IntersectionObserver(entries => {
       if (entries.some(entry => entry.isIntersecting)) loadMore();
     }, { rootMargin: '500px 0px' });
     moreObserver.observe(wall);
   }
 } else {
   shown = Math.min(16, cards.length);
   render();
 }
 return () => {
   lifecycle.abort();
   preloadVideos.disconnect();
   playVideos.disconnect();
   moreObserver?.disconnect();
   host.querySelectorAll('video').forEach(video => video.pause());
 };
}

let disposePortfolio = mountPortfolio();
document.addEventListener('bluechip:before-render', () => disposePortfolio?.());
document.addEventListener('bluechip:render', () => { disposePortfolio = mountPortfolio(); });
