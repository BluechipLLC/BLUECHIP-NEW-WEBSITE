(() => {
 const host=document.querySelector('.portfolio-wireframe');if(!host)return;
 const grid=host.querySelector('.portfolio-board'),status=host.querySelector('.board-status');
 const viewport=document.createElement('div');viewport.className='board-viewport';grid.before(viewport);viewport.append(grid);
 const wall=document.createElement('div');wall.className='board-blur-wall';
 const more=document.createElement('button');more.type='button';more.className='button board-load-more';more.textContent='Load more';wall.append(more);viewport.after(wall);
 let visibleCount=8,lastBoxes=[];
 function updateReveal(boxes=lastBoxes){if(!boxes.length)return;lastBoxes=boxes;const order=boxes.map((b,i)=>({i,y:b.y,x:b.x})).sort((a,b)=>a.y-b.y||a.x-b.x);const visible=new Set(order.slice(0,visibleCount).map(v=>v.i));if(selected>=0)visible.add(selected);cards.forEach((card,i)=>{card.style.visibility=visible.has(i)?'visible':'hidden';card.inert=!visible.has(i)});const bottom=Math.max(...[...visible].map(i=>boxes[i].y+boxes[i].h));viewport.style.height=bottom+'px';wall.hidden=visibleCount>=cards.length;}
 more.addEventListener('click',()=>{visibleCount=Math.min(visibleCount+4,cards.length);updateReveal();status.textContent=`${visibleCount} project previews shown.`});

 document.documentElement.classList.add('has-portfolio-board');
 let data=BoardLayout.cards.map((spec,i)=>({...boardProjects[spec.project],...spec,key:i}));
 host.querySelector('.project-presentation')?.remove();grid.className='collision-board';host.classList.add('collision-host');
 host.querySelector('.board-intro').textContent='Explore selected identities and the details behind each project.';
 let selected=-1,hovered=-1,mode=BoardLayout.profile(innerWidth),cards=[],animations=[],generation=0,resizeFrame=0,lastWidth=0,leaveTimer,pointerStart=null,dragged=false,scrollFrame=0,scrollEpoch=0,outsideGesture=null;
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){grid.replaceChildren();cards=data.map((p,i)=>{
  const card=document.createElement('article');card.className=`collision-card tone-${p.color}`;card.dataset.project=p.id;card.dataset.index=i;card.dataset.hierarchy=p.tier;
  const trigger=document.createElement('button');trigger.type='button';trigger.className='preview-trigger';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',`presentation-${i}`);
  trigger.style.backgroundImage=`linear-gradient(to top, rgba(0,0,0,.78), transparent 75%), url('${projectImages[p.id][i % projectImages[p.id].length]}')`;trigger.innerHTML=`<span class="preview-number">${String(i+1).padStart(2,'0')} / ${p.tier.toUpperCase()}</span><span class="preview-name">${esc(p.name)}</span><span class="preview-category">${esc(p.label)}</span><span class="preview-action">See more <span aria-hidden="true">↗</span></span>`;
  const detail=document.createElement('section');detail.id=`presentation-${i}`;detail.className='inline-presentation';detail.hidden=true;detail.setAttribute('aria-labelledby',`presentation-title-${i}`);
  detail.innerHTML=`<div class="inline-heading"><div><span class="eyebrow">PROJECT BOARD · SCROLL TO EXPLORE</span><h3 id="presentation-title-${i}" tabindex="-1">${esc(p.name)}</h3></div><button class="inline-close" type="button" aria-label="Close ${esc(p.name)} project">Close ×</button></div><p class="inline-services">${esc(p.category)}</p><p class="inline-description">${p.id==='natty'?'A consumer wellness brand created by Bluechip’s founder. One identity across digital, packaging, and real-world touchpoints.':'A selection of identity and design work from the Bluechip portfolio.'}</p><div class="application-grid">${p.items.map((item,j)=>`<div class="application-box application-${j}"><img src="${projectImages[p.id][j % projectImages[p.id].length]}" alt="${esc(p.name)} project artwork ${j+1}" loading="lazy"></div>`).join('')}</div><a class="inline-case-link" href="/work/${p.id}">View Full Project <span aria-hidden="true">↗</span></a>`;
  trigger.addEventListener('click',e=>{if(e.detail&&dragged)return;select(i)});
  trigger.addEventListener('focus',()=>{if(selected===-1){clearTimeout(leaveTimer);setHover(i)}});
  trigger.addEventListener('blur',()=>{if(selected<0)setHover(-1)});
  detail.querySelector('button').addEventListener('click',()=>select(-1));card.append(trigger,detail);grid.append(card);return card;
 })}
 // Update hover from real pointer movement, not from cards sliding under it.
 grid.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!finePointer.matches||selected>=0)return;clearTimeout(leaveTimer);const card=e.target.closest('.collision-card');if(card)setHover(Number(card.dataset.index))},{passive:true});
 grid.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&selected<0){clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>setHover(-1),60)}});
 // Only an intentional click can dismiss: record the actual hitbox at both ends
 // of the gesture, and ignore drags, scrolls and gestures begun during motion.
 const controls='a,button,input,textarea,select,label,summary,[role="button"],[role="link"],[contenteditable="true"]';
 const inside=(rect,x,y)=>x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;
 function stopScroll(){cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollEpoch++;grid.dataset.centering='false'}
 document.addEventListener('pointerdown',e=>{
  const wasCentering=grid.dataset.centering==='true';stopScroll();
  pointerStart={x:e.clientX,y:e.clientY};dragged=false;
  outsideGesture=selected>=0?{index:selected,id:e.pointerId,x:e.clientX,y:e.clientY,
   blocked:e.button!==0||!e.isPrimary||wasCentering||grid.dataset.animating==='true'||inside(cards[selected].getBoundingClientRect(),e.clientX,e.clientY)}:null;
 },{passive:true,capture:true});
 document.addEventListener('pointermove',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>9){dragged=true;if(outsideGesture)outsideGesture.blocked=true}},{passive:true,capture:true});
 document.addEventListener('pointercancel',()=>{dragged=true;pointerStart=null;outsideGesture=null},{passive:true});
 document.addEventListener('pointerup',e=>{pointerStart=null;if(outsideGesture&&outsideGesture.id!==e.pointerId)outsideGesture=null},{passive:true});
 document.addEventListener('scroll',()=>{if(outsideGesture)outsideGesture.blocked=true},{passive:true,capture:true});
 addEventListener('wheel',stopScroll,{passive:true});
 document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stopScroll()},{capture:true});
 document.addEventListener('click',e=>{
  const gesture=outsideGesture;outsideGesture=null;
  if(selected<0||!gesture||gesture.index!==selected||gesture.blocked||dragged||grid.dataset.animating==='true')return;
  const card=cards[selected];
  if(card.contains(e.target)||inside(card.getBoundingClientRect(),e.clientX,e.clientY))return;
  // Native project triggers switch directly. Other page controls retain their action.
  if(e.target.closest(controls))return;
  select(-1);
 });
 function centerProject(index,epoch){
  if(epoch!==scrollEpoch||selected!==index)return;
  const card=cards[index].getBoundingClientRect(),header=document.querySelector('.natty-header')?.getBoundingClientRect();
  const top=Math.max(0,header?.bottom||0)+16,bottom=innerHeight-16,available=Math.max(0,bottom-top);
  const destination=scrollY+card.top-(card.height>available?top:top+(available-card.height)/2);
  const target=Math.max(0,Math.min(destination,document.documentElement.scrollHeight-innerHeight)),from=scrollY;
  if(motion.matches||Math.abs(target-from)<1){scrollTo({top:target,behavior:'instant'});return}
  grid.dataset.centering='true';const started=performance.now();
  // Same cubic-bezier(.22,1,.36,1) as the board's movement.
  const ease=t=>{let lo=0,hi=1,u=t;for(let i=0;i<14;i++){u=(lo+hi)/2;const x=3*(1-u)*(1-u)*u*.22+3*(1-u)*u*u*.36+u*u*u;if(x<t)lo=u;else hi=u}return 1-Math.pow(1-u,3)};
  function tick(now){if(epoch!==scrollEpoch||selected!==index)return;const t=Math.min(1,(now-started)/240);scrollTo({top:from+(target-from)*ease(t),behavior:'instant'});if(t<1)scrollFrame=requestAnimationFrame(tick);else{scrollFrame=0;grid.dataset.centering='false'}}
  scrollFrame=requestAnimationFrame(tick);
 }
 function measured(){const r=grid.getBoundingClientRect();return cards.map(c=>{const b=c.getBoundingClientRect();return {x:b.left-r.left,y:b.top-r.top,w:b.width,h:b.height}})}
 function apply(boxes){cards.forEach((c,i)=>{const b=boxes[i];Object.assign(c.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px'});c.dataset.ratio=String(b.ratio);c.dataset.box=[b.x,b.y,b.w,b.h].map(n=>n.toFixed(3)).join(',')});grid.style.height=Math.max(...boxes.map(b=>b.y+b.h))+'px';updateReveal(boxes)}
 function layout(kind='expand',animate=true){
  stopScroll();
  const beforeHeight=grid.getBoundingClientRect().height;
  const run=++generation,before=measured(),wasOpen=cards.map(c=>c.classList.contains('is-expanded'));
  animations.forEach(a=>a.cancel());animations=[];
  const width=grid.clientWidth;lastWidth=width;grid.dataset.mode=mode;grid.dataset.state=selected>=0?'expanded':hovered>=0?'hover':'default';
  host.querySelector('.composition-label').textContent=mode.toUpperCase();
  const options={hover:hovered,selected};
  // Reveal at its destination width before measuring the true content height.
  const provisional=BoardLayout.plan(mode,width,options);
  cards.forEach((c,i)=>{
   const open=i===selected;c.classList.toggle('is-expanded',open);c.classList.toggle('is-hovered',i===hovered&&selected<0);
   c.querySelector('.preview-trigger').hidden=open;c.querySelector('.preview-trigger').setAttribute('aria-expanded',String(open));c.querySelector('.inline-presentation').hidden=!open;
   c.style.width=provisional[i].w+'px';
  });
  // The presentation is a content wrapper; its individual artwork boxes retain ratios.
  if(selected>=0)options.expandedHeight=cards[selected].querySelector('.inline-presentation').scrollHeight+2;
  const after=BoardLayout.plan(mode,width,options);apply(after);
  const timing=BoardLayout.animationOptions(motion.matches,kind);
  const validStart=before.every(b=>b.w>0&&b.h>0);
  // All previews share one timeline, reversing from their current visual positions.
  const safe=validStart&&BoardLayout.canInterpolate(before,after,BoardLayout.profiles[mode].gap);
  const route=validStart?BoardLayout.waypoints(before,after):[after];
  if(animate&&timing&&validStart){cards.forEach((card,i)=>{
   const a=before[i],b=after[i];if(safe&&Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.w-b.w)+Math.abs(a.h-b.h)<.05)return;
   const offsets=route.map((_,k)=>k/(route.length-1));
   // Neighbors lead slightly, opening space as the selected card grows.
   animations.push(card.animate(route.map((step,k)=>({left:step[i].x+'px',top:step[i].y+'px',width:step[i].w+'px',height:step[i].h+'px',opacity:1,zIndex:i===selected||wasOpen[i]?3:1,offset:offsets[k],easing:timing.easing})),{...timing,duration:timing.duration*(kind!=='hover'&&i!==selected&&!wasOpen[i] ? 0.84 : 1),easing:'linear'}));
   if(wasOpen[i]!== (i===selected)){
    const incoming=card.querySelector(i===selected?'.inline-presentation':'.preview-trigger');
    animations.push(incoming.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:180,delay:100,fill:'backwards',easing:'ease-out'}));
    // Keep a noninteractive copy of the departing content during the crossfade.
    const old=card.querySelector(wasOpen[i]?'.inline-presentation':'.preview-trigger').cloneNode(true);old.hidden=false;old.classList.add('departing-content');old.setAttribute('aria-hidden','true');old.inert=true;old.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));old.removeAttribute('id');old.style.width=a.w+'px';card.append(old);
    const fade=old.animate([{opacity:1},{opacity:0}],{duration:120,fill:'forwards'});animations.push(fade);fade.finished.catch(()=>{}).finally(()=>old.remove());
   }
  })}
  grid.dataset.animating=String(animations.length>0);
  // Reserve the larger extent while moving so content below cannot collide.
  if(animations.length){const offsets=route.map((_,k)=>k/(route.length-1));animations.push(grid.animate(route.map((step,k)=>({height:(k===0?beforeHeight:Math.max(...step.map(b=>b.y+b.h)))+'px',offset:offsets[k],easing:timing.easing})),{...timing,easing:'linear'}))}
  return Promise.allSettled(animations.map(a=>a.finished)).then(()=>{if(run===generation){apply(after);grid.dataset.animating='false';animations=[]}});
 }
 function setHover(index){}
 async function select(index){clearTimeout(leaveTimer);const closingScroll=scrollY;const previous=selected;selected=index;hovered=-1;const done=layout(index<0?'collapse':'expand');
  if(index>=0){cards[index].querySelector('h3').focus({preventScroll:true});status.textContent=`${data[index].name} expanded. Other projects have moved to make room.`}
  else if(previous>=0){ // Restore focus without re-triggering hover expansion.
   status.textContent='All twenty previews returned to the original layout.';
  }
  const run=generation,epoch=scrollEpoch;
  if(index<0){
   // Keep layout/focus corrections from dragging the viewport during collapse.
   // Any new pointer, wheel or scroll key cancels this immediately.
   const hold=()=>{if(run!==generation||epoch!==scrollEpoch)return;scrollTo({top:closingScroll,behavior:'instant'});if(grid.dataset.animating==='true')scrollFrame=requestAnimationFrame(hold)};hold();
  }
  await done;if(run!==generation||epoch!==scrollEpoch)return;
  cancelAnimationFrame(scrollFrame);scrollFrame=0;
  if(index<0)scrollTo({top:closingScroll,behavior:'instant'});
  if(index>=0)centerProject(index,epoch);
  else if(previous>=0){selected=-2;cards[previous].querySelector('.preview-trigger').focus({preventScroll:true});selected=-1;hovered=-1} // Restore focus only once its moving target has settled.
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){if(selected>=0){e.preventDefault();select(-1)}else if(hovered>=0)setHover(-1)}});
 function resize(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{const next=BoardLayout.profile(innerWidth);if(next!==mode||Math.abs(grid.clientWidth-lastWidth)>.5){mode=next;hovered=-1;layout('resize',false)}})}
 new ResizeObserver(resize).observe(grid);addEventListener('resize',resize);motion.addEventListener('change',()=>layout('preference',false));finePointer.addEventListener('change',()=>{if(!finePointer.matches)setHover(-1)});
 host.addEventListener('portfolio:projectschange',e=>{if(!Array.isArray(e.detail))return;data=data.map(p=>{const u=e.detail.find(x=>x.id===p.id);return u?{...p,category:typeof u.category==='string'?u.category:p.category,items:Array.isArray(u.items)?u.items.filter(x=>typeof x==='string'):p.items}:p});selected=hovered=-1;animations.forEach(a=>a.cancel());render();layout('data',false)});
 render();layout('initial',false);document.fonts?.ready.then(()=>layout('fonts',false));
})();
