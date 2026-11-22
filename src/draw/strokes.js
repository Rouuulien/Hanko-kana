import { ITEMS } from '../data/kana.js';
import { S } from '../core/state.js';
/* ---------- Tracé des kana ----------
   Formes et ordre des traits : KanjiVG © Ulrich Apel, licence CC BY-SA 3.0 (data/kana-strokes.json) */
let KS = null,
  ksP = null;
function loadKS() {
  if (KS) return Promise.resolve(KS);
  if (!ksP)
    ksP = fetch('data/kana-strokes.json')
      .then(r => {
        if (!r.ok) throw 0;
        return r.json();
      })
      .then(j => {
        KS = j;
        return j;
      })
      .catch(e => {
        ksP = null;
        throw e;
      });
  return ksP;
}
const canDraw = c => !!(c && [...c].length === 1 && ITEMS[c]);
const drawOK = () => !!KS && S.draw !== false;

export { KS, ksP, loadKS, canDraw, drawOK };
