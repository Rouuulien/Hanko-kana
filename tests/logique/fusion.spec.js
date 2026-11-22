// merge(local, distant) : fusion des progressions entre appareils (Supabase / compte Claude).
// Règle : aucune progression ne doit être perdue, quel que soit l'ordre ou l'appareil le plus récent.
import { test, expect, T0, DAY } from '../helpers/hanko.js';

test.beforeEach(async ({ hanko }) => {
  await hanko.open();
});
const merge = (hanko, a, b) => hanko.run((H, [a, b]) => H.merge(a, b), [a, b]);

test('les kana appris sur les deux appareils sont réunis, la meilleure boîte l’emporte', async ({ hanko }) => {
  const a = { learned: { あ: { box: 2, due: 1 }, い: { box: 5, due: 2 } }, at: T0 };
  const b = { learned: { あ: { box: 4, due: 3 }, う: { box: 1, due: 4 } }, at: T0 - DAY };
  const r = await merge(hanko, a, b);
  expect(r.learned).toEqual({ あ: { box: 4, due: 3 }, い: { box: 5, due: 2 }, う: { box: 1, due: 4 } });
});

test('à boîte égale, la version la plus récente l’emporte', async ({ hanko }) => {
  const a = { learned: { あ: { box: 3, due: 10 } }, at: T0 - DAY };
  const b = { learned: { あ: { box: 3, due: 20 } }, at: T0 };
  expect((await merge(hanko, a, b)).learned.あ).toEqual({ box: 3, due: 20 });
  expect((await merge(hanko, b, a)).learned.あ).toEqual({ box: 3, due: 20 });
});

test('leçons terminées : union ; tests : meilleur score', async ({ hanko }) => {
  const a = { learned: {}, done: { 'h-a': true }, tests: { h1: 70, k1: 90 }, at: T0 };
  const b = { learned: {}, done: { 'h-ka': true }, tests: { h1: 85 }, at: T0 - 1 };
  const r = await merge(hanko, a, b);
  expect(r.done).toEqual({ 'h-a': true, 'h-ka': true });
  expect(r.tests).toEqual({ h1: 85, k1: 90 });
});

test('XP et horodatage : le maximum des deux', async ({ hanko }) => {
  const r = await merge(hanko, { learned: {}, xp: 10, at: T0 - DAY }, { learned: {}, xp: 4, at: T0 });
  expect(r.xp).toBe(10);
  expect(r.at).toBe(T0);
});

test('réglages et série de jours : ceux de la version la plus récente', async ({ hanko }) => {
  const a = { learned: {}, streak: 9, last: '2026-01-10', snd: false, tab: 'k', at: T0 - DAY };
  const b = { learned: {}, streak: 2, last: '2026-01-15', snd: true, tab: 'h', at: T0 };
  const r = await merge(hanko, a, b);
  expect(r).toMatchObject({ streak: 2, last: '2026-01-15', snd: true, tab: 'h' });
});

test('records Rafale et Pinceau', async ({ hanko }) => {
  const a = {
    learned: {},
    at: T0,
    best: {
      'deck-h-kana': { ms: 50000, n: 10, acc: 90 }, // plus lent, même paquet → l'autre garde son record
      'time-h-kana-60': { kpm: 30, acc: 95 },
      'deck-k-kana': { ms: 90000, n: 20, acc: 80 }, // paquet de taille différente → le plus récent gagne
      'brush-h-10-L2': { ms: 70000, n: 10, acc: 70 },
    },
  };
  const b = {
    learned: {},
    at: T0 - DAY,
    best: {
      'deck-h-kana': { ms: 40000, n: 10, acc: 100 },
      'time-h-kana-60': { kpm: 41, acc: 88 },
      'deck-k-kana': { ms: 30000, n: 12, acc: 100 },
      'brush-h-10-L3': { ms: 80000, n: 10, acc: 60 },
    },
  };
  const r = await merge(hanko, a, b);
  expect(r.best).toEqual({
    'deck-h-kana': { ms: 40000, n: 10, acc: 100 },
    'time-h-kana-60': { kpm: 41, acc: 88 },
    'deck-k-kana': { ms: 90000, n: 20, acc: 80 },
    'brush-h-10-L2': { ms: 70000, n: 10, acc: 70 },
    'brush-h-10-L3': { ms: 80000, n: 10, acc: 60 },
  });
});

test('sauvegarde distante d’un ancien format : champs récents complétés par défaut', async ({ hanko }) => {
  const r = await merge(hanko, { learned: { あ: { box: 1, due: 0 } }, at: T0 - DAY }, { learned: {}, xp: 3, at: T0 });
  expect(r).toMatchObject({ draw: true, bsc: 'h', bn: 10, bl: 2, best: {}, tests: {}, done: {} });
});

test('sans horodatage des deux côtés : pas de plantage, le premier argument fait foi', async ({ hanko }) => {
  const r = await merge(hanko, { learned: {}, tab: 'k' }, { learned: {}, tab: 'h' });
  expect(r.tab).toBe('k');
  expect(r.at).toBe(0);
});

test('fusionner un état avec lui-même ne change rien', async ({ hanko }) => {
  const s = {
    learned: { あ: { box: 2, due: 5 } },
    done: { 'h-a': true },
    tests: { h1: 80 },
    xp: 12,
    best: { 'time-h-kana-30': { kpm: 20, acc: 90 } },
    at: T0,
  };
  const r = await merge(hanko, s, s);
  expect(r).toEqual({ ...(await hanko.run(H => H.fresh())), ...s });
});

test('propriétés sur 300 paires aléatoires : rien n’est perdu, ordre indifférent', async ({ hanko }) => {
  const out = await hanko.run(H => {
    const ks = Object.keys(H.ITEMS),
      lids = Object.keys(H.LES),
      uids = H.UNITS.map(u => u.id),
      R = Math.random;
    const rnd = () => {
      const s = {
        learned: {},
        done: {},
        tests: {},
        xp: Math.floor(R() * 500),
        at: R() < 0.1 ? undefined : Math.floor(R() * 1e6),
      };
      for (const c of ks) if (R() < 0.2) s.learned[c] = { box: 1 + Math.floor(R() * 6), due: Math.floor(R() * 1e6) };
      for (const l of lids) if (R() < 0.3) s.done[l] = true;
      for (const u of uids) if (R() < 0.4) s.tests[u] = Math.floor(R() * 101);
      return s;
    };
    const norm = o =>
      JSON.stringify(o, (k, v) =>
        v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v,
      );
    const fails = [];
    for (let i = 0; i < 300; i++) {
      const a = rnd(),
        b = rnd();
      if (a.at === b.at) b.at = (b.at || 0) + 1;
      const r = H.merge(a, b),
        r2 = H.merge(b, a);
      for (const c of new Set([...Object.keys(a.learned), ...Object.keys(b.learned)])) {
        const m = Math.max(a.learned[c]?.box || 0, b.learned[c]?.box || 0);
        if (!r.learned[c] || r.learned[c].box !== m) fails.push(`${i} learned ${c}`);
      }
      for (const l of new Set([...Object.keys(a.done), ...Object.keys(b.done)]))
        if (!r.done[l]) fails.push(`${i} done ${l}`);
      for (const u of new Set([...Object.keys(a.tests), ...Object.keys(b.tests)]))
        if (r.tests[u] !== Math.max(a.tests[u] ?? -1, b.tests[u] ?? -1)) fails.push(`${i} tests ${u}`);
      if (r.xp !== Math.max(a.xp, b.xp)) fails.push(`${i} xp`);
      // l'ordre des clés peut différer selon le sens ; le contenu doit être identique
      if (norm(r) !== norm(r2)) fails.push(`${i} ordre`);
    }
    return fails;
  });
  expect(out).toEqual([]);
});
