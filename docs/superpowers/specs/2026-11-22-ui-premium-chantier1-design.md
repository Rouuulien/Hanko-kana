# Hanko premium · chantier 1 : charte et structure

Statut : validé dans la conversation du 22/11/2026 (direction, découpage, approche A, maquettes).
Maquettes : https://claude.ai/artifact/KKPsUdEAE21pZ83ZM7b4ac (accueil clair et sombre, quiz, charte).

## Intention

Julien veut une appli qui fasse « premium » : d'abord pour son usage quotidien sur iPhone (appli installée),
ensuite peut-être pour l'App Store. Direction : appli lifestyle japonaise contemporaine, sobre et minimaliste,
avec une mascotte attachante. Surtout pas un « Duolingo bis ».

Ce document couvre le chantier 1 (charte et structure). Les chantiers suivants sont : 2, la koï ; 3, les voix
naturelles ; 4, l'App Store. Ils sont hors périmètre ici.

## Objectifs

- Nouvelle charte partout : palette Washi / Sumi / Vermillon / Sauge / Sable / Or mat, polices Noto Sans JP
  (interface, japonais courant), Zen Old Mincho (titres, marque), Klee One (grands kana).
- Le rouge redevient un accent : actions principales, onglet actif, rien d'autre.
- Navigation d'appli iPhone : onglets en bas (Accueil, Parcours, Tableau, Mots, Entraîner), un écran par
  fonction, l'accueil réduit à la leçon du jour, aux révisions et à une progression compacte.
- Vrai thème sombre (palette déclinée, pas une inversion).
- Espacements, rayons, tailles de texte et boutons cohérents sur tous les écrans.
- Transitions courtes et douces entre écrans et entre exercices, en respectant « Réduire les animations ».

## Non-objectifs

- Ne pas changer les règles du jeu, les contenus pédagogiques ni le format de sauvegarde.
- Pas de koï : Daru reste en place jusqu'au chantier 2.
- Pas de nouvelles voix, pas de version native.

## Anti-objectifs (échec même si « ça marche »)

- Perdre ou altérer une progression (clé `hanko-kana-v1`, `S`, `merge()` : règles de CLAUDE.md).
- Une appli qui ne fonctionne plus hors ligne, polices comprises.
- Des zones tactiles < 44 px, du texte sous 4,5:1 de contraste, un contenu masqué par l'encoche ou la barre
  d'accueil.
- Du rouge partout, des styles de boutons hétérogènes.

## Contraintes

- Pas de build pour le site : modules ES natifs, une seule feuille `styles.css`. Les tests existants restent
  verts. Les sélecteurs `data-act` et les `id` qu'ils utilisent ne changent pas ; si un test dépend d'un
  balisage qui change, on adapte l'adaptateur ou le geste, jamais l'assertion de comportement.
- Le thème suit le réglage du système (`light-dark()`, `color-scheme`), comme aujourd'hui.
- La version claude.ai doit continuer à se construire (`npm run build:claude`).
- Polices hébergées avec l'appli et mises en cache hors ligne : fichiers `woff2` sous-ensemblés (latin,
  kana complets, signes et kanji réellement affichés) pour garder un poids raisonnable. Licences OFL publiées
  à côté.

## Approches considérées

- **A. Par étapes jouables (retenue)** : 1 charte, 2 structure, 3 harmonisation écran par écran, 4 transitions.
  Une PR par étape, essayée sur iPhone avant fusion ; permet de corriger le tir tôt.
- B. Tout d'un coup : plus homogène d'emblée, mais rien de visible longtemps, PR énorme, tests réécrits en bloc.
- C. Nouvelle interface en parallèle derrière un réglage : double l'entretien pour un seul joueur.

## Décisions prises avec Julien

- Palette (fond Washi #F7F5EF, texte Sumi #282824, Vermillon #C64B3C, Sauge #9BAE9A, Sable #E8DFD0,
  Or mat #B69A63). Versions foncées pour le texte : Sauge #3F5241 / #5E7360, Or mat #7D6435.
- Grands kana en Klee One (formes manuscrites, cohérentes avec le Pinceau).
- Onglet « Entraîner » qui regroupe Rafale et Pinceau.
- Thème sombre décliné : fond #1B1A17, cartes #24231F, texte #EEEAE0, vermillon éclairci #E0705F pour le
  texte, boutons pleins en #C64B3C.
- Polices auto-hébergées, animations respectant « Réduire les animations ».

## Étapes (une PR chacune)

1. **Charte** : variables de couleur (clair et sombre), polices auto-hébergées et sous-ensemblées, échelle
   d'espacements, de rayons et de textes, styles de boutons unifiés (plein, contour, lien), `theme-color`
   et manifeste. Le bandeau d'accueil rouge devient une carte claire. Organisation des écrans inchangée.
2. **Structure** : barre d'onglets en bas (zones sûres), écrans Accueil / Parcours / Tableau / Mots /
   Entraîner (Rafale + Pinceau), accueil réduit comme la maquette. Le dernier onglet ouvert est un état
   d'interface (`ui`), non sauvegardé.
3. **Harmonisation** : quiz (panneau de réponse qui monte du bas), leçon, Rafale, Pinceau, résultats,
   réglages ; nettoyage du CSS mort.
4. **Transitions** : entre écrans et exercices, courtes (≈ 200 ms), fondu seul si « Réduire les animations ».

## Laissé au constructeur

- Noms et organisation des variables CSS, échelle exacte (espacements multiples de 4, rayons 12/14/20/24).
- Outil de sous-ensemble des polices (outil de développement seulement, lancé une fois, documenté).
- Liste exacte des éléments en Klee One (grands kana : cartes, quiz, tableau, accueil).
- Ajustements visuels fins tant qu'ils respectent les maquettes et les contrastes.
