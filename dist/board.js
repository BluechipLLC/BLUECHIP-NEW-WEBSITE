(() => {
 const host=document.querySelector('.portfolio-wireframe'); if(!host)return;
 const grid=host.querySelector('.portfolio-board');
 const specs=BoardLayout.cards;
 grid.className='portfolio-masonry'; grid.setAttribute('aria-label','Selected project previews');
 host.querySelector('.project-presentation')?.remove();
 host.querySelector('.board-intro').textContent='Explore selected identities and the details behind each project.';
 const button=document.createElement('button');button.type='button';button.className='button load-more';button.textContent='Load more';
 const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');
 grid.after(button,status);
 let shown=0;
 function addFour(){
  const end=Math.min(shown+4,specs.length);
  for(let i=shown;i<end;i++){
   const spec=specs[i],p=boardProjects[spec.project],card=document.createElement('a');
   card.className='masonry-card';card.href='/work/'+p.id;card.style.aspectRatio=String(spec.ratio);
   const img=document.createElement('img');img.src=projectImages[p.id][i%projectImages[p.id].length];img.alt='';img.loading=i<4?'eager':'lazy';
   const overlay=document.createElement('span');overlay.className='masonry-overlay';
   const title=document.createElement('strong');title.textContent=p.name;
   const action=document.createElement('span');action.className='masonry-action';action.textContent='See more ↗';
   overlay.append(title,action);card.append(img,overlay);grid.append(card);
  }
  shown=end;button.hidden=shown>=specs.length;status.textContent=`${shown} of ${specs.length} project previews shown.`;
 }
 button.addEventListener('click',addFour);addFour();
})();
