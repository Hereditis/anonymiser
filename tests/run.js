// Tests de bout en bout d'Anonymiser, sur des données entièrement fictives.
// Usage : npm run build && npm test   (Chromium requis : npx playwright install chromium)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.join(__dirname, '..', 'dist', 'Anonymiser.html');
const FX = f => path.join(__dirname, 'fixtures', f);
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const ATTESTATION = `ATTESTATION DE PRESENTATION DES COMPTES ANNUELS
présentation des comptes annuels de l'entreprise :
SARL LES PINS
8 Avenue du pré Fleuri
Parc des Érables bat Le Belvédère
74000 Annecy
Annecy-le-Vieux
SOMMET CONSEIL 74000 Annecy
Siret : 812 345 676 00012
Fait à Annecy, le 12 mars 2026, Jean-Luc MARCHAND, expert-comptable.
Le gérant, Sophie Delacroix, a signé. La mise en place de la Société a eu lieu au cours de l'Assemblée.`;

// Avis d'impôt entièrement fictif, dans l'ordre où le PDF de l'administration livre son texte
const AVIS = `AVIS_IR_RG
${'FNJNJBFJFJPCIFHDMBHN'.repeat(6)}
2D-DOC
Impôt et prélèvements sociaux sur les revenus de 2025
CENTRE DES FINANCES PUBLIQUES
SIP CHAMBERY
7 RUE DES BELLEDONNES
73018 CHAMBERY CEDEX
DUVERNAY MATHIEU PAUL ANTOINE
OU FAVRELLE CLAIRE
12 RTE DES GENTIANES
MONTAGNOLE LE HAUT
73000 MONTAGNOLE
:
Déclarant 1 (C) :
Déclarant 2 (C) :
30 12 345 678 901
30 98 765 432 109
26 73 B123456 78
12 RTE DES GENTIANES
MONTAGNOLE LE HAUT
73000 MONTAGNOLE
730 12 34 1234567890 1 B
011
08/07/2026
31/07/2026
73099
Somme qui vous est remboursée
1 250,00 €
Vous serez remboursé par virement le 24/07/2026
sur le compte bancaire suivant :
FR76 3000 6000 011X XXXX XXX0 189
Identifiant de la banque : ABCDFRPPXXX
Émetteur du virement :
DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES
84 310
2,00

Impôt et prélèvements sociaux sur les revenus de 2025
Déclarant 1 - Nom de naissance : DUVERNAY
Déclarant 2 - Nom de naissance : FAVRELLE
30 12 345 678 901 1 3
IMPOT SUR LE REVENU
Détail des revenus
Salaires
52400
Montant
réduction
120
45
3310
2980
Montant
retenu
LA SUITE DE CET AVIS EST CI-JOINTE
`;

let failures = 0;
function check(label, ok, detail){
  console.log((ok ? 'OK    ' : 'ECHEC ') + label + (ok || !detail ? '' : ' : ' + detail));
  if (!ok) failures++;
}
function leaks(out, words){ return words.filter(w => out.toLowerCase().includes(w.toLowerCase())); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], network = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
  page.on('dialog', d => d.accept());
  const out = i => page.evaluate(n => window.__anon.S.res[n].out, i);

  const ready = () => page.waitForFunction(() => window.__anon.S.analyzed && document.getElementById('busy').classList.contains('hidden'), null, { timeout: 300000 });
  const paste = async (name, text) => { await page.click('#showPaste'); await page.fill('#pasteName', name); await page.fill('#pasteText', text); await page.click('#pasteAdd'); await ready(); };

  // 1. Exemple fictif avec son foyer : un clic, l'analyse suit d'elle-même
  await page.goto(PAGE);
  await page.click('#example'); await ready();
  const ex = await out(0);
  check('exemple : aucun nom, adresse ni identifiant visible', leaks(ex, ['LEFORESTIER', 'VARENNES', 'ROCHEMONT', 'Gentianes', 'Chambéry', 'Faverges', '812 345 676', 'FR76', 'exemple.fr', '06 12', '3012345678901', 'AV-2019']).length === 0, leaks(ex, ['LEFORESTIER', 'VARENNES', 'ROCHEMONT', 'Gentianes']).join(', '));
  check('exemple : montants intacts', ex.includes('1 500 euros') && ex.includes('450 000 euros') && ex.includes('312 450 euros'));
  check('exemple : âge à la place de la date de naissance', /\[âge : \d+ ans\]/.test(ex));
  check('exemple : contrôle final au vert', (await page.innerText('#control')).includes('aucune donnée identifiante'));
  check('exemple : atelier affiché, bouton Télécharger visible', await page.isVisible('#atelier') && await page.isVisible('#expZip') && !(await page.isVisible('#vide')));

  // 2. Foyer détecté d'office quand rien n'est saisi
  await page.goto(PAGE);
  await page.click('#example'); await ready();
  await page.evaluate(() => { document.querySelector('#tPersons tbody').innerHTML = ''; document.querySelector('#tSocs tbody').innerHTML = ''; document.querySelector('#terms').value = ''; return window.__anon.run(); });
  const foyer = await page.evaluate(() => [...document.querySelectorAll('#tPersons tbody tr')].map(tr => [...tr.querySelectorAll('[data-f]')].map(i => i.value).join('|')).join('\n'));
  check('détection du foyer : les deux époux et la fille', /Bertrand Jean-Marc\|LEFORESTIER/.test(foyer) && /Hélène Marie\|LEFORESTIER\|VARENNES/.test(foyer) && /Camille\|LEFORESTIER/.test(foyer), foyer);
  check('détection du foyer : pas de personne en double', foyer.split('\n').filter(l => /Bertrand/.test(l)).length === 1, foyer);
  check('détection du foyer : aucun nom visible après analyse', leaks(await out(0), ['LEFORESTIER', 'VARENNES', 'GIRAUDIER']).length === 0);

  // 3. Attestation fictive collée, sans foyer
  await page.goto(PAGE);
  await paste('attestation', ATTESTATION);
  const at = await out(0);
  check('attestation : adresses, sociétés, personnes et SIRET masqués', leaks(at, ['Fleuri', 'Érables', 'Belvédère', 'LES PINS', 'SOMMET', 'MARCHAND', 'Delacroix', '00012', '-le-Vieux']).length === 0, leaks(at, ['Fleuri', 'Érables', 'Belvédère', 'LES PINS', 'SOMMET', 'MARCHAND', 'Delacroix', '00012', '-le-Vieux']).join(', '));
  check('attestation : pas de faux positif sur « mise en place » et « au cours de »', at.includes('mise en place de la Société') && at.includes("au cours de l'Assemblée"));

  // 4. Avis d'impôt fictif (texte tel que le donne le PDF d'origine : valeurs sans leurs intitulés), sans aucune saisie
  await page.goto(PAGE);
  await paste('avis', AVIS);
  const av = await out(0);
  const AVL = ['DUVERNAY', 'MATHIEU', 'PAUL', 'ANTOINE', 'FAVRELLE', 'CLAIRE', 'GENTIANES', 'MONTAGNOLE', 'HAUT', 'BELLEDONNES', '345 678', '765 432', 'B123456', '1234567890', '73099', 'ABCDFR', '3000 6000', 'FNJNJB'];
  check("avis d'impôt : nom, numéro fiscal, référence, FIP, service, IBAN, BIC, adresse et 2D-Doc masqués", leaks(av, AVL).length === 0 && !av.includes('2D-DOC'), leaks(av, AVL).join(', '));
  check("avis d'impôt : montants et intitulés intacts", ['1 250,00 €', '84 310', '52400', '120\n45\n3310\n2980', 'Salaires', 'CENTRE DES FINANCES PUBLIQUES', 'IMPOT SUR LE REVENU', '08/07/2026'].every(x => av.includes(x)));
  check("avis d'impôt : même libellé pour une même personne", (av.match(/\[Personne A\]/g) || []).length === 2 && (av.match(/\[Personne B\]/g) || []).length === 2);
  await page.goto(PAGE);
  await paste('numero', 'Ligne 77 001 234 56 fin, et 7700-123-456.');
  await page.fill('#addTerm', '7700123456'); await page.press('#addTerm', 'Enter'); await ready();
  check('numéro saisi sans espaces : retrouvé quelle que soit son écriture', ((await out(0)).match(/\[Terme 1\]/g) || []).length === 2, await out(0));

  // 5. PDF texte et Word, téléchargement, table et remise des noms
  await page.goto(PAGE);
  await page.click('#example'); await ready();
  await page.setInputFiles('#file', [FX('statuts-leforestier.pdf'), FX('statuts-leforestier.docx')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 3, null, { timeout: 60000 });
  await page.evaluate(() => { window.__anon.S.docs.splice(0, 1); return window.__anon.run(); });
  check('PDF texte : aucun nom visible', leaks(await out(0), ['LEFORESTIER', 'ROCHEMONT']).length === 0);
  check('Word (en-tête compris) : aucun nom visible', leaks(await out(1), ['LEFORESTIER', 'ROCHEMONT', 'Faverges']).length === 0);
  const [zip] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('#expZip')]);
  await zip.saveAs(path.join(OUT, 'pieces.zip'));
  check('export : archive produite', fs.statSync(path.join(OUT, 'pieces.zip')).size > 10000 && zip.suggestedFilename() === 'pieces-anonymisees.zip');
  const names = Object.keys(require('fflate').unzipSync(new Uint8Array(fs.readFileSync(path.join(OUT, 'pieces.zip')))));
  check('export : aucun nom dans les noms de fichiers, table absente', !/leforestier/i.test(names.join(' ')) && !names.some(n => /table|\.csv/i.test(n)), names.join(' | '));
  await page.waitForFunction(() => document.getElementById('dlgDl').open);
  const [csv] = await Promise.all([page.waitForEvent('download'), page.click('#expCsv')]);
  await csv.saveAs(path.join(OUT, 'table.csv'));
  await page.evaluate(() => document.getElementById('dlgDl').close());
  await page.click('#mRetab');
  await page.setInputFiles('#rTable', path.join(OUT, 'table.csv'));
  await page.setInputFiles('#rDoc', FX('bilan-recu.docx'));
  const [back] = await Promise.all([page.waitForEvent('download'), page.click('#rGo')]);
  await back.saveAs(path.join(OUT, 'bilan-retabli.docx'));
  check('remise des noms dans un .docx', (await page.innerText('#rOut')).includes('5 libellé(s) remplacé(s)'), await page.innerText('#rOut'));

  // 6. PDF scanné et photo, lus par reconnaissance de caractères
  await page.goto(PAGE);
  await page.click('#example'); await ready();
  await page.setInputFiles('#file', [FX('statuts-scan.pdf'), FX('photo-page1.jpg')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 3, null, { timeout: 300000 });
  await page.evaluate(() => { window.__anon.S.docs.splice(0, 1); return window.__anon.run(); });
  const sc = await out(0);
  check('scan : texte lu et noms masqués', sc.length > 1000 && leaks(sc, ['LEFORESTIER', 'ROCHEMONT', 'Gentianes']).length === 0);
  await page.click('#openDl');
  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.locator('#expList [data-k=pdf]').first().click()]);
  await pdf.saveAs(path.join(OUT, 'scan-caviarde.pdf'));
  check('scan : PDF caviardé produit', fs.statSync(path.join(OUT, 'scan-caviarde.pdf')).size > 50000);

  // 7. Liasse fiscale avec champs de formulaire et vocabulaire comptable, sans aucune saisie
  await page.goto(PAGE);
  await page.setInputFiles('#file', [FX('liasse-formulaire.pdf')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 1, null, { timeout: 60000 }); await ready();
  const li = await out(0);
  check('liasse : champs de formulaire masqués', leaks(li, ['SOMMET', 'Fleuri', '81234567600017', 'MARCHAND', 'ANNECY']).length === 0, leaks(li, ['SOMMET', 'Fleuri', '81234567600017', 'MARCHAND', 'ANNECY']).join(', '));
  check('liasse : vocabulaire comptable intact', li.includes('COMPTE DE RESULTAT') && li.includes("Resultat de l'exercice 20 073") && li.includes('SOLDES INTERMEDIAIRES DE GESTION') && li.includes('Total general 202 340'));
  await page.locator('#docs .x').first().click();
  await page.waitForFunction(() => window.__anon.S.docs.length === 0);
  check('dernière pièce retirée : retour à l\'écran de dépôt', await page.isVisible('#vide') && !(await page.isVisible('#expZip')));

  // 8. Version et vérification des mises à jour
  await page.goto(PAGE);
  const upd = await page.evaluate(() => ({ href: document.querySelector('#updBtn').href, ver: document.querySelector('#verLabel').textContent }));
  check('fichier local : le bouton ouvre la version en ligne avec le numéro de version', upd.href === 'https://hereditis.github.io/anonymiser/?v=' + upd.ver && /^\d+\.\d+$/.test(upd.ver), upd.href);
  const older = await page.evaluate(() => { window.__anon.updateCheck('0.1', true); return document.querySelector('#updText').textContent; });
  check('page en ligne : signale une version plus récente', older.includes('Vous utilisiez la version 0.1') && older.includes('est disponible'), older);
  const same = await page.evaluate(() => { const v = document.querySelector('#verLabel').textContent; window.__anon.updateCheck(v, true); return document.querySelector('#updText').textContent; });
  check('page en ligne : confirme une version à jour', same.includes('est la plus récente'), same);
  await page.evaluate(() => document.querySelector('#updBanner').classList.add('hidden'));

  // 9. Étanchéité réseau
  const blocked = await page.evaluate(async () => { try { await fetch('https://example.com/'); return false; } catch (e) { return true; } });
  check('aucune requête réseau possible depuis la page', blocked && network.length === 0, network.join(', '));
  check('aucune erreur JavaScript', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failures ? `\n${failures} test(s) en échec` : '\nTous les tests passent');
  process.exit(failures ? 1 : 0);
})();
