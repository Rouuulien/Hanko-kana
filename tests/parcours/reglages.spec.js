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
  // Une autre action désarme la confirmation, et le bouton reprend aussitôt son libellé
  // (corrigé : il restait sur « Confirmer » alors qu'un clic ne faisait plus que réarmer).
  await page.locator('[data-act="tog"][data-k="draw"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Effacer ma progression');
  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  expect((await hanko.run(H => H.S)).xp).toBe(500);

  await page.locator('[data-act="reset"]').click();
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('0 / 208');
  const st = await hanko.stored();
  expect(st.xp).toBe(0);
  expect(st.learned).toEqual({});
});

test('armer puis désarmer « Effacer » ne réaffiche pas la page : un code de secours en cours de saisie est conservé', async ({
  hanko,
}) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('header [data-act="settings"]').click();
  await page.locator('#impt').fill('{"learned":{}');
  await page.locator('[data-act="reset"]').click(); // armer
  await expect(page.locator('[data-act="reset"]')).toHaveText('Confirmer : tout effacer');
  await expect(page.locator('#impt')).toHaveValue('{"learned":{}'); // corrigé : armer vidait la saisie
  await page.locator('[data-act="tog"][data-k="snd"]').click();
  await expect(page.locator('[data-act="reset"]')).toHaveText('Effacer ma progression');
  await expect(page.locator('#impt')).toHaveValue('{"learned":{}');
});
