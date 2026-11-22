import { test } from 'node:test';
import assert from 'node:assert/strict';
import { golden } from './_outils.js';
import { ITEMS } from '../../src/data/kana.js';
import { WORDS } from '../../src/data/words.js';
import { romaji, toks } from '../../src/core/romaji.js';

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
