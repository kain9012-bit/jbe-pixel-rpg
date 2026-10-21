# 사용자가 준 참고 그림(ref/*.png)을 잘라 4색 도트로 변환
import numpy as np, os
from PIL import Image
from scipy import ndimage as nd
from refart import shrink2, fit, rows, preview
HERE = os.path.dirname(os.path.abspath(__file__))
_IM = {}
def load(name):
    if name not in _IM: _IM[name] = np.asarray(Image.open(os.path.join(HERE, 'ref', name + '.png')).convert('RGB')).astype(int)
    return _IM[name]
def cut2(sheet, box, erase=(), d=2, tol=20):
    """box/erase: 미리보기(1376폭) 좌표 → 원본은 ×d"""
    a = load(sheet)
    x0, y0, x1, y1 = [v * d for v in box]
    a = a[y0:y1, x0:x1].copy()
    h, w, _ = a.shape
    lum = a @ np.array([.3, .59, .11])
    sat = (a.max(2) - a.min(2)) / np.maximum(a.max(2), 1)
    ok = np.ones((h, w), bool)
    for ex in erase:
        ex0, ey0, ex1, ey1 = [v * d for v in ex]
        ok[max(0, ey0 - y0):max(0, ey1 - y0), max(0, ex0 - x0):max(0, ex1 - x0)] = False
    # 테두리에 흔한 색 = 배경색
    bd = np.r_[a[0], a[-1], a[:, 0], a[:, -1]]
    q = (bd // 8)
    u, c = np.unique(q, axis=0, return_counts=True)
    cols = [u[i] * 8 + 4 for i in range(len(u)) if c[i] > len(bd) * 0.04]
    near = np.zeros((h, w), bool)
    for col in cols:
        near |= np.abs(a - col).max(2) < tol
    near |= (sat < 0.12) & (lum > 175) & False
    near |= ~ok
    lab, n = nd.label(near)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(border)) | ~ok
    # 그림자: 아래쪽, 채도 낮은 회색, 배경과 이어짐
    sh = (sat < 0.14) & (lum > 50) & (lum < 200)
    sh[:int(h * 0.8)] = False
    lab2, n2 = nd.label(sh | bg)
    bl = set(np.unique(lab2[bg])) - {0}
    bg |= np.isin(lab2, list(bl)) & sh
    fg = nd.binary_opening(~bg, iterations=2)
    lab, n = nd.label(fg)
    sizes = nd.sum(fg, lab, range(1, n + 1))
    big = np.argmax(sizes) + 1
    keep = lab == big
    bb = nd.find_objects(lab)[big - 1]
    for i, s in enumerate(nd.find_objects(lab)):
        if i + 1 != big and sizes[i] > 2500 and s[0].start < bb[0].stop and s[0].stop > bb[0].start and s[1].start < bb[1].stop and s[1].stop > bb[1].start:
            keep |= lab == i + 1
    # 닫힌 배경색 구멍(팔 사이)
    holes = nd.binary_fill_holes(keep) & ~keep
    hl, hn = nd.label(holes)
    for i in range(1, hn + 1):
        r = hl == i
        if r.sum() > 60 and near[r].mean() < 0.6: keep |= r
    ys, xs = np.where(keep)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]; keep = keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return Image.fromarray(np.dstack([a, keep * 255]).astype(np.uint8), 'RGBA')

def top(img, frac):
    return img.crop((0, 0, img.width, int(img.height * frac)))
def flipg(g): return [r[::-1] for r in g]
def bob(g):
    """걷기: 몸을 1px 위로, 다리는 그대로 → 다리 길어 보임 대신 발을 번갈아"""
    h = len(g); w = len(g[0]); out = [r[:] for r in g]
    # 아래 3줄 다리: 왼발 1px 위로
    for y in range(h - 4, h):
        for x in range(w // 2):
            out[y][x] = g[y + 1][x] if y + 1 < h else None
    return out
def backof(g, hair=None):
    """정면 그림에서 얼굴을 머리카락으로 덮어 뒷모습 만들기"""
    h = len(g); out = [r[:] for r in g]
    ys = [y for y in range(h) if any(v is not None for v in g[y])]
    y0 = ys[0]; head = int((ys[-1] - y0) * 0.36) + y0
    if hair is None:
        cnt = [0] * 4
        for y in range(y0, y0 + 3):
            for v in g[y]:
                if v is not None and v != 3: cnt[v] += 1
        hair = max(range(4), key=lambda i: cnt[i]) if any(cnt) else 2
    for y in range(y0, head):
        row = g[y]; xs = [x for x, v in enumerate(row) if v is not None]
        if not xs: continue
        for x in range(xs[0] + 1, xs[-1]):
            if row[x] is not None: out[y][x] = hair
    return out

# 등장인물: (시트, 미리보기 좌표 상자, 지울 곳)
NPC = {
    'prof':   ('s1', (110, 40, 272, 358), ()),
    'leader': ('s4', (405, 35, 600, 356), ()),
    'mom':    ('s4', (100, 40, 258, 356), ()),
    'woman':  ('s2', (112, 420, 250, 742), ()),
    'man':    ('s2', (758, 425, 905, 752), ()),
    'man2':   ('s2', (392, 425, 602, 748), ((350, 395, 468, 500),)),
    'old':    ('s2', (440, 40, 592, 356), ((350, 0, 466, 122), (585, 230, 640, 300))),
    'staff':  ('s4', (1088, 488, 1182, 762), ()),
    'aide':   ('s1', (1145, 268, 1292, 538), ()),
}
CUTS = {}
def figures():
    if CUTS: return CUTS
    H, R = 'hero', 'rival'
    for who, sh in (('player', H), ('rival', R)):
        CUTS[who] = {
            'front': cut2(sh, (60, 25, 200, 320)), 'back': cut2(sh, (330, 25, 480, 320)),
            'right': cut2(sh, (610, 25, 760, 320)), 'left': cut2(sh, (900, 25, 1040, 320)),
        }
    for k, (s, box, er) in NPC.items():
        CUTS[k] = {'front': cut2(s, box, er)}
    return CUTS

def build():
    C = figures(); out = {}
    OH = 24
    for k, f in C.items():
        th = (215, 90, 42) if k in ('player', 'rival') else 'auto'
        S = lambda im, h: shrink2(im, h, th=th)
        dn = fit(S(f['front'], OH), 16, OH)
        if 'back' in f:
            up = fit(S(f['back'], OH), 16, OH)
            sd = fit(flipg(S(f['left'], OH)), 16, OH)
            sd1 = fit(flipg(S(f['right'], OH)), 16, OH)
        else:
            up = backof(dn); sd = dn; sd1 = bob(dn)
        out[f'c_{k}_down0'] = rows(dn); out[f'c_{k}_down1'] = rows(bob(dn))
        out[f'c_{k}_up0'] = rows(up); out[f'c_{k}_up1'] = rows(bob(up))
        out[f'c_{k}_side0'] = rows(sd); out[f'c_{k}_side1'] = rows(sd1)
        out[f'tr_{k}'] = rows(fit(S(f['front'], 52), 48, 52))
    out['c_player_back'] = rows(fit(shrink2(top(C['player']['back'], 0.74), 58, th=(215, 90, 42)), 48, 56))
    return out
REF = None
def get():
    global REF
    if REF is None: REF = build()
    return REF
if __name__ == '__main__':
    import sys, json
    if '--json' in sys.argv:
        json.dump(get(), open(os.path.join(HERE, 'ref_sprites.json'), 'w'), ensure_ascii=False); sys.exit()
    C = figures()
    os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True)
    for k, f in C.items():
        for v, im in f.items(): im.save(os.path.join(HERE, 'shots', f'cut_{k}_{v}.png'))
    R = get()
    def g(n): return [[None if ch == '.' else int(ch) for ch in r] for r in R[n]]
    preview([g('c_player_back')] + [g(f'tr_{k}') for k in C], os.path.join(HERE, 'shots', 'ref_battle.png'), 3)
    ow = []
    for k in C:
        for d in ('down0', 'down1', 'up0', 'side0', 'side1'): ow.append(g(f'c_{k}_{d}'))
    for i in range(0, len(ow), 25): preview(ow[i:i+25], os.path.join(HERE, 'shots', f'ref_ow{i//25}.png'), 4)
