# Journal des versions

## 0.6 (10 novembre 2026)

Avis d'impôt et pièces administratives :

- Numéro fiscal masqué partout, y compris quand il est suivi d'un autre chiffre (numéro de feuillet, valeur voisine) ; référence de l'avis, numéro FIP, identifiant du service et numéro de télédéclarant reconnus.
- Noms écrits tout en capitales (NOM PRENOM), noms annoncés par « Nom de naissance : ».
- IBAN en partie masqué par l'administration, BIC annoncé par « Identifiant de la banque ».
- Code-barres 2D-Doc et QR codes noircis dans la copie en image : ils reprennent en clair le nom et les numéros.
- Adresses postales abrégées (RTE, CHE, IMP...), ligne de complément entre la voie et le code postal, commune suivie de « LE VIEUX », code postal en fin de phrase.
- Un numéro ajouté à la main est retrouvé quels que soient les espaces, les points ou les tirets.
- Les montants empilés dans une colonne ne sont plus pris pour un numéro ; « CENTRE DES FINANCES PUBLIQUES » n'est plus pris pour une adresse.
- Le nom du client est aussi retiré du nom des fichiers exportés quand il y est collé par un tiret (statuts-dupont.pdf).

Copie caviardée :

- Les masques sont calés sur les lettres réellement dessinées, mot par mot, au lieu de la taille de police annoncée par le PDF.
- Le rendu des pages ne s'arrête plus si l'onglet passe en arrière-plan.

Pièces scannées :

- Seconde lecture en « texte épars » qui rattrape les mots sautés par la première (mises en page en colonnes, encadrés).
- Deux colonnes lues sur une même ligne ne sont plus recollées.
- Un mot mal lu n'est masqué que s'il peut cacher un nom ou un identifiant : les intitulés et les montants restent lisibles.

Interface :

- Un seul écran : on dépose les pièces, l'analyse suit d'elle-même, les éléments masqués sont à gauche, l'aperçu à droite, un bouton pour télécharger.
- Le foyer est détecté d'office ; un champ suffit pour ajouter un nom ou un numéro. Le tableau du foyer et les options sont dans « Foyer et réglages ».
- « Remettre les noms » a son onglet. La table de correspondance est proposée après le téléchargement des pièces.
- Couleurs d'Hereditis (noir, blanc, or), mise en page pour téléphone.
- Le mot « anonymiser » remplace « pseudonymiser » dans l'outil ; l'archive s'appelle `pieces-anonymisees.zip`.

À refaire avec cette version : les captures du guide d'installation (`npm run aide`).

## 0.5 (2 novembre 2026)

- Guide d'installation illustré pour les non-informaticiens, en PDF et en Word (`docs/`), avec ses sources (`aide/`).
- Numéro de version affiché dans l'en-tête, date de construction au survol.
- Bouton « Vérifier les mises à jour » : il ouvre la version en ligne en lui indiquant la version utilisée, et la page en ligne signale s'il en existe une plus récente. Le fichier local ne consulte jamais Internet de lui-même.
- Sur la version en ligne, le bouton devient « Télécharger pour un usage hors ligne ».

## 0.4 (2 novembre 2026)

- Liasses fiscales et formulaires Cerfa : les valeurs saisies dans les champs (dénomination, adresse, SIRET, dirigeant) sont lues, masquées dans le texte et noircies sur la copie caviardée.
- Le vocabulaire comptable et juridique (résultat, total, bilan, soldes intermédiaires de gestion…) n'est plus jamais pris pour un nom, une société ou une commune.
- Un code postal doit s'écrire en cinq chiffres attachés et finir la ligne ou précéder une virgule : un montant comme « 20 073 Résultat » n'est plus lu comme une commune.
- Titres en capitales contenant « de », « des »… écartés de la détection des sociétés.

## 0.3 (2 novembre 2026)

- Nouveau nom, Anonymiser, et nouveau logo.
- Bouton « Détecter le foyer » : personnes et sociétés trouvées dans les pièces, avec nom d'usage, nom de naissance et civilité.
- Détection des personnes par une liste de prénoms français, sans civilité nécessaire.
- Détection des sociétés sans forme juridique : nom en capitales suivi d'un code postal ou contenant un mot de métier, nom après « cabinet » ou « étude ».
- Adresses : noms de voie en minuscules, parcs d'activité et bâtiments, arrêt en fin de phrase.
- Un nom n'est plus masqué au milieu d'un mot composé ; pour les lieux, le composé entier est masqué.
- SIRET masqué dès qu'il est annoncé comme tel, même si sa clé ne tombe pas juste.
- Téléchargement pièce par pièce : texte et PDF caviardé.

## 0.2 (2 novembre 2026)

- PDF scannés et photos lus par reconnaissance de caractères, sur le poste.
- Noms mal lus rattachés au nom connu le plus proche, mots illisibles masqués.
- Copie caviardée des photos.

## 0.1 (2 novembre 2026)

- Première version : foyer, lecture des PDF texte, Word et texte, détection des identifiants, vérification, export, contrôle final, rétablissement des noms.
