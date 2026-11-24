/* ---------- leçons, quiz, tests d'unité et révisions : file de questions, réponses, notation, XP ---------- */
import { ld } from '../core/progress.js';
import { canRead, wordsWith } from '../core/reading.js';
import { IV, dueList, grade } from '../core/srs.js';
import { S } from '../core/state.js';
import { ITEMS, LES, UN, unitItems } from '../data/kana.js';
import { NOTE_P, NOTE_S } from '../data/notes.js';
import { WORDS } from '../data/words.js';
import { KS, canDraw, drawOK } from '../draw/strokes.js';
import { save } from '../sync/cloud.js';
import { ui } from '../ui/app-state.js';
import { render } from '../ui/render.js';
import { sfx } from '../ui/sounds.js';
import { wordHTML } from '../ui/views.js';
import { earOK } from '../ui/voice.js';
import { K2H, pick, shuffle } from '../util.js';
function addXp(n) {
  const t = ld();
  if (S.today !== t) {
    S.today = t;
    S.todayXp = 0;
  }
  S.todayXp += n;
  S.xp += n;
  if (S.last !== t) {
    S.streak = S.last === ld(-1) ? S.streak + 1 : 1;
    S.last = t;
  }
  save();
}
/* état de l’interface : voir src/ui/app-state.js */
function pickType(box, c) {
  if (c && box >= 2 && drawOK() && canDraw(c) && KS[c] && Math.random() < 0.18) return 'draw';
  const r = Math.random(),
    e = earOK() ? 'ear' : 'k2r';
  if (box >= 3) return r < 0.55 ? 'type' : r < 0.8 ? 'r2k' : e;
  return r < 0.45 ? 'k2r' : r < 0.85 ? 'r2k' : e;
}
function opts(c) {
  const it = ITEMS[c],
    P = Object.values(ITEMS).filter(x => x.s === it.s && x.c !== c && x.r !== it.r);
  const pref = P.filter(x => ui.ses.set.has(x.c) || S.learned[x.c]);
  const src = shuffle(pref.length >= 3 ? pref : P);
  const seen = new Set(),
    out = [];
  for (const x of src) {
    if (seen.has(x.r)) continue;
    seen.add(x.r);
    out.push(x.c);
    if (out.length === 3) break;
  }
  return shuffle([c, ...out]);
}
const sample = (a, n) => shuffle(a).slice(0, n);
function initQuiz(queue) {
  Object.assign(ui.ses, {
    queue,
    i: 0,
    ok: 0,
    n: 0,
    xp: 0,
    combo: 0,
    best: 0,
    miss: new Set(),
    graded: new Set(),
    ans: null,
  });
  ui.view = 'quiz';
}
function startLesson(id) {
  const L = LES[id];
  ui.ses = { kind: 'lesson', id, items: L.items, set: new Set(L.items), ci: 0, cw: {} };
  ui.view = 'cards';
  render();
}
function lessonQueue() {
  const N = ui.ses.items,
    s = ITEMS[N[0]].s,
    cap = Math.min(N.length, 6);
  const rev = sample(
    Object.keys(S.learned).filter(c => !ui.ses.set.has(c) && ITEMS[c].s === s),
    3,
  );
  const p1 = shuffle(N).map(c => ({ c, type: 'k2r' }));
  const p2 = sample(N, N.length > 6 ? cap : N.length).map(c => ({
    c,
    type: earOK() && Math.random() < 0.35 ? 'ear' : 'r2k',
  }));
  const p3 = shuffle([
    ...sample(N, cap).map(c => ({ c, type: 'type' })),
    ...rev.map(c => ({ c, type: pickType(S.learned[c].box, c), rev: true })),
  ]);
  const p4 = drawOK()
    ? sample(
        N.filter(c => canDraw(c) && KS[c]),
        2,
      ).map(c => ({ c, type: 'draw' }))
    : [];
  return [...p1, ...p2, ...p3, ...p4];
}
function startTest(uid) {
  const u = UN[uid],
    all = unitItems(u);
  ui.ses = { kind: 'test', id: uid, set: new Set(all) };
  initQuiz(sample(all, 15).map(c => ({ c, type: pickType(S.learned[c] ? S.learned[c].box : 2, c) })));
  render();
}
function startReview(practice) {
  const cs = practice ? sample(Object.keys(S.learned), 15) : dueList().slice(0, 20);
  if (!cs.length) return;
  ui.ses = { kind: practice ? 'practice' : 'review', set: new Set(cs) };
  initQuiz(shuffle(cs).map(c => ({ c, type: pickType(S.learned[c].box, c) })));
  render();
}
const cur = () => ui.ses.queue[ui.ses.i];
function settle(ok, extra) {
  const Q = cur();
  if (ok) {
    ui.ses.combo++;
    ui.ses.best = Math.max(ui.ses.best, ui.ses.combo);
  } else ui.ses.combo = 0;
  let msg = ok ? pick(['Bien vu !', 'Exact !', 'Parfait.', 'Oui, c’est ça !', 'Sugoi !']) : 'Pas tout à fait.';
  if (ok && ui.ses.combo >= 3 && ui.ses.combo % 3 === 0) msg = `Série de ${ui.ses.combo} ! Koï est fière.`;
  let tip = '';
  if (!ok) {
    const h = K2H(Q.c);
    tip =
      NOTE_S[Q.c] ||
      NOTE_P[h] ||
      (() => {
        const w = wordsWith(Q.c).filter(w => canRead(w, ui.ses.set));
        return w.length ? `Retiens-le avec ${wordHTML(pick(w))}` : '';
      })();
  }
  ui.ses.ans = Object.assign({ ok, msg, tip }, extra);
  sfx(!ok ? 'bad' : ui.ses.combo >= 3 && ui.ses.combo % 3 === 0 ? 'combo' : 'ok');
  if (!Q.retry) {
    ui.ses.n++;
    if (ok) {
      ui.ses.ok++;
      ui.ses.xp += 2;
    } else ui.ses.miss.add(Q.c);
    const g = ui.ses.kind === 'review' || ui.ses.kind === 'test' || (ui.ses.kind === 'lesson' && Q.rev);
    if (g && !ui.ses.graded.has(Q.c)) {
      ui.ses.graded.add(Q.c);
      grade(Q.c, ok);
      save();
    }
  }
  if (!ok) ui.ses.queue.push({ c: Q.c, type: Q.type === 'type' ? 'k2r' : Q.type, retry: true });
  render();
}
function answer(i) {
  if (ui.ses.ans) return;
  const Q = cur();
  settle(Q.o[i] === Q.c, { i });
}
function answerTyped(v) {
  if (ui.ses.ans) return;
  const it = ITEMS[cur().c],
    n = v.trim().toLowerCase().replace(/\s+/g, '');
  if (!n) return;
  settle(n === it.r || it.al.includes(n), { v });
}
function next() {
  if (!ui.ses || !ui.ses.ans) return;
  ui.ses.ans = null;
  ui.ses.i++;
  if (ui.ses.i >= ui.ses.queue.length) return finish();
  render();
}
function finish() {
  const sc = ui.ses.n ? ui.ses.ok / ui.ses.n : 1;
  let pass = true;
  if (ui.ses.kind === 'lesson') {
    const before = new Set(WORDS.filter(w => canRead(w)).map(w => w.j));
    S.done[ui.ses.id] = true;
    for (const c of ui.ses.items) if (!S.learned[c]) S.learned[c] = { box: 1, due: Date.now() + IV[1] };
    ui.ses.xp += 10;
    ui.ses.newWords = WORDS.filter(w => !before.has(w.j) && canRead(w));
  }
  if (ui.ses.kind === 'test') {
    pass = sc >= 0.8;
    S.tests[ui.ses.id] = Math.max(S.tests[ui.ses.id] || 0, Math.round(sc * 100));
    if (pass) ui.ses.xp += 20;
  }
  ui.ses.score = sc;
  ui.ses.pass = pass;
  sfx(pass ? 'done' : 'bad');
  addXp(ui.ses.xp);
  ui.view = 'res';
  render();
}

export {
  addXp,
  opts,
  initQuiz,
  startLesson,
  lessonQueue,
  startTest,
  startReview,
  cur,
  settle,
  answer,
  answerTyped,
  next,
};
