// Produit les polices hébergées avec l'appli (fonts/) : Noto Sans JP, Zen Old Mincho et Klee One, réduites aux
// caractères affichés par le jeu (latin, kana, ponctuation, et tout caractère présent dans le code et les pages).
// Outil de développement, lancé à la main (`npm run fonts`) quand un caractère nouveau apparaît : le site, lui,
// publie les fichiers woff2 produits, sans compilation. Sources : dépôt google/fonts (licence SIL OFL 1.1).
import subsetFont from 'subset-font';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://github.com/google/fonts/raw/main/ofl/';
/** Polices publiées : fichier produit ← fichier source du dépôt google/fonts. */
export const FONTS = [
  { out: 'NotoSansJP.woff2', src: 'notosansjp/NotoSansJP[wght].ttf', axes: { wght: { min: 400, max: 700 } } },
  { out: 'ZenOldMincho-400.woff2', src: 'zenoldmincho/ZenOldMincho-Regular.ttf' },
  { out: 'ZenOldMincho-700.woff2', src: 'zenoldmincho/ZenOldMincho-Bold.ttf' },
  { out: 'KleeOne-400.woff2', src: 'kleeone/KleeOne-Regular.ttf' },
  { out: 'KleeOne-600.woff2', src: 'kleeone/KleeOne-SemiBold.ttf' },
];
const LICENSES = [
  ['Noto Sans JP', 'notosansjp/OFL.txt'],
  ['Zen Old Mincho', 'zenoldmincho/OFL.txt'],
  ['Klee One', 'kleeone/OFL.txt'],
];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)).join('');
const walk = d =>
  readdirSync(d, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : [],
  );

/** Caractères à couvrir, triés et sans doublon. */
export function charset(root) {
  let s =
    range(0x20, 0x7e) +
    range(0xa0, 0xff) +
    range(0x2000, 0x206f) +
    range(0x3000, 0x303f) +
    range(0x3041, 0x3096) +
    range(0x3099, 0x309f) +
    range(0x30a0, 0x30ff) +
    '€';
  for (const f of [...walk(join(root, 'src')), join(root, 'index.html'), join(root, 'confidentialite.html')])
    s += readFileSync(f, 'utf8');
  return [...new Set([...s].filter(c => c >= ' '))].sort().join('');
}

async function source(cache, path) {
  const f = join(cache, path.replace(/\//g, '__'));
  if (!existsSync(f)) {
    const r = await fetch(BASE + path.replace('[', '%5B').replace(']', '%5D'));
    if (!r.ok) throw new Error(`${path} : HTTP ${r.status}`);
    writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  }
  return readFileSync(f);
}

export async function fonts(root = process.cwd()) {
  const cache = join(root, '.font-src'),
    out = join(root, 'fonts');
  mkdirSync(cache, { recursive: true });
  mkdirSync(out, { recursive: true });
  const text = charset(root);
  writeFileSync(join(out, 'charset.txt'), text);
  const sizes = [];
  for (const f of FONTS) {
    const buf = await subsetFont(await source(cache, f.src), text, {
      targetFormat: 'woff2',
      ...(f.axes ? { variationAxes: f.axes } : {}),
    });
    writeFileSync(join(out, f.out), buf);
    sizes.push(`${f.out} ${Math.round(buf.length / 1024)} Ko`);
  }
  const lic = [];
  for (const [name, p] of LICENSES)
    lic.push(`=== ${name} ===\n\n${(await source(cache, p)).toString('utf8').trim()}\n`);
  writeFileSync(join(out, 'OFL.txt'), lic.join('\n'));
  return { chars: [...text].length, sizes };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const { chars, sizes } = await fonts();
  console.log(`${chars} caractères · ${sizes.join(' · ')}`);
}
