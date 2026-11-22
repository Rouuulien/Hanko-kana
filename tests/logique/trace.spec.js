// Reconnaissance du tracé (judgeDraw) sur des tracés de synthèse (tests/helpers/traces.js) construits à partir
// des modèles KanjiVG, convertis en pixels comme sur une zone de dessin de 300 px, avec du bruit reproductible.
// La référence enregistrée est celle du code d'origine : tout écart signale un changement de comportement.
import { test, expect, expectGolden } from '../helpers/hanko.js';
import { jugerTraces } from '../helpers/traces.js';

test.setTimeout(120000);

const judgeAll = hanko => hanko.run(jugerTraces, 42);

test('tous les kana, 7 variantes de tracé (référence)', async ({ hanko }) => {
  await hanko.open();
  const res = await judgeAll(hanko);
  expect(res.length).toBeGreaterThan(500);
  expectGolden('trace', res);

  // Garde-fous lisibles, en plus de la référence.
  const of = v => res.filter(r => r.v === v);
  expect(
    of('exact')
      .filter(r => !r.ok)
      .map(r => r.c),
    'tracé exact refusé',
  ).toEqual([]);
  // Paires réellement confusables : refusées.
  expect(
    of('voisin')
      .filter(r => ['ぬ', 'め', 'シ', 'ツ', 'ソ', 'ン', 'ウ'].includes(r.c) && r.ok)
      .map(r => r.c),
    'kana voisin accepté',
  ).toEqual([]);
  // Tolérance actuelle (comportement figé) : un tracé qui contient la cible avec un trait de plus ou de moins
  // est accepté, avec un conseil sur le nombre de traits (ex. き dessiné pour さ, ほ pour は).
  expect(
    of('voisin')
      .filter(r => r.ok)
      .map(r => r.c + '←' + r.like),
  ).toEqual(['さ←き', 'ね←れ', 'は←ほ', 'わ←れ', 'ク←タ']);
  expect(of('trait-inverse').every(r => r.got === r.need && !r.dir)).toBe(true);
  expect(of('ordre-inverse').every(r => !r.ok && !r.order)).toBe(true);
  const pick = (c, v) => res.find(r => r.c === c && r.v === v);
  expect(pick('あ', 'trait-manquant')).toMatchObject({ need: 3, got: 2 });
  expect(pick('あ', 'trait-manquant').tip).toContain('3 traits');
});
