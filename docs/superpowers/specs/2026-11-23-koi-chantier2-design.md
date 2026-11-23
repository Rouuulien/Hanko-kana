# Chantier 2 · Koï remplace Daru (version d'attente) · conception

Date : 2026-11-23. Statut : validé par Julien, puis amendé le 2026-11-23.

> **Amendement (2026-11-23).** La koï lointaine (objectif 3, § 7) est **abandonnée** par Julien. Implémentée, elle
> passait derrière les cartes de l'Accueil et restait presque toujours cachée. En la limitant aux zones vides, elle ne
> passait jamais : aucun espace libre ne dépasse 35 px de haut (mesuré à 390 × 844, 430 × 932 et 375 × 667). Julien
> refuse qu'elle passe sur le contenu. Le travail est conservé sur la branche `koi/lointaine`. Koï passe aussi de 56 à
> **80 px** sur l'Accueil (§ 3).

## Intention

La refonte « premium » remplace Daru (daruma rouge vif, style mascotte d'appli de langues) par Koï, une carpe koï
sobre, dans la palette de la charte. Le dessin définitif sera confié à un illustrateur (animation Rive, cahier des
charges déjà rédigé). En attendant, on intègre le dessin de `koi/koi-demo.html`, qui sert de **version d'attente**.
Julien veut quand même voir dès maintenant la **mécanique de nage** dans l'interface.

Le succès se mesure ainsi : Daru a disparu de l'appli et des textes, Koï réagit aux réponses, elle arrive en nageant
sur l'Accueil, et une koï lointaine traverse parfois le fond. Rien de tout cela ne gêne, et tout s'efface avec
« Réduire les animations ».

## Objectifs

1. Koï remplace Daru partout où Daru apparaît : 9 endroits, voir la liste plus bas.
2. **Arrivée (A)** : à chaque vraie arrivée sur l'onglet Accueil, Koï entre par la droite en nageant, s'arrête à
   côté de sa bulle, puis passe au repos.
3. **Ambiance (B)** : sur l'onglet Accueil seulement, une koï lointaine (plus petite, à demi transparente, « au fond
   du bassin ») traverse l'écran derrière le contenu, toutes les 25 à 40 s.
4. Les textes où parle la mascotte passent de « Daru » à « Koï » ; le texte de bienvenue est réécrit autour du
   Tōryūmon.
5. Le dessin est isolé derrière une interface simple, `koi(state, size)` et `mascot(state, html, size)`, pour que la
   version de l'illustrateur la remplace sans toucher aux écrans.

## Non-objectifs

- La forme dragon (état final). Tant qu'elle n'existe pas, la fin du parcours est marquée par l'état `celebrating`.
- Les états `sleeping` et `greeting` : ils restent dans le dessin et le CSS, mais ne sont branchés sur aucun
  événement. L'inactivité sera traitée plus tard.
- La traversée de fin de leçon (option C, écartée).
- La version claude.ai : elle n'a plus à évoluer. `npm run build:claude` doit seulement continuer à fonctionner.
- Retoucher le dessin : formes, couleurs et décisions du `README-koi.md` sont repris tels quels.

## Anti-objectifs (ce qui ferait échouer le chantier, même si « ça marche »)

- La nage se rejoue à chaque redessin de l'écran (synchro, ouverture du clavier, etc.).
- La koï lointaine capte un toucher, masque un bouton, provoque un défilement horizontal ou fait saccader le
  défilement sur iPhone.
- Une animation tourne encore avec « Réduire les animations », ou quand l'appli est en arrière-plan.
- Une perte ou une modification de la sauvegarde : aucun nouveau champ dans `S`, rien dans `merge()`.
- Le rouge qui envahit : les taches Vermillon sont assumées (décision de Julien), rien de plus.

## Contraintes

- Sans compilation ni dépendance : modules ES natifs, CSS dans `styles.css`.
- `render()` remplace tout le contenu de `#app` à chaque affichage (`src/ui/render.js`). Toute animation posée dans
  `#app` redémarre donc à chaque redessin.
- Les transitions de l'étape 4 décident déjà quel type d'arrivée a lieu : `snapshot()` et `transitionFor()` dans
  `src/ui/transition.js`, des fonctions pures testées dans `tests/unit/transition.test.js`.
- Le thème clair/sombre se règle par des variables de `:root` en `light-dark()`.
- Les tests restent verts à chaque commit. Le CSS passe la vérification de `tests/unit/css.test.js`. Toute police
  utilisée doit couvrir les caractères du code (`tests/unit/polices.test.js`) : le « ï » de « Koï » est nouveau dans
  `src/`, il faudra sans doute lancer `npm run fonts`.

## Approches envisagées

Pour le *quoi* de la nage, trois options ont été proposées à Julien : A (arrivée sur l'Accueil), B (traversée
d'ambiance), C (traversée en fin de leçon réussie). **Julien a choisi A et B.**

Pour la koï de B : soit la même Koï quitte sa bulle et la traverse, soit une **koï lointaine** distincte passe. Le
premier choix laisse la bulle orpheline pendant la traversée. **Julien a choisi la koï lointaine.**

Côté construction, une seule façon tient : animations CSS déclenchées par une classe ou par `data-state`, dans le
prolongement de l'étape 4. Les autres pistes ne conviennent pas. La Web Animations API pilotée en JS n'apporte rien
ici, au prix de plus de code. Un canvas animé en continu coûterait de la batterie. Rive ou Lottie attendront
l'illustrateur.

## Conception

### 1. Le dessin : `src/ui/koi.js` (remplace `src/ui/daru.js`)

- `koi(state, size)` renvoie le SVG de `koi-demo.html` (viewBox `0 0 1200 900`), avec :
  - la classe `koi`, l'attribut `data-state`, `aria-hidden="true"` ;
  - `width` = `size` et `height` = `round(size * 0.75)` ;
  - le `clipPath` des taches **défini dans chaque SVG, avec un identifiant unique** (compteur de module, par
    exemple `koi-clip-3`). La démo le définissait une seule fois pour toute la page, ce qui ne tient pas quand
    plusieurs koï coexistent ou que l'écran est redessiné.
- États acceptés : `resting`, `swimming`, `greeting`, `happy`, `encouraging`, `sleeping`, `celebrating`.
- `mascot(state, html, size)` garde le même rôle que l'ancienne version : la koï plus sa bulle.
- Fin du parcours : plus de paramètre « second œil ». Le second œil n'existe plus.

### 2. Correspondance des états

| Moment | Avant (Daru) | Koï |
|---|---|---|
| Repos (bulles, en-têtes) | `idle` | `resting` |
| Bonne réponse (panneau du quiz, Pinceau) | `happy` | `happy` |
| Erreur (panneau du quiz, Pinceau, test raté) | `oops` | `encouraging` |
| Tous les kana appris | second œil peint | `celebrating`, **sur l'Accueil seulement** |

Ailleurs, un parcours terminé ne change rien : une fête permanente dans les en-têtes de Rafale serait envahissante.

### 3. Les 9 endroits où Daru apparaît

| Fichier | Où | Taille actuelle |
|---|---|---|
| `src/ui/views.js` | Accueil (`todayV`) | 56 |
| `src/ui/views.js` | Mots (`wordsV`) | 76 (par défaut) |
| `src/ui/views.js` | Fiche de leçon (`card-m`) | 60 |
| `src/ui/views.js` | Panneau de réponse du quiz (`fb-m`) | 48 |
| `src/ui/views.js` | Résultats de leçon ou de test | 56 |
| `src/modes/rush.js` | Écran de réglage, en-tête de jeu, résultats | 64 · 32 · 56 |
| `src/modes/brush.js` | Écran de réglage, en-tête de jeu, résultats | 64 · 32 · 56 |

La koï est plus large que haute (rapport 4:3) : à largeur égale, elle paraît plus petite que Daru. *Choix du
rédacteur :* `size` désigne la largeur, et on garde les tailles actuelles, sauf les en-têtes de jeu, qui passent de 32
à 44 px de large (une koï de 32 px n'est pas lisible). Le constructeur ajuste à l'œil sur mobile si besoin, sans
descendre sous 44 px dans les en-têtes.

### 4. Couleurs et thème

Nouvelles variables dans `:root` (`styles.css`), en `light-dark()` :

| Variable | Clair | Sombre | Rôle |
|---|---|---|---|
| `--koi-line` | Sumi `#282824` | Washi `#f7f5ef` | contour, œil |
| `--koi-body` | Sable `#e8dfd0` | Sable `#e8dfd0` | corps |
| `--koi-fin` | Washi `#f7f5ef` | Sable `#e8dfd0` | nageoires |
| `--koi-patch` | Vermillon `#c64b3c` | Vermillon `#c64b3c` | taches |

Les nervures restent en Sauge et les étincelles en Or mat, avec les variables existantes. Le fond sombre `#1E1E1B`
de la démo n'est pas repris : la koï se pose sur le fond de l'appli. *Choix du rédacteur :* des variables dédiées,
plutôt que `--ink` directement, pour que le passage au dessin de l'illustrateur ne touche pas la charte. Ce sont des
couleurs de dessin, pas de texte : le test de contraste ne les concerne pas.

### 5. Animations des états

Le CSS de la démo (états, groupes animés, keyframes) passe dans `styles.css`, avec trois adaptations :

- toutes les règles sont préfixées `.koi` ;
- les keyframes sont renommées `koi-…` (`koi-wag`, `koi-bob`…), pour ne pas entrer en collision avec `bob`,
  `tr-fade`, etc. ;
- `.koi g { transform-box: view-box }` et les `transform-origin` sont repris tels quels ;
- la règle `[data-state="swimming"] .koi { animation: across … }` de la démo **n'est pas reprise** : elle fait
  traverser le SVG en boucle. Le déplacement est porté par un enveloppant (arrivée A, koï lointaine B), et l'état
  `swimming` ne fait qu'onduler le corps et les nageoires.

Les « z » de `sleeping` sont gardés (en `system-ui`, comme dans la démo : hors police d'interface, donc hors du test
des polices). Ils restent invisibles tant que l'état n'est pas branché.

Dans le bloc `prefers-reduced-motion` existant, on ajoute `.koi, .koi *` (et la koï lointaine) avec
`animation: none`. Les anciennes règles `.daru` et `.daru.bob`, ainsi que la keyframe `bob` si plus rien ne
l'utilise, sont supprimées.

### 6. Arrivée en nageant (A)

- **Quand :** l'écran affiché est l'onglet Accueil (`view === 'home'` et `tab === 'home'`) et l'écran précédent ne
  l'était pas. Cela couvre trois cas : premier affichage (prev `null`), arrivée depuis un autre onglet, retour d'un
  écran plein cadre (leçon, Rafale, réglages…). Un redessin du même écran ne déclenche rien.
- **Où :** une fonction pure ajoutée à `src/ui/transition.js`, testée dans `transition.test.js` :
  `arrivesHome(prev, next)`, qui renvoie un booléen à partir de deux `Shot`.
- **Comment :** dans `render()`, si `arrivesHome(ui.shot, shot)`, on passe la koï de l'Accueil en `swimming` et on
  lui pose la classe `koi-in`. Cette animation (environ 1,4 s, `ease-out`) la fait venir de la droite de l'écran
  jusqu'à sa place. Elle est jouée sur un enveloppant (le conteneur de la koï dans `.mascot`), pas sur le SVG, pour
  ne pas entrer en conflit avec les animations internes de l'état. À l'`animationend` de cet enveloppant, la koï
  repasse en `resting` (ou en `celebrating` si tout est appris).
- Si un redessin survient pendant l'arrivée (synchro), la koï réapparaît directement au repos : acceptable.
- La bulle apparaît en fondu, en même temps que l'arrivée (étape 4 déjà en place pour l'onglet).
- Pas de défilement horizontal pendant l'entrée : le conteneur de la koï ou de la bande coupe ce qui déborde, ou
  bien l'animation reste dans la largeur visible ; le constructeur choisit.
- **Réduire les animations :** pas de `koi-in`, la koï est directement au repos à sa place.

### 7. Koï lointaine (B) : `src/ui/pond.js`

- **Calque :** un `<div id="pond" aria-hidden="true">` hors de `#app`, créé une fois par le module (pas dans
  `index.html`), en `position: fixed; inset: 0; pointer-events: none; overflow: hidden`. Il se place derrière le
  contenu : `z-index` inférieur à `#app`, et `#app` passe en `position: relative; z-index: 1` si nécessaire. La koï
  est donc visible sur le fond Washi et cachée derrière les cartes, comme au fond d'un bassin.
- **Koï :** `koi('swimming', 120)` (environ 120 px de large), `opacity` autour de 0,25 à 0,3, sans les étincelles
  ni l'onde. Elle nage de droite à gauche, dans le sens où le dessin regarde déjà. Elle traverse en 10 à 14 s, à une
  hauteur tirée au hasard dans la partie visible de l'écran. La traversée est une animation CSS de transformation
  seulement (`translateX`), ce qui la garde fluide.
- **Rythme :** une traversée toutes les 25 à 40 s (minuterie `setTimeout`), la première 6 à 10 s après l'arrivée sur
  l'Accueil.
- **Marche et arrêt :** `render()` appelle `pond(on)` avec `on` vrai seulement sur l'onglet Accueil. À l'arrêt, la
  minuterie est annulée et la koï en cours retirée. Arrêt aussi sur `visibilitychange` (page cachée), et reprise au
  retour si on est toujours sur l'Accueil. Rien ne démarre avec `prefers-reduced-motion: reduce` (vérifié en JS par
  `matchMedia`, et doublé en CSS).
- Le calque n'est jamais touché par `render()` : une traversée commencée n'est pas coupée par un redessin du même
  écran.

### 8. Textes

- `views.js`, bienvenue (`tipHome`, aucun kana appris) : « Salut, moi c'est <b>Koï</b> ! Une vieille légende dit
  qu'une carpe qui remonte la cascade devient dragon. Remontons-la ensemble : quand tu connaîtras tous les kana, je
  me transformerai. On commence par les 5 voyelles ? »
- `views.js`, tout appris : « Tu connais tous les kana : la cascade est remontée ! Continue les révisions pour les
  garder. »
- `quiz.js` : « Série de N ! Koï est fière. » *Choix du rédacteur :* « la koï », au féminin (une carpe).
- `rush.js` : « Vitesse de ninja. Koï est impressionnée. »
- `manifest.webmanifest`, `index.html` (meta description), `README.md`, commentaire en tête de `styles.css` : Daru
  devient Koï. `README.md` : « Koï, la carpe koï ».
- `CLAUDE.md` (lignes 3, 50, 51) : Koï à la place de Daru. On y garde la règle « mascotte originale ».
- `app-state.js` (commentaire de `homeTip`) : Koï.
- `koi/` reste dans le dépôt comme source de vérité de la version d'attente. Il n'est pas publié : il n'entre pas
  dans `PUBLISHED`.

### 9. Tests

- `tests/unit/transition.test.js` : `arrivesHome` dans tous les cas : premier affichage, autre onglet vers Accueil,
  plein cadre vers Accueil, Accueil vers Accueil (redessin), Accueil vers autre onglet, Entraîner (Rafale ↔ Pinceau).
- `tests/unit/contraste.test.js` : retirer l'exception `daru.js` et la mention de Daru dans le titre du test.
- `tests/parcours/quiz.spec.js` : `.fb .daru` devient `.fb .koi`.
- Nouveau parcours Playwright (`tests/parcours/koi.spec.js`, ou intégré aux fichiers existants) :
  - Accueil : une `.koi` est présente, et le calque `#pond` est actif ;
  - autre onglet : plus de minuterie ni de koï dans `#pond` ;
  - réponse juste puis fausse : `data-state` vaut `happy` puis `encouraging` ;
  - avec `reducedMotion: 'reduce'` : pas de classe `koi-in`, et `#pond` reste vide ;
  - aucun texte « Daru » dans la page.
- Test unitaire léger : plus aucune occurrence de « Daru » dans `src/`, `index.html` et `manifest.webmanifest`.
- `npm run fonts` si `polices.test.js` signale le « ï ».

## Laissé au constructeur

- Le découpage en commits, voire en PR (suggestion : 1. dessin + états + textes ; 2. arrivée A ; 3. koï lointaine B).
- Durées et courbes exactes, à ajuster à l'œil dans les fourchettes données.
- Le moyen d'empêcher le défilement horizontal pendant `koi-in`.
- Les ajustements de taille sur iPhone (voir § 3).
- La vérification de lisibilité à 44 et 48 px : si l'œil disparaît, épaissir légèrement le trait de l'œil par CSS
  aux petites tailles, sans retoucher le dessin.
