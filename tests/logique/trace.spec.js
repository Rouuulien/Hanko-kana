// Reconnaissance du tracé (judgeDraw) sur des tracés de synthèse construits à partir des modèles KanjiVG,
// convertis en pixels comme sur une zone de dessin de 300 px, avec du bruit reproductible.
// La référence enregistrée est celle du code d'origine : tout écart signale un changement de comportement.
import { test, expect, expectGolden } from '../helpers/hanko.js';

test.setTimeout(120000);

const VARIANTS = ['exact', 'bruit', 'petit-decale', 'trait-inverse', 'ordre-inverse', 'trait-manquant', 'voisin'];
const NEIGHBOURS = { ぬ: 'め', め: 'ぬ', シ: 'ツ', ツ: 'シ', ソ: 'ン', ン: 'ソ', は: 'ほ', わ: 'れ', ね: 'れ', さ: 'き', ク: 'タ', ウ: 'ワ' };

async function judgeAll(hanko) {
  return hanko.run((H, [VARIANTS, NEIGHBOURS]) => H.loadKS().then(KS => {
    const R = Math.random;
    const px = (c, { k = 300 / 109, dx = 0, dy = 0, n = 0 } = {}) => KS[c].p.map(a => {
      const o = [];
      for (let i = 0; i < a.length; i += 2) o.push([a[i] * k + dx + (R() - .5) * n, a[i + 1] * k + dy + (R() - .5) * n]);
      return o;
    });
    const r4 = x => x == null ? x : Math.round(x * 1e4) / 1e4;
    const out = [];
    for (const c of Object.keys(H.ITEMS).filter(c => KS[c])) for (const v of VARIANTS) {
      let st;
      if (v === 'exact') st = px(c);
      else if (v === 'bruit') st = px(c, { n: 12 });
      else if (v === 'petit-decale') st = px(c, { k: 1.4, dx: 60, dy: 30, n: 4 });
      else if (v === 'trait-inverse') { st = px(c, { n: 4 }); st[0] = st[0].reverse() }
      else if (v === 'ordre-inverse') { st = px(c, { n: 4 }).reverse(); if (st.length < 2) continue }
      else if (v === 'trait-manquant') { st = px(c, { n: 4 }); if (st.length < 2) continue; st.pop() }
      else if (v === 'voisin') { if (!NEIGHBOURS[c]) continue; st = px(NEIGHBOURS[c], { n: 4 }) }
      const r = H.judgeDraw(st, c);
      out.push({ c, v, ok: r.ok, rank: r.rank, like: r.like, need: r.need, got: r.got, dir: r.dir, order: r.order, sd: r4(r.sd), tip: r.tip });
    }
    return out;
  }), [VARIANTS, NEIGHBOURS]);
}

test('tous les kana, 7 variantes de tracé (référence)', async ({ hanko }) => {
  await hanko.open();
  const res = await judgeAll(hanko);
  expect(res.length).toBeGreaterThan(500);
  expectGolden('trace', res);

  // Garde-fous lisibles, en plus de la référence.
  const of = v => res.filter(r => r.v === v);
  expect(of('exact').filter(r => !r.ok).map(r => r.c), 'tracé exact refusé').toEqual([]);
  // Paires réellement confusables : refusées.
  expect(of('voisin').filter(r => ['ぬ', 'め', 'シ', 'ツ', 'ソ', 'ン', 'ウ'].includes(r.c) && r.ok).map(r => r.c), 'kana voisin accepté').toEqual([]);
  // Tolérance actuelle (comportement figé) : un tracé qui contient la cible avec un trait de plus ou de moins
  // est accepté, avec un conseil sur le nombre de traits (ex. き dessiné pour さ, ほ pour は).
  expect(of('voisin').filter(r => r.ok).map(r => r.c + '←' + r.like)).toEqual(['さ←き', 'ね←れ', 'は←ほ', 'わ←れ', 'ク←タ']);
  expect(of('trait-inverse').every(r => r.got === r.need && !r.dir)).toBe(true);
  expect(of('ordre-inverse').every(r => !r.ok && !r.order)).toBe(true);
  const pick = (c, v) => res.find(r => r.c === c && r.v === v);
  expect(pick('あ', 'trait-manquant')).toMatchObject({ need: 3, got: 2 });
  expect(pick('あ', 'trait-manquant').tip).toContain('3 traits');
});
