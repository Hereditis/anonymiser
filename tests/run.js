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

  // 1. Exemple fictif avec foyer saisi
  await page.goto(PAGE);
  await page.click('#example');
  await page.click('#analyze');
  const ex = await out(0);
  check('exemple : aucun nom, adresse ni identifiant visible', leaks(ex, ['LEFORESTIER', 'VARENNES', 'ROCHEMONT', 'Gentianes', 'Chambéry', 'Faverges', '812 345 676', 'FR76', 'exemple.fr', '06 12', '3012345678901', 'AV-2019']).length === 0, leaks(ex, ['LEFORESTIER', 'VARENNES', 'ROCHEMONT', 'Gentianes']).join(', '));
  check('exemple : montants intacts', ex.includes('1 500 euros') && ex.includes('450 000 euros') && ex.includes('312 450 euros'));
  check('exemple : âge à la place de la date de naissance', /\[âge : \d+ ans\]/.test(ex));
  check('exemple : contrôle final au vert', (await page.innerText('#control')).includes('aucune donnée identifiante'));

  // 2. Foyer détecté automatiquement
  await page.goto(PAGE);
  await page.click('#example');
  await page.evaluate(() => { document.querySelector('#tPersons tbody').innerHTML = ''; document.querySelector('#tSocs tbody').innerHTML = ''; document.querySelector('#terms').value = ''; });
  await page.click('#prefill');
  const foyer = await page.evaluate(() => [...document.querySelectorAll('#tPersons tbody tr')].map(tr => [...tr.querySelectorAll('[data-f]')].map(i => i.value).join('|')).join('\n'));
  check('détection du foyer : les deux époux et la fille', /Bertrand Jean-Marc\|LEFORESTIER/.test(foyer) && /Hélène Marie\|LEFORESTIER\|VARENNES/.test(foyer) && /Camille\|LEFORESTIER/.test(foyer), foyer);
  await page.click('#analyze');
  check('détection du foyer : aucun nom visible après analyse', leaks(await out(0), ['LEFORESTIER', 'VARENNES', 'GIRAUDIER']).length === 0);

  // 3. Attestation fictive sans foyer
  await page.goto(PAGE);
  await page.click('#showPaste'); await page.fill('#pasteName', 'attestation'); await page.fill('#pasteText', ATTESTATION); await page.click('#pasteAdd');
  await page.click('#prefill'); await page.click('#analyze');
  const at = await out(0);
  check('attestation : adresses, sociétés, personnes et SIRET masqués', leaks(at, ['Fleuri', 'Érables', 'Belvédère', 'LES PINS', 'SOMMET', 'MARCHAND', 'Delacroix', '00012', '-le-Vieux']).length === 0, leaks(at, ['Fleuri', 'Érables', 'Belvédère', 'LES PINS', 'SOMMET', 'MARCHAND', 'Delacroix', '00012', '-le-Vieux']).join(', '));
  check('attestation : pas de faux positif sur « mise en place » et « au cours de »', at.includes('mise en place de la Société') && at.includes("au cours de l'Assemblée"));

  // 4. PDF texte et Word, exports et rétablissement des noms
  await page.goto(PAGE);
  await page.click('#example');
  await page.setInputFiles('#file', [FX('statuts-leforestier.pdf'), FX('statuts-leforestier.docx')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 3, null, { timeout: 60000 });
  await page.evaluate(() => window.__anon.S.docs.splice(0, 1));
  await page.click('#analyze');
  check('PDF texte : aucun nom visible', leaks(await out(0), ['LEFORESTIER', 'ROCHEMONT']).length === 0);
  check('Word (en-tête compris) : aucun nom visible', leaks(await out(1), ['LEFORESTIER', 'ROCHEMONT', 'Faverges']).length === 0);
  const [zip] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click('#expZip')]);
  await zip.saveAs(path.join(OUT, 'pieces.zip'));
  check('export : archive produite', fs.statSync(path.join(OUT, 'pieces.zip')).size > 10000);
  const [csv] = await Promise.all([page.waitForEvent('download'), page.click('#expCsv')]);
  await csv.saveAs(path.join(OUT, 'table.csv'));
  await page.setInputFiles('#rTable', path.join(OUT, 'table.csv'));
  await page.setInputFiles('#rDoc', FX('bilan-recu.docx'));
  const [back] = await Promise.all([page.waitForEvent('download'), page.click('#rGo')]);
  await back.saveAs(path.join(OUT, 'bilan-retabli.docx'));
  check('rétablissement des noms dans un .docx', (await page.innerText('#rOut')).includes('5 libellé(s) remplacé(s)'));

  // 5. PDF scanné et photo, lus par reconnaissance de caractères
  await page.goto(PAGE);
  await page.click('#example');
  await page.setInputFiles('#file', [FX('statuts-scan.pdf'), FX('photo-page1.jpg')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 3, null, { timeout: 300000 });
  await page.evaluate(() => window.__anon.S.docs.splice(0, 1));
  await page.click('#analyze');
  const sc = await out(0);
  check('scan : texte lu et noms masqués', sc.length > 1000 && leaks(sc, ['LEFORESTIER', 'ROCHEMONT', 'Gentianes']).length === 0);
  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.locator('#expList [data-k=pdf]').first().click()]);
  await pdf.saveAs(path.join(OUT, 'scan-caviarde.pdf'));
  check('scan : PDF caviardé produit', fs.statSync(path.join(OUT, 'scan-caviarde.pdf')).size > 50000);

  // 6. Liasse fiscale avec champs de formulaire et vocabulaire comptable
  await page.goto(PAGE);
  await page.setInputFiles('#file', [FX('liasse-formulaire.pdf')]);
  await page.waitForFunction(() => window.__anon.S.docs.length === 1, null, { timeout: 60000 });
  await page.click('#prefill'); await page.click('#analyze');
  const li = await out(0);
  check('liasse : champs de formulaire masqués', leaks(li, ['SOMMET', 'Fleuri', '81234567600017', 'MARCHAND', 'ANNECY']).length === 0, leaks(li, ['SOMMET', 'Fleuri', '81234567600017', 'MARCHAND', 'ANNECY']).join(', '));
  check('liasse : vocabulaire comptable intact', li.includes('COMPTE DE RESULTAT') && li.includes("Resultat de l'exercice 20 073") && li.includes('SOLDES INTERMEDIAIRES DE GESTION') && li.includes('Total general 202 340'));

  // 7. Étanchéité réseau
  const blocked = await page.evaluate(async () => { try { await fetch('https://example.com/'); return false; } catch (e) { return true; } });
  check('aucune requête réseau possible depuis la page', blocked && network.length === 0, network.join(', '));
  check('aucune erreur JavaScript', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failures ? `\n${failures} test(s) en échec` : '\nTous les tests passent');
  process.exit(failures ? 1 : 0);
})();
