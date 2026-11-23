import { readFileSync } from 'node:fs';
export const REAL = JSON.parse(readFileSync(new URL('../fixtures/vraie-sauvegarde.json', import.meta.url), 'utf8'));
export const sortKeys = o =>
  JSON.parse(
    JSON.stringify(o, (k, v) =>
      v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v,
    ),
  );
/** Geste du joueur : ouvrir un onglet (home, path, sheet, words, train) ou un mode d'entraînement (rush, brush). */
export async function ouvrir(page, id) {
  if (id === 'rush' || id === 'brush') await page.locator('.tabbar [data-act="page"][data-id="train"]').click();
  await page.locator(`[data-act="page"][data-id="${id}"]`).first().click();
}
