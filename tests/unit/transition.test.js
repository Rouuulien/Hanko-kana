// Choix de l'animation d'entrée d'un écran (src/ui/transition.js) : fonction pure, sans DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitionFor } from '../../src/ui/transition.js';

const S = (view, o = {}) => ({ view, tab: 'home', train: 'rush', step: '', ans: false, ...o });

test('premier affichage : rien', () => {
  assert.equal(transitionFor(null, S('home')), 'none');
});

test('onglets : fondu si l’onglet ou le mode change, rien sinon', () => {
  assert.equal(transitionFor(S('home'), S('home', { tab: 'path' })), 'fade');
  assert.equal(transitionFor(S('home', { tab: 'train' }), S('home', { tab: 'train', train: 'brush' })), 'fade');
  assert.equal(transitionFor(S('home', { tab: 'path' }), S('home', { tab: 'path' })), 'none');
});

test('des onglets vers un écran plein cadre : montée ; retour : fondu', () => {
  for (const v of ['cards', 'set', 'rush', 'brush']) assert.equal(transitionFor(S('home'), S(v)), 'rise', v);
  for (const v of ['cards', 'quiz', 'res', 'set', 'rushres', 'brushres'])
    assert.equal(transitionFor(S(v), S('home')), 'fade', v);
});

test('entre écrans plein cadre', () => {
  assert.equal(transitionFor(S('cards', { step: 'c4' }), S('quiz', { step: 'q0' })), 'next');
  assert.equal(transitionFor(S('quiz'), S('res')), 'rise');
  assert.equal(transitionFor(S('rush'), S('rushres')), 'rise');
  assert.equal(transitionFor(S('brush'), S('brushres')), 'rise');
});

test('même écran : exercice suivant, panneau de réponse, ou rien', () => {
  assert.equal(transitionFor(S('quiz', { step: 'q1' }), S('quiz', { step: 'q2' })), 'next');
  assert.equal(transitionFor(S('cards', { step: 'c1' }), S('cards', { step: 'c0' })), 'next');
  assert.equal(transitionFor(S('brush', { step: 'b1' }), S('brush', { step: 'b2' })), 'next');
  assert.equal(transitionFor(S('quiz', { step: 'q1' }), S('quiz', { step: 'q1', ans: true })), 'panel');
  assert.equal(transitionFor(S('quiz', { step: 'q1', ans: true }), S('quiz', { step: 'q1', ans: true })), 'none');
  assert.equal(transitionFor(S('rush'), S('rush')), 'none');
  assert.equal(transitionFor(S('set'), S('set')), 'none');
});
