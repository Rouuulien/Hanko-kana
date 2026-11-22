// Construit dist-claude/ : la version claude.ai (artifact). Une page autonome comme avant le passage en modules :
// styles et code en ligne dans index.html (les 25 modules assemblés en un seul script par esbuild), plus les fichiers
// voisins que la page charge (tracés des kana, icônes, manifeste). La sauvegarde passe alors par window.claude.
// esbuild ne sert qu'ici : le site GitHub Pages, lui, reste sans compilation.
import { build as esbuild } from 'esbuild';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FILES = ['data/kana-strokes.json', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/icon-192.png', 'icons/icon-512.png', 'manifest.webmanifest'];

export async function buildClaude({ root = process.cwd(), out = join(root, 'dist-claude') } = {}) {
  const r = await esbuild({ entryPoints: [join(root, 'src/main.js')], bundle: true, format: 'esm', write: false, charset: 'utf8', legalComments: 'inline', logLevel: 'silent' });
  const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script'); // ne pas fermer la balise par accident
  const css = readFileSync(join(root, 'styles.css'), 'utf8');
  let html = readFileSync(join(root, 'index.html'), 'utf8');
  const swap = (from, to) => { if (!html.includes(from)) throw new Error(`index.html : « ${from} » introuvable`); html = html.replace(from, () => to) };
  swap('<link rel="stylesheet" href="styles.css">', `<style>\n${css}</style>`);
  swap('<script type="module" src="src/main.js"></script>', `<script type="module">\n${js}</script>`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, 'icons'), { recursive: true });
  mkdirSync(join(out, 'data'), { recursive: true });
  writeFileSync(join(out, 'index.html'), html);
  for (const f of FILES) cpSync(join(root, f), join(out, f));
  return { out, size: Buffer.byteLength(html) };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const { out, size } = await buildClaude({ out: process.argv[2] ? resolve(process.argv[2]) : undefined });
  console.log(`${relative(process.cwd(), out)} : index.html autonome (${Math.round(size / 1024)} Ko) + ${FILES.length} fichiers voisins`);
}
