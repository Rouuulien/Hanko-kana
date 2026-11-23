# Koï — mascotte Hanko (remplace Daru)

Source de vérité : `koi-demo.html` (SVG inline + CSS, page autonome). Ouvrir dans un navigateur pour voir les 7 états, le thème clair/sombre et l'aperçu 48 px.

## Cahier des charges (résumé)
- Carpe koï calme, bienveillante, légèrement espiègle. Doit évoluer en dragon (Tōryūmon) : mêmes couleurs, même regard.
- Esthétique japonaise contemporaine, sobre : aplats, pas de dégradé, pas de 3D, trait vectoriel propre.
- Lisible de 280 px (accueil) à 48 px (coin d'un quiz).
- Palette : Washi #F7F5EF, Sumi #282824, Vermillion #C64B3C, Sage #9BAE9A, Sand #E8DFD0, Or mat #B69A63. Fond sombre : #1E1E1B.
- À éviter : style mascotte d'appli de langues, yeux énormes, rouge envahissant (décision de Julien : taches en Vermillion, assumé).

## Décisions prises
- Taches du dos en Vermillion (pas en noir).
- Œil par défaut : trait de pinceau effilé (l'œil ouvert avec pupille faisait « bizarre »). Pas d'anneau Or sur l'œil pour l'instant.
- Nervures de queue : 3 par lobe, partent de la base et suivent les lobes.

## Implémentation
- Thème par variables CSS (`--ink`, `--body`, `--fin`, `--vermillion`…). En sombre, `--ink` passe à Washi.
- Groupes SVG nommés et animables : `.root`, `.tail`, `.dorsal`, `.pec`, `.farpec`, `.body`, `.face`.
- États via `data-state` sur le `<svg class="koi">` : `resting`, `swimming`, `greeting`, `happy`, `encouraging`, `sleeping`, `celebrating`.
  Exemple : `koi.dataset.state = 'happy'` (bonne réponse), `'encouraging'` (mauvaise réponse).
- `prefers-reduced-motion` respecté.

## Reste à faire
- Forme dragon (état final), non dessinée.
- Fiche personnage : face, profil, trois-quarts, versions clair/sombre.
- Vérifier la lisibilité de l'œil et des barbillons à 48 px.
- Intégrer dans le dépôt Hanko-kana à la place de Daru.
