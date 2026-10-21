# 전투용 큰 인물 그림 — 명암을 넣어 크게 그린 뒤 줄이고, 4단계 색 + 디더링으로 픽셀아트화
from PIL import Image, ImageDraw, ImageChops

K = 6  # 작업 배율
def snap(v): return int(round(v / 85.0)) * 85
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

class Painter:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.img = Image.new('L', (w * K, h * K), 255)
        s.mask = Image.new('L', (w * K, h * K), 0)
        s.marks = []  # 줄인 뒤 찍는 점 (x, y, idx)
    def _m(s, kind, c):
        m = Image.new('L', (s.w * K, s.h * K), 0)
        d = ImageDraw.Draw(m)
        sc = [v * K for v in c] if kind != 'poly' else [(x * K, y * K) for x, y in c]
        if kind == 'ell': d.ellipse(sc, fill=255)
        elif kind == 'rect': d.rectangle(sc, fill=255)
        elif kind == 'rr': d.rounded_rectangle(sc[:4], radius=c[4] * K if len(c) > 4 else 2 * K, fill=255)
        elif kind == 'poly': d.polygon(sc, fill=255)
        return m
    def shape(s, kind, c, tone, shade=85, light=85, clip=None, rim=1.6):
        tone = snap(tone); shade = 85 if shade >= 30 else 0; light = 85 if light >= 30 else 0
        m = s._m(kind, c)
        if clip is not None: m = ImageChops.multiply(m, clip)
        base = Image.new('L', m.size, tone)
        s.img.paste(base, (0, 0), m)
        # 넓은 반그늘(디더링으로 표현)
        if shade:
            sh2 = ImageChops.offset(m, -int(rim * 2.4 * K), -int(rim * K * 1.2))
            band = ImageChops.subtract(m, sh2)
            s.img.paste(Image.new('L', m.size, max(0, tone - 42)), (0, 0), band)
        # 그늘: 오른쪽 아래 가장자리
        sh = ImageChops.offset(m, -int(rim * K), -int(rim * K * 0.6))
        dark = ImageChops.subtract(m, sh)
        if shade: s.img.paste(Image.new('L', m.size, max(0, tone - shade)), (0, 0), dark)
        # 빛: 왼쪽 위 가장자리
        hl = ImageChops.offset(m, int(rim * K * 0.8), int(rim * K * 0.8))
        lit = ImageChops.subtract(m, hl)
        if light: s.img.paste(Image.new('L', m.size, min(255, tone + light)), (0, 0), lit)
        s.mask = ImageChops.lighter(s.mask, m)
        return m
    def flat(s, kind, c, tone):
        tone = snap(tone); m = s._m(kind, c); s.img.paste(Image.new('L', m.size, tone), (0, 0), m); s.mask = ImageChops.lighter(s.mask, m); return m
    def line(s, pts, width, tone):
        tone = snap(tone); m = Image.new('L', s.img.size, 0); d = ImageDraw.Draw(m)
        d.line([(x * K, y * K) for x, y in pts], fill=255, width=int(width * K))
        s.img.paste(Image.new('L', m.size, tone), (0, 0), m); s.mask = ImageChops.lighter(s.mask, m)
    def clipbelow(s, y):
        m = Image.new('L', s.img.size, 0); ImageDraw.Draw(m).rectangle([0, 0, s.w * K, y * K], fill=255); return m
    def clipabove(s, y):
        m = Image.new('L', s.img.size, 0); ImageDraw.Draw(m).rectangle([0, y * K, s.w * K, s.h * K], fill=255); return m
    def dot(s, x, y, idx): s.marks.append((x, y, idx))
    def hl(s, x0, x1, y, idx):
        for x in range(x0, x1 + 1): s.marks.append((x, y, idx))
    def vl(s, x, y0, y1, idx):
        for y in range(y0, y1 + 1): s.marks.append((x, y, idx))
    def rows(s, outline=True):
        small = s.img.resize((s.w, s.h), Image.BOX)
        msk = s.mask.resize((s.w, s.h), Image.BOX)
        grid = [[None] * s.w for _ in range(s.h)]
        for y in range(s.h):
            for x in range(s.w):
                if msk.getpixel((x, y)) < 110: continue
                v = small.getpixel((x, y)) / 255
                f = (1 - v) * 3
                t = (BAYER[y % 4][x % 4] + 0.5) / 16
                idx = int(f) + (1 if (f - int(f)) > t else 0)
                grid[y][x] = max(0, min(3, idx))
        if outline:
            out = [r[:] for r in grid]
            for y in range(s.h):
                for x in range(s.w):
                    if grid[y][x] is None: continue
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if not (0 <= nx < s.w and 0 <= ny < s.h) or grid[ny][nx] is None:
                            if not (ny >= s.h): out[y][x] = 3
            grid = out
        for x, y, i in s.marks:
            if 0 <= x < s.w and 0 <= y < s.h: grid[y][x] = i
        return [''.join('.' if v is None else str(v) for v in r) for r in grid]


# ───── 주인공 뒷모습 (48×56) ─────
def hero_back():
    p = Painter(48, 56)
    SK, JK, BG = 255, 0, 170
    # 팔
    p.shape('poly', [(6, 27), (11, 23), (13, 44), (12, 52), (6, 52), (5, 40)], JK, shade=25, light=40)
    p.shape('poly', [(42, 27), (37, 23), (35, 44), (36, 52), (42, 52), (43, 40)], JK, shade=25, light=40)
    p.shape('ell', (5.5, 48, 12, 55), SK, shade=50)
    p.shape('ell', (36, 48, 42.5, 55), SK, shade=50)
    # 몸통(검은 점퍼)
    p.shape('poly', [(9, 25), (15, 20), (33, 20), (39, 25), (38, 56), (10, 56)], JK, shade=25, light=45)
    # 목·깃
    p.shape('rect', (20.5, 14, 27.5, 20), SK, shade=45)
    p.shape('poly', [(17, 19), (24, 22), (31, 19), (30, 22), (24, 24), (18, 22)], 235, shade=40)
    # 멜빵
    p.shape('poly', [(15, 19.5), (18.5, 19.5), (18, 27), (14.5, 27)], 110, shade=40)
    p.shape('poly', [(29.5, 19.5), (33, 19.5), (33.5, 27), (30, 27)], 110, shade=40)
    # 가방
    p.shape('rr', (12.5, 24, 35.5, 50, 4), BG, shade=55, light=40, rim=2.2)
    p.shape('rr', (13.5, 24.5, 34.5, 33.5, 4), 205, shade=45, light=40)
    p.shape('rr', (16.5, 37, 31.5, 48, 2), 150, shade=45, light=35)
    p.flat('rect', (22, 22, 26, 24.5), 80)
    # 바지 윗부분
    p.shape('rect', (12, 52, 36, 56), 95, shade=35)
    # 머리 뒤통수
    p.shape('ell', (16.5, 2.5, 31.5, 18), 70, shade=40, light=35)
    p.shape('ell', (15, 8.5, 18.5, 13.5), SK, shade=40); p.shape('ell', (29.5, 8.5, 33, 13.5), SK, shade=40)
    # 모자(흰 모자, 오른쪽 위로 챙)
    p.shape('poly', [(28, 6.5), (40, 3.5), (41.5, 6.5), (29, 9.5)], 40, shade=20, light=20)
    p.shape('ell', (15.5, 0, 32.5, 15), 245, shade=60, light=10, clip=p.clipbelow(8.6))
    rows_ = None
    # 세부 점
    p.hl(17, 31, 9, 3)               # 모자 띠
    p.hl(22, 26, 8, 2); p.hl(22, 26, 7, 1)  # 뒤 조절끈
    p.vl(24, 1, 6, 1)               # 모자 이음
    p.hl(18, 30, 47, 2)             # 앞주머니 지퍼
    for x in (19, 23, 27): p.dot(x, 14, 3); p.dot(x, 15, 3)  # 머리결
    p.hl(14, 34, 34, 3)             # 덮개 아래선
    p.dot(24, 29, 0); p.dot(24, 30, 0)  # 단추
    return p.rows()


# ───── 상대 트레이너 앞모습 (48×52) ─────
def trainer(kind):
    p = Painter(48, 52)
    SK = 255
    style = {
        'rival':  dict(cloth=150, hair=55, inner=235, tie=False, glasses=False, lanyard=False),
        'leader': dict(cloth=70, hair=60, inner=240, tie=True, glasses=True, lanyard=False),
        'man':    dict(cloth=185, hair=60, inner=240, tie=False, glasses=False, lanyard=True),
        'woman':  dict(cloth=225, hair=75, inner=250, tie=False, glasses=False, lanyard=True),
        'man2':   dict(cloth=95, hair=50, inner=200, tie=False, glasses=True, lanyard=False),
        'aide':   dict(cloth=140, hair=65, inner=240, tie=False, glasses=False, lanyard=True),
    }[kind]
    C = style['cloth']
    # 뒷머리(여성 단발)
    if kind == 'woman':
        p.shape('rr', (13.5, 5, 34.5, 28, 7), style['hair'], shade=30, light=30)
    # 몸
    p.shape('poly', [(5, 52), (7, 32), (14, 25), (34, 25), (41, 32), (43, 52)], C, shade=45, light=35, rim=2)
    # 안쪽 셔츠 V
    p.shape('poly', [(19, 25), (29, 25), (24, 34)], style['inner'], shade=25, light=10)
    if style['tie']:
        p.shape('poly', [(23, 27), (25, 27), (26, 38), (24, 41), (22, 38)], 40, shade=15, light=25)
        # 정장 깃
        p.shape('poly', [(16, 25), (19, 25), (24, 36), (21, 40)], C - 15, shade=20, light=30)
        p.shape('poly', [(32, 25), (29, 25), (24, 36), (27, 40)], C - 15, shade=20, light=30)
    if kind == 'man2':  # 후드 끈
        p.line([(21, 27), (20, 36)], 1, 230); p.line([(27, 27), (28, 36)], 1, 230)
    # 팔(허리에 손)
    AC = max(0, C - 85)
    p.shape('poly', [(7, 32), (3, 42), (9, 49), (13, 46), (10, 41), (12, 35)], AC, shade=40, light=30)
    p.shape('poly', [(41, 32), (45, 42), (39, 49), (35, 46), (38, 41), (36, 35)], AC, shade=40, light=30)
    p.shape('ell', (9, 42.5, 14.5, 48), SK, shade=45); p.shape('ell', (33.5, 42.5, 39, 48), SK, shade=45)
    # 목
    p.shape('rect', (20.5, 20, 27.5, 26), SK - 15, shade=40)
    # 얼굴
    p.shape('ell', (15.5, 5, 32.5, 24), SK, shade=45, light=25)
    p.shape('ell', (13.5, 12.5, 17, 18), SK, shade=40); p.shape('ell', (31, 12.5, 34.5, 18), SK, shade=40)
    # 머리 모양
    H = style['hair']
    if kind == 'rival':
        p.shape('poly', [(15, 13), (14, 6), (17, 7), (17, 1), (21, 5), (24, 0), (27, 5), (31, 1), (31, 7), (34, 6), (33, 13), (30, 9), (24, 10), (18, 9)], H, shade=30, light=40)
    elif kind == 'leader':
        p.shape('poly', [(15, 13), (15, 6), (19, 2.5), (29, 2.5), (33, 6), (33, 12), (30, 7), (23, 6.5), (18, 8.5)], H, shade=30, light=40)
    elif kind == 'woman':
        p.shape('poly', [(15, 16), (15, 7), (19, 3), (29, 3), (33, 7), (33, 16), (31, 9), (26, 7), (20, 8), (17, 10)], H, shade=30, light=40)
    elif kind == 'man2':
        p.shape('ell', (14.5, 2, 33.5, 12), H, shade=25, light=30, clip=p.clipbelow(9.5))
        p.shape('poly', [(15, 9), (33, 9), (34, 11), (14, 11)], 40, shade=10, light=20)
    else:
        p.shape('poly', [(15, 12), (15, 6), (19, 3), (29, 3), (33, 6), (33, 12), (31, 8), (26, 7), (20, 7.5), (17, 9)], H, shade=30, light=40)
        if kind == 'aide':
            p.shape('ell', (21, 0, 27, 4.5), H, shade=25, light=30)
    # 목걸이 신분증
    if style['lanyard']:
        p.line([(19, 25), (23, 33)], 0.8, 70); p.line([(29, 25), (25, 33)], 0.8, 70)
        p.shape('rect', (21.5, 33, 26.5, 39), 240, shade=40, light=10)
    # 얼굴 세부 (점)
    for ex in (20, 27):
        p.vl(ex, 13, 15, 3); p.vl(ex + 1, 13, 15, 3)
        p.dot(ex, 13, 0)
    p.hl(19, 22, 11, 2); p.hl(26, 29, 11, 2)   # 눈썹
    p.dot(24, 17, 2)                           # 코
    p.hl(22, 25, 20, 2)                         # 입
    if kind in ('rival',): p.hl(21, 26, 20, 2); p.dot(21, 19, 2); p.dot(26, 19, 2)  # 씩 웃음
    if style['glasses']:
        for gx in (18, 25):
            p.hl(gx, gx + 5, 12, 3); p.hl(gx, gx + 5, 16, 3); p.vl(gx, 12, 16, 3); p.vl(gx + 5, 12, 16, 3)
        p.hl(23, 25, 13, 3)
    if kind == 'woman': p.dot(20, 19, 1); p.dot(28, 19, 1)  # 볼
    return p.rows()


HD = {'c_player_back': hero_back()}
for k in ('rival', 'leader', 'man', 'woman', 'man2', 'aide'):
    HD[f'tr_{k}'] = trainer(k)

if __name__ == '__main__':
    import sys
    
    from preview import img
    ims = [img(v) for v in HD.values()]
    W_ = sum(i.width for i in ims) + 4 * len(ims); H_ = max(i.height for i in ims)
    sh = Image.new('RGB', (W_, H_), (200, 200, 200)); x = 0
    for i in ims: sh.paste(i, (x, 0)); x += i.width + 4
    sh.resize((sh.width * 4, sh.height * 4), Image.NEAREST).save('hd_preview.png')
    print('ok')
