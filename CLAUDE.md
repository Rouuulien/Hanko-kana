# Hanko · contexte pour Claude Code

Jeu web (PWA) pour apprendre les hiragana et katakana, avec Daru le daruma comme mascotte.
Projet personnel de Julien, en français, tutoiement. En ligne : https://rouuulien.github.io/Hanko-kana/

## Architecture

- `index.html` : coquille de la page (balises, polices, `styles.css`) qui charge `src/main.js`. Sans build ni dépendance npm : modules ES natifs.
- `src/main.js` : point d'entrée (charge la progression, branche la synchro sur l'interface, premier affichage).
- `src/data/` : kana, unités et leçons (`kana.js`), astuces (`notes.js`), mots (`words.js`). `src/util.js` : utilitaires.
- `src/core/` : logique pure sans DOM, testée en unitaire : `state.js` (objet `S`, `fresh()`, chargement/sauvegarde locale), `merge.js` (fusion local/en ligne), `srs.js` (révisions espacées), `progress.js` (jours, série, déblocage), `reading.js` (mots lisibles), `romaji.js`. `S` n'est jamais réaffecté : utiliser `replaceState()`.
- `src/draw/` : `strokes.js` (chargement des tracés KanjiVG), `recognize.js` (reconnaissance du tracé), `svg.js` (modèle animé, aides).
- `src/sync/cloud.js` : synchronisation (compte Claude ou Supabase), `save()`, fusion à la réception. Ne connaît pas l'interface : `main.js` la lui branche par `bindUI()`.
- `src/ui/` : `app-state.js` (objet `ui` : écran courant, session, Rafale, Pinceau, zone de dessin ; jamais sauvegardé), `render.js`, `views.js` (écrans), `account.js`, `events.js` (un écouteur délégué sur `data-act`), `pad.js` (zone de dessin), `voice.js`, `sounds.js`, `daru.js`, `icons.js`.
- `src/modes/` : `quiz.js` (leçons, quiz, tests, révisions), `rush.js` (Rafale), `brush.js` (Pinceau).
- Tests : `npm test` (unitaires Node puis Playwright, voir `tests/README.md`), lancés en CI à chaque PR. Ils doivent rester verts à chaque étape ; les références `tests/golden/` ne se régénèrent (`npm run golden`) que pour un changement de comportement voulu.
- `sw.js` : service worker (hors ligne). `manifest.webmanifest`, `icons/` : appli installable.
- `data/kana-strokes.json` : tracés des kana dérivés de KanjiVG (CC BY-SA 3.0, voir `data/README.md`). Garder l'attribution.
- `supabase/schema.sql` : table `progress` + règles RLS + fonction `delete_user()`.
- `confidentialite.html` : politique de confidentialité (RGPD).
- Déploiement : tout push sur `main` lance `.github/workflows/deploy.yml` (tests complets, puis `scripts/build.mjs` construit `dist/`, puis publication GitHub Pages). Si un test échoue, rien n'est publié. Seuls les fichiers listés dans `PUBLISHED` (`scripts/build.mjs`) sont publiés.

## Règles critiques : ne jamais faire perdre la progression

La progression des joueurs vit dans `localStorage` (clé `hanko-kana-v1`) et, s'ils sont connectés, dans Supabase (`public.progress.data`, même objet JSON).

1. **Ne jamais changer la clé `hanko-kana-v1`** ni l'adresse du site.
2. **Évolutions de l'objet d'état `S` uniquement additives** : nouveau champ = nouvelle valeur par défaut dans `fresh()`. Ne jamais renommer ni supprimer un champ existant (`learned`, `done`, `tests`, `xp`, `streak`, `best`, `at`…). Si un changement de format est indispensable, écrire une migration qui lit l'ancien format.
3. **Ne pas casser `merge()`** (fusion local / en ligne) : tout nouveau champ de progression doit y être fusionné sans perte.
4. Les identifiants de leçons et d'unités (`h-ka`, `k1`…) servent de clés dans `S.done` / `S.tests` : ne pas les renommer.
5. Ne jamais vider ou réinitialiser `S` en dehors des actions explicites de l'utilisateur (Réglages → Effacer, suppression de compte).

## À chaque mise en production

- Version du cache et liste hors ligne : **automatiques**. `scripts/build.mjs` remplit `V` (empreinte du contenu publié) et `SHELL` (tous les fichiers publiés) dans `sw.js`. Ne pas les modifier à la main ; un nouveau fichier ou dossier à publier s'ajoute à `PUBLISHED`.
- Tester en local : `python3 -m http.server 8000` puis http://localhost:8000 (le service worker et Supabase fonctionnent en localhost ; ajouter `http://localhost:8000/**` aux Redirect URLs Supabase si besoin de tester la connexion).
- Vérifier sur mobile (iPhone Safari et appli installée) : clavier, zones tactiles ≥ 44 px, zones sûres (`env(safe-area-inset-*)`).

## Supabase

- Projet `Hanko-Kana`, ref `hxnptpndukqivjewwxnj`, région eu-west-1.
- Le code n'utilise que la clé **publishable** (publique). Ne jamais committer la clé secrète.
- Toute modification de schéma : nouveau fichier dans `supabase/migrations/` (horodaté), rétrocompatible, avec RLS sur toute nouvelle table. Lancer les advisors de sécurité après.
- Connexion : e-mail + mot de passe (`signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`) en méthode principale ; lien/code e-mail (`signInWithOtp` + `verifyOtp`) en alternative. Les modèles d'e-mail ne sont modifiables qu'avec un SMTP personnalisé (pas encore configuré) : le code `{{ .Token }}` n'est donc pas encore envoyé.
- Une session Supabase est propre à chaque navigateur et à l'appli installée (stockage séparé sur iOS).

## Style et contenu

- Interface et textes en français, ton chaleureux, Daru parle à la première personne.
- Daru est une mascotte originale : ne pas utiliser de personnages ou visuels protégés (pas de pingouin Suica, rien de Mochikana).
- Couleurs : vermillon `#e3402a`, encre `#1d1b20`, or `#f2b33d`. Polices : Zen Maru Gothic (kana, titres), Outfit (texte).
- La version claude.ai (artifact) utilise le même code : la sauvegarde passe alors par `window.claude` au lieu de Supabase. Ne pas casser ce mode. Depuis le passage en modules, l'artifact se construit avec `npm run build:claude` : `dist-claude/index.html` (styles et code assemblés en ligne par esbuild) plus `data/kana-strokes.json`, `icons/`, `manifest.webmanifest`. Publier ce dossier (pas le `index.html` du dépôt) sur l'artifact existant, avec les capacités `db` et `user`. esbuild ne sert qu'à cette version ; le site Pages reste sans compilation.

## Méthode de travail

- Une branche par amélioration, puis fusion dans `main` quand c'est testé.
- Messages de commit en français.
- Style : `npm run format` (Prettier) avant de committer ; `npm run lint` (ESLint, Prettier, types) tourne en CI et bloque la PR ou le déploiement.
- Types : `src/core/`, `src/data/` et `src/util.js` sont vérifiés par `tsc` (`// @ts-check`, annotations JSDoc, types dans `types/hanko.d.ts`). Tout nouveau champ de sauvegarde s'ajoute aussi à l'interface `State`. Pas de compilation : tsc ne fait que vérifier.
- Garder les modifications petites et incrémentales.
