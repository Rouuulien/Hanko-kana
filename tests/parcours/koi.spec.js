// Koï : seule la carpe vue du dessus reste, elle nage dans le bassin. La Koï de profil (mascotte à bulles) est retirée.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';
import { ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

const profil = page => page.locator('.koi, .mascot, .bubble');

test('l’Accueil n’a pas de Koï de profil : elle nage dans le bassin', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(profil(page)).toHaveCount(0);
  await expect(page.locator('.pond .koi-top')).toHaveCount(1);
});

test('plus de Koï de profil ni de bulle : Mots, Rafale, Pinceau, fiche, retour du quiz', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  await expect(page.locator('.words .lead')).toContainText('mots');
  await expect(profil(page)).toHaveCount(0);
  await ouvrir(page, 'rush');
  await expect(page.locator('.rset .lead')).toBeVisible();
  await expect(profil(page)).toHaveCount(0);
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('.rz-top')).toBeVisible();
  await expect(profil(page)).toHaveCount(0);
  await page.locator('[data-act="rquit"]').click();
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await expect(page.locator('.rset .lead')).toBeVisible();
  await expect(profil(page)).toHaveCount(0);
  await ouvrir(page, 'path');
  await page.locator('[data-act="lesson"][data-id="h-ta"]').click();
  await expect(page.locator('.lead.card-m')).toBeVisible();
  await expect(profil(page)).toHaveCount(0);

  const quiz = await ouvrirQuiz(hanko);
  await repondreSansContinuer(hanko, true);
  await expect(quiz.locator('.fb .msg')).toBeVisible();
  await expect(profil(quiz)).toHaveCount(0);
});

test('plus de Daru dans la page', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await expect(page.locator('body')).not.toContainText('Daru');
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
