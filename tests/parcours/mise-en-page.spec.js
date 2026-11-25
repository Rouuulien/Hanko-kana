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

test('zones tactiles d’au moins 44 px sur chaque onglet', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  for (const id of ONGLETS) {
    await ouvrir(hanko.page, id);
    const petites = await hanko.page.evaluate(() =>
      [...document.querySelectorAll('button, [data-act]')]
        .filter(e => e.offsetParent && !e.closest('.foot'))
        .map(e => [e.dataset.act || e.textContent.trim(), Math.round(e.getBoundingClientRect().height)])
        .filter(([, h]) => h < 44),
    );
    expect(petites, id).toEqual([]);
  }
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

test('zones tactiles d’au moins 44 px dans les Réglages', async ({ hanko }) => {
  await hanko.open({ state: REAL });
  await hanko.page.locator('header [data-act="settings"]').click();
  const petites = await hanko.page.evaluate(() =>
    [...document.querySelectorAll('button, [data-act], label.tg')]
      .filter(e => e.offsetParent && !e.closest('.foot') && !e.matches('a, .link, label.tg input'))
      .map(e => [e.dataset.act || e.textContent.trim().slice(0, 20), Math.round(e.getBoundingClientRect().height)])
      .filter(([, h]) => h < 44),
  );
  expect(petites).toEqual([]);
});

test('champs de connexion lisibles et assez grands (sans zoom de Safari iOS)', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL, supabase: {} })).page;
  await page.locator('header [data-act="settings"]').click();
  const champs = await page.locator('.rin').evaluateAll(es =>
    es.map(e => {
      const cs = getComputedStyle(e);
      return [
        e.id,
        parseFloat(cs.fontSize) >= 16,
        e.getBoundingClientRect().height >= 44,
        cs.borderTopColor !== 'rgb(118, 118, 118)',
      ];
    }),
  );
  expect(champs.length).toBeGreaterThan(0);
  for (const c of champs) expect(c).toEqual([c[0], true, true, true]);
});

// Charte « Sceau » : cadres SVG propres à chaque thème, y compris quand le thème est forcé.
test('les cadres de l’Accueil suivent le thème, système ou forcé', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  const cadres = () =>
    page.evaluate(() =>
      ['.hero', '.rev', '.rev .btn.gh'].map(s => getComputedStyle(document.querySelector(s)).borderImageSource),
    );
  await page.emulateMedia({ colorScheme: 'light' });
  const clair = await cadres();
  for (const c of clair) expect(c).toContain('data:image/svg+xml');
  await page.emulateMedia({ colorScheme: 'dark' });
  const sombre = await cadres();
  sombre.forEach((c, i) => expect(c).not.toBe(clair[i]));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  expect(await cadres()).toEqual(clair);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await cadres()).toEqual(sombre);
});

const rayons = (page, sels) =>
  page.evaluate(
    sels => Object.fromEntries(sels.map(s => [s, getComputedStyle(document.querySelector(s)).borderRadius])),
    sels,
  );

test('le Tableau garde ses arrondis d’avant la charte « Sceau »', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'sheet');
  expect(await rayons(page, ['.sheet', '.sheet .tabs', '.sheet .tabs button', '.cell'])).toEqual({
    '.sheet': '24px',
    '.sheet .tabs': '14px',
    '.sheet .tabs button': '12px',
    '.cell': '12px',
  });
});

test('l’écran de jeu Rafale garde ses arrondis d’avant la charte « Sceau »', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  expect(await rayons(page, ['.cd.front', '.typed', '.kb', '.kb button'])).toEqual({
    '.cd.front': '24px',
    '.typed': '14px',
    '.kb': '24px 24px 0px 0px',
    '.kb button': '13px',
  });
});
