// Parcours d'un joueur : première leçon, révisions, test d'unité.
import { test, expect, T0, HOUR } from '../helpers/hanko.js';
import { finirQuiz } from '../helpers/joueur.js';
import { REAL } from './_commun.js';

test('premier lancement → première leçon → résultat → progression conservée au rechargement', async ({ hanko }) => {
  const errors = [];
  hanko.page.on('pageerror', e => errors.push(e.message));
  const page = (await hanko.open()).page;
  await expect(page.locator('.hero h1')).toHaveText('Voyelles');
  await page.locator('.hero [data-act="lesson"]').click();

  // Fiches de découverte : 5 voyelles, avec l'ordre des traits animé.
  for (const c of ['あ', 'い', 'う', 'え', 'お']) {
    await expect(page.locator('.card .pk')).toHaveText(c);
    await expect(page.locator('#tm svg.model')).toBeVisible();
    await page.locator('.cnav [data-act]').last().click();
  }
  const types = await finirQuiz(hanko);
  expect(types).toEqual(expect.arrayContaining(['k2r', 'r2k', 'type', 'draw']));
  await expect(page.locator('h1')).toHaveText('Leçon terminée');

  const st = await hanko.stored();
  expect(st.done).toEqual({ 'h-a': true });
  expect(st.learned).toEqual(Object.fromEntries(['あ', 'い', 'う', 'え', 'お'].map(c => [c, { box: 1, due: T0 + 4 * HOUR }])));
  expect(st).toMatchObject({ streak: 1, last: '2026-01-15', today: '2026-01-15', at: T0 });
  expect(st.xp).toBe(st.todayXp);
  expect(st.xp).toBeGreaterThan(10);

  await page.reload();
  await expect(page.locator('.hero h1')).toHaveText('Ligne K');
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('5 / 208');
  expect(errors).toEqual([]);
});

test('révision des kana échus : une erreur renvoie le kana en boîte 1, les autres montent', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL, now: T0 + 3 * HOUR })).page;
  await expect(page.locator('.rev-n')).toHaveText('4');
  await page.locator('[data-act="review"]').click();
  const first = await hanko.run(H => H.ses.queue[0].c);
  await finirQuiz(hanko, { erreurs: 1 });
  await expect(page.locator('h1')).toHaveText('Révision terminée');
  await expect(page.locator('.mrow .mk')).toHaveCount(1);

  const { learned } = await hanko.stored();
  for (const c of ['お', 'こ', 'け', 'し']) {
    if (c === first) expect(learned[c]).toEqual({ box: 1, due: T0 + 7 * HOUR });
    else expect(learned[c]).toEqual({ box: 3, due: T0 + 3 * HOUR + 3 * 864e5 });
  }
  await page.locator('[data-act="home"]').click();
  await expect(page.locator('.rev-n')).toHaveText('0');
});

test('test d’unité réussi : tampon obtenu et score enregistré', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await hanko.run(H => {
    const u = H.UNITS[0];
    for (const l of u.lessons) { H.S.done[l.id] = true; for (const c of l.items) H.S.learned[c] ||= { box: 2, due: Date.now() + 864e5 } }
    H.saveLocal();
  });
  await page.reload();
  await page.locator('[data-act="page"][data-id="path"]').click(); // la sauvegarde rouvre l'onglet Tableau
  await page.locator('[data-act="test"][data-id="h1"]').click();
  await finirQuiz(hanko);
  await expect(page.locator('h1')).toHaveText('Tampon obtenu !');
  expect((await hanko.stored()).tests).toEqual({ h1: 100 });
});
