/* ---------- affichage de l'écran courant, montage de la zone de dessin, focus, voix ---------- */
import{S}from'../core/state.js';
import{LES}from'../data/kana.js';
import{KS,ksP,loadKS}from'../draw/strokes.js';
import{modelSVG}from'../draw/svg.js';
import{bClock,brushResV,brushV}from'../modes/brush.js';
import{cur}from'../modes/quiz.js';
import{rPaint,rushResV,rushV}from'../modes/rush.js';
import{ui}from'./app-state.js';
import{mountPad}from'./pad.js';
import{cardsV,homeV,quizV,resV,setV}from'./views.js';
import{say}from'./voice.js';
const app=document.getElementById('app');
function render(){app.innerHTML={home:homeV,cards:cardsV,quiz:quizV,res:resV,set:setV,rush:rushV,rushres:rushResV,brush:brushV,brushres:brushResV}[ui.view]();
  if(!KS&&!ksP&&(ui.view==='cards'||(ui.view==='home'&&S.page==='brush')))loadKS().then(()=>{if(ui.view==='cards'||ui.view==='home')render()}).catch(()=>{});
  const pid=['cp','qp','bp'].find(i=>document.getElementById(i));
  if(!pid)ui.PAD=null;else{const P=mountPad(pid),mo=(c,ok)=>P.over(modelSVG(c,{cls:ok?'okm':'badm',speed:.45}));
    if(pid==='qp'&&ui.ses&&ui.ses.ans){P.locked=true;P.fade=true;P.redraw();mo(cur().c,ui.ses.ans.ok)}
    if(pid==='cp'&&ui.ses&&ui.ses.tdone)mo(LES[ui.ses.id].items[ui.ses.ci],ui.ses.tok);
    if(pid==='bp'&&ui.bs){P.onStroke=()=>{if(!ui.bs.start){ui.bs.start=Date.now();ui.bs.tid=setInterval(()=>{const e=document.getElementById('bt');if(e)e.textContent=bClock()},500)}};if(ui.bs.state==='done')mo(ui.bs.q[ui.bs.u],ui.bs.r.ok)}}
  if(ui.view==='rush')rPaint();
  if(ui.view!==ui.lastView){window.scrollTo(0,0);ui.lastView=ui.view}
  if(ui.view==='cards')say(LES[ui.ses.id].items[ui.ses.ci]);
  if(ui.view==='quiz'){const Q=cur();if(ui.ses.ans){const b=document.getElementById('nb');b&&b.focus({preventScroll:true})}else if(Q.type==='type'){const i=document.getElementById('ti');i&&i.focus({preventScroll:true})}else if(Q.type==='ear')say(Q.c)}}

export{app,render};
