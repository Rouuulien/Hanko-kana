/* ---------- écrans : accueil, parcours, tableau, mots, fiches, quiz, résultats, réglages ---------- */
import { allDone, nextLesson, streak, testOpen, unlocked } from '../core/progress.js';
import { canRead, wordsWith } from '../core/reading.js';
import { dueList, nextDue } from '../core/srs.js';
import { S } from '../core/state.js';
import { ITEMS, LES, TOTAL, UNITS, unitItems } from '../data/kana.js';
import { NOTE_P, NOTE_S, fr } from '../data/notes.js';
import { WORDS } from '../data/words.js';
import { KS, canDraw } from '../draw/strokes.js';
import { modelSVG } from '../draw/svg.js';
import { brushSetupV } from '../modes/brush.js';
import { cur, opts } from '../modes/quiz.js';
import { rushSetupV } from '../modes/rush.js';
import { cloud, cloudText } from '../sync/cloud.js';
import { accountV } from './account.js';
import { ui } from './app-state.js';
import { daru, mascot } from './daru.js';
import {
  CHECK,
  CLOSE,
  GEAR,
  PENCIL,
  REPLAY,
  SPK,
  TAB_HOME,
  TAB_PATH,
  TAB_SHEET,
  TAB_TRAIN,
  TAB_WORDS,
} from './icons.js';
import { hintBtn, padHTML, padTools } from './pad.js';
import { muteBtn } from './sounds.js';
import { tts } from './voice.js';
import { K2H, esc, pick } from '../util.js';
/** Libellé du bouton d'effacement de la progression (deux clics : armer, puis confirmer). */
const resetLabel = () => (ui.armed ? 'Confirmer : tout effacer' : 'Effacer ma progression');
const wordHTML = w => `<span class="w" lang="ja">${w.j}</span> · ${w.r} · « ${w.f} »`;
/** Série de jours en toutes lettres (rien tant qu'elle est à zéro). */
const streakText = () => {
  const n = streak();
  return n ? `${n} jour${n > 1 ? 's' : ''} de suite` : '';
};
const top = () =>
  `<header class="top"><div class="brand"><span>Hanko</span><span class="brand-j" lang="ja">判子</span></div>
<div class="tstats"><span class="streak">${streakText()}</span><button class="ic" data-act="settings" aria-label="Réglages">${GEAR}</button></div></header>`;

function tipHome(nx, due) {
  if (ui.homeTip) return ui.homeTip;
  const nl = Object.keys(S.learned).length;
  let t;
  if (!nl)
    t = `Salut, moi c’est <b>Daru</b> ! Je n’ai qu’un œil peint : je peindrai le second quand tu connaîtras tous les kana. On commence par les 5 voyelles ?`;
  else if (allDone())
    t = `Mes deux yeux sont peints, tu connais tous les kana ! Continue les révisions pour les garder.`;
  else if (due) t = `<b>${due} kana</b> attendent leur révision. C’est maintenant que ta mémoire en profite le plus.`;
  else {
    const r = WORDS.filter(w => canRead(w));
    t = r.length
      ? `Avec ce que tu sais déjà, tu peux lire ${wordHTML(pick(r))}`
      : `Encore un peu et tu pourras lire tes premiers mots japonais. ${nx ? 'Prochaine étape : ' + nx.t + '.' : ''}`;
  }
  return (ui.homeTip = t);
}

/** Grands kana du bandeau d'accueil : un élément par kana, `--n` (nombre de caractères) règle la taille pour tenir sur une ligne. */
function bigK(items) {
  return `<div class="big-k" lang="ja" style="--n:${items.join('').length}">${items.map(k => `<span>${k}</span>`).join('')}</div>`;
}
/** Barre d'onglets en bas de l'écran (onglet courant : `ui.tab`, état d'interface non sauvegardé). */
const TABS = [
  ['home', 'Accueil', TAB_HOME],
  ['path', 'Parcours', TAB_PATH],
  ['sheet', 'Tableau', TAB_SHEET],
  ['words', 'Mots', TAB_WORDS],
  ['train', 'Entraîner', TAB_TRAIN],
];
function tabbar() {
  return `<nav class="tabbar" aria-label="Navigation">${TABS.map(([id, t, ic]) => `<button data-act="page" data-id="${id}"${ui.tab === id ? ' aria-current="page"' : ''}>${ic}<span>${t}</span></button>`).join('')}</nav>`;
}
/** Écran des onglets : en-tête, contenu de l'onglet courant, barre d'onglets. */
function homeV() {
  const band = h => `<section class="band"><div class="wrap">${h}</div></section>`;
  const body =
    ui.tab === 'path'
      ? pathV()
      : ui.tab === 'sheet'
        ? band(sheetV())
        : ui.tab === 'words'
          ? band(`<h1 class="tabt">Mots</h1>${wordsV()}`)
          : ui.tab === 'train'
            ? trainV()
            : todayV();
  return top() + `<div class="tabv">${body}</div>` + tabbar();
}
/** Onglet Accueil (maquette « Accueil clair ») : leçon du jour, révisions, progression compacte, Daru. */
function todayV() {
  const nx = nextLesson(),
    due = dueList().length,
    nl = Object.keys(S.learned).length,
    ms = Object.values(S.learned).filter(L => L.box >= 4).length;
  const rw = WORDS.filter(w => canRead(w)).length;
  const fig = (b, t) => `<div class="fig1"><b>${b}</b><span>${t}</span></div>`;
  return `<section class="band"><div class="wrap today-g">
  <article class="hero"><div class="hero-h"><p class="kick">${nx ? 'Leçon du jour' : 'Parcours terminé'}</p>${nx ? `<span class="mut">${nx.u.t}</span>` : ''}</div>
  <h1>${nx ? nx.t : 'Tous les kana sont vus !'}</h1>
  ${bigK(nx ? nx.items.slice(0, 5) : ['かな', 'カナ'])}
  ${nx ? `<button class="btn ac" data-act="lesson" data-id="${nx.id}">Commencer la leçon</button>` : ''}</article>
  <div class="rev"><div class="rev-t"><b><span class="rev-n">${due}</span> kana à réviser</b><span>${due ? 'Le bon moment pour ta mémoire.' : nextDue()}</span></div>
  ${due ? `<button class="btn gh" data-act="review">Réviser</button>` : nl ? `<button class="btn gh" data-act="practice">Entraînement libre</button>` : ''}</div>
  <div class="progress"><span class="mut">Ta progression</span><div class="prog"><i style="width:${Math.round((nl / TOTAL) * 100)}%"></i></div>
  <div class="figs">${fig(`${nl} / ${TOTAL}`, 'kana vus')}${fig(ms, 'maîtrisés')}${fig(`${rw} / ${WORDS.length}`, 'mots lisibles')}${fig(S.xp, 'XP')}</div></div>
  ${mascot('idle', tipHome(nx, due), 56)}
  </div></section>
  ${foot()}`;
}
const foot = () =>
  `<p class="foot"><span data-cloud>${cloudText()}</span><br><span>Tracés des kana : <a href="https://kanjivg.tagaini.net" style="color:inherit">KanjiVG</a> (CC BY-SA 3.0)</span>${cloud.mode === 'sb' ? ` <button class="link" data-act="settings">${cloud.uid ? 'Réglages' : 'Créer un compte'}</button> · <a href="confidentialite.html" style="color:inherit">Confidentialité</a>` : ''}</p>`;
/** Onglet Parcours : les unités et leurs leçons. */
function pathV() {
  const nx = nextLesson();
  return `<section class="band"><div class="wrap"><h1 class="tabt">Parcours</h1>${UNITS.map(u => unitV(u, nx)).join('')}</div></section>`;
}
/** Onglet Entraîner : Rafale ou Pinceau (choix dans `ui.train`, non sauvegardé). */
function trainV() {
  const t = ui.train;
  return `<section class="band"><div class="wrap"><h1 class="tabt">Entraîner</h1><nav class="seg" aria-label="Modes"><button data-act="page" data-id="rush" aria-pressed="${t === 'rush'}">Rafale</button><button data-act="page" data-id="brush" aria-pressed="${t === 'brush'}">Pinceau</button></nav>
  ${t === 'brush' ? brushSetupV() : rushSetupV()}</div></section>`;
}

const XS = [0, 52, 72, 52, 0, -52, -72, -52];
function unitV(u, nx) {
  const d = u.lessons.filter(l => S.done[l.id]).length,
    best = S.tests[u.id],
    to = testOpen(u),
    n = u.lessons.length;
  let k = 0;
  const node = (cls, act, id, dis, glyph, label, isCur) =>
    `<button class="stp ${cls}" style="--x:${XS[k++ % 8]}px" data-act="${act}" data-id="${id}" ${dis ? 'disabled' : ''}>${isCur ? '<span class="go">Commencer</span>' : ''}<span class="sk" lang="ja">${glyph}</span><span class="sl">${label}</span></button>`;
  return `<div class="unit"><div class="uhead ${best >= 80 ? 'full' : ''}"><div class="ub"><h3>${u.t}</h3><div class="ubar"><i style="width:${Math.round((d / n) * 100)}%"></i></div></div><span class="mut">${d} / ${n}</span></div><div class="trail">
  ${u.lessons
    .map(l => {
      const st = S.done[l.id] ? 'done' : unlocked(l) ? 'open' : 'lock',
        c = nx && nx.id === l.id;
      return node(st + (c ? ' cur' : ''), 'lesson', l.id, st === 'lock', l.items[0], l.t, c);
    })
    .join('')}
  ${node('test ' + (best >= 80 ? 'done' : to ? 'open' : 'lock'), 'test', u.id, !to, '試', best != null ? 'Test · ' + best + ' %' : 'Test d’unité', false)}</div></div>`;
}

function sheetV() {
  const s = S.tab || 'h',
    us = UNITS.filter(u => u.s === s);
  const cell = c => {
    if (!c) return '<span class="cell nil"></span>';
    const L = S.learned[c],
      b = L ? L.box : 0;
    return `<button class="cell b${b}" data-act="say" data-t="${c}" aria-label="${ITEMS[c].r}"><span lang="ja">${c}</span><small>${ITEMS[c].r}</small></button>`;
  };
  const base = us[0].lessons.flatMap(l => {
    const it = l.items;
    if (l.id.endsWith('-ya')) return [it[0], null, it[1], null, it[2]];
    if (l.id.endsWith('-wa')) return [it[0], null, null, null, it[1], it[2], null, null, null, null];
    return it;
  });
  return `<div class="sheet"><h2>Tableau des kana</h2><p class="mut" style="margin:4px 0 0">Plus la case est verte, mieux tu maîtrises le kana. Touche-le pour l’entendre${tts ? '' : ' (voix japonaise indisponible ici)'}.</p>
  <div class="tabs"><button data-act="tab" data-id="h" aria-pressed="${s === 'h'}">Hiragana</button><button data-act="tab" data-id="k" aria-pressed="${s === 'k'}">Katakana</button></div>
  <div class="g5">${base.map(cell).join('')}</div><p class="sub">Sons voisés</p><div class="g5">${unitItems(us[1]).map(cell).join('')}</div>
  <p class="sub">Combinaisons</p><div class="g3">${unitItems(us[2]).map(cell).join('')}</div>
  <div class="leg">Nouveau <i></i> Maîtrisé</div></div>`;
}

function wordsV() {
  const r = WORDS.filter(w => canRead(w)),
    l = WORDS.filter(w => !canRead(w));
  const card = (w, ok) =>
    `<button class="wd ${ok ? '' : 'locked'}" data-act="say" data-t="${w.j}"><span class="j" lang="ja">${w.j}</span><span class="r">${w.r}</span><span class="f">${w.f}</span></button>`;
  return `<div class="words">${mascot('happy', r.length ? `Tu peux lire <b>${r.length} mots</b>. Les autres se dévoileront au fil des leçons.` : `Aucun mot lisible pour l’instant. Après les voyelles, tu liras déjà <span class="w" lang="ja">あい</span> !`, 64)}
  <div class="wgrid">${r.map(w => card(w, true)).join('')}${l.map(w => card(w, false)).join('')}</div></div>`;
}

/** Bouton Quitter de la fiche et du quiz. */
const quitBtn = () => `<button class="x" data-act="quit" aria-label="Quitter">${CLOSE}</button>`;
function cardsV() {
  const L = LES[ui.ses.id],
    n = L.items.length,
    c = L.items[ui.ses.ci],
    it = ITEMS[c],
    h = K2H(c),
    last = ui.ses.ci === n - 1,
    ch = [...c];
  const tips = [];
  if (ch.length > 1)
    tips.push(`<span lang="ja">${ch[0]}</span> (${ITEMS[ch[0]].r}) + petit <span lang="ja">${ch[1]}</span> → ${it.r}`);
  if (fr(it.r) !== it.r) tips.push(`Se prononce « ${fr(it.r)} » en français.`);
  if (NOTE_P[h]) tips.push(NOTE_P[h]);
  if (NOTE_S[c]) tips.push(NOTE_S[c]);
  if (it.s === 'k') tips.push(`En hiragana : <span lang="ja">${h}</span>`);
  if (!(c in ui.ses.cw)) {
    const ws = wordsWith(c),
      soon = ws.filter(w => canRead(w, ui.ses.set));
    ui.ses.cw[c] = soon.length ? { w: pick(soon), now: true } : ws.length ? { w: pick(ws), now: false } : null;
  }
  const cw = ui.ses.cw[c];
  const say2 = cw
    ? `On retrouve <b lang="ja">${c}</b> dans ${wordHTML(cw.w)}${cw.now ? '<br>Tu pourras le lire dès la fin de cette leçon.' : ''}`
    : `Pas de mot facile avec <b lang="ja">${c}</b> pour l’instant, mais il reviendra vite.`;
  return `<div class="qtop">${quitBtn()}<div class="bar"><i style="width:${Math.round(((ui.ses.ci + 1) / n) * 30)}%"></i></div></div>
  <div class="qz"><p class="qcap">${L.u.t} · ${L.t} — découverte</p><div class="card">
  <div class="pk" lang="ja">${c}</div><div class="ro">${it.r}</div>
  ${tts ? `<button class="say" data-act="say" data-t="${c}">${SPK} Écouter</button>` : ''}
  ${tips.map(t => `<p class="hint">${t}</p>`).join('')}</div>
  ${
    canDraw(c) && KS && KS[c]
      ? `<div class="trace"><div class="tmodel" id="tm">${modelSVG(c)}</div><div class="tt"><b>Ordre des traits : ${KS[c].d.length}</b><button class="say" data-act="replay">${REPLAY}Revoir</button>${ui.ses.tr ? '' : `<button class="say" data-act="ctrace">${PENCIL}M’entraîner à tracer</button>`}</div></div>
  ${ui.ses.tr ? `<div class="tpad">${padHTML('cp', null).replace('class="pad"', `class="pad" data-key="c${ui.ses.ci}"`)}${ui.ses.tmsg ? `<p class="tmsg ${ui.ses.tok ? 'ok' : 'bad'}">${ui.ses.tmsg}</p>` : ''}${padTools(ui.ses.tdone ? '' : 'ccheck', ui.ses.tdone ? `<button class="btn gh sm" data-act="cagain">Recommencer</button>` : '')}</div>` : ''}`
      : ''
  }
  <div class="card-m">${mascot('idle', say2, 60)}</div>
  <div class="dots">${L.items.map((_, i) => `<i class="${i <= ui.ses.ci ? 'on' : ''}"></i>`).join('')}</div>
  <div class="cnav"><button class="btn gh" data-act="prev" ${ui.ses.ci ? '' : 'disabled'}>Précédent</button><button class="btn ac" data-act="${last ? 'go' : 'cnext'}">${last ? 'Passer au quiz' : 'Suivant'}</button></div>
  ${!last ? `<p class="skip"><button class="link" data-act="go">Je connais déjà, aller au quiz</button></p>` : ''}</div>`;
}

function quizV() {
  const Q = cur(),
    it = ITEMS[Q.c],
    A = ui.ses.ans;
  if (Q.type !== 'type' && Q.type !== 'draw' && !Q.o) Q.o = opts(Q.c);
  const base = ui.ses.kind === 'lesson' ? 30 : 0,
    pct = base + Math.round(((ui.ses.i + (A ? 1 : 0)) / ui.ses.queue.length) * (100 - base));
  const ask = {
    k2r: 'Comment se lit ce kana ?',
    r2k: 'Quel kana se lit ainsi ?',
    ear: 'Quel kana entends-tu ?',
    type: 'Écris sa lecture en romaji',
    draw: 'Dessine ce kana',
  }[Q.type];
  const pr =
    Q.type === 'draw'
      ? `<div class="bprompt"><span class="pr">${it.r}</span></div>`
      : Q.type === 'r2k'
        ? `<div class="pr">${it.r}</div>`
        : Q.type === 'ear'
          ? `<button class="ear" data-act="say" data-t="${it.c}" aria-label="Réécouter">${SPK}</button>`
          : `<div class="pk" lang="ja">${it.c}</div>`;
  const body =
    Q.type === 'draw'
      ? `${padHTML('qp', null).replace('class="pad"', `class="pad" data-key="q${ui.ses.i}"`)}${A ? '' : padTools('qcheck', hintBtn('qhint', Q.h, 0))}`
      : Q.type === 'type'
        ? `<form id="tf" class="tf"><input id="ti" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="ex. ka" aria-label="Lecture en romaji" ${A ? `disabled value="${esc(A.v)}" class="${A.ok ? 'ok' : 'bad'}"` : ''}>${A ? '' : '<button class="btn ac">Valider</button>'}</form>`
        : `<div class="opts">${Q.o
            .map((c, i) => {
              const cls = A ? (c === Q.c ? 'ok' : i === A.i ? 'bad' : '') : '';
              return `<button class="opt ${Q.type === 'k2r' ? 'ro' : 'ka'} ${cls}" data-act="opt" data-i="${i}" ${A ? 'disabled' : ''}><kbd>${i + 1}</kbd>${Q.type === 'k2r' ? ITEMS[c].r : `<span lang="ja">${c}</span>`}${cls === 'ok' ? CHECK : ''}</button>`;
            })
            .join('')}</div>`;
  const note =
    Q.type === 'draw' && A
      ? (A.tip || '') + (!A.ok && !A.self ? ` <button class="link" data-act="qself">J’avais juste</button>` : '')
      : A && !A.ok
        ? `Réponse : <span lang="ja">${it.c}</span> = ${it.r}${it.al.length && Q.type === 'type' ? ' (ou ' + it.al.join(', ') + ')' : ''}${A.tip ? '<br>' + A.tip : ''}`
        : A && Q.type === 'ear'
          ? `<span lang="ja">${it.c}</span> = ${it.r}`
          : '';
  const draw = Q.type === 'draw';
  const fb = A
    ? `<div class="fb ${A.ok ? 'ok' : 'bad'}${draw ? ' draw' : ''}"><div class="fb-in"><div class="fb-m">${draw ? '' : daru(A.ok ? 'happy' : 'oops', 48, allDone())}<div class="msg"><b>${A.msg}</b>${note ? `<span class="note">${note}</span>` : ''}</div></div><button class="btn ${A.ok ? 'ac' : 'gh'}" data-act="next" id="nb">Continuer</button></div></div>`
    : '';
  // Écouter : avant la réponse seulement là où ça ne la donne pas (dessin ; l'écoute a son gros bouton), après sur tous les types.
  const listen =
    tts && Q.type !== 'ear' && (draw || A)
      ? `<button class="say rnd" data-act="say" data-t="${it.c}" aria-label="Écouter">${SPK}</button>`
      : '';
  const les = ui.ses.kind === 'lesson' ? `<span class="qles">${LES[ui.ses.id].t}</span> · ` : '';
  return `<div class="qtop">${quitBtn()}<div class="bar"><i style="width:${pct}%"></i></div>${ui.ses.combo >= 2 ? `<span class="combo">×${ui.ses.combo}</span>` : ''}${muteBtn()}</div>
  <div class="qz${A ? ' ans' : ''}${draw ? ' draw' : ''}"><p class="qcap">${les}<span class="ask">${ask}</span></p><div class="prompt${draw ? ' short' : ''}">${pr}${listen}</div>${body}${fb}</div>`;
}

function resV() {
  const pc = Math.round(ui.ses.score * 100),
    k = ui.ses.kind,
    miss = [...ui.ses.miss],
    nl = k === 'lesson' ? nextLesson() : null,
    nw = ui.ses.newWords || [];
  const title =
    k === 'lesson'
      ? 'Leçon terminée'
      : k === 'test'
        ? ui.ses.pass
          ? 'Tampon obtenu !'
          : 'Encore un effort'
        : k === 'review'
          ? 'Révision terminée'
          : 'Entraînement terminé';
  const sub =
    k === 'test' && !ui.ses.pass
      ? `Il faut 80 % pour valider le test. Tu as ${pc} %.`
      : `${pc} % du premier coup · meilleure série ×${ui.ses.best} · +${ui.ses.xp} XP`;
  let talk;
  if (nw.length)
    talk = `Nouveau ! Tu peux maintenant lire :<br>${nw.slice(0, 4).map(wordHTML).join('<br>')}${nw.length > 4 ? `<br>…et ${nw.length - 4} autres dans l’onglet Mots.` : ''}`;
  else if (k === 'lesson') {
    const ws = ui.ses.items.flatMap(wordsWith).filter((w, i, a) => a.indexOf(w) === i);
    talk = ws.length
      ? `Ces kana apparaissent dans ${wordHTML(pick(ws))}<br>Encore quelques leçons et tu pourras le lire.`
      : `Ces kana sont rares dans les mots courants, mais tu les croiseras.`;
  } else
    talk = ui.ses.pass
      ? miss.length
        ? 'Revois les kana ci-dessus, ils reviendront bientôt dans tes révisions.'
        : 'Sans faute, bravo !'
      : 'Pas grave : refais un tour des leçons de l’unité et retente le test.';
  if (allDone() && k === 'lesson' && !nl) talk = 'Tu as vu tous les kana : je peins enfin mon second œil !';
  return `<div class="gres"><div class="gres-top"><button class="x" data-act="home" aria-label="Fermer">${CLOSE}</button></div>
  <div class="stamp ${ui.ses.pass ? 'on' : 'off'}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="60" cy="60" r="43" fill="none" stroke="currentColor" stroke-width="2"/><text x="60" y="78" text-anchor="middle" font-size="52" fill="currentColor" font-family="Zen Old Mincho, serif" font-weight="700">${ui.ses.pass ? '済' : '再'}</text></svg></div>
  <h1>${title}</h1>${k === 'test' && !ui.ses.pass ? `<p class="gsub">${sub}</p>` : ''}
  <div class="rfigs"><div class="fig1"><b>${pc} %</b><span>du premier coup</span></div><div class="fig1"><b>×${ui.ses.best}</b><span>meilleure série</span></div><div class="fig1"><b>+${ui.ses.xp}</b><span>XP</span></div></div>
  ${miss.length ? `<div class="gmiss"><p>À retravailler</p><div class="mrow">${miss.map(c => `<button class="mk" data-act="say" data-t="${c}"><span lang="ja">${c}</span><small>${ITEMS[c].r}</small></button>`).join('')}</div></div>` : ''}
  ${mascot(ui.ses.pass ? 'happy' : 'oops', talk, 56)}
  <div class="gacts">${nl ? `<button class="btn ac" data-act="lesson" data-id="${nl.id}">Leçon suivante</button>` : ''}${k === 'test' && !ui.ses.pass ? `<button class="btn ac" data-act="test" data-id="${ui.ses.id}">Retenter</button>` : ''}<button class="btn gh" data-act="home">Retour</button></div></div>`;
}

function setV() {
  const acc = accountV();
  return `<section class="band"><div class="wrap narrow set"><header class="sethead"><button class="back" data-act="home">← Retour</button><h1>Réglages</h1></header>
  <div class="sgroup">
  <label class="tg"><span>Tout débloquer<small>Accède à n’importe quelle leçon, sans suivre l’ordre.</small></span><input type="checkbox" data-act="tog" data-k="unlock" ${S.unlock ? 'checked' : ''}></label>
  <label class="tg"><span>Exercices d’écoute<small>${tts ? 'Utilise la voix japonaise de ton appareil.' : 'Aucune voix japonaise trouvée sur cet appareil.'}</small></span><input type="checkbox" data-act="tog" data-k="ear" ${S.ear !== false ? 'checked' : ''} ${tts ? '' : 'disabled'}></label>
  <label class="tg"><span>Exercices de dessin<small>Ajoute des « dessine ce kana » dans les leçons et les révisions.</small></span><input type="checkbox" data-act="tog" data-k="draw" ${S.draw !== false ? 'checked' : ''}></label>
  <label class="tg"><span>Sons du jeu<small>Petits sons de bonne réponse, d’erreur, de série et de fin de leçon.</small></span><input type="checkbox" data-act="tog" data-k="snd" ${S.snd !== false ? 'checked' : ''}></label>
  </div>
  ${acc ? `<section class="scard">${acc}</section>` : ''}
  <section class="scard"><h2>Sauvegarde</h2><p style="margin:0;font-weight:500" data-cloud>${cloudText()}</p><p class="mut" style="margin:0">Code de secours : copie-le pour garder une copie manuelle ou transférer ta progression hors de Claude (par exemple vers la version GitHub Pages).</p>
  <textarea id="exp" readonly rows="3">${esc(JSON.stringify(S))}</textarea><button class="btn gh" data-act="copy">Copier le code</button>
  <form id="imp"><textarea id="impt" rows="3" placeholder="Colle ici un code de sauvegarde" aria-label="Code de sauvegarde"></textarea><button class="btn gh">Importer</button><p id="impm" class="mut" style="margin:0"></p></form></section>
  <section class="scard"><h2>Remise à zéro</h2><button class="btn danger" data-act="reset">${resetLabel()}</button></section></div></section>`;
}

export { wordHTML, top, homeV, cardsV, quizV, resV, setV, resetLabel };
