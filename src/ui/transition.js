/* ---------- transitions : quelle animation d'entrée pour l'écran qui s'affiche ----------
   render() remplace l'écran immédiatement ; on n'anime que l'arrivée du nouveau contenu (étape 4 de la refonte).
   Fonctions pures, sans DOM : testées par tests/unit/transition.test.js. */

/**
 * @typedef {{ view: string, tab: string, train: string, step: string, ans: boolean }} Shot
 * Instantané de ce qui est affiché : écran, onglet, mode d'entraînement, exercice en cours, réponse affichée.
 */

/** @param {any} ui état d'interface (src/ui/app-state.js) @returns {Shot} */
function snapshot(ui) {
  const v = ui.view;
  const step =
    v === 'cards' && ui.ses
      ? `c${ui.ses.ci}`
      : v === 'quiz' && ui.ses
        ? `q${ui.ses.i}`
        : v === 'brush' && ui.bs
          ? `b${ui.bs.u}`
          : '';
  const ans = v === 'quiz' ? !!(ui.ses && ui.ses.ans) : v === 'brush' ? !!(ui.bs && ui.bs.state === 'done') : false;
  return { view: v, tab: ui.tab, train: ui.train, step, ans };
}

/**
 * @param {Shot | null} prev écran affiché jusqu'ici (null au premier affichage)
 * @param {Shot} next écran qui s'affiche
 * @returns {'none' | 'tab' | 'fade' | 'rise' | 'next' | 'panel'}
 */
function transitionFor(prev, next) {
  if (!prev) return 'none';
  if (prev.view === 'home' && next.view === 'home')
    return prev.tab !== next.tab || prev.train !== next.train ? 'tab' : 'none'; // seul le contenu de l'onglet fond
  if (next.view === 'home') return 'fade'; // retour aux onglets
  if (prev.view === 'home') return 'rise'; // écran plein cadre ouvert depuis les onglets
  if (prev.view !== next.view) return prev.view === 'cards' && next.view === 'quiz' ? 'next' : 'rise';
  if (prev.step !== next.step) return 'next';
  if (next.view === 'quiz' && !prev.ans && next.ans) return 'panel';
  return 'none';
}

export { snapshot, transitionFor };
