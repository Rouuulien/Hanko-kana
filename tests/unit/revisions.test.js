import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { horloge, fixture, T0, HOUR, DAY } from './_outils.js';
import { S, fresh, replaceState } from '../../src/core/state.js';
import { IV, grade, dueList, nextDue } from '../../src/core/srs.js';
import { ld, streak, unlocked, nextLesson, allDone, testOpen } from '../../src/core/progress.js';
import { LES, UNITS } from '../../src/data/kana.js';

beforeEach(() => {
  horloge();
  replaceState(fresh());
});
afterEach(() => mock.timers.reset());

test('boîtes de Leitner : +1 si juste (plafond 6), retour en 1 si faux', () => {
  assert.deepEqual(IV, [0, 4 * HOUR, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY]);
  S.learned.あ = { box: 1, due: 0 };
  const boxes = [true, true, true, true, true, true, false].map(ok => (grade('あ', ok), S.learned.あ.box));
  assert.deepEqual(boxes, [2, 3, 4, 5, 6, 6, 1]);
  assert.equal(S.learned.あ.due, T0 + 4 * HOUR);
  grade('い', true);
  assert.equal(S.learned.い, undefined);
});

test('vraie sauvegarde : kana dus dans le temps, du plus urgent au moins urgent', () => {
  replaceState({ ...fresh(), ...fixture('vraie-sauvegarde') });
  for (const [h, n] of [
    [0, 0],
    [3, 4],
    [18, 12],
    [52, 15],
  ]) {
    horloge(T0 + h * HOUR);
    const d = dueList();
    assert.equal(d.length, n, `${h} h`);
    assert.deepEqual(
      d,
      [...d].sort((a, b) => S.learned[a].due - S.learned[b].due),
    );
  }
  horloge(T0);
  assert.equal(nextDue(), 'Prochaine révision dans 1 h.');
});

test('série de jours et date locale (fuseau Europe/Paris)', () => {
  assert.equal(ld(), '2026-01-15');
  assert.equal(ld(-1), '2026-01-14');
  Object.assign(S, { last: '2026-01-14', streak: 4 });
  assert.equal(streak(), 4);
  S.last = '2026-01-13';
  assert.equal(streak(), 0);
});

test('déblocage du parcours', () => {
  assert.equal(nextLesson().id, 'h-a');
  assert.equal(unlocked(LES['h-ka']), false);
  for (const l of UNITS[0].lessons) S.done[l.id] = true;
  assert.equal(unlocked(LES['k-a']), true);
  assert.equal(testOpen(UNITS[0]), true);
  for (const id of Object.keys(LES)) S.done[id] = true;
  assert.equal(allDone(), true);
  assert.equal(nextLesson(), null);
});
