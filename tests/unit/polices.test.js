// Polices hébergées avec l'appli (fonts/) : sous-ensembles qui doivent couvrir tout le texte affiché.
// Un caractère absent retomberait sur une police système. Si ce test échoue : `npm run fonts`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const CHARSET = join(ROOT, 'fonts/charset.txt');
const couverts = () => new Set(readFileSync(CHARSET, 'utf8'));
const walk = d =>
  readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : [],
  );

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
