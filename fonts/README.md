# Polices

Polices hébergées avec l'appli (pour qu'elle s'affiche correctement hors ligne), réduites aux caractères qu'elle
affiche : latin, kana, ponctuation et tout caractère présent dans `src/`, `index.html` et `confidentialite.html`
(liste dans `charset.txt`).

- **Noto Sans JP** (variable, graisses 400 à 700) : interface et japonais courant.
- **Zen Old Mincho** (400, 700) : titres et marque.
- **Klee One** (400, 600) : grands kana, en forme manuscrite.

Source : dépôt [google/fonts](https://github.com/google/fonts), licence SIL Open Font License 1.1 (`OFL.txt`).

Quand un caractère nouveau apparaît (nouveau mot, nouvelle astuce), `npm test` le signale : relancer
`npm run fonts`, qui régénère ces fichiers (sources téléchargées une fois dans `.font-src/`, non versionné).
