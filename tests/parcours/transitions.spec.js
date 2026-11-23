// Transitions (étape 4) : entrée animée des écrans, des exercices et du panneau de réponse.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';

test.use({ viewport: { width: 390, height: 844 } });

test('changer d’onglet : fondu', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'path');
  await expect(page.locator('#app')).toHaveClass(/\btr-fade\b/);
});

test('ouvrir une leçon : l’écran monte ; quitter : fondu', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('#app')).toHaveClass(/\btr-rise\b/);
  await page.locator('[data-act="quit"]').click();
  await expect(page.locator('#app')).toHaveClass(/\btr-fade\b/);
});

test('les éléments fixes ne bougent pas pendant un fondu', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  const bas = await page.evaluate(() => document.querySelector('.tabbar').getBoundingClientRect().bottom);
  expect(bas).toBe(844);
});

test('deux onglets très vite : rien ne reste transparent', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.evaluate(() => {
    document.querySelector('.tabbar [data-id="sheet"]').click();
    document.querySelector('.tabbar [data-id="words"]').click();
  });
  await page.waitForTimeout(400);
  expect(await page.locator('#app').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await expect(page.locator('.words')).toBeVisible();
});
