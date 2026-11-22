/* ---------- progression : jours, série, déblocage des leçons et des tests ---------- */
import { S } from './state.js';
import { UNITS, SL } from '../data/kana.js';
const ld = (off = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + off);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const streak = () => (S.last === ld() || S.last === ld(-1) ? S.streak : 0);
const todayXp = () => (S.today === ld() ? S.todayXp : 0);
const unlocked = l => {
  if (S.unlock) return true;
  if (l.idx > 0) return !!S.done[SL[l.s][l.idx - 1].id];
  return l.s === 'h' || UNITS[0].lessons.every(x => S.done[x.id]);
};
const testOpen = u => S.unlock || u.lessons.every(l => S.done[l.id]);
const nextLesson = () => {
  for (const u of UNITS) for (const l of u.lessons) if (!S.done[l.id] && unlocked(l)) return l;
  return null;
};
const allDone = () => UNITS.every(u => u.lessons.every(l => S.done[l.id]));

export { ld, streak, todayXp, unlocked, testOpen, nextLesson, allDone };
