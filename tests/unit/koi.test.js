// Koï vue du dessus (src/ui/koi.js) : SVG produit en chaîne, sans DOM. La Koï de profil est retirée.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as K from '../../src/ui/koi.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const walk = d =>
  readdirSync(ROOT + d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : [],
  );

test('koi.js n’exporte plus que la Koï du bassin', () => {
  assert.deepEqual(Object.keys(K), ['koiTop']);
  const s = K.koiTop();
  for (const a of ['class="koi-top"', 'aria-hidden="true"', 'kt-tail', 'kt-body']) assert.ok(s.includes(a), a);
});

test('aucun texte ne fait parler Koï à la première personne', () => {
  const src = walk('src')
    .map(f => readFileSync(ROOT + f, 'utf8'))
    .join('\n');
  for (const r of [/Koï est /, /Il me faut/, /je le vérifie/, /class="bubble"/, /class="mascot"/])
    assert.doesNotMatch(src, r);
});

test('plus de Daru dans le code ni dans les métadonnées', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const ROOT = new URL('../../', import.meta.url).pathname;
  const walk = d =>
    readdirSync(ROOT + d, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : [],
    );
  const fichiers = [...walk('src'), 'index.html', 'manifest.webmanifest', 'styles.css'];
  assert.deepEqual(
    fichiers.filter(f => /Daru|second œil/.test(readFileSync(ROOT + f, 'utf8'))),
    [],
  );
});
