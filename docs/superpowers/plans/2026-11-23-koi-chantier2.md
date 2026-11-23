# Chantier 2 · Koï remplace Daru · plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer Daru par Koï (dessin d'attente de `koi/koi-demo.html`), avec une arrivée en nageant sur l'Accueil
et une koï lointaine qui traverse le fond de l'Accueil.

**Architecture :** `src/ui/koi.js` produit le SVG (pur, sans DOM, testable sous Node). Les états et la nage sont en
CSS dans `styles.css`. `transition.js` décide de l'arrivée (fonction pure), `render()` la déclenche. `src/ui/pond.js`
gère un calque fixe hors de `#app` pour la koï lointaine.

**Tech Stack :** modules ES natifs sans compilation, CSS, tests `node --test` et Playwright.

**Spec :** `docs/superpowers/specs/2026-11-23-koi-chantier2-design.md`. Les numéros « § » renvoient à ses sections.

## Contraintes globales

- Branche `koi/chantier2`, ouverte depuis `main`. Trois PR, dans l'ordre : Tâches 1-2 (PR 1), Tâche 3 (PR 2),
  Tâche 4 (PR 3). La Tâche 5 se refait avant chaque PR. Les PR sont fusionnées par Julien seulement.
- Aucun changement dans `S`, `fresh()`, `merge()` ni dans la clé `hanko-kana-v1`.
- Les tests restent verts à chaque commit (`npm test`). `npm run format` est lancé avant chaque commit.
- Les commits sont en français et se terminent par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- États de Koï : `resting`, `swimming`, `greeting`, `happy`, `encouraging`, `sleeping`, `celebrating`.
- Taille = largeur, hauteur = `Math.round(size * 0.75)`. Les en-têtes de Rafale et de Pinceau passent de 32 à 44.
- Variables de couleur (§ 4) : `--koi-line`, `--koi-body`, `--koi-fin`, `--koi-patch`, en `light-dark()`.
- Keyframes préfixées `koi-`. On ne reprend pas l'animation `across` de la démo.
- Tout s'arrête avec `prefers-reduced-motion: reduce`.
- `koi/` n'est pas publié (il ne va pas dans `PUBLISHED`).

## Points à surveiller en relecture

1. Un redessin de l'Accueil (par exemple une synchro qui arrive 300 ms après l'ouverture) ne doit **pas** relancer
   la nage. Le test de la Tâche 3 qui appelle `render()` deux fois couvre ce cas.
2. La koï lointaine ne doit provoquer **aucun défilement horizontal** ni capter les touchers. Test de la Tâche 4 :
   `scrollWidth <= innerWidth` pendant une traversée, et `pointer-events: none`.
3. L'appli qui passe en arrière-plan (`visibilitychange`) pendant une traversée : la minuterie s'arrête et reprend au
   retour. Test de la Tâche 4.
4. Thème sombre : le contour devient clair et reste visible. Test de la Tâche 1 : la couleur calculée de `.koi .line`
   diffère entre les deux thèmes.
5. Deux koï dans la même page (le calque et l'Accueil) : chacune garde ses taches, grâce à des `clipPath` aux
   identifiants uniques. Test unitaire de la Tâche 1.

---

### Tâche 1 : le dessin Koï à la place de Daru (PR 1)

**Fichiers :**
- Créer : `src/ui/koi.js`, `tests/unit/koi.test.js`
- Supprimer : `src/ui/daru.js`
- Modifier : `styles.css` (variables de `:root`, bloc « mascot » vers les lignes 339-356, bloc
  `prefers-reduced-motion` vers la ligne 2060), `src/ui/views.js` (lignes 17, 112, 177, 219, 268, 320),
  `src/modes/rush.js` (lignes 11, 49, 266, 292), `src/modes/brush.js` (lignes 11, 33, 41, 124, 199)
- Tests : `tests/parcours/quiz.spec.js:51`, `tests/unit/contraste.test.js:53-60`, nouveau
  `tests/parcours/koi.spec.js`

**Interfaces :**
- Produit : `koi(state: string, size: number): string`, le SVG `<svg class="koi" data-state="…" viewBox="0 0 1200 900"
  width height aria-hidden="true">` avec son propre `<clipPath id="koi-clip-N">`.
- Produit : `mascot(state: string, html: string, size?: number): string`, qui renvoie
  `<div class="mascot"><span class="koi-w">${koi(...)}</span><div class="bubble">${html}</div></div>` ; taille par
  défaut 76. L'enveloppant `.koi-w` sert à la Tâche 3.
- Produit : `KOI_STATES`, le tableau des 7 états.

- [ ] **Étape 1 : écrire `tests/unit/koi.test.js`**, qui doit échouer :
  - `koi('happy', 48)` contient `class="koi"`, `data-state="happy"`, `width="48"`, `height="36"`, `aria-hidden="true"` ;
  - deux appels successifs donnent deux `clipPath id` différents, chacun référencé par son propre `url(#…)` ;
  - un état inconnu lève une erreur (`assert.throws`) ;
  - `mascot('resting', 'Bonjour')` contient `class="koi-w"` puis `class="bubble">Bonjour<`.
- [ ] **Étape 2 :** `npm run test:unit`. Résultat attendu : échec, module introuvable.
- [ ] **Étape 3 : écrire `src/ui/koi.js`.** Les tracés viennent du `<template id="koi-tpl">` de `koi/koi-demo.html`,
  sans modification. Les attributs `fill="var(--ink)"` des « z » deviennent `var(--koi-line)`. Le `clipPath` est
  inclus dans le `<defs>` du SVG. Le module n'importe rien.
- [ ] **Étape 4 :** `npm run test:unit`. Résultat attendu : tout passe.
- [ ] **Étape 5 : CSS.**
  - Ajouter les 4 variables à `:root` (§ 4).
  - Reprendre les règles de la démo (lignes 38 à 121 de `koi-demo.html`) en appliquant ces conversions :
    - `[data-state=…] .x` devient `.koi[data-state=…] .x`, et `[data-state=…] .koi` devient `.koi[data-state=…]` ;
    - les keyframes sont renommées `koi-…` ;
    - la ligne `swimming … across` est supprimée ;
    - les couleurs passent par les variables `--koi-*`, `--sage` et `--gold` (déjà définies dans `:root`) ;
    - `.koi { width: 300px }` est supprimé : la taille vient des attributs.
  - Supprimer `.daru`, `.daru.bob`, `@keyframes bob` et `.daru.bob` du bloc `reduced-motion`. Y ajouter
    `.koi, .koi *` avec `animation: none`.
  - Ajouter `.koi-w { display: inline-block; flex: none; line-height: 0 }`.
- [ ] **Étape 6 : brancher les appels**, selon la correspondance du § 2 :
  - `idle` devient `resting`, `oops` devient `encouraging` ;
  - le troisième argument `allDone()` disparaît partout ;
  - Accueil : `mascot(allDone() ? 'celebrating' : 'resting', …)` ;
  - en-têtes de Rafale et de Pinceau : `koi(…, 44)`.
  - Supprimer `src/ui/daru.js` et retirer les imports `allDone` devenus inutiles.
- [ ] **Étape 7 : tests existants.**
  - `quiz.spec.js:51` : `.fb .daru` devient `.fb .koi`.
  - `contraste.test.js` : retirer le filtre `daru.js` et la mention « hors Daru… » du titre.
- [ ] **Étape 8 : écrire `tests/parcours/koi.spec.js`** (viewport 390 × 844, sauvegarde `REAL`) :
  - `'l’Accueil montre Koï au repos'` : `.today-g .mascot .koi` a `data-state="resting"` ;
  - `'Koï réagit aux réponses'` : avec `ouvrirQuiz`, `repondreSansContinuer(hanko, true)`, `.fb .koi` vaut
    `happy` ; à la question suivante, une réponse fausse donne `encouraging` (les premières questions d'une leçon sont de type
    `k2r`, à choix : pas de dessin) ;
  - `'le contour suit le thème'` : avec `emulateMedia({ colorScheme })`, `getComputedStyle(.koi .line).stroke` est
    différent entre `light` et `dark` ;
  - `'Koï lisible dans l’en-tête de Rafale'` : avec `ouvrir(page, 'rush')` puis lancement, `.rz-top .koi` a
    `width="44"`.
- [ ] **Étape 9 :** lancer `npm test`, qui doit être entièrement vert. Si `polices.test.js` échoue, lancer
  `npm run fonts` et relancer.
- [ ] **Étape 10 : commit.** `git commit -m "Koï remplace Daru : dessin d'attente, états, couleurs du thème"`.

### Tâche 2 : textes (PR 1)

**Fichiers :**
- Modifier : `src/ui/views.js:51-54` (`tipHome`), `src/modes/quiz.js:123`, `src/modes/rush.js:285`,
  `src/ui/app-state.js:14`, `styles.css:1`, `manifest.webmanifest:4`, `index.html:3`, `README.md:6`,
  `CLAUDE.md:3,50,51`
- Test : `tests/unit/koi.test.js` (ajout)

**Interfaces :** aucune.

- [ ] **Étape 1 : test qui doit échouer.** `'plus de Daru'` lit tous les `.js` de `src/` ainsi que `index.html` et
  `manifest.webmanifest`, et vérifie l'absence de `/Daru/`.
- [ ] **Étape 2 :** `npm run test:unit`. Résultat attendu : échec, avec la liste des fichiers en cause.
- [ ] **Étape 3 : remplacer les textes** par ceux du § 8, mot pour mot. Les textes des écrans gardent les
  apostrophes typographiques déjà en usage (`’`). Les autres mentions « Daru » deviennent « Koï ». Le README
  présente « Koï, la carpe koï ».
- [ ] **Étape 4 :** `npm test`. Résultat attendu : vert, y compris `polices`.
- [ ] **Étape 5 : commit** `"Textes : Koï parle à la place de Daru, bienvenue autour du Tōryūmon"`, puis la
  Tâche 5, puis la PR 1.

### Tâche 3 : arrivée en nageant sur l'Accueil (PR 2)

**Fichiers :**
- Modifier : `src/ui/transition.js`, `src/ui/render.js` (après `enter(...)`), `styles.css`
- Tests : `tests/unit/transition.test.js`, `tests/parcours/koi.spec.js`, `tests/helpers/hook.mjs` (ajouter
  `render` à `__hanko` : `import*as render from'./src/ui/render.js'` et `render:render.render`)

**Interfaces :**
- Consomme : `mascot()` et l'enveloppant `.koi-w` (Tâche 1), ainsi que `Shot`, `snapshot` et `transitionFor`, déjà
  en place.
- Produit : `arrivesHome(prev: Shot | null, next: Shot): boolean`, exporté par `transition.js`.

- [ ] **Étape 1 : tests unitaires qui doivent échouer.** `arrivesHome` est vrai pour : `null` vers Accueil, `path`
  vers Accueil, `train` vers Accueil, et chaque écran plein cadre (`quiz`, `res`, `set`, `rushres`, `brushres`) vers
  Accueil. Il est faux pour : Accueil vers Accueil, Accueil vers `path`, `null` vers `path`, `path` vers `words`.
- [ ] **Étape 2 :** `npm run test:unit`. Résultat attendu : échec.
- [ ] **Étape 3 : écrire `arrivesHome`** dans `transition.js`. « Accueil » signifie `view === 'home' && tab === 'home'`.
- [ ] **Étape 4 :** `npm run test:unit`. Résultat attendu : tout passe.
- [ ] **Étape 5 : déclenchement dans `render()`.** Si `arrivesHome(ui.shot, shot)` est vrai et que
  `matchMedia('(prefers-reduced-motion: reduce)')` ne l'est pas, alors :
  - sur `.today-g .koi-w`, retenir l'état de la koï, la passer en `swimming` et ajouter `koi-in` ;
  - à l'`animationend` dont la cible est `.koi-w` elle-même, rétablir l'état retenu et retirer `koi-in`.
  Le calcul doit se faire avant `ui.shot = shot`.
- [ ] **Étape 6 : CSS.** `@keyframes koi-in` part de `translateX(min(70vw, 320px))` jusqu'à `0`. La bulle n'est pas
  animée ici. Durée 1,4 s en `cubic-bezier(.2,.7,.3,1)`. Ajouter `overflow-x: clip` sur `.today-g` ou sur la bande,
  au choix, sans défilement horizontal. Ajouter `.koi-w.koi-in` au bloc `reduced-motion`.
- [ ] **Étape 7 : tests de parcours.**
  - `'arrivée sur l’Accueil : Koï entre en nageant puis se pose'` : après ouverture, `.koi-w` a la classe `koi-in`
    et la koï est en `swimming` ; après la fin des animations de `.koi-w`, la classe est partie et la koï est en
    `resting`.
  - `'un redessin ne relance pas la nage'` : attendre la fin, appeler `hanko.run(H => H.render())`, puis vérifier que `.koi-w`
    n'a pas `koi-in`.
  - `'retour d’un autre onglet : nouvelle arrivée'` : `ouvrir(page,'path')`, puis `ouvrir(page,'home')`, et `koi-in`
    est présent.
  - `'Réduire les animations : pas de nage'` : avec `emulateMedia({ reducedMotion: 'reduce' })` avant l'ouverture,
    jamais de `koi-in`.
  - `'pas de défilement horizontal pendant l’arrivée'` : `document.documentElement.scrollWidth <= innerWidth`.
- [ ] **Étape 8 :** `npm test`. Résultat attendu : vert, y compris `transitions.spec.js`.
- [ ] **Étape 9 : commit** `"Koï arrive en nageant sur l'Accueil"`, puis la Tâche 5, puis la PR 2.

### Tâche 4 : la koï lointaine (PR 3)

**Fichiers :**
- Créer : `src/ui/pond.js`
- Modifier : `src/ui/render.js` (fin de `render()`), `styles.css`
- Test : `tests/parcours/koi.spec.js`

**Interfaces :**
- Consomme : `koi(state, size)` (Tâche 1).
- Produit : `pond(on: boolean): void`, idempotent. L'appeler deux fois avec `true` n'arme pas deux minuteries.
  Le calque est `#pond`, avec `data-on="1"` quand il est actif ; une traversée en cours est `#pond .pond-k`.

- [ ] **Étape 1 : tests de parcours qui doivent échouer.**
  - `'koï lointaine : le calque est actif sur l’Accueil seulement'` : `#pond` a `data-on="1"` sur l'Accueil ;
    après `ouvrir(page,'path')`, il n'a plus cet attribut et `#pond .pond-k` a disparu ; il est de nouveau actif au
    retour sur l'Accueil.
  - `'une traversée passe sans gêner'` : attendre `#pond .pond-k` (délai jusqu'à 12 s, car la première traversée
    arrive après 6 à 10 s), puis vérifier que `getComputedStyle(#pond).pointerEvents` vaut `none`, que
    `scrollWidth <= innerWidth`, que la koï est en `swimming` et que `#pond` a `aria-hidden="true"`.
  - `'en arrière-plan, la koï lointaine s’arrête'` : forcer `document.visibilityState` à `hidden` (par
    `Object.defineProperty` puis l'envoi d'un `visibilitychange`), vérifier que `data-on` disparaît, puis faire
    l'inverse et vérifier qu'il revient.
  - `'Réduire les animations : pas de koï lointaine'` : `#pond` n'a jamais `data-on`.
- [ ] **Étape 2 :** `npx playwright test tests/parcours/koi.spec.js`. Résultat attendu : ces 4 tests échouent.
- [ ] **Étape 3 : écrire `src/ui/pond.js`.**
  - Le calque est créé à la première demande et ajouté à `document.body` avant `#app`.
  - Une traversée insère `<div class="pond-k" style="top:…">${koi('swimming', 120)}</div>`. Le `top` est tiré au
    hasard entre 15 % et 75 % de la hauteur de la fenêtre. L'élément est retiré à l'`animationend` puis on arme la
    suivante : 25 à 40 s plus tard, la première 6 à 10 s après l'activation.
  - Utiliser `Math.random` : les tests le fixent par `seed`.
  - Écouter `visibilitychange` une seule fois (au niveau du module).
- [ ] **Étape 4 : appel dans `render()`.** `pond(ui.view === 'home' && ui.tab === 'home')`.
- [ ] **Étape 5 : CSS.**
  - `#pond` : `position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden`.
  - `#app` : `position: relative; z-index: 1`. Vérifier que les éléments fixes (barre d'onglets, `.fb`) gardent
    leur empilement ; `transitions.spec.js` et `mise-en-page.spec.js` le diront.
  - `.pond-k` : `position: absolute; left: 100%; opacity: .28`, animation `koi-cross` de `translateX(0)` à
    `translateX(calc(-100vw - 140px))`, 12 s, `linear`.
  - Masquer les étincelles et l'onde dans `.pond-k`. Ajouter `.pond-k` au bloc `reduced-motion`
    (`display: none`).
- [ ] **Étape 6 :** `npm test`. Résultat attendu : vert.
- [ ] **Étape 7 : commit** `"Koï lointaine : traversée d'ambiance au fond de l'Accueil"`, puis la Tâche 5, puis la
  PR 3.

### Tâche 5 : vérifications avant chaque PR

- [ ] `npm run format`, puis `npm run lint`. Résultat attendu : aucune erreur.
- [ ] `npm test`. Résultat attendu : vert.
- [ ] `npm run build`, puis `npm run build:claude`. Les deux doivent réussir, et `koi/` doit être absent de `dist/`.
- [ ] Regarder sur `python3 -m http.server 8000` en 390 px, en clair et en sombre : lisibilité de la koï à 44 et
  48 px, arrivée, traversée. Si l'œil disparaît aux petites tailles, épaissir son trait par CSS (§ 9 de la spec).
- [ ] Pousser la branche et ouvrir la PR (`gh pr create`). Le corps résume la PR et liste ce qu'il faut vérifier sur
  iPhone. Il se termine par `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Ne pas fusionner :
  c'est Julien qui fusionne.
