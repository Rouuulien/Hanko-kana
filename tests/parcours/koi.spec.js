// Koï, la mascotte (chantier 2) : dessin, réactions, thème, nage.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';
import { ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

test('l’Accueil n’a plus de Koï de profil ni de bulle : elle nage dans le bassin', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('.today-g .koi, .today-g .bubble')).toHaveCount(0);
  await expect(page.locator('.pond .koi-top')).toHaveCount(1);
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
    await ouvrir(page, 'words');
    const trait = await page
      .locator('.words .koi .line')
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
  await ouvrir(page, 'words');
  const c = await page.evaluate(() => {
    const k = document.querySelector('.words .koi');
    return [
      getComputedStyle(k.querySelector('.eye-open')).fill,
      getComputedStyle(k.querySelector('.gill')).stroke,
      getComputedStyle(k.querySelector('.barbel')).stroke,
    ];
  });
  expect(c).toEqual(['rgb(40, 40, 36)', 'rgb(40, 40, 36)', 'rgb(247, 245, 239)']);
});

// Le bassin : Koï vue du dessus nage derrière les onglets (src/ui/pond.js).
const bassin = page => page.locator('.pond');
const visible = page =>
  bassin(page).evaluate(e => getComputedStyle(e).opacity !== '0' && !document.body.classList.contains('pond-off'));

test('Koï nage derrière chaque onglet, et pas en leçon, en jeu ni en réglages', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  for (const id of ['path', 'sheet', 'words', 'train', 'home']) {
    await ouvrir(page, id);
    expect(await visible(page), id).toBe(true);
  }
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('body')).toHaveClass(/\bpond-off\b/);
  await page.locator('[data-act="quit"]').click();
  await expect(page.locator('body')).not.toHaveClass(/\bpond-off\b/);
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('body')).toHaveClass(/\bpond-off\b/);
  await page.locator('[data-act="rquit"]').click();
  await page.locator('header [data-act="settings"]').click();
  await expect(page.locator('body')).toHaveClass(/\bpond-off\b/);
});

test('le bassin est hors de l’écran redessiné : la nage ne repart pas de zéro', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.evaluate(() => (document.querySelector('.pond').dataset.marque = '1'));
  await ouvrir(page, 'path');
  await hanko.run(H => H.render());
  await ouvrir(page, 'home');
  await expect(page.locator('.pond')).toHaveCount(1);
  await expect(page.locator('.pond')).toHaveAttribute('data-marque', '1');
  expect(await page.evaluate(() => !document.getElementById('app').contains(document.querySelector('.pond')))).toBe(
    true,
  );
});

test('Koï nage : elle bouge et ne capte aucun toucher', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  const pos = () => page.locator('.pond-k').evaluate(e => e.style.transform);
  const a = await pos();
  await expect.poll(pos).not.toBe(a);
  expect(await bassin(page).evaluate(e => getComputedStyle(e).pointerEvents)).toBe('none');
});

for (const [w, h] of [
  [390, 844],
  [1440, 900],
])
  test(`Koï reste toujours dans la fenêtre (${w}×${h})`, async ({ hanko }) => {
    await hanko.page.setViewportSize({ width: w, height: h });
    await hanko.open({ state: REAL });
    const dehors = await hanko.page.evaluate(async () => {
      const { at } = await import('./src/ui/pond.js');
      const out = [];
      for (let t = 0; t < 90; t += 0.25) {
        const { x, y } = at(t, innerWidth, innerHeight);
        if (x < innerWidth * 0.15 || x > innerWidth * 0.85 || y < innerHeight * 0.13 || y > innerHeight * 0.87)
          out.push(t);
      }
      return out;
    });
    expect(dehors).toEqual([]);
  });

test('Réduire les animations : Koï ne nage pas', async ({ hanko }) => {
  await hanko.page.emulateMedia({ reducedMotion: 'reduce' });
  const page = (await hanko.open({ state: REAL })).page;
  const pos = () => page.locator('.pond-k').evaluate(e => e.style.transform);
  const a = await pos();
  expect(a).not.toBe('');
  await page.waitForTimeout(300);
  expect(await pos()).toBe(a);
});
