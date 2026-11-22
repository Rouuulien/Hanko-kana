// Version claude.ai : la page autonome construite par scripts/build-claude.mjs, avec un faux compte Claude.
// Pas de hook possible (tout le code est assemblé dans un seul script) : les réponses sont lues dans la page,
// et les lectures des kana viennent des données du jeu, importées ici côté test.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, T0 } from '../helpers/hanko.js';
import { buildClaude } from '../../scripts/build-claude.mjs';
import { ITEMS } from '../../src/data/kana.js';
import { REAL } from './_commun.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const KS = JSON.parse(readFileSync(join(ROOT, 'data/kana-strokes.json'), 'utf8'));
const byRomaji = (r, set) => Object.values(ITEMS).filter(i => i.r === r && set.includes(i.c)).map(i => i.c);

async function repondre(page, lesson) {
  const ask = await page.locator('.ask').textContent();
  if (ask.startsWith('Dessine')) {
    const [c] = byRomaji(await page.locator('.bprompt .pr').textContent(), lesson);
    const box = await page.locator('#qp canvas').boundingBox(), k = Math.min(box.width, box.height) / 109;
    for (const a of KS[c].p) {
      await page.mouse.move(box.x + a[0] * k, box.y + a[1] * k); await page.mouse.down();
      for (let i = 2; i < a.length; i += 2) await page.mouse.move(box.x + a[i] * k, box.y + a[i + 1] * k, { steps: 2 });
      await page.mouse.up();
    }
    await page.locator('[data-act="qcheck"]').click();
  } else if (ask.startsWith('Écris')) {
    await page.locator('#ti').fill(ITEMS[await page.locator('.prompt .pk').textContent()].r);
    await page.locator('#ti').press('Enter');
  } else if (ask.startsWith('Comment')) {
    await page.locator('.opt', { hasText: new RegExp(`^\\d${ITEMS[await page.locator('.prompt .pk').textContent()].r}$`) }).click();
  } else {
    const r = await page.locator('.prompt .pr').textContent();
    const opts = await page.locator('.opt span[lang=ja]').allTextContents();
    await page.locator('.opt').nth(opts.findIndex(c => ITEMS[c].r === r)).click();
  }
  await expect(page.locator('.fb')).toHaveClass(/\bok\b/);
  await page.locator('#nb').click();
}

test('page autonome : un seul script, aucun module ni service worker, progression du compte Claude récupérée et enregistrée', async ({ hanko, request }, info) => {
  const out = info.outputPath('claude');
  await buildClaude({ root: ROOT, out });
  await request.get('/__maj?key=claude&dir=' + encodeURIComponent(out));
  const urls = [], errors = [];
  hanko.page.on('request', r => urls.push(new URL(r.url()).pathname));
  hanko.page.on('pageerror', e => errors.push(e.message));

  const page = (await hanko.open({ hook: false, path: '/maj/claude/', claude: { remote: REAL } })).page;
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('15 / 208');
  await expect(page.locator('.foot [data-cloud]')).toContainText('compte Claude');

  // Leçon suivante (ligne T) avec fiches, quiz et dessin : les tracés viennent de data/kana-strokes.json, fichier voisin.
  await page.locator('.hero [data-act="lesson"]').click();
  const lesson = ['た', 'ち', 'つ', 'て', 'と'];
  for (const c of lesson) { await expect(page.locator('.card .pk')).toHaveText(c); await page.locator('.cnav [data-act]').last().click() }
  for (let i = 0; i < 60 && await page.locator('.ask').count(); i++) await repondre(page, [...lesson, ...Object.keys(REAL.learned)]);
  await expect(page.locator('h1')).toHaveText('Leçon terminée');

  await expect.poll(async () => JSON.parse((await hanko.fake()).doc.data).done['h-ta'], { timeout: 5000 }).toBe(true);
  const saved = JSON.parse((await hanko.fake()).doc.data);
  expect(Object.keys(saved.learned)).toHaveLength(20);
  expect(saved.at).toBe(T0);

  expect(urls.filter(u => /\/src\/|sw\.js|supabase/.test(u))).toEqual([]);
  expect(urls).toContain('/maj/claude/data/kana-strokes.json');
  expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length))).toBe(0);
  expect(errors).toEqual([]);
});
