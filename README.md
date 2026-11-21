# Hanko · kana

Petit jeu pour apprendre les hiragana et katakana, avec Daru le daruma comme guide.

## Contenu

- **Parcours** : 208 kana en 6 unités (bases, sons voisés, combinaisons), leçons avec fiches de découverte puis quiz, test de fin d'unité (80 % pour obtenir le tampon).
- **Révisions espacées** : chaque kana revient de 4 h à 35 jours selon tes réponses.
- **Tableau** : grille des kana colorée selon ta maîtrise, touche un kana pour l'entendre.
- **Mots** : environ 175 mots courants qui se débloquent quand tu connais tous leurs kana.
- **Rafale** : mode vitesse en cartes avec clavier AZERTY intégré, en paquet complet ou contre la montre.
- **Sons**, série de jours, XP.

## Lancer le jeu

Tout tient dans un seul fichier : ouvre `index.html` dans un navigateur. Aucune installation, aucune dépendance (les polices viennent de Google Fonts).

Pour le publier avec GitHub Pages : *Settings → Pages → Deploy from a branch → `main` / root*. Le jeu sera alors disponible à `https://<ton-compte>.github.io/hanko-kana/`.

## Progression

- **Sur claude.ai** : la progression est sauvegardée automatiquement sur le compte Claude (synchronisée entre appareils), avec une copie locale dans le navigateur.
- **Ailleurs (GitHub Pages, fichier local)** : la progression est enregistrée dans le navigateur uniquement.
- Dans tous les cas, *Réglages → Sauvegarde → Copier le code* donne un code de secours à *Importer* ailleurs.

## Structure du code

Dans `index.html` :

- `ROWS`, `DAK`, `YB` : définition des kana et de leurs lectures
- `NOTE_P`, `NOTE_S` : astuces de prononciation et de forme
- `WORDS` : liste des mots (`kana|sens`)
- `daru()` : la mascotte en SVG
- sections *sessions*, *Rafale*, *sons*, *vues*, *événements*
