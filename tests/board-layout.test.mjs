import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({});vm.runInContext(readFileSync(new URL('../dist/board-layout.js',import.meta.url),'utf8')+';globalThis.layout=BoardLayout;',context);const L=context.layout;
assert.equal(L.cards.length,20);
for(const [tier,count] of [['hero',5],['supporting',9],['detail',6]])assert.equal(L.cards.filter(c=>c.tier===tier).length,count);
let cases=0,samples=0;
for(const [mode,width] of [['desktop',1382],['laptop',1152],['laptop',922],['tablet',736],['mobile',282],['mobile',343]]){
 const base=L.plan(mode,width);
 const order=base.map((_,i)=>i).sort((a,b)=>base[a].y-base[b].y||base[a].x-base[b].x);
 const states=[base];
 for(let i=0;i<20;i++)for(const kind of ['selected','hover']){
  const boxes=L.plan(mode,width,{[kind]:i});L.validate(boxes,width,L.profiles[mode].gap);
  boxes.forEach((b,j)=>assert(Math.abs(b.w/b.h-L.ratios[j])<1e-10,'distorted ratio'));
  assert.equal(JSON.stringify(boxes),JSON.stringify(L.plan(mode,width,{[kind]:i})));
  if(kind==='selected'&&mode!=='mobile')boxes.forEach((b,j)=>{if(j!==i)assert(b.x>=boxes[i].w+L.profiles[mode].gap-.1,'preview must move right of presentation')});
  states.push(boxes);cases++;
 }
 assert(L.unused(base,width).emptyFraction<.09);
 console.log(mode,width,'unused including gutters:',(100*L.unused(base,width).emptyFraction).toFixed(2)+'%');
 // Expand, collapse, change selected card, and interrupt a transition midway.
 for(let i=1;i<states.length;i++)for(const [a,b] of [[base,states[i]],[states[i],base],[states[i],states[(i+1)%states.length]]]){
  const route=L.waypoints(a,b,L.profiles[mode].gap,order);
  for(let j=1;j<route.length;j++)for(let f=0;f<=10;f++){
   const t=f/10,frame=route[j-1].map((b,i)=>Object.fromEntries(['x','y','w','h'].map(k=>[k,b[k]+(route[j][i][k]-b[k])*t])));
   if(L.canInterpolate(a,b,L.profiles[mode].gap))L.validate(frame,width,L.profiles[mode].gap);
   assert.equal(route.length,2,'movement must not stop at intermediate waypoints');
   frame.forEach((b,i)=>assert(Math.abs(b.w/b.h-L.ratios[i])<1e-8));samples++;
   if(f===5){const interrupted=L.waypoints(frame,base,L.profiles[mode].gap,order);assert.equal(JSON.stringify(interrupted[0]),JSON.stringify(frame),'interruption must start at current visual position')}
  }
 }
}
assert.equal(L.animationOptions(true),null);
console.log(`${cases} layouts and ${samples} motion samples passed: fixed ratios, settled collisions, right-side previews, deterministic restoration, continuous interruptions and reduced motion.`);
// Full-height presentation containers must fit all content at rest.
for(const [mode,width] of [['desktop',1382],['tablet',736],['mobile',343]])for(let i=0;i<20;i++){
 const a=L.plan(mode,width),b=L.plan(mode,width,{selected:i,expandedHeight:1800});
 const order=a.map((_,j)=>j).sort((j,k)=>a[j].y-a[k].y||a[j].x-a[k].x);
 assert(b[i].h>=1800);L.validate(b,width,L.profiles[mode].gap);
 for(const [start,end] of [[a,b],[b,a]]){const path=L.waypoints(start,end,L.profiles[mode].gap,order);assert.equal(path.length,2);}
}
console.log('Continuous single-pass motion and full-height presentations passed.');
