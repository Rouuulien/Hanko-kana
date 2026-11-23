// Rafale et Pinceau suivent le thème (fin de la scène sombre) : maquettes « Étape 3 · PR 2 ».
import { test, expect } from '../helpers/hanko.js';
import { finirRafale } from '../helpers/joueur.js';
import { REAL, ouvrir } from './_commun.js';

test.use({ viewport: { width: 390, height: 844 } });

const FOND = { light: 'rgb(247, 245, 239)', dark: 'rgb(27, 26, 23)' };
const CARTE = { light: 'rgb(255, 255, 255)', dark: 'rgb(36, 35, 31)' };
const fond = (page, s) => page.locator(s).evaluate(e => getComputedStyle(e).backgroundColor);

for (const scheme of ['light', 'dark'])
  test(`Rafale suit le thème (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    await ouvrir(page, 'rush');
    await page.locator('[data-act="rstart"]').click();
    expect(await fond(page, '.rz')).toBe(FOND[scheme]);
    expect(await fond(page, '#cf')).toBe(CARTE[scheme]);
  });

test('clavier de Rafale : icônes et zones tactiles, tout tient sur iPhone SE', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 375, height: 667 });
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  const fn = page.locator('.kb .fn');
  await expect(fn).toHaveCount(4);
  for (const t of await fn.allTextContents()) expect(t).not.toMatch(/[↻→←«]/);
  expect(await fn.locator('svg').count()).toBe(4);
  for (const h of await page.locator('.kb button').evaluateAll(b => b.map(e => e.getBoundingClientRect().height)))
    expect(h).toBeGreaterThanOrEqual(44);
  const [kb, bar] = await page.evaluate(() => [
    document.querySelector('.kb').getBoundingClientRect().bottom,
    document.querySelector('.rbar').getBoundingClientRect().top,
  ]);
  expect(kb).toBeLessThanOrEqual(667);
  expect(bar).toBeGreaterThanOrEqual(0);
});

test('Rafale en mode mots tient dans la carte à 375 px', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 375, height: 667 });
  const page = (await hanko.open({ state: { ...REAL, rct: 'words' } })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  const [sw, cw] = await page.locator('#cf').evaluate(e => [e.scrollWidth, e.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test('résultats de Rafale : plein cadre, record signalé, retour sur Entraîner', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  await finirRafale(hanko);
  await expect(page.locator('.gres .big-n')).toBeVisible();
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await expect(page.locator('header.top')).toHaveCount(0);
  await expect(page.locator('.grec')).toBeVisible();
  await page.locator('.gres [data-act="home"]').first().click();
  await expect(page.locator('.tabbar [aria-current="page"]')).toHaveAttribute('data-id', 'train');
});
