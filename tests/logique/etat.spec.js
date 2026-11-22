// Lecture et écriture de la sauvegarde locale (clé hanko-kana-v1).
// Règle : une sauvegarde de n'importe quelle version passée doit se charger sans perte.
import { test, expect, T0 } from '../helpers/hanko.js';

const FRESH = {
  learned: {},
  done: {},
  tests: {},
  xp: 0,
  streak: 0,
  last: '',
  today: '',
  todayXp: 0,
  unlock: false,
  ear: true,
  tab: 'h',
  page: 'path',
  rsc: 'h',
  rct: 'kana',
  rdu: 60,
  rfmt: 'deck',
  best: {},
  snd: true,
  draw: true,
  bsc: 'h',
  bn: 10,
  bl: 2,
};

test('la clé de stockage ne change jamais', async ({ hanko }) => {
  await hanko.open();
  expect(await hanko.run(H => H.KEY)).toBe('hanko-kana-v1');
});

test('valeurs par défaut de fresh() : aucun champ supprimé ni renommé', async ({ hanko }) => {
  await hanko.open();
  expect(await hanko.run(H => H.fresh())).toEqual(FRESH);
});

test('premier lancement : état neuf, rien n’est écrit tant que le joueur n’a rien fait', async ({ hanko }) => {
  await hanko.open();
  expect(await hanko.run(H => H.S)).toEqual(FRESH);
  expect(await hanko.stored()).toBeNull();
});

test('une sauvegarde complète est relue à l’identique', async ({ hanko }) => {
  const save = {
    ...FRESH,
    learned: { あ: { box: 3, due: T0 + 1000 } },
    done: { 'h-a': true },
    tests: { h1: 85 },
    xp: 120,
    streak: 4,
    last: '2026-01-15',
    today: '2026-01-15',
    todayXp: 12,
    best: { 'deck-h-kana': { ms: 41000, n: 5, acc: 100 } },
    at: T0 - 5000,
  };
  await hanko.open({ state: save });
  expect(await hanko.run(H => H.S)).toEqual(save);
});

// Formats successifs de l'état, reconstitués depuis l'historique git de fresh().
const GEN1 = {
  learned: { か: { box: 2, due: T0 } },
  done: { 'h-a': true, 'h-ka': true },
  tests: {},
  xp: 40,
  streak: 2,
  last: '2026-01-14',
  today: '2026-01-14',
  todayXp: 8,
  unlock: false,
  ear: false,
  tab: 'k',
  page: 'sheet',
  rsc: 'b',
  rct: 'words',
  rdu: 30,
  rfmt: 'time',
  best: { 'time-b-words-30': { kpm: 22, acc: 90 } },
  snd: false,
  at: T0 - 9e7,
};
const GEN2 = { ...GEN1, draw: false, bsc: 'k', bn: 20 };

test('ancien format n°1 (avant le dessin) : champs manquants complétés, rien d’écrasé', async ({ hanko }) => {
  await hanko.open({ state: GEN1 });
  const S = await hanko.run(H => H.S);
  expect(S).toEqual({ ...GEN1, draw: true, bsc: 'h', bn: 10, bl: 2 });
});

test('ancien format n°2 (avant les niveaux du Pinceau) : bl ajouté à 2', async ({ hanko }) => {
  await hanko.open({ state: GEN2 });
  expect(await hanko.run(H => H.S)).toEqual({ ...GEN2, bl: 2 });
});

test('champs inconnus (sauvegarde d’une version plus récente) : conservés', async ({ hanko }) => {
  await hanko.open({ state: { ...FRESH, futur: { a: 1 }, xp: 3 } });
  const S = await hanko.run(H => H.S);
  expect(S.futur).toEqual({ a: 1 });
  expect(S.xp).toBe(3);
});

for (const [label, raw] of [
  ['JSON corrompu', '{"learned":'],
  ['objet sans learned', '{"xp":50}'],
  ['null', 'null'],
  ['nombre', '42'],
  ['learned non objet', '{"learned":"x","xp":9}'],
]) {
  test(`sauvegarde illisible (${label}) : état neuf, sans plantage`, async ({ hanko }) => {
    const errors = [];
    hanko.page.on('pageerror', e => errors.push(e.message));
    await hanko.open({ state: raw });
    expect(await hanko.run(H => H.S)).toEqual(FRESH);
    expect(errors).toEqual([]);
  });
}

test('save() horodate et écrit dans localStorage', async ({ hanko }) => {
  await hanko.open();
  await hanko.run(H => H.addXp(5));
  const st = await hanko.stored();
  expect(st.at).toBe(T0);
  expect(st.xp).toBe(5);
});

// BUG CONNU (non corrigé pendant la refonte, comportement figé) : `typeof null === 'object'`,
// donc {"learned":null} passe le contrôle de chargement et l'appli plante au premier affichage.
// Même faille dans l'import du code de secours et dans cloudPull(). test.fail : ce test passe tant que le bug existe.
test.fail('BUG CONNU : {"learned":null} fait planter le premier affichage', async ({ hanko }) => {
  const errors = [];
  hanko.page.on('pageerror', e => errors.push(e.message));
  await hanko.open({ state: '{"learned":null}', hook: false });
  await hanko.page.waitForTimeout(300);
  expect(errors).toEqual([]);
});
