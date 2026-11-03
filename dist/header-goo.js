import { MetaballEngine } from './metaballs.js';
const header=document.querySelector('.natty-header'),pill=header?.querySelector('.header-surface'),cta=header?.querySelector('.nav-cta');
if(header&&pill&&cta&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const canvas=document.createElement('canvas');canvas.className='header-goo';canvas.setAttribute('aria-hidden','true');header.prepend(canvas);
 const engine=new MetaballEngine(canvas,{reach:1.35,spread:.5,handleSize:2.4});let raf=0;
 function sample(){const r=header.getBoundingClientRect(),p=pill.getBoundingClientRect(),b=cta.getBoundingClientRect();engine.resize(r.width,150);const radius=p.height/2;engine.setBlob('cap',{x:p.right-radius-r.left,y:p.top+p.height/2-r.top,r:radius,color:'rgba(255,255,255,0.94)'},{instant:true});engine.setBlob('button',{x:b.left+b.width/2-r.left,y:b.top+b.height/2-r.top,r:b.height/2+5,color:'rgba(255,255,255,0.94)'},{instant:true})}
 function animate(){cancelAnimationFrame(raf);const start=performance.now();function tick(now){sample();if(now-start<850)raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)}
 new MutationObserver(animate).observe(header,{attributes:true,attributeFilter:['data-expanded']});addEventListener('resize',animate,{passive:true});animate();
}
