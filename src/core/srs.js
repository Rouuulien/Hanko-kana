// @ts-check
/* ---------- révisions espacées (boîtes de Leitner) : chaque kana revient de 4 h à 35 jours ---------- */
import { S } from './state.js';
/** Intervalle avant la prochaine révision, par boîte (ms) : 4 h, 1 j, 3 j, 7 j, 16 j, 35 j. */
const IV = [0, 4 * 36e5, 864e5, 3 * 864e5, 7 * 864e5, 16 * 864e5, 35 * 864e5];
/** Note une réponse : boîte suivante si juste (plafond 6), boîte 1 sinon. @param {string} c @param {boolean} ok */
function grade(c, ok) {
  const L = S.learned[c];
  if (!L) return;
  L.box = ok ? Math.min(6, L.box + 1) : 1;
  L.due = Date.now() + IV[L.box];
}
/** Kana à réviser maintenant, du plus en retard au moins en retard. @returns {string[]} */
const dueList = () => {
  const n = Date.now();
  return Object.entries(S.learned)
    .filter(([, L]) => L.due <= n)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([c]) => c);
};
/** Annonce de la prochaine révision. @returns {string} */
function nextDue() {
  const now = Date.now();
  let m = Infinity;
  for (const L of Object.values(S.learned)) if (L.due > now && L.due < m) m = L.due;
  if (m === Infinity) return Object.keys(S.learned).length ? '' : 'Termine une leçon pour lancer tes révisions.';
  const h = (m - now) / 36e5;
  return (
    'Prochaine révision ' +
    (h < 1 ? 'dans moins d’une heure' : h < 24 ? 'dans ' + Math.round(h) + ' h' : 'dans ' + Math.round(h / 24) + ' j') +
    '.'
  );
}

export { IV, grade, dueList, nextDue };
