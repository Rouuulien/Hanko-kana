// Quiz et fiche de découverte à la charte : panneau de réponse en bas, carte d'énoncé, bouton Écouter, icônes.
import { test, expect } from '../helpers/hanko.js';
import { forcer, ouvrirQuiz as quiz, repondreSansContinuer } from '../helpers/joueur.js';
import { UNITS } from '../../src/data/kana.js';
import { REAL, ouvrir } from './_commun.js';

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

test('plus de ↶ ↻ ✎ : des icônes', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('[data-act="replay"] svg')).toBeVisible();
  await expect(page.locator('[data-act="ctrace"] svg')).toBeVisible();
  await page.locator('[data-act="ctrace"]').click();
  await expect(page.locator('[data-act="pundo"] svg')).toBeVisible();
  const vieux = () => page.evaluate(() => /[↶↻✎]/.test(document.getElementById('app').innerText));
  expect(await vieux()).toBe(false);
  await page.locator('[data-act="go"]').first().click();
  await forcer(hanko, 'draw');
  await expect(page.locator('[data-act="qhint"] svg')).toBeVisible();
  expect(await vieux()).toBe(false);
});

test('fiche : navigation en bas en 52 px, zones tactiles, combinaisons sur une ligne', async ({ hanko }) => {
  const combi = UNITS.flatMap(u => u.lessons).find(l => [...l.items[0]].length > 1);
  const page = (await hanko.open({ state: { ...REAL, unlock: true } })).page;
  await ouvrir(page, 'path');
  await page.locator(`[data-act="lesson"][data-id="${combi.id}"]`).click();
  await expect(page.locator('.card .pk')).toHaveText(combi.items[0]);
  for (const h of await page.locator('.cnav .btn').evaluateAll(b => b.map(e => e.getBoundingClientRect().height)))
    expect(h).toBeGreaterThanOrEqual(52);
  expect(await petites(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const pk = await page
    .locator('.card .pk')
    .evaluate(e => [e.scrollWidth, e.clientWidth, e.getBoundingClientRect().height]);
  expect(pk[0]).toBeLessThanOrEqual(pk[1]);
  expect(await page.locator('.qcap').textContent()).toContain('découverte');
  await expect(page.locator('.ask')).toHaveCount(0);
});

test('dessin faux sur petit écran : toute la zone de dessin reste visible au-dessus du panneau', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 375, height: 667 });
  const page = await quiz(hanko);
  await forcer(hanko, 'draw');
  await repondreSansContinuer(hanko, false);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const fb = await box(page, '.fb'),
    qp = await box(page, '#qp');
  expect(qp.bottom).toBeLessThanOrEqual(fb.top);
});

test('combinaison sur petit écran : le bouton Écouter ne touche pas le kana', async ({ hanko }) => {
  await hanko.page.setViewportSize({ width: 375, height: 667 });
  const page = await quiz(hanko, { voix: true });
  await hanko.run(H => {
    H.ses.queue[H.ses.i + 1].c = 'きゃ';
    delete H.ses.queue[H.ses.i + 1].o;
  });
  await forcer(hanko, 'k2r');
  await repondreSansContinuer(hanko, true);
  const k = await page.locator('.prompt .pk').evaluate(e => {
    const r = document.createRange();
    r.selectNodeContents(e);
    return r.getBoundingClientRect().toJSON(); // boîte des glyphes eux-mêmes
  });
  const b = await box(page, '.prompt [data-act="say"]');
  const touche = !(b.left >= k.right || b.right <= k.left || b.top >= k.bottom || b.bottom <= k.top);
  expect(touche).toBe(false);
});

test('fiche : astuces sous la carte', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('.hero [data-act="lesson"]').click();
  await page.locator('.cnav [data-act]').last().click(); // ち : « se prononce tchi »
  await expect(page.locator('.card .pk')).toHaveText('ち');
  await expect(page.locator('.card .hint')).toHaveCount(0);
  await expect(page.locator('.hints .hint').first()).toBeVisible();
});

test('dessin faux : « J’avais juste » sur sa propre ligne', async ({ hanko }) => {
  const page = await quiz(hanko);
  await forcer(hanko, 'draw');
  const c = await hanko.run(H => H.ses.queue[H.ses.i].c);
  // un kana à plusieurs traits, pour qu'un tracé à l'envers soit refusé
  if (!(await hanko.run((H, c) => H.KS[c].p.length > 1, c))) {
    await hanko.run(H => {
      H.ses.queue[H.ses.i].c = 'た';
    });
    await page.locator('[data-act="pclear"]').click(); // réaffiche la question avec le kana choisi
  }
  await repondreSansContinuer(hanko, false);
  await expect(page.locator('.fb [data-act="qself"]')).toBeVisible();
  await expect(page.locator('.note [data-act="qself"]')).toHaveCount(0);
});

for (const [scheme, attendu] of [
  ['light', 'rgb(94, 115, 96)'],
  ['dark', 'rgb(155, 174, 154)'],
])
  test(`bonne réponse : bordure au jeton du thème (${scheme})`, async ({ hanko }) => {
    await hanko.page.emulateMedia({ colorScheme: scheme });
    const page = await quiz(hanko);
    await forcer(hanko, 'k2r');
    await repondreSansContinuer(hanko, true);
    expect(await page.locator('.opt.ok').evaluate(e => getComputedStyle(e).borderTopColor)).toBe(attendu);
  });
