// Construction du site publié (scripts/build.mjs) : contenu, liste hors ligne, version du cache.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, PUBLISHED } from '../../scripts/build.mjs';

const ROOT = new URL('../../', import.meta.url).pathname;
const copie = () => {
  const d = mkdtempSync(join(tmpdir(), 'hanko-'));
  for (const f of [...PUBLISHED, 'sw.js']) cpSync(join(ROOT, f), join(d, f), { recursive: true });
  return d;
};
const walk = d =>
  readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)).map(f => e.name + '/' + f) : [e.name],
  );

test('seuls les fichiers du site sont publiés ; tous les modules, styles et données sont gardés hors ligne', () => {
  const out = mkdtempSync(join(tmpdir(), 'hanko-dist-'));
  const { shell } = build({ root: ROOT, out });
  for (const f of ['tests', 'node_modules', 'package.json', 'scripts', 'CLAUDE.md', 'README.md', 'supabase'])
    assert.equal(existsSync(join(out, f)), false, f);
  assert.ok(existsSync(join(out, 'data/KANJIVG-LICENSE.txt')), 'licence KanjiVG publiée');
  const site = walk(join(ROOT, 'src')).map(f => './src/' + f);
  for (const f of [
    ...site,
    './',
    './index.html',
    './styles.css',
    './data/kana-strokes.json',
    './manifest.webmanifest',
    './icons/icon-192.png',
  ])
    assert.ok(shell.includes(f), f);
  assert.ok(!shell.some(f => /\.(md|txt)$/.test(f)));
  const sw = readFileSync(join(out, 'sw.js'), 'utf8');
  assert.match(sw, /const V = 'hanko-[0-9a-f]{10}';/);
  assert.ok(sw.includes(`const SHELL = ${JSON.stringify(shell)};`));
});

test('version du cache : identique si rien ne change, différente dès qu’un fichier publié change', () => {
  const a = copie(),
    b = copie();
  const v1 = build({ root: a, out: join(a, 'dist') }).V,
    v2 = build({ root: b, out: join(b, 'dist') }).V;
  assert.equal(v1, v2);
  writeFileSync(join(b, 'styles.css'), readFileSync(join(b, 'styles.css'), 'utf8') + '\n/* retouche */\n');
  assert.notEqual(build({ root: b, out: join(b, 'dist') }).V, v1);
});

test('sw.js sans emplacement pour la version : la construction échoue au lieu de publier un cache figé', () => {
  const d = copie();
  writeFileSync(
    join(d, 'sw.js'),
    readFileSync(join(d, 'sw.js'), 'utf8').replace("const V = 'hanko-dev';", "const VERSION = 'x';"),
  );
  assert.throws(() => build({ root: d, out: join(d, 'dist') }), /version/);
});
