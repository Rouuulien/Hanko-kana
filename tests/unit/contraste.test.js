// Contraste des couleurs de la charte (variables de :root dans styles.css), en clair et en sombre.
// Tout texte doit tenir 4,5:1 (WCAG 2, niveau AA) sur le fond où il est posé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));
/** { nom: [clair, sombre] } pour chaque variable de couleur écrite en hexadécimal. */
const vars = {};
for (const [, nom, val] of root.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
  const ld = val.match(/^light-dark\(\s*(#[0-9a-f]{3,6})\s*,\s*(#[0-9a-f]{3,6})\s*\)$/i);
  if (ld) vars[nom] = [ld[1], ld[2]];
  else if (/^#[0-9a-f]{3,6}$/i.test(val.trim())) vars[nom] = [val.trim(), val.trim()];
}
const lum = hex => {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const COUPLES = [
  ['ink', 'bg'],
  ['ink', 'card'],
  ['ink', 'sand'],
  ['mut', 'bg'],
  ['mut', 'card'],
  ['ac-ink', 'bg'],
  ['on-ac', 'ac'],
  ['on-bad', 'bad'],
  ['sage-ink', 'bg'],
  ['gold-ink', 'bg'],
  ['ok', 'card'],
  ['bad', 'card'],
];
for (const [t, f] of COUPLES)
  test(`contraste ${t} sur ${f} ≥ 4,5 en clair et en sombre`, () => {
    assert.ok(vars[t] && vars[f], `variables --${t} et --${f} définies dans :root`);
    for (const [i, theme] of ['clair', 'sombre'].entries()) {
      const r = ratio(vars[t][i], vars[f][i]);
      assert.ok(r >= 4.5, `${theme} : ${vars[t][i]} sur ${vars[f][i]} = ${r.toFixed(2)}`);
    }
  });

test('plus aucune trace de l’ancienne charte (hors Daru, inchangé jusqu’au chantier 2)', () => {
  const ROOT = new URL('../../', import.meta.url).pathname;
  const fichiers = ['styles.css', 'index.html', 'confidentialite.html', 'manifest.webmanifest'];
  const walk = d =>
    readdirSync(ROOT + d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : [],
    );
  fichiers.push(...walk('src').filter(f => !f.endsWith('/daru.js')));
  const ANCIEN = /Zen Maru Gothic|Outfit|#e3402a|#1d1b20|#f2b33d|#fbfaf8/i;
  const restes = fichiers.filter(f => ANCIEN.test(readFileSync(ROOT + f, 'utf8')));
  assert.deepEqual(restes, []);
});

test('plus de scène sombre : ni variables --st-*, ni zone de dessin .pad.dark', () => {
  const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');
  assert.ok(!css.includes('--st-'), 'variables --st-* encore présentes');
  assert.ok(!css.includes('.pad.dark'), 'règle .pad.dark encore présente');
});
