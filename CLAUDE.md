# Hanko · contexte pour Claude Code

Jeu web (PWA) pour apprendre les hiragana et katakana, avec Daru le daruma comme mascotte.
Projet personnel de Julien, en français, tutoiement. En ligne : https://rouuulien.github.io/Hanko-kana/

## Architecture

- `index.html` : page et script principal (module ES), sans build ni dépendance npm. Sections repérées par des commentaires `/* ---------- … ---------- */`. Découpage en modules en cours (refonte en plusieurs PR).
- `styles.css` : styles. `src/util.js` : utilitaires. `src/data/` : kana, unités et leçons (`kana.js`), astuces (`notes.js`), mots (`words.js`). `src/core/romaji.js` : découpage et romaji.
- Tests : `npm test` (Playwright, voir `tests/README.md`), lancés en CI à chaque PR. Ils doivent rester verts à chaque étape ; les références `tests/golden/` ne se régénèrent (`npm run golden`) que pour un changement de comportement voulu.
- `sw.js` : service worker (hors ligne). `manifest.webmanifest`, `icons/` : appli installable.
- `data/kana-strokes.json` : tracés des kana dérivés de KanjiVG (CC BY-SA 3.0, voir `data/README.md`). Garder l'attribution.
- `supabase/schema.sql` : table `progress` + règles RLS + fonction `delete_user()`.
- `confidentialite.html` : politique de confidentialité (RGPD).
- Déploiement : tout push sur `main` est publié par GitHub Pages en 1 à 2 minutes.

## Règles critiques : ne jamais faire perdre la progression

La progression des joueurs vit dans `localStorage` (clé `hanko-kana-v1`) et, s'ils sont connectés, dans Supabase (`public.progress.data`, même objet JSON).

1. **Ne jamais changer la clé `hanko-kana-v1`** ni l'adresse du site.
2. **Évolutions de l'objet d'état `S` uniquement additives** : nouveau champ = nouvelle valeur par défaut dans `fresh()`. Ne jamais renommer ni supprimer un champ existant (`learned`, `done`, `tests`, `xp`, `streak`, `best`, `at`…). Si un changement de format est indispensable, écrire une migration qui lit l'ancien format.
3. **Ne pas casser `merge()`** (fusion local / en ligne) : tout nouveau champ de progression doit y être fusionné sans perte.
4. Les identifiants de leçons et d'unités (`h-ka`, `k1`…) servent de clés dans `S.done` / `S.tests` : ne pas les renommer.
5. Ne jamais vider ou réinitialiser `S` en dehors des actions explicites de l'utilisateur (Réglages → Effacer, suppression de compte).

## À chaque mise en production

- Incrémenter la version du cache dans `sw.js` (`const V = 'hanko-vN'`), sinon les appareils gardent l'ancienne version.
- Ajouter à `SHELL` dans `sw.js` tout nouveau fichier nécessaire hors ligne (un test vérifie que chaque fichier de `src/` et chaque `.css` y figure).
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
- La version claude.ai (artifact) utilise le même code : la sauvegarde passe alors par `window.claude` au lieu de Supabase. Ne pas casser ce mode. Depuis le passage en modules, l'artifact doit être un fichier unique généré (script de build prévu dans la refonte) : ne pas republier `index.html` seul sur claude.ai d'ici là.

## Méthode de travail

- Une branche par amélioration, puis fusion dans `main` quand c'est testé.
- Messages de commit en français.
- Garder les modifications petites et incrémentales.
