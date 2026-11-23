# Hanko premium · chantier 1, étape 3 : harmonisation écran par écran

Statut : approche validée avec Julien le 23/11/2026 (thème suivi partout, 3 PR, approche C). Document parent :
`docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md` (objectifs, anti-objectifs, palette, contraintes :
tout s'applique ici). Maquettes : https://claude.ai/artifact/KKPsUdEAE21pZ83ZM7b4ac (« Quiz bonne réponse »).

## Intention

Les étapes 1 et 2 ont posé la charte et la navigation par onglets. Les écrans hors onglets (fiche de découverte, quiz,
résultats, Rafale, Pinceau, Réglages) gardent une mise en page antérieure : encadré de réponse au milieu du quiz,
tampon géant, boutons de tailles variées, cases à cocher du navigateur, et surtout Rafale et Pinceau toujours en
sombre. Objectif : que chaque écran ait l'air de la même appli premium, sur iPhone, en clair comme en sombre.

## Objectifs

- Un seul langage visuel : cartes `--card` à rayon 20–24 et filet `--line`, boutons pleins (action principale,
  une seule rouge par écran) et contour à 52 px de haut pleine largeur sur mobile, légendes 13 px `--mut`, grands kana
  en Klee One, progression en sauge.
- Rafale et Pinceau suivent le thème du système comme le reste (décision de Julien) : fin de la « scène » sombre
  permanente (variables `--st-*`).
- Points reportés des étapes 1 et 2 traités (liste en PR 3 et PR 1).
- CSS mort supprimé.

## Non-objectifs

- Règles du jeu, contenus, textes de Daru, format de sauvegarde : inchangés.
- Pas de koï (chantier 2) : là où la maquette montre la koï, on met Daru.
- Pas d'animations nouvelles : les transitions sont l'étape 4. Le panneau de réponse est placé en bas dès maintenant ;
  sa montée animée viendra à l'étape 4.

## Anti-objectifs

Ceux du document parent, plus : un écran de jeu qui reste sombre quand l'iPhone est en clair ; une réponse du quiz
dont le bouton « Continuer » est caché par le clavier ou la barre d'accueil ; une régression de la saisie au clavier
(Rafale, quiz « écris la lecture ») ou du dessin au doigt.

## Contraintes

- Celles du document parent (pas de build, `data-act` et `id` inchangés, tests de comportement intouchés, claude.ai
  construit, 4,5:1, 44 px, zones sûres).
- `#nb` (Continuer), `#ti`, `#tf`, `#qp`, `#cp`, `#bp`, `#bt`, `#rh`, `#cf`, `.pk`, `.prompt .pk`, `.big-n`,
  `.rfigs .fig1 b`, `.fb` (et ses classes `ok` / `bad`), `.opt[data-i]`, `.bfb` servent aux tests : on peut changer leur habillage, pas les retirer.

## Approches considérées

- A. Maquette avant chaque PR : validation sur image, un aller-retour de plus par PR.
- B. Code direct d'après la charte : plus rapide, désaccords corrigés après coup.
- **C. Mixte (retenue)** : code direct pour le quiz et la fiche (maquette du quiz existante) et pour les résultats et
  les Réglages (écrans simples) ; maquette d'abord pour Rafale et Pinceau, dont le passage au thème clair change le
  plus l'aspect.

## Découpage (une PR chacune, essayée sur iPhone avant la suivante)

### PR 1 : quiz et fiche de découverte

Quiz (maquette « Quiz bonne réponse ») :
- En-tête : bouton Quitter 44 px (icône croix fine), barre de progression 4 px en sauge sur `--sand`, bouton des sons
  du jeu (`muteBtn`, conservé à droite). La barre garde son calcul actuel (fiches de 0 à 30 %, quiz de 30 à 100 %).
  *Choix du rédacteur :* pas de compteur « i / n » (la maquette en montre un) : une erreur ajoute une question à
  rejouer, le total bougerait sous les yeux du joueur. La série `×N` devient une petite mention or mat
  (`--gold-ink`) à droite de la barre, seulement à partir de 2.
- Consigne : une ligne 13 px `--mut` centrée, « Leçon · consigne » (ex. « Ligne T · Comment se lit ce kana ? ») ;
  hors leçon, la consigne seule.
- Énoncé : carte blanche (~230 px de haut, rayon 24 ; plus basse pour le dessin) ; kana en Klee One ~128 px ;
  romaji (r2k, dessin) en grand. Bouton Écouter : avant la réponse, seulement là où il existe aujourd'hui (dessin :
  bouton rond 44 px en bas à droite de la carte ; écoute : gros haut-parleur au centre), car entendre le kana
  donnerait la réponse ailleurs. *Choix du rédacteur :* après la réponse, le bouton rond apparaît sur tous les types
  pour réentendre le kana (la maquette, qui le montre sur « quelle est la lecture ? », est un état après réponse).
- Choix : grille 2 × 2, boutons 60 px rayon 16. Après réponse : la bonne en sauge (fond sauge très clair, bord
  `#5E7360`, texte `--ok`, coche), la mauvaise choisie en `--bad`, les autres atténuées mais lisibles (texte `--mut`,
  pas d'opacité qui casserait le 4,5:1). Les raccourcis `kbd` 1–4 restent (masqués sur mobile comme aujourd'hui).
- Réponse (« panneau ») : fixé en bas de l'écran, pleine largeur, fond `--card`, coins hauts 24, ombre douce,
  `padding-bottom: max(…, env(safe-area-inset-bottom))`. Daru 48 px, titre (`A.msg`) en `--ok` ou `--bad`, note en
  13 px `--mut`, puis « Continuer » pleine largeur 52 px (plein rouge si juste, contour si faux). Le contenu du quiz
  réserve la hauteur du panneau pour ne jamais être masqué. Textes inchangés : titre `A.msg`, note seulement là où
  il y en a une aujourd'hui (la note « ち se lit chi, comme dans ちず » de la maquette n'est qu'un exemple de forme,
  pas un nouveau contenu). *Choix du rédacteur :* pour le dessin, panneau compact (pas de Daru, titre et note sur
  une ligne, « J'avais juste » en lien, Continuer) et zone de dessin réduite pendant la réponse, pour que le modèle
  animé superposé au tracé reste visible sans défiler à 390 × 844.
- Saisie (« écris la lecture ») et dessin : champ 52 px et zone de dessin harmonisés ; les outils du tracé
  (`padTools`, `hintBtn`) passent de `↶ ↻ ✎` à des icônes SVG trait fin avec libellé.
- Contrastes du panneau de quiz (reporté de l'étape 1) vérifiés en clair et en sombre.

Fiche de découverte : même en-tête que le quiz ; même carte d'énoncé (kana Klee One, romaji en `--ac-ink`, bouton
Écouter contour avec icône) ; astuces en liste sous la carte ; carte « Ordre des traits » avec icônes (Revoir,
M'entraîner à tracer) ; bulle de Daru ; points de progression ; Précédent (contour) et Suivant / Passer au quiz
(plein) en bas, 52 px ; lien « Je connais déjà ».

Klee One préchargée (reporté de l'étape 1) : `<link rel="preload">` de `fonts/KleeOne-400.woff2` dans `index.html`
(la page claude.ai suit si son build reprend les `preload`, sinon rien).

### PR 2 : Rafale et Pinceau (maquette d'abord)

Avant le code : planches 390 × 844 ajoutées au canevas des maquettes, en clair et en sombre, pour Rafale en jeu
(carte du kana, chrono, saisie, clavier AZERTY dessiné) et Pinceau en jeu (consigne, zone de dessin, outils, chrono),
et pour leurs écrans de résultats (`rushres`, `brushres`). Julien valide les planches ; le détail visuel retenu est
alors ajouté à ce document avant la PR.

Principes fixés dès maintenant : couleurs de la charte via les variables du thème (suppression des `--st-*`),
pile de cartes et zone de dessin sur `--card`, clavier en touches `--card` sur fond `--sand` (44 px minimum), touche
active ou action en vermillon seulement pour l'action principale, chrono en chiffres tabulaires. Le comportement
(clavier physique, touches dessinées, chrono qui démarre à la première lettre ou au premier trait) est inchangé.

Détail visuel retenu (maquettes validées par Julien le 23/11/2026, rangée « Étape 3 · PR 2 » du canevas) :
- En-tête des deux jeux : croix fine (Quitter), étiquette 13 px `--mut`, bouton des sons, Daru 32 px ; sans fond.
- Rafale : carte du kana `--card` (Klee One ~112 px) sur deux cartes `--sand` légèrement tournées ; ligne d'aide
  13 px `--mut` ; ligne chrono / saisie / compteur (chiffres tabulaires 20 px, saisie en carte 52 px à curseur
  vermillon, total en 13 px `--mut`) ; clavier dans un panneau `--sand` à coins hauts 24 et zone sûre en bas,
  touches `--card` 46 px rayon 10 à filet `--line`, touches de fonction (recommencer, passer, effacer une lettre, tout
  effacer) en icônes `--mut` sur `--bg`.
- Pinceau : consigne en carte (romaji 40 px, pastille « N traits », Écouter rond à droite) ; zone de dessin `--card`
  qui suit le thème (fin de la variante `.pad.dark`) ; outils Annuler / Effacer / Valider puis Indice et « Je ne
  sais pas » ; en bas chrono, score en carte (nombre de justes en `--ok`) et compteur.
- Résultats des deux jeux : écran plein cadre sans en-tête d'onglets, croix en haut à gauche (retour) ; légende ;
  grand chiffre Zen Old Mincho 64 px ; sous-titre ; pastille or mat « Nouveau record » seulement en cas de record ;
  trois chiffres dans une carte ; « À retravailler » en pastilles 64 × 72 ; bulle de Daru ; Rejouer (plein) et
  Retour (contour) empilés pleine largeur. En sombre, mêmes écrans avec la palette sombre.
- Les textes restent ceux du code (la ligne d'aide de la maquette n'est qu'un exemple).

### PR 3 : résultats, Réglages, reports et nettoyage

Résultats de leçon, test, révision : écran plein cadre sans barre d'onglets ; tampon `済`/`再` réduit (~96 px) en
vermillon pour un tampon obtenu, en `--mut` sinon ; titre en Zen Old Mincho ; trois chiffres (précision du premier
coup, meilleure série, XP gagnés) au format `.fig1` ; « À retravailler » en pastilles ; bulle de Daru ; actions
empilées pleine largeur (principale pleine, « Retour » contour).

Réglages : en-tête simple « ← Retour » + titre ; options regroupées en une liste à la manière d'iOS (une carte,
séparateurs) avec de vrais interrupteurs (44 px de zone tactile, « activé » en `--ok`) à la place des cases à cocher,
toujours des `<input type="checkbox">` pour l'accessibilité et pour `data-act="tog"` ; sections Compte, Sauvegarde,
Remise à zéro en cartes ; bouton d'effacement en style danger contour.

Reports de l'étape 2 :
- Onglet Tableau : titre `h1.tabt` « Tableau » comme les autres onglets (le `h2` interne disparaît).
- Position de défilement mémorisée par onglet (état `ui`, non sauvegardé) : au retour d'une leçon lancée depuis le
  bas du Parcours, on retrouve sa place. *Choix du rédacteur (usage iOS) :* la position est aussi retrouvée quand on
  revient sur un onglet depuis un autre ; toucher l'onglet déjà ouvert remonte en haut.
- Après suppression du compte, retour sur Accueil comme après « Effacer ma progression ».
- Barre d'onglets sur grand écran : contenu centré, largeur bornée (~560 px).
- Carte de révisions : le nombre devient une pastille (`.rev-n`, toujours présente) suivie de « kana à réviser », ou
  de « Révisions à jour » quand il vaut 0.
- Parcours : pastilles des leçons à la charte (faites en sauge, en cours cerclée de vermillon, verrouillées en
  pointillés) ; le rouge ne remplit plus les leçons terminées.

Nettoyage : suppression des règles CSS dont aucun sélecteur n'apparaît plus dans `src/` (vérifié classe par classe).

## Tests

- Comportement : les tests existants passent sans changer leurs assertions ; seuls gestes et sélecteurs s'adaptent.
- Contraste (`contraste.spec.js`) étendu, en clair et en sombre, au quiz (avant et après réponse, juste et faux), à la
  fiche, aux résultats, à Rafale, au Pinceau et aux Réglages.
- Zones tactiles ≥ 44 px et absence de débordement à 390 px sur ces mêmes écrans.
- PR 1 : le panneau de réponse ne masque ni le bouton Continuer ni les choix (bas de la grille au-dessus du haut du
  panneau) ; Continuer reste au-dessus de la zone sûre ; pour le dessin, la zone de dessin reste entièrement visible
  au-dessus du panneau à 390 × 844.
- PR 2 : Rafale et Pinceau suivent le thème (fond de l'écran égal à `--bg` en clair et en sombre).
- PR 3 : défilement retrouvé au retour d'une leçon et entre onglets, remise en haut en touchant l'onglet ouvert ;
  Accueil après suppression du compte ; « Révisions à jour ».

## Laissé au constructeur

- Tailles fines, espacements (multiples de 4), ombres, tant que les maquettes et les contrastes sont respectés.
- Dessin exact des icônes (trait 1,6, 24 × 24, style de la barre d'onglets).
- Organisation du CSS (regroupement par écran conseillé).
