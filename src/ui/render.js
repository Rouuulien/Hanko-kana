/* ---------- affichage de l'écran courant, montage de la zone de dessin, focus, voix ---------- */
import { LES } from '../data/kana.js';
import { KS, ksP, loadKS } from '../draw/strokes.js';
import { modelSVG } from '../draw/svg.js';
import { bClock, brushResV, brushV } from '../modes/brush.js';
import { cur } from '../modes/quiz.js';
import { rPaint, rushResV, rushV } from '../modes/rush.js';
import { ui } from './app-state.js';
import { mountPad } from './pad.js';
import { cardsV, homeV, quizV, resV, setV } from './views.js';
import { snapshot, transitionFor } from './transition.js';
import { say } from './voice.js';
const app = document.getElementById('app');
/** Pose la classe d'animation d'entrée (CSS) : l'écran est déjà affiché, seule son arrivée est animée. */
function enter(t) {
  if (t === 'fade' || t === 'rise') {
    app.classList.remove('tr-fade', 'tr-rise');
    void app.offsetWidth; // relance l'animation si la même classe vient d'être posée
    app.classList.add(`tr-${t}`);
    app.addEventListener('animationend', e => e.target === app && app.classList.remove(`tr-${t}`), { once: true });
  }
  // Nouveaux éléments à chaque rendu : poser la classe suffit à lancer l'animation.
  if (t === 'next') app.querySelector('.qz, .bstage')?.classList.add('tr-next');
  if (t === 'panel') app.querySelector('.fb')?.classList.add('tr-up');
}
function render() {
  // L'écran affiché était un onglet : on retient sa position de défilement avant de le remplacer.
  if (ui.lastView.startsWith('home:')) ui.scroll[ui.lastView.split(':')[1]] = window.scrollY;
  app.innerHTML = {
    home: homeV,
    cards: cardsV,
    quiz: quizV,
    res: resV,
    set: setV,
    rush: rushV,
    rushres: rushResV,
    brush: brushV,
    brushres: brushResV,
  }[ui.view]();
  if (!KS && !ksP && (ui.view === 'cards' || (ui.view === 'home' && ui.tab === 'train' && ui.train === 'brush')))
    loadKS()
      .then(() => {
        if (ui.view === 'cards' || ui.view === 'home') render();
      })
      .catch(() => {});
  const pid = ['cp', 'qp', 'bp'].find(i => document.getElementById(i));
  if (!pid) ui.PAD = null;
  else {
    const P = mountPad(pid),
      mo = (c, ok) => P.over(modelSVG(c, { cls: ok ? 'okm' : 'badm', speed: 0.45 }));
    if (pid === 'qp' && ui.ses && ui.ses.ans) {
      P.locked = true;
      P.fade = true;
      P.redraw();
      mo(cur().c, ui.ses.ans.ok);
    }
    if (pid === 'cp' && ui.ses && ui.ses.tdone) mo(LES[ui.ses.id].items[ui.ses.ci], ui.ses.tok);
    if (pid === 'bp' && ui.bs) {
      P.onStroke = () => {
        if (!ui.bs.start) {
          ui.bs.start = Date.now();
          ui.bs.tid = setInterval(() => {
            const e = document.getElementById('bt');
            if (e) e.textContent = bClock();
          }, 500);
        }
      };
      if (ui.bs.state === 'done') mo(ui.bs.q[ui.bs.u], ui.bs.r.ok);
    }
  }
  // Panneau de réponse fixé en bas : le quiz réserve sa hauteur réelle (note sur plusieurs lignes, zone sûre comprise).
  const fb = app.querySelector('.fb'),
    qz = app.querySelector('.qz');
  if (fb && qz) qz.style.setProperty('--fb-h', `${fb.offsetHeight}px`);
  const shot = snapshot(ui);
  enter(transitionFor(ui.shot, shot));
  ui.shot = shot;
  if (ui.view === 'rush') rPaint();
  const where = ui.view === 'home' ? `home:${ui.tab}:${ui.train}` : ui.view;
  if (where !== ui.lastView) {
    window.scrollTo(0, ui.view === 'home' ? ui.scroll[ui.tab] || 0 : 0); // le navigateur borne si l'onglet a raccourci
    ui.lastView = where;
  }
  if (ui.view === 'cards') say(LES[ui.ses.id].items[ui.ses.ci]);
  if (ui.view === 'quiz') {
    const Q = cur();
    if (ui.ses.ans) {
      const b = document.getElementById('nb');
      b && b.focus({ preventScroll: true });
    } else if (Q.type === 'type') {
      const i = document.getElementById('ti');
      i && i.focus({ preventScroll: true });
    } else if (Q.type === 'ear') say(Q.c);
  }
}

export { app, render };
