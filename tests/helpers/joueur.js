// Gestes d'un joueur : cliquer, taper, dessiner au doigt.
// L'état interne (via le hook) sert seulement d'oracle pour connaître la bonne réponse ;
// le jeu est toujours piloté par l'interface, comme un vrai joueur.
import { expect } from '@playwright/test';
import { REAL } from '../parcours/_commun.js';

/** Trace un kana sur la zone de dessin `padSel` à partir de son modèle KanjiVG (coordonnées 109 × 109). */
export async function dessiner(hanko, padSel, c, { reverse = false } = {}) {
  const strokes = await hanko.run((H, c) => H.loadKS().then(KS => KS[c].p), c);
  const cv = hanko.page.locator(`${padSel} canvas`);
  await cv.scrollIntoViewIfNeeded();
  const box = await cv.boundingBox();
  const k = Math.min(box.width, box.height) / 109;
  const list = reverse ? [...strokes].reverse() : strokes;
  for (const a of list) {
    const pts = [];
    for (let i = 0; i < a.length; i += 2) pts.push([box.x + a[i] * k, box.y + a[i + 1] * k]);
    await hanko.page.mouse.move(...pts[0]);
    await hanko.page.mouse.down();
    for (const p of pts.slice(1)) await hanko.page.mouse.move(...p, { steps: 2 });
    await hanko.page.mouse.up();
  }
}

/** Répond à la question en cours du quiz (juste ou faux), puis passe à la suivante. Renvoie le type de question. */
export async function repondre(hanko, { juste = true } = {}) {
  const page = hanko.page;
  const Q = await hanko.run(H => {
    const Q = H.ses.queue[H.ses.i];
    return { c: Q.c, type: Q.type, o: Q.o, r: H.ITEMS[Q.c].r };
  });
  if (Q.type === 'type') {
    await page.locator('#ti').fill(juste ? Q.r : 'zzz');
    await page.locator('#ti').press('Enter');
  } else if (Q.type === 'draw') {
    await dessiner(hanko, '#qp', Q.c, { reverse: !juste });
    await page.locator('[data-act="qcheck"]').click();
  } else {
    const ok = Q.o.indexOf(Q.c);
    await page.locator(`.opt[data-i="${juste ? ok : (ok + 1) % Q.o.length}"]`).click();
  }
  await expect(page.locator('.fb')).toHaveClass(juste ? /\bok\b/ : /\bbad\b/);
  await page.locator('#nb').click();
  return Q.type;
}

/** Répond juste à toutes les questions jusqu'à l'écran de résultat. Renvoie les types rencontrés. */
export async function finirQuiz(hanko, { erreurs = 0 } = {}) {
  const types = [];
  for (let i = 0; i < 80; i++) {
    if ((await hanko.run(H => H.view)) !== 'quiz') return types;
    types.push(await repondre(hanko, { juste: i >= erreurs }));
  }
  throw new Error('Quiz sans fin');
}

/** Ouvre la leçon du jour (ligne T) et passe les fiches. */
export async function ouvrirQuiz(hanko, { voix = false } = {}) {
  if (voix)
    await hanko.page.addInitScript(() => {
      speechSynthesis.getVoices = () => [{ lang: 'ja-JP', name: 'Test' }];
      speechSynthesis.speak = () => {};
    });
  const page = (await hanko.open({ state: REAL })).page; // vraie sauvegarde : leçon du jour = ligne T
  await page.locator('.hero [data-act="lesson"]').click();
  await page.locator('[data-act="go"]').first().click();
  return page;
}
/** La question suivante sera de ce type : on le fixe, puis on répond juste à la question courante. */
export async function forcer(hanko, type) {
  await hanko.run((H, t) => {
    H.ses.queue[H.ses.i + 1].type = t;
  }, type);
  await repondre(hanko);
  expect(await hanko.run(H => H.ses.queue[H.ses.i].type)).toBe(type);
}
/** Comme repondre(), sans toucher Continuer. */
export async function repondreSansContinuer(hanko, juste = true) {
  const page = hanko.page;
  const Q = await hanko.run(H => {
    const Q = H.ses.queue[H.ses.i];
    return { c: Q.c, type: Q.type, o: Q.o, r: H.ITEMS[Q.c].r };
  });
  if (Q.type === 'type') {
    await page.locator('#ti').fill(juste ? Q.r : 'zzz');
    await page.locator('#ti').press('Enter');
  } else if (Q.type === 'draw') {
    await dessiner(hanko, '#qp', Q.c, { reverse: !juste });
    await page.locator('[data-act="qcheck"]').click();
  } else {
    const ok = Q.o.indexOf(Q.c);
    await page.locator(`.opt[data-i="${juste ? ok : (ok + 1) % Q.o.length}"]`).click();
  }
  await expect(page.locator('.fb')).toHaveClass(juste ? /\bok\b/ : /\bbad\b/);
}

/** Rafale lancée : tape juste chaque lecture jusqu'à l'écran de résultats. */
export async function finirRafale(hanko) {
  for (let i = 0; i < 400; i++) {
    if ((await hanko.run(H => H.view)) !== 'rush') return;
    const r = await hanko.run(H => H.rs.q[H.rs.u].t[H.rs.k].r);
    await hanko.page.keyboard.type(r);
  }
  throw new Error('Rafale sans fin');
}

/** Pinceau lancé : dessine chaque kana (le premier à plusieurs traits à l'envers si `faux`) jusqu'aux résultats. */
export async function finirPinceau(hanko, { faux = false } = {}) {
  const page = hanko.page;
  let fait = !faux;
  for (let i = 0; i < 400; i++) {
    if ((await hanko.run(H => H.view)) !== 'brush') return;
    const c = await hanko.run(H => H.bs.q[H.bs.u]);
    const rev = !fait && (await hanko.run((H, c) => H.KS[c].p.length > 1, c));
    if (rev) fait = true;
    await dessiner(hanko, '#bp', c, { reverse: rev });
    await page.locator('[data-act="bcheck"]').click();
    await page.locator('#bnb').click();
  }
  throw new Error('Pinceau sans fin');
}
