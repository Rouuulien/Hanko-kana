# Hanko premium · chantier 1, étape 4 : transitions

Statut : validé avec Julien le 23/11/2026. Document parent : `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`
(« Transitions : entre écrans et exercices, courtes (≈ 200 ms), fondu seul si « Réduire les animations » »).

## Intention

Donner à l'appli la fluidité d'une appli iPhone soignée, sans effets voyants : chaque changement d'écran ou d'exercice
est accompagné d'une entrée courte et douce.

## Objectifs

- Onglets : fondu enchaîné (pas de glissement, comme la barre d'onglets d'iOS).
- Entrée d'un écran plein cadre depuis les onglets (fiche, quiz, résultats, Réglages, Rafale, Pinceau) : fondu et
  montée de 12 px ; retour aux onglets : fondu.
- Passage d'un exercice au suivant (fiche suivante ou précédente, question suivante, kana suivant du Pinceau) : la carte
  arrive en glissant un peu depuis la droite (12 px), l'en-tête ne bouge pas.
- Panneau de réponse du quiz : monte du bas quand la réponse s'affiche.
- Durées : 200 ms (sortie douce, `ease-out`) ; « Réduire les animations » : fondu de 150 ms, aucun déplacement.
- Un simple réaffichage du même écran (synchronisation, changement de réglage, frappe en Rafale, choix hiragana /
  katakana) ne déclenche aucune animation.

## Non-objectifs

- Pas d'animation de sortie de l'ancien écran, pas de View Transitions API.
- Pas de changement de comportement ni de rythme du jeu (le chrono, l'enchaînement automatique du Pinceau après
  1,4 s, la Rafale gardent leurs temps).

## Anti-objectifs

- Une mise à jour de l'écran qui deviendrait asynchrone (le code et les tests lisent l'écran juste après `render()`).
- Un contenu qui reste invisible ou décalé si l'animation est interrompue (onglet changé pendant l'entrée).
- Une animation au moindre réaffichage.

## Approches considérées

- View Transitions API (`document.startViewTransition`) : anime aussi la sortie, mais applique le remplacement en
  différé ; casserait les lectures synchrones de l'écran. Écartée.
- **Animation d'entrée seule, en CSS, déclenchée par `render()` (retenue)** : le remplacement reste immédiat ; `render()`
  compare l'écran affiché au précédent et pose une classe d'entrée qui lance une animation CSS de 200 ms.

## Décisions laissées au constructeur

- Noms des classes et des `@keyframes`, endroit exact où poser la classe (conteneur de l'écran ou de la carte).
- Moyen de relancer une animation sur un élément réutilisé (nouvel élément après `innerHTML`, donc en pratique
  automatique).
