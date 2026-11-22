/* ---------- fusion de deux progressions (cet appareil / en ligne) ----------
   Rien ne doit être perdu : union des kana (meilleure boîte), des leçons, meilleurs scores et records, XP maximale.
   Réglages et série de jours : ceux de la version la plus récente (champ at). */
import { fresh } from './state.js';
function merge(a, b) {
  const n = (a.at || 0) >= (b.at || 0) ? a : b,
    o = n === a ? b : a,
    r = Object.assign(fresh(), o, n);
  r.learned = Object.assign({}, o.learned);
  for (const [c, L] of Object.entries(n.learned || {})) {
    const p = r.learned[c];
    if (!p || L.box >= p.box) r.learned[c] = L;
  }
  r.done = Object.assign({}, o.done, n.done);
  r.tests = Object.assign({}, o.tests);
  for (const [k, v] of Object.entries(n.tests || {})) r.tests[k] = Math.max(v, r.tests[k] || 0);
  r.best = Object.assign({}, o.best);
  for (const [k, v] of Object.entries(n.best || {})) {
    const p = r.best[k];
    if (!p || (v.ms != null ? p.n !== v.n || v.ms < p.ms : v.kpm > p.kpm)) r.best[k] = v;
  }
  r.xp = Math.max(a.xp || 0, b.xp || 0);
  r.at = Math.max(a.at || 0, b.at || 0);
  return r;
}

export { merge };
