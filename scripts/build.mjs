// Construit dist/ : exactement ce qui est publié sur GitHub Pages. Aucune compilation du code : les fichiers sont copiés
// tels quels. Seul sw.js est complété : liste des fichiers gardés hors ligne (SHELL) et version du cache (V), calculée à
// partir du contenu publié. Toute modification d'un fichier change donc la version, sans rien incrémenter à la main.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Fichiers et dossiers publiés (le reste du dépôt — tests, outils, documentation — ne l'est pas). */
export const PUBLISHED = ['index.html', 'styles.css', 'confidentialite.html', 'manifest.webmanifest', 'src', 'data', 'icons'];
/** Extensions gardées hors ligne (les licences et README publiés ne sont pas mis en cache). */
const OFFLINE = /\.(html|css|js|json|webmanifest|png|svg)$/;

const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

export function build({ root = process.cwd(), out = join(root, 'dist') } = {}) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of PUBLISHED) cpSync(join(root, f), join(out, f), { recursive: true });
  const files = walk(out).map(f => relative(out, f).split(sep).join('/')).filter(f => OFFLINE.test(f)).sort();
  const shell = ['./', ...files.map(f => './' + f)];
  const template = readFileSync(join(root, 'sw.js'), 'utf8');
  const h = createHash('sha256').update(template);
  for (const f of files) h.update('\0' + f + '\0').update(readFileSync(join(out, f)));
  const V = 'hanko-' + h.digest('hex').slice(0, 10);
  let sw = template;
  const put = (re, v, what) => { if (!re.test(sw)) throw new Error(`sw.js : ${what} introuvable`); sw = sw.replace(re, v) };
  put(/const V = '[^']*';/, `const V = '${V}';`, 'la version (const V)');
  put(/const SHELL = \[[\s\S]*?\];/, `const SHELL = ${JSON.stringify(shell)};`, 'la liste SHELL');
  writeFileSync(join(out, 'sw.js'), sw);
  return { V, shell, out };
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  const { V, shell, out } = build({ out: process.argv[2] ? resolve(process.argv[2]) : undefined });
  console.log(`${relative(process.cwd(), out) || '.'} : ${shell.length} fichiers hors ligne, cache ${V}`);
}
