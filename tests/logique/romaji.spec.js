// Lectures en romaji : réponses acceptées dans les quiz et la Rafale, transcription des mots.
import { test, expect, expectGolden } from '../helpers/hanko.js';

test.beforeEach(async ({ hanko }) => {
  await hanko.open();
});

test('208 kana : lecture et variantes acceptées (référence)', async ({ hanko }) => {
  const items = await hanko.run(H => Object.values(H.ITEMS).map(i => [i.c, i.s, i.r, i.al]));
  expect(items).toHaveLength(208);
  expectGolden('kana', items);
});

test('variantes usuelles acceptées', async ({ hanko }) => {
  const r = await hanko.run(H =>
    Object.fromEntries(
      ['し', 'ち', 'つ', 'ふ', 'じ', 'ぢ', 'づ', 'を', 'ん', 'しゃ', 'ちょ', 'じゅ', 'シ', 'ジョ'].map(c => [
        c,
        [H.ITEMS[c].r, ...H.ITEMS[c].al],
      ]),
    ),
  );
  expect(r).toEqual({
    し: ['shi', 'si'],
    ち: ['chi', 'ti'],
    つ: ['tsu', 'tu'],
    ふ: ['fu', 'hu'],
    じ: ['ji', 'zi', 'di'],
    ぢ: ['ji', 'zi', 'di'],
    づ: ['zu', 'du'],
    を: ['wo', 'o'],
    ん: ['n', 'nn'],
    しゃ: ['sha', 'sya'],
    ちょ: ['cho', 'tyo', 'cyo'],
    じゅ: ['ju', 'zyu', 'jyu'],
    シ: ['shi', 'si'],
    ジョ: ['jo', 'zyo', 'jyo'],
  });
});

test('transcription des mots : combinaisons, voyelle longue ー, particule を', async ({ hanko }) => {
  const r = await hanko.run(H =>
    Object.fromEntries(
      ['きょう', 'コーヒー', 'ラーメン', 'しゃしん', 'ほんをよむ', 'リュック'].map(w => [w, [H.romaji(w), H.toks(w)]]),
    ),
  );
  expect(r).toEqual({
    きょう: ['kyou', ['きょ', 'う']],
    コーヒー: ['koohii', ['コ', 'ヒ']], // ー : voyelle précédente répétée, et absent du découpage
    ラーメン: ['raamen', ['ラ', 'メ', 'ン']],
    しゃしん: ['shashin', ['しゃ', 'し', 'ん']],
    ほんをよむ: ['hon o yomu', ['ほ', 'ん', 'を', 'よ', 'む']],
    // LIMITE CONNUE : le petit っ/ッ n'est pas géré. Aucun mot de la liste n'en contient aujourd'hui.
    リュック: ['ryuッku', ['リュ', 'ッ', 'ク']],
  });
});

test('tous les mots : découpage en kana et romaji (référence)', async ({ hanko }) => {
  const words = await hanko.run(H => H.WORDS.map(w => [w.j, w.f, w.r, w.t, w.s]));
  expect(words.length).toBeGreaterThan(150);
  expectGolden('mots', words);
});

test('conversion hiragana ↔ katakana, aller-retour sans perte', async ({ hanko }) => {
  const r = await hanko.run(H => {
    const hs = Object.values(H.ITEMS)
      .filter(i => i.s === 'h')
      .map(i => i.c);
    return { bad: hs.filter(h => H.K2H(H.H2K(h)) !== h), ex: [H.H2K('きょう'), H.K2H('コーヒー')] };
  });
  expect(r).toEqual({ bad: [], ex: ['キョウ', 'こーひー'] });
});
