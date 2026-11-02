# Journal des versions

## 0.5 (2 novembre 2026)

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
