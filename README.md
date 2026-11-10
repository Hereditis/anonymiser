<p align="center"><img src="assets/logo.png" alt="Anonymiser" width="160"></p>

# Anonymiser

Les pièces de vos clients, sans leurs noms.

**[Ouvrir l'outil](https://hereditis.github.io/anonymiser/)** · **[Télécharger pour un usage hors ligne](https://hereditis.github.io/anonymiser/Anonymiser.html)** · **[Guide d'installation (PDF)](https://hereditis.github.io/anonymiser/Aide-installer-Anonymiser.pdf)**

Anonymiser est un outil gratuit proposé par Hereditis aux conseillers en gestion de patrimoine. Il anonymise les pièces d'un dossier (statuts, actes notariés, relevés, liasses, avis d'imposition) avant leur transmission à un tiers : chaque nom, société, adresse ou identifiant est remplacé par un libellé comme `[Client 1]` ou `[Société 1]`, le même dans toutes les pièces.

Tout se passe dans le navigateur, sur le poste du conseiller. Aucune pièce n'est envoyée sur Internet.

## Utilisation

En ligne, en ouvrant la page publiée par Hereditis. Ou hors ligne, avec le lien « Version hors ligne » de la page en ligne : le fichier `Anonymiser.html` s'ouvre ensuite d'un double-clic dans Chrome, Edge, Firefox ou Safari (version de 2023 ou plus récente).

Pour les utilisateurs peu familiers de l'informatique, un [guide d'installation illustré](https://hereditis.github.io/anonymiser/Aide-installer-Anonymiser.pdf) explique pas à pas comment télécharger et ouvrir le fichier ; il existe aussi en [version Word](docs/Aide-installer-Anonymiser.docx) à adapter.

1. **Déposer** : glissez des PDF (avec texte ou scannés), des photos, des fichiers Word ou collez un texte. L'analyse suit d'elle-même, le foyer est détecté dans les pièces.
2. **Vérifier** : à gauche, ce qui est masqué ; à droite, la pièce avant et après. Décochez ce qui ne doit pas l'être, ajoutez un nom ou un numéro, modifiez un libellé.
3. **Télécharger** : les pièces anonymisées et, pour les PDF et les photos, une copie caviardée en image. La table de correspondance se télécharge à part et reste chez vous.
4. **Remettre les noms** : à réception du bilan, l'outil remet les vrais noms dans le document Word, PowerPoint ou Excel, avec votre table de correspondance.

## Mises à jour

La version en ligne est toujours la plus récente. Le fichier téléchargé, lui, ne consulte jamais Internet : le lien « Mises à jour » de son en-tête ouvre la version en ligne en lui transmettant seulement le numéro de version utilisé, et celle-ci indique s'il faut télécharger la nouvelle. Pour être prévenu par mail, suivez le dépôt sur GitHub (Watch, puis Releases).

## Confidentialité : comment le vérifier

La page déclare sa propre politique de sécurité (balise `Content-Security-Policy` en tête de `src/app.src.html`) : elle n'autorise aucune connexion vers un serveur, seulement le traitement en mémoire. Toutes les bibliothèques sont intégrées au fichier, rien n'est chargé depuis l'extérieur.

Trois façons de s'en assurer :

- couper la connexion Internet avant d'ouvrir la page : elle fonctionne à l'identique ;
- ouvrir les outils de développement du navigateur, onglet Réseau : aucune requête ne part pendant le traitement ;
- lire le code de `src/app.src.html`, qui contient toute la logique de l'outil.

Rien n'est conservé à la fermeture de l'onglet : ni pièce, ni saisie, ni cookie.

## Ce que l'outil détecte

- Personnes : les noms précédés de Monsieur, Madame ou Maître, les noms précédés ou suivis d'un prénom connu (environ 3 200 prénoms), y compris tout en capitales, les noms annoncés par « Nom de naissance : », et le foyer saisi à la main.
- Noms de famille partagés par plusieurs membres du foyer, rattachés au bon conjoint quand la civilité le permet.
- Sociétés : forme juridique (SCI, SARL, SAS…), dénomination entre guillemets, nom en capitales suivi d'un code postal ou contenant un mot de métier, nom après « cabinet » ou « étude ».
- Adresses, communes (le département est conservé) et lieux de naissance.
- Identifiants : SIREN et SIRET (clé de contrôle vérifiée), IBAN (clé vérifiée, ou en partie masqué), BIC, numéro de sécurité sociale, numéro fiscal, référence d'avis d'impôt, numéro FIP, numéros de contrat, parcelles cadastrales, références de publication foncière.
- Codes-barres 2D-Doc et QR codes, noircis dans la copie en image.
- Courriels et numéros de téléphone français et suisses.
- Dates de naissance, remplacées par l'âge.
- Pièces scannées : deux lectures par reconnaissance de caractères en français, rattachement des noms mal lus au nom connu le plus proche, masquage des mots mal lus qui peuvent cacher un nom.

Un contrôle final relit le résultat et signale ce qui pourrait encore identifier une personne.

## Limites

- L'outil aide à l'anonymisation, il ne remplace pas la relecture du conseiller.
- Sur une pièce scannée, un mot que la reconnaissance de caractères ne lit pas du tout (texte barré, tampon, tache) reste visible dans la copie en image.
- L'écriture manuscrite n'est pas lue.
- Une personne citée sans civilité ni prénom connu peut échapper à la détection : elle apparaît alors dans les « mots en capitales à vérifier » si son nom est écrit en capitales.
- La copie caviardée d'un PDF est une image : le texte n'y est plus sélectionnable.

## Construire et tester

```
npm ci
npm run build                     # produit dist/Anonymiser.html et docs/index.html
npx playwright install chromium
npm test                          # tests de bout en bout sur des données fictives
npm run aide                      # guide d'installation : images, .docx et .pdf (LibreOffice requis)
```

Les tests n'utilisent que des personnes, sociétés et identifiants inventés (dossier `tests/fixtures`).

## Organisation du dépôt

| Chemin | Contenu |
|---|---|
| `src/app.src.html` | interface et logique de l'outil |
| `src/prenoms.json` | liste des prénoms reconnus |
| `scripts/build.py` | assemble la page autonome avec ses bibliothèques |
| `docs/index.html` | page publiée (GitHub Pages) |
| `docs/Anonymiser.html` | même page, proposée au téléchargement depuis la version en ligne |
| `docs/Aide-installer-Anonymiser.pdf` et `.docx` | guide d'installation pour les non-informaticiens |
| `aide/` | sources du guide : captures, schémas, script de génération |
| `dist/Anonymiser.html` | même page, à télécharger |
| `tests/` | tests de bout en bout et pièces fictives |
| `assets/` | logo |
| `third_party/` | licences des composants tiers |

## Pourquoi un âne ?

L'ânon est le petit de l'âne, et « anon » est l'abréviation d'« anonymous » sur Internet. Les plus anciens y reconnaîtront aussi un cousin de la mule d'eMule, et les lecteurs de Shakespeare le « Anon, anon, sir! » des domestiques qui accourent : tout de suite. Le smoking et le loup sont pour la discrétion d'agent secret avec laquelle il traite vos dossiers.

## Licence

Code publié pour transparence, tous droits réservés : voir [LICENSE](LICENSE). Les composants tiers restent sous leur propre licence : voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Hereditis, Loïc Normand ([@LoicNormand74](https://x.com/LoicNormand74)).
