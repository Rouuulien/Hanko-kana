import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fauxStockage, fixture, T0 } from './_outils.js';
import { KEY, fresh, S, replaceState, loadLocal, saveLocal } from '../../src/core/state.js';

beforeEach(() => replaceState(fresh()));

test('clé de stockage et valeurs par défaut figées', () => {
  assert.equal(KEY, 'hanko-kana-v1');
  assert.deepEqual(Object.keys(fresh()), ['learned', 'done', 'tests', 'xp', 'streak', 'last', 'today', 'todayXp', 'unlock', 'ear', 'tab', 'page', 'rsc', 'rct', 'rdu', 'rfmt', 'best', 'snd', 'draw', 'bsc', 'bn', 'bl']);
  assert.notEqual(fresh().learned, fresh().learned, 'chaque état neuf a ses propres objets');
});

test('replaceState remplace le contenu sans changer d’objet', () => {
  const ref = S;
  replaceState({ ...fresh(), xp: 7, futur: 1 });
  assert.equal(S, ref);
  assert.equal(S.xp, 7);
  replaceState(fresh());
  assert.equal(S.futur, undefined, 'les anciens champs disparaissent');
});

test('chargement : vraie sauvegarde et anciens formats, sans perte', () => {
  for (const [nom, ajout] of [['vraie-sauvegarde', {}], ['ancien-format-1', { draw: true, bsc: 'h', bn: 10, bl: 2 }], ['ancien-format-2', { bl: 2 }]]) {
    const f = fixture(nom);
    fauxStockage({ [KEY]: JSON.stringify(f) });
    replaceState(fresh());
    loadLocal();
    assert.deepEqual({ ...S }, { ...fresh(), ...f, ...ajout }, nom);
  }
});

test('chargement : sauvegarde absente ou illisible → état neuf', () => {
  for (const raw of [undefined, '{"learned":', '{"xp":50}', 'null', '42', '{"learned":"x"}']) {
    fauxStockage(raw === undefined ? {} : { [KEY]: raw });
    replaceState({ ...fresh(), xp: 99 });
    replaceState(fresh());
    loadLocal();
    assert.deepEqual({ ...S }, fresh(), String(raw));
  }
});

test('chargement sans localStorage (navigation privée stricte) : pas d’exception', () => {
  delete globalThis.localStorage;
  assert.doesNotThrow(() => { loadLocal(); saveLocal() });
});

test('saveLocal écrit l’état courant', () => {
  const m = fauxStockage();
  replaceState({ ...fresh(), xp: 3, at: T0 });
  saveLocal();
  assert.deepEqual(JSON.parse(m.get(KEY)), { ...fresh(), xp: 3, at: T0 });
});
