# Koï nage en fond : le bassin

Date : 24/11/2026. Statut : validée par Julien le 24/11.

## Intention

Une carpe koï, vue du dessus, nage lentement derrière les cartes de l'application, comme dans un bassin. Référence : maquette React de Julien (capture du 24/11) : carpe floue et pâle qui passe derrière l'en-tête et les cartes. Effet d'ambiance, jamais un élément à lire ni à toucher.

Pas de passage à React : l'effet est du CSS et du SVG, il s'intègre dans l'appli actuelle.

## Ce qui est fait

- **Dessin** : une Koï vue du dessus, nouveau SVG (la Koï actuelle de `src/ui/koi.js` est de profil). Mêmes codes que la mascotte : corps Washi, taches Vermillon, aplats sans dégradé, nageoires pectorales et queue en lobes. Groupes séparés pour le corps, la queue et les nageoires, pour les animer indépendamment. Vit dans `src/ui/koi.js`, à côté de la Koï de profil, pour que le futur dessin de l'illustrateur ne touche qu'à ce fichier.
- **Mouvement** :
  - le corps ondule (rotation légère, environ 1,5 s) ;
  - la queue bat avec un petit décalage ;
  - la carpe parcourt l'écran lentement, environ 30 s par boucle.

  Plutôt qu'une seule diagonale répétée, quelques boucles courbes (3 ou 4) qui s'enchaînent dans la fenêtre, pour qu'on ne devine pas le motif. La carpe s'oriente toujours dans le sens de la nage.
- **Profondeur** : carpe à environ 50 % d'opacité, légèrement floue (`filter: blur` sur la carpe elle-même, pas `backdrop-filter` sur l'interface), pour qu'elle paraisse sous l'eau.

## Où elle nage

- **Oui** : Accueil, Parcours, Tableau, Mots, menu Entraîner.
- **Non** :
  - en leçon, quiz, Rafale, Pinceau et Réglages, où il faut se concentrer et où une forme qui bouge gêne la lecture ;
  - la carpe sort doucement en fondu à l'entrée de ces écrans et revient au retour.

## Comment (principes, sans code)

- **Hors de la zone redessinée.** Le bassin se pose une seule fois dans `index.html`, à côté de `#app` et pas dedans : `render()` remplace le contenu de `#app` à chaque affichage, ce qui ferait repartir la nage de zéro. Il est fixé derrière, ne capte aucun toucher, et une classe sur `<body>` le masque ou l'affiche selon l'écran.
- **Thèmes.**
  - En sombre, c'est l'effet de la maquette.
  - En clair (Washi), une carpe Washi disparaîtrait : on garde ses taches Vermillon et un contour Sable, avec une opacité à régler sur iPhone.
- **Cartes.** Les cartes restent opaques, pour que la carpe passe *entre* elles et jamais sous un texte : le contraste reste garanti et les tests de contraste ne bougent pas. Variante à essayer seulement si l'effet manque : cartes très légèrement translucides.
- **Performance.** La carpe s'anime uniquement par `transform`, sans flou de l'interface au-dessus. L'animation se met en pause quand l'appli passe en arrière-plan.
- **Mouvement réduit.** Avec `prefers-reduced-motion`, pas de nage : la carpe est immobile dans un coin, ou absente.

## Points tranchés (24/11)

1. **Mascotte de l'Accueil retirée.** La Koï de profil, qui arrivait en nageant sur l'Accueil, est retirée de cet écran, avec son animation d'arrivée : le bassin la remplace. La Koï de profil reste partout ailleurs (leçons, résultats, Réglages…).
2. **Les deux thèmes.** En sombre, c'est l'effet de la maquette. En clair, on garde les taches Vermillon et un contour Sable, avec une opacité réglée sur iPhone.
3. **Toujours visible.** La carpe ne quitte jamais l'écran. Elle tourne dans le bassin en boucles lentes et courbes, à peu près à l'intérieur de la fenêtre. Elle peut frôler un bord, mais il en reste toujours une bonne partie visible.

## Tests prévus

- Le bassin est présent sur les onglets et absent en leçon et en jeu.
- L'Accueil n'affiche plus la Koï de profil.
- La carpe reste dans la fenêtre.
- Il ne capte aucun clic.
- La nage ne repart pas de zéro au changement d'onglet.
- Elle est arrêtée en mouvement réduit.
- Le contraste des textes est inchangé, en clair et en sombre.

## Constat à la réalisation (24/11)

- **Contraste.** Pour qu'un texte posé sur le fond tienne 4,5:1 même quand la carpe passe dessous, ses couleurs sont « pré-fondues » dans le fond (`--pond-body`, `--pond-fin`, `--pond-patch`, vérifiées par `tests/unit/contraste.test.js`). C'est la teinte la plus forte permise par `--mut` et `--ac-ink`. Résultat : Koï se voit en sombre, ombre rouge discrète. En clair, elle est presque invisible. Le contour Sable prévu en clair n'est pas possible sous cette règle.
- **Cartes opaques.** La carpe disparaît sous la leçon du jour et les révisions, et n'apparaît que dans les espaces libres (progression, marges, pied de page, et surtout les autres onglets).
- **À trancher par Julien.** Garder la règle stricte, ou accepter pour ce décor un contraste plus faible, comme dans la maquette, au prix de chiffres moins lisibles au passage de la carpe.

## Décision (24/11, après essai sur iPhone)

Julien veut la voir clairement, mais atténuée selon sa position, pour qu'elle ne gêne jamais. Koï prend donc une teinte franche, et un voile couleur de fond (`--pond-veil`, environ 90 %) couvre la colonne de contenu des onglets (`.wrap`, pied de page).
- Dans les marges et hors du contenu, on la voit franchement.
- Sous les textes, on devine ses couleurs, et les textes gardent 4,5:1 (test unitaire du contraste sur le voile).
- Sous les cartes opaques (leçon du jour, révisions, tableau), elle reste cachée.
