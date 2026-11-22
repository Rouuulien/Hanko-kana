// Fixture commune : ouvre le jeu dans un état contrôlé.
// - aucun appel externe (polices, CDN Supabase, Supabase) : l'appli passe en mode « hors ligne » ;
// - Math.random à graine fixe, horloge figée : résultats reproductibles ;
// - `hanko.run(fn, arg)` exécute fn(__hanko, arg) dans la page (accès à l'état interne via le hook).
import { test as base, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fauxSupabase, fauxClaude } from './faux-cloud.js';

export const T0 = Date.UTC(2026, 0, 15, 9, 0, 0); // jeudi 15 janvier 2026, 10 h à Paris
export const HOUR = 36e5, DAY = 864e5;

const seedRandom = seed => {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const test = base.extend({
  hanko: async ({ page }, use) => {
    await page.route(/^https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|[^/]*\.supabase\.co)\//, r => r.abort());
    const h = {
      page,
      /** Ouvre le jeu. `state` : objet écrit dans localStorage avant le chargement (ou chaîne brute).
       *  `supabase: { session, remote }` ou `claude: { remote }` : faux service de sauvegarde en ligne. */
      async open({ state, now = T0, seed = 42, hook = true, supabase, claude } = {}) {
        await page.clock.setFixedTime(now);
        if (supabase) await page.addInitScript(fauxSupabase, supabase);
        if (claude) await page.addInitScript(fauxClaude, claude);
        await page.addInitScript(seedRandom, seed);
        if (state !== undefined) {
          await page.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1') } },
            ['hanko-kana-v1', typeof state === 'string' ? state : JSON.stringify(state)]);
        }
        await page.goto(hook ? '/?hook' : '/');
        if (hook) await page.waitForFunction(() => !!globalThis.__hanko);
        return h;
      },
      run: (fn, arg) => page.evaluate(([src, a]) => (0, eval)('(' + src + ')')(globalThis.__hanko, a), [fn.toString(), arg]),
      fake: () => page.evaluate(() => window.__fake),
      stored: () => page.evaluate(() => JSON.parse(localStorage.getItem('hanko-kana-v1'))),
    };
    await use(h);
  },
});
export { expect };

/** Compare `value` à tests/golden/<name>.json (référence enregistrée sur le code d'origine).
 *  `npm run golden` régénère les références : à ne faire que si le changement de comportement est voulu. */
export function expectGolden(name, value) {
  const file = new URL(`../golden/${name}.json`, import.meta.url);
  const json = JSON.stringify(value, null, 1) + '\n';
  if (process.env.UPDATE_GOLDEN) {
    mkdirSync(dirname(file.pathname), { recursive: true });
    writeFileSync(file, json);
    return;
  }
  let ref;
  try { ref = readFileSync(file, 'utf8') } catch { throw new Error(`Référence absente : lance « npm run golden » pour créer tests/golden/${name}.json`) }
  expect(JSON.parse(json), `écart avec la référence ${name}.json`).toEqual(JSON.parse(ref));
}
