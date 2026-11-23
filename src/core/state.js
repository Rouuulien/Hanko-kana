// @ts-check
/* ---------- état : l'objet de progression S et sa sauvegarde locale ----------
   Règles (voir CLAUDE.md) : clé hanko-kana-v1 immuable ; évolutions de S uniquement additives (nouveau champ = valeur par défaut dans fresh()).
   S est un objet unique, jamais réaffecté : pour le remplacer entièrement, passer par replaceState(). */
/** @typedef {import('../../types/hanko').State} State @typedef {import('../../types/hanko').SavedState} SavedState */
/** Clé de la sauvegarde locale : ne jamais la changer. */
const KEY = 'hanko-kana-v1';
/** État neuf : valeur par défaut de chaque champ. @returns {State} */
const fresh = () => ({
  learned: {},
  done: {},
  tests: {},
  xp: 0,
  streak: 0,
  last: '',
  today: '',
  todayXp: 0,
  unlock: false,
  ear: true,
  tab: 'h',
  page: 'path', // plus utilisé depuis l'étape 2 des onglets (onglet = état d'interface), gardé pour compatibilité
  rsc: 'h',
  rct: 'kana',
  rdu: 60,
  rfmt: 'deck',
  best: {},
  snd: true,
  draw: true,
  bsc: 'h',
  bn: 10,
  bl: 2,
});
/** La progression du joueur (objet unique). @type {State} */
const S = fresh();
/** Remplace tout le contenu de S en gardant le même objet (les modules qui l'importent voient le changement). */
/** @param {SavedState} v */
function replaceState(v) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, v);
}
/** Champs de S qui doivent être des objets : null ou un tableau ferait planter le jeu au premier affichage. */
const OBJECT_FIELDS = ['learned', 'done', 'tests', 'best'];
/**
 * Lit une sauvegarde venue d'ailleurs (localStorage, code de secours, version en ligne).
 * Refusée (null) si ce n'est pas un objet dont `learned` est de type objet, comme avant.
 * Sinon réparée sans rien perdre : un champ objet invalide (null, tableau, valeur simple) devient {},
 * tous les autres champs sont gardés tels quels.
 * @param {unknown} v
 * @returns {SavedState | null}
 */
function readSave(v) {
  if (!v || typeof v !== 'object' || typeof (/** @type {SavedState} */ (v).learned) !== 'object') return null;
  const r = { .../** @type {SavedState} */ (v) };
  for (const k of OBJECT_FIELDS) if (k in r && (!r[k] || typeof r[k] !== 'object' || Array.isArray(r[k]))) r[k] = {};
  return r;
}
/** Charge la sauvegarde locale si elle est lisible ; sinon S reste à l'état neuf. */
function loadLocal() {
  try {
    const v = readSave(JSON.parse(localStorage.getItem(KEY)));
    if (v) replaceState(Object.assign(fresh(), v));
  } catch (e) {}
}
const saveLocal = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
};

export { KEY, fresh, S, replaceState, readSave, loadLocal, saveLocal };
