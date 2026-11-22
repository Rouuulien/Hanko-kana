// Jeux de données réels : la sauvegarde d'un vrai joueur (lue dans Supabase, anonymisée : aucun identifiant,
// dates décalées au 15/01/2026 en gardant les écarts) et deux anciens formats dérivés de celle-ci.
import { readFileSync } from 'node:fs';
import { test, expect, T0, HOUR } from '../helpers/hanko.js';

const load = f => JSON.parse(readFileSync(new URL(`../fixtures/${f}.json`, import.meta.url), 'utf8'));
const REAL = load('vraie-sauvegarde'), OLD1 = load('ancien-format-1'), OLD2 = load('ancien-format-2');
const sortKeys = o => JSON.parse(JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));

test('la vraie sauvegarde est relue à l’identique', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  expect(sortKeys(await hanko.run(H => H.S))).toEqual(sortKeys(REAL));
});

test('accueil sur la vraie sauvegarde : chiffres affichés', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  const figs = await hanko.page.locator('.figs .fig1 b').allTextContents();
  const words = await hanko.run(H => H.WORDS.filter(w => H.canRead(w)).length);
  expect(figs).toEqual(['15 / 208', '0', `${words} / ${await hanko.run(H => H.WORDS.length)}`, '500']);
  await expect(hanko.page.locator('.rev-n')).toHaveText('0');
  await expect(hanko.page.locator('.hero h1')).toHaveText('Ligne T'); // leçon suivante : h-ta
});

for (const [h, n, first] of [[3, 4, 'お'], [18, 12, 'お'], [52, 15, 'お']]) {
  test(`révisions dues ${h} h plus tard : ${n} kana`, async ({ hanko }) => {
    await hanko.open({ state: REAL, now: T0 + h * HOUR });
    const due = await hanko.run(H => H.dueList());
    expect(due).toHaveLength(n);
    expect(due[0]).toBe(first);
    await expect(hanko.page.locator('.rev-n')).toHaveText(String(n));
  });
}

test('ancien format n°1 : relu sans perte, nouveaux réglages par défaut', async ({ hanko }) => {
  await hanko.open({ state: OLD1 });
  const S = await hanko.run(H => H.S);
  expect(sortKeys(S)).toEqual(sortKeys({ ...OLD1, draw: true, bsc: 'h', bn: 10, bl: 2 }));
  expect(Object.keys(S.learned)).toHaveLength(15);
});

test('ancien format n°2 : relu sans perte, ancienne clé de record Pinceau conservée', async ({ hanko }) => {
  await hanko.open({ state: OLD2 });
  const S = await hanko.run(H => H.S);
  expect(sortKeys(S)).toEqual(sortKeys({ ...OLD2, bl: 2 }));
  expect(S.best['brush-h-10']).toEqual(OLD2.best['brush-h-10']);
});

test.describe('fusion avec la vraie sauvegarde', () => {
  test.beforeEach(async ({ hanko }) => { await hanko.open() });
  const merge = (hanko, a, b) => hanko.run((H, [a, b]) => H.merge(a, b), [a, b]);

  test('nouvel appareil, première connexion : on récupère tout', async ({ hanko }) => {
    const local = await hanko.run(H => H.fresh()); // appareil vierge, jamais sauvegardé (pas de `at`)
    const r = await merge(hanko, local, REAL);
    expect(sortKeys(r)).toEqual(sortKeys(REAL));
  });

  test('appareil hors ligne avec une progression plus ancienne mais différente : union sans perte', async ({ hanko }) => {
    const offline = { ...OLD1, at: REAL.at - 2 * HOUR, xp: 520,
      learned: { ...OLD1.learned, あ: { box: 5, due: T0 + 100 * HOUR }, た: { box: 1, due: T0 } }, done: { ...OLD1.done, 'h-ta': true }, tests: { h1: 60 } };
    const r = await merge(hanko, offline, REAL);
    expect(Object.keys(r.learned).sort()).toEqual([...Object.keys(REAL.learned), 'た'].sort());
    expect(r.learned.あ.box).toBe(5);
    expect(r.done).toEqual({ ...REAL.done, 'h-ta': true });
    expect(r.tests).toEqual({ h1: 60 });
    expect(r.xp).toBe(520);
    expect(r.best).toEqual(REAL.best);
    expect(r.at).toBe(REAL.at);
  });

  test('autre appareil resté sur l’ancien format, plus récent : records et réglages récents préservés', async ({ hanko }) => {
    const remote = { ...OLD2, at: REAL.at + HOUR };
    const r = await merge(hanko, REAL, remote);
    expect(r.best).toEqual({ ...REAL.best, 'brush-h-10': OLD2.best['brush-h-10'] });
    expect(r).toMatchObject({ bl: 2, draw: true, bn: 0 });
    expect(r.at).toBe(remote.at);
  });
});

test('code de secours : export puis import sur un autre appareil', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  await hanko.page.locator('header [data-act="settings"]').click();
  const code = await hanko.page.locator('#exp').inputValue();
  expect(sortKeys(JSON.parse(code))).toEqual(sortKeys(REAL));

  await hanko.page.evaluate(() => localStorage.clear());
  await hanko.run(H => { H.S = H.fresh() });
  await hanko.page.locator('#impt').fill(code);
  await hanko.page.locator('#imp button').click();
  await expect(hanko.page.locator('#impm')).toHaveText('Progression importée.');
  expect(sortKeys(await hanko.stored())).toEqual(sortKeys({ ...REAL, at: T0 }));
});

test('code de secours invalide : refusé, progression intacte', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  await hanko.page.locator('header [data-act="settings"]').click();
  await hanko.page.locator('#impt').fill('{"xp":99999}');
  await hanko.page.locator('#imp button').click();
  await expect(hanko.page.locator('#impm')).toHaveText('Ce code n’est pas valide.');
  expect((await hanko.run(H => H.S)).xp).toBe(500);
});
