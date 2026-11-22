import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasard, fixture, T0, HOUR } from './_outils.js';
import { merge } from '../../src/core/merge.js';
import { fresh } from '../../src/core/state.js';
import { ITEMS, LES, UNITS } from '../../src/data/kana.js';

const trie = o =>
  JSON.stringify(o, (k, v) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v,
  );

test('nouvel appareil : la vraie sauvegarde en ligne est récupérée telle quelle', () => {
  const real = fixture('vraie-sauvegarde');
  assert.equal(trie(merge(fresh(), real)), trie({ ...fresh(), ...real }));
});

test('meilleure boîte, union des leçons, meilleurs scores, XP maximale', () => {
  const a = { learned: { あ: { box: 2, due: 1 } }, done: { 'h-a': true }, tests: { h1: 70 }, xp: 10, at: T0 };
  const b = {
    learned: { あ: { box: 4, due: 2 }, い: { box: 1, due: 3 } },
    done: { 'h-ka': true },
    tests: { h1: 85 },
    xp: 30,
    at: T0 - HOUR,
  };
  const r = merge(a, b);
  assert.deepEqual(r.learned, { あ: { box: 4, due: 2 }, い: { box: 1, due: 3 } });
  assert.deepEqual(r.done, { 'h-a': true, 'h-ka': true });
  assert.deepEqual(r.tests, { h1: 85 });
  assert.equal(r.xp, 30);
  assert.equal(r.at, T0);
});

test('propriétés sur 2 000 paires aléatoires : rien n’est perdu, l’ordre des arguments est indifférent', () => {
  const R = hasard(7),
    ks = Object.keys(ITEMS),
    lids = Object.keys(LES),
    uids = UNITS.map(u => u.id);
  const rnd = () => {
    const s = { learned: {}, done: {}, tests: {}, xp: Math.floor(R() * 500), at: Math.floor(R() * 1e6) };
    for (const c of ks) if (R() < 0.2) s.learned[c] = { box: 1 + Math.floor(R() * 6), due: Math.floor(R() * 1e6) };
    for (const l of lids) if (R() < 0.3) s.done[l] = true;
    for (const u of uids) if (R() < 0.4) s.tests[u] = Math.floor(R() * 101);
    return s;
  };
  for (let i = 0; i < 2000; i++) {
    const a = rnd(),
      b = rnd();
    if (a.at === b.at) b.at++;
    const r = merge(a, b);
    for (const c of new Set([...Object.keys(a.learned), ...Object.keys(b.learned)]))
      assert.equal(r.learned[c].box, Math.max(a.learned[c]?.box || 0, b.learned[c]?.box || 0));
    for (const l of new Set([...Object.keys(a.done), ...Object.keys(b.done)])) assert.equal(r.done[l], true);
    for (const u of new Set([...Object.keys(a.tests), ...Object.keys(b.tests)]))
      assert.equal(r.tests[u], Math.max(a.tests[u] ?? -1, b.tests[u] ?? -1));
    assert.equal(r.xp, Math.max(a.xp, b.xp));
    assert.equal(trie(r), trie(merge(b, a)));
  }
});

test('à boîte égale, la version la plus récente l’emporte, dans les deux sens', () => {
  const a = { learned: { あ: { box: 3, due: 10 } }, at: T0 - HOUR },
    b = { learned: { あ: { box: 3, due: 20 } }, at: T0 };
  assert.deepEqual(merge(a, b).learned.あ, { box: 3, due: 20 });
  assert.deepEqual(merge(b, a).learned.あ, { box: 3, due: 20 });
});
