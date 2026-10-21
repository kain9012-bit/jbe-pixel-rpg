# 사용: python tools/build.py  → 저장소 맨 위에 index.html 생성
import sys, json, base64, glob, os, subprocess, tarfile
from pathlib import Path
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
from art_chars import compose, CHARS, TILES
from art_mons import M
from art_mons2 import N as M2
M = {**M, **M2}

ART = {}
def add(name, rows):
    w = len(rows[0])
    for r in rows: assert len(r) == w, (name, r)
    ART[name] = {'w': w, 'h': len(rows), 'rows': rows}
for c in CHARS:
    for k, rows in compose(c).items():
        add(f'c_{c}_{k}', rows)
for k, rows in TILES.items():
    add('t_' + k, rows)
for k, rows in M.items():
    add(k, rows)
from art_hd import HD
for k, rows in HD.items():
    add(k, rows)
# 참고 그림에서 뽑은 인물 도트 (다시 만들려면: tools/ref/에 원본 넣고 python tools/art_ref.py --json)
for k, rows in json.load(open(TOOLS / 'ref_sprites.json', encoding='utf-8')).items():
    add(k, rows)

code = ''
for f in sorted(glob.glob(str(ROOT / 'src' / '*.js'))):
    code += open(f, encoding='utf-8').read() + '\n'

# 글꼴: 갈무리9 BDF
def parse_bdf(path):
    g = {}; cur = None; bm = None
    for line in open(path, encoding='latin-1'):
        line = line.strip()
        if line.startswith('ENCODING'):
            cur = {'enc': int(line.split()[1])}
        elif line.startswith('DWIDTH') and cur is not None:
            cur['adv'] = int(line.split()[1])
        elif line.startswith('BBX') and cur is not None:
            w, h, xo, yo = map(int, line.split()[1:]); cur.update(w=w, h=h, xo=xo, yo=yo)
        elif line == 'BITMAP':
            bm = []
        elif line == 'ENDCHAR':
            if cur is not None and bm is not None:
                cur['bm'] = bm; g[cur['enc']] = cur
            cur = None; bm = None
        elif bm is not None:
            bm.append(line)
    return g
# 갈무리 글꼴(SIL OFL 1.1)은 처음 한 번 npm에서 받아 tools/.cache 에 둠
BDF = TOOLS / '.cache' / 'package' / 'dist' / 'Galmuri9.bdf'
if not BDF.exists():
    cache = TOOLS / '.cache'; cache.mkdir(exist_ok=True)
    subprocess.run('npm pack galmuri@2.40.3', shell=True, cwd=cache, check=True)
    with tarfile.open(cache / 'galmuri-2.40.3.tgz') as t: t.extractall(cache)
G9 = parse_bdf(str(BDF))
chars = set(chr(c) for c in range(32, 127))
for b1 in range(0xB0, 0xC9):
    for b2 in range(0xA1, 0xFF):
        try: chars.add(bytes([b1, b2]).decode('euc-kr'))
        except Exception: pass
chars |= set(code)
chars |= set('●▶▼…「」·×←→↑↓♪~―↔')
chars = sorted(c for c in chars if ord(c) in G9 and c not in '\n\r\t')
buf = bytearray(); order = ''
for c in chars:
    g = G9[ord(c)]
    bpr = (g['w'] + 7) // 8
    buf += bytes([g['adv'], g['w'], g['h'], g['xo'] & 255, g['yo'] & 255])
    for row in g['bm']:
        v = int(row, 16)
        nb = len(row) // 2
        # 행 데이터를 bpr 바이트로 맞춤
        v >>= (nb - bpr) * 8 if nb > bpr else 0
        buf += v.to_bytes(bpr, 'big')
    order += c
missing = sorted(set(c for c in code if ord(c) > 127 and ord(c) not in G9))
if missing: print('글꼴에 없는 글자:', ''.join(missing))

data = 'const ART=' + json.dumps(ART, ensure_ascii=False, separators=(',', ':')) + ';\n'
data += 'const FONT_CHARS=' + json.dumps(order, ensure_ascii=False) + ';\n'
data += 'const FONT_B64="' + base64.b64encode(bytes(buf)).decode() + '";\n'
shell = open(TOOLS / 'shell.html', encoding='utf-8').read()
html = shell.replace('/*__DATA__*/', data).replace('/*__CODE__*/', code)
out = ROOT / 'index.html'
open(out, 'w', encoding='utf-8').write(html)
print('ok', len(html) // 1024, 'KB', len(order), 'glyphs')
