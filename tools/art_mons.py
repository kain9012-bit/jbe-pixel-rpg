# 40x40 교행몬 정면 그림 — 도형을 겹쳐 그리고 도형마다 테두리(3)를 둠
from PIL import Image, ImageDraw

S = 40

class Pic:
    def __init__(s):
        s.c = [[None]*S for _ in range(S)]
    def _mask(s, fn):
        im = Image.new('1', (S, S), 0)
        d = ImageDraw.Draw(im)
        fn(d)
        return [[im.getpixel((x, y)) for x in range(S)] for y in range(S)]
    def shape(s, fn, fill, outline=3, clip=None):
        m = s._mask(fn)
        if clip:
            m = [[m[y][x] and clip(x, y) for x in range(S)] for y in range(S)]
        for y in range(S):
            for x in range(S):
                if not m[y][x]:
                    continue
                edge = False
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if not (0 <= nx < S and 0 <= ny < S) or not m[ny][nx]:
                        edge = True
                s.c[y][x] = outline if (edge and outline is not None) else fill
        return m
    def ell(s, b, fill, outline=3, clip=None):
        return s.shape(lambda d: d.ellipse(b, fill=1), fill, outline, clip)
    def rect(s, b, fill, outline=3, clip=None):
        return s.shape(lambda d: d.rectangle(b, fill=1), fill, outline, clip)
    def rrect(s, b, r, fill, outline=3):
        return s.shape(lambda d: d.rounded_rectangle(b, r, fill=1), fill, outline)
    def poly(s, pts, fill, outline=3):
        return s.shape(lambda d: d.polygon(pts, fill=1), fill, outline)
    def line(s, pts, w, fill, outline=3):
        return s.shape(lambda d: d.line(pts, fill=1, width=w), fill, outline)
    def px(s, pts, v):
        for x, y in pts:
            s.c[y][x] = v
    def hl(s, x0, x1, y, v):
        for x in range(x0, x1+1): s.c[y][x] = v
    def vl(s, x, y0, y1, v):
        for y in range(y0, y1+1): s.c[y][x] = v
    def cut(s, pts):
        m = s._mask(lambda d: d.polygon(pts, fill=1))
        for y in range(S):
            for x in range(S):
                if m[y][x]: s.c[y][x] = None
    def rows(s):
        return [''.join('.' if v is None else str(v) for v in r) for r in s.c]

def eyes(p, lx, rx, y, w=3, h=4):
    p.rect((lx, y, lx+w-1, y+h-1), 3, None)
    p.rect((rx, y, rx+w-1, y+h-1), 3, None)
    p.px([(lx, y), (rx, y)], 0)

M = {}

# 001 끄적이 — 수첩 몸통, 머리에 연필
p = Pic()
p.ell((10, 32, 17, 38), 2); p.ell((22, 32, 29, 38), 2)
p.ell((3, 21, 10, 28), 0); p.ell((29, 21, 36, 28), 0)
p.line([(24, 13), (33, 3)], 5, 1)
p.ell((31, 0, 37, 6), 2)
p.rrect((8, 11, 31, 35), 4, 0)
p.rect((28, 13, 30, 33), 1, None); p.hl(10, 30, 33, 1); p.hl(10, 30, 34, 1)
for x in (11, 15, 19, 23, 27):
    p.px([(x, 10), (x+1, 10), (x, 11), (x+1, 12)], 3)
eyes(p, 13, 23, 17, 4, 5)
p.px([(18, 25), (19, 26), (20, 26), (21, 25)], 3)
p.hl(12, 27, 29, 1); p.hl(12, 22, 31, 1)
M['m_kkeut'] = p.rows()

# 004 동전이 — 동전 몸통, 동그란 안경
p = Pic()
p.ell((11, 32, 18, 38), 2); p.ell((22, 32, 29, 38), 2)
p.ell((1, 17, 8, 24), 1); p.ell((32, 17, 39 - 1, 24), 1)
p.ell((5, 3, 34, 34), 1)
p.shape(lambda d: d.ellipse((8, 6, 31, 31), outline=1), 2, None)
p.ell((11, 8, 16, 13), 0, None)
for (x, y) in ((20, 4), (33, 18), (20, 33), (6, 18)):
    pass
p.shape(lambda d: d.ellipse((10, 14, 18, 22), outline=1), 3, None)
p.shape(lambda d: d.ellipse((21, 14, 29, 22), outline=1), 3, None)
p.hl(18, 21, 17, 3)
p.rect((13, 17, 15, 19), 3, None); p.rect((24, 17, 26, 19), 3, None)
p.px([(16, 25), (17, 26), (18, 27), (19, 27), (20, 27), (21, 27), (22, 26), (23, 25)], 3)
p.ell((25, 25, 30, 30), 2, None)
M['m_dongjeon'] = p.rows()

# 007 뚝딱이 — 안전모, 망치
p = Pic()
p.ell((11, 33, 18, 38), 2); p.ell((22, 33, 29, 38), 2)
p.line([(33, 31), (36, 17)], 3, 2)
p.rect((31, 11, 38, 17), 3)
p.ell((3, 23, 10, 30), 0)
p.ell((8, 12, 31, 37), 0)
p.rect((9, 29, 30, 31), 2, None, clip=None)
p.ell((7, 3, 32, 25), 1, clip=lambda x, y: y <= 15)
p.rect((5, 15, 34, 17), 2)
p.vl(19, 4, 14, 0); p.vl(20, 4, 14, 0)
p.ell((29, 23, 36, 30), 0)
p.rect((13, 20, 15, 23), 3, None); p.rect((24, 20, 26, 23), 3, None)
p.px([(13, 20), (24, 20)], 0)
p.hl(12, 16, 19, 3); p.hl(23, 27, 19, 3)
p.hl(18, 21, 26, 3)
M['m_ttukttak'] = p.rows()

# 025 출석이 — 자명종
p = Pic()
p.line([(14, 31), (11, 37)], 3, 2); p.line([(26, 31), (29, 37)], 3, 2)
p.ell((8, 35, 13, 38), 2); p.ell((27, 35, 32, 38), 2)
p.ell((4, 2, 15, 14), 1, clip=lambda x, y: y <= 9)
p.ell((25, 2, 36, 14), 1, clip=lambda x, y: y <= 9)
p.rect((19, 3, 21, 8), 2); p.ell((17, 0, 23, 5), 2)
p.ell((1, 19, 7, 25), 0); p.ell((33, 19, 39 - 1, 25), 0)
p.ell((5, 6, 35, 35), 0)
p.shape(lambda d: d.ellipse((8, 9, 32, 32), outline=1), 1, None)
p.px([(20, 11), (11, 21), (29, 21), (20, 30)], 2)
p.rect((14, 14, 16, 17), 3, None); p.rect((24, 14, 26, 17), 3, None)
p.px([(14, 14), (24, 14)], 0)
p.vl(20, 20, 25, 3); p.hl(20, 25, 25, 3); p.rect((19, 24, 21, 26), 3, None)
M['m_chulseok'] = p.rows()

# 010 포스티 — 메모지
p = Pic()
p.ell((11, 33, 17, 38), 2); p.ell((23, 33, 29, 38), 2)
p.rect((2, 15, 9, 22), 0)
p.rect((7, 7, 33, 34), 1)
p.rect((7, 7, 33, 11), 2)
p.cut([(27, 35), (34, 28), (34, 35)])
p.poly([(27, 34), (27, 28), (33, 28)], 0)
p.rect((30, 2, 37, 9), 0)
p.rect((12, 15, 15, 20), 3, None); p.rect((24, 15, 27, 20), 3, None)
p.px([(12, 15), (13, 15), (24, 15), (25, 15)], 0)
p.ell((18, 23, 21, 27), 3, None)
p.hl(10, 22, 30, 2); p.hl(10, 18, 32, 2)
M['m_posti'] = p.rows()

# 011 칸반이 — 칸반 보드
p = Pic()
p.line([(11, 30), (6, 38)], 3, 2); p.line([(29, 30), (34, 38)], 3, 2); p.line([(20, 30), (20, 38)], 3, 2)
p.rect((2, 5, 37, 31), 0)
p.rect((2, 5, 37, 9), 2)
p.vl(14, 10, 30, 2); p.vl(26, 10, 30, 2)
for b in ((4, 11, 12, 15), (4, 17, 12, 21), (4, 23, 12, 27), (16, 11, 24, 15), (28, 11, 35, 15), (28, 17, 35, 21)):
    p.rect(b, 1)
p.rect((17, 19, 18, 22), 3, None); p.rect((22, 19, 23, 22), 3, None)
p.px([(18, 25), (19, 26), (20, 26), (21, 25)], 3)
M['m_kanban'] = p.rows()

# 013 영수증이 — 영수증 두루마리
p = Pic()
p.ell((14, 34, 19, 38), 2); p.ell((21, 34, 26, 38), 2)
p.line([(13, 21), (5, 26)], 3, 2); p.line([(27, 21), (35, 26)], 3, 2)
p.ell((2, 24, 7, 29), 0); p.ell((33, 24, 38, 29), 0)
p.rect((12, 6, 28, 35), 0)
for x in range(12, 29, 4):
    p.cut([(x + 0.5, 36), (x + 2, 33), (x + 3.5, 36)])
p.rect((10, 2, 30, 8), 1)
p.ell((8, 2, 13, 8), 2)
p.rect((15, 11, 17, 14), 3, None); p.rect((23, 11, 25, 14), 3, None)
p.px([(15, 11), (23, 11)], 0)
p.hl(19, 21, 17, 3)
p.hl(15, 25, 22, 1); p.hl(15, 22, 25, 1); p.hl(15, 24, 28, 1); p.hl(15, 25, 31, 2)
M['m_receipt'] = p.rows()
