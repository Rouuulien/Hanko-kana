// Module injecté par tests/server.mjs dans la page (uniquement avec `?hook`), après le script du jeu.
// C'est l'adaptateur entre les tests et le code : quand le code est réorganisé, seul ce fichier change,
// les tests restent identiques. Il importe les mêmes instances de modules que le jeu (même URL = même module).
export const HOOK = `
import*as kana from'./src/data/kana.js';import*as words from'./src/data/words.js';import*as util from'./src/util.js';
import*as romaji from'./src/core/romaji.js';import*as state from'./src/core/state.js';import*as merge from'./src/core/merge.js';
import*as srs from'./src/core/srs.js';import*as prog from'./src/core/progress.js';import*as reading from'./src/core/reading.js';
import*as strokes from'./src/draw/strokes.js';import*as reco from'./src/draw/recognize.js';
import*as sync from'./src/sync/cloud.js';import*as app from'./src/ui/app-state.js';import*as quiz from'./src/modes/quiz.js';import*as rd from'./src/ui/render.js';
const {ui}=app;
globalThis.__hanko={
  get S(){return state.S},set S(v){state.replaceState(v)},fresh:state.fresh,KEY:state.KEY,saveLocal:state.saveLocal,merge:merge.merge,
  ITEMS:kana.ITEMS,UNITS:kana.UNITS,LES:kana.LES,SL:kana.SL,WORDS:words.WORDS,TOTAL:kana.TOTAL,ALT:kana.ALT,
  toks:romaji.toks,romaji:romaji.romaji,H2K:util.H2K,K2H:util.K2H,
  IV:srs.IV,grade:srs.grade,dueList:srs.dueList,nextDue:srs.nextDue,
  ld:prog.ld,streak:prog.streak,todayXp:prog.todayXp,unlocked:prog.unlocked,testOpen:prog.testOpen,nextLesson:prog.nextLesson,allDone:prog.allDone,
  addXp:quiz.addXp,canRead:reading.canRead,loadKS:strokes.loadKS,get KS(){return strokes.KS},judgeDraw:reco.judgeDraw,dNorm:reco.dNorm,
  cloud:sync.cloud,get view(){return ui.view},get tab(){return ui.tab},get ses(){return ui.ses},get bs(){return ui.bs},get rs(){return ui.rs},render:rd.render};`;
