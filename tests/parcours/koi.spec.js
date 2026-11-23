// Koï, la mascotte (chantier 2) : dessin, réactions, thème, nage.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';
import { ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

test('l’Accueil montre Koï au repos', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .mascot .koi')).toHaveAttribute('data-state', /resting|swimming/);
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
