// Rafale et Pinceau suivent le thème (fin de la scène sombre) : maquettes « Étape 3 · PR 2 ».
import { test, expect } from '../helpers/hanko.js';
import { dessiner, finirPinceau, finirRafale } from '../helpers/joueur.js';
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

for (const scheme of ['light', 'dark'])
  test(`Pinceau suit le thème (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    await ouvrir(page, 'brush');
    await page.locator('[data-act="bstart"]').click();
    expect(await fond(page, '.rz')).toBe(FOND[scheme]);
    expect(await fond(page, '#bp')).toBe(CARTE[scheme]);
    await expect(page.locator('#bp')).not.toHaveClass(/\bdark\b/);
  });

test('Pinceau en sombre : la correction reste visible sur la zone de dessin', async ({ hanko }) => {
  await hanko.page.emulateMedia({ colorScheme: 'dark' });
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'brush');
  await page.locator('[data-act="bstart"]').click();
  let c = await hanko.run(H => H.bs.q[H.bs.u]);
  while (!(await hanko.run((H, c) => H.KS[c].p.length > 1, c))) {
    await page.locator('[data-act="bskip"]').click();
    await page.locator('#bnb').click();
    c = await hanko.run(H => H.bs.q[H.bs.u]);
  }
  await dessiner(hanko, '#bp', c, { reverse: true });
  await page.locator('[data-act="bcheck"]').click();
  await expect(page.locator('.bfb')).toHaveClass(/bad/);
  const ratio = await page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = s => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const lum = c =>
      c
        .map(v => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const trait = lum(rgb(getComputedStyle(document.querySelector('#bp .model path')).stroke));
    const fond = lum(rgb(getComputedStyle(document.querySelector('#bp')).backgroundColor));
    return (Math.max(trait, fond) + 0.05) / (Math.min(trait, fond) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(3);
});

test('résultats du Pinceau : plein cadre', async ({ hanko }) => {
  test.setTimeout(90000);
  const page = (await hanko.open({ state: { ...REAL, bn: 10 } })).page;
  await ouvrir(page, 'brush');
  await page.locator('[data-act="bstart"]').click();
  await finirPinceau(hanko);
  await expect(page.locator('.gres .big-n')).toBeVisible();
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await expect(page.locator('header.top')).toHaveCount(0);
  await expect(page.locator('.gres .rfigs .fig1')).toHaveCount(3);
});
