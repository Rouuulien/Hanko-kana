// Générateur de tracés de synthèse, partagé par les tests navigateur et les tests unitaires.
// Autonome (aucune variable extérieure, hasard à graine propre) : il est sérialisé tel quel dans la page
// par Playwright, et appelé directement dans Node. Mêmes entrées partout → même référence tests/golden/trace.json.
// H : { ITEMS, loadKS, judgeDraw }. `only` (liste de kana) : ne juge que ceux-là, mais génère tout dans le même ordre,
// pour que le bruit de chaque tracé reste identique à celui de la référence complète. Les modèles KanjiVG (109 × 109) sont convertis en pixels d'une zone de 300 px.
export async function jugerTraces(H, seed = 42, only = null) {
  const KS = await H.loadKS();
  let a = seed >>> 0;
  const R = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const VARIANTS = ['exact', 'bruit', 'petit-decale', 'trait-inverse', 'ordre-inverse', 'trait-manquant', 'voisin'];
  const NEIGHBOURS = {
    ぬ: 'め',
    め: 'ぬ',
    シ: 'ツ',
    ツ: 'シ',
    ソ: 'ン',
    ン: 'ソ',
    は: 'ほ',
    わ: 'れ',
    ね: 'れ',
    さ: 'き',
    ク: 'タ',
    ウ: 'ワ',
  };
  const px = (c, { k = 300 / 109, dx = 0, dy = 0, n = 0 } = {}) =>
    KS[c].p.map(s => {
      const o = [];
      for (let i = 0; i < s.length; i += 2)
        o.push([s[i] * k + dx + (n ? (R() - 0.5) * n : 0), s[i + 1] * k + dy + (n ? (R() - 0.5) * n : 0)]);
      return o;
    });
  const r4 = x => (x == null ? x : Math.round(x * 1e4) / 1e4);
  const out = [];
  for (const c of Object.keys(H.ITEMS).filter(c => KS[c]))
    for (const v of VARIANTS) {
      let st;
      if (v === 'exact') st = px(c);
      else if (v === 'bruit') st = px(c, { n: 12 });
      else if (v === 'petit-decale') st = px(c, { k: 1.4, dx: 60, dy: 30, n: 4 });
      else if (v === 'trait-inverse') {
        st = px(c, { n: 4 });
        st[0] = st[0].reverse();
      } else if (v === 'ordre-inverse') {
        st = px(c, { n: 4 }).reverse();
        if (st.length < 2) continue;
      } else if (v === 'trait-manquant') {
        st = px(c, { n: 4 });
        if (st.length < 2) continue;
        st.pop();
      } else if (v === 'voisin') {
        if (!NEIGHBOURS[c]) continue;
        st = px(NEIGHBOURS[c], { n: 4 });
      }
      if (only && !only.includes(c)) continue;
      const r = H.judgeDraw(st, c);
      out.push({
        c,
        v,
        ok: r.ok,
        rank: r.rank,
        like: r.like,
        need: r.need,
        got: r.got,
        dir: r.dir,
        order: r.order,
        sd: r4(r.sd),
        tip: r.tip,
      });
    }
  return out;
}
