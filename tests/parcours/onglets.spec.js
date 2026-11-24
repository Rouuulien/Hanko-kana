// Navigation par onglets : barre en bas, un écran par onglet, onglet courant non sauvegardé.
import { test, expect, T0, HOUR } from '../helpers/hanko.js';
import { UNITS } from '../../src/data/kana.js';
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

test('l’accueil se limite à la leçon, aux révisions et à la progression', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('header .brand')).toContainText('判子');
  await expect(page.locator('header')).toContainText('jours de suite');
  await expect(page.locator('header .pill')).toHaveCount(0); // plus de pastilles flamme / XP du jour
  for (const s of ['.hero', '.rev-n', '.figs', '.prog']) await expect(page.locator(s)).toBeVisible();
  await expect(page.locator('.hero .kick')).toHaveText(/Leçon du jour/);
  for (const s of ['.unit', '.sheet', '.words', '[data-act="rstart"]', '.seg'])
    await expect(page.locator(s)).toHaveCount(0);
});

test('accueil d’une sauvegarde neuve', async ({ hanko }) => {
  const page = (await hanko.open()).page;
  await expect(page.locator('.hero h1')).toHaveText('Voyelles');
  await expect(page.locator('.rev-n')).toHaveText('0');
  await expect(page.locator('[data-act="review"], [data-act="practice"]')).toHaveCount(0);
  await expect(page.locator('header')).not.toContainText('de suite');
});

test('accueil d’un parcours terminé', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await hanko.run(H => {
    for (const u of H.UNITS) {
      for (const l of u.lessons) {
        H.S.done[l.id] = true;
        for (const c of l.items) H.S.learned[c] ||= { box: 2, due: Date.now() + 864e5 };
      }
      H.S.tests[u.id] = 100;
    }
    H.saveLocal();
  });
  await page.reload();
  await expect(page.locator('.hero h1')).toHaveText('Tous les kana sont vus !');
  await expect(page.locator('[data-act="lesson"]')).toHaveCount(0);
  await expect(page.locator('[data-act="practice"]')).toBeVisible();
});

test('le retour des Réglages ne promet pas le Parcours quand il ramène ailleurs', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  await page.locator('header [data-act="settings"]').click();
  await expect(page.locator('.set [data-act="home"]')).toHaveText('← Retour');
});

test('Révisions à jour quand rien n’est dû, sinon kana à réviser', async ({ hanko }) => {
  const page = (await hanko.open({ state: { ...REAL, learned: { あ: { box: 2, due: T0 + 864e5 } } } })).page;
  await expect(page.locator('.rev')).toContainText('Révisions à jour');
  await expect(page.locator('.rev-n')).toHaveText('0');
  await hanko.open({ state: REAL, now: T0 + 52 * HOUR });
  await expect(hanko.page.locator('.rev')).toContainText('kana à réviser');
});

test('le défilement de chaque onglet est retrouvé', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  const y = () => page.evaluate(() => Math.round(window.scrollY));
  // Clic direct, sans le défilement automatique de Playwright vers l'élément (il fausserait la position).
  const toucher = s => page.evaluate(s => document.querySelector(s).click(), s);
  await ouvrir(page, 'path');
  await page.evaluate(() => document.fonts.ready); // une police chargée après coup déplacerait la page de quelques pixels
  await page.evaluate(() => window.scrollTo(0, 600));
  const y0 = await y();
  expect(y0).toBeGreaterThan(300);
  await toucher('.tabbar [data-id="sheet"]');
  await toucher('.tabbar [data-id="path"]');
  await expect.poll(y).toBe(y0);
  await toucher('[data-act="lesson"][data-id="h-ta"]');
  await toucher('[data-act="quit"]');
  await expect.poll(y).toBe(y0);
  await toucher('.tabbar [data-id="path"]'); // toucher l'onglet déjà ouvert remonte en haut
  await expect.poll(y).toBe(0);
});

test('un onglet raccourci ne reste pas défilé dans le vide', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.locator('header [data-act="settings"]').click();
  await page.locator('[data-act="reset"]').click();
  await page.locator('[data-act="reset"]').click();
  await ouvrir(page, 'words');
  const [sy, ih, sh] = await page.evaluate(() => [
    window.scrollY,
    window.innerHeight,
    document.documentElement.scrollHeight,
  ]);
  expect(sy + ih).toBeLessThanOrEqual(sh + 1);
});

test('l’onglet Tableau a son titre', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'sheet');
  await expect(page.locator('.tabt')).toHaveText('Tableau');
  await expect(page.locator('h2', { hasText: 'Tableau des kana' })).toHaveCount(0);
});

test('barre d’onglets centrée sur grand écran', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 1440, height: 900 });
  const page = (await hanko.open({ state: REAL })).page;
  const ecart = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.tabbar button')].map(e => e.getBoundingClientRect());
    return (b.at(-1).left + b.at(-1).right) / 2 - (b[0].left + b[0].right) / 2;
  });
  expect(ecart).toBeLessThanOrEqual(560);
});

test('charte « Sceau » : leçons terminées imprimées en vermillon, leçon en cours cerclée de vermillon', async ({
  hanko,
}) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'path');
  const [done, ac, curBord] = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.background = 'var(--ac)';
    document.body.append(probe);
    return [
      getComputedStyle(document.querySelector('.stp.done .sk')).backgroundColor,
      getComputedStyle(probe).backgroundColor,
      getComputedStyle(document.querySelector('.stp.cur .sk')).borderTopColor,
    ];
  });
  expect(done).toBe(ac);
  expect(curBord).toBe(ac);
});

for (const scheme of ['light', 'dark'])
  test(`leçons terminées lisibles à 4,5:1 (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    await ouvrir(page, 'path');
    const ratio = await page
      .locator('.stp.done .sk')
      .first()
      .evaluate(e => {
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const lum = s => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = s;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]
            .map(v => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
            .reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
        };
        const cs = getComputedStyle(e),
          a = lum(cs.color),
          b = lum(cs.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

test('Parcours : une unité réussie porte le sceau « 済 », sans teinte rouge', async ({ hanko }) => {
  const id = UNITS[0].id;
  const page = (await hanko.open({ state: { ...REAL, tests: { ...REAL.tests, [id]: 100 } } })).page;
  await ouvrir(page, 'path');
  await expect(page.locator('.uhead.full .uok')).toHaveCount(1);
  await expect(page.locator('.uhead.full .uok')).toHaveText('済');
});
