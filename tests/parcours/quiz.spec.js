// Quiz et fiche de découverte à la charte : panneau de réponse en bas, carte d'énoncé, bouton Écouter, icônes.
import { test, expect } from '../helpers/hanko.js';
import { forcer, ouvrirQuiz as quiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

const box = (page, s) => page.locator(s).evaluate(e => e.getBoundingClientRect().toJSON());
const petites = page =>
  page.evaluate(() =>
    [...document.querySelectorAll('button, [data-act]')]
      .filter(e => e.offsetParent)
      .map(e => [e.dataset.act || e.textContent.trim(), Math.round(e.getBoundingClientRect().height)])
      .filter(([, h]) => h < 44),
  );

test('consigne et leçon sur une ligne', async ({ hanko }) => {
  const page = await quiz(hanko);
  await expect(page.locator('.qcap .qles')).toHaveText('Ligne T');
  await expect(page.locator('.qcap .ask')).toHaveText(/^(Comment|Quel|Écris|Dessine)/);
});

for (const [nom, vp] of [
  ['iPhone 13', { width: 390, height: 844 }],
  ['petit écran', { width: 375, height: 667 }],
])
  for (const juste of [true, false])
    test(`le panneau de réponse ne masque ni les choix ni Continuer (${nom}, ${juste ? 'juste' : 'faux'})`, async ({
      hanko,
    }) => {
      await hanko.page.setViewportSize(vp);
      const page = await quiz(hanko);
      await forcer(hanko, 'k2r');
      await repondreSansContinuer(hanko, juste);
      expect(await page.locator('.fb').evaluate(e => getComputedStyle(e).position)).toBe('fixed');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const fb = await box(page, '.fb'),
        opts = await box(page, '.opts'),
        nb = await box(page, '#nb');
      expect(opts.bottom).toBeLessThanOrEqual(fb.top);
      expect(nb.top).toBeGreaterThanOrEqual(0);
      expect(nb.bottom).toBeLessThanOrEqual(vp.height);
    });

test('dessin : la zone de dessin reste visible au-dessus du panneau', async ({ hanko }) => {
  const page = await quiz(hanko);
  await forcer(hanko, 'draw');
  await repondreSansContinuer(hanko, true);
  await expect(page.locator('.fb')).toHaveClass(/\bdraw\b/);
  await expect(page.locator('.fb .daru')).toHaveCount(0);
  const fb = await box(page, '.fb'),
    qp = await box(page, '#qp');
  expect(qp.bottom).toBeLessThanOrEqual(fb.top);
  expect(qp.top).toBeGreaterThanOrEqual(0);
});

test('écris la lecture : le champ reste visible après validation', async ({ hanko }) => {
  const page = await quiz(hanko);
  await forcer(hanko, 'type');
  await repondreSansContinuer(hanko, false);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const fb = await box(page, '.fb'),
    tf = await box(page, '#tf');
  expect(tf.bottom).toBeLessThanOrEqual(fb.top);
});

test('Écouter : absent avant la réponse sur « comment se lit », présent après', async ({ hanko }) => {
  const page = await quiz(hanko, { voix: true });
  await forcer(hanko, 'k2r');
  await expect(page.locator('.prompt [data-act="say"]')).toHaveCount(0);
  await repondreSansContinuer(hanko, true);
  await expect(page.locator('.prompt [data-act="say"]')).toBeVisible();
});

test('sans voix japonaise, aucun bouton Écouter', async ({ hanko }) => {
  const page = await quiz(hanko);
  for (const t of ['k2r', 'draw']) {
    await forcer(hanko, t);
    await expect(page.locator('.prompt [data-act="say"]')).toHaveCount(0);
    await repondreSansContinuer(hanko, true);
    await expect(page.locator('.prompt [data-act="say"]')).toHaveCount(0);
    await page.locator('#nb').click();
  }
});

test('zones tactiles d’au moins 44 px dans le quiz', async ({ hanko }) => {
  const page = await quiz(hanko);
  await forcer(hanko, 'k2r');
  expect(await petites(page)).toEqual([]);
  await repondreSansContinuer(hanko, false);
  expect(await petites(page)).toEqual([]);
});
