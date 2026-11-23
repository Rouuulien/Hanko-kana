# Hanko premium · étape 4 (transitions) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** animer l'entrée des écrans, des exercices et du panneau de réponse (≈ 200 ms ; fondu seul si « Réduire les animations »), sans rendre l'affichage asynchrone.

**Architecture :** une fonction pure `transitionFor(prev, next)` (nouveau `src/ui/transition.js`) décide du type d'entrée à partir de deux instantanés de l'écran ; `render()` prend l'instantané, remplace le contenu comme aujourd'hui (immédiatement), puis pose la classe d'entrée sur le bon élément. Les animations sont en CSS (`@keyframes`), coupées en simple fondu par `prefers-reduced-motion`.

**Tech Stack :** modules ES natifs, CSS natif, node:test, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-23-ui-premium-etape4-transitions-design.md`, parent `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`.

Branche : `ui/transitions` depuis `main` ; premier commit = la spec et ce plan.

## Global Constraints

- `render()` reste synchrone : le nouveau contenu est dans le DOM au retour de `render()` (aucun `startViewTransition`, aucun `setTimeout` avant l'insertion).
- Durées : 200 ms, `ease-out` ; déplacement 12 px ; « Réduire les animations » : fondu de 150 ms sans déplacement.
- Aucune animation pour un réaffichage du même écran, même exercice, même état de réponse.
- Logique de jeu, chronos et délais (Pinceau 1,4 s) inchangés ; sauvegarde intouchée.
- Commits en français avec `Co-Authored-By` ; `npm run format`, `npm run lint`, `npm test` verts ; `npm run build:claude` sans erreur.

## Review Focus

1. Pendant l'entrée d'un écran, un élément `position: fixed` (barre d'onglets, `.rz` des jeux, panneau `.fb`) ne doit pas sauter ni rester décalé : un `transform` sur un ancêtre change son repère (tâche 1).
2. Changer d'onglet deux fois très vite : le second écran arrive normalement, rien ne reste transparent (tâche 1).
3. Rafale : frappe rapide au clavier, aucune animation d'écran à chaque lettre (les cartes gardent leur propre animation) (tâche 2).
4. Pinceau : l'enchaînement automatique après une bonne réponse (1,4 s) anime la carte suivante sans retarder le jeu (tâche 2).
5. Quiz « écris la lecture » : le focus sur le champ et, après réponse, sur Continuer reste posé malgré l'animation (tâche 2).

---

### Task 1 : écrans (onglets, entrée et sortie des écrans plein cadre)

**Files :** Create `src/ui/transition.js` · Modify `src/ui/render.js`, `styles.css` · Test `tests/unit/transition.test.js` (nouveau), `tests/parcours/transitions.spec.js` (nouveau)

**Interfaces :**
- Produces : `export function snapshot(ui): Shot` avec `Shot = { view: string, tab: string, train: string, step: string, ans: boolean }` (`step` : `c${ses.ci}` pour `cards`, `q${ses.i}` pour `quiz`, `b${bs.u}` pour `brush`, `''` sinon ; `ans` : `!!ses.ans` en `quiz`, `bs.state === 'done'` en `brush`, `false` sinon). `export function transitionFor(prev: Shot | null, next: Shot): 'none' | 'fade' | 'rise' | 'next' | 'panel'`. Classes CSS : `tr-fade`, `tr-rise` (sur `#app`), `tr-next` (conteneur de l'exercice), `tr-up` (panneau `.fb`).

- [ ] **Step 1 : tests unitaires (`tests/unit/transition.test.js`)** — `transitionFor` :
- premier affichage (`prev` nul) → `'none'` ;
- onglets, `tab` ou `train` changé → `'fade'` ; même onglet → `'none'` ;
- `home` → `cards`, `set`, `rush`, `brush` → `'rise'` ; `cards`, `quiz`, `res`, `set`, `rushres`, `brushres` → `home` → `'fade'` ;
- `cards` → `quiz` → `'next'` ; `quiz` → `res`, `rush` → `rushres`, `brush` → `brushres` → `'rise'` ;
- même vue, `step` changé → `'next'` ; même vue et `step`, `ans` passé de faux à vrai en `quiz` → `'panel'` ; tout le reste → `'none'`.

- [ ] **Step 2 : tests de parcours (`tests/parcours/transitions.spec.js`, 390 × 844, état REAL)** — classe lue juste après le geste :
- `changer d'onglet : fondu` : `ouvrir(page, 'path')` → `#app` a la classe `tr-fade` ;
- `ouvrir une leçon : l'écran monte` : `.hero [data-act="lesson"]` → `#app` a `tr-rise` ; `quit` → `tr-fade` ;
- `les éléments fixes ne bougent pas pendant l'entrée` : juste après `ouvrir(page, 'words')`, la barre `.tabbar` a son `getBoundingClientRect().bottom` égal à 844 (aucun `transform` sur `#app` pendant un fondu) ;
- `deux onglets très vite : rien ne reste transparent` : `ouvrir(page,'sheet')` puis `ouvrir(page,'words')` sans attendre ; après 400 ms, `getComputedStyle(app).opacity` vaut `'1'`.

- [ ] **Step 3 : lancer, constater l'échec** — `npm run test:unit` (module absent) et `npx playwright test tests/parcours/transitions.spec.js --project=parcours-chromium` → FAIL.

- [ ] **Step 4 : `src/ui/transition.js`** — `snapshot` et `transitionFor` selon l'interface (fonctions pures, sans DOM, importables par node:test).

- [ ] **Step 5 : `render()`** — au début, `const prev = ui.shot ?? null` ; après l'insertion (et après le montage de la zone de dessin), `const next = snapshot(ui)`, `const t = transitionFor(prev, next)`, `ui.shot = next` ; pour `fade` / `rise` : retirer `tr-fade` et `tr-rise` de `#app`, forcer un recalcul (`void app.offsetWidth`), poser la classe ; écouter `animationend` (une fois) pour la retirer. Ajouter `shot: null` à `app-state.js` (commenté : dernier écran animé, non sauvegardé).

- [ ] **Step 6 : CSS** — `@keyframes tr-fade { from { opacity: 0 } }`, `@keyframes tr-rise { from { opacity: 0; transform: translateY(12px) } }` ; `#app.tr-fade { animation: tr-fade 0.2s ease-out }`, `#app.tr-rise { animation: tr-rise 0.2s ease-out }`. Pour ne pas déplacer les éléments fixes, `tr-rise` ne s'applique qu'aux écrans plein cadre (pas de barre d'onglets) ; `.rz` et `.fb` restent dans l'écran qui monte, c'est voulu. Dans le bloc `prefers-reduced-motion: reduce` : `#app.tr-rise { animation-name: tr-fade; animation-duration: 0.15s }`, `#app.tr-fade { animation-duration: 0.15s }`.

- [ ] **Step 7 : vérifier** — mêmes commandes → PASS ; `npm test` → vert.

- [ ] **Step 8 : commit** — `git commit -m "Transitions : fondu entre onglets, montée des écrans plein cadre"`

### Task 2 : exercices, panneau de réponse, « Réduire les animations »

**Files :** Modify `src/ui/render.js`, `styles.css` · Test `tests/parcours/transitions.spec.js`

**Interfaces :**
- Consumes : `snapshot`, `transitionFor`, `ui.shot` (tâche 1).

- [ ] **Step 1 : tests (`transitions.spec.js`)**
- `fiche suivante : la carte glisse` : leçon ouverte, `.cnav [data-act]` dernier → `.qz` a la classe `tr-next`, `#app` n'a ni `tr-rise` ni `tr-fade`.
- `réponse : le panneau monte` : `ouvrirQuiz`, `forcer(hanko, 'k2r')`, `repondreSansContinuer(hanko)` → `.fb` a la classe `tr-up` ; `#nb` a le focus (`document.activeElement.id === 'nb'`).
- `question suivante : la carte glisse, le focus du champ reste` : `forcer(hanko, 'type')` → `.qz` a `tr-next` et `#ti` a le focus.
- `Pinceau : kana suivant` : `ouvrir(page,'brush')`, `bstart`, `bskip` puis `#bnb` → `.bstage` a `tr-next`.
- `Rafale : aucune animation d'écran pendant la frappe` : `rstart`, puis compter les `animationstart` dont la cible est `#app`, `.qz` ou `.bstage` pendant la frappe de trois lectures justes (`page.evaluate` pose l'écouteur avant) → 0.
- `Réduire les animations : fondu seul` : `page.emulateMedia({ reducedMotion: 'reduce' })` ; ouvrir une leçon → `getComputedStyle(app).animationName` = `tr-fade` et `animationDuration` = `0.15s` ; fiche suivante → `getComputedStyle(qz).animationName` = `tr-fade`.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/transitions.spec.js --project=parcours-chromium` → FAIL.

- [ ] **Step 3 : `render()`** — `next` : poser `tr-next` sur `.qz` (fiche, quiz) ou `.bstage` (Pinceau) ; `panel` : poser `tr-up` sur `.fb`. Nouveaux éléments à chaque rendu : la classe suffit, pas besoin de recalcul.

- [ ] **Step 4 : CSS** — `@keyframes tr-next { from { opacity: 0; transform: translateX(12px) } }`, `@keyframes tr-up { from { transform: translateY(100%) } }` ; `.tr-next { animation: tr-next 0.2s ease-out }`, `.fb.tr-up { animation: tr-up 0.2s ease-out }`. Réduire les animations : `.tr-next, .fb.tr-up { animation: tr-fade 0.15s ease-out }`.

- [ ] **Step 5 : vérifier** — `npx playwright test tests/parcours/transitions.spec.js --project=parcours-chromium` → PASS ; `npm test`, `npm run lint`, `npm run build:claude` → verts. Contrôle à l'œil en local (`python3 -m http.server 8000`) : onglets, leçon, quiz, Rafale, Pinceau, Réglages.

- [ ] **Step 6 : commit** — `git commit -m "Transitions : carte suivante qui glisse, panneau de réponse qui monte, fondu seul si Réduire les animations"`

### Fin de branche

- [ ] Relecture indépendante, corrections, `npm test` vert, PR « Interface premium · étape 4 : transitions » vers `main`. Fusion par Julien après essai sur iPhone (y compris avec Réglages iOS › Accessibilité › Mouvement › Réduire les animations).
