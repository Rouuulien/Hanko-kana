// Modes de jeu : Rafale (clavier) et Pinceau (dessin au doigt).
import { test, expect, T0 } from '../helpers/hanko.js';
import { dessiner } from '../helpers/joueur.js';
import { REAL } from './_commun.js';

test('Rafale, paquet complet : 15 kana tapés au clavier, nouveau record', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('[data-act="page"][data-id="rush"]').click();
  await page.locator('[data-act="rstart"]').click();
  await expect(page.locator('#rh')).toHaveText('Le chrono démarre à ta première lettre.');
  for (let i = 0; i < 15; i++) {
    if (i === 14) await page.clock.setFixedTime(T0 + 20000); // 20 s pour le paquet
    const r = await hanko.run(H => H.rs.q[H.rs.u].t[H.rs.k].r);
    await page.keyboard.type(r);
  }
  await expect(page.locator('.big-n')).toHaveText('00:20');
  expect((await hanko.stored()).best['deck-h-kana']).toEqual({ ms: 20000, n: 15, acc: 100 });
});

test('Rafale : une faute est comptée, il faut retaper la bonne lecture', async ({ hanko }) => {
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('[data-act="page"][data-id="rush"]').click();
  await page.locator('[data-act="rstart"]').click();
  await page.keyboard.type('x');
  await expect(page.locator('#cf')).toHaveClass(/bad/);
  await expect(page.locator('#rh')).toHaveText('Tape la bonne lecture pour continuer.');
  expect(await hanko.run(H => ({ err: H.rs.err, u: H.rs.u }))).toEqual({ err: 1, u: 0 });
  await page.keyboard.type(await hanko.run(H => H.rs.q[0].t[0].r));
  expect(await hanko.run(H => H.rs.u)).toBe(1);
});

// Corrigé : l'option « Tous » vaut 0, et le code lisait `S.bn || 10`, si bien qu'elle lançait 10 kana.
// La vraie sauvegarde est précisément réglée sur « Tous » (bn = 0) : 15 kana appris, 15 kana dessinés.
test('Pinceau, réglage « Tous » : tous les kana appris (15), un tracé dans le mauvais ordre refusé, record à part', async ({
  hanko,
}) => {
  test.setTimeout(120000);
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await expect(page.locator('.rset .bubble')).toContainText('15 kana');
  await expect(page.locator('.rbest')).toHaveText('Pas encore de record pour ces réglages.');
  await page.locator('[data-act="bstart"]').click();
  expect(await hanko.run(H => H.bs.q.length)).toBe(15);
  let wrong = null;
  for (let i = 0; i < 15; i++) {
    const c = await hanko.run(H => H.bs.q[H.bs.u]);
    const multi = await hanko.run((H, c) => H.KS[c].p.length > 1, c);
    const rev = !wrong && multi;
    if (rev) wrong = c;
    if (i === 14) await page.clock.setFixedTime(T0 + 90000);
    await dessiner(hanko, '#bp', c, { reverse: rev });
    await page.locator('[data-act="bcheck"]').click();
    await expect(page.locator('.bfb')).toHaveClass(rev ? /bad/ : /ok/);
    await page.locator('#bnb').click();
  }
  await expect(page.locator('.big-n')).toHaveText('14/15');
  await expect(page.locator('.mrow .mk')).toHaveCount(1);
  const best = (await hanko.stored()).best;
  // Record « Tous » sous sa propre clé ; les records « 10 kana » (obtenus avec 10 kana) restent intacts.
  expect(best['brush-h-0-L2']).toEqual({ ms: 90000, n: 15, acc: 93 });
  expect(best['brush-h-10-L2']).toEqual(REAL.best['brush-h-10-L2']);
  expect(best['brush-h-10-L1']).toEqual(REAL.best['brush-h-10-L1']);
});

test('Pinceau, réglage « 10 » : 10 kana, et l’ancien record « 10 kana » s’affiche toujours', async ({ hanko }) => {
  const page = (await hanko.open({ state: { ...REAL, bn: 10 } })).page;
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await expect(page.locator('.rset .bubble')).toContainText('10 kana');
  await expect(page.locator('.rbest')).toContainText('pour 10 kana, 80 %');
  await page.locator('[data-act="bstart"]').click();
  expect(await hanko.run(H => H.bs.q.length)).toBe(10);
});

test('Pinceau : une ancienne sauvegarde sans réglage du nombre de kana lance 10 kana', async ({ hanko }) => {
  const old = { ...REAL };
  delete old.bn;
  const page = (await hanko.open({ state: old })).page;
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await page.locator('[data-act="bstart"]').click();
  expect(await hanko.run(H => H.bs.q.length)).toBe(10);
});

test('Rafale, mots avec petit っ : on tape la consonne doublée (さっき → sakki), sans erreur ni plantage', async ({
  hanko,
}) => {
  const errors = [];
  hanko.page.on('pageerror', e => errors.push(e.message));
  const page = (await hanko.open({ state: { ...REAL, rct: 'words' } })).page;
  // Aucun mot de la liste n'a de petit っ : on en ajoute deux, lisibles avec les kana de la vraie sauvegarde.
  await hanko.run(H => {
    for (const [j, f] of [
      ['さっき', 'tout à l’heure'],
      ['いっこ', 'un objet'],
    ])
      H.WORDS.push({ j, f, t: H.toks(j), r: H.romaji(j), s: 'h' });
  });
  await page.locator('[data-act="page"][data-id="rush"]').click();
  await page.locator('[data-act="rstart"]').click();
  const deck = await hanko.run(H => H.rs.q.map(u => u.j));
  expect(deck).toEqual(expect.arrayContaining(['さっき', 'いっこ']));
  for (let i = 0; i < 200 && (await hanko.run(H => H.view)) === 'rush'; i++) {
    await page.keyboard.type(await hanko.run(H => H.rs.q[H.rs.u].t[H.rs.k].r));
  }
  await expect(page.locator('.rfigs .fig1 b').nth(2)).toHaveText('0'); // aucune erreur
  expect(errors).toEqual([]);
});
