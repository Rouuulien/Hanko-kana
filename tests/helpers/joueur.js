// Gestes d'un joueur : cliquer, taper, dessiner au doigt.
// L'état interne (via le hook) sert seulement d'oracle pour connaître la bonne réponse ;
// le jeu est toujours piloté par l'interface, comme un vrai joueur.
import { expect } from '@playwright/test';

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
