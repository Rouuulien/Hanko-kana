# Hanko premium · étape 3, PR 1 (quiz et fiche) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** mettre le quiz et la fiche de découverte à la charte (maquette « Quiz bonne réponse ») : en-tête fin, carte d'énoncé, choix 2 × 2, panneau de réponse fixé en bas, icônes à la place de `↶ ↻ ✎`, Klee One préchargée.

**Architecture :** balisage dans `src/ui/views.js` (`quizV`, `cardsV`) et `src/ui/pad.js` (`padTools`, `hintBtn`), icônes dans `src/ui/icons.js`, styles dans `styles.css` (section quiz et fiche réécrite). Aucune logique de jeu touchée (`src/modes/quiz.js` inchangé).

**Tech Stack :** modules ES natifs, CSS natif, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-23-ui-premium-etape3-harmonisation-design.md` (section « PR 1 »), parent `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`. Maquette : artboard « Quiz bonne réponse » de https://claude.ai/artifact/KKPsUdEAE21pZ83ZM7b4ac.

Branche : `ui/quiz-fiche` depuis `main` ; premier commit = la spec de l'étape 3 et ce plan.

## Global Constraints

- Sauvegarde, règles du jeu et textes inchangés (titre du panneau = `A.msg`, note seulement là où il y en a une aujourd'hui).
- `data-act` et `id` inchangés ; sélecteurs utilisés par les tests conservés : `#nb`, `#ti`, `#tf`, `#qp`, `#cp`, `.pk`, `.prompt .pk`, `.prompt .pr`, `.bprompt .pr`, `.ask` (son texte commence toujours par la consigne : « Comment… », « Quel… », « Écris… », « Dessine… »), `.opt[data-i]` (texte = chiffre `kbd` puis lecture), `.opt span[lang=ja]`, `.fb` avec `ok` / `bad`, `.card .pk`, `.cnav [data-act]` (le dernier = Suivant / Passer au quiz).
- Thème suivi (clair et sombre) ; texte ≥ 4,5:1 ; zones tactiles ≥ 44 px ; rien sous l'encoche ni la barre d'accueil.
- Une seule action rouge par écran ; Daru reste (pas de koï) ; pas d'animation nouvelle (étape 4).
- Rafale (touche `↻` de `rush.js`) hors périmètre : PR 2.
- Commits en français avec `Co-Authored-By` ; `npm run format`, `npm run lint`, `npm test` verts ; `npm run build:claude` sans erreur.

## Review Focus

1. Exercice « écris la lecture » sur iPhone : clavier ouvert, le champ et Valider restent visibles ; après validation, le panneau ne masque pas le champ (tâche 1).
2. Petit écran (iPhone SE, 375 × 667) : panneau de réponse et choix tiennent sans se chevaucher, Continuer atteignable (tâche 1).
3. Leçon sans voix japonaise (`tts` nul) : aucun bouton Écouter vide ou orphelin, ni avant ni après la réponse (tâche 1).
4. Pinceau, qui partage `padTools` et `hintBtn` : outils toujours ≥ 44 px et libellés intacts (tâche 2).
5. Kana à deux caractères (combinaisons, ex. `きゃ`) dans la carte d'énoncé et la fiche : tiennent sur une ligne à 390 px (tâches 1 et 2).

---

### Task 1 : quiz

**Files :**
- Modify : `src/ui/views.js` (`quizV`), `src/ui/icons.js` (icônes `CLOSE`, `CHECK`), `styles.css` (section quiz : `.qtop`, `.bar`, `.combo`, `.qz`, `.ask`, `.prompt`, `.pk`, `.pr`, `.ear`, `.opts`, `.opt`, `.tf`, `.fb`, `.x`)
- Test : `tests/parcours/quiz.spec.js` (nouveau), `tests/parcours/contraste.spec.js`

**Interfaces :**
- Produces : icônes `CLOSE` (croix, trait 1,6) et `CHECK` (coche, trait 2) exportées par `icons.js`. Balisage du quiz : `<p class="qcap">[<span class="qles">titre de la leçon</span> · ]<span class="ask">consigne</span></p>` (l'étiquette de leçon seulement pour `ui.ses.kind === 'lesson'`, texte `LES[ui.ses.id].t`) ; carte `<div class="prompt">` ; bouton d'écoute de la carte `<button class="say rnd" data-act="say" data-t="…" aria-label="Écouter">` ; panneau `<div class="fb ok|bad [draw]">` fixé en bas ; `.qz` porte la classe `ans` quand une réponse est affichée.

- [ ] **Step 1 : tests (`tests/parcours/quiz.spec.js`, viewport 390 × 844, état REAL, leçon `h-ta` ouverte par `.hero [data-act="lesson"]` puis `[data-act="go"]`)**

Pour forcer un type, avant de répondre à la question courante : `hanko.run(H => { H.ses.queue[H.ses.i + 1].type = 'type'; })` (ou `'draw'`, `'k2r'`), puis répondre avec `repondre()` de `tests/helpers/joueur.js` en s'arrêtant avant `#nb` si besoin (écrire une variante locale `repondreSansContinuer(hanko, juste)` qui reprend `repondre` sans le clic final).
- `consigne et leçon sur une ligne` : `.qcap .qles` = « Ligne T » ; `.ask` commence par une des quatre consignes.
- `le panneau de réponse ne masque ni les choix ni Continuer` (question à choix, juste puis faux) : `.fb` est `position: fixed` ; bas de `.opts` ≤ haut de `.fb` ; `#nb` entièrement dans la fenêtre ; bas de `#nb` ≤ 844.
- `même chose sur petit écran` : idem en 375 × 667 (`page.setViewportSize`).
- `dessin : la zone de dessin reste visible au-dessus du panneau` : question `draw` répondue ; bas de `#qp` ≤ haut de `.fb` ; `.fb` a la classe `draw` ; pas de `.daru` dans `.fb`.
- `écris la lecture : le champ reste visible après validation` : bas de `#tf` ≤ haut de `.fb`.
- `Écouter : absent avant la réponse sur « comment se lit », présent après` : voix japonaise simulée avant `hanko.open` par `page.addInitScript(() => { speechSynthesis.getVoices = () => [{ lang: 'ja-JP', name: 'Test' }]; speechSynthesis.speak = () => {}; })` (`src/ui/voice.js` lit `getVoices()` au chargement) ; question `k2r` ; `.prompt [data-act="say"]` absent avant, présent après réponse.
- `sans voix japonaise, aucun bouton Écouter` (cas par défaut du navigateur de test) : question `k2r` puis `draw`, avant et après réponse : `.prompt [data-act="say"]` absent.
- `zones tactiles ≥ 44 px dans le quiz` (avant et après réponse) : même filtre que `mise-en-page.spec.js`.
- Dans `contraste.spec.js`, nouveau test `quiz lisible (light|dark)` : `releve(page)` sur la question à choix avant réponse, après réponse juste, après réponse fausse, et sur une question `draw` répondue ; aucun texte sous le seuil.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/quiz.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium` → FAIL (`.qcap` absent, `.fb` pas fixé).

- [ ] **Step 3 : balisage `quizV()`** — en-tête `.qtop` : `<button class="x" data-act="quit" aria-label="Quitter">${CLOSE}</button>`, `.bar` (calcul inchangé), `<span class="combo">×N</span>` si `combo >= 2`, `muteBtn()`. Puis `.qcap` (interface ci-dessus). Carte `.prompt` (classe `short` pour le dessin) : contenu actuel ; bouton `.say.rnd` d'écoute en bas à droite : pour `draw` toujours (remplace celui du `.bprompt`), pour les autres types seulement quand `A` existe, jamais pour `ear` (qui garde `.ear`), jamais si `!tts`. Choix : contenu actuel ; la bonne réponse affichée reçoit `${CHECK}` après le texte. Panneau `.fb` : Daru 48 px (pas pour `draw`), `<div class="msg"><b>A.msg</b><span class="note">…</span></div>`, `#nb` « Continuer » (`btn ac` si juste, `btn gh` si faux) ; classe `draw` pour le dessin.

- [ ] **Step 4 : styles** — `.qtop` : 44 px, barre 4 px `--sage` sur `--sand`, `.combo` 13 px `--gold-ink` ; `.qcap` 13 px `--mut` centré ; `.prompt` carte `--card`, filet `--line`, rayon 24, hauteur ~230 px (`.short` : auto), `.pk` en `--f-kana` `clamp(72px, 30vw, 128px)` sur une ligne, `.say.rnd` 44 × 44 rond en bas à droite ; `.opts` grille 2 × 2 gap 10, `.opt` 60 px rayon 16 `--card` ; `.opt.ok` fond `color-mix(in srgb, var(--sage) 22%, var(--card))`, bord 1,5 px `#5E7360`, texte `--ok` ; `.opt.bad` bord et texte `--bad` ; `.opt:disabled:not(.ok):not(.bad)` texte `--mut` (pas d'`opacity`) ; `.tf input` 52 px rayon 14 ; `.fb` `position: fixed; left: 0; right: 0; bottom: 0`, fond `--card`, filet haut, coins hauts 24, ombre `0 -12px 32px -24px rgb(40 40 36 / .35)`, `padding: 20px max(24px, env(safe-area-inset-left)) max(20px, env(safe-area-inset-bottom))`, contenu centré `max-width: 640px`, titre 16 px 500 en `--ok` / `--bad`, `#nb` pleine largeur 52 px ; `.qz.ans` `padding-bottom: 240px` (`.qz.ans.draw` ou équivalent : 160 px) + `env(safe-area-inset-bottom)` ; `.qz.ans .pad` réduit (`max-width: 260px`) pour le dessin.

- [ ] **Step 5 : vérifier** — `npx playwright test tests/parcours/quiz.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium` → PASS ; puis `npm test` → tout vert.

- [ ] **Step 6 : commit** — `git commit -m "Quiz à la charte : carte d'énoncé, choix 2 × 2, panneau de réponse en bas"`

### Task 2 : fiche de découverte, icônes des outils, Klee One préchargée

**Files :**
- Modify : `src/ui/views.js` (`cardsV`), `src/ui/pad.js` (`padTools`, `hintBtn`), `src/ui/icons.js` (`UNDO`, `REPLAY`, `PENCIL`, `ERASE`, `BULB`), `index.html` (preload), `styles.css` (`.card`, `.say`, `.hint`, `.trace`, `.card-m`, `.cnav`, `.dots`, `.ptools`)
- Test : `tests/parcours/quiz.spec.js`, `tests/parcours/contraste.spec.js`, `tests/unit/polices.test.js`

**Interfaces :**
- Consumes : en-tête `.qtop` et carte `.prompt` de la tâche 1 (mêmes styles réutilisés pour la fiche).
- Produces : icônes `UNDO`, `REPLAY`, `PENCIL`, `ERASE`, `BULB` (24 × 24, trait 1,6, `aria-hidden="true"`) ; `padTools()` et `hintBtn()` gardent leur signature et leurs `data-act`.

- [ ] **Step 1 : tests**
- `quiz.spec.js` › `plus de ↶ ↻ ✎ : des icônes` : sur la fiche (après `[data-act="ctrace"]`) et sur une question `draw`, aucun texte visible ne contient `↶`, `↻` ni `✎` ; `[data-act="pundo"] svg`, `[data-act="replay"] svg`, `[data-act="ctrace"] svg` présents (ce dernier avant le clic).
- `quiz.spec.js` › `fiche : navigation en bas, 52 px` : hauteur des deux boutons de `.cnav` ≥ 52 ; zones tactiles ≥ 44 px sur la fiche ; aucun débordement à 390 px avec la leçon des combinaisons (`state` avec `unlock: true`, leçon dont le premier kana a deux caractères, prise dans `H.UNITS`).
- `contraste.spec.js` › `fiche lisible (light|dark)` : `releve(page)` sur la fiche, puis après `ctrace`.
- `polices.test.js` › `Klee One est préchargée` : `index.html` contient `<link rel="preload" href="fonts/KleeOne-400.woff2" as="font" type="font/woff2" crossorigin>`.

- [ ] **Step 2 : lancer, constater l'échec** — `npx playwright test tests/parcours/quiz.spec.js tests/parcours/contraste.spec.js --project=parcours-chromium && npm run test:unit` → FAIL (`↶` encore présent, preload absent).

- [ ] **Step 3 : fiche** — en-tête identique au quiz (`CLOSE`, `.bar`) ; légende `<p class="qcap">Unité · Leçon — découverte</p>` (la classe `ask` disparaît de la fiche : `claude-artifact.spec.js` s'en sert pour savoir que le quiz a commencé, elle ne doit exister que dans le quiz) ; carte `.card` au style de `.prompt` (kana Klee One, romaji `--ac-ink` 28 px, Écouter contour 44 px avec `SPK`) ; astuces `.hint` en liste 14 px sous la carte ; carte « Ordre des traits » (`REPLAY` Revoir, `PENCIL` M'entraîner à tracer) ; bulle de Daru ; `.dots` ; `.cnav` : deux boutons 52 px côte à côte pleine largeur (Précédent contour, Suivant / Passer au quiz plein) ; lien « Je connais déjà ».

- [ ] **Step 4 : outils et préchargement** — `padTools` : `UNDO` Annuler, `ERASE` Effacer, Valider ; `hintBtn` : `BULB` Indice ; boutons ≥ 44 px. `index.html` : ligne de preload Klee One à côté de celle de Noto Sans JP.

- [ ] **Step 5 : vérifier** — mêmes commandes → PASS ; `npm test`, `npm run lint`, `npm run build:claude` → verts. Contrôle visuel 390 × 844 clair et sombre (fiche, quiz avant / après réponse juste et fausse, saisie, dessin) face à la maquette.

- [ ] **Step 6 : commit** — `git commit -m "Fiche de découverte à la charte, icônes des outils de tracé, Klee One préchargée"`

### Fin de branche

- [ ] Relecture indépendante de la branche, corrections, `npm test` vert, PR « Interface premium · étape 3, PR 1 : quiz et fiche » vers `main`. Fusion par Julien après essai sur iPhone (clair, sombre, clavier ouvert sur « écris la lecture »).
