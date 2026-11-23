// Mise en page sur un écran d'iPhone (390 × 844) : rien ne déborde, zones tactiles confortables, charte respectée.
import { test, expect } from '../helpers/hanko.js';
import { UNITS } from '../../src/data/kana.js';
import { REAL, ouvrir } from './_commun.js';

test.use({ viewport: { width: 390, height: 844 } });

const ONGLETS = ['home', 'path', 'sheet', 'words', 'rush', 'brush'];
/** Les kana du bandeau d'accueil occupent une seule ligne (hauteur inférieure à deux lignes de texte). */
const uneLigne = page =>
  page.locator('.big-k').evaluate(e => {
    const cs = getComputedStyle(e);
    const ligne = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    return e.getBoundingClientRect().height < ligne * 1.5;
  });
const largeur = page => page.evaluate(() => document.documentElement.scrollWidth);

test('aucun écran ne déborde en largeur', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  expect(await largeur(hanko.page)).toBeLessThanOrEqual(390);
  for (const id of ONGLETS) {
    await ouvrir(hanko.page, id);
    expect(await largeur(hanko.page), id).toBeLessThanOrEqual(390);
  }
});

test('la leçon la plus longue tient sur l’accueil', async ({ hanko }) => {
  const lecons = UNITS.flatMap(u => u.lessons);
  const longue = lecons.reduce((a, b) =>
    b.items.slice(0, 5).join('').length > a.items.slice(0, 5).join('').length ? b : a,
  );
  const done = Object.fromEntries(lecons.filter(l => l !== longue).map(l => [l.id, true]));
  const tests = Object.fromEntries(UNITS.map(u => [u.id, 100]));
  await hanko.open({ state: { ...REAL, done, tests } });
  await expect(hanko.page.locator('.hero h1')).toHaveText(longue.t);
  const k = await hanko.page.locator('.big-k').evaluate(e => [e.scrollWidth, e.clientWidth]);
  expect(k[0]).toBeLessThanOrEqual(k[1]);
  expect(await largeur(hanko.page)).toBeLessThanOrEqual(390);
  expect(await uneLigne(hanko.page)).toBe(true);
});

test('les kana de la leçon du jour tiennent sur une ligne', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  expect(await uneLigne(hanko.page)).toBe(true);
});

test('zones tactiles d’au moins 44 px sur l’accueil', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  const petites = await hanko.page.evaluate(() =>
    [...document.querySelectorAll('button, [data-act]')]
      .filter(e => e.offsetParent && !e.closest('.foot'))
      .map(e => [e.dataset.act || e.textContent.trim(), Math.round(e.getBoundingClientRect().height)])
      .filter(([, h]) => h < 44),
  );
  expect(petites).toEqual([]);
});

for (const scheme of ['light', 'dark'])
  test(`le bandeau d’accueil n’est plus rouge (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    await hanko.open({ state: REAL });
    const [fond, ac] = await hanko.page.evaluate(() => {
      const probe = document.createElement('i');
      probe.style.background = 'var(--ac)';
      document.body.append(probe);
      return [
        getComputedStyle(document.querySelector('.hero')).backgroundColor,
        getComputedStyle(probe).backgroundColor,
      ];
    });
    expect(fond).not.toBe(ac);
    expect(fond).not.toBe('rgb(163, 58, 45)'); // ancien bandeau sombre
  });
