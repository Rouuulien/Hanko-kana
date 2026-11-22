# Hanko premium · étape 1 (charte) : plan de réalisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** appliquer la nouvelle charte (palette, polices auto-hébergées, boutons unifiés, accueil sans bandeau rouge, vrai thème sombre) sans changer l'organisation des écrans ni le comportement du jeu.

**Architecture :** tout passe par `styles.css` (variables sur `:root` en `light-dark()`) et trois polices `woff2` sous-ensemblées dans `fonts/`, publiées et mises en cache hors ligne comme le reste. Un script de développement (`scripts/fonts.mjs`) produit les polices une fois ; le site reste sans build.

**Tech Stack :** CSS natif, `@font-face`, `subset-font` (devDependency, outil de dev seulement), node:test, Playwright.

**Spec :** `docs/superpowers/specs/2026-11-22-ui-premium-chantier1-design.md`

## Global Constraints

- Ne jamais toucher à la sauvegarde : clé `hanko-kana-v1`, `S`, `merge()`, `readSave()` (CLAUDE.md, règles 1 à 6).
- Pas de build pour le site ; les tests existants restent verts sans modifier leurs assertions de comportement.
- Palette clair : fond `#F7F5EF`, texte `#282824`, vermillon `#C64B3C`, sauge `#9BAE9A`, sable `#E8DFD0`, or mat `#B69A63` ; textes foncés : sauge `#3F5241`, or `#7D6435`.
- Palette sombre : fond `#1B1A17`, cartes `#24231F`, texte `#EEEAE0`, vermillon texte `#E0705F`, boutons pleins `#C64B3C` texte blanc.
- Polices : Noto Sans JP (interface, japonais courant), Zen Old Mincho (titres, marque), Klee One (grands kana).
- Contraste ≥ 4,5:1 pour tout texte ; zones tactiles ≥ 44 px.
- Le rouge seulement pour les actions principales, l'onglet ou le choix actif, les accents ponctuels.
- Daru et ses couleurs ne changent pas (chantier 2).
- Messages de commit en français avec la ligne Co-Authored-By ; `npm run format` avant chaque commit ; `npm run lint` vert.

## Review Focus

1. Un caractère affiché absent du sous-ensemble de police (nouveau mot, kanji d'une astuce) retombe sur une police système : la couverture doit être vérifiée par un test, pas à l'œil (tâche 1).
2. Hors ligne, au premier lancement après mise à jour : les polices doivent venir du cache, sans requête vers Google Fonts (tâche 1).
3. Thème sombre de l'iPhone : chaque couple texte/fond doit tenir 4,5:1, y compris les gris secondaires et les textes sauge/or (tâche 2).
4. Accueil à 390 px avec la leçon qui a le plus de kana (combinaisons) : rien ne déborde horizontalement (tâche 3).
5. Version claude.ai : la page autonome doit trouver ses polices (fichiers voisins) (tâche 1).

---

### Task 1 : polices auto-hébergées et sous-ensemblées

**Files :**
- Create : `scripts/fonts.mjs`, `fonts/*.woff2`, `fonts/charset.txt`, `fonts/OFL.txt`, `fonts/README.md`
- Modify : `index.html` (retirer les `<link>` Google Fonts), `styles.css` (`@font-face` en tête), `scripts/build.mjs` (`PUBLISHED` + `fonts`, `OFFLINE` + `woff2`), `scripts/build-claude.mjs` (`FILES` + les `fonts/*.woff2`), `.gitignore` (`.font-src/`), `package.json` (devDependency `subset-font`, script `fonts`)
- Test : `tests/unit/polices.test.js`, `tests/parcours/hors-ligne.spec.js`

**Interfaces :**
- Produces : familles CSS `'Noto Sans JP'` (variable, 400–700), `'Zen Old Mincho'` (400, 700), `'Klee One'` (400, 600), fichiers `fonts/NotoSansJP.woff2`, `fonts/ZenOldMincho-400.woff2`, `fonts/ZenOldMincho-700.woff2`, `fonts/KleeOne-400.woff2`, `fonts/KleeOne-600.woff2`. `export function charset(root: string): string` dans `scripts/fonts.mjs` (caractères à couvrir, triés, sans doublon).

- [ ] **Step 1 : tests de couverture**

`tests/unit/polices.test.js` :
- `charset couvre tout le texte du jeu` : chaque caractère non ASCII présent dans `src/**/*.js`, `index.html`, `confidentialite.html` est dans `fonts/charset.txt`.
- `charset couvre tous les kana` : U+3041–U+3096, U+30A1–U+30FA, U+30FC sont présents.
- `chaque police publiée existe et pèse moins de 400 Ko` (5 fichiers ci-dessus).

- [ ] **Step 2 : lancer, constater l'échec** — `npm run test:unit` → FAIL (`fonts/charset.txt` absent).

- [ ] **Step 3 : `scripts/fonts.mjs`**

`charset(root)` = latin de base et Latin-1 (U+0020–U+00FF), ponctuation générale (U+2000–U+206F), tous les kana (step 1), signes CJK (U+3000–U+303F), plus tout caractère trouvé dans les fichiers du step 1. Le script télécharge une fois les sources dans `.font-src/` depuis `https://github.com/google/fonts/raw/main/ofl/` (`notosansjp/NotoSansJP[wght].ttf`, `zenoldmincho/ZenOldMincho-{Regular,Bold}.ttf`, `kleeone/KleeOne-{Regular,SemiBold}.ttf`, et les `OFL.txt`), sous-ensemble avec `subset-font` en `woff2` (axe `wght` de Noto conservé, borné 400–700), écrit `fonts/charset.txt`, les fichiers, `fonts/OFL.txt` (les trois licences concaténées avec leur titre). `fonts/README.md` : provenance, licence OFL, commande `npm run fonts` à relancer quand un caractère nouveau apparaît.

- [ ] **Step 4 : brancher les polices** — `@font-face` (`font-display: swap`) en tête de `styles.css` avec `url('fonts/…')` ; retirer les deux `<link rel="preconnect">` et le `<link>` Google Fonts de `index.html` ; `PUBLISHED`, `OFFLINE`, `FILES` (claude) mis à jour.

- [ ] **Step 5 : test hors ligne** — dans `tests/parcours/hors-ligne.spec.js`, test `les polices viennent de l'appli, même hors ligne` : aucune requête vers `fonts.googleapis.com` ni `fonts.gstatic.com` pendant le chargement ; après passage hors ligne et rechargement, `document.fonts.check('16px "Noto Sans JP"')` et `document.fonts.check('40px "Klee One"')` sont vrais après `document.fonts.ready`. Le test de build existant (`tests/unit/build.test.js`) doit voir `./fonts/NotoSansJP.woff2` dans `SHELL` : ajouter cette assertion.

- [ ] **Step 6 : vérifier** — `npm run fonts && npm test` → tout vert ; `npm run build:claude` → `dist-claude/fonts/*.woff2` présents.

- [ ] **Step 7 : commit** — `Charte : polices Noto Sans JP, Zen Old Mincho et Klee One hébergées avec l'appli`

### Task 2 : palette clair et sombre, typographie

**Files :**
- Modify : `styles.css` (`:root`, `body`, titres, toutes les couleurs écrites en dur hors Daru), `index.html` (`theme-color`), `manifest.webmanifest`
- Test : `tests/unit/contraste.test.js`

**Interfaces :**
- Consumes : familles de la tâche 1.
- Produces : variables `--bg`, `--card`, `--ink`, `--mut`, `--line`, `--ac` (vermillon des fonds et bordures), `--ac-ink` (vermillon pour du texte), `--sand`, `--sage`, `--sage-ink`, `--gold`, `--gold-ink`, `--ok`, `--bad`, `--on-ac` (texte sur vermillon) ; `--f-ui`, `--f-title`, `--f-kana` (piles de polices) ; `--r-s: 12px`, `--r-m: 14px`, `--r-l: 20px`, `--r-xl: 24px`. Les anciennes variables gardent leur nom ; `--hero` disparaît (tâche 3).

- [ ] **Step 1 : test de contraste**

`tests/unit/contraste.test.js` lit les déclarations `--x: light-dark(#clair, #sombre)` (ou une couleur seule) du premier bloc `:root` de `styles.css` et vérifie, en clair et en sombre, un ratio ≥ 4,5 pour : `ink/bg`, `ink/card`, `ink/sand`, `mut/bg`, `mut/card`, `ac-ink/bg`, `on-ac/ac`, `sage-ink/bg`, `gold-ink/bg`, `ok/card`, `bad/card`. Formule WCAG 2 (luminance relative sRGB).

- [ ] **Step 2 : lancer, constater l'échec** (variables absentes).

- [ ] **Step 3 : nouvelles variables** avec les valeurs des Global Constraints. `--mut` clair `#6E6B63`, sombre `#A39E92` ; `--line` clair `#E5DED1`, sombre `#34322C` ; `--card` clair `#FFFFFF` ; `--sand` sombre `#2E2B24` ; `--sage-ink` sombre `#9BAE9A`, `--gold-ink` sombre `#C9AE78`, `--ac-ink` clair `#C64B3C` ; `--ok` = `--sage-ink` ; `--bad` clair `#B3261E`, sombre `#FF8A80`. Un texte secondaire posé sur `--sand` utilise `--ink` (le gris `--mut` y tombe à 4:1). `body` en `--f-ui`, `h1–h3` en `--f-title` (graisse 700, plus de 900), `[lang='ja']` en `--f-ui`. Remplacer chaque couleur en dur de `styles.css` par une variable, sauf celles de Daru et des tracés (`.model`, `.aid`).

- [ ] **Step 4 : `theme-color`** — deux balises `<meta name="theme-color">` avec `media="(prefers-color-scheme: light)"` `#F7F5EF` et `dark` `#1B1A17` ; manifeste `theme_color` et `background_color` `#F7F5EF`.

- [ ] **Step 5 : vérifier** — `npm test` vert.

- [ ] **Step 6 : commit** — `Charte : palette Washi, Sumi et Vermillon, thème sombre décliné`

### Task 3 : composants unifiés et accueil sans bandeau rouge

**Files :**
- Modify : `styles.css` (`.btn*`, `.pill`, `.ic`, `.seg`, `.tabs`, `.chips`, `.opt`, `.card`, `.rev`, `.fig1`, `.hero*`, `.big-k`, grands kana), `src/ui/views.js` seulement si une classe de bouton doit changer (`btn wh` → `btn ac` dans le bandeau d'accueil)
- Test : `tests/parcours/mise-en-page.spec.js` (nouveau)

**Interfaces :**
- Consumes : variables de la tâche 2.
- Produces : trois styles de bouton : `.btn.ac` (plein vermillon, texte `--on-ac`), `.btn.gh` (contour 1 px `--ink`), `.link` (souligné discret) ; `.btn` seul = plein `--ink`. Hauteur 52 px (`.btn.sm` 44 px), rayon `--r-m`, aucune ombre en relief, retour au toucher par `transform: scale(.98)` et opacité.

- [ ] **Step 1 : test de mise en page**

`tests/parcours/mise-en-page.spec.js`, viewport 390 × 844, sauvegarde réelle (`vraie-sauvegarde.json`) :
- `aucun écran ne déborde en largeur` : pour l'accueil et chacun des onglets Parcours, Tableau, Mots, Rafale, Pinceau, `document.documentElement.scrollWidth <= 390`.
- `la leçon la plus longue tient sur l'accueil` : en ouvrant l'accueil avec une progression où la leçon suivante est celle qui a le plus de kana (via le hook : la leçon de `H.LES` qui a le plus de kana ; marquer `done` toutes les leçons qui la précèdent), `.big-k` a `scrollWidth <= clientWidth`.
- `zones tactiles d'au moins 44 px` : tous les `button` et `[data-act]` visibles de l'accueil ont une boîte ≥ 44 px de haut.
- `le bandeau d'accueil n'est plus rouge` : `getComputedStyle(.hero).backgroundColor` ne vaut pas la couleur de `--ac`.

- [ ] **Step 2 : lancer, constater l'échec** (bandeau rouge, et éventuels débordements).

- [ ] **Step 3 : composants** — boutons comme dans Produces ; `.pill` et `.ic` sans bordure, fond `--card` ; `.seg`, `.tabs` et `.chips` en commande segmentée (fond `--sand`, choix actif fond `--card` texte `--ink`) ; `.opt` rayon `--r-l`, bordure `--line`, `.opt.ok` fond sauge clair bordure `--sage-ink`, `.opt.bad` bordure `--bad` ; cartes rayon `--r-l`, bordure `--line`, ombre très légère ou nulle.

- [ ] **Step 4 : accueil** — `.hero` fond `--bg`, texte `--ink`, plus de `::after` ; le contenu de la leçon dans une carte (`--card`, rayon `--r-l`) ; `.big-k` en `--f-kana`, graisse 400, sans ombre, une ligne quand ça tient (taille `clamp` ajustée au nombre de kana si besoin) ; `.rev` sur fond `--sand`, chiffre en `--f-title` couleur `--ink` ; bouton de la leçon en `.btn.ac`. Grands kana en `--f-kana` : `.big-k`, `.pk`, `.cell span`, `.mk span`, `.cd` et le kana de `.bprompt` le cas échéant ; le vocabulaire (`.wd .j`) reste en `--f-ui`.

- [ ] **Step 5 : vérifier** — `npm test` et `npm run lint` verts.

- [ ] **Step 6 : captures pour Julien** — script jetable (scratchpad) : captures 390 × 844 en clair et en sombre (`colorScheme: 'dark'`) de l'accueil, du Tableau, de la Rafale, d'un quiz, sur la vraie sauvegarde ; les regarder, corriger ce qui jure avec les maquettes.

- [ ] **Step 7 : commit** — `Charte : boutons et commandes unifiés, accueil sans bandeau rouge`

### Task 4 : documentation et PR

**Files :**
- Modify : `CLAUDE.md` (section « Style et contenu » : nouvelles couleurs et polices, polices dans `fonts/` régénérées par `npm run fonts`), `README.md` (choix techniques : polices auto-hébergées), `tests/README.md` (nouveaux tests)

- [ ] **Step 1 : mettre à jour la documentation** ci-dessus.
- [ ] **Step 2 : `npm run format && npm run lint && npm test`** → vert.
- [ ] **Step 3 : commit** — `Documentation : nouvelle charte et polices hébergées`
- [ ] **Step 4 : push et PR** vers `main` (`gh pr create`), description avec captures clair/sombre ; ne pas fusionner (Julien fusionne).
