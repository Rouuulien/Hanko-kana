import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { golden } from './_outils.js';
import { jugerTraces } from '../helpers/traces.js';
import { ITEMS } from '../../src/data/kana.js';

// Le module charge data/kana-strokes.json avec fetch : on sert le fichier local.
before(() => {
  globalThis.fetch = async url => {
    assert.equal(url, 'data/kana-strokes.json');
    const body = await readFile(new URL('../../data/kana-strokes.json', import.meta.url), 'utf8');
    return { ok: true, json: async () => JSON.parse(body) };
  };
});

// Échantillon (le jeu complet des 834 jugements est vérifié dans le navigateur : ~1 min dans Node).
const ECHANTILLON = ['あ', 'き', 'さ', 'ぬ', 'め', 'は', 'ク', 'シ', 'ツ', 'ソ', 'ン', 'ウ'];

test('reconnaissance : échantillon de tracés de synthèse, jugements identiques à la référence', async () => {
  const { loadKS } = await import('../../src/draw/strokes.js');
  const { judgeDraw } = await import('../../src/draw/recognize.js');
  const res = JSON.parse(JSON.stringify(await jugerTraces({ ITEMS, loadKS, judgeDraw }, 42, ECHANTILLON)));
  const ref = golden('trace').filter(r => ECHANTILLON.includes(r.c));
  assert.equal(res.length, ref.length);
  assert.deepEqual(res, ref);
});

test('modèles SVG : un tracé par trait, numéros de départ, aides selon le niveau', async () => {
  const { loadKS } = await import('../../src/draw/strokes.js');
  const { modelSVG, aidSVG } = await import('../../src/draw/svg.js');
  const KS = await loadKS();
  const m = modelSVG('あ');
  assert.equal(m.match(/<path /g).length, KS['あ'].d.length);
  assert.match(m, /class="model\s+anim"/);
  assert.equal(aidSVG('あ', 0, 0), '');
  assert.match(aidSVG('あ', 1, 0), /<circle[^>]*\/><text[^>]*>1<\/text>/);
  assert.match(aidSVG('あ', 2, 1), /class="nx"/);
  assert.equal(modelSVG('きゃ'), '', 'pas de modèle pour une combinaison');
});
