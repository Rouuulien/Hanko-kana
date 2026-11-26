/* ---------- Dessins SVG des kana : modèle animé (ordre des traits) et aides au tracé ---------- */
import { KS } from './strokes.js';
function modelSVG(c, o) {
  o = o || {};
  const k = KS && KS[c];
  if (!k) return '';
  const anim = o.anim !== false,
    st = o.speed || 0.6;
  return `<svg class="model ${o.cls || ''} ${anim ? 'anim' : ''}" viewBox="0 0 109 109" aria-hidden="true">${k.d.map((d, i) => `<path d="${d}" pathLength="1" style="animation-delay:${(i * st).toFixed(2)}s"/>`).join('')}${o.nums === false ? '' : k.p.map((p, i) => `<text x="${Math.max(2, p[0] - 6)}" y="${Math.max(8, p[1] - 3)}" style="animation-delay:${(i * st).toFixed(2)}s">${i + 1}</text>`).join('')}</svg>`;
}
/** Flèche de direction au départ d'un trait : suit les premiers points échantillonnés du trait (p : x0,y0,x1,y1…),
 *  de la sortie du rond numéroté (r 4,4) jusqu'à 18 unités du départ au plus, pointe orientée dans le sens du tracé. */
function arrowSVG(p) {
  const pts = [];
  for (let i = 0; i + 1 < p.length; i += 2) pts.push([p[i], p[i + 1]]);
  // abscisse curviligne de chaque point, puis point exact à une distance donnée le long du trait
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  const at = t => {
    let i = 1;
    while (i < pts.length - 1 && cum[i] < t) i++;
    const a = pts[i - 1],
      b = pts[i],
      k = (t - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  };
  const t0 = Math.min(6, total * 0.45),
    t1 = Math.min(18, total);
  const out = [at(t0), ...pts.filter((_, i) => cum[i] > t0 && cum[i] < t1), at(t1)];
  const [x, y] = out[out.length - 1],
    [px, py] = out[out.length - 2],
    l = Math.hypot(x - px, y - py) || 1,
    ux = (x - px) / l,
    uy = (y - py) / l;
  const f = v => v.toFixed(1);
  const head = [
    [x + ux * 2.4, y + uy * 2.4],
    [x - ux * 1.6 - uy * 2.4, y - uy * 1.6 + ux * 2.4],
    [x - ux * 1.6 + uy * 2.4, y - uy * 1.6 - ux * 2.4],
  ];
  return `<polyline class="dir" points="${out.map(q => f(q[0]) + ',' + f(q[1])).join(' ')}"/><path class="dirh" d="M${head.map(q => f(q[0]) + ' ' + f(q[1])).join('L')}Z"/>`;
}
function aidSVG(c, aid, n, animFull) {
  const k = KS && KS[c];
  if (!k || aid <= 0) return '';
  const N = k.d.length;
  let h = '';
  if (aid >= 3) return modelSVG(c, { cls: 'hintm', anim: !!animFull, speed: 0.5 }) + (n < N ? aidSVG(c, 1, n) : '');
  if (aid >= 2) h += k.d.map(d => `<path class="g" d="${d}"/>`).join('');
  if (n < N) {
    if (aid >= 2) h += `<path class="nx" d="${k.d[n]}" pathLength="1"/>`;
    const p = k.p[n];
    h += arrowSVG(p);
    h += `<circle cx="${p[0]}" cy="${p[1]}" r="4.4"/><text x="${p[0]}" y="${(p[1] + 2.1).toFixed(1)}">${n + 1}</text>`;
  }
  return `<svg class="aid" viewBox="0 0 109 109" aria-hidden="true">${h}</svg>`;
}

export { modelSVG, aidSVG };
