// Transitions (étape 4) : entrée animée des écrans, des exercices et du panneau de réponse.
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir } from './_commun.js';
import { forcer, ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

test('changer d’onglet : seul le contenu fond, l’en-tête et la barre restent nets', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.evaluate(() => document.querySelector('.tabbar [data-id="path"]').click());
  await expect(page.locator('.tabv')).toHaveClass(/\btr-fade\b/);
  const [app, barre, tete] = await page.evaluate(() => [
    getComputedStyle(document.getElementById('app')).animationName,
    getComputedStyle(document.querySelector('.tabbar')).opacity,
    getComputedStyle(document.querySelector('header.top')).opacity,
  ]);
  expect(app).toBe('none');
  expect([barre, tete]).toEqual(['1', '1']);
});

test('la fin d’une animation d’un élément enfant ne bloque pas le nettoyage de l’écran', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.evaluate(() => {
    document.querySelector('.hero [data-act="lesson"]').click();
    // un enfant finit son animation avant l'écran : l'événement remonte jusqu'à #app
    document.querySelector('.qz').dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
  });
  await page.waitForTimeout(500);
  await expect(page.locator('#app')).not.toHaveClass(/\btr-rise\b/);
});

test('ouvrir une leçon : l’écran monte ; quitter : fondu', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('#app')).toHaveClass(/\btr-rise\b/);
  await page.locator('[data-act="quit"]').click();
  await expect(page.locator('#app')).toHaveClass(/\btr-fade\b/);
});

test('les éléments fixes ne bougent pas pendant un fondu', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'words');
  const bas = await page.evaluate(() => document.querySelector('.tabbar').getBoundingClientRect().bottom);
  expect(bas).toBe(844);
});

test('deux onglets très vite : rien ne reste transparent', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.evaluate(() => {
    document.querySelector('.tabbar [data-id="sheet"]').click();
    document.querySelector('.tabbar [data-id="words"]').click();
  });
  await page.waitForTimeout(400);
  expect(await page.locator('#app').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await expect(page.locator('.words')).toBeVisible();
});

test('fiche suivante : la carte glisse, l’écran ne remonte pas', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('#app')).not.toHaveClass(/\btr-rise\b/);
  await page.locator('.cnav [data-act]').last().click();
  await expect(page.locator('.qz')).toHaveClass(/\btr-next\b/);
  await expect(page.locator('#app')).not.toHaveClass(/\btr-(rise|fade)\b/);
});

test('réponse : le panneau monte et Continuer garde le focus', async ({ hanko }) => {
  const page = await ouvrirQuiz(hanko);
  await forcer(hanko, 'k2r');
  await repondreSansContinuer(hanko);
  await expect(page.locator('.fb')).toHaveClass(/\btr-up\b/);
  expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('nb');
});

test('question suivante : la carte glisse, le champ garde le focus', async ({ hanko }) => {
  const page = await ouvrirQuiz(hanko);
  await forcer(hanko, 'type');
  await expect(page.locator('.qz')).toHaveClass(/\btr-next\b/);
  expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('ti');
});

test('Pinceau : le kana suivant glisse', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'brush');
  await page.locator('[data-act="bstart"]').click();
  await page.locator('[data-act="bskip"]').click();
  await page.locator('#bnb').click();
  await expect(page.locator('.bstage')).toHaveClass(/\btr-next\b/);
});

test('Rafale : aucune animation d’écran pendant la frappe', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await ouvrir(page, 'rush');
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('#app')).not.toHaveClass(/\btr-rise\b/);
  await page.evaluate(() => {
    window.__anims = 0;
    document.addEventListener('animationstart', e => {
      if (e.target.matches('#app, .qz, .bstage')) window.__anims++;
    });
  });
  for (let i = 0; i < 3; i++) await page.keyboard.type(await hanko.run(H => H.rs.q[H.rs.u].t[H.rs.k].r));
  expect(await page.evaluate(() => window.__anims)).toBe(0);
});

test('Réduire les animations : fondu seul, plus court', async ({ hanko }) => {
  await hanko.page.emulateMedia({ reducedMotion: 'reduce' });
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  const app = await page
    .locator('#app')
    .evaluate(e => [getComputedStyle(e).animationName, getComputedStyle(e).animationDuration]);
  expect(app).toEqual(['tr-fade', '0.15s']);
  await page.locator('.cnav [data-act]').last().click();
  expect(await page.locator('.qz').evaluate(e => getComputedStyle(e).animationName)).toBe('tr-fade');
});
