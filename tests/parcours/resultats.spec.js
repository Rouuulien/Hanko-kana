// Résultats de leçon, de test et de révision en plein cadre (même mise en page que les jeux).
import { test, expect } from '../helpers/hanko.js';
import { finirQuiz } from '../helpers/joueur.js';
import { REAL, ouvrir } from './_commun.js';

test.use({ viewport: { width: 390, height: 844 } });

test('leçon terminée : plein cadre, trois chiffres, Retour', async ({ hanko }) => {
  const page = (await hanko.open()).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await page.locator('[data-act="go"]').first().click();
  await finirQuiz(hanko);
  await expect(page.locator('h1')).toHaveText('Leçon terminée');
  await expect(page.locator('.tabbar')).toHaveCount(0);
  await expect(page.locator('header.top')).toHaveCount(0);
  await expect(page.locator('.gres .rfigs .fig1')).toHaveCount(3);
  await expect(page.locator('.gacts [data-act="lesson"]')).toHaveClass(/\bac\b/);
  await expect(page.locator('.gacts [data-act="home"]')).toHaveClass(/\bgh\b/);
});

test('test d’unité échoué : tampon discret, Retenter seule action rouge', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await hanko.run(H => {
    for (const l of H.UNITS[0].lessons) {
      H.S.done[l.id] = true;
      for (const c of l.items) H.S.learned[c] ||= { box: 2, due: Date.now() + 864e5 };
    }
    H.S.draw = false; // un kana d'un seul trait dessiné à l'envers reste juste : pas d'exercice de dessin ici
    H.saveLocal();
  });
  await page.reload();
  await ouvrir(page, 'path');
  await page.locator('[data-act="test"][data-id="h1"]').click();
  await finirQuiz(hanko, { erreurs: 10 });
  await expect(page.locator('h1')).toHaveText('Encore un effort');
  await expect(page.locator('.stamp')).toHaveClass(/\boff\b/);
  const rouges = page.locator('.gres .btn.ac');
  await expect(rouges).toHaveCount(1);
  await expect(rouges).toHaveAttribute('data-act', 'test');
});
