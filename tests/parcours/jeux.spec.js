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

// BUG CONNU (figé) : l'option « Tous » vaut 0 et le code lit `S.bn||10` : elle lance donc 10 kana, pas tous.
// La vraie sauvegarde a précisément bn = 0.
test('Pinceau : réglage « Tous » → 10 kana dessinés (bug connu), un tracé dans le mauvais ordre refusé', async ({
  hanko,
}) => {
  test.setTimeout(90000);
  const page = (await hanko.open({ state: REAL })).page;
  await page.locator('[data-act="page"][data-id="brush"]').click();
  await page.locator('[data-act="bstart"]').click();
  expect(await hanko.run(H => H.bs.q.length)).toBe(10);
  let wrong = null;
  for (let i = 0; i < 10; i++) {
    const c = await hanko.run(H => H.bs.q[H.bs.u]);
    const multi = await hanko.run((H, c) => H.KS[c].p.length > 1, c);
    const rev = !wrong && multi;
    if (rev) wrong = c;
    if (i === 9) await page.clock.setFixedTime(T0 + 60000);
    await dessiner(hanko, '#bp', c, { reverse: rev });
    await page.locator('[data-act="bcheck"]').click();
    await expect(page.locator('.bfb')).toHaveClass(rev ? /bad/ : /ok/);
    await page.locator('#bnb').click();
  }
  await expect(page.locator('.big-n')).toHaveText('9/10');
  await expect(page.locator('.mrow .mk')).toHaveCount(1);
  // Ancien record : 72,5 s pour 10 kana → battu.
  expect((await hanko.stored()).best['brush-h-10-L2']).toEqual({ ms: 60000, n: 10, acc: 90 });
});
