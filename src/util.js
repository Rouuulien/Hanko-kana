// @ts-check
/* Petits utilitaires : tirage au hasard, échappement HTML, conversion hiragana ↔ katakana. */
/** Copie mélangée (Fisher-Yates). @template T @param {T[]} a @returns {T[]} */
const shuffle = a => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/** Élément au hasard. @template T @param {T[]} a @returns {T} */
const pick = a => a[Math.floor(Math.random() * a.length)];
/** Échappe une valeur pour l'insérer dans du HTML. @param {unknown} s */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** Hiragana → katakana (les autres caractères sont gardés). @param {string} s */
const H2K = s =>
  [...s]
    .map(c => {
      const n = c.charCodeAt(0);
      return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c;
    })
    .join('');
/** Katakana → hiragana. @param {string} s */
const K2H = s =>
  [...s]
    .map(c => {
      const n = c.charCodeAt(0);
      return n >= 0x30a1 && n <= 0x30f6 ? String.fromCharCode(n - 0x60) : c;
    })
    .join('');

export { shuffle, pick, esc, H2K, K2H };
