import { test } from 'node:test';
import assert from 'node:assert/strict';
import { golden } from './_outils.js';
import { ITEMS } from '../../src/data/kana.js';
import { WORDS } from '../../src/data/words.js';
import { romaji, toks, typingTokens } from '../../src/core/romaji.js';

// Mêmes références que les tests navigateur (tests/golden/), enregistrées sur le code d'origine.
test('208 kana : lectures et variantes', () => {
  assert.deepEqual(
    Object.values(ITEMS).map(i => [i.c, i.s, i.r, i.al]),
    golden('kana'),
  );
});
test('tous les mots : découpage et romaji', () => {
  assert.deepEqual(
    WORDS.map(w => [w.j, w.f, w.r, w.t, w.s]),
    golden('mots'),
  );
});
test('cas particuliers', () => {
  assert.equal(romaji('コーヒー'), 'koohii');
  assert.equal(romaji('ほんをよむ'), 'hon o yomu');
  assert.deepEqual(toks('しゃしん'), ['しゃ', 'し', 'ん']);
});

test('petit っ/ッ : double la consonne suivante, « t » devant « ch »', () => {
  const cas = {
    きって: 'kitte',
    ロッカー: 'rokkaa',
    まっちゃ: 'matcha',
    ざっし: 'zasshi',
    リュック: 'ryukku',
    さっき: 'sakki',
    がっこう: 'gakkou',
    あっ: 'a',
  };
  for (const [w, r] of Object.entries(cas)) assert.equal(romaji(w), r, w);
});

test('petit っ : ce n’est pas un kana à apprendre, il ne bloque pas la lecture d’un mot', () => {
  assert.deepEqual(toks('きって'), ['き', 'て']);
  assert.deepEqual(toks('ロッカー'), ['ロ', 'カ']);
});

test('Rafale : っ se tape comme la consonne doublée, ou xtu / ltu comme sur un clavier japonais', () => {
  assert.deepEqual(typingTokens('さっき'), [
    { c: 'さ', r: 'sa', al: [] },
    { c: 'っ', r: 'k', al: ['xtu', 'ltu', 'xtsu', 'ltsu'] },
    { c: 'き', r: 'ki', al: [] },
  ]);
  assert.equal(typingTokens('まっちゃ')[1].r, 't');
  assert.deepEqual(
    typingTokens('あっ').map(t => t.c),
    ['あ'],
    'en fin de mot, rien à taper',
  );
  assert.deepEqual(
    typingTokens('コーヒー').map(t => t.r),
    ['ko', 'o', 'hi', 'i'],
    'ー inchangé',
  );
});

test('mots de la liste : chaque kana à taper a une lecture', () => {
  for (const w of WORDS) for (const t of typingTokens(w.j)) assert.ok(t.r, `${w.j} : ${t.c} sans lecture`);
});
