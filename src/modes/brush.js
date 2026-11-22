/* ---------- mode Pinceau : on entend ou lit le son, on dessine le kana ---------- */
import{allDone}from'../core/progress.js';
import{S}from'../core/state.js';
import{ITEMS}from'../data/kana.js';
import{judgeDraw}from'../draw/recognize.js';
import{KS,canDraw}from'../draw/strokes.js';
import{modelSVG}from'../draw/svg.js';
import{addXp}from'./quiz.js';
import{fmtT}from'./rush.js';
import{ui}from'../ui/app-state.js';
import{daru,mascot}from'../ui/daru.js';
import{SPK}from'../ui/icons.js';
import{BASE_AID,hintBtn,padHTML,padTools,strokesOf}from'../ui/pad.js';
import{render}from'../ui/render.js';
import{muteBtn,sfx}from'../ui/sounds.js';
import{top}from'../ui/views.js';
import{tts}from'../ui/voice.js';
import{pick,shuffle}from'../util.js';
/* état de l’interface : voir src/ui/app-state.js */
function brushPool(sc){return Object.keys(S.learned).filter(c=>canDraw(c)&&KS&&KS[c]&&(sc==='b'||ITEMS[c].s===sc))}
const bkey=()=>'brush-'+(S.bsc||'h')+'-'+(S.bn||10)+'-L'+(S.bl||2);
const LVL={1:['Calque','Le kana est en filigrane et le prochain trait s’anime : tu n’as qu’à le suivre.'],2:['Guidé','Seul le point de départ numéroté du prochain trait est affiché.'],3:['Libre','Aucune aide, comme à l’examen. Le bouton Indice reste là en cas de besoin.']};
function brushSetupV(){if(!KS)return`<div class="rset">${mascot('idle','Je prépare les pinceaux… (il faut une connexion la première fois)',64)}</div>`;
  const pool=brushPool(S.bsc||'h'),n=+(S.bn||10),size=n?Math.min(n,pool.length):pool.length,b=S.best[bkey()];
  const grp=(lab,k,opts,def)=>`<div class="og"><span>${lab}</span><div class="chips">${opts.map(([v,t])=>`<button data-act="rset" data-k="${k}" data-v="${v}" aria-pressed="${String(S[k]??def)===String(v)}">${t}</button>`).join('')}</div></div>`;
  const ok=pool.length>=3;
  return`<div class="rset">${mascot('idle',ok?`Je te donne un son, tu dessines le kana au doigt. Commence en Calque, puis passe en Guidé et en Libre quand tu te sens prêt. <b>${size} kana</b> parmi ceux que tu as appris. Soigne l’ordre des traits : je le vérifie !`:'Il me faut au moins 3 kana appris dans cette écriture. Fais une leçon et reviens !',64)}
  ${grp('Niveau','bl',[[1,'Calque'],[2,'Guidé'],[3,'Libre']],2)}<p class="lvl">${LVL[S.bl||2][1]}</p>${grp('Écriture','bsc',[['h','Hiragana'],['k','Katakana'],['b','Les deux']],'h')}${grp('Nombre de kana','bn',[[10,'10'],[20,'20'],[0,'Tous']],10)}
  <p class="rbest">${b?`Ton record : <b>${fmtT(b.ms)}</b> pour ${b.n} kana, ${b.acc} % justes du premier coup`:'Pas encore de record pour ces réglages.'}</p>
  <button class="btn ac" data-act="bstart" ${ok?'':'disabled'}>Prendre le pinceau</button></div>`}
function startBrush(){const pool=brushPool(S.bsc||'h');if(pool.length<3)return;const n=+(S.bn||10);
  ui.bs={q:shuffle(pool).slice(0,n||pool.length),u:0,start:0,ok:0,err:0,miss:new Set(),res:[],state:'draw',r:null,tid:0,h:0,hinted:new Set(),lvl:+(S.bl||2)};ui.PAD=null;ui.view='brush';render()}
function stopBrush(){if(ui.bs&&ui.bs.tid){clearInterval(ui.bs.tid);ui.bs.tid=0}}
function bClock(){return fmtT(ui.bs.start?Date.now()-ui.bs.start:0)}
function brushV(){const c=ui.bs.q[ui.bs.u],it=ITEMS[c],R=ui.bs.r,left=ui.bs.q.length-ui.bs.u;
  const fb=ui.bs.state==='done'?`<div class="bfb ${R.ok?'ok':'bad'}"><b>${R.ok?pick(['Joli trait !','Bien tracé !','Parfait.']):'Pas tout à fait.'}</b><span>${R.tip||''}</span></div>`:'';
  const acts=ui.bs.state!=='done'?padTools('bcheck',hintBtn('bhint',ui.bs.h,BASE_AID[ui.bs.lvl])+`<button class="link" data-act="bskip">Je ne sais pas</button>`)
    :R.ok?`<div class="ptools"><button class="btn ac" data-act="bnext" id="bnb">Suivant</button></div>`
    :`<div class="ptools"><button class="btn gh sm" data-act="bretry">Réessayer</button><button class="btn ac sm" data-act="bnext" id="bnb">Suivant</button>${R.self?'':`<button class="link" data-act="bself">J’avais juste</button>`}</div>`;
  return`<div class="rz bz"><div class="rz-top"><button class="x" data-act="bquit" aria-label="Quitter">×</button><span class="rz-tag">Pinceau · ${LVL[ui.bs.lvl][0]} · ${left} restant${left>1?'s':''}</span>${muteBtn()}${daru(R?R.ok?'happy':'oops':'idle',36,allDone())}</div>
  <div class="bstage"><div class="bprompt"><span class="bro">${it.r}</span>${ui.bs.lvl<3||ui.bs.h>=1?`<span class="bcount">${KS[c].d.length} trait${KS[c].d.length>1?'s':''}</span>`:''}${tts?`<button class="say" data-act="say" data-t="${c}" aria-label="Écouter">${SPK}</button>`:''}</div>
  ${padHTML('bp',null).replace('class="pad"',`class="pad dark" data-key="${ui.bs.u}"`)}${fb}${acts}</div>
  <div class="rbar"><span class="t" id="bt">${bClock()}</span><div class="typed bscore"><span>${ui.bs.ok}</span>&nbsp;juste${ui.bs.ok>1?'s':''}</div><span class="c">${ui.bs.u+1}<small>/${ui.bs.q.length}</small></span></div></div>`}
function bCheck(){const P=ui.PAD,c=ui.bs.q[ui.bs.u],st=strokesOf(P);if(!st.length)return;const r=judgeDraw(st,c);ui.bs.r=r;ui.bs.state='done';P.locked=true;P.fade=true;
  if(ui.bs.res[ui.bs.u]==null){ui.bs.res[ui.bs.u]=r.ok;if(r.ok){ui.bs.ok++;if(ui.bs.h>BASE_AID[ui.bs.lvl])ui.bs.hinted.add(c)}else{ui.bs.err++;ui.bs.miss.add(c)}}
  sfx(r.ok?'card':'bad');render();if(r.ok)setTimeout(()=>{if(ui.view==='brush'&&ui.bs&&ui.bs.state==='done'&&ui.bs.q[ui.bs.u]===c)bNext()},1400)}
function bNext(){ui.bs.u++;ui.bs.state='draw';ui.bs.r=null;ui.bs.h=0;ui.PAD=null;if(ui.bs.u>=ui.bs.q.length)return endBrush();render()}
function endBrush(){stopBrush();const ms=ui.bs.start?Date.now()-ui.bs.start:0,n=ui.bs.q.length;ui.bs.ms=ms;ui.bs.acc=Math.round(ui.bs.ok/n*100);const k=bkey(),b=S.best[k];
  ui.bs.record=ui.bs.ok>0&&(!b||b.n!==n||ms<b.ms||(ms===b.ms&&ui.bs.acc>b.acc));if(ui.bs.record)S.best[k]={ms,n,acc:ui.bs.acc};ui.bs.prev=b;if(ui.bs.ok)sfx('done');addXp(ui.bs.ok*2-ui.bs.hinted.size+(ui.bs.lvl-1)*ui.bs.ok);ui.view='brushres';render()}
function brushResV(){const m=[...ui.bs.miss];const talk=!ui.bs.ok?'Le pinceau est capricieux au début. Revois l’ordre des traits dans les fiches, puis retente !':ui.bs.record?`Nouveau record !${ui.bs.prev?' Avant : '+fmtT(ui.bs.prev.ms)+'.':''}`:ui.bs.acc>=90&&ui.bs.lvl<3?`Superbe ! Essaie le niveau ${LVL[ui.bs.lvl+1][0]} pour corser le jeu.`:ui.bs.acc>=90?'Superbe calligraphie !':ui.bs.acc>=60?'Belle main, continue comme ça.':'Courage : chaque tracé grave le kana un peu plus.';
  return top()+`<section class="band"><div class="wrap narrow res"><p class="lead">Pinceau · ${ui.bs.q.length} kana</p><div class="big-n">${ui.bs.ok}/${ui.bs.q.length}</div><p class="lead" style="margin-top:-4px">tracés justes du premier coup${ui.bs.hinted.size?`, dont ${ui.bs.hinted.size} avec indice`:''} · niveau ${LVL[ui.bs.lvl][0]}</p>
  <div class="rfigs"><div class="fig1"><b>${fmtT(ui.bs.ms)}</b><span>temps</span></div><div class="fig1"><b>${ui.bs.acc} %</b><span>précision</span></div><div class="fig1"><b>${ui.bs.err}</b><span>à revoir</span></div></div>
  ${m.length?`<h2 style="margin-top:14px">À retravailler</h2><div class="mrow">${m.map(c=>`<button class="mk mkm" data-act="say" data-t="${c}"><span class="mm">${modelSVG(c,{anim:false})}</span><small>${ITEMS[c].r}</small></button>`).join('')}</div>`:''}
  ${mascot(ui.bs.record&&ui.bs.ok?'happy':'idle',talk,70)}
  <div class="acts"><button class="btn ac" data-act="bstart">Rejouer</button><button class="btn gh" data-act="home">Retour</button></div></div></section>`}

export{brushSetupV,startBrush,stopBrush,bClock,brushV,bCheck,bNext,brushResV};
