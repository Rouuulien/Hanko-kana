/* ---------- Dessins SVG des kana : modèle animé (ordre des traits) et aides au tracé ---------- */
import{KS}from'./strokes.js';
function modelSVG(c,o){o=o||{};const k=KS&&KS[c];if(!k)return'';const anim=o.anim!==false,st=o.speed||0.6;
  return`<svg class="model ${o.cls||''} ${anim?'anim':''}" viewBox="0 0 109 109" aria-hidden="true">${k.d.map((d,i)=>`<path d="${d}" pathLength="1" style="animation-delay:${(i*st).toFixed(2)}s"/>`).join('')}${o.nums===false?'':k.p.map((p,i)=>`<text x="${Math.max(2,p[0]-6)}" y="${Math.max(8,p[1]-3)}" style="animation-delay:${(i*st).toFixed(2)}s">${i+1}</text>`).join('')}</svg>`}
function aidSVG(c,aid,n,animFull){const k=KS&&KS[c];if(!k||aid<=0)return'';const N=k.d.length;let h='';
  if(aid>=3)return modelSVG(c,{cls:'hintm',anim:!!animFull,speed:.5})+(n<N?aidSVG(c,1,n):'');
  if(aid>=2)h+=k.d.map(d=>`<path class="g" d="${d}"/>`).join('');
  if(n<N){if(aid>=2)h+=`<path class="nx" d="${k.d[n]}" pathLength="1"/>`;const p=k.p[n];h+=`<circle cx="${p[0]}" cy="${p[1]}" r="4.4"/><text x="${p[0]}" y="${(p[1]+2.1).toFixed(1)}">${n+1}</text>`}
  return`<svg class="aid" viewBox="0 0 109 109" aria-hidden="true">${h}</svg>`}

export{modelSVG,aidSVG};
