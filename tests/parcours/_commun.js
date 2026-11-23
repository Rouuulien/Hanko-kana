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

/** Textes visibles sous le seuil, sous la forme « ratio sélecteur "texte" ». */
export const releve = page =>
  page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = s => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    };
    const sur = (f, b) => ({
      r: f.r * f.a + b.r * (1 - f.a),
      g: f.g * f.a + b.g * (1 - f.a),
      b: f.b * f.a + b.b * (1 - f.a),
      a: 1,
    });
    const lum = c => {
      const f = v => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const fond = el => {
      const couches = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage !== 'none') return null; // dégradé ou image : non mesurable
        const c = rgb(cs.backgroundColor);
        if (c.a > 0) couches.push(c);
        if (c.a >= 1) break;
      }
      return couches.reverse().reduce((b, c) => sur(c, b), { r: 255, g: 255, b: 255, a: 1 });
    };
    const bas = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!el.offsetParent || el.closest('svg')) continue;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || +cs.opacity < 0.99 || el.matches(':disabled')) continue;
      const b = fond(el);
      if (!b) continue;
      const [x, y] = [lum(sur(rgb(cs.color), b)), lum(b)].sort((p, q) => q - p);
      const ratio = (x + 0.05) / (y + 0.05);
      const grand = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
      if (ratio < (grand ? 3 : 4.5))
        bas.push(
          `${ratio.toFixed(2)} ${el.tagName.toLowerCase()}.${el.className} "${el.textContent.trim().slice(0, 24)}"`,
        );
    }
    return [...new Set(bas)];
  });
