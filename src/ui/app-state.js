/* ---------- état de l'interface (non sauvegardé) ----------
   Un seul objet partagé par les modules d'interface : écran courant, session de quiz, Rafale, Pinceau, zone de dessin.
   Rien de tout cela n'est sauvegardé : la progression du joueur est dans S (src/core/state.js). */
const ui = {
  view: 'home', // écran courant : home (les onglets), cards, quiz, res, set, rush, rushres, brush, brushres
  tab: 'home', // onglet ouvert quand view === 'home' : home, path, sheet, words, train (l'appli s'ouvre sur Accueil)
  train: 'rush', // mode choisi dans l'onglet Entraîner : rush (Rafale) ou brush (Pinceau)
  scroll: {}, // position de défilement de chaque onglet, retrouvée au retour (non sauvegardée)
  ses: null, // leçon, quiz, test ou révision en cours
  armed: false,
  armedDel: false, // confirmations en attente : effacer la progression, supprimer le compte
  lastView: '',
  homeTip: null, // dernier écran affiché (remise en haut de page), message de Daru sur l'accueil
  aidAnim: false,
  PAD: null, // aide animée au prochain affichage, zone de dessin montée
  bs: null,
  rs: null, // partie de Pinceau, partie de Rafale
};

export { ui };
