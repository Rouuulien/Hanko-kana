// @ts-check
/* ---------- données : les 208 kana, unités et leçons ----------
   Les identifiants d'unités (h1…k3) et de leçons (h-a, k-y0…) servent de clés dans la sauvegarde : ne jamais les renommer. */
import { H2K } from '../util.js';
const ROWS = [
  ['a', 'あいうえお', 'a i u e o'],
  ['ka', 'かきくけこ', 'ka ki ku ke ko'],
  ['sa', 'さしすせそ', 'sa shi su se so'],
  ['ta', 'たちつてと', 'ta chi tsu te to'],
  ['na', 'なにぬねの', 'na ni nu ne no'],
  ['ha', 'はひふへほ', 'ha hi fu he ho'],
  ['ma', 'まみむめも', 'ma mi mu me mo'],
  ['ya', 'やゆよ', 'ya yu yo'],
  ['ra', 'らりるれろ', 'ra ri ru re ro'],
  ['wa', 'わをん', 'wa wo n'],
];
const DAK = [
  ['ga', 'がぎぐげご', 'ga gi gu ge go'],
  ['za', 'ざじずぜぞ', 'za ji zu ze zo'],
  ['da', 'だぢづでど', 'da ji zu de do'],
  ['ba', 'ばびぶべぼ', 'ba bi bu be bo'],
  ['pa', 'ぱぴぷぺぽ', 'pa pi pu pe po'],
];
const YB = [
  ['き', 'ky'],
  ['し', 'sh'],
  ['ち', 'ch'],
  ['に', 'ny'],
  ['ひ', 'hy'],
  ['み', 'my'],
  ['り', 'ry'],
  ['ぎ', 'gy'],
  ['じ', 'j'],
  ['び', 'by'],
  ['ぴ', 'py'],
];
const YS = [
  ['ゃ', 'a'],
  ['ゅ', 'u'],
  ['ょ', 'o'],
];
const YG = [
  [0, 1, 2],
  [3, 4, 5, 6],
  [7, 8],
  [9, 10],
];
const ALT = { shi: ['si'], chi: ['ti'], tsu: ['tu'], fu: ['hu'], ji: ['zi', 'di'], zu: ['du'], wo: ['o'], n: ['nn'] };

/** @typedef {import('../../types/hanko').Item} Item @typedef {import('../../types/hanko').Unit} Unit @typedef {import('../../types/hanko').Lesson} Lesson */
/** @type {Record<string, Item>} */
const ITEMS = {},
  UNITS = [],
  LES = {},
  SL = { h: [], k: [] };
/** Enregistre un kana (converti en katakana si s = 'k') et renvoie son caractère. @type {(s: import('../../types/hanko').Script, ch: string, r: string, al?: string[]) => string} */
const mk = (s, ch, r, al) => {
  const c = s === 'k' ? H2K(ch) : ch;
  ITEMS[c] = { c, r, al: al || ALT[r] || [], s };
  return c;
};
const rowName = id => (id === 'a' ? 'Voyelles' : id === 'wa' ? 'W et N' : 'Ligne ' + id[0].toUpperCase());
for (const s of /** @type {const} */ (['h', 'k'])) {
  const nm = s === 'h' ? 'Hiragana' : 'Katakana';
  const row = (id, ks, rs) => {
    const R = rs.split(' ');
    return { id: s + '-' + id, t: rowName(id), items: [...ks].map((k, i) => mk(s, k, R[i])) };
  };
  const us = [
    { id: s + '1', t: nm + ' · les bases', lessons: ROWS.map(r => row(...r)) },
    { id: s + '2', t: nm + ' · sons voisés', lessons: DAK.map(r => row(...r)) },
    {
      id: s + '3',
      t: nm + ' · combinaisons',
      lessons: YG.map((g, gi) => ({
        id: s + '-y' + gi,
        t: g.map(i => YB[i][1] + 'a').join(' · '),
        items: g.flatMap(i =>
          YS.map(([sm, v]) => {
            const b = YB[i][1],
              al = b === 'sh' ? ['sy' + v] : b === 'ch' ? ['ty' + v, 'cy' + v] : b === 'j' ? ['zy' + v, 'jy' + v] : [];
            return mk(s, YB[i][0] + sm, b + v, al);
          }),
        ),
      })),
    },
  ];
  for (const u of us) {
    u.s = s;
    for (const l of u.lessons) {
      l.u = u;
      l.s = s;
      l.idx = SL[s].length;
      SL[s].push(l);
      LES[l.id] = l;
    }
    UNITS.push(u);
  }
}
const UN = Object.fromEntries(UNITS.map(u => [u.id, u]));
/** @param {Unit} u */
const unitItems = u => u.lessons.flatMap(l => l.items);
const TOTAL = Object.keys(ITEMS).length;

export { ROWS, DAK, YB, YS, YG, ALT, ITEMS, UNITS, LES, SL, UN, unitItems, TOTAL };
