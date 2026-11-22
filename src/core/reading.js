/* ---------- mots lisibles : un mot se débloque quand tous ses kana sont appris ---------- */
import{S}from'./state.js';
import{WORDS}from'../data/words.js';
const canRead=(w,extra)=>w.t.every(c=>S.learned[c]||(extra&&extra.has(c)));
const wordsWith=c=>WORDS.filter(w=>w.t.includes(c));

export{canRead,wordsWith};
