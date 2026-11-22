/* ---------- événements : un seul écouteur de clics délégué (data-act), formulaires, clavier ---------- */
import{grade}from'../core/srs.js';
import{S,fresh,replaceState}from'../core/state.js';
import{LES}from'../data/kana.js';
import{judgeDraw}from'../draw/recognize.js';
import{modelSVG}from'../draw/svg.js';
import{bCheck,bClock,bNext,startBrush,stopBrush}from'../modes/brush.js';
import{answer,answerTyped,cur,initQuiz,lessonQueue,next,settle,startLesson,startReview,startTest}from'../modes/quiz.js';
import{rKey,startRush,stopRush}from'../modes/rush.js';
import{cloud,save,sbDelete,sbLogin,sbSetPw}from'../sync/cloud.js';
import{ui}from'./app-state.js';
import{BASE_AID,strokesOf}from'./pad.js';
import{app,render}from'./render.js';
import{muteBtn,sfx}from'./sounds.js';
import{say}from'./voice.js';
app.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const a=b.dataset.act,id=b.dataset.id;
  if(a!=='reset')ui.armed=false;if(a!=='delacc')ui.armedDel=false;
  switch(a){
    case'lesson':startLesson(id);break;case'test':startTest(id);break;case'review':startReview(false);break;case'practice':startReview(true);break;
    case'say':say(b.dataset.t);break;case'tab':S.tab=id;save();render();break;case'page':S.page=id;save();render();break;
    case'cnext':ui.ses.ci++;ui.ses.tr=false;ui.ses.tdone=false;ui.ses.tmsg='';render();break;case'prev':ui.ses.ci--;ui.ses.tr=false;ui.ses.tdone=false;ui.ses.tmsg='';render();break;case'go':initQuiz(lessonQueue());render();break;
    case'opt':answer(+b.dataset.i);break;case'next':next();break;
    case'rset':{const k=b.dataset.k;S[k]=['rdu','bl','bn'].includes(k)?+b.dataset.v:b.dataset.v;save();render();break}
    case'rstart':startRush();break;
    case'replay':{const tm=document.getElementById('tm');if(tm)tm.innerHTML=modelSVG(LES[ui.ses.id].items[ui.ses.ci]);break}
    case'ctrace':ui.ses.tr=true;ui.ses.tmsg='';ui.ses.tdone=false;render();break;
    case'ccheck':{const c=LES[ui.ses.id].items[ui.ses.ci],st=strokesOf(ui.PAD);if(!st.length)break;const r=judgeDraw(st,c);ui.ses.tok=r.ok;ui.ses.tmsg=(r.ok?'Bien tracé ! ':'')+r.tip;ui.ses.tdone=true;ui.PAD.locked=true;ui.PAD.fade=true;sfx(r.ok?'ok':'bad');render();break}
    case'cagain':ui.ses.tdone=false;ui.ses.tmsg='';ui.PAD&&ui.PAD.reset();render();break;
    case'pundo':ui.PAD&&ui.PAD.undo();break;case'pclear':ui.PAD&&ui.PAD.clear();break;
    case'qcheck':{const Q=cur(),st=strokesOf(ui.PAD);if(!st.length||ui.ses.ans)break;const r=judgeDraw(st,Q.c);ui.PAD.locked=true;ui.PAD.fade=true;ui.ses.prevBox=ui.ses.prevBox||{};if(S.learned[Q.c]&&ui.ses.prevBox[Q.c]==null)ui.ses.prevBox[Q.c]=S.learned[Q.c].box;settle(r.ok,{tip:r.tip,draw:true});break}
    case'qself':{const Q=cur(),A=ui.ses.ans;if(!A||A.ok||A.self)break;A.self=true;A.ok=true;A.msg='Compté juste.';A.tip='';
      if(!Q.retry){ui.ses.ok++;ui.ses.xp+=2;ui.ses.miss.delete(Q.c);if(ui.ses.graded.has(Q.c)&&S.learned[Q.c]){S.learned[Q.c].box=ui.ses.prevBox[Q.c]||1;grade(Q.c,true);save()}}
      const lq=ui.ses.queue[ui.ses.queue.length-1];if(lq&&lq.retry&&lq.c===Q.c)ui.ses.queue.pop();sfx('ok');render();break}
    case'bstart':startBrush();break;
    case'bhint':{if(!ui.bs||ui.bs.state==='done')break;const base=BASE_AID[ui.bs.lvl];ui.bs.h=Math.min(3,Math.max(base,ui.bs.h)+1);ui.aidAnim=ui.bs.h===3;sfx('tick');render();break}
    case'qhint':{const Q=cur();if(!Q||ui.ses.ans)break;Q.h=Math.min(3,(Q.h||0)+1);ui.aidAnim=Q.h===3;sfx('tick');render();break}case'bcheck':bCheck();break;case'bnext':bNext();break;
    case'bretry':ui.bs.state='draw';ui.bs.r=null;ui.PAD&&ui.PAD.reset();render();break;
    case'bskip':{if(ui.bs.state==='done')break;if(!ui.bs.start){ui.bs.start=Date.now();ui.bs.tid=setInterval(()=>{const e=document.getElementById('bt');if(e)e.textContent=bClock()},500)}
      ui.bs.r={ok:false,tip:'Voici comment le tracer : observe l’ordre des traits.',self:true};ui.bs.state='done';if(ui.bs.res[ui.bs.u]==null){ui.bs.res[ui.bs.u]=false;ui.bs.err++;ui.bs.miss.add(ui.bs.q[ui.bs.u])}if(ui.PAD){ui.PAD.locked=true;ui.PAD.fade=true}sfx('bad');render();break}
    case'bself':{if(ui.bs.res[ui.bs.u]===false){ui.bs.res[ui.bs.u]=true;ui.bs.ok++;ui.bs.err--;ui.bs.miss.delete(ui.bs.q[ui.bs.u])}ui.bs.r.ok=true;ui.bs.r.self=true;ui.bs.r.tip='Compté juste.';sfx('ok');render();break}
    case'bquit':stopBrush();ui.bs=null;ui.PAD=null;ui.view='home';render();break;case'lreset':cloud.step='';cloud.msg='';render();break;case'atab':cloud.tab=id;cloud.msg='';cloud.step='';render();break;case'pwopen':cloud.pwOpen=true;cloud.msg='';render();break;case'logout':cloud.sb&&cloud.sb.auth.signOut();cloud.msg='';break;case'delacc':if(!ui.armedDel){ui.armedDel=true;render()}else{ui.armedDel=false;sbDelete()}break;case'mute':S.snd=S.snd===false;save();if(S.snd)sfx('ok');{const n=document.createElement('div');n.innerHTML=muteBtn();b.replaceWith(n.firstChild)}break;case'rk':rKey(b.dataset.k);break;
    case'rquit':stopRush();ui.rs=null;ui.view='home';render();break;
    case'quit':case'home':stopRush();stopBrush();ui.ses=null;ui.view='home';render();break;case'settings':ui.view='set';render();break;
    case'tog':S[b.dataset.k]=b.checked;save();break;
    case'copy':{const t=document.getElementById('exp');try{navigator.clipboard.writeText(t.value).then(()=>{b.textContent='Copié'},()=>t.select())}catch(err){t.select()}break}
    case'reset':if(!ui.armed){ui.armed=true;render()}else{ui.armed=false;replaceState(fresh());ui.homeTip=null;save();ui.view='home';render()}break;
  }});
app.addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='login')return sbLogin(e.target,e.submitter&&e.submitter.dataset.sub);if(e.target.id==='setpw')return sbSetPw(e.target);if(e.target.id==='tf')answerTyped(document.getElementById('ti').value);
  if(e.target.id==='imp'){const m=document.getElementById('impm');try{const v=JSON.parse(document.getElementById('impt').value);if(!v||typeof v.learned!=='object')throw 0;replaceState(Object.assign(fresh(),v));ui.homeTip=null;save();render();document.getElementById('impm').textContent='Progression importée.'}catch(err){m.textContent='Ce code n’est pas valide.'}}});
document.addEventListener('keydown',e=>{if(ui.view==='brush'&&ui.bs){if(e.target.tagName==='BUTTON')return;if(e.key==='Enter'){e.preventDefault();ui.bs.state==='done'?bNext():bCheck()}else if(e.key==='Backspace'){e.preventDefault();ui.PAD&&ui.PAD.undo()}else if(e.key==='Escape')ui.PAD&&ui.PAD.clear();return}if(ui.view==='rush'){if(e.metaKey||e.ctrlKey||e.altKey)return;const k=e.key;const m=/^[a-zA-Z-]$/.test(k)?k.toLowerCase():k==='Backspace'?'back':k==='Escape'?'clear':k==='ArrowRight'?'skip':null;if(m){e.preventDefault();rKey(m)}return}if(ui.view!=='quiz'||!ui.ses)return;if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT')return;
  if(ui.ses.ans){if(e.key==='Enter'){e.preventDefault();next()}return}if(cur().type!=='type'&&cur().type!=='draw'&&/^[1-4]$/.test(e.key))answer(+e.key-1)});
