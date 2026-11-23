// Koï, la mascotte (src/ui/koi.js) : SVG produit en chaîne, sans DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { koi, mascot, KOI_STATES } from '../../src/ui/koi.js';

test('koi() : classe, état, taille (largeur, hauteur 3/4), masqué aux lecteurs d’écran', () => {
  const s = koi('happy', 48);
  for (const a of ['class="koi"', 'data-state="happy"', 'width="48"', 'height="36"', 'aria-hidden="true"'])
    assert.ok(s.includes(a), a);
});

test('chaque koï a son propre clipPath (plusieurs koï dans la page, redessins)', () => {
  const id = s => s.match(/<clipPath id="([^"]+)"/)[1];
  const a = koi('resting', 56),
    b = koi('resting', 56);
  assert.notEqual(id(a), id(b));
  assert.ok(a.includes(`url(#${id(a)})`) && b.includes(`url(#${id(b)})`));
});

test('les 7 états sont acceptés, un état inconnu est refusé', () => {
  assert.deepEqual(KOI_STATES, ['resting', 'swimming', 'greeting', 'happy', 'encouraging', 'sleeping', 'celebrating']);
  for (const s of KOI_STATES) assert.ok(koi(s, 40).includes(`data-state="${s}"`));
  assert.throws(() => koi('idle', 40));
});

test('mascot() : la koï dans son enveloppant, puis la bulle', () => {
  const m = mascot('resting', 'Bonjour');
  assert.match(
    m,
    /^<div class="mascot"><span class="koi-w"><svg class="koi".*<\/svg><\/span><div class="bubble">Bonjour<\/div><\/div>$/s,
  );
  assert.ok(m.includes('width="76"'));
});
