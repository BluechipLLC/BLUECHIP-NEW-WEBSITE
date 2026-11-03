/* Deterministic, lane-constrained rectangle packing. Coordinates are CSS pixels.
   Stable lane/order constraints give each pair a shared separating axis at both
   ends of a transition, so synchronized interpolation remains collision-free. */
const BoardLayout = (() => {
 const cards=Array.from({length:20},(_,i)=>({
  project:Math.floor(i/4),tier:i%4===0?'hero':([3,7,11,15,18,19].includes(i)?'detail':'supporting'),
  ratio:[16/9,1,3/4,1,3/2,2/3,1,4/3,16/9,1,3/4,1,3/2,1,2/3,4/3,16/9,3/4,1,1][i],
  label:i%4===0?'Project overview':['Project overview','Primary view','Project detail','Additional view'][i%4]
 }));
 const ratios=cards.map(c=>c.ratio);
 const profiles={desktop:{gap:16},laptop:{gap:14},tablet:{gap:12},mobile:{gap:10}};
 const profile=w=>w>=1440?'desktop':w>=1024?'laptop':w>=768?'tablet':'mobile';
 function overlaps(a,b,gap=0){return a.x<b.x+b.w+gap-.05&&b.x<a.x+a.w+gap-.05&&a.y<b.y+b.h+gap-.05&&b.y<a.y+a.h+gap-.05}
 function validate(boxes,width,gap){for(let i=0;i<boxes.length;i++){const a=boxes[i];if(a.x<-.1||a.y<-.1||a.x+a.w>width+.1||a.w<=0||a.h<=0)throw Error('Out-of-bounds project rectangle');for(let j=0;j<i;j++)if(overlaps(a,boxes[j],gap))throw Error('Project collision')}return true}
 function plan(mode,width,{selected=-1,hover=-1,expandedHeight=0}={}){
  if(selected>=0){
   const {gap}=profiles[mode],mobile=mode==='mobile';
   // Each project opens as its own presentation, not as an enlarged rail.
   const desired=[.60,.56,.58,.57,.60][cards[selected].project];
   const mainWidth=mobile?width:Math.min(960,width*desired);
   const boxes=Array(cards.length);
   boxes[selected]={x:0,y:0,w:mainWidth,h:Math.max(mainWidth/ratios[selected],expandedHeight),ratio:ratios[selected]};
   const sideX=mobile?0:mainWidth+gap,sideWidth=mobile?width:width-sideX;
   const cols=sideWidth>=380?2:mobile&&width>=320?2:1;
   const w=(sideWidth-gap*(cols-1))/cols,ys=Array(cols).fill(mobile?boxes[selected].h+gap:0);
   const base=plan(mode,width);
   const order=cards.map((_,i)=>i).sort((a,b)=>base[a].y-base[b].y||base[a].x-base[b].x);
   if(mobile){
    let y=0;const cursor=order.indexOf(selected),columns=width>=320?2:1;
    const section=ids=>{for(let k=0;k<ids.length;k+=columns){const group=ids.slice(k,k+columns),w=(width-gap*(columns-1))/columns;let h=0;group.forEach((i,l)=>{boxes[i]={x:l*(w+gap),y,w,h:w/ratios[i],ratio:ratios[i]};h=Math.max(h,boxes[i].h)});y+=h+gap}};
    section(order.slice(0,cursor));boxes[selected].y=y;y+=boxes[selected].h+gap;section(order.slice(cursor+1));validate(boxes,width,gap);return boxes;
   }
   order.filter(i=>i!==selected).forEach(i=>{const lane=ys.indexOf(Math.min(...ys)),h=w/ratios[i];boxes[i]={x:sideX+lane*(w+gap),y:ys[lane],w,h,ratio:ratios[i]};ys[lane]+=h+gap});
   validate(boxes,width,gap);return boxes;
  }
  const {gap}=profiles[mode],count=mode==='mobile'?(width<320?1:2):mode==='tablet'?3:mode==='laptop'?3:4;
  const available=width-gap*(count-1);
  const weights=count===4?[.4,.2,.2,.2]:count===3?[.44,.28,.28]:count===2?[.56,.44]:[1];
  let base=weights.map(w=>w*available);const lanes=Array.from({length:count},()=>[]),heights=Array(count).fill(0);
  // Stable, curated hero rail; companion previews fill the shortest side rail.
  const add=(i,lane)=>{lanes[lane].push(i);heights[lane]+=base[lane]/ratios[i]+gap};
  cards.forEach((c,i)=>{if(c.tier==='hero')add(i,0)});
  [5,10,15,1,6,11,18,2,7,13,19,3,9,14,17].forEach(i=>{const lane=heights.indexOf(Math.min(...heights));add(i,lane)});
  // Solve proportional rail widths for a shared bottom edge, preserving ratios.
  const inverse=lanes.map(ids=>ids.reduce((sum,i)=>sum+1/ratios[i],0));
  const height=(available+lanes.reduce((sum,ids,l)=>sum+gap*(ids.length-1)/inverse[l],0))/inverse.reduce((sum,v)=>sum+1/v,0);
  base=lanes.map((ids,l)=>(height-gap*(ids.length-1))/inverse[l]);
  const active=selected>=0?selected:hover,lane=lanes.findIndex(ids=>ids.includes(active));
  let widths=base.slice();
  if(count>1&&lane>=0){
   const minimum=mode==='mobile'?125:mode==='tablet'?150:180;
   const wanted=selected>=0?available*.66:base[lane]*1.09;
   widths[lane]=Math.max(base[lane],Math.min(wanted,available-minimum*(count-1)));
   const remainder=available-widths[lane],others=available-base[lane];
   widths=widths.map((w,i)=>i===lane?w:base[i]*remainder/others);
  }
  const boxes=Array(cards.length);let x=0;
  lanes.forEach((ids,l)=>{let y=0;ids.forEach(i=>{const w=widths[l],h=w/ratios[i];boxes[i]={x,y,w,h,ratio:ratios[i]};y+=h+gap});x+=widths[l]+gap});
  validate(boxes,width,gap);return boxes;
 }
 function unused(boxes,width){const height=Math.max(...boxes.map(b=>b.y+b.h)),area=boxes.reduce((sum,b)=>sum+b.w*b.h,0);return {height,emptyFraction:1-area/(width*height)}}
 function canInterpolate(a,b,gap){return a.every((start,i)=>a.slice(i+1).every((other,k)=>{const end=b[i],endOther=b[i+k+1];return (start.x+start.w+gap<=other.x+.1&&end.x+end.w+gap<=endOther.x+.1)||(other.x+other.w+gap<=start.x+.1&&endOther.x+endOther.w+gap<=end.x+.1)||(start.y+start.h+gap<=other.y+.1&&end.y+end.h+gap<=endOther.y+.1)||(other.y+other.h+gap<=start.y+.1&&endOther.y+endOther.h+gap<=end.y+.1)}))}
 // A single uninterrupted interpolation preserves the visual origin on reversal.
 function waypoints(start,end){return [start,end]}
 const animationOptions=(reduced,kind='expand')=>reduced?null:{duration:kind==='hover'?200:kind==='collapse'?440:520,easing:'cubic-bezier(.2,.75,.25,1)'};
 return {cards,unused,ratios,profiles,profile,plan,validate,overlaps,canInterpolate,waypoints,animationOptions};
})();
