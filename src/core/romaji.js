// @ts-check
import { ITEMS } from '../data/kana.js';
/* mots : découpage en kana, romaji */
/** Petit tsu (sokuon) : double la consonne suivante (きって → kitte, まっちゃ → matcha). */
const SOKUON = new Set(['っ', 'ッ']);
/**
 * Consonne à doubler devant une lecture : « t » devant « ch », sinon la première consonne ; rien devant une voyelle ou n.
 * @param {string} [next] lecture du kana suivant
 */
const doubled = next => (!next ? '' : next.startsWith('ch') ? 't' : /^[aiueon]/.test(next) ? '' : next[0]);
/** Le kana (simple ou combinaison) qui commence en position i, s'il existe. @param {string[]} ch @param {number} i */
const itemAt = (ch, i) => ITEMS[ch[i] + (ch[i + 1] || '')] || ITEMS[ch[i]];

/** Découpe un mot en kana à connaître (combinaisons comprises ; ー et っ ne sont pas des kana à apprendre). @param {string} w @returns {string[]} */
function toks(w) {
  const ch = [...w],
    o = [];
  for (let i = 0; i < ch.length;) {
    const two = ch[i] + (ch[i + 1] || '');
    if (ITEMS[two]) {
      o.push(two);
      i += 2;
    } else {
      if (ch[i] !== 'ー' && !SOKUON.has(ch[i])) o.push(ch[i]);
      i++;
    }
  }
  return o;
}
/** Transcription en romaji (ー répète la voyelle, っ double la consonne suivante, を se lit « o »). @param {string} w @returns {string} */
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
    o += SOKUON.has(c)
      ? doubled(itemAt(ch, i + 1)?.r)
      : c === 'ー'
        ? o.slice(-1)
        : c === 'を'
          ? ' o '
          : ITEMS[c]
            ? ITEMS[c].r
            : c;
    i++;
  }
  return o.replace(/\s+/g, ' ').trim();
}

/**
 * Découpage d'un mot pour la Rafale : ce qu'il faut taper, kana par kana, avec les variantes acceptées.
 * ー : la voyelle précédente (ou « - ») ; っ : la consonne doublée (ou xtu, ltu, comme sur un clavier japonais).
 * @param {string} w
 * @returns {{ c: string, r: string, al: string[] }[]}
 */
function typingTokens(w) {
  const ch = [...w],
    t = [];
  for (let i = 0; i < ch.length;) {
    const two = ch[i] + (ch[i + 1] || '');
    if (ITEMS[two]) {
      t.push({ c: two, r: ITEMS[two].r, al: ITEMS[two].al });
      i += 2;
      continue;
    }
    const c = ch[i];
    if (c === 'ー') {
      const v = ((t[t.length - 1] || { r: '' }).r.match(/[aiueo]$/) || ['-'])[0];
      t.push({ c, r: v, al: ['-'] });
    } else if (SOKUON.has(c)) {
      const next = itemAt(ch, i + 1),
        r = doubled(next?.r);
      const al = [...new Set([...(next?.al || []).map(doubled), 'xtu', 'ltu', 'xtsu', 'ltsu'])].filter(
        x => x && x !== r,
      );
      if (r) t.push({ c, r, al });
    } else t.push({ c, r: ITEMS[c].r, al: ITEMS[c].al });
    i++;
  }
  return t;
}

export { toks, romaji, typingTokens };
