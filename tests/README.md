# Tests

`npm ci && npx playwright install chromium`, puis `npm test`. Aucun outil n'est nécessaire pour faire tourner le jeu lui-même : `package.json` ne sert qu'aux tests.

- `unit/` : tests unitaires Node (`node --test`, sans dépendance) qui importent directement les modules purs de `src/` : état et chargement, fusion (dont 2 000 paires aléatoires), révisions, déblocage, romaji, reconnaissance du tracé sur un échantillon, synchronisation avec un faux service (envoi différé et regroupé, envoi pendant un envoi, fusion à la réception, erreurs), contraste des couleurs de la charte en clair et en sombre, couverture des polices (tout caractère du jeu présent dans `fonts/charset.txt`). Quelques dizaines de millisecondes : `npm run test:unit`.
- `server.mjs` : serveur statique de test (port 8123). Avec `?hook` dans l'URL, il ajoute à la volée un petit module qui expose l'état interne du jeu sous `window.__hanko`. Le code de production n'est pas modifié.
- `helpers/hook.mjs` : la liste de ce qui est exposé. C'est le seul point de contact entre les tests et le code : lors du découpage en modules, seul ce fichier change.
- `helpers/hanko.js` : ouverture du jeu dans un état contrôlé (horloge figée au 15/01/2026, `Math.random` à graine fixe, appels externes bloqués, sauvegarde injectée dans `localStorage`).
- `logique/` : tests de caractérisation de la logique critique (sauvegarde et anciens formats, fusion local/en ligne, révisions espacées, déblocage, romaji, reconnaissance du tracé).
- `parcours/` : parcours complets pilotés par l'interface comme un vrai joueur (première leçon, révisions, test d'unité, Rafale, Pinceau avec tracés au pointeur, réglages, synchronisation), mise en page sur un écran d'iPhone (pas de débordement, kana du jour sur une ligne, zones tactiles ≥ 44 px), polices servies par l'appli même hors ligne. Sur Chromium, et sur iPhone 13 / WebKit en CI (en local : `sudo npx playwright install-deps webkit` puis `WEBKIT=1 npm test`).
- `helpers/traces.js` : générateur de tracés de synthèse à graine propre, partagé par les tests navigateur et unitaires (mêmes entrées → même référence).
- `helpers/joueur.js` : gestes du joueur (répondre, taper, dessiner un kana à partir de son modèle). `helpers/faux-cloud.js` : faux Supabase et faux compte Claude en mémoire, aucun appel réseau.
- `fixtures/` : vraie sauvegarde anonymisée et anciens formats (voir `fixtures/README.md`).
- `golden/` : références enregistrées sur le code d'origine (lectures des 208 kana, des mots, résultats de la reconnaissance sur ~900 tracés de synthèse). `npm run golden` les régénère : à faire uniquement quand un changement de comportement est voulu, et à justifier dans la PR.

Les comportements surprenants sont figés tels quels et signalés dans les tests (`BUG CONNU`, `LIMITE CONNUE`, `test.fail`) : la refonte ne doit rien changer, les corrections viendront après.
