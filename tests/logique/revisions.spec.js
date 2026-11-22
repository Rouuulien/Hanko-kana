// Révisions espacées (boîtes de Leitner), série de jours et déblocage du parcours.
import { test, expect, T0, HOUR, DAY } from '../helpers/hanko.js';

test.beforeEach(async ({ hanko }) => { await hanko.open() });

test('intervalles des boîtes : 4 h, 1 j, 3 j, 7 j, 16 j, 35 j', async ({ hanko }) => {
  expect(await hanko.run(H => H.IV)).toEqual([0, 4 * HOUR, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY]);
});

test('bonne réponse : boîte suivante (plafond 6) ; erreur : retour en boîte 1', async ({ hanko }) => {
  const r = await hanko.run(H => {
    H.S.learned = { あ: { box: 1, due: 0 } };
    const seq = [];
    for (const ok of [true, true, true, true, true, true, false, true]) { H.grade('あ', ok); seq.push({ ...H.S.learned.あ }) }
    return seq;
  });
  const now = T0, IV = [0, 4 * HOUR, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
  expect(r).toEqual([2, 3, 4, 5, 6, 6, 1, 2].map(box => ({ box, due: now + IV[box] })));
});

test('noter un kana jamais appris ne crée rien', async ({ hanko }) => {
  expect(await hanko.run(H => { H.S.learned = {}; H.grade('あ', true); return H.S.learned })).toEqual({});
});

test('kana à réviser : échus uniquement, du plus en retard au moins en retard', async ({ hanko }) => {
  const r = await hanko.run((H, T0) => {
    H.S.learned = { あ: { box: 2, due: T0 - 10 }, い: { box: 2, due: T0 + 1 }, う: { box: 2, due: T0 - 1000 }, え: { box: 2, due: T0 } };
    return H.dueList();
  }, T0);
  expect(r).toEqual(['う', 'あ', 'え']);
});

test('annonce de la prochaine révision', async ({ hanko }) => {
  const r = await hanko.run((H, [T0, HOUR, DAY]) => [[], [T0 - 1], [T0 + HOUR / 2], [T0 + 5 * HOUR, T0 + 30 * HOUR], [T0 + 2.6 * DAY]].map(ds => {
    H.S.learned = Object.fromEntries(ds.map((due, i) => [Object.keys(H.ITEMS)[i], { box: 1, due }]));
    return H.nextDue();
  }), [T0, HOUR, DAY]);
  expect(r).toEqual(['Termine une leçon pour lancer tes révisions.', '', 'Prochaine révision dans moins d’une heure.', 'Prochaine révision dans 5 h.', 'Prochaine révision dans 3 j.']);
});

test('série de jours : +1 si on a joué hier, repart à 1 sinon, affichée à 0 après un jour manqué', async ({ hanko }) => {
  const r = await hanko.run(H => {
    const out = {};
    Object.assign(H.S, { last: H.ld(-1), streak: 4, today: H.ld(-1), todayXp: 30, xp: 100 });
    out.avant = H.streak(); H.addXp(5); out.apres = { streak: H.S.streak, last: H.S.last, todayXp: H.S.todayXp, xp: H.S.xp, today: H.todayXp() };
    H.addXp(3); out.memeJour = H.S.streak;
    Object.assign(H.S, { last: H.ld(-2), streak: 7 }); out.casse = H.streak(); H.addXp(1); out.reprise = H.S.streak;
    return out;
  });
  expect(r).toEqual({ avant: 4, apres: { streak: 5, last: '2026-01-15', todayXp: 5, xp: 105, today: 5 }, memeJour: 5, casse: 0, reprise: 1 });
});

test('déblocage : leçons dans l’ordre, katakana après toutes les leçons des bases hiragana, test après les leçons', async ({ hanko }) => {
  const r = await hanko.run(H => {
    const L = id => H.LES[id], h1 = H.UNITS[0], k1 = H.UNITS.find(u => u.id === 'k1');
    const o = {};
    H.S.done = {}; o.debut = [H.unlocked(L('h-a')), H.unlocked(L('h-ka')), H.unlocked(L('k-a')), H.testOpen(h1), H.nextLesson().id];
    H.S.done = { 'h-a': true }; o.une = [H.unlocked(L('h-ka')), H.unlocked(L('h-sa')), H.nextLesson().id];
    H.S.done = Object.fromEntries(h1.lessons.map(l => [l.id, true])); o.bases = [H.unlocked(L('k-a')), H.unlocked(L('h-ga')), H.testOpen(h1), H.testOpen(k1), H.nextLesson().id];
    H.S.done = {}; H.S.unlock = true; o.toutDebloque = [H.unlocked(L('k-pa')), H.testOpen(k1)]; H.S.unlock = false;
    H.S.done = Object.fromEntries(Object.keys(H.LES).map(id => [id, true])); o.fin = [H.nextLesson(), H.allDone()];
    o.ids = H.UNITS.map(u => [u.id, u.lessons.map(l => l.id)]);
    return o;
  });
  expect(r.debut).toEqual([true, false, false, false, 'h-a']);
  expect(r.une).toEqual([true, false, 'h-ka']);
  expect(r.bases).toEqual([true, true, true, false, 'h-ga']);
  expect(r.toutDebloque).toEqual([true, true]);
  expect(r.fin).toEqual([null, true]);
  // Identifiants utilisés comme clés dans S.done / S.tests : ne jamais les renommer.
  expect(r.ids).toEqual([
    ['h1', ['h-a', 'h-ka', 'h-sa', 'h-ta', 'h-na', 'h-ha', 'h-ma', 'h-ya', 'h-ra', 'h-wa']], ['h2', ['h-ga', 'h-za', 'h-da', 'h-ba', 'h-pa']], ['h3', ['h-y0', 'h-y1', 'h-y2', 'h-y3']],
    ['k1', ['k-a', 'k-ka', 'k-sa', 'k-ta', 'k-na', 'k-ha', 'k-ma', 'k-ya', 'k-ra', 'k-wa']], ['k2', ['k-ga', 'k-za', 'k-da', 'k-ba', 'k-pa']], ['k3', ['k-y0', 'k-y1', 'k-y2', 'k-y3']],
  ]);
});
