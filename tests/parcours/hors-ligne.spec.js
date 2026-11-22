// Hors ligne : après une première visite, le jeu se recharge sans réseau (service worker).
// Le jeu n'enregistre le service worker qu'en HTTPS : ici on l'enregistre à la main sur localhost.
import { test, expect } from '../helpers/hanko.js';
import { readdirSync } from 'node:fs';
import { REAL } from './_commun.js';

test('après une visite, le jeu fonctionne sans réseau', async ({ hanko, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Mode hors ligne + service worker fiable sous Chromium uniquement dans Playwright');
  const page = (await hanko.open({ state: REAL, hook: false })).page;
  await page.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.figs .fig1 b').first()).toHaveText('15 / 208');
  await page.locator('[data-act="page"][data-id="brush"]').click(); // tracés des kana (data/kana-strokes.json) en cache
  await expect(page.locator('[data-act="bstart"]')).toBeEnabled();
  await page.locator('.hero [data-act="lesson"]').click();
  await expect(page.locator('.card .pk')).toHaveText('た');
  await context.setOffline(false);
});

test('liste hors ligne (SHELL) : chaque fichier existe, aucun module ni feuille de style oublié', async ({ request }) => {
  const sw = await (await request.get('/sw.js')).text();
  const shell = JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const u of shell) expect((await request.get(u.replace(/^\.\//, '/'))).status(), u).toBe(200);
  const root = new URL('../../', import.meta.url);
  const site = [...readdirSync(new URL('src/', root), { recursive: true }).filter(f => f.endsWith('.js')).map(f => './src/' + f.replaceAll('\\', '/')),
    ...readdirSync(root).filter(f => f.endsWith('.css')).map(f => './' + f)];
  expect(shell).toEqual(expect.arrayContaining(site));
});
