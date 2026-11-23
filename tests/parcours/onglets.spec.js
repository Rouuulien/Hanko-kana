// Navigation par onglets : barre en bas, un écran par onglet, onglet courant non sauvegardé.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';

test.use({ viewport: { width: 390, height: 844 } });

const actif = page => page.locator('.tabbar [aria-current="page"]');

test('l’appli s’ouvre sur Accueil, même si la sauvegarde avait un autre onglet', async ({ hanko }) => {
  const page = (await hanko.open({ state: { ...REAL, page: 'words' } })).page;
  await expect(actif(page)).toHaveAttribute('data-id', 'home');
  await expect(page.locator('.hero h1')).toBeVisible();
});

test('changer d’onglet n’enregistre rien', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  const avant = await hanko.stored();
  for (const id of ['path', 'sheet', 'words', 'train']) await ouvrir(page, id);
  expect(await hanko.stored()).toEqual(avant);
  expect(await hanko.run(H => H.tab)).toBe('train');
});

test('chaque onglet a son écran', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'path');
  await expect(page.locator('[data-act="lesson"][data-id="h-a"]')).toBeVisible();
  await expect(page.locator('.hero')).toHaveCount(0);
  await ouvrir(page, 'sheet');
  await expect(page.locator('.sheet')).toBeVisible();
  await expect(page.locator('.unit')).toHaveCount(0);
  await ouvrir(page, 'words');
  await expect(page.locator('.words')).toBeVisible();
  await expect(page.locator('.sheet')).toHaveCount(0);
  await ouvrir(page, 'train');
  await expect(page.locator('[data-act="rstart"]')).toBeVisible();
  await expect(page.locator('.words')).toHaveCount(0);
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await expect(page.locator('[data-act="bstart"]')).toBeVisible();
  await expect(actif(page)).toHaveAttribute('data-id', 'train');
});

test('la barre d’onglets disparaît en leçon, en jeu et en réglages, puis revient sur l’onglet d’origine', async ({
  hanko,
}) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'path');
  await page.locator('[data-act="lesson"][data-id="h-ta"]').click();
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await page.locator('[data-act="quit"]').click();
  await expect(actif(page)).toHaveAttribute('data-id', 'path');

  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await page.locator('[data-act="rquit"]').click();
  await expect(actif(page)).toHaveAttribute('data-id', 'train');
  await expect(page.locator('[data-act="rstart"]')).toBeVisible();

  await ouvrir(page, 'words');
  await page.locator('header [data-act="settings"]').click();
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await page.locator('[data-act="home"]').first().click();
  await expect(actif(page)).toHaveAttribute('data-id', 'words');
});

test('effacer la progression ramène sur Accueil', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="reset"]').click();
  await page.locator('[data-act="reset"]').click();
  await expect(actif(page)).toHaveAttribute('data-id', 'home');
});

test('le bas de l’onglet le plus long reste accessible au-dessus de la barre', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'path');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const [bas, barre] = await page.evaluate(() => [
    [...document.querySelectorAll('.unit')].pop().getBoundingClientRect().bottom,
    document.querySelector('.tabbar').getBoundingClientRect().top,
  ]);
  expect(bas).toBeLessThanOrEqual(barre);
});
