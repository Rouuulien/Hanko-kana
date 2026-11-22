/* ---------- mode Rafale : paquet de cartes à taper au clavier, en paquet complet ou contre la montre ---------- */
import { allDone } from '../core/progress.js';
import { canRead } from '../core/reading.js';
import { S } from '../core/state.js';
import { ITEMS } from '../data/kana.js';
import { WORDS } from '../data/words.js';
import { addXp } from './quiz.js';
import { save } from '../sync/cloud.js';
import { ui } from '../ui/app-state.js';
import { daru, mascot } from '../ui/daru.js';
import { render } from '../ui/render.js';
import { muteBtn, sfx } from '../ui/sounds.js';
import { top } from '../ui/views.js';
import { pick, shuffle } from '../util.js';
const unitK = c => ({ j: c, t: [{ c, r: ITEMS[c].r, al: ITEMS[c].al }] });
function unitW(w) {
  const ch = [...w.j],
    t = [];
  for (let i = 0; i < ch.length;) {
    const two = ch[i] + (ch[i + 1] || '');
    if (ITEMS[two]) {
      t.push({ c: two, r: ITEMS[two].r, al: ITEMS[two].al });
      i += 2;
      continue;
    }
    const c = ch[i];
    if (c === 'ー') {
      const v = ((t[t.length - 1] || { r: '' }).r.match(/[aiueo]$/) || ['-'])[0];
      t.push({ c, r: v, al: ['-'] });
    } else t.push({ c, r: ITEMS[c].r, al: ITEMS[c].al });
    i++;
  }
  return { j: w.j, f: w.f, t };
}
function rushPool(sc, ct) {
  if (ct === 'words') return WORDS.filter(w => canRead(w) && (sc === 'b' || w.s === sc)).map(unitW);
  return Object.keys(S.learned)
    .filter(c => sc === 'b' || ITEMS[c].s === sc)
    .map(unitK);
}
const rkey = () => (S.rfmt || 'deck') + '-' + S.rsc + '-' + S.rct + (S.rfmt === 'time' ? '-' + S.rdu : '');
const fmtT = ms => {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
/* état de l’interface : voir src/ui/app-state.js */
function rushSetupV() {
  const pool = rushPool(S.rsc, S.rct),
    b = S.best[rkey()],
    deck = S.rfmt !== 'time',
    kind = S.rct === 'words' ? 'mots' : 'kana';
  const grp = (lab, k, opts) =>
    `<div class="og"><span>${lab}</span><div class="chips">${opts.map(([v, t]) => `<button data-act="rset" data-k="${k}" data-v="${v}" aria-pressed="${String(S[k] || 'deck') === String(v)}">${t}</button>`).join('')}</div></div>`;
  const ok = pool.length >= 5;
  const talk = !ok
    ? `Il me faut au moins 5 ${S.rct === 'words' ? 'mots lisibles' : 'kana appris'} dans cette sélection. Fais encore une leçon et reviens !`
    : deck
      ? `Ton paquet de <b>${pool.length} ${kind}</b> défile une fois. Tape la lecture, sans valider : le chrono s’arrête à la dernière carte.`
      : `Les ${kind} défilent sans fin pendant ${S.rdu} s. Tape-en le plus possible !`;
  const best = !b
    ? 'Pas encore de record pour ces réglages.'
    : deck
      ? `Ton record : <b>${fmtT(b.ms)}</b> pour ${b.n} cartes, ${b.acc} % de précision`
      : `Ton record : <b>${b.kpm} kana/min</b>, ${b.acc} % de précision`;
  return `<div class="rset">${mascot('idle', talk, 64)}
  ${grp('Format', 'rfmt', [
    ['deck', 'Paquet complet'],
    ['time', 'Contre la montre'],
  ])}${grp('Écriture', 'rsc', [
    ['h', 'Hiragana'],
    ['k', 'Katakana'],
    ['b', 'Les deux'],
  ])}${grp('Contenu', 'rct', [
    ['kana', 'Kana seuls'],
    ['words', 'Mots'],
  ])}${
    deck
      ? ''
      : grp('Durée', 'rdu', [
          [30, '30 s'],
          [60, '1 min'],
          [120, '2 min'],
        ])
  }
  <p class="rbest">${best}</p><button class="btn ac" data-act="rstart" ${ok ? '' : 'disabled'}>Lancer la rafale</button></div>`;
}
function rFill() {
  while (ui.rs.q.length < ui.rs.u + 10) {
    let n,
      g = 0;
    do {
      n = pick(ui.rs.pool);
    } while (ui.rs.q.length && n.j === ui.rs.q[ui.rs.q.length - 1].j && g++ < 5);
    ui.rs.q.push(n);
  }
}
function startRush() {
  const pool = rushPool(S.rsc, S.rct);
  if (pool.length < 5) return;
  const fmt = S.rfmt === 'time' ? 'time' : 'deck';
  ui.rs = {
    fmt,
    pool,
    dur: +S.rdu,
    q: fmt === 'deck' ? shuffle(pool) : [],
    u: 0,
    k: 0,
    typed: '',
    res: [],
    wrong: false,
    start: 0,
    ok: 0,
    err: 0,
    miss: new Map(),
    afterN: false,
    tid: 0,
    ck: '',
    ckU: -1,
  };
  if (fmt === 'time') rFill();
  ui.view = 'rush';
  render();
}
function stopRush() {
  if (ui.rs && ui.rs.tid) {
    clearInterval(ui.rs.tid);
    ui.rs.tid = 0;
  }
}
const curTok = () => ui.rs.q[ui.rs.u].t[ui.rs.k];
function rClock() {
  if (!ui.rs.start) return fmtT(ui.rs.fmt === 'time' ? ui.rs.dur * 1000 : 0);
  const e = Date.now() - ui.rs.start;
  return ui.rs.fmt === 'time' ? fmtT(Math.max(0, ui.rs.dur * 1000 - e) + 999) : fmtT(e);
}
function rStart() {
  if (ui.rs.start) return;
  ui.rs.start = Date.now();
  ui.rs.tid = setInterval(() => {
    const el = document.getElementById('rt');
    if (el) el.textContent = rClock();
    if (ui.rs.fmt === 'time' && Date.now() - ui.rs.start >= ui.rs.dur * 1000) endRush();
  }, 200);
}
function rPaint() {
  const U = ui.rs.q[ui.rs.u],
    T = U.t[ui.rs.k],
    key = ui.rs.u + '|' + ui.rs.k + '|' + ui.rs.wrong,
    cf = document.getElementById('cf');
  if (!cf) return;
  if (key !== ui.rs.ck) {
    const multi = U.t.length > 1;
    cf.outerHTML = `<div class="cd front ${ui.rs.ckU !== ui.rs.u ? 'in' : ''} ${ui.rs.wrong ? 'bad' : ''}" id="cf">${U.f && ui.rs.wrong ? `<span class="mean">« ${U.f} »</span>` : ''}<div class="ck ${multi ? 'w' : ''}" lang="ja">${U.t.map((t, k) => `<i class="${k < ui.rs.k ? 'dn' : k === ui.rs.k && multi ? 'cur' : ''}">${t.c}</i>`).join('')}</div>${ui.rs.wrong ? `<span class="reveal"><span lang="ja">${T.c}</span> = ${T.r}</span>` : ''}</div>`;
    ui.rs.ck = key;
    ui.rs.ckU = ui.rs.u;
  }
  document.getElementById('ty').textContent = ui.rs.typed;
  const left = ui.rs.q.length - ui.rs.u;
  document.getElementById('rc').innerHTML =
    ui.rs.fmt === 'deck' ? `${left}<small>/${ui.rs.q.length}</small>` : `${ui.rs.ok}<small> kana</small>`;
  if (ui.rs.fmt === 'deck') {
    document.getElementById('b1').hidden = left < 2;
    document.getElementById('b2').hidden = left < 3;
  }
  document.getElementById('rh').textContent = !ui.rs.start
    ? 'Le chrono démarre à ta première lettre.'
    : ui.rs.wrong
      ? 'Tape la bonne lecture pour continuer.'
      : '';
}
function flash(sel, cls, ms) {
  const e = document.querySelector(sel);
  if (!e) return;
  e.classList.remove(cls);
  void e.offsetWidth;
  e.classList.add(cls);
  if (ms) setTimeout(() => e.classList.remove(cls), ms);
}
function rMiss() {
  const T = curTok();
  if (!ui.rs.wrong) {
    ui.rs.err++;
    ui.rs.res[ui.rs.u] = false;
    ui.rs.miss.set(T.c, T.r);
  }
  ui.rs.wrong = true;
}
function rKey(k) {
  if (!ui.rs || ui.view !== 'rush') return;
  if (k === 'back') {
    ui.rs.typed = ui.rs.typed.slice(0, -1);
    return rPaint();
  }
  if (k === 'clear') {
    ui.rs.typed = '';
    return rPaint();
  }
  if (k === 'skip') {
    rStart();
    if (!ui.rs.wrong) sfx('bad');
    rMiss();
    ui.rs.typed = '';
    return rPaint();
  }
  if (k === 'restart') {
    stopRush();
    return startRush();
  }
  if (!/^[a-z-]$/.test(k)) return;
  flash(`.kb [data-k="${k}"]`, 'hit', 120);
  rStart();
  const T = curTok(),
    v = ui.rs.typed + k,
    c = [T.r, ...T.al];
  if (ui.rs.afterN && v === 'n' && !T.r.startsWith('n')) {
    ui.rs.afterN = false;
    return;
  }
  ui.rs.afterN = false;
  if (c.includes(v)) {
    if (!ui.rs.wrong) ui.rs.ok++;
    ui.rs.afterN = T.r === 'n';
    ui.rs.wrong = false;
    ui.rs.k++;
    ui.rs.typed = '';
    if (ui.rs.k >= ui.rs.q[ui.rs.u].t.length) {
      sfx(ui.rs.res[ui.rs.u] === false ? 'tick' : 'card');
      if (ui.rs.res[ui.rs.u] !== false) ui.rs.res[ui.rs.u] = true;
      ui.rs.u++;
      ui.rs.k = 0;
    } else sfx('tick');
    if (ui.rs.k === 0) {
      if (ui.rs.fmt === 'time') rFill();
      else if (ui.rs.u >= ui.rs.q.length) return endRush();
    }
    return rPaint();
  }
  if (c.some(x => x.startsWith(v))) {
    ui.rs.typed = v;
    return rPaint();
  }
  rMiss();
  ui.rs.typed = '';
  sfx('bad');
  rPaint();
  flash('#ty', 'err');
}
function endRush() {
  if (!ui.rs || ui.view !== 'rush') return;
  stopRush();
  const tot = ui.rs.ok + ui.rs.err,
    ms = ui.rs.start ? Date.now() - ui.rs.start : 0;
  ui.rs.ms = ui.rs.fmt === 'deck' ? ms : ui.rs.dur * 1000;
  ui.rs.kpm = ui.rs.ms ? Math.round(ui.rs.ok / (ui.rs.ms / 60000)) : 0;
  ui.rs.acc = tot ? Math.round((ui.rs.ok / tot) * 100) : 0;
  const k = rkey(),
    b = S.best[k];
  if (ui.rs.fmt === 'deck') {
    ui.rs.record = !!ui.rs.ok && (!b || b.n !== ui.rs.q.length || ui.rs.ms < b.ms);
    if (ui.rs.record) S.best[k] = { ms: ui.rs.ms, n: ui.rs.q.length, acc: ui.rs.acc };
  } else {
    ui.rs.record = !!ui.rs.ok && (!b || ui.rs.kpm > b.kpm);
    if (ui.rs.record) S.best[k] = { kpm: ui.rs.kpm, acc: ui.rs.acc };
  }
  ui.rs.prev = b;
  if (ui.rs.ok) sfx('done');
  if (ui.rs.ok) addXp(ui.rs.ok);
  else save();
  ui.view = 'rushres';
  render();
}
const KB = [
  ...'azertyuiop',
  ...'qsdfghjklm',
  ['restart', '↻', 'Recommencer'],
  ...'wxcvbn',
  ['skip', '→', 'Passer'],
  ['back', '←', 'Effacer une lettre'],
  ['clear', '«', 'Tout effacer'],
];
function rushV() {
  return `<div class="rz"><div class="rz-top"><button class="x" data-act="rquit" aria-label="Quitter">×</button><span class="rz-tag">${ui.rs.fmt === 'deck' ? 'Paquet complet' : 'Contre la montre · ' + ui.rs.dur + ' s'} · ${S.rct === 'words' ? 'mots' : 'kana'}</span>${muteBtn()}${daru('idle', 36, allDone())}</div>
  <div class="stage"><div class="deck"><div class="cd b2" id="b2"></div><div class="cd b1" id="b1"></div><div class="cd front" id="cf"></div></div></div>
  <p class="hintline" id="rh"></p>
  <div class="rbar"><span class="t" id="rt">${rClock()}</span><div class="typed" id="ty" aria-live="polite"></div><span class="c" id="rc"></span></div>
  <div class="kb">${KB.map(k => (typeof k === 'string' ? `<button data-act="rk" data-k="${k}">${k.toUpperCase()}</button>` : `<button class="fn" data-act="rk" data-k="${k[0]}" aria-label="${k[2]}" title="${k[2]}">${k[1]}</button>`)).join('')}</div></div>`;
}
function rushResV() {
  const m = [...ui.rs.miss],
    deck = ui.rs.fmt === 'deck';
  const talk = !ui.rs.ok
    ? 'Le chrono n’a pas vraiment tourné… On en refait une ?'
    : ui.rs.record
      ? `Nouveau record ! ${ui.rs.prev ? (deck ? `Avant : ${fmtT(ui.rs.prev.ms)}.` : `Avant : ${ui.rs.prev.kpm} kana/min.`) : 'Premier score enregistré.'}`
      : ui.rs.kpm < 15
        ? 'Bon début : la vitesse vient avec les révisions.'
        : ui.rs.kpm < 30
          ? 'Ça commence à filer, continue !'
          : ui.rs.kpm < 50
            ? 'Très rapide, tu lis presque sans réfléchir.'
            : 'Vitesse de ninja. Daru est impressionné.';
  return (
    top() +
    `<section class="band"><div class="wrap narrow res"><p class="lead">Rafale · ${deck ? 'paquet de ' + ui.rs.q.length + ' cartes' : ui.rs.dur + ' s'} · ${S.rct === 'words' ? 'mots' : 'kana'}</p>
  <div class="big-n">${deck ? fmtT(ui.rs.ms) : ui.rs.kpm}</div><p class="lead" style="margin-top:-4px">${deck ? 'pour finir le paquet' : 'kana par minute'}</p>
  <div class="rfigs"><div class="fig1"><b>${deck ? ui.rs.kpm : ui.rs.ok}</b><span>${deck ? 'kana/min' : 'kana justes'}</span></div><div class="fig1"><b>${ui.rs.acc} %</b><span>précision</span></div><div class="fig1"><b>${ui.rs.err}</b><span>erreurs</span></div></div>
  ${m.length ? `<h2 style="margin-top:14px">À retravailler</h2><div class="mrow">${m.map(([c, r]) => `<button class="mk" data-act="say" data-t="${c}"><span lang="ja">${c}</span><small>${r}</small></button>`).join('')}</div>` : ''}
  ${mascot(ui.rs.record && ui.rs.ok ? 'happy' : 'idle', talk, 70)}
  <div class="acts"><button class="btn ac" data-act="rstart">Rejouer</button><button class="btn gh" data-act="home">Retour</button></div></div></section>`
  );
}

export { fmtT, rushSetupV, startRush, stopRush, rPaint, rKey, rushV, rushResV };
