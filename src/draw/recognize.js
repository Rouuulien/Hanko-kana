/* ---------- Reconnaissance du tracé ----------
   Le tracé est normalisé (centré, mis à l'échelle), rééchantillonné, puis comparé à tous les kana de la même écriture :
   distance entre nuages de points (forme globale) et, à nombre de traits égal, trait par trait (forme, sens, ordre). */
import { ITEMS } from '../data/kana.js';
import { KS } from './strokes.js';
const DR = {};
const dLen = s => {
  let L = 0;
  for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
  return L;
};
function dRes(s, n) {
  if (s.length < 2) return Array.from({ length: n }, () => [s[0][0], s[0][1]]);
  const L = dLen(s),
    I = L / (n - 1) || 1,
    o = [[s[0][0], s[0][1]]],
    p = s.map(q => [q[0], q[1]]);
  let D = 0;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (D + d >= I && d > 0) {
      const t = (I - D) / d,
        q = [p[i - 1][0] + t * (p[i][0] - p[i - 1][0]), p[i - 1][1] + t * (p[i][1] - p[i - 1][1])];
      o.push(q);
      p.splice(i, 0, q);
      D = 0;
    } else D += d;
  }
  while (o.length < n) o.push([p[p.length - 1][0], p[p.length - 1][1]]);
  return o.slice(0, n);
}
function dNorm(strokes) {
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1e9,
    y1 = -1e9;
  for (const s of strokes)
    for (const [x, y] of s) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  const sc = Math.max(x1 - x0, y1 - y0) || 1,
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2,
    Ls = strokes.map(dLen),
    T = Ls.reduce((a, b) => a + b, 0) || 1,
    cloud = [],
    per = [];
  strokes.forEach((s, i) => {
    const f = q => [(q[0] - cx) / sc, (q[1] - cy) / sc];
    cloud.push(...dRes(s, Math.max(3, Math.round((48 * Ls[i]) / T))).map(f));
    per.push(dRes(s, 10).map(f));
  });
  return { cloud, per };
}
function dCloud(a, b) {
  const g = (A, B, st) => {
    const used = new Uint8Array(B.length);
    let sum = 0,
      i = st;
    do {
      let mi = 0,
        md = 1e9;
      for (let j = 0; j < B.length; j++) {
        if (used[j] && B.length >= A.length) continue;
        const d = Math.hypot(A[i][0] - B[j][0], A[i][1] - B[j][1]);
        if (d < md) {
          md = d;
          mi = j;
        }
      }
      used[mi] = 1;
      sum += (1 - ((i - st + A.length) % A.length) / A.length) * md;
      i = (i + 1) % A.length;
    } while (i !== st);
    return sum / A.length;
  };
  let ab = 1e9,
    ba = 1e9;
  for (let s = 0; s < a.length; s += Math.max(1, Math.floor(Math.sqrt(a.length)))) ab = Math.min(ab, g(a, b, s));
  for (let s = 0; s < b.length; s += Math.max(1, Math.floor(Math.sqrt(b.length)))) ba = Math.min(ba, g(b, a, s));
  return (ab + ba) / 2;
}
function dTpl(c) {
  if (!DR[c]) {
    const p = KS[c].p.map(a => {
      const o = [];
      for (let i = 0; i < a.length; i += 2) o.push([a[i], a[i + 1]]);
      return o;
    });
    DR[c] = dNorm(p);
  }
  return DR[c];
}
const dSt = (a, b) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += Math.hypot(a[i][0] - b[i][0], a[i][1] - b[i][1]);
  return d / a.length;
};
function dPer(U, t) {
  let fw = 0,
    dir = true,
    order = true;
  const n = t.per.length;
  for (let i = 0; i < n; i++) {
    const a = dSt(U.per[i], t.per[i]),
      b = dSt(U.per[i], [...t.per[i]].reverse());
    if (b < a * 0.7) dir = false;
    fw += Math.min(a, b);
  }
  for (let i = 0; i < n; i++) {
    const own = dSt(U.per[i], t.per[i]);
    for (let j = 0; j < n; j++) if (j !== i && dSt(U.per[i], t.per[j]) < own * 0.6) order = false;
  }
  return { sd: fw / n, dir, order };
}
function judgeDraw(user, target) {
  const U = dNorm(user),
    tg = dTpl(target),
    cands = Object.keys(ITEMS).filter(c => KS[c] && ITEMS[c].s === ITEMS[target].s);
  const sc = cands
    .map(c => {
      const t = dTpl(c),
        d = dCloud(U.cloud, t.cloud);
      return {
        c,
        d,
        s:
          t.per.length === user.length
            ? 0.5 * d + 0.3 * dPer(U, t).sd
            : d + 0.012 * Math.abs(t.per.length - user.length),
      };
    })
    .sort((a, b) => a.s - b.s);
  const rank = sc.findIndex(x => x.c === target),
    me = sc[rank],
    r = { need: tg.per.length, got: user.length, dir: true, order: true, rank, like: sc[0].c };
  if (user.length === tg.per.length) Object.assign(r, dPer(U, tg));
  r.ok = (r.sd != null && r.sd < 0.15 && rank <= 8) || (me.d < 0.07 && rank <= 1) || (me.d < 0.075 && rank === 0);
  const tips = [];
  if (r.ok) {
    if (r.got !== r.need)
      tips.push(`Ce kana se trace normalement en ${r.need} trait${r.need > 1 ? 's' : ''} (tu en as fait ${r.got}).`);
    if (!r.order) tips.push('Attention à l’ordre des traits.');
    if (!r.dir) tips.push('Un trait est tracé dans le mauvais sens.');
  } else {
    if (r.got !== r.need)
      tips.push(`Ce kana se trace en ${r.need} trait${r.need > 1 ? 's' : ''} (tu en as fait ${r.got}).`);
    else tips.push('La forme ne correspond pas encore.');
    if (r.like !== target && ITEMS[r.like])
      tips.push(`Ton tracé ressemble plutôt à <span lang="ja">${r.like}</span> (${ITEMS[r.like].r}).`);
  }
  r.tip = tips.join(' ');
  return r;
}

export { judgeDraw, dNorm };
