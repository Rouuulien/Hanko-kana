# Hanko premium · charte « Sceau » : encadrés, Accueil et Parcours

Statut : validée par Julien le 23/11/2026 (sceaux faits en vermillon « pour voir », sceau « 済 » retenu). Document parent : `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`
(objectifs, anti-objectifs, palette, contraintes : tout s'applique ici). Maquette validée (version 3) :
https://claude.ai/artifact/GcQd1uVA2guuKBg5B5qiSy. Références de Julien : deux captures sombres (Accueil à double filet,
Parcours en sceaux), nov. 2026.

## Intention

Le chantier 1 a donné à Hanko une charte sobre, mais ses cartes arrondies (rayons 12 à 24 px) et son Parcours en
pastilles restent génériques. La charte « Sceau » reprend la géométrie d'un tampon japonais : angles nets, filets fins
aux coins coupés, et un Parcours lu comme une suite de sceaux posés le long d'un trait de pinceau.

## Décisions de Julien (23/11/2026)

- Thème clair Washi conservé à côté du sombre ; le Sumi n'est pas imposé.
- Le vert (Sauge) reste la couleur de la progression.
- Or des filets discret : à peine plus marqué qu'une ligne de séparation.
- Encadré « Leçon du jour » : double filet, le contour extérieur cranté aux coins, le filet intérieur aux coins coupés,
  les deux se croisant aux coins (maquette v3).
- Chemin du Parcours de la maquette retenu : pinceau et sceaux.
- Écran de jeu Rafale (pile, carte, saisie, clavier) : inchangé.
- Tableau : inchangé.

## Objectifs

- Deux cadres partagés, dans les deux thèmes :
  - **Cadre A** (double filet croisé) : seulement la carte « Leçon du jour » (`.hero`).
  - **Cadre B** (filet simple aux coins coupés) : carte des révisions (`.rev`), bulle de Koï (`.bubble`), en-tête
    d'unité du Parcours (`.uhead`).
- Bouton principal vermillon à petites encoches carrées aux coins ; bouton secondaire en contour aux coins coupés.
- « Ta progression » en grille stricte : 4 colonnes séparées par des filets verticaux, chiffres alignés (chiffres
  tabulaires), libellés alignés sous les chiffres, barre Sauge de 4 px à bouts droits.
- Parcours : trait de pinceau entre les leçons, une leçon = un sceau rond portant son kana.
- Rayons réduits partout ailleurs, sauf sur l'écran de jeu Rafale et dans le Tableau.

## Non-objectifs

- Règles du jeu, textes, Koï, format de sauvegarde : inchangés.
- Barre d'onglets, en-tête, Mots, Pinceau, quiz et Réglages : seulement l'effet des rayons réduits, sans nouveau cadre.
- Pas de grain washi : Julien ne l'a pas retenu. Il reste possible plus tard (bruit SVG à 3–4 % dans le cadre).

## Anti-objectifs

Ceux du document parent, plus : un filet or qui attire l'œil plus que le contenu ; un Parcours où le rouge domine
l'écran ; une carte dont les coins coupés rognent le texte ou un bouton ; un cadre qui garde les couleurs du clair en
sombre (ou l'inverse) après un changement de thème.

## Contraintes

- Celles du document parent : pas de build, `data-act` et `id` inchangés, tests de comportement intouchés, version
  claude.ai construite sans régression, contraste 4,5:1 sur tout texte, zones tactiles d'au moins 44 px, zones sûres.
- Sélecteurs utilisés par les tests, à garder : `.hero`, `.hero h1`, `.hero [data-act="lesson"]`, `.rev-n`,
  `.today-g .bubble`, `.rset .bubble`, `.stp` et ses états. Le test « le bandeau d'accueil n'est plus rouge » lit le
  fond de `.hero` : il doit rester différent du vermillon.
- Aucun JavaScript pour dessiner les cadres : ils doivent suivre le thème sans attendre un script, hors ligne.

## Conception technique

### Cadres A et B

Chaque cadre est une image SVG en `data:` posée en `border-image` avec `fill`. Le SVG contient le fond de la carte
(`--card`) et le ou les filets. La découpe en 9 parts étire les bords et garde les coins intacts, quelle que soit la
taille de la carte.

- Cadre A : SVG 48 × 48, bordure de 20 px. Contour extérieur cranté de 7 px ; filet intérieur décalé de 3,5 px avec des
  coins coupés de 7 px, dont la diagonale coupe l'encoche du contour extérieur (rendu de la maquette v3).
- Cadre B : SVG 40 × 40, bordure de 14 px, filet unique aux coins coupés de 10 px.
- Couleurs : `light-dark()` n'accepte pas d'image. Chaque cadre a donc deux variables `url(...)`, une par thème, posées
  comme le reste de la charte : sur `:root` pour le clair, puis redéfinies dans
  `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }` et dans `:root[data-theme='dark']`. Le
  changement de thème dans Réglages s'applique donc sans script.
- Nouvelles couleurs : `--frame` (filet), clair `#d6caac`, sombre `#574f3e`. Elles ne portent pas de texte : pas de
  contrainte de contraste, mais le filet doit rester visible sur `--bg` (vérifié à l'œil sur iPhone).
- Le fond en `background-color` de `.hero` reste `--card`, limité à la zone intérieure (`background-clip: padding-box`)
  pour ne pas déborder dans les crans des coins.

### Boutons

- `.btn.ac` : encoches carrées de 4 px aux coins (`clip-path` polygone), sans arrondi.
- `.btn.gh` : coins coupés de 7 px. Le contour est dessiné par un fond couleur encre découpé et un intérieur découpé
  1 px plus loin, comme dans la maquette, car `clip-path` couperait une `border`.
- Hauteur minimale inchangée (52 px, ou 44 px dans `.rev`).

### Accueil

- `.hero` : cadre A, le reste inchangé (en-tête, titre, kana, bouton).
- `.rev` : cadre B sur `--card` au lieu de la surface Sable. Le chiffre `.rev-n` devient un carré de 40 px à filet
  vermillon, chiffre en Zen Old Mincho couleur `--ac-ink`.
- `.progress` : titre en petites capitales espacées, barre 4 px à bouts droits, grille `.figs` à 4 colonnes égales
  séparées par des filets `--line` verticaux, filet horizontal au-dessus. Chiffres en 19 px tabulaires, libellés 11,5 px
  `--mut`.
- `.bubble` : cadre B sans ombre, sur Accueil comme dans la mise en place de Rafale.

### Parcours

Une seule unité affiche au plus 10 leçons et son test : le chemin est calculé en même temps que le HTML, sans mesure
du DOM.

- Chaque `.stp` a une hauteur fixe (sceau + libellé), si bien que la position verticale de chaque leçon est connue :
  `y = i × pas`. La position horizontale reste le décalage actuel `XS`.
- `unitV()` ajoute derrière les leçons un SVG en position absolue, centré, de 320 px de large, avec deux tracés :
  - **Fait** : de la première leçon jusqu'à la leçon en cours, trait de 10 px à l'encre (`--ink` à 85 %), doublé de
    deux filets pointillés fins décalés pour l'effet de pinceau.
  - **À venir** : de la leçon en cours jusqu'au test, pointillé rond de 3 px en `--line`.
  - Courbes de Bézier verticales entre deux leçons voisines (même formule que la maquette).
- Sceaux (`.sk`), 68 px, avec un second cercle intérieur fin :
  - **Faite** (`.done`) : sceau plein vermillon, kana en `--on-ac`, légèrement tourné (−5°), comme un tampon posé.
  - **En cours** (`.cur`) : fond `--card`, cercle vermillon de 2 px, anneau extérieur `--frame`. Plus d'animation
    `pulse` (sobriété). L'étiquette « Commencer » reste, aux angles nets.
  - **Ouverte** (`.open`, débloquée mais pas la suivante) : fond `--card`, cercle encre de 1,5 px.
  - **Verrouillée** (`.lock`) : cercle pointillé `--mut`, kana `--mut`.
  - **Test** (`.test`, 試) : sceau carré, comme un hanko de nom ; filet or mat, plein or mat une fois réussi (≥ 80 %).
- `.uhead` : cadre B, barre Sauge 4 px à bouts droits. Unité réussie (`.full`) : la teinte rouge actuelle disparaît, un
  petit sceau carré or mat « 済 » s'ajoute à droite du compteur (caractère nouveau : `npm run fonts`).
- Le rouge : sur une unité terminée, jusqu'à 10 sceaux vermillon. Ils sont petits, sur fond clair, et le reste de
  l'écran est neutre ; à vérifier sur iPhone. Si c'est trop, repli : sceau fait en encre Sumi, le vermillon réservé à
  la leçon en cours.

### Rayons

- `--r-s`, `--r-m`, `--r-l`, `--r-xl` passent à 2, 3, 4 et 4 px ; les rayons écrits en dur (12, 16, 20, 24 px) suivent.
- Restent ronds : sceaux, pastilles et avatars en `50 %`, curseurs et interrupteurs en `999px`.
- Écran de jeu Rafale et Tableau : leurs valeurs actuelles sont figées localement, pour qu'ils ne changent pas.

## Découpage (une PR chacune, essayée sur iPhone avant la suivante)

1. **Cadres, boutons, Accueil, rayons** : variables des cadres, `.btn`, `.hero`, `.rev`, `.progress`, `.bubble`,
   rayons globaux avec Rafale et Tableau figés.
2. **Parcours en sceaux** : `.uhead`, sceaux, chemin au pinceau dans `unitV()`.

## Tests

- Existants : tous verts sans modification, références `tests/golden/` inchangées (aucun changement de données).
- Nouveaux (Playwright, clair et sombre) :
  - les cadres de `.hero`, `.rev` et `.bubble` changent d'image entre les thèmes clair et sombre, y compris par le
    réglage forcé `data-theme` ;
  - Parcours : un SVG de chemin par unité, et son tracé « fait » s'arrête à la leçon en cours ;
  - écran de jeu Rafale et Tableau : rayons identiques à avant (non-régression de « laisse comme c'est ») ;
  - zones tactiles ≥ 44 px et contraste 4,5:1 (tests existants) couvrent les nouveaux boutons et sceaux.

## Points tranchés

- Sceaux faits en vermillon : gardés pour essai sur iPhone (repli en Sumi décrit plus haut si c'est trop).
- Sceau carré « 済 » sur une unité réussie : retenu.
- PR 1 : la carte `.hero` et les cadres B gardent leur `border` de 1 px (transparente) et posent l'image avec une
  largeur propre (`border-image: … / 20px`) qui déborde sur le padding : aucune dimension ne change. Leur fond passe
  entièrement dans le SVG (`background: none`), sinon il déborderait dans les crans des coins.
- 24/11/2026, après essai sur iPhone : Julien préfère le Parcours d'avant. Toute la PR 2 (#30) est annulée, et l'en-tête
  d'unité et l'étiquette « Commencer » retrouvent leurs arrondis d'origine (20 et 8 px). La PR 1 (Accueil) reste.
