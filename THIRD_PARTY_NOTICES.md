# Composants tiers

La page construite (`docs/index.html`, `dist/Anonymiser.html`) intègre les composants suivants, sans modification sauf mention contraire. Le texte complet de chaque licence figure dans le dossier `third_party`.

| Composant | Version | Auteur | Licence | Usage |
|---|---|---|---|---|
| [pdf.js](https://github.com/mozilla/pdf.js) (pdfjs-dist) | 3.11.174 | Mozilla Foundation | Apache 2.0 | lecture et rendu des PDF |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | 5.1.1 | Jerome Wu et contributeurs | Apache 2.0 | reconnaissance de caractères |
| [Tesseract.js-core](https://github.com/naptha/tesseract.js-core) | 5.1.1 | Jerome Wu et contributeurs, moteur Tesseract (Google et contributeurs) | Apache 2.0 | moteur de reconnaissance compilé en WebAssembly |
| [@tesseract.js-data/fra](https://www.npmjs.com/package/@tesseract.js-data/fra) | 1.0.0 (modèle 4.0.0_best_int) | projet Tesseract | MIT (paquet), Apache 2.0 (modèle tessdata) | données de langue française |
| [fflate](https://github.com/101arrowz/fflate) | 0.8.2 | Arjun Barrett | MIT | lecture et écriture des fichiers .docx, .pptx, .xlsx et .zip |
| [Faker](https://github.com/faker-js/faker) | 8.4.1 | contributeurs Faker | MIT | liste de prénoms français (extraite dans `src/prenoms.json`, filtrée) |

## Modification

Tesseract.js 5.1.1 : une ligne du script du worker est corrigée au moment de la construction (`scripts/build.py`, fonction `patch_worker`), pour que la langue fournie en mémoire soit initialisée par son code et non par ses données.
