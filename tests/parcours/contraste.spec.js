// Contraste réel des textes affichés (couleur calculée sur le fond effectif, mélanges compris), en clair et en sombre,
// sur un écran d'iPhone : accueil, chaque onglet, réglages. Complète tests/unit/contraste.test.js, qui ne voit que
// les variables. Seuil WCAG AA : 4,5:1, ou 3:1 pour un grand texte (24 px, ou 18,66 px en gras).
import { test, expect } from '../helpers/hanko.js';
import { REAL, ouvrir, releve } from './_commun.js';
import { finirPinceau, finirQuiz, finirRafale, forcer, ouvrirQuiz, repondreSansContinuer } from '../helpers/joueur.js';

test.use({ viewport: { width: 390, height: 844 } });

for (const scheme of ['light', 'dark'])
  test(`tous les textes sont lisibles (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    await hanko.open({ state: REAL });
    const page = hanko.page;
    const bas = { accueil: await releve(page) };
    for (const id of ['path', 'sheet', 'words', 'rush', 'brush']) {
      await ouvrir(page, id);
      bas[id] = await releve(page);
    }
    await page.locator('header [data-act="settings"]').click();
    bas.reglages = await releve(page);
    expect(Object.fromEntries(Object.entries(bas).filter(([, v]) => v.length))).toEqual({});
  });

for (const scheme of ['light', 'dark'])
  test(`quiz lisible (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = await ouvrirQuiz(hanko);
    const bas = {};
    await forcer(hanko, 'k2r');
    bas.question = await releve(page);
    await repondreSansContinuer(hanko, true);
    bas.juste = await releve(page);
    await page.locator('#nb').click();
    await forcer(hanko, 'k2r');
    await repondreSansContinuer(hanko, false);
    bas.faux = await releve(page);
    await page.locator('#nb').click();
    await forcer(hanko, 'draw');
    await repondreSansContinuer(hanko, true);
    bas.dessin = await releve(page);
    expect(Object.fromEntries(Object.entries(bas).filter(([, v]) => v.length))).toEqual({});
  });

for (const scheme of ['light', 'dark'])
  test(`fiche lisible (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    await page.locator('.hero [data-act="lesson"]').click();
    const bas = { fiche: await releve(page) };
    await page.locator('[data-act="ctrace"]').click();
    bas.trace = await releve(page);
    expect(Object.fromEntries(Object.entries(bas).filter(([, v]) => v.length))).toEqual({});
  });

for (const scheme of ['light', 'dark'])
  test(`jeux lisibles (${scheme})`, async ({ hanko }) => {
    test.setTimeout(120000);
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open({ state: REAL })).page;
    const bas = {};
    await ouvrir(page, 'rush');
    await page.locator('[data-act="rstart"]').click();
    bas.rafale = await releve(page);
    await page.keyboard.type('x');
    bas.rafaleFaute = await releve(page);
    await page.keyboard.press('Backspace');
    await finirRafale(hanko);
    bas.rafaleResultats = await releve(page);
    await page.locator('.gres [data-act="home"]').first().click();
    await ouvrir(page, 'brush');
    await page.locator('[data-act="bstart"]').click();
    bas.pinceau = await releve(page);
    await page.locator('[data-act="bskip"]').click();
    bas.pinceauFaux = await releve(page);
    await page.locator('#bnb').click();
    await finirPinceau(hanko);
    bas.pinceauResultats = await releve(page);
    expect(Object.fromEntries(Object.entries(bas).filter(([, v]) => v.length))).toEqual({});
  });

for (const scheme of ['light', 'dark'])
  test(`résultats de leçon lisibles (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = (await hanko.open()).page;
    await page.locator('.hero [data-act="lesson"]').click();
    await page.locator('[data-act="go"]').first().click();
    await finirQuiz(hanko, { erreurs: 1 });
    expect(await releve(page)).toEqual([]);
  });
