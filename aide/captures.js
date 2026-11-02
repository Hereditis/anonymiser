// Images du guide d'installation : deux captures de l'en-tête de l'outil
// (version en ligne et fichier local) et deux schémas (aide/schemas.html).
// Usage : npm run build, puis npm run aide.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'images');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.join(ROOT, 'dist', 'Anonymiser.html'));

  // Entoure un élément d'un cercle rouge et ajoute une étiquette dessous
  const ring = (sel, label) => p.evaluate(([sel, label]) => {
    document.querySelectorAll('.annot').forEach(x => x.remove());
    const r = document.querySelector(sel).getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'annot';
    Object.assign(d.style, { position: 'fixed', left: (r.left - 8) + 'px', top: (r.top - 8) + 'px', width: (r.width + 16) + 'px', height: (r.height + 16) + 'px', border: '4px solid #D7443E', borderRadius: '999px', zIndex: 99, boxSizing: 'border-box' });
    document.body.appendChild(d);
    const t = document.createElement('div'); t.className = 'annot'; t.textContent = label;
    Object.assign(t.style, { position: 'fixed', left: Math.max(10, r.left - 120) + 'px', top: (r.bottom + 18) + 'px', background: '#D7443E', color: '#fff', font: '700 18px Arial', padding: '8px 14px', borderRadius: '8px', zIndex: 99 });
    document.body.appendChild(t);
  }, [sel, label]);
  const clip = { x: 0, y: 0, width: 1280, height: 168 };

  // Version en ligne : bouton de téléchargement
  await p.evaluate(() => window.__anon.updateCheck(null, true));
  await ring('#updBtn', 'Cliquez ici');
  await p.screenshot({ path: path.join(OUT, 'etape1.png'), clip });

  // Fichier local : bouton de mise à jour
  await p.reload();
  await ring('#updBtn', 'De temps en temps');
  await p.screenshot({ path: path.join(OUT, 'etape5.png'), clip });

  // Schémas : flèche de téléchargement du navigateur, dossier Téléchargements
  await p.goto('file://' + path.join(__dirname, 'schemas.html'));
  await p.locator('#s1').screenshot({ path: path.join(OUT, 'schema1.png') });
  await p.locator('#s2').screenshot({ path: path.join(OUT, 'schema2.png') });

  await b.close();
  console.log('Images écrites dans ' + OUT);
})();
