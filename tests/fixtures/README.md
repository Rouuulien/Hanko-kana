# Jeux de données de test

- `vraie-sauvegarde.json` : sauvegarde réelle d'un joueur (table `progress`, colonne `data`), lue en lecture seule.
  Anonymisation : l'objet ne contient ni identifiant ni e-mail ; tous les horodatages (`at`, `learned.*.due`) sont décalés
  d'une même durée pour que `at` tombe le 15/01/2026 à 9 h (heure de Paris), et `last`/`today` sont ramenés à `2026-01-15`.
  Les écarts entre échéances sont conservés : les révisions espacées se comportent comme chez le vrai joueur.
- `ancien-format-1.json` : la même progression dans le format d'avant le dessin (sans `draw`, `bsc`, `bn`, `bl`, sans records Pinceau).
- `ancien-format-2.json` : format du Pinceau sans niveaux (sans `bl`, record sous l'ancienne clé `brush-h-10`).

Ces formats correspondent aux trois versions successives de `fresh()` visibles dans l'historique git.
