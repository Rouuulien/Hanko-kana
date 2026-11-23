# Hanko premium · étape 3, PR 3 (résultats, Réglages, reports, nettoyage) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** finir l'harmonisation : résultats de leçon en plein cadre, Réglages en liste à interrupteurs, reports des étapes 2 et 3 (parcours, révisions, défilement, Tableau, barre sur grand écran, finitions des PR 1 et 2), suppression du CSS mort.

**Architecture :** balisage dans `src/ui/views.js` (`resV`, `setV`, `todayV`, `sheetV`, `unitV`, `homeV`, `cardsV`, `quizV`), `src/ui/account.js`, `src/ui/render.js` (défilement), `src/ui/events.js` (onglet retouché), `src/sync/cloud.js` + `src/main.js` (retour Accueil après suppression du compte) ; styles dans `styles.css`. Les résultats de leçon réutilisent la mise en page `.gres` des jeux (PR 2).

**Tech Stack :** modules ES natifs, CSS natif, node:test, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-23-ui-premium-etape3-harmonisation-design.md` (section « PR 3 »), parent `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`.

Branche : `ui/resultats-reglages` depuis `main` ; premier commit = ce plan.

## Global Constraints

- Sauvegarde, règles, textes inchangés (sauf « Révisions à jour », fixé par la spec). `S.page` reste inutilisé.
- `data-act` et `id` inchangés. Sélecteurs des tests conservés : `h1` unique des résultats (« Leçon terminée », « Tampon obtenu ! »…), `[data-act="tog"][data-k]` restent des `<input type="checkbox">` (les tests font `check` / `uncheck`), `[data-act="reset"]`, `[data-act="delacc"]`, `.amsg`, `#exp`, `#impt`, `#impm`, `.set [data-act="home"]` (texte « ← Retour »), `.rev-n` (toujours présent, « 0 » compris), `.figs .fig1 b`, `.hero h1`, `.foot [data-cloud]`, `.mrow .mk`. Un sélecteur de conteneur qui change (ex. `.acts` → `.gacts`) s'adapte dans le test, jamais l'assertion.
- Thème suivi ; texte ≥ 4,5:1 ; zones tactiles ≥ 44 px ; zones sûres ; une seule action rouge par écran ; le rouge ne remplit plus les leçons terminées.
- Commits en français avec `Co-Authored-By` ; `npm run format`, `npm run lint`, `npm test` verts ; `npm run build:claude` sans erreur.

## Review Focus

1. Mode compte Claude (artifact) et mode hors ligne : la section Compte des Réglages (absente, ou message hors ligne) ne laisse pas de carte vide ni de titre orphelin (tâche 2).
2. Réglages : un interrupteur désactivé (« Exercices d'écoute » sans voix japonaise) se voit désactivé et reste lisible en clair et en sombre (tâche 2).
3. Défilement mémorisé : un onglet dont le contenu a raccourci (Mots après effacement de la progression) ne reste pas défilé dans le vide (tâche 3).
4. Résultats d'un test d'unité échoué (« Encore un effort », tampon `再`) : pas de pastille rouge pleine, « Retenter » est la seule action rouge (tâche 1).
5. Nettoyage du CSS : une classe posée dynamiquement (`hit`, `in`, `bad`, `dn`, `cur`, `on`, `ok`…) n'est pas supprimée par erreur (tâche 5).

---

### Task 1 : résultats de leçon, test et révision en plein cadre

**Files :** Modify `src/ui/views.js` (`resV`), `styles.css` (`.stamp`, retrait des règles `.res*` devenues inutiles) · Test `tests/parcours/resultats.spec.js` (nouveau), `tests/parcours/lecons.spec.js` (sélecteur `.acts` → `.gacts`), `tests/parcours/contraste.spec.js`

**Interfaces :**
- Consumes : classes `.gres`, `.gres-top`, `.gcap`, `.gsub`, `.gmiss`, `.gacts`, `.rfigs` de la PR 2.
- Produces : `resV()` rend `<div class="gres">` : croix `data-act="home"` (aria-label « Fermer »), tampon `.stamp` (~96 px, `on` / `off`), `h1` titre (seul `h1` de l'écran), `.gsub` sous-titre actuel, `.rfigs` à trois chiffres (précision du premier coup `pc %`, meilleure série `×best`, `+xp XP`), `.gmiss` « À retravailler » si besoin, `mascot(…, 56)`, `.gacts` (action principale pleine puis « Retour » contour).

- [ ] **Step 1 : tests (`resultats.spec.js`, 390 × 844)**
- `leçon terminée : plein cadre, trois chiffres, Retour` : première leçon d'une sauvegarde neuve via `finirQuiz` (comme `lecons.spec.js`) ; `h1` = « Leçon terminée » ; `.tabbar` et `header.top` absents ; `.gres .rfigs .fig1` au nombre de 3 ; `.gacts [data-act="lesson"]` (Leçon suivante) a la classe `ac` ; `.gacts [data-act="home"]` a la classe `gh`.
- `test d'unité échoué : tampon discret, Retenter seule action rouge` : unité `h1` débloquée comme dans `lecons.spec.js` (« test d'unité réussi »), `finirQuiz(hanko, { erreurs: 10 })` ; `h1` = « Encore un effort » ; `.stamp` a la classe `off` ; dans `.gres`, un seul élément de classe `btn ac`, et c'est `[data-act="test"]`.
- `contraste.spec.js` › `résultats de leçon lisibles (light|dark)` : `releve(page)` sur l'écran « Leçon terminée » ; aucun texte sous le seuil.
- `lecons.spec.js` : `.acts [data-act="home"]` devient `.gacts [data-act="home"]` (même assertion « Retour »).

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/resultats.spec.js --project=parcours-chromium` → FAIL (`header.top` présent).

- [ ] **Step 3 : `resV()`** — sans `top()`, structure de l'interface ci-dessus ; titres, sous-titre, `talk`, mots nouveaux, actions et leurs `data-act` inchangés. `.stamp` : 96 px, `on` en `--ac-ink`, `off` en `--mut`, pas d'animation nouvelle (l'existante reste coupée par « Réduire les animations »).

- [ ] **Step 4 : vérifier** — `npx playwright test tests/parcours/resultats.spec.js tests/parcours/lecons.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium` → PASS.

- [ ] **Step 5 : commit** — `git commit -m "Résultats de leçon en plein cadre, comme ceux des jeux"`

### Task 2 : Réglages en liste à interrupteurs, retour Accueil après suppression du compte

**Files :** Modify `src/ui/views.js` (`setV`), `src/ui/account.js`, `src/sync/cloud.js` (`ui.home`, `sbDelete`), `src/main.js` (`bindUI`), `styles.css` (`.set`, `.back`, `.tg`, nouvelles `.sgroup`, `.sw`) · Test `tests/parcours/reglages.spec.js`, `tests/parcours/synchro.spec.js`, `tests/parcours/contraste.spec.js`, `tests/parcours/mise-en-page.spec.js`

**Interfaces :**
- Produces : `bindUI({ render, view, go, resetTip, home })` : `home()` (optionnel, défaut sans effet dans `cloud.js`) remet l'onglet sur Accueil (`ui.tab = 'home'`) sans changer d'écran. `sbDelete()` l'appelle après la suppression réussie (le message `.amsg` reste affiché dans les Réglages ; « ← Retour » mène alors à Accueil).

- [ ] **Step 1 : tests**
- `reglages.spec.js` › `Réglages : en-tête simple, options en liste, vrais interrupteurs` : `header.top` absent ; `.set [data-act="home"]` = « ← Retour » ; les quatre `[data-act="tog"]` sont des `input[type=checkbox]` dans une même `.sgroup` ; chaque `label.tg` fait ≥ 44 px ; `getComputedStyle(input).appearance` vaut `none` (interrupteur dessiné).
- `reglages.spec.js` › `interrupteur désactivé lisible` (light et dark) : sans voix japonaise, `[data-k="ear"]` est `disabled` ; `releve` (fonction de `contraste.spec.js`, à déplacer dans `tests/parcours/_commun.js` pour la partager) ne relève rien sous le seuil sur l'écran Réglages.
- `synchro.spec.js` › `suppression du compte : …` : ajouter, après l'assertion `.amsg`, un clic sur `.set [data-act="home"]` puis `.tabbar [aria-current="page"]` a `data-id="home"`.
- `mise-en-page.spec.js` › `zones tactiles d'au moins 44 px dans les Réglages` : même filtre que pour les onglets (`.foot` et liens de texte exclus).

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/reglages.spec.js tests/parcours/synchro.spec.js --project=parcours-chromium` → FAIL.

- [ ] **Step 3 : balisage** — `setV()` : sans `top()` ; `<header class="sethead">` avec « ← Retour » puis `h1` « Réglages » ; les quatre options dans `<div class="sgroup">` (une carte, séparateurs) ; chaque `label.tg` : texte et `small` à gauche, `input` à droite ; sections Compte, Sauvegarde, Remise à zéro chacune dans une carte `.scard` (h2 au-dessus) ; `accountV()` continue de renvoyer `''` en mode compte Claude (aucune carte Compte) et enveloppe sinon son contenu dans sa propre `.scard` ; bouton d'effacement `btn danger` contour. Textes inchangés.

- [ ] **Step 4 : styles** — interrupteur : `input[type=checkbox]` en `appearance: none`, 51 × 31, rayon 16, fond `--line`, pastille blanche ; coché : fond `--ok` ; désactivé : `opacity` interdite, fond `--sand` et pastille `--bg`, texte `small` de l'option en `--mut` ; focus visible (`outline` `--ink`). `label.tg` en ligne, `min-height: 56px`, séparateur `--line` entre options. `.btn.danger` : contour `--bad`, texte `--bad`.

- [ ] **Step 5 : `home()`** — `cloud.js` : `const ui = { render() {}, view: () => 'home', go() {}, resetTip() {}, home() {} }` ; `sbDelete()` appelle `ui.home()` avant `ui.render()`. `main.js` : `home: () => { ui.tab = 'home'; }` (l'objet `ui` de `app-state.js`).

- [ ] **Step 6 : vérifier** — mêmes commandes plus `npm run test:unit` (`tests/unit/synchro.test.js` passe un objet sans `home` : le défaut doit suffire) → PASS.

- [ ] **Step 7 : commit** — `git commit -m "Réglages en liste à interrupteurs ; après suppression du compte, Retour mène à l'Accueil"`

### Task 3 : reports de l'étape 2 (Parcours, révisions, défilement, Tableau, barre)

**Files :** Modify `src/ui/views.js` (`todayV`, `homeV`, `sheetV`, `unitV`), `src/ui/render.js`, `src/ui/events.js` (`case 'page'`), `src/ui/app-state.js` (`scroll`), `styles.css` (`.stp`, `.sk`, `.rev`, `.tabbar`) · Test `tests/parcours/onglets.spec.js`, `tests/logique/sauvegardes.spec.js` (inchangé, doit rester vert)

**Interfaces :**
- Produces : `ui.scroll: Record<string, number>` (position par onglet, non sauvegardée).

- [ ] **Step 1 : tests (`onglets.spec.js`)**
- `Révisions à jour quand rien n'est dû` : état `fresh()` + un kana appris pas encore dû (`learned: { あ: { box: 2, due: T0 + 864e5 } }`) → `.rev` contient « Révisions à jour », `.rev-n` = « 0 » ; sur REAL 52 h plus tard (`now: T0 + 52 * HOUR`, valeurs de `sauvegardes.spec.js`) → `.rev` contient « kana à réviser ».
- `le défilement de chaque onglet est retrouvé` : onglet path, `window.scrollTo(0, 600)`, ouvrir sheet, revenir sur path → `scrollY` = 600 ; lancer la leçon `h-ta` depuis Parcours puis `quit` → `scrollY` = 600 ; toucher l'onglet Parcours déjà ouvert → `scrollY` = 0.
- `un onglet raccourci ne reste pas défilé dans le vide` : onglet words défilé en bas, Réglages, effacer la progression, ouvrir words → `scrollY + innerHeight ≤ scrollHeight`.
- `l'onglet Tableau a son titre` : `.tabt` = « Tableau », aucun `h2` « Tableau des kana ».
- `barre d'onglets centrée sur grand écran` : viewport 1440 × 900 ; écart entre le centre du premier et du dernier bouton de `.tabbar` ≤ 560.
- `leçons terminées sans pastille rouge pleine` : sur REAL, `.stp.done .sk` a un fond différent de `var(--ac)` (sonde comme dans `mise-en-page.spec.js`) ; `.stp.cur .sk` a une bordure `--ac`.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/onglets.spec.js --project=parcours-chromium` → FAIL.

- [ ] **Step 3 : code** — carte de révisions : `<span class="rev-n">N</span>` en pastille (rond 36 px, `--card`) suivi de « kana à réviser » si N > 0, sinon « Révisions à jour » ; sous-texte inchangé. `sheetV()` sans son `h2`, `homeV()` ajoute `<h1 class="tabt">Tableau</h1>`. Défilement : dans `render()`, avant de remplacer le contenu, si l'écran affiché était un onglet, `ui.scroll[ongletPrécédent] = scrollY` ; après rendu, si l'écran a changé, `scrollTo(0, view === 'home' ? ui.scroll[ui.tab] || 0 : 0)` (le navigateur borne la position si le contenu a raccourci). `case 'page'` : toucher l'onglet déjà ouvert (`id === ui.tab`, hors `rush` / `brush`) met `ui.scroll[id] = 0` puis remonte. `.tabbar` : `padding-inline: max(8px, calc((100% - 560px) / 2))`.

- [ ] **Step 4 : styles du parcours** — `.stp.done .sk` fond `color-mix(in srgb, var(--sage) 35%, var(--card))`, bord `--sage`, texte `--ok`, ombre `--line` ; `.sk` (ouverte) bord `--line`, texte `--ink` ; `.stp.cur .sk` bord 3 px `--ac`, fond `--card`, texte `--ac-ink` (pulsation conservée, coupée par « Réduire les animations ») ; verrouillée inchangée ; test d'unité inchangé (or mat).

- [ ] **Step 5 : vérifier** — `npx playwright test tests/parcours/onglets.spec.js tests/logique/sauvegardes.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium` → PASS.

- [ ] **Step 6 : commit** — `git commit -m "Parcours sans rouge plein, Révisions à jour, défilement retrouvé par onglet, Tableau titré"`

### Task 4 : finitions reportées des PR 1 et 2

**Files :** Modify `src/ui/views.js` (`cardsV`, `quizV`), `src/modes/rush.js`, `src/modes/brush.js`, `styles.css` · Test `tests/parcours/quiz.spec.js`, `tests/parcours/jeux-theme.spec.js`

- [ ] **Step 1 : tests**
- `quiz.spec.js` › `fiche : astuces sous la carte` : `.card .hint` absent, `.hints .hint` présent (leçon `h-ta`).
- `quiz.spec.js` › `dessin faux : « J'avais juste » sur sa propre ligne` : question `draw` répondue faux ; `[data-act="qself"]` n'est pas dans `.note` ; il est dans `.fb`.
- `quiz.spec.js` › `bonne réponse : bordure au jeton du thème` : en sombre, la bordure de `.opt.ok` vaut `rgb(155, 174, 154)` (sauge) ; en clair `rgb(94, 115, 96)`.
- `jeux-theme.spec.js` › `carte fausse : le kana passe en rouge` : après une faute, la couleur de `#cf .ck` = la couleur calculée de `--bad`.
- `jeux-theme.spec.js` › `aides du tracé lisibles en sombre` : Pinceau niveau Guidé en sombre, `.aid .nx` (premier numéro) : contraste ≥ 3:1 avec le fond de `#bp`.
- `jeux-theme.spec.js` › `score à zéro en gris` : au départ du Pinceau, `.bscore b` a la couleur de `--mut`.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/quiz.spec.js tests/parcours/jeux-theme.spec.js --project=parcours-chromium` → FAIL.

- [ ] **Step 3 : code et styles** — `cardsV` : astuces dans `<ul class="hints">` sous la carte (liste sans puces, 14 px `--mut`) ; `quizV` : le lien `qself` sort de la note, sur une ligne sous le message ; jeton `--ok-line: light-dark(#5e7360, #9bae9a)` dans `:root` pour `.opt.ok` ; `.cd.front.bad .ck { color: var(--bad) }` ; `.aid .nx` en `--ac-ink` sans opacité réduite en sombre, `.model.hintm` à 60 % au lieu de 45 % ; Daru 32 px dans l'en-tête des jeux (`rush.js`, `brush.js`) ; `.bscore b` en `--mut` quand le score vaut 0 (classe `z`).

- [ ] **Step 4 : vérifier** — mêmes commandes → PASS ; `npm run test:unit` (contraste des jetons) → PASS.

- [ ] **Step 5 : commit** — `git commit -m "Finitions : astuces sous la fiche, lien « J'avais juste » à part, jeton de bordure, carte fausse en rouge, aides lisibles en sombre"`

Laissé tel quel (décision du plan) : la carte d'énoncé du quiz garde 160 px de haut sous 600 px de large (la règle actuelle tient les tests de petit écran ; 230 px ferait défiler le quiz sur iPhone SE).

### Task 5 : nettoyage du CSS mort

**Files :** Modify `styles.css` · Test `tests/unit/css.test.js` (nouveau)

- [ ] **Step 1 : test (`tests/unit/css.test.js`)** — `aucune classe CSS orpheline` : extraire de `styles.css` tous les noms de classe des sélecteurs (`/\.([a-zA-Z][\w-]*)/g`, hors valeurs et `url()`) ; chacun doit apparaître comme mot dans `src/**/*.js`, `index.html` ou `confidentialite.html` (regex `\b<nom>\b`). Le message d'échec liste les classes orphelines.

- [ ] **Step 2 : lancer, constater l'échec** — `npm run test:unit` → FAIL avec la liste (attendu : restes `.res`, `.lead`, `.today`, etc.).

- [ ] **Step 3 : supprimer** chaque règle dont toutes les classes sont orphelines ; pour une règle groupée, retirer seulement le sélecteur orphelin. Une classe signalée mais réellement posée par le code (chaîne construite) : ajouter son nom dans une liste `DYNAMIQUES` commentée du test, pas la supprimer.

- [ ] **Step 4 : vérifier** — `npm test`, `npm run lint`, `npm run build:claude` → verts. Contrôle visuel 390 × 844 clair et sombre : Accueil, Parcours, Tableau, Mots, Entraîner, fiche, quiz, résultats (leçon, Rafale, Pinceau), Réglages.

- [ ] **Step 5 : commit** — `git commit -m "Nettoyage : règles CSS sans usage supprimées, test des classes orphelines"`

### Fin de branche

- [ ] Relecture indépendante, corrections, `npm test` vert, PR « Interface premium · étape 3, PR 3 : résultats, Réglages, finitions » vers `main`. Fusion par Julien après essai sur iPhone.
