import { SPK } from './icons.js';
import { S } from '../core/state.js';
/* ---------- sons (synthétisés, Web Audio) ---------- */
let AC = null;
function ac() {
  if (S.snd === false) return null;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch (e) {
    return null;
  }
}
function tone(f, t0, d, type, vol) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + t0,
    o = a.createOscillator(),
    g = a.createGain();
  o.type = type || 'triangle';
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol || 0.16, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + d + 0.03);
}
const SFX = {
  ok() {
    tone(880, 0, 0.12);
    tone(1318.5, 0.07, 0.24);
  },
  bad() {
    tone(220, 0, 0.16, 'square', 0.05);
    tone(165, 0.09, 0.24, 'square', 0.045);
  },
  combo() {
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(f, i * 0.055, 0.2, 'triangle', 0.13));
  },
  card() {
    tone(1046.5, 0, 0.08, 'triangle', 0.11);
    tone(1568, 0.045, 0.13, 'triangle', 0.09);
  },
  tick() {
    tone(1760, 0, 0.05, 'sine', 0.06);
  },
  done() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.45, 'triangle', 0.14));
    tone(1568, 0.42, 0.7, 'sine', 0.1);
  },
};
const sfx = n => {
  try {
    SFX[n]();
  } catch (e) {}
};
const muteBtn = () =>
  `<button class="x snd" data-act="mute" aria-label="${S.snd === false ? 'Activer' : 'Couper'} les sons" title="${S.snd === false ? 'Activer' : 'Couper'} les sons">${S.snd === false ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="m16 9 5 6m0-6-5 6"/></svg>' : SPK.replace('<svg ', '<svg width="20" height="20" ')}</button>`;

export { sfx, muteBtn };
