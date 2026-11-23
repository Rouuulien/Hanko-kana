# Hanko premium · étape 3, PR 2 (Rafale et Pinceau) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** Rafale et Pinceau quittent la scène sombre permanente et suivent le thème, avec la mise en page des maquettes validées (jeu et résultats).

**Architecture :** styles de jeu réécrits sur les variables du thème (`--bg`, `--card`, `--sand`, `--ink`, `--mut`, `--line`, `--ok`, `--bad`, `--ac`, `--ac-ink`, `--gold-ink`) ; les variables `--st-*` et la variante `.pad.dark` disparaissent. Balisage dans `src/modes/rush.js` (`rushV`, `rushResV`, `KB`) et `src/modes/brush.js` (`brushV`, `brushResV`) ; icônes dans `src/ui/icons.js`. Logique de jeu inchangée.

**Tech Stack :** modules ES natifs, CSS natif, Playwright, node:test.

**Spec :** `docs/superpowers/specs/2026-11-23-ui-premium-etape3-harmonisation-design.md` (section « PR 2 » et son « Détail visuel retenu »). Maquettes : rangée « Étape 3 · PR 2 » de https://claude.ai/artifact/KKPsUdEAE21pZ83ZM7b4ac (Rafale-clair, Rafale-sombre, Pinceau-clair, Pinceau-sombre, Rafale-resultats, Pinceau-resultats).

Branche : `ui/rafale-pinceau` depuis `main` ; premier commit = le complément de spec et ce plan.

## Global Constraints

- Logique, chrono, clavier physique, textes de Daru et des aides, sauvegarde (`S.best`) inchangés.
- `data-act` et `id` inchangés ; sélecteurs des tests conservés : `#rh`, `#cf` (classe `bad`), `#b1`, `#b2`, `#rt`, `#ty`, `#rc`, `#bt`, `#bp`, `#bnb`, `.bfb` (`ok` / `bad`), `.big-n`, `.rfigs .fig1 b` (ordre inchangé), `.mrow .mk`, `.rset .bubble`, `.rbest`, `[data-act="rk"][data-k]`.
- Thème suivi (clair et sombre) ; texte ≥ 4,5:1 ; touches et boutons ≥ 44 px ; zones sûres (clavier au-dessus de la barre d'accueil).
- Le rouge seulement pour Valider, Rejouer, le curseur de saisie, le numéro de trait et l'état « faux ».
- Résultats de leçon (`resV`, classes `.res`, `.stamp`, `.acts`) hors périmètre : PR 3. Les résultats des jeux prennent une classe à eux (`gres`) pour ne pas les toucher.
- Commits en français avec `Co-Authored-By` ; `npm run format`, `npm run lint`, `npm test` verts ; `npm run build:claude` sans erreur.

## Review Focus

1. Clavier physique en Rafale (ordinateur) : la frappe reste prise, les touches dessinées réagissent (classe `hit`) avec un retour visible en clair comme en sombre (tâche 1).
2. Carte « faux » en Rafale (`#cf.bad`) : l'état d'erreur reste visible et lisible dans les deux thèmes (tâche 1).
3. Pinceau en sombre : le tracé du joueur, le modèle animé de correction (juste et faux) et le numéro du premier trait restent visibles sur une zone de dessin sombre (tâche 2).
4. iPhone SE (375 × 667) en Rafale : le clavier entier et la ligne chrono / saisie tiennent sans défiler (tâche 1).
5. Mode « mots » de Rafale (cartes plus longues, `.ck` par kana) : tient dans la carte à 375 px (tâche 1).

---

### Task 1 : Rafale (jeu et résultats)

**Files :**
- Modify : `src/modes/rush.js` (`KB`, `rushV`, `rushResV`), `src/ui/icons.js` (`SKIP`, `BACKSPACE`, `CLEARALL` ; `CLOSE`, `REPLAY` existent), `styles.css` (`.rz`, `.rz-top`, `.rz-tag`, `.stage`, `.deck`, `.cd*`, `.ck*`, `.hintline`, `.rbar`, `.typed`, `.kb*`, nouvelles règles `.gres*`)
- Test : `tests/parcours/jeux-theme.spec.js` (nouveau), `tests/parcours/contraste.spec.js`

**Interfaces :**
- Produces : icônes `SKIP`, `BACKSPACE`, `CLEARALL` (24 × 24, trait 1,6, `aria-hidden="true"`). Balisage des résultats de jeu : `<div class="gres">` contenant `<button class="x" data-act="home" aria-label="Fermer">${CLOSE}</button>`, `.gcap` (légende), `.big-n`, `.gsub`, `.grec` (« Nouveau record », seulement si record), `.rfigs` (trois `.fig1` dans une carte), `.mrow` (« À retravailler »), `mascot(…)`, `.gacts` (Rejouer `btn ac`, Retour `btn gh`, pleine largeur). Ces classes `gres`, `gcap`, `gsub`, `grec`, `gacts` servent aussi au Pinceau (tâche 2).

- [ ] **Step 1 : tests (`tests/parcours/jeux-theme.spec.js`, 390 × 844, état REAL, `ouvrir(page, 'rush')` puis `[data-act="rstart"]`)**
- `Rafale suit le thème (light|dark)` : `getComputedStyle(document.querySelector('.rz')).backgroundColor` vaut `rgb(247, 245, 239)` en clair, `rgb(27, 26, 23)` en sombre ; idem pour la carte `#cf` : `rgb(255, 255, 255)` / `rgb(36, 35, 31)`.
- `clavier de Rafale : icônes et zones tactiles` : les quatre touches `.kb .fn` contiennent un `svg` et aucun texte `↻ → ← «` ; toutes les touches `.kb button` font ≥ 44 px de haut ; à 375 × 667, le bas de `.kb` ≤ 667 et le haut de `.rbar` ≥ 0 sans défiler.
- `Rafale en mode mots tient dans la carte à 375 px` : état `{ ...REAL, rct: 'words' }`, `ouvrir(page, 'rush')`, `rstart` ; `#cf` : `scrollWidth ≤ clientWidth`.
- `résultats de Rafale : plein cadre, record signalé` : finir le paquet comme le test « Rafale, paquet complet » de `jeux.spec.js` (même boucle de frappe) ; `.tabbar` et `header.top` absents ; `.grec` visible (premier score = record) ; `.gres [data-act="home"]` ramène sur l'onglet Entraîner (`.tabbar [aria-current="page"]` a `data-id="train"`).
- `contraste.spec.js` › `jeux lisibles (light|dark)` : `releve(page)` sur Rafale en jeu, après une faute (`page.keyboard.type('x')`), puis sur ses résultats (finir le paquet complet de 15 kana de REAL, même boucle de frappe que « Rafale, paquet complet ») ; aucun texte sous le seuil.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/jeux-theme.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium` → FAIL (fond `.rz` encore `rgb(27, 26, 23)` en clair).

- [ ] **Step 3 : balisage** — `KB` : les quatre entrées de fonction gardent `[k, glyphe, libellé]` mais le glyphe devient l'icône (`REPLAY`, `SKIP`, `BACKSPACE`, `CLEARALL`) ; `rushV` : croix `CLOSE` à la place de `×`. `rushResV` : sans `top()`, balisage `.gres` de l'interface ci-dessus ; textes et chiffres actuels inchangés (légende = l'actuel premier `p.lead`, sous-titre = le second).

- [ ] **Step 4 : styles** — selon « Détail visuel retenu » de la spec : `.rz` fond `--bg`, texte `--ink` ; `.rz-top` sans fond, `.x` sans filet ; cartes `.cd.b1`, `.cd.b2` `--sand` tournées (−4°, 3°), `.cd.front` `--card` filet `--line` ombre douce, kana `--f-kana` ~112 px ; `.cd.front.bad` bord `--bad` et texte `--bad` ; `.typed` carte 52 px filet `--line`, curseur `--ac` ; chiffres de `.rbar` 20 px tabulaires, total en `--mut` 13 px ; `.kb` panneau `--sand`, coins hauts 24, `padding-bottom: max(12px, env(safe-area-inset-bottom))`, touches `--card` 46 px rayon 10 filet `--line`, `.fn` sur `--bg` couleur `--mut`, `.hit` / `:active` fond `--line`. `.gres` : colonne centrée `max-width: 480px`, `.big-n` `--f-title` 64 px, `.grec` 12 px capitales `--gold-ink` bordé, `.rfigs` carte `--card` en 3 colonnes (b 20 px tabulaires, span 12 px `--mut`), `.gacts` boutons 52 px pleine largeur empilés, `padding-bottom` avec zone sûre. Supprimer les règles `.rz*` qui lisaient `--st-*`.

- [ ] **Step 5 : vérifier** — mêmes commandes → PASS ; `npm test` vert.

- [ ] **Step 6 : commit** — `git commit -m "Rafale suit le thème : cartes, clavier et résultats à la charte"`

### Task 2 : Pinceau (jeu et résultats), fin de la scène sombre

**Files :**
- Modify : `src/modes/brush.js` (`brushV`, `brushResV`), `styles.css` (`.bz`, `.bstage`, `.bprompt` du Pinceau, `.bro`, `.bcount`, `.bfb`, `.bscore`, suppression de `.pad.dark*` et des variables `--st-*` de `:root`)
- Test : `tests/parcours/jeux-theme.spec.js`, `tests/parcours/contraste.spec.js`, `tests/unit/contraste.test.js`

**Interfaces :**
- Consumes : classes `.gres`, `.gcap`, `.gsub`, `.grec`, `.gacts` et le bouton de fermeture de la tâche 1.

- [ ] **Step 1 : tests**
- `jeux-theme.spec.js` › `Pinceau suit le thème (light|dark)` : `ouvrir(page, 'brush')`, `bstart` ; fond de `.rz` comme pour Rafale ; fond de `#bp` = `rgb(255, 255, 255)` / `rgb(36, 35, 31)` ; `#bp` n'a pas la classe `dark`.
- `jeux-theme.spec.js` › `Pinceau en sombre : tracé et correction visibles` (dark) : dessiner faux (`dessiner(hanko, '#bp', c, { reverse: true })` puis `bcheck`, comme dans `jeux.spec.js`) ; la couleur de trait du modèle de correction (`#bp .model path`, `stroke` calculé) a un contraste ≥ 3:1 avec le fond de `#bp`.
- `jeux-theme.spec.js` › `résultats du Pinceau : plein cadre` : finir une partie comme le test « Pinceau, réglage « Tous » » de `jeux.spec.js` avec l'état `{ ...REAL, bn: 10 }` (10 est le plus petit choix du réglage « Nombre de kana ») ; `.tabbar`, `header.top` absents ; `.gres .rfigs .fig1` au nombre de 3.
- `contraste.spec.js` › `jeux lisibles` complété : Pinceau en jeu, après une réponse fausse (`.bfb.bad`), résultats.
- `tests/unit/contraste.test.js` › `plus de scène sombre` : `styles.css` ne contient plus `--st-` ni `.pad.dark`.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/jeux-theme.spec.js --project=parcours-chromium && npm run test:unit` → FAIL (`#bp` a la classe `dark`, `--st-` présent).

- [ ] **Step 3 : balisage** — `brushV` : croix `CLOSE` ; zone de dessin sans `dark` ; Écouter en bouton rond (`say rnd`) dans la carte de consigne ; score `.bscore` avec le nombre de justes dans un `<b>` coloré `--ok`. `brushResV` : sans `top()`, même structure `.gres` que Rafale (légende, `.big-n`, `.gsub`, `.grec` si record, `.rfigs`, `.mrow` avec les modèles tracés actuels, Daru, `.gacts` Rejouer / Retour).

- [ ] **Step 4 : styles** — consigne en carte `--card` rayon 24 (romaji 40 px, `.bcount` pastille `--mut` filet `--line`) ; `.pad` du Pinceau identique à celui du quiz ; `.bfb.ok b` `--ok`, `.bfb.bad b` `--bad`, `span` `--mut` ; `.bscore` carte 52 px. Supprimer `.pad.dark` et ses règles, puis les neuf variables `--st-*` et toute règle qui les lit (`grep -n -- '--st-' styles.css` doit être vide).

- [ ] **Step 5 : vérifier** — mêmes commandes → PASS ; `npm test`, `npm run lint`, `npm run build:claude` verts. Contrôle visuel 390 × 844 en clair et en sombre face aux six planches.

- [ ] **Step 6 : commit** — `git commit -m "Pinceau suit le thème, fin de la scène sombre"`

### Fin de branche

- [ ] Relecture indépendante de la branche, corrections, `npm test` vert, PR « Interface premium · étape 3, PR 2 : Rafale et Pinceau » vers `main`. Fusion par Julien après essai sur iPhone (clair, sombre, Rafale au clavier dessiné, Pinceau au doigt).
