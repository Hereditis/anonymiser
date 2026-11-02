const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType, Footer, PageNumber, ExternalHyperlink,
  LevelFormat, TableLayoutType, VerticalAlign,
} = require('docx');

// Guide d'installation pour les non-informaticiens.
// Usage : npm run aide (captures.js produit d'abord les images de aide/images).
const D = path.join(__dirname, 'images');
const ROOT = path.join(__dirname, '..');
const pngSize = f => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const INK = '13222E', BLUE = '2C6FD1', RED = 'D7443E', GREY = '4A5B69', LIGHT = 'EEF4FC';
const W = 9638; // largeur utile A4, marges 1134
const IMGW = 620;
const URL = 'https://hereditis.github.io/anonymiser/';

const img = (f, width = IMGW) => { const [w, h] = pngSize(path.join(D, f)); return new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 },
  children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(D, f)),
    transformation: { width, height: Math.round(width * h / w) },
    altText: { title: f, description: f, name: f } })],
}); };
const p = (runs, opts = {}) => new Paragraph({ spacing: { after: 140, line: 300 }, ...opts,
  children: (Array.isArray(runs) ? runs : [runs]).map(r => typeof r === 'string' ? new TextRun(r) : r) });
const b = t => new TextRun({ text: t, bold: true });
const btn = t => new TextRun({ text: '« ' + t + ' »', bold: true, color: BLUE });

function step(n, title) {
  return new Paragraph({
    spacing: { before: 360, after: 140 }, keepNext: true,
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D3DC', space: 4 } },
    children: [
      new TextRun({ text: ` ${n} `, bold: true, color: 'FFFFFF', size: 30, shading: { type: ShadingType.CLEAR, fill: n === '+' ? RED : BLUE, color: 'auto' } }),
      new TextRun({ text: '   ' + title, bold: true, size: 30, color: INK }),
    ],
  });
}

function box(children, fill = LIGHT, border = BLUE) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
      margins: { top: 160, bottom: 100, left: 240, right: 240 },
      borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.SINGLE, size: 24, color: border } },
      children,
    })] })],
  });
}

const tip = (label, runs) => p([new TextRun({ text: label + ' ', bold: true, color: RED }), ...runs.map(r => typeof r === 'string' ? new TextRun(r) : r)]);
const bullet = runs => new Paragraph({ numbering: { reference: 'puces', level: 0 }, spacing: { after: 80, line: 290 },
  children: runs.map(r => typeof r === 'string' ? new TextRun(r) : r) });

function faq(q, a) {
  return [
    new Paragraph({ spacing: { before: 200, after: 60 }, keepNext: true, children: [new TextRun({ text: q, bold: true, color: INK })] }),
    p(a, { spacing: { after: 100, line: 290 } }),
  ];
}

const children = [
  // En-tête : logo et titre
  new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [1500, W - 1500], layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 1500, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [
        new Paragraph({ children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(ROOT, 'assets', 'logo.png')), transformation: { width: 84, height: 84 }, altText: { title: 'Logo', description: 'Logo Anonymiser', name: 'logo' } })] })] }),
      new TableCell({ width: { size: W - 1500, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Installer Anonymiser sur votre ordinateur', bold: true, size: 40, color: INK })] }),
        new Paragraph({ children: [new TextRun({ text: '4 étapes, 5 minutes, aucune connaissance informatique nécessaire', size: 24, color: GREY })] }),
      ] }),
    ] })],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [] }),

  box([
    p([b('Anonymiser, c\'est un seul fichier. '), 'Il s\'ouvre dans le navigateur que vous utilisez déjà pour aller sur Internet (Chrome, Edge, Safari ou Firefox), comme une page web. Il n\'y a rien à installer, aucun compte à créer, aucun mot de passe.']),
    p(['Une fois le fichier sur votre ordinateur, il fonctionne ', b('même sans connexion Internet'), ', et vos documents ne quittent jamais votre poste.']),
  ]),

  step('1', 'Ouvrez la page Anonymiser'),
  p(['Ouvrez votre navigateur internet et tapez cette adresse dans la barre du haut (là où s\'affichent les adresses de sites), puis appuyez sur la touche Entrée :']),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 }, children: [
    new ExternalHyperlink({ link: URL, children: [new TextRun({ text: 'hereditis.github.io/anonymiser', bold: true, size: 32, color: BLUE, underline: {} })] })] }),
  tip('Astuce :', ['si vous avez reçu ce guide par mail ou en PDF, il suffit de cliquer sur l\'adresse ci-dessus.']),

  step('2', 'Cliquez sur le bouton de téléchargement'),
  p(['En haut à droite de la page, cliquez sur ', btn('Télécharger pour un usage hors ligne'), '.'], { keepNext: true, spacing: { after: 140, line: 300 } }),
  img('etape1.png'),
  p(['Le téléchargement prend quelques secondes (le fichier pèse environ 6 Mo, comme quelques photos).']),
  tip('Si une question s\'affiche :', ['le navigateur peut demander où enregistrer le fichier ou s\'il faut autoriser le téléchargement. Choisissez ', b('Enregistrer'), ' ou ', b('Autoriser'), '.']),

  step('3', 'Retrouvez le fichier'),
  p(['Une flèche apparaît en haut à droite du navigateur. Cliquez dessus : le fichier ', b('Anonymiser.html'), ' figure dans la liste. Un clic sur son nom l\'ouvre directement.'], { keepNext: true, spacing: { after: 140, line: 300 } }),
  img('schema1.png', 480),
  p(['Le fichier est aussi rangé dans le dossier ', b('Téléchargements'), ' de votre ordinateur.']),
  tip('Conseil :', ['déplacez-le sur votre ', b('Bureau'), ' ou dans ', b('Documents'), ' pour le retrouver facilement. Vous pouvez aussi l\'ajouter aux favoris du navigateur une fois ouvert.']),

  step('4', 'Ouvrez-le d\'un double-clic'),
  p(['Les fois suivantes, faites simplement un ', b('double-clic'), ' sur le fichier Anonymiser.html : il s\'ouvre dans votre navigateur, prêt à l\'emploi.'], { keepNext: true, spacing: { after: 140, line: 300 } }),
  img('schema2.png', 480),
  p(['C\'est terminé. Vous pouvez déposer vos pièces et suivre les étapes affichées à l\'écran.']),

  step('+', 'De temps en temps : vérifiez les mises à jour'),
  p(['Le fichier téléchargé ne se met pas à jour tout seul, puisqu\'il ne se connecte jamais à Internet. Une fois par mois environ, cliquez sur ', btn('Vérifier les mises à jour'), ' en haut à droite.'], { keepNext: true, spacing: { after: 140, line: 300 } }),
  img('etape5.png'),
  p(['Une page s\'ouvre et vous indique en vert que votre version est la plus récente, ou en orange qu\'une nouvelle version existe. Dans ce cas, téléchargez-la (étapes 2 à 4) et jetez l\'ancien fichier à la corbeille.']),

  new Paragraph({ pageBreakBefore: true, spacing: { after: 160 }, children: [new TextRun({ text: 'Questions fréquentes', bold: true, size: 34, color: INK })] }),

  ...faq('Le fichier affiche du texte incompréhensible, ou s\'ouvre dans Word ou un autre logiciel.', [
    'Faites un ', b('clic droit'), ' sur le fichier (sur Mac : clic en maintenant la touche ctrl), choisissez ', b('Ouvrir avec'), ', puis votre navigateur : Chrome, Edge, Safari ou Firefox.']),
  ...faq('Je ne trouve pas le fichier.', [
    'Ouvrez le dossier ', b('Téléchargements'), ' : sur Windows, depuis l\'Explorateur de fichiers (icône de dossier jaune dans la barre des tâches) ; sur Mac, depuis le Finder (icône du visage bleu dans le Dock). Vous pouvez aussi taper « Anonymiser » dans la recherche de votre ordinateur.']),
  ...faq('Le navigateur affiche un avertissement au téléchargement.', [
    'Certains navigateurs préviennent par principe pour tout fichier de page web téléchargé. Vérifiez que l\'adresse de la page commence bien par hereditis.github.io, puis choisissez ', b('Conserver'), '.']),
  ...faq('Suis-je obligé de télécharger le fichier ?', [
    'Non. La page en ligne fonctionne exactement de la même façon, et elle est toujours à jour. Le fichier téléchargé sert à travailler sans Internet, ou à garder l\'outil sous la main.']),
  ...faq('Mes documents sont-ils envoyés quelque part ?', [
    'Non. Tout est traité sur votre ordinateur, dans le navigateur. Pour vous en assurer, coupez votre Wi-Fi avant d\'ouvrir le fichier : il fonctionne à l\'identique. Rien n\'est conservé quand vous fermez la page.']),
  ...faq('Puis-je l\'utiliser sur téléphone ou tablette ?', [
    'Anonymiser est pensé pour un ordinateur (Windows ou Mac), où se trouvent en général les pièces des dossiers. Sur tablette, préférez la page en ligne.']),
  ...faq('Le logo représente un âne en smoking. Est-ce sérieux ?', [
    'Tout à fait. Il protège vos clients avec la discrétion d\'un agent secret.']),

  new Paragraph({ spacing: { before: 360 }, children: [] }),
  box([
    p([b('Besoin d\'aide ? '), 'Contactez Hereditis, nous vous guidons volontiers par téléphone ou en partage d\'écran.']),
  ], 'F4F6F8', RED),
];

const doc = new Document({
  creator: 'Hereditis', title: 'Installer Anonymiser sur votre ordinateur',
  styles: { default: { document: { run: { font: 'Arial', size: 23, color: INK } } } },
  numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: 'Hereditis · Anonymiser · hereditis.github.io/anonymiser · page ', size: 17, color: GREY }),
      new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GREY }),
    ] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => { const out = path.join(ROOT, 'docs', 'Aide-installer-Anonymiser.docx'); fs.writeFileSync(out, buf); console.log('Guide écrit : ' + out); });
