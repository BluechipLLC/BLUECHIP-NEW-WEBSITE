const main=document.querySelector('main');
const services={printing:['Printing','Printed pieces that bring your brand into the hands of your customers.','Business cards · Brochures · Print design · Production files · Printer coordination'],branding:['Brand Identity','A clear, consistent identity your business can use everywhere.','Brand strategy · Logo system · Typography · Color palette · Brand guidelines · Packaging'],websites:['Digital Experiences','A website that’s easy to use, easy to update, and built to last.','Site strategy · Sitemap · UX/UI design · Responsive build · Content setup · Launch · Handover'],signage:['Brand Applications','Signs that help people find you and match the rest of your brand.','Exterior and interior signs · Wayfinding · Vehicle graphics · Production files · Fabricator coordination']};
const projects=[['cold-harbor','Cold Harbor Coffee Co.','coffee'],['the-den','The Den Barber Co.','den'],['owned-by','Cafe Owned By','owned'],['conways','Conway’s Landscaping','conway']];
const brand='<div class="brand-card"><b>Cold<br>Harbor</b><span>COFFEE COMPANY</span></div>',web='<div class="browser"><div class="browser-top"><b>natty.</b><span>Good things, naturally. &nbsp; ☰</span></div><div class="browser-body"><b>Your daily<br>good thing.</b><i>natty.</i></div></div>',sign='<div class="sign">THE DEN<small>BARBER COMPANY</small></div>';
const art=k=>`<div class="art ${k}" role="img" aria-label="Illustrative design concept">${{coffee:brand,den:sign,owned:'<b>owned by.</b>',conway:'<b>> conway’s</b>','brand-art':brand,'web-art':web,'sign-art':sign}[k]}<span class="art-label">Illustrative concept</span></div>`;
const btn=(t='Start a project',u='/start')=>`<a class="button" href="${u}">${t} <span>></span></a>`,link=(t,u)=>`<a class="text-link" href="${u}">${t} <span>></span></a>`;
const panels=()=>`<div class="service-panels">${Object.entries(services).filter(([k])=>k!=='printing').map(([k,v],i)=>`<a class="service-panel" href="/services/${k}">${art(['brand-art','web-art','sign-art'][i])}<div class="panel-caption"><div><h3><small>0${i+1}</small>${v[0]}</h3><p>${['Identity systems, guidelines, packaging.','Design, development, and launch.','Storefronts, interiors, and vehicles.'][i]}</p></div><span class="arrow">></span></div></a>`).join('')}</div>`;
const boardProjects=[
 {id:'cold-harbor',name:'Cold Harbor',category:'Project overview',color:'blue',shape:'landscape',items:['Primary project visual','Project detail','Additional project view']},
 {id:'natty',name:'Natty',category:'Branding · Website · Packaging',color:'red',shape:'portrait',items:['Primary project visual','Brand identity','Website','Packaging','Real-world deployment']},
 {id:'the-den',name:'The Den',category:'Project overview',color:'green',shape:'square',items:['Primary project visual','Project detail','Additional project view']},
 {id:'owned-by',name:'Owned By',category:'Project overview',color:'yellow',shape:'wide',items:['Primary project visual','Project detail','Additional project view']},
 {id:'conways',name:'Conway’s',category:'Project overview',color:'purple',shape:'small',items:['Primary project visual','Project detail','Additional project view']}
];
const previewSequence=[0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4];
const work=(feed=false)=>{
 const cards=feed?previewSequence.map((index,i)=>{const p=boardProjects[index];const labels=p.id==='natty'?['Brand identity','Website','Packaging','Brand applications','Identity detail','Primary visual']:['Primary visual','Project detail','Close-up view','Project overview','Alternate view','Additional view'];return {...p,preview:labels[Math.floor(i/5)%labels.length]}}):boardProjects;
 return `<div class="portfolio-wireframe ${feed?'portfolio-feed':''}" id="portfolio"><div class="board-caption"><span>${feed?'THE PROJECT PINBOARD / 20 PREVIEWS':'SELECTED PROJECTS'}</span><span class="composition-label" aria-hidden="true"></span></div><p class="board-intro">${feed?'A little of everything. Explore the details, follow a project, see how it comes together.':'Select a project to explore the work.'}</p><div class="portfolio-board" aria-label="${feed?'Project preview pinboard':'Selected projects'}">${cards.map((p,i)=>`<button type="button" class="portfolio-card board-${p.id} tone-${p.color}" data-project="${p.id}" aria-expanded="false" aria-controls="project-presentation"><span class="card-index">${String(i+1).padStart(2,'0')} / ${feed?'PREVIEW':'PROJECT'}</span><span class="card-title">${p.name}</span><span class="card-category">${p.preview||p.category}</span><span class="card-action">${feed?'Open project':'Explore project'} <span aria-hidden="true">></span></span></button>`).join('')}</div><section id="project-presentation" class="project-presentation" aria-labelledby="project-board-title" hidden></section><p class="board-footnote">A selection of identity and design work from the Bluechip portfolio.</p><span class="board-status" role="status" aria-live="polite"></span>${feed?'<div class="portfolio-more"><p>Explore the full portfolio.</p><a class="button" href="/work">View all projects <span aria-hidden="true">></span></a></div>':''}</div>`;
};
const projectImages={"cold-harbor":["/assets/cold-harbor-1.webp", "/assets/cold-harbor-2.webp", "/assets/cold-harbor-3.webp", "/assets/cold-harbor-4.webp"],"natty":["/assets/natty-1.webp", "/assets/natty-2.webp", "/assets/natty-3.webp", "/assets/natty-4.webp"],"the-den":["/assets/the-den-1.webp", "/assets/the-den-2.webp", "/assets/the-den-3.webp", "/assets/the-den-4.webp"],"owned-by":["/assets/owned-by-1.webp", "/assets/owned-by-2.webp", "/assets/owned-by-3.webp", "/assets/owned-by-4.webp"],"conways":["/assets/conways-1.webp", "/assets/conways-2.webp"]};
const stages=[['Discover','Business, audience, goals, direction.'],['Build the Brand','Identity, logo system, type, color, guidelines.'],['Go Digital','Website and essential digital pieces.'],['Bring It to Life','Packaging, signage, print, or vehicles, as agreed.'],['Hand It Over','Final assets, brand guide, working website.']];
const steps=()=>`<ol class="steps">${stages.map(([n,d],i)=>`<li><span>0${i+1}</span><h3>${n}</h3><p>${d}</p></li>`).join('')}</ol>`;
const natty=()=>`<div class="natty-meta"><b>natty.</b><span style="font-size:12px">Consumer wellness brand</span><span class="tag">Created by Bluechip’s founder</span></div><div class="natty-grid">${[['Brand Identity','A distinctive identity for Natty.','/assets/natty-4.webp'],['Campaign','Natty brand imagery.','/assets/natty-3.webp'],['Packaging','Product labels and packaging artwork.','/assets/natty-1.webp']].map(([n,d,v],i)=>`<div class="natty-stage"><div class="art"><img class="natty-image" src="${v}" alt="${n} for Natty" loading="lazy"></div><div class="stage-caption"><small>0${i+1}</small><h3>${n}</h3><p>${d}</p></div></div>`).join('')}</div>`;
const cta=()=>`<section class="section final-cta"><div class="section-heading"><div><span class="eyebrow">LET’S MAKE SOMETHING GOOD</span><h2>Have something in mind?</h2><p>Whether you know exactly what you need or you’re still figuring it out, we’d love to hear about your project.</p></div>${btn()}</div><p>A rough idea is fine. We’ll agree on scope and cost before any work starts.</p><ol class="steps">${[['Discover','We talk through your business and goals.'],['Define','We put scope, timeline, and cost in writing.'],['Design','You see the work early and share feedback.'],['Deliver','We launch, hand over files, or coordinate production.']].map(([n,d],i)=>`<li><h3><span>0${i+1} &nbsp;</span>${n}</h3><p>${d}</p></li>`).join('')}</ol></section>`;
const heading=(l,t,d='')=>`<section class="page-head"><span class="eyebrow">${l}</span><h1>${t}</h1><p>${d}</p></section>`;
const launch=()=>`<section class="section launch"><span class="eyebrow">BLUECHIP LAUNCH ></span><div class="split-heading"><h2>Have an idea?<br>We’ll take it from here.</h2><p>You have the idea. We’ll help build the brand around it. From your identity and website to the materials you need to launch, Bluechip brings everything together.</p></div>${steps()}<div class="launch-bottom"><p>You’ll have one person to talk to. We coordinate everyone involved in the agreed work, and you review and approve it at each stage.</p><div class="actions">${btn('Launch your brand','/start?service=launch')}${link('What’s included','/launch')}</div></div></section>`;
const founder=()=>`<section class="section founder"><div class="founder-art"><img src="/assets/niko.webp" alt="Niko, founder of Bluechip" loading="lazy"></div><div><span class="eyebrow">A STUDIO WITH A PERSON BEHIND IT</span><h2>Built by someone who<br>cares about the details.</h2><p>Bluechip started with a straightforward idea: good businesses deserve good design.</p><p class="byline"><strong>Niko</strong> &nbsp; Founder of Bluechip</p>${link('Read the story','/about')}</div></section>`;
// Set only after Niko explicitly approves a number for this personal invitation.
const founderContactPhone=null; // {display: 'approved display number', href: 'tel:approved-number'}
const founderContact=()=>`<section class="founder-contact" id="call-niko" aria-labelledby="founder-contact-title"><span class="eyebrow">A DIRECT LINE TO THE FOUNDER</span><h2 id="founder-contact-title">This is literally my personal phone number. Call me with any questions.</h2><div class="founder-contact-bottom"><div class="founder-contact-person"><strong>Niko</strong><span>Founder, Bluechip Branding &amp; Design</span></div><div class="founder-contact-invitation"><p>Not sure what you need? Wondering what something might cost? Have an idea you want to talk through? Just call me. I'm happy to help you figure it out.</p>${founderContactPhone?`<a class="founder-contact-number" href="${founderContactPhone.href}">${founderContactPhone.display}</a>`:'<p class="founder-contact-pending" id="personal-phone-pending">Personal phone number pending approval.</p>'}<div class="founder-contact-actions">${founderContactPhone?`<a class="founder-call" href="${founderContactPhone.href}">Call Me ></a>`:'<button class="founder-call" type="button" disabled aria-describedby="personal-phone-pending">Call Me ></button>'}<a class="founder-message" href="/start">Rather send a message? Start a Project ></a></div></div></div></section>`;
const pagePath = pathname => pathname.replace(/\/$/, '') || '/';
const homeServices = [
  ['branding', 'Branding', 'Build a strong, memorable identity for your business.',
    '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>'],
  ['websites', 'Websites', 'Modern, effective websites that look great and work hard.',
    '<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M10 17v3m4-3v3m-6 0h8"/>'],
  ['signage', 'Signage', 'High-impact signage and graphics for any space.',
    '<rect x="3" y="5" width="18" height="8" rx="1.5"/><path d="M7 3v2m10-2v2m-7 8v7m4-7v7"/>'],
  ['printing', 'Printing', 'Business cards, brochures, and print materials that carry your brand.',
    '<path d="M6 8V3h12v5M6 17H3v-6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6h-3M17 11h1"/><path d="M6 14h12v7H6z"/>'],
];
function renderPage(path) {
const logo = document.querySelector('.header-logo-image');
logo.src = path === '/' ? '/assets/bluechip-logo-white.webp' : '/assets/bluechip-logo.webp';
if(path==='/')main.innerHTML=`<section class="home-hero" aria-labelledby="home-hero-title">
  <div class="home-hero-content">
    <h1 id="home-hero-title">Every business<br> has a next chapter.</h1>
    <p>We help businesses launch, grow, and refresh their brand with design, signage, websites, and production that make a lasting impression.</p>
    <div class="home-hero-actions">
      <a class="home-button" href="/start">Let’s talk about your project <span aria-hidden="true">›</span></a>
      <a class="home-hero-link" href="#portfolio">Explore our work <span aria-hidden="true">›</span></a>
    </div>
  </div>
</section>
<section class="home-hero-intro" aria-labelledby="home-hero-intro-title">
  <div class="home-hero-intro-copy">
    <h2 id="home-hero-intro-title">A full-service creative partner.</h2>
    <p>From brand identity and websites to signage and production, we bring every piece together for a consistent, professional presence.</p>
  </div>
  <div class="home-hero-service-grid">
    ${homeServices.map(([slug, name, description, icon]) => `
      <a class="home-hero-service" href="/services/${slug}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
        <h3>${name}</h3>
        <p>${description}</p>
        <span class="home-hero-service-arrow" aria-hidden="true">→</span>
      </a>`).join('')}
  </div>
</section>
<section class="section"><div class="section-heading"><h2 class="home-work-title">Check Out Our Work</h2></div>${work(true)}</section>
<section id="eclair-project" class="eclair-showcase" aria-label="Éclair Bakery project">
  <div class="eclair-preview">
    <button class="eclair-cover" type="button" aria-label="View Éclair Bakery project" aria-controls="eclair-gallery" aria-expanded="false"></button>
    <figure class="home-testimonial">
      <span class="home-testimonial-mark" aria-hidden="true">“</span>
      <blockquote>
        <p>I just had to let you know that everyone LOVED your work!</p>
        <p>Honestly, no one expected you to come up with something like this, and you did such a fantastic job! You really helped us get past that stage where we felt stuck and didn’t know how to bring everything together.</p>
        <p>Thank you so much for all the work you put into this. We really appreciate it!</p>
      </blockquote>
      <figcaption>Éclair Bakery</figcaption>
    </figure>
  </div>
  <div id="eclair-gallery" class="eclair-gallery" inert>
    <div class="eclair-slides" role="region" aria-label="Éclair Bakery presentation slides" tabindex="0">
      <div class="eclair-slide"><img src="/assets/eclair/slide-1.webp" width="1680" height="1088" alt="Iced latte campaign with Éclair Bakery bags and cups" loading="lazy" decoding="async"></div>
    </div>
    <div class="eclair-gallery-controls">
      <button type="button" data-slide-step="-1" aria-label="Previous slide">←</button>
      <span class="eclair-slide-status" aria-live="polite"></span>
      <button type="button" data-slide-step="1" aria-label="Next slide">→</button>
    </div>
  </div>
</section>
<section class="chapter-section"><div class="chapter-heading"><h2>What can we help you <span>create?</span></h2><p>Big plans, small projects, and everything in between. Tell us what you’re working on.</p></div><div class="chapter-cards"><a class="chapter-card chapter-launch" href="/start?service=launch"><span class="chapter-label">01 / LAUNCH</span><h3>Starting something new?</h3><p>From your first logo to your opening-day essentials, we’ll help bring your business to life.</p><span class="chapter-link">Let’s launch &gt;</span><img src="/assets/cold-harbor-2.webp" alt="" loading="lazy"></a><a class="chapter-card chapter-refresh" href="/start?service=refresh"><span class="chapter-label">02 / REFRESH</span><h3>Ready for a fresh look?</h3><p>Give your business a fresh identity that reflects where you’re headed.</p><span class="chapter-link">Let’s refresh &gt;</span><span class="chapter-graphic" aria-hidden="true">NEXT<br>CHAPTER.</span></a></div><div class="chapter-other-strip"><div><h3>Just need something done?</h3><p>From a single sign to a custom website, no project needs to be a complete rebrand.</p></div><a href="/start">Tell us what you need &gt;</a></div></section>`;
else if (path === '/work') main.innerHTML = `<section class="section work-feed">
  <h1>Work</h1>
  <div class="portfolio-wireframe work-portfolio" id="portfolio">
    <div class="work-filters" role="group" aria-label="Filter work">
      <button type="button" data-work-filter="all" aria-pressed="true" aria-controls="work-results">All media</button>
      <button type="button" data-work-filter="case-studies" aria-pressed="false" aria-controls="work-results">Case studies</button>
    </div>
    <div class="portfolio-board" id="work-results" aria-label="Portfolio media"></div>
    <span class="board-status" role="status" aria-live="polite"></span>
  </div>
</section>`;
else if(path==='/services')main.innerHTML=heading('WHAT WE DO','Three disciplines.<br>One creative partner.','Build a brand, take it online, bring it into the world.')+`<section class="section" style="padding-top:0">${panels()}</section>`+launch()+cta();
else if(path.startsWith('/services/')&&services[path.split('/')[2]]){const k=path.split('/')[2],v=services[k];main.innerHTML=heading('SERVICES',v[0]+'.',v[1])+`<section class="content-section"><h2>Designed around your business.</h2><p>We start by understanding your business, audience, and goals. You review the work at agreed stages, with clear expectations from the first conversation.</p>${btn('Start a '+(k==='websites'?'website':k)+' project','/start?service='+k)}</section><section class="content-section"><h2>Typical deliverables</h2><div class="deliverables">${v[2].split(' · ').map(t=>`<span>${t}</span>`).join('')}</div></section><section class="content-section"><h2>A clear process.</h2><p>Discover > Define > Design > Deliver</p><details><summary>How much does it cost?</summary><p>Every project is scoped individually. Deliverables, timeline, and cost are agreed before work begins.</p></details><details><summary>Can you connect this to our other creative work?</summary><p>Yes. Our services can be designed together under one creative direction. Bluechip Launch brings the pieces together.</p></details>${k==='signage'?'<details><summary>Who handles fabrication and installation?</summary><p>Bluechip designs and coordinates with fabricators and installers. Production costs and permit responsibilities are set in your project scope.</p></details>':''}</section><section class="content-section">${link('Explore Bluechip Launch','/launch')}</section>`+cta();}
else if(path==='/launch')main.innerHTML=heading('BLUECHIP LAUNCH','From first idea.<br>To first impression.','Your brand identity, website, and launch materials, designed as one custom project.')+launch()+`<section class="section together">${natty()}</section><section class="content-section"><h2>What’s included is agreed together.</h2><p>One scope, one timeline, and one point of contact. Nothing is premade: every brand is designed for the business it belongs to.</p><h2>Outside the creative scope</h2><p>Business formation, legal work, regulatory approvals, manufacturing, inventory, sourcing, sign fabrication and installation, and marketing campaigns are not included unless separately agreed.</p>${[['How much does it cost?','We quote after a first conversation, based on the stages and applications you need.'],['How long does it take?','Your proposal includes a timeline based on your agreed scope.'],['Can I skip a stage?','Yes. If you already have a logo or a website, we scope around what exists.'],['How involved will I be?','You join discovery and review work at set points. We coordinate the work between those conversations.']].map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>`+cta();
else if(path==='/about')main.innerHTML=heading('ABOUT BLUECHIP','Good businesses<br>deserve good design.','An independent branding, website, and signage studio in Massachusetts, founded by Niko.')+founder()+`<section class="content-section"><h2>How we work</h2>${[['You talk to the designer.','The person in your first conversation is the person doing the work.'],['Scope comes first.','You get deliverables, timeline, and cost in writing before work begins.'],['You see work early.','We share direction before it’s polished, so feedback can still change it.'],['You know who else is involved.','Fabricators, installers, and printers are coordinated partners.']].map(([t,d])=>`<details open><summary>${t}</summary><p>${d}</p></details>`).join('')}</section>`+cta();
else if(path.startsWith('/work/')&&(path==='/work/natty'||projects.some(p=>p[0]===path.split('/')[2]))){const p=projects.find(p=>p[0]===path.split('/')[2]);main.innerHTML=heading('SELECTED WORK',p?p[1]:'Natty',p?'A selection of design work from the Bluechip portfolio.':'Consumer wellness · Brand identity and packaging · Created by Bluechip’s founder')+`<section class="section project-gallery" style="padding-top:0">${projectImages[path.split('/')[2]].map((src,i)=>`<img src="${src}" alt="${p?p[1]:'Natty'} project artwork ${i+1}" loading="lazy">`).join('')}</section>`+cta();}
else if(path==='/start')main.innerHTML=heading('LET’S GET STARTED','Start a project.','Tell us what you’re working on, then book a free consultation or send your inquiry.')+`<section class="section" style="padding-top:0"><a href="/start" class="button" data-project-entry>Start a project <span>&gt;</span></a></section>`;
else main.innerHTML=heading('404','A little off course.','That page doesn’t exist.')+`<section class="section">${btn('Back to home','/')}</section>`;
 if (path === '/') wireEclairShowcase();
 document.title = path === '/' ? 'Bluechip — Branding, Websites & Signage' : `${main.querySelector('h1')?.textContent || 'Page'} | Bluechip`;
}

function wireEclairShowcase() {
 const showcase = main.querySelector('.eclair-showcase');
 const preview = showcase.querySelector('.eclair-preview');
 const cover = showcase.querySelector('.eclair-cover');
 const gallery = showcase.querySelector('.eclair-gallery');
 const slides = showcase.querySelector('.eclair-slides');
 const status = showcase.querySelector('.eclair-slide-status');
 const [previous, next] = showcase.querySelectorAll('[data-slide-step]');
 const descriptions = [
   'Éclair Bakery logo on a burgundy pattern',
   'Brand guidelines with logo variations, colors, and typefaces',
   'Fresh éclairs campaign with branded cups and pastry box',
   'Éclair Bakery storefront sign and iced latte cup',
   'Buy one, get one promotion with napkins and an iced latte',
 ];
 const slideCount = descriptions.length + 1;
 let current = 0;
 let target = 0;
 let revealMode = null;
 let hoverDismissed = false;
 let hoverExitTimer;

 function updateStatus(index) {
   current = index;
   status.textContent = `${index + 1} / ${slideCount}`;
   previous.disabled = index === 0;
   next.disabled = index === slideCount - 1;
 }

 function stepSlide(direction) {
   target = Math.max(0, Math.min(slideCount - 1, target + direction));
   slides.scrollTo({ left: slides.clientWidth * target, behavior: 'auto' });
 }

 function reveal(mode) {
   if (revealMode) return;
   if (slides.children.length === 1) {
     descriptions.forEach((description, index) => {
       const slide = document.createElement('div');
       slide.className = 'eclair-slide';
       const image = new Image(1680, 1088);
       image.alt = description;
       image.loading = 'lazy';
       image.decoding = 'async';
       image.src = `/assets/eclair/slide-${index + 2}.webp`;
       slide.append(image);
       slides.append(slide);
     });
   }
   revealMode = mode;
   cover.setAttribute('aria-expanded', 'true');
   preview.inert = true;
   gallery.inert = false;
   showcase.dataset.revealed = mode;
   updateStatus(current);
   if (mode === 'activated') slides.focus({ preventScroll: true });
 }

 function conceal() {
   clearTimeout(hoverExitTimer);
   if (!revealMode) return;
   const returnFocus = gallery.contains(document.activeElement);
   revealMode = null;
   delete showcase.dataset.revealed;
   gallery.inert = true;
   preview.inert = false;
   cover.setAttribute('aria-expanded', 'false');
   if (returnFocus) cover.focus({ preventScroll: true });
 }

 // Only reveal when the mouse moves onto the artwork. Scrolling the card
 // under a stationary cursor can otherwise trigger repeated layout changes.
 cover.addEventListener('pointermove', event => {
   if (event.pointerType === 'mouse' && !hoverDismissed) reveal('hover');
 });
 cover.addEventListener('click', () => reveal('activated'));
 showcase.addEventListener('pointerenter', event => {
   if (event.pointerType === 'mouse') clearTimeout(hoverExitTimer);
 });
 showcase.addEventListener('pointerleave', event => {
   if (event.pointerType !== 'mouse') return;
   hoverDismissed = false;
   if (revealMode === 'hover') hoverExitTimer = setTimeout(conceal, 90);
 });
 slides.addEventListener('click', () => {
   if (revealMode === 'activated') conceal();
 });

 previous.addEventListener('click', () => stepSlide(-1));
 next.addEventListener('click', () => stepSlide(1));
 slides.addEventListener('scroll', () => {
   if (!slides.clientWidth) return;
   const index = Math.round(slides.scrollLeft / slides.clientWidth);
   if (index !== current) updateStatus(index);
 }, { passive: true });
 slides.addEventListener('scrollend', () => { target = current; });
 gallery.addEventListener('keydown', event => {
   if (event.key === 'Escape') {
     hoverDismissed = showcase.matches(':hover');
     conceal();
   }
   if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
     event.preventDefault();
     stepSlide(event.key === 'ArrowLeft' ? -1 : 1);
   }
 });
}
renderPage(pagePath(location.pathname));

const toggle=document.querySelector('#services-toggle'),drop=document.querySelector('.dropdown');const servicesNav=document.querySelector('.nav-services');const setServices=open=>{drop.hidden=!open;toggle.setAttribute('aria-expanded',String(open))};servicesNav.addEventListener('mouseenter',()=>setServices(true));servicesNav.addEventListener('mouseleave',()=>{if(!servicesNav.contains(document.activeElement))setServices(false)});servicesNav.addEventListener('focusin',e=>{if(e.target!==toggle)setServices(true)});servicesNav.addEventListener('focusout',e=>{if(!servicesNav.contains(e.relatedTarget))setServices(false)});toggle.onclick=()=>{drop.hidden=!drop.hidden;toggle.setAttribute('aria-expanded',String(!drop.hidden))};document.addEventListener('click',e=>{if(!e.target.closest('.nav-services')){drop.hidden=true;toggle.setAttribute('aria-expanded','false')}});document.addEventListener('keydown',e=>{if(e.key==='Escape'){drop.hidden=true;toggle.setAttribute('aria-expanded','false')}});const dialog=document.querySelector('#mobile-menu'),menu=document.querySelector('#menu');menu.onclick=()=>{dialog.showModal();menu.setAttribute('aria-expanded','true')};document.querySelector('#close-menu').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{menu.setAttribute('aria-expanded','false');menu.focus()});

// Natty–Niko header interaction, adapted to the static Bluechip navigation.
{
 const header=document.querySelector('.natty-header');
 const mobileDialog=document.querySelector('#mobile-menu');
 const trigger=document.querySelector('#menu');
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const surface = header.querySelector('.header-surface');
 const action = header.querySelector('.nav-cta');
 const bridge = header.querySelector('.header-merge path');
 const bridgeColor = header.querySelector('#header-merge-color');
 let closeTimer, scrollFrame = 0;
 let mergeFrame = 0;
 let scrolled = false;

 function animateHeaderMerge(wasJoined) {
   cancelAnimationFrame(mergeFrame);
   const end = performance.now() + 360;
   if (!action.style.getPropertyValue('--capsule-opacity')) {
     action.style.setProperty('--capsule-opacity', wasJoined ? 0 : 1);
     action.style.setProperty('--merge-label', wasJoined ? '#00529c' : 'white');
   }

   function draw(now) {
     if (now >= end || reduceMotion.matches) {
       bridge.removeAttribute('d');
       action.style.removeProperty('--capsule-opacity');
       action.style.removeProperty('--merge-label');
       return;
     }

     const frame = header.getBoundingClientRect();
     const pill = surface.getBoundingClientRect();
     const capsule = action.getBoundingClientRect();
     // On mobile the surface reaches the capsule from the menu side.
     const mobile = frame.width < 1024;
     const direction = mobile ? -1 : 1;
     const pillEdge = mobile ? pill.left : pill.right;
     const capsuleEdge = mobile ? capsule.right : capsule.left;
     const gap = (capsuleEdge - pillEdge) * direction;
     const covered = Math.max(0, Math.min(1, -gap / (capsule.width * .8)));
     action.style.setProperty('--capsule-opacity', 1 - covered);
     action.style.setProperty('--merge-label', covered < .48 ? 'white' : '#00529c');

     const reach = 96;
     const radius = Math.min(pill.height, capsule.height) / 2;
     if (gap < reach && gap > -radius && radius > 0) {
       const strength = Math.min(1, (reach - gap) / reach);
       const a = pillEdge - frame.left - direction * radius * .65;
       const b = capsuleEdge - frame.left + direction * radius * .65;
       const ay = pill.top - frame.top + pill.height / 2;
       const by = capsule.top - frame.top + capsule.height / 2;
       const neck = radius * .62 * strength;
       const edge = radius * (.28 + .48 * strength);
       const mid = (a + b) / 2;
       const center = (ay + by) / 2;
       bridgeColor.setAttribute('x1', mobile ? '100%' : '0%');
       bridgeColor.setAttribute('x2', mobile ? '0%' : '100%');
       bridge.setAttribute('opacity', strength * Math.min(1, 1 + gap / radius) * Number(getComputedStyle(surface).opacity));
       bridge.setAttribute('d', `M ${a} ${ay - edge}
         C ${mid} ${ay - edge} ${mid} ${center - neck} ${mid} ${center - neck}
         S ${mid} ${by - edge} ${b} ${by - edge}
         L ${b} ${by + edge}
         C ${mid} ${by + edge} ${mid} ${center + neck} ${mid} ${center + neck}
         S ${mid} ${ay + edge} ${a} ${ay + edge} Z`);
     } else {
       bridge.removeAttribute('d');
     }
     mergeFrame = requestAnimationFrame(draw);
   }

   mergeFrame = requestAnimationFrame(draw);
 }

 function syncHeader() {
   const hero = main.querySelector('.home-hero');
   scrolled = scrollY > 0;
   // On Home, give the services section room before the gallery takes over.
   const galleryEntry = hero ? Math.min(innerHeight * .25, 180) : innerHeight * .75;
   const galleryExit = hero ? galleryEntry : innerHeight * .25;
   const compact = scrolled && [...main.querySelectorAll('.client-viewport, .client-detail')].some(media => {
     const bounds = media.getBoundingClientRect();
     return bounds.height > 0 && bounds.top <= galleryEntry && bounds.bottom > galleryExit;
   });
   const wasJoined = header.dataset.expanded === 'true' || header.dataset.mediaCompact === 'true';
   if (header.dataset.expanded !== undefined && scrolled !== wasJoined && !reduceMotion.matches) {
     animateHeaderMerge(wasJoined);
   }
   header.dataset.expanded = String(scrolled && !compact);
   header.dataset.mediaCompact = String(compact);
 }
 function queueHeaderSync() {
   if (scrollFrame) return;
   scrollFrame = requestAnimationFrame(() => {
     scrollFrame = 0;
     syncHeader();
   });
 }
 window.addEventListener('scroll', queueHeaderSync, { passive: true });
 window.addEventListener('resize', queueHeaderSync);
 document.addEventListener('bluechip:media-layout', queueHeaderSync);
 document.addEventListener('bluechip:render', queueHeaderSync);
 syncHeader();

 function wireSelector(container) {
   const indicator = container.querySelector('.nav-indicator');
   const indicatorLabels = indicator && document.createElement('span');
   if (indicatorLabels) {
     indicatorLabels.className = 'nav-indicator-labels';
     indicatorLabels.inert = true;
     indicator.append(indicatorLabels);
   }
   const home = document.createElement('a');
   home.className = 'nav-home';
   home.href = '/';
   home.textContent = 'Home';
   const firstLink = container.querySelector('a');
   let items = [];
   let active;

   function select(item) {
     const index = items.indexOf(item);
     container.dataset.preview = String(index >= 0);
     container.style.setProperty('--nav-index', Math.max(0, index));
     items.forEach(link => { link.dataset.preview = String(link === item); });
   }

   function update() {
     const path = pagePath(location.pathname);
     if (path === '/') home.remove();
     else if (!home.isConnected) container.insertBefore(home, firstLink);
     items = [...container.children].filter(item => item.matches('a,.nav-services'));
     if (indicatorLabels) {
       indicatorLabels.replaceChildren(...items.map(item => {
         const label = document.createElement('span');
         const serviceLink = item.querySelector('a');
         label.textContent = (serviceLink || item).textContent;
         if (serviceLink) {
           const arrow = document.createElement('span');
           arrow.className = 'nav-indicator-arrow';
           arrow.textContent = item.querySelector('button').textContent;
           label.append(arrow);
         }
         return label;
       }));
     }
     active = items.find(item => {
       const href = (item.matches('a') ? item : item.querySelector('a')).getAttribute('href');
       return path === href || path.startsWith(href + '/');
     });
     for (const item of items) {
       const anchor = item.matches('a') ? item : item.querySelector('a');
       if (item === active) anchor.setAttribute('aria-current', 'page');
       else anchor.removeAttribute('aria-current');
     }
     select(active);
   }

   [...container.children].filter(item => item.matches('a,.nav-services')).concat(home).forEach(item => {
     item.addEventListener('pointerenter', () => select(item));
     item.addEventListener('focusin', () => select(item));
   });
   container.addEventListener('pointerleave', () => select(active));
   container.addEventListener('focusout', event => { if (!container.contains(event.relatedTarget)) select(active); });
   document.addEventListener('bluechip:render', update);
   update();
 }
 wireSelector(header.querySelector('nav'));
 wireSelector(mobileDialog.querySelector('.mobile-island-links'));
 document.addEventListener('bluechip:before-render', () => {
   setServices(false);
   clearTimeout(closeTimer);
   if (mobileDialog.open) mobileDialog.close();
   delete mobileDialog.dataset.closing;
   trigger.setAttribute('aria-expanded', 'false');
 });
 function closeIsland(){if(!mobileDialog.open||mobileDialog.dataset.closing==='true')return;mobileDialog.dataset.expanded=String(scrolled);mobileDialog.dataset.closing='true';trigger.setAttribute('aria-expanded','false');const duration=reduceMotion.matches?0:scrolled?420:480;closeTimer=setTimeout(()=>{mobileDialog.close();delete mobileDialog.dataset.closing;trigger.focus({preventScroll:true})},duration)}
 trigger.onclick=()=>{if(mobileDialog.open){closeIsland();return}clearTimeout(closeTimer);delete mobileDialog.dataset.closing;mobileDialog.dataset.expanded=String(scrolled);mobileDialog.showModal();trigger.setAttribute('aria-expanded','true')};
 document.querySelector('#close-menu').onclick=closeIsland;
 mobileDialog.addEventListener('cancel',e=>{e.preventDefault();closeIsland()});
 mobileDialog.addEventListener('click',e=>{if(e.target===mobileDialog){const r=mobileDialog.getBoundingClientRect();if(e.clientY>r.bottom||e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)closeIsland()}});
 const desktopQuery=matchMedia('(min-width:1024px)');desktopQuery.addEventListener('change',e=>{if(e.matches&&mobileDialog.open){clearTimeout(closeTimer);mobileDialog.close();delete mobileDialog.dataset.closing;trigger.setAttribute('aria-expanded','false')}});
}
