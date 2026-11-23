// Koï, la mascotte (chantier 2) : dessin, réactions, thème, nage.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';
import { ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

test('l’Accueil montre Koï en 80 px, au repos une fois arrivée', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .mascot .koi')).toHaveAttribute('width', '80');
  await page.locator('.today-g .koi-w').evaluate(e => Promise.all(e.getAnimations().map(a => a.finished)));
  await expect(page.locator('.today-g .mascot .koi')).toHaveAttribute('data-state', 'resting');
});

test('Koï réagit aux réponses : contente puis encourageante', async ({ hanko }) => {
  const page = await ouvrirQuiz(hanko);
  await repondreSansContinuer(hanko, true);
  await expect(page.locator('.fb .koi')).toHaveAttribute('data-state', 'happy');
  await page.locator('#nb').click();
  await repondreSansContinuer(hanko, false);
  await expect(page.locator('.fb .koi')).toHaveAttribute('data-state', 'encouraging');
});

for (const scheme of ['light', 'dark'])
  test(`le contour de Koï suit le thème (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    const trait = await page
      .locator('.today-g .koi .line')
      .first()
      .evaluate(e => getComputedStyle(e).stroke);
    expect(trait).toBe(scheme === 'light' ? 'rgb(40, 40, 36)' : 'rgb(247, 245, 239)');
  });

test('Koï lisible dans l’en-tête de Rafale (44 px)', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('.rz-top .koi')).toHaveAttribute('width', '44');
});

test('plus de Daru dans la page', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('body')).not.toContainText('Daru');
});

// Arrivée en nageant (A) : `.koi-w` porte le déplacement, la koï ondule en `swimming`, puis se pose.
const fini = page => page.locator('.today-g .koi-w').evaluate(e => Promise.all(e.getAnimations().map(a => a.finished)));

test('arrivée sur l’Accueil : Koï entre en nageant puis se pose', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
  await expect(page.locator('.today-g .koi')).toHaveAttribute('data-state', 'swimming');
  await fini(page);
  await expect(page.locator('.today-g .koi-w')).not.toHaveClass(/\bkoi-in\b/);
  await expect(page.locator('.today-g .koi')).toHaveAttribute('data-state', 'resting');
});

test('un redessin de l’Accueil ne relance pas la nage', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await fini(page);
  await hanko.run(H => H.render());
  await expect(page.locator('.today-g .koi-w')).not.toHaveClass(/\bkoi-in\b/);
  await expect(page.locator('.today-g .koi')).toHaveAttribute('data-state', 'resting');
});

test('un redessin pendant l’arrivée la poursuit (chargement des tracés, synchro)', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
  await hanko.run(H => H.render());
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
  await fini(page);
  await expect(page.locator('.today-g .koi')).toHaveAttribute('data-state', 'resting');
});

test('retour d’un autre onglet : nouvelle arrivée', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await fini(page);
  await ouvrir(page, 'path');
  await ouvrir(page, 'home');
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
});

test('Réduire les animations : Koï est déjà à sa place', async ({ hanko }) => {
  await hanko.page.emulateMedia({ reducedMotion: 'reduce' });
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi')).toHaveAttribute('data-state', 'resting');
  await expect(page.locator('.today-g .koi-w')).not.toHaveClass(/\bkoi-in\b/);
});

test('pas de défilement horizontal pendant l’arrivée', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('thème sombre : œil et ouïe en Sumi sur le corps clair, barbillons clairs sur le fond', async ({ hanko }) => {
  await hanko.page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = (await hanko.open({ state: REAL })).page;
  const c = await page.evaluate(() => {
    const k = document.querySelector('.today-g .koi');
    return [
      getComputedStyle(k.querySelector('.eye-open')).fill,
      getComputedStyle(k.querySelector('.gill')).stroke,
      getComputedStyle(k.querySelector('.barbel')).stroke,
    ];
  });
  expect(c).toEqual(['rgb(40, 40, 36)', 'rgb(40, 40, 36)', 'rgb(247, 245, 239)']);
});

test('pendant l’arrivée, Koï nage sous la bulle sans masquer son texte', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi-w')).toHaveClass(/\bkoi-in\b/);
  const dessus = await page.evaluate(() => {
    const w = document.querySelector('.today-g .koi-w'),
      b = document.querySelector('.today-g .bubble').getBoundingClientRect();
    // on fige la nage à l'instant où Koï passe sur la bulle
    const a = w.getAnimations().find(x => x.animationName === 'koi-in');
    a.pause();
    for (let t = 0; t <= 1400; t += 20) {
      a.currentTime = t;
      const k = w.getBoundingClientRect(),
        x = k.left + k.width / 2,
        y = k.top + k.height / 2;
      if (x > b.left + 10 && x < b.right - 10 && y > b.top && y < b.bottom) {
        const e = document.elementFromPoint(x, y);
        return { t, dansLaBulle: !!e && !!e.closest('.bubble') };
      }
    }
    return { t: -1 };
  });
  expect(dessus.t).toBeGreaterThanOrEqual(0);
  expect(dessus.dansLaBulle).toBe(true);
});
