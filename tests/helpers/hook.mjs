// Code injecté par tests/server.mjs à la fin du script principal d'index.html (uniquement avec `?hook`).
// C'est l'adaptateur entre les tests et le code : quand le code est réorganisé, seul ce fichier change,
// les tests restent identiques. Les modules sont importés sous des noms d'espace propres au hook
// (les `import` d'un module sont remontés en tête, et ne doivent pas redéclarer un nom du script principal).
// Ce qui vit encore dans le script principal (vues, sessions, synchro, dessin) est référencé directement.
export const HOOK = `import*as __kana from'./src/data/kana.js';import*as __words from'./src/data/words.js';
import*as __util from'./src/util.js';import*as __romaji from'./src/core/romaji.js';
import*as __state from'./src/core/state.js';import*as __merge from'./src/core/merge.js';
import*as __srs from'./src/core/srs.js';import*as __prog from'./src/core/progress.js';
globalThis.__hanko={
  get S(){return __state.S},set S(v){__state.replaceState(v)},fresh:__state.fresh,KEY:__state.KEY,saveLocal:__state.saveLocal,merge:__merge.merge,
  ITEMS:__kana.ITEMS,UNITS:__kana.UNITS,LES:__kana.LES,SL:__kana.SL,WORDS:__words.WORDS,TOTAL:__kana.TOTAL,ALT:__kana.ALT,
  toks:__romaji.toks,romaji:__romaji.romaji,H2K:__util.H2K,K2H:__util.K2H,
  IV:__srs.IV,grade:__srs.grade,dueList:__srs.dueList,nextDue:__srs.nextDue,
  ld:__prog.ld,streak:__prog.streak,todayXp:__prog.todayXp,unlocked:__prog.unlocked,testOpen:__prog.testOpen,nextLesson:__prog.nextLesson,allDone:__prog.allDone,
  addXp,canRead,loadKS,get KS(){return KS},judgeDraw,dNorm,
  cloud,get view(){return view},get ses(){return ses},get bs(){return bs},get rs(){return rs}};`;
