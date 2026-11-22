// Serveur statique de test, sans dépendance.
// Sert le dépôt tel quel. Avec `?hook` dans l'URL de la page, ajoute après le script du jeu un petit module
// (tests/helpers/hook.mjs) qui expose l'état interne sous `window.__hanko` : cela permet de tester la logique
// sans modifier le code (les variables d'un module ne sont pas visibles de l'extérieur).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOOK } from './helpers/hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = +(process.env.PORT || 8123);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
};
const MARK = '</body></html>';
// Sites construits (dist, dist-claude) : /maj/<clé>/… est servi depuis le dossier choisi par /__maj?key=<clé>&dir=…,
// à l'intérieur de test-results/. Une clé par test : les tests en parallèle ne se gênent pas.
const majRoots = new Map();

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (path === '/__maj') {
    const dir = resolve(url.searchParams.get('dir') || '');
    if (!dir.startsWith(join(ROOT, 'test-results'))) { res.writeHead(403).end(); return }
    majRoots.set(url.searchParams.get('key') || '', dir);
    res.writeHead(204).end();
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const m = path.match(/^\/maj\/([\w-]+)(\/.*)$/);
  const base = m && majRoots.has(m[1]) ? majRoots.get(m[1]) : ROOT;
  if (base !== ROOT) path = m[2];
  const file = normalize(join(base, path));
  if (!file.startsWith(base) || /[\\/](node_modules|\.git|tests)[\\/]/.test(file.slice(base.length))) {
    res.writeHead(404).end();
    return;
  }
  try {
    let body = await readFile(file);
    if (url.searchParams.has('hook') && file.endsWith('index.html')) {
      const html = body.toString('utf8');
      if (!html.includes(MARK)) throw new Error('Point d’injection du hook introuvable dans index.html');
      body = html.replace(MARK, '<script type="module">' + HOOK + '</script>' + MARK);
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500, { 'content-type': 'text/plain' }).end(String(e.message));
  }
}).listen(PORT, () => console.log(`Hanko (tests) : http://localhost:${PORT}/`));
