// Nettoyage : chaque classe citée dans styles.css doit être posée quelque part par le code ou les pages.
// Une règle sans usage alourdit la feuille et trompe la lecture ; si ce test échoue, supprimer la règle
// (ou, si la classe est construite par concaténation, l'ajouter à DYNAMIQUES avec la raison).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
// Cases du Tableau : `b${boîte}` (views.js, sheetV), boîtes 0 à 6.
const DYNAMIQUES = new Set(['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6']);

const fichiers = dir =>
  readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? fichiers(p) : p.endsWith('.js') ? [p] : [];
  });

test('aucune classe CSS orpheline', () => {
  const css = readFileSync(join(ROOT, 'styles.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '') // commentaires
    .replace(/url\([^)]*\)/g, ''); // chemins de polices
  const selecteurs = [...css.matchAll(/([^{}]+)\{/g)].map(m => m[1]).filter(s => !s.trim().startsWith('@'));
  const classes = new Set(selecteurs.flatMap(s => [...s.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1])));
  const code = [...fichiers(join(ROOT, 'src')), join(ROOT, 'index.html'), join(ROOT, 'confidentialite.html')]
    .map(f => readFileSync(f, 'utf8'))
    .join('\n');
  const orphelines = [...classes].filter(
    c => !DYNAMIQUES.has(c) && !new RegExp(`(^|[^\\w-])${c}([^\\w-]|$)`).test(code),
  );
  assert.deepEqual(orphelines.sort(), []);
});
