// Ligne injectée par tests/server.mjs à la fin du bloc principal d'index.html (uniquement avec `?hook`).
// C'est l'adaptateur entre les tests et le code : quand le code sera découpé en modules,
// seul ce fichier changera, les tests resteront identiques.
// Les `import` d'un module sont remontés en tête : ils peuvent figurer ici, à la fin du script principal.
// On n'importe que ce que le script principal n'importe pas déjà (sinon : déclaration en double).
export const HOOK = `import{ALT}from'./src/data/kana.js';import{toks,romaji}from'./src/core/romaji.js';
globalThis.__hanko={
  get S(){return S},set S(v){S=v},fresh,KEY,merge,saveLocal,
  ITEMS,UNITS,LES,SL,WORDS,TOTAL,ALT,toks,romaji,H2K,K2H,
  IV,grade,dueList,nextDue,ld,streak,todayXp,addXp,unlocked,testOpen,nextLesson,allDone,canRead,
  loadKS,get KS(){return KS},judgeDraw,dNorm,
  cloud,get view(){return view},get ses(){return ses},get bs(){return bs},get rs(){return rs}};`;
