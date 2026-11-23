# Hanko premium · étape 2 (structure) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** remplacer l'accueil qui empile tout par une navigation d'appli iPhone : barre d'onglets en bas (Accueil, Parcours, Tableau, Mots, Entraîner), un écran par onglet, accueil réduit comme la maquette.

**Architecture :** l'onglet courant devient un état d'interface `ui.tab` (non sauvegardé) ; `ui.view === 'home'` reste « on est dans les onglets » et `homeV()` aiguille vers l'écran de l'onglet. Les boutons d'onglet gardent `data-act="page"` (contrainte de la spec : les `data-act` ne changent pas). Les écrans plein cadre (fiches, quiz, résultats, réglages, Rafale, Pinceau) n'affichent pas la barre et y reviennent sur l'onglet d'où l'on venait.

**Tech Stack :** modules ES natifs, CSS natif (`env(safe-area-inset-*)`), node:test, Playwright (Chromium, WebKit iPhone 13 en CI).

**Spec :** `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md` (étape 2). Maquette : artboard « Accueil clair » de https://claude.ai/artifact/KKPsUdEAE21pZ83ZM7b4ac.

Branche : `ui/structure` depuis `main`.

## Global Constraints

- Sauvegarde intouchée : clé `hanko-kana-v1`, `S`, `merge()`, `readSave()` (CLAUDE.md, règles 1 à 6). Le champ `S.page` reste dans `fresh()`, dans `State` et dans les sauvegardes ; il n'est simplement plus lu ni écrit (commentaire dans `state.js` et `hanko.d.ts` : « plus utilisé depuis l'étape 2 des onglets, gardé pour compatibilité »).
- « Le dernier onglet ouvert est un état d'interface (`ui`), non sauvegardé » : changer d'onglet n'appelle pas `save()`. L'appli s'ouvre toujours sur Accueil.
- Les `data-act` et `id` existants ne changent pas. Un test qui dépend d'un balisage changé : on adapte le geste ou le sélecteur, jamais l'assertion de comportement.
- Zones tactiles ≥ 44 px ; tout texte ≥ 4,5:1 en clair et en sombre (onglet actif en `--ac-ink`, pas `--ac` : 4,31:1 seulement) ; rien sous l'encoche ni sous la barre d'accueil.
- Le rouge seulement pour l'action principale et l'onglet actif.
- Daru reste (chantier 2) ; pas de transitions (étape 4) ; pas d'harmonisation des écrans plein cadre (étape 3).
- Version claude.ai : `npm run build:claude` et `tests/parcours/claude-artifact.spec.js` restent verts.
- Commits en français avec `Co-Authored-By` ; `npm run format` avant chaque commit ; `npm run lint` vert ; `npm test` vert en fin de tâche.

## Review Focus

1. Retour d'un écran plein cadre (fin de leçon, « Quitter » d'un quiz, fin ou abandon de Rafale/Pinceau, Réglages, effacement de la progression, import d'un code) : on retombe sur un onglet cohérent, jamais sur un écran vide ni sans barre (tâche 1).
2. iPhone avec barre d'accueil : le dernier élément d'un onglet long (Parcours, Mots) reste atteignable au défilement, pas caché derrière la barre d'onglets (tâche 1).
3. Une ancienne sauvegarde avec `page: 'brush'` ou `'words'` : l'appli s'ouvre sur Accueil, le champ est conservé tel quel à l'enregistrement suivant (tâche 1).
4. Les tracés KanjiVG se chargent encore à l'ouverture de l'onglet Entraîner › Pinceau, et hors ligne (tâche 1).
5. Sauvegarde neuve (aucun kana) et parcours terminé : l'accueil réduit reste juste (pas de leçon : message de fin, révision ou entraînement libre) (tâche 2).

---

### Task 1 : barre d'onglets et écrans par onglet

**Files :**
- Modify : `src/ui/app-state.js` (champs `tab`, `train`), `src/ui/events.js` (`case 'page'`), `src/ui/render.js` (chargement des tracés, remise en haut de page), `src/ui/views.js` (`homeV` aiguilleur, `tabbar()`, écrans `pathV`, `trainV`), `src/ui/icons.js` (5 icônes d'onglet), `styles.css`, `src/core/state.js` et `types/hanko.d.ts` (commentaire sur `page` seulement), `tests/helpers/hook.mjs` (`get tab`)
- Test : `tests/parcours/onglets.spec.js` (nouveau), `tests/parcours/_commun.js` (geste `ouvrir`), et adaptation des gestes dans `mise-en-page.spec.js`, `contraste.spec.js`, `jeux.spec.js`, `hors-ligne.spec.js`, `lecons.spec.js`, `synchro.spec.js`

**Interfaces :**
- Produces : `ui.tab: 'home' | 'path' | 'sheet' | 'words' | 'train'` (défaut `'home'`) ; `ui.train: 'rush' | 'brush'` (défaut `'rush'`). Action `data-act="page"` : `data-id` ∈ `home|path|sheet|words|train` change `ui.tab` ; `data-id` ∈ `rush|brush` met `ui.tab = 'train'` et `ui.train = data-id`. Dans les deux cas : `render()`, pas de `save()`. Fonction `tabbar(): string` dans `views.js` (`<nav class="tabbar" aria-label="Navigation">`, cinq `<button data-act="page" data-id="…">` icône + libellé, `aria-current="page"` sur l'actif). Geste de test `ouvrir(page, id)` dans `_commun.js` : pour `rush`/`brush`, clique d'abord `[data-act="page"][data-id="train"]`, puis le bouton `id` ; sinon clique l'onglet `id`.

- [ ] **Step 1 : tests de navigation (`tests/parcours/onglets.spec.js`)**

- `l’appli s’ouvre sur Accueil, même si la sauvegarde avait un autre onglet` : état `{ ...REAL, page: 'words' }` → `.tabbar [aria-current="page"]` a `data-id="home"`, `.hero h1` visible.
- `changer d’onglet n’enregistre rien` : `const avant = await hanko.stored()` ; cliquer path, sheet, words, train ; `expect(await hanko.stored()).toEqual(avant)` ; `hanko.run(H => H.tab)` vaut `'train'`.
- `chaque onglet a son écran` : path → `[data-act="lesson"][data-id="h-a"]` visible ; sheet → `.sheet` ; words → `.words` ; train → `[data-act="rstart"]` visible, puis `[data-act="page"][data-id="brush"]` → `[data-act="bstart"]` visible ; aucun autre onglet n'affiche le contenu d'un autre (`.sheet` absent sur words, etc.).
- `la barre d’onglets disparaît en leçon et revient sur l’onglet d’origine` : onglet path → leçon `h-ta` → `.tabbar` absente → `[data-act="quit"]` → onglet path actif. Même chose : train › rush → `rstart` → `.tabbar` absente → `rquit` → onglet train actif, `[data-act="rstart"]` visible. Réglages (`header [data-act="settings"]`) → `.tabbar` absente → `[data-act="home"]` → onglet d'origine.
- `effacer la progression ramène sur Accueil` : depuis words, réglages, `reset` deux fois → onglet home actif.
- `le bas de l’onglet le plus long reste accessible` (390 × 844) : onglet path, défiler jusqu'en bas ; le bas du dernier `.unit` est au-dessus du haut de `.tabbar` (`getBoundingClientRect`).

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/onglets.spec.js` → FAIL (`.tabbar` introuvable).

- [ ] **Step 3 : état et événement** — `ui.tab`, `ui.train` dans `app-state.js` (commentés comme les autres champs) ; `case 'page'` selon l'interface ci-dessus. `reset` remet `ui.tab = 'home'`. Les retours existants (`quit`, `home`, `rquit`, `bquit`, fin de leçon) ne touchent pas `ui.tab` : on revient donc sur l'onglet d'origine. Ne plus lire `S.page` nulle part (`render.js` : charger les tracés quand `ui.view === 'home' && ui.tab === 'train' && ui.train === 'brush'`).

- [ ] **Step 4 : écrans** — `homeV()` = `top()` + écran de l'onglet + `tabbar()`. `path` : titre « Parcours » + `UNITS.map(unitV)` ; `sheet` : `sheetV()` ; `words` : `wordsV()` ; `train` : titre « Entraîner », sélecteur à deux boutons `data-act="page" data-id="rush|brush"` (`aria-pressed`, style `.seg` existant) puis `rushSetupV()` ou `brushSetupV()` ; `home` : l'accueil actuel moins le sélecteur `.seg` et son contenu (l'accueil réduit vient en tâche 2). Remise en haut de page : dans `render()`, comparer `ui.view + ui.tab` (et `ui.train`) à `ui.lastView` au lieu de `ui.view` seul.

- [ ] **Step 5 : barre d'onglets (CSS, icônes)** — Icônes `TAB_HOME`, `TAB_PATH`, `TAB_SHEET`, `TAB_WORDS`, `TAB_TRAIN` dans `icons.js`, reprises de la maquette (SVG 24 × 24, trait 1,6, `aria-hidden="true"`). `.tabbar` : `position: fixed` en bas, grille de 5 colonnes, fond `--bg` à 94 % d'opacité + `backdrop-filter: blur(12px)`, filet `--line` en haut, `padding-bottom: max(8px, env(safe-area-inset-bottom))`, boutons `min-height: 48px`, libellé 11 px, couleur `--mut`, actif `--ac-ink` en graisse 500. Le contenu des onglets réserve la hauteur de la barre (`padding-bottom: calc(72px + env(safe-area-inset-bottom))` sur le conteneur des onglets). `index.html` a déjà `viewport-fit=cover`.

- [ ] **Step 6 : adapter les gestes des tests existants** — remplacer chaque `locator('[data-act="page"][data-id="X"]').click()` par `ouvrir(page, 'X')` ; `ONGLETS` de `mise-en-page.spec.js` et la boucle de `contraste.spec.js` couvrent `home, path, sheet, words, rush, brush` ; dans `hors-ligne.spec.js`, revenir sur Accueil (`ouvrir(page, 'home')`) avant `.hero [data-act="lesson"]` ; `lecons.spec.js` : le commentaire « la sauvegarde rouvre l'onglet Tableau » devient faux, le retirer. `synchro.spec.js` (compte Claude) : l'action qui déclenche l'enregistrement devient le choix Katakana du tableau (`ouvrir(page, 'sheet')` puis `[data-act="tab"][data-id="k"]`), et le poll vérifie `.tab === 'k'` : même comportement vérifié (une action enregistre au format attendu), seul le geste change ; le signaler dans la PR. Ajouter `get tab(){return ui.tab}` au hook.

- [ ] **Step 7 : vérifier** — `npm test` → tout vert, y compris `onglets.spec.js` ; `npm run lint` → vert.

- [ ] **Step 8 : commit** — `git commit -m "Structure : barre d'onglets en bas et un écran par onglet"`

### Task 2 : accueil réduit (maquette « Accueil clair »)

**Files :**
- Modify : `src/ui/views.js` (`top()`, accueil), `styles.css` (règles de l'accueil ; retirer celles de l'ancien accueil devenues mortes : `.hero-g`, `.today`, `.rev` en colonne, `.pill`, `.tstats` si plus utilisées), `fonts/` (`npm run fonts` pour 判 et 子)
- Test : `tests/parcours/mise-en-page.spec.js`, `tests/parcours/onglets.spec.js`

**Interfaces :**
- Consumes : `tabbar()`, `ui.tab` (tâche 1).
- Produces : balisage d'accueil qui garde les points d'ancrage des tests : `.hero` (carte de la leçon), `.hero h1`, `.big-k`, `.hero [data-act="lesson"]`, `.rev-n` (nombre de kana dus, toujours affiché, « 0 » compris), `.figs .fig1 b` dans l'ordre `n / 208`, maîtrisés, `mots / total`, XP, `.foot [data-cloud]`.

- [ ] **Step 1 : tests de l'accueil réduit** (dans `onglets.spec.js`)

- `l’accueil se limite à la leçon, aux révisions et à la progression` : sur REAL, `.hero`, `.rev-n`, `.figs` visibles ; aucun `.unit`, `.sheet`, `.words`, `[data-act="rstart"]` sur l'accueil.
- `sauvegarde neuve` : état `fresh()` → `.hero h1` = « Voyelles », `.rev-n` = « 0 », aucun bouton `review` ni `practice`.
- `parcours terminé` : toutes les leçons faites (comme le test « la leçon la plus longue ») et tous les tests à 100 → `.hero h1` = « Tous les kana sont vus ! », pas de bouton `lesson`, `[data-act="practice"]` présent.
- `mise-en-page.spec.js` : `zones tactiles d’au moins 44 px` est répété pour chaque onglet (même filtre, `.foot` exclu).

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/onglets.spec.js` → FAIL sur l'accueil (le premier test voit encore l'ancien bandeau à deux colonnes ou les chiffres en grille, selon l'état laissé par la tâche 1).

- [ ] **Step 3 : en-tête** — `top()` : marque « Hanko » en `--f-title` 26 px + « 判子 » 13 px `--mut` (le carré rouge か disparaît : le rouge reste un accent) ; à droite « N jours de suite » (13 px, `--mut`, « 1 jour de suite » au singulier, rien si 0) et le bouton Réglages (44 × 44). Les pastilles flamme et XP du jour disparaissent de l'en-tête ; `FLAME` et `COIN` restent exportés s'ils servent ailleurs, sinon retirés.

- [ ] **Step 4 : accueil** — dans l'ordre de la maquette : carte `.hero` blanche (`--card`, rayon `--r-l`, filet `--line`) avec en-tête « Leçon du jour » (12 px, capitales espacées, `--mut`) et nom de l'unité à droite, `h1` en `--f-title` 30 px, `bigK()` (grands kana en Klee One, inchangé), bouton plein « Commencer la leçon » ; carte révisions sur `--sand` : « <b class="rev-n">N</b> kana à réviser » + phrase (« Le bon moment pour ta mémoire. » ou `nextDue()`), bouton contour « Réviser » (ou « Entraînement libre » s'il n'y a rien à réviser et au moins un kana vu, comme aujourd'hui) ; bloc « Ta progression » : barre sauge (largeur `nl / TOTAL`) puis `.figs` en ligne de quatre `.fig1` (vus, maîtrisés, mots lisibles, XP) en 13 px ; bulle de Daru (`mascot('idle', tipHome(...))`, taille 56) ; `.foot` actuel en dessous. Aucune largeur fixe : tout tient à 320 px.

- [ ] **Step 5 : polices** — `npm run fonts` (判, 子 entrent dans `fonts/charset.txt`) ; `npm run test:unit` → `polices` vert.

- [ ] **Step 6 : vérifier** — `npm test` (dont `mise-en-page`, `contraste` clair et sombre, `sauvegardes`, `claude-artifact`) → vert ; `npm run lint` → vert ; `npm run build:claude` → sans erreur. Contrôle visuel à 390 × 844 en clair et en sombre (`python3 -m http.server 8000`) face à la maquette.

- [ ] **Step 7 : commit** — `git commit -m "Structure : accueil réduit à la leçon du jour, aux révisions et à la progression"`

### Fin de branche

- [ ] `CLAUDE.md` (Architecture, `app-state.js`) : mentionner `ui.tab` et `ui.train`, et que `S.page` n'est plus utilisé mais conservé. Commit `Documentation : navigation par onglets`.
- [ ] Relecture indépendante de toute la branche, corrections, `npm test` vert, PR « Interface premium · étape 2 : structure (onglets) » vers `main` ; signaler dans la description le geste changé dans `synchro.spec.js` et l'abandon de la reprise du dernier onglet. Fusion par Julien après essai sur iPhone (appli installée, clair et sombre, barre d'accueil).
