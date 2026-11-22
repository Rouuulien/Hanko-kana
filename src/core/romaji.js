import { ITEMS } from '../data/kana.js';
/* mots : découpage en kana, romaji */
function toks(w) {
  const ch = [...w],
    o = [];
  for (let i = 0; i < ch.length;) {
    const two = ch[i] + (ch[i + 1] || '');
    if (ITEMS[two]) {
      o.push(two);
      i += 2;
    } else {
      if (ch[i] !== 'ー') o.push(ch[i]);
      i++;
    }
  }
  return o;
}
function romaji(w) {
  const ch = [...w];
  let o = '';
  for (let i = 0; i < ch.length;) {
    const two = ch[i] + (ch[i + 1] || '');
    if (ITEMS[two]) {
      o += ITEMS[two].r;
      i += 2;
      continue;
    }
    const c = ch[i];
    o += c === 'ー' ? o.slice(-1) : c === 'を' ? ' o ' : ITEMS[c] ? ITEMS[c].r : c;
    i++;
  }
  return o.replace(/\s+/g, ' ').trim();
}

export { toks, romaji };
