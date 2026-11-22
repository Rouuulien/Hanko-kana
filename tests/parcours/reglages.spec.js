// Réglages : options, remise à zéro (seulement après confirmation explicite).
import { test, expect } from '../helpers/hanko.js';
import { REAL } from './_commun.js';

test('couper les sons est enregistré', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="tog"][data-k="snd"]').uncheck();
  expect((await hanko.stored()).snd).toBe(false);
});

test('effacer la progression demande une confirmation', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  // Une autre action désarme la confirmation. INCOHÉRENCE CONNUE (figée, sans risque) : le bouton n'est pas
  // réaffiché et garde « Confirmer », mais le clic suivant ne fait que réarmer, il n'efface rien.
  await page.locator('[data-act="tog"][data-k="draw"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  await page.locator('[data-act="reset"]').click();
  expect((await hanko.run(H => H.S)).xp).toBe(500);

  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('0 / 208');
  const st = await hanko.stored();
  expect(st.xp).toBe(0);
  expect(st.learned).toEqual({});
});
