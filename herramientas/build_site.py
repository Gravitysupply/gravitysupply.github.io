import json, os, sys, datetime, hashlib, re, unicodedata, shutil
mode, db, repo = sys.argv[1], sys.argv[2], sys.argv[3]
def load(p, d):
    try:
        with open(p, encoding='utf-8') as f: return json.load(f)
    except Exception: return d
H = lambda i: hashlib.sha256(str(i).encode()).hexdigest()[:16]
OKID = lambda i: bool(re.fullmatch(r'[0-9a-f]{32}', str(i or '')))
def txt(v, m): return ''.join(' ' if unicodedata.category(c) in ('Cc', 'Cf', 'Co', 'Zl', 'Zp') else c for c in str(v or '')).strip()[:m]
def n(v):
    try:
        x = float(v)
        return x if x == x and abs(x) < 1e7 else 0.0
    except Exception: return 0.0
def kind(path):
    try:
        with open(path, 'rb') as f: b = f.read(12)
    except Exception: return None
    if b[:3] == bytes.fromhex('ffd8ff'): return 'jpg'
    if b[:8] == bytes.fromhex('89504e470d0a1a0a'): return 'png'
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP': return 'webp'
    return None
fdir = os.path.join(repo, 'fotos')
os.makedirs(fdir, exist_ok=True)
have = {f.split('.')[0]: f for f in os.listdir(fdir) if re.fullmatch(r'[0-9a-f]{16}[.](jpg|png|webp)', f)}
prods = []
pdir = os.path.join(db, 'productos')
for fn in sorted(os.listdir(pdir)) if os.path.isdir(pdir) else []:
    if fn.endswith('.json'):
        d = load(os.path.join(pdir, fn), None)
        if isinstance(d, dict): d['_id'] = fn[:-5]; prods.append(d)
prods = [p for p in prods if p.get('catalogo', True) is not False and txt(p.get('nombre'), 120)][:500]
if mode == 'need':
    for p in prods:
        i = p.get('img') or ''
        if OKID(i) and H(i) not in have: print(i)
    sys.exit(0)
src = sys.argv[4]
changed_photos = False
if os.path.isdir(src):
    for fn in os.listdir(src):
        sid = fn.split('.')[0]
        if not OKID(sid) or H(sid) in have: continue
        k = kind(os.path.join(src, fn))
        if not k: continue
        out = H(sid) + '.' + k
        try:  # re-encode to drop EXIF (GPS, camera data); keep the photo upright
            from PIL import Image, ImageOps
            im = ImageOps.exif_transpose(Image.open(os.path.join(src, fn)))
            if k == 'jpg' and im.mode != 'RGB': im = im.convert('RGB')
            im.save(os.path.join(fdir, out), quality=88) if k == 'jpg' else im.save(os.path.join(fdir, out))
        except Exception:
            continue
        have[H(sid)] = out; changed_photos = True
def estado(s): return 'agotado' if s <= 0 else ('pocas' if s <= 2 else 'ok')
items, used = [], set()
for p in prods:
    tallas = p.get('tallas') or []
    img = p.get('img') or ''
    foto = have.get(H(img), '') if OKID(img) else ''
    if foto: used.add(foto)
    it = {'id': txt(p['_id'], 64), 'nombre': txt(p.get('nombre'), 120), 'marca': txt(p.get('marca'), 60),
          'categoria': txt(p.get('categoria'), 40), 'detalle': txt(p.get('compat'), 200),
          'precio': round(max(0.0, n(p.get('precio'))), 2), 'foto': ('fotos/' + foto) if foto else ''}
    if tallas:
        it['tallas'] = [{'t': txt(t.get('talla'), 12), 'e': estado(n(t.get('stock')))} for t in tallas[:30] if isinstance(t, dict) and txt(t.get('talla'), 12)]
        tot = sum(n(t.get('stock')) for t in tallas if isinstance(t, dict))
    else:
        it['tallas'] = []; tot = n(p.get('stock'))
    it['e'] = estado(tot)
    items.append(it)
items.sort(key=lambda x: (x['e'] == 'agotado', x['categoria'].lower(), x['nombre'].lower()))
# remove photos no product uses any more
for f in list(have.values()):
    if f not in used:
        os.remove(os.path.join(fdir, f)); changed_photos = True
t = load(os.path.join(db, 'config', 'tienda.json'), {})
tienda = {'nombre': txt(t.get('nombre'), 60) or 'Gravity Supply', 'tel': ''.join(c for c in str(t.get('tel', '')) if c.isdigit())[:13]}
new = {'tienda': tienda, 'productos': items}
out_p = os.path.join(repo, 'catalogo.json')
old = load(out_p, {})
if {'tienda': old.get('tienda'), 'productos': old.get('productos')} == new and not changed_photos:
    print('SIN CAMBIOS'); sys.exit(3)
new['actualizado'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
with open(out_p, 'w', encoding='utf-8') as f: json.dump(new, f, ensure_ascii=False, separators=(',', ':'))
print('OK', len(items), 'productos,', len(used), 'fotos')
