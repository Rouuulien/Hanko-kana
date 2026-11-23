// Hors ligne et mises à jour, sur le site tel qu'il est publié (construit par scripts/build.mjs).
// Le jeu n'enregistre le service worker qu'en HTTPS : ici on l'enregistre à la main sur localhost.
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '../helpers/hanko.js';
import { build, PUBLISHED } from '../../scripts/build.mjs';
import { REAL, ouvrir } from './_commun.js';

const ROOT = new URL('../../', import.meta.url).pathname;
test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'Service worker et mode hors ligne fiables sous Chromium uniquement dans Playwright',
);

/** Copie des sources publiées dans `dir`, éventuellement modifiées, puis construction de `dir/dist`. */
function site(dir, edit = () => {}) {
  mkdirSync(dir, { recursive: true });
  for (const f of [...PUBLISHED, 'sw.js']) cpSync(join(ROOT, f), join(dir, f), { recursive: true });
  edit(dir);
  return build({ root: dir, out: join(dir, 'dist') });
}
/** Sert le site construit dans `dir` sous /maj/<clé>/ (une clé par test). */
const serve = (request, key, dir) => request.get(`/__maj?key=${key}&dir=` + encodeURIComponent(join(dir, 'dist')));
async function installe(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}
const versionActive = page => page.evaluate(async () => (await caches.keys()).join(','));

test('après une visite, le jeu fonctionne sans réseau', async ({ hanko, context, request }, info) => {
  const A = site(info.outputPath('a'));
  await serve(request, 'horsligne', info.outputPath('a'));
  await hanko.page.addInitScript(s => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('hanko-kana-v1', s);
      sessionStorage.setItem('seeded', '1');
    }
  }, JSON.stringify(REAL));
  const page = hanko.page;
  await page.goto('/maj/horsligne/');
  await installe(page);
  expect(await versionActive(page)).toBe(A.V);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('15 / 208');
  await ouvrir(page, 'brush'); // tracés des kana (data/kana-strokes.json) en cache
  await expect(page.locator('[data-act="bstart"]')).toBeEnabled();
  await ouvrir(page, 'home');
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('.card .pk')).toHaveText('た');
  await context.setOffline(false);
});

test('les polices viennent de l’appli, même hors ligne', async ({ hanko, context, request }, info) => {
  site(info.outputPath('a'));
  await serve(request, 'polices', info.outputPath('a'));
  const page = hanko.page;
  const externes = [];
  page.on('request', r => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) externes.push(r.url());
  });
  await page.goto('/maj/polices/');
  await installe(page);
  await context.setOffline(true);
  await page.reload();
  const ok = await page.evaluate(async () => {
    await Promise.all([document.fonts.load('16px "Noto Sans JP"'), document.fonts.load('40px "Klee One"', 'あ')]);
    return [document.fonts.check('16px "Noto Sans JP"'), document.fonts.check('40px "Klee One"', 'あ')];
  });
  expect(ok).toEqual([true, true]);
  expect(externes).toEqual([]);
  await context.setOffline(false);
});

test('mise à jour : la nouvelle page n’est jamais servie avec d’anciens modules, puis fonctionne hors ligne', async ({
  hanko,
  context,
  request,
}, info) => {
  const errors = [];
  const page = hanko.page;
  page.on('pageerror', e => errors.push(e.message));
  const A = site(info.outputPath('a'));
  // Version B : un module gagne un export que le point d'entrée utilise. Un ancien util.js en cache casserait la page.
  const B = site(info.outputPath('b'), dir => {
    writeFileSync(
      join(dir, 'src/util.js'),
      readFileSync(join(dir, 'src/util.js'), 'utf8') + "export const VERSION='B';\n",
    );
    const m = join(dir, 'src/main.js');
    writeFileSync(m, readFileSync(m, 'utf8') + "import{VERSION}from'./util.js';document.title='Hanko '+VERSION;\n");
  });
  expect(B.V).not.toBe(A.V);

  await serve(request, 'maj', info.outputPath('a'));
  await page.goto('/maj/maj/');
  await installe(page);
  await expect(page).toHaveTitle('Hanko · kana');

  await serve(request, 'maj', info.outputPath('b')); // déploiement de B
  await page.reload();
  await expect(page).toHaveTitle('Hanko B');
  await expect(page.locator('.hero h1')).toHaveText('Voyelles');
  await expect.poll(() => versionActive(page), { timeout: 10000 }).toBe(B.V); // l'ancien cache est supprimé

  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Hanko B');
  await expect(page.locator('.hero h1')).toHaveText('Voyelles');
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
