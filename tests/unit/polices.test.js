// Polices hébergées avec l'appli (fonts/) : sous-ensembles qui doivent couvrir tout le texte affiché.
// Un caractère absent retomberait sur une police système. Si ce test échoue : `npm run fonts`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Blob, Face } from 'harfbuzzjs';
import wawoff from 'wawoff2';

const ROOT = new URL('../../', import.meta.url).pathname;
const CHARSET = join(ROOT, 'fonts/charset.txt');
const couverts = () => new Set(readFileSync(CHARSET, 'utf8'));
const walk = d =>
  readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : [],
  );

/** Caractères que contient réellement une police publiée (table cmap du woff2). */
const glyphes = async f => {
  const ttf = await wawoff.decompress(readFileSync(join(ROOT, 'fonts', f)));
  return new Set(new Face(new Blob(ttf), 0).collectUnicodes());
};
/** Texte du jeu : chaque caractère visible (hors ASCII) des modules et des pages. */
const texteDuJeu = () => {
  const set = new Set();
  for (const f of [...walk(join(ROOT, 'src')), join(ROOT, 'index.html'), join(ROOT, 'confidentialite.html')])
    for (const c of readFileSync(f, 'utf8')) if (c > '\x7e' && !/[\s\u200b-\u200f\u2060-\u206f]/.test(c)) set.add(c);
  return set;
};
// Symboles absents de Noto Sans JP, affichés en police système en attendant de devenir des icônes (étape 3).
const SANS_GLYPHE = new Set(['↶', '↻', '✎']);

test('la police d’interface contient vraiment chaque caractère du jeu', async () => {
  const noto = await glyphes('NotoSansJP.woff2');
  const manque = [...texteDuJeu()].filter(c => !SANS_GLYPHE.has(c) && !noto.has(c.codePointAt(0)));
  assert.deepEqual(manque.join(''), '', 'caractères sans glyphe dans Noto Sans JP');
});

test('la police des grands kana contient tous les kana', async () => {
  const klee = await glyphes('KleeOne-400.woff2');
  const manque = [];
  for (const [a, b] of [
    [0x3041, 0x3096],
    [0x30a1, 0x30fa],
    [0x30fc, 0x30fc],
  ])
    for (let c = a; c <= b; c++) if (!klee.has(c)) manque.push(String.fromCodePoint(c));
  assert.deepEqual(manque.join(''), '');
});

test('charset couvre tout le texte du jeu', () => {
  const set = couverts();
  const textes = [...walk(join(ROOT, 'src')), join(ROOT, 'index.html'), join(ROOT, 'confidentialite.html')];
  const manque = new Set();
  for (const f of textes) for (const c of readFileSync(f, 'utf8')) if (c > '\x7e' && !set.has(c)) manque.add(c);
  assert.deepEqual([...manque].join(''), '', 'caractères absents des polices : relancer npm run fonts');
});

test('charset couvre tous les kana', () => {
  const set = couverts();
  const plages = [
    [0x3041, 0x3096],
    [0x30a1, 0x30fa],
    [0x30fc, 0x30fc],
  ];
  for (const [a, b] of plages)
    for (let c = a; c <= b; c++) assert.ok(set.has(String.fromCodePoint(c)), String.fromCodePoint(c));
});

test('chaque police publiée existe et pèse moins de 400 Ko', () => {
  for (const f of [
    'NotoSansJP.woff2',
    'ZenOldMincho-400.woff2',
    'ZenOldMincho-700.woff2',
    'KleeOne-400.woff2',
    'KleeOne-600.woff2',
  ]) {
    const p = join(ROOT, 'fonts', f);
    assert.ok(existsSync(p), f);
    assert.ok(statSync(p).size < 400 * 1024, `${f} : ${statSync(p).size} octets`);
  }
});

test('Klee One est préchargée (grands kana dès le premier affichage)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.ok(
    html.includes('<link rel="preload" href="fonts/KleeOne-400.woff2" as="font" type="font/woff2" crossorigin>'),
  );
});
