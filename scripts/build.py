"""Assemble la page autonome docs/index.html (et dist/Anonymiser.html) à partir de src/ et des dépendances npm.

Toutes les bibliothèques sont intégrées dans la page : elle ne charge rien depuis Internet.
Usage : npm ci && python3 scripts/build.py
"""
import base64, datetime, json, os, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NM = os.path.join(ROOT, 'node_modules')

def rd(*p):
    with open(os.path.join(NM, *p), encoding='utf-8') as f:
        return f.read()

def patch_worker(t):
    # tesseract.js 5.1.1 : l'initialisation joint l.data au lieu de l.code quand la langue est fournie en mémoire
    bad = 'return"string"==typeof t?t:t.data})).join("+")'
    assert t.count(bad) == 1, 'correctif tesseract.js à revoir'
    return t.replace(bad, 'return"string"==typeof t?t:t.code})).join("+")')

with open(os.path.join(ROOT, 'src', 'app.src.html'), encoding='utf-8') as f:
    src = f.read()
with open(os.path.join(ROOT, 'src', 'prenoms.json'), encoding='utf-8') as f:
    prenoms = f.read()
with open(os.path.join(NM, '@tesseract.js-data', 'fra', '4.0.0_best_int', 'fra.traineddata.gz'), 'rb') as f:
    fra = base64.b64encode(f.read()).decode()

with open(os.path.join(ROOT, 'package.json'), encoding='utf-8') as f:
    version = '.'.join(json.load(f)['version'].split('.')[:2])
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
d = datetime.date.today()
build_date = f"{d.day} {MOIS[d.month - 1]} {d.year}"

parts = {
    '/*__VERSION__*/': version,
    '/*__BUILD_DATE__*/': build_date,
    '/*__PRENOMS__*/': prenoms,
    '/*__FFLATE__*/': rd('fflate', 'umd', 'index.js'),
    '/*__PDFJS__*/': rd('pdfjs-dist', 'build', 'pdf.min.js'),
    '/*__WORKER__*/': rd('pdfjs-dist', 'build', 'pdf.worker.min.js'),
    '/*__TESSERACT__*/': rd('tesseract.js', 'dist', 'tesseract.min.js'),
    '/*__OCRWORKER__*/': patch_worker(rd('tesseract.js', 'dist', 'worker.min.js')),
    '/*__OCRCORE__*/': rd('tesseract.js-core', 'tesseract-core-simd-lstm.wasm.js'),
    '/*__OCRFRA__*/': fra,
}
out = src
for k, v in parts.items():
    assert '</script' not in v.lower() and '<!--' not in v, k
    assert out.count(k) == 1, k
    out = out.replace(k, v)
assert '\u2014' not in out, 'tiret cadratin interdit'

for path in (os.path.join(ROOT, 'dist', 'Anonymiser.html'), os.path.join(ROOT, 'docs', 'index.html'), os.path.join(ROOT, 'docs', 'Anonymiser.html')):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(out)
shutil.copy(os.path.join(ROOT, 'assets', 'logo.png'), os.path.join(ROOT, 'docs', 'logo.png'))
print('Page construite : version', version, 'du', build_date, ',', len(out.encode()) // 1024, 'Ko')
