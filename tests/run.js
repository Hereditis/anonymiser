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

  // 10. Noms de famille qui sont aussi des prénoms, prénoms courants chez les enfants
  await page.goto(PAGE);
  await paste('noms-prenoms', `Sophie Laurent represente la société.
Marie Bernard a signé le compromis.
Le donateur Paul Thomas, demeurant à Annecy.
Claire Robert et Luc Simon sont associés.
Sophie LAURENT, gérante.
LAURENT Sophie, gérante.
Ambre Lenoir, fille du donateur.`);
  const np = await out(0);
  const NPL = ['Laurent', 'LAURENT', 'Bernard', 'Thomas', 'Robert', 'Simon', 'Ambre', 'Lenoir'];
  check('noms qui sont aussi des prénoms, prénoms récents : masqués sans civilité', leaks(np, NPL).length === 0, leaks(np, NPL).join(', '));
  check('noms qui sont aussi des prénoms : le texte autour reste lisible', np.includes('a signé le compromis') && np.includes('sont associés'));
  await page.goto(PAGE);
  await paste('deux-martin', 'Jade Martin et Élise Martin.');
  const jm = await out(0);
  check('deux personnes du même nom : deux libellés distincts', /^\[(Personne|Tiers) [A-Z]+\] et \[(Personne|Tiers) [A-Z]+\]\.$/.test(jm.trim()) && new Set(jm.match(/\[[^\]]+\]/g)).size === 2, jm);

  // 11. Jeu d'essai d'Anonyfiles (MIT, Simon Grossi), passé sans règle personnalisée
  /* écarts assumés : une société sans forme juridique ni mot de métier (règle manuelle chez Anonyfiles aussi),
     une date d'acte (seule la date de naissance devient un âge), un prénom isolé sans nom,
     et deux masquages par prudence : un IBAN collé à du texte, une référence qui reprend le prénom d'une personne masquée (AMBRE-2026) */
  const SKIP = {absent: ['Beta Services', 'Alpha Audit', '25 juin 2026'], isolated: {mobile_standalone_first_names: ['Pierre', 'Ambre']}, preserved: ['FR7630006000011234567890189bis', 'AMBRE-2026']};
  for (const c of JSON.parse(fs.readFileSync(FX('anonyfiles-corpus.json'), 'utf8'))){
    await page.goto(PAGE);
    await paste(c.id, c.input);
    const o = await out(0);
    const must = c.expect.absent_literals.filter(w => !SKIP.absent.includes(w) && !(SKIP.isolated[c.id] || []).includes(w));
    const keep = (c.expect.preserved_literals || []).filter(w => !SKIP.preserved.includes(w));
    check(`corpus Anonyfiles, ${c.id} : rien d'identifiant visible`, leaks(o, must).length === 0, leaks(o, must).join(', '));
    check(`corpus Anonyfiles, ${c.id} : faux positifs évités`, keep.every(w => o.includes(w)), keep.filter(w => !o.includes(w)).join(', '));
  }

  // 12. FEC fictif collé : colonnes conservées, comptes de tiers masqués, pas de faux téléphone
  const FEC = [
    'JournalCode\tJournalLib\tEcritureNum\tEcritureDate\tCompteNum\tCompteLib\tCompAuxNum\tCompAuxLib\tPieceRef\tPieceDate\tEcritureLib\tDebit\tCredit\tEcritureLet\tDateLet\tValidDate\tMontantdevise\tIdevise',
    'BQ\tBanque\t1\t20250131\t455100\tAssociés comptes courants\tDUVERNAY\tDUVERNAY MATHIEU\tVIR01\t20250131\tApport CCA M. Duvernay\t\t15000,00\t\t\t20250131\t\t',
    'OD\tOpérations diverses\t2\t20250228\t421000\tPersonnel rémunérations dues\tFAVRELLE\tFAVRELLE CLAIRE\tPAIE02\t20250228\tSalaire février Claire Favrelle\t\t2450,00\t\t\t20250228\t\t',
    'AC\tAchats\t3\t20250315\t401000\tFournisseurs\tSOMMETCONS\tSOMMET CONSEIL\tF2025-118\t20250315\tHonoraires SOMMET CONSEIL\t\t1800,00\t\t\t20250315\t\t',
    'VT\tVentes\t4\t20250320\t411000\tClients\tLEROUXJP\tLEROUX JEAN-PAUL\tFA0042\t20250320\tFacture Leroux Jean-Paul\t3600,00\t\t\t\t20250320\t\t',
  ].join('\n');
  await page.goto(PAGE);
  await paste('fec', FEC);
  const fe = await out(0);
  const FEL = ['DUVERNAY', 'FAVRELLE', 'SOMMET', 'LEROUX', 'Leroux', 'Duvernay', 'Favrelle'];
  check('FEC : noms et comptes de tiers masqués', leaks(fe, FEL).length === 0, leaks(fe, FEL).join(', '));
  const feLines = fe.replace(/\n+$/, '').split('\n');
  check('FEC : 18 colonnes sur chaque ligne', feLines.length === 5 && feLines.every(l => l.split('\t').length === 18), feLines.map(l => l.split('\t').length).join(' '));
  check('FEC : aucune référence ni date prise pour un téléphone', !fe.includes('Téléphone') && fe.includes('VIR01\t20250131'));
  check('FEC : montants et comptes intacts', ['15000,00', '2450,00', '1800,00', '3600,00', '455100', '421000'].every(x => fe.includes(x)));

  // 13. Classeur Excel fictif : feuilles lues, dates remises en clair, colonnes conservées
  const { zipSync, strToU8 } = require('fflate');
  const NSX = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const xlsx = zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>'),
    'xl/workbook.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="${NSX}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Patrimoine Duvernay" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/sharedStrings.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><sst xmlns="${NSX}"><si><t>Titulaire</t></si><si><t>Date de naissance</t></si><si><t>Support</t></si><si><t>Valeur</t></si><si><r><t>Mathieu </t></r><r><t>DUVERNAY</t></r></si><si><t>Claire FAVRELLE</t></si></sst>`),
    'xl/styles.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="${NSX}"><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/></cellXfs></styleSheet>`),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="${NSX}"><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row>
<row r="2"><c r="A2" t="s"><v>4</v></c><c r="B2" s="1"><v>25000</v></c><c r="C2" t="inlineStr"><is><t>Assurance vie luxembourgeoise</t></is></c><c r="D2"><v>250000</v></c></row>
<row r="3"><c r="A3" t="s"><v>5</v></c><c r="B3" s="1"><v>26500</v></c><c r="D3"><v>120000</v></c></row>
<row r="5"><c r="A5" t="inlineStr"><is><t>IBAN FR76 3000 6000 0112 3456 7890 189</t></is></c></row>
</sheetData></worksheet>`),
  });
  await page.goto(PAGE);
  await page.setInputFiles('#file', [{ name: 'patrimoine-duvernay.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(xlsx) }]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 1, null, { timeout: 60000 }); await ready();
  const xl = await out(0);
  check('Excel : noms masqués, y compris dans le nom de la feuille', leaks(xl, ['DUVERNAY', 'Duvernay', 'FAVRELLE', 'Mathieu', 'FR76 3000']).length === 0, leaks(xl, ['DUVERNAY', 'Duvernay', 'FAVRELLE', 'Mathieu', 'FR76 3000']).join(', '));
  check('Excel : dates de naissance remises en clair puis converties en âge, montants intacts', !/\b25000\b|\b26500\b|\/19[67]\d\b/.test(xl) && (xl.match(/\[âge : \d+ ans\]/g) || []).length === 2 && xl.includes('250000') && xl.includes('120000') && xl.includes('Assurance vie luxembourgeoise'), xl);
  check('Excel : colonnes conservées', xl.split('\n').filter(l => /250000|120000/.test(l)).every(l => l.split('\t').length === 4), xl);

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
