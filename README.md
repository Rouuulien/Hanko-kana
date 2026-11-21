# Hanko · kana

Petit jeu pour apprendre les hiragana et katakana, avec Daru le daruma comme guide.

## Contenu

- **Parcours** : 208 kana en 6 unités (bases, sons voisés, combinaisons), leçons avec fiches de découverte puis quiz, test de fin d'unité (80 % pour obtenir le tampon).
- **Révisions espacées** : chaque kana revient de 4 h à 35 jours selon tes réponses.
- **Tableau** : grille des kana colorée selon ta maîtrise, touche un kana pour l'entendre.
- **Mots** : environ 175 mots courants qui se débloquent quand tu connais tous leurs kana.
- **Rafale** : mode vitesse en cartes avec clavier AZERTY intégré, en paquet complet ou contre la montre.
- **Écriture** : ordre des traits animé et tracé guidé dans les fiches, exercices « dessine ce kana » dans les quiz, et mode **Pinceau** (on reçoit le son, on dessine le kana ; reconnaissance du tracé, de l'ordre et du sens des traits).
- **Sons**, série de jours, XP.

## Lancer le jeu

L'appli est faite de fichiers statiques : pas de build, pas de dépendance à installer.

- **En ligne** : *Settings → Pages → Deploy from a branch → `main` / (root)*. Le jeu est alors sur `https://rouuulien.github.io/Hanko-kana/`.
- **L'installer sur iPhone** : ouvre l'adresse dans Safari → Partager → « Sur l'écran d'accueil ». Sur Android : menu de Chrome → « Installer l'application ».
- **En local** : `python3 -m http.server` dans le dossier, puis `http://localhost:8000`.

## Comptes et sauvegarde (Supabase)

La connexion se fait par code envoyé par e-mail (sans mot de passe). La progression est gardée sur l'appareil et synchronisée avec Supabase.

Mise en place, une seule fois :

1. **Base de données** : Supabase → *SQL Editor* → coller le contenu de `supabase/schema.sql` → *Run*.
2. **Adresses autorisées** : *Authentication → URL Configuration* :
   - *Site URL* : `https://rouuulien.github.io/Hanko-kana/`
   - *Redirect URLs* : ajouter `https://rouuulien.github.io/Hanko-kana/**`
3. **E-mail avec code** : *Authentication → Emails → Magic Link*. Remplacer le contenu par :
   - Sujet : `Ton code de connexion Hanko`
   - Corps :
     ```html
     <h2>Ton code Hanko</h2>
     <p>Saisis ce code dans l'appli pour te connecter :</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:4px">{{ .Token }}</p>
     <p>Ou clique ici : <a href="{{ .ConfirmationURL }}">me connecter</a></p>
     <p>Si tu n'as rien demandé, ignore cet e-mail.</p>
     ```
   Le code est indispensable sur iPhone : une appli installée sur l'écran d'accueil ne partage pas sa session avec Safari, donc le lien ouvrirait le jeu dans Safari et non dans l'appli.
4. **E-mails (recommandé)** : le service d'e-mail intégré à Supabase est limité à quelques envois par heure. Pour plus d'utilisateurs, brancher un SMTP (Brevo, Resend…) dans *Authentication → Emails → SMTP Settings*.

La clé présente dans `index.html` est la clé **publishable** : elle est faite pour être publique. La sécurité repose sur les règles d'accès (RLS) de `schema.sql`. Ne jamais mettre la clé secrète dans ce dépôt.

Le plan gratuit de Supabase met en pause un projet sans activité pendant 7 jours : une tâche planifiée qui interroge la base une fois par jour (par exemple depuis un VPS) évite la pause.

## Progression

- **Version GitHub Pages / installée** : sur l'appareil, et sur le compte Supabase si l'utilisateur est connecté.
- **Version claude.ai** : sauvegardée automatiquement sur le compte Claude.
- Dans tous les cas, *Réglages → Sauvegarde → Copier le code* donne un code de secours à *Importer* ailleurs.

## Structure du code

Dans `index.html` :

- `ROWS`, `DAK`, `YB` : définition des kana et de leurs lectures
- `NOTE_P`, `NOTE_S` : astuces de prononciation et de forme
- `WORDS` : liste des mots (`kana|sens`)
- `daru()` : la mascotte en SVG
- section *sauvegarde* : `SB_URL` / `SB_KEY` (Supabase), fusion des progressions, connexion par code

Autres fichiers : `manifest.webmanifest` et `sw.js` (appli installable et hors ligne), `icons/`, `confidentialite.html`, `supabase/schema.sql`.
- sections *sessions*, *Rafale*, *sons*, *vues*, *événements*

## Crédits

Les formes et l'ordre des traits des kana proviennent de [KanjiVG](https://kanjivg.tagaini.net) © Ulrich Apel, sous licence CC BY-SA 3.0. Le fichier dérivé `data/kana-strokes.json` est distribué sous la même licence (voir `data/`).
