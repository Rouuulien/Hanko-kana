/* ---------- zone de dessin au doigt et aides au tracé (calque, point de départ, indices) ---------- */
import { cur } from '../modes/quiz.js';
import { S } from '../core/state.js';
import { LES } from '../data/kana.js';
import { KS } from '../draw/strokes.js';
import { aidSVG, modelSVG } from '../draw/svg.js';
import { ui } from './app-state.js';
import { BULB, ERASE, UNDO } from './icons.js';
const BASE_AID = { 1: 2, 2: 1, 3: 0 };
function aidCtx() {
  if (ui.view === 'cards' && ui.ses && ui.ses.tr && !ui.ses.tdone)
    return { c: LES[ui.ses.id].items[ui.ses.ci], aid: 2 };
  if (ui.view === 'quiz' && ui.ses && !ui.ses.ans) {
    const Q = cur();
    if (Q && Q.type === 'draw') return { c: Q.c, aid: Q.h || 0 };
  }
  if (ui.view === 'brush' && ui.bs && ui.bs.state !== 'done')
    return { c: ui.bs.q[ui.bs.u], aid: Math.max(BASE_AID[S.bl || 2], ui.bs.h || 0) };
  return null;
}
/* état de l’interface : voir src/ui/app-state.js */
function refreshAid() {
  if (!ui.PAD) return;
  const el = document.querySelector('#' + ui.PAD.id + ' .phint');
  if (!el) return;
  const a = aidCtx();
  el.innerHTML = a && !ui.PAD.locked ? aidSVG(a.c, a.aid, ui.PAD.strokes.length, ui.aidAnim) : '';
  ui.aidAnim = false;
}
const hintBtn = (act, h, base) => {
  const cur = Math.max(base, h || 0);
  return cur >= 3
    ? ''
    : `<button class="btn gh sm hintb" data-act="${act}">${BULB}Indice${cur > base ? ` (${cur - base}/${3 - base})` : ''}</button>`;
};
/* état de l’interface : voir src/ui/app-state.js */
const padHTML = (id, guide) =>
  `<div class="pad" id="${id}">${guide && KS ? `<div class="pguide">${modelSVG(guide, { anim: false, nums: false, cls: 'ghost' })}</div>` : ''}<div class="phint"></div><canvas aria-label="Zone de dessin"></canvas><div class="pover"></div></div>`;
const padTools = (chk, extra) =>
  `<div class="ptools"><button class="btn gh sm" data-act="pundo">${UNDO}Annuler</button><button class="btn gh sm" data-act="pclear">${ERASE}Effacer</button>${chk ? `<button class="btn ac sm" data-act="${chk}">Valider</button>` : ''}${extra || ''}</div>`;
function mountPad(id) {
  const box = document.getElementById(id);
  if (!box) return null;
  const cv = box.querySelector('canvas'),
    ctx = cv.getContext('2d');
  const keep = ui.PAD && ui.PAD.id === id && ui.PAD.key === box.dataset.key;
  const st = keep ? ui.PAD.strokes : [];
  let cur = null,
    W = 0;
  const P = {
    id,
    key: box.dataset.key,
    strokes: st,
    locked: keep ? ui.PAD.locked : false,
    fade: keep ? ui.PAD.fade : false,
    onStroke: null,
  };
  function redraw() {
    const w = box.clientWidth,
      h = box.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, w / 30);
    ctx.strokeStyle = getComputedStyle(box).color;
    ctx.globalAlpha = P.fade ? 0.3 : 1;
    for (const s of cur ? st.concat([cur]) : st) {
      ctx.beginPath();
      s.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.length === 1) ctx.lineTo(s[0][0] + 0.1, s[0][1] + 0.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function size() {
    const d = window.devicePixelRatio || 1,
      w = box.clientWidth,
      h = box.clientHeight;
    if (!w) return;
    if (W && W !== w) {
      const k = w / W;
      for (const s of st)
        for (const q of s) {
          q[0] *= k;
          q[1] *= k;
        }
    }
    W = w;
    cv.width = w * d;
    cv.height = h * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    redraw();
  }
  const pt = e => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', e => {
    if (P.locked) return;
    e.preventDefault();
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (x) {}
    cur = [pt(e)];
    redraw();
  });
  cv.addEventListener('pointermove', e => {
    if (!cur) return;
    e.preventDefault();
    for (const x of e.getCoalescedEvents ? e.getCoalescedEvents() : [e]) cur.push(pt(x));
    redraw();
  });
  const end = () => {
    if (!cur) return;
    if (cur.length > 1 || st.length < 12) st.push(cur);
    cur = null;
    redraw();
    if (P.onStroke) P.onStroke();
    refreshAid();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('lostpointercapture', end);
  Object.assign(P, {
    redraw,
    undo() {
      if (!P.locked) {
        st.pop();
        redraw();
        refreshAid();
      }
    },
    clear() {
      if (!P.locked) {
        st.length = 0;
        redraw();
        refreshAid();
      }
    },
    over(h) {
      box.querySelector('.pover').innerHTML = h;
    },
    reset() {
      P.locked = false;
      P.fade = false;
      st.length = 0;
      P.over('');
      redraw();
    },
  });
  try {
    new ResizeObserver(size).observe(box);
  } catch (e) {}
  size();
  ui.PAD = P;
  refreshAid();
  return P;
}
const strokesOf = P => (P ? P.strokes.filter(s => s.length > 1 || P.strokes.length < 3) : []);

export { BASE_AID, hintBtn, padHTML, padTools, mountPad, strokesOf };
