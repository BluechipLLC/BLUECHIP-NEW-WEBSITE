(() => {
 const host=document.querySelector('.portfolio-wireframe');if(!host)return;
 const grid=host.querySelector('.portfolio-board');grid.className='client-board';grid.setAttribute('aria-label','Client projects');
 host.querySelector('.project-presentation')?.remove();host.querySelector('.board-caption span').textContent='SELECTED CLIENTS';host.querySelector('.board-intro').textContent='A selection of businesses and brands we have worked with.';
 const clients=[
 ['Cold Harbor','#173e39','cold-harbor'],['Natty','#d2242d','natty'],['The Den','#25201b','the-den'],['Cafe Owned By','#102b43','owned-by'],['Conway’s Landscaping','#426f39','conways'],['Bradley Landscaping','#334d32'],['Monson Self Storage','#4a5560'],['Eastern Security Safe','#354554'],['Shuflr','#38567a'],['Macy Lee','#c4222b'],['Alexis Rose Photography','#514445'],['Mackoul Electric','#344a59'],['Why Buy Rentals','#3f4c9c'],['Tree Wizard','#3a543d'],['Aqua Dreams','#387e96'],['Shlerk','#15182d'],['Mestek','#4d5a64'],['Dargie’s Vinyl Dreams','#52565c'],['Elite Tree & Snow','#536357'],['Lunch Ladies','#68625a'],['Italian Feast','#625b56'],['Richard Neal','#465261']
 ];
 const ratios=[16/9,1,3/4,1,3/2,2/3,1,4/3,16/9,1,3/4,1,3/2,1,2/3,4/3,16/9,3/4,1,1];
 let shown=0;const viewport=document.createElement('div');viewport.className='client-viewport';grid.before(viewport);viewport.append(grid);
 const wall=document.createElement('div');wall.className='board-blur-wall';const more=document.createElement('button');more.type='button';more.className='button board-load-more';more.textContent='Load more';wall.append(more);viewport.after(wall);
 const status=host.querySelector('.board-status');
 function render(){grid.replaceChildren();clients.slice(0,shown).forEach(([name,color,url],i)=>{const tile=document.createElement(url?'a':'div');tile.className='client-tile';tile.style.backgroundColor=color;tile.style.aspectRatio=ratios[i%ratios.length];if(url)tile.href='/work/'+url;const label=document.createElement('strong');label.textContent=name;tile.append(label);if(url){const action=document.createElement('span');action.textContent='See more ↗';tile.append(action)}grid.append(tile)});wall.hidden=shown>=clients.length;status.textContent=`${shown} of ${clients.length} clients shown.`}
 more.addEventListener('click',()=>{shown=Math.min(shown+4,clients.length);render()});shown=Math.min(16,clients.length);render();
})();
