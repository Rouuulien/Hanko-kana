// @ts-check
/* ---------- mots lisibles : un mot se débloque quand tous ses kana sont appris ---------- */
import { S } from './state.js';
import { WORDS } from '../data/words.js';
/** Le mot est-il lisible avec les kana appris (plus, éventuellement, ceux de `extra`) ? @param {import('../../types/hanko').Word} w @param {Set<string>} [extra] */
const canRead = (w, extra) => w.t.every(c => S.learned[c] || (extra && extra.has(c)));
/** @param {string} c */
const wordsWith = c => WORDS.filter(w => w.t.includes(c));

export { canRead, wordsWith };
