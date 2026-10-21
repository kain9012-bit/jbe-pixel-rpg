# 전투용 주인공 뒷모습 48x48
from PIL import Image, ImageDraw
import art_mons as AM

class Pic48(AM.Pic):
    def __init__(s):
        s.c = [[None] * 48 for _ in range(48)]
    def _mask(s, fn):
        im = Image.new('1', (48, 48), 0); d = ImageDraw.Draw(im); fn(d)
        return [[im.getpixel((x, y)) for x in range(48)] for y in range(48)]
    def shape(s, fn, fill, outline=3, clip=None):
        m = s._mask(fn)
        if clip: m = [[m[y][x] and clip(x, y) for x in range(48)] for y in range(48)]
        for y in range(48):
            for x in range(48):
                if not m[y][x]: continue
                edge = any(not (0 <= x + dx < 48 and 0 <= y + dy < 48) or not m[y + dy][x + dx] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)))
                s.c[y][x] = outline if (edge and outline is not None) else fill
        return m
    def cut(s, pts):
        m = s._mask(lambda d: d.polygon(pts, fill=1))
        for y in range(48):
            for x in range(48):
                if m[y][x]: s.c[y][x] = None

p = Pic48()
# 몸통(검은 점퍼)
p.poly([(5, 47), (7, 33), (13, 26), (35, 26), (41, 33), (43, 47)], 2)
p.shape(lambda d: d.polygon([(8, 46), (9, 34), (14, 28), (20, 28), (16, 46)], fill=1), 3, None)
p.shape(lambda d: d.polygon([(40, 46), (39, 34), (34, 28), (30, 28), (33, 46)], fill=1), 3, None)
# 오른팔 (발령장을 든 채 앞으로)
p.line([(37, 32), (42, 24)], 7, 3)
p.ell((38, 17, 46, 25), 0)
p.px([(40, 19), (42, 19), (44, 20)], 1)
# 가방 멜빵
p.line([(16, 26), (13, 36)], 3, 1)
p.line([(32, 26), (35, 36)], 3, 1)
# 가방
p.rrect((12, 29, 36, 47), 5, 1)
p.rrect((13, 30, 35, 38), 3, 0)
p.rect((21, 32, 27, 36), 2)
p.px([(23, 33), (24, 33), (25, 33), (25, 34), (25, 35)], 0)
p.rrect((16, 39, 32, 47), 2, 1)
p.hl(17, 31, 42, 2)
p.px([(30, 42), (30, 43)], 3)
# 목·깃
p.rect((19, 21, 29, 27), 0)
p.hl(20, 28, 26, 1)
# 귀
p.ell((11, 13, 15, 19), 0); p.px([(13, 15), (13, 16)], 1)
p.ell((33, 13, 37, 19), 0); p.px([(35, 15), (35, 16)], 1)
# 목
p.rect((20, 22, 28, 26), 1)
# 머리(뒤통수)
p.ell((13, 3, 35, 26), 2)
for (x0, y0) in ((17, 16), (21, 17), (25, 17), (29, 16)):
    p.px([(x0, y0), (x0, y0 + 1), (x0 - 1, y0 + 2), (x0 - 1, y0 + 3), (x0 - 2, y0 + 4)], 3)
p.px([(19, 14), (20, 14), (27, 14), (28, 14), (23, 15), (24, 15)], 1)
p.px([(16, 24), (20, 25), (24, 25), (28, 25), (32, 24)], 3)
# 모자(흰 모자, 오른쪽으로 챙)
p.poly([(30, 8), (44, 5), (46, 9), (31, 13)], 3)
p.px([(33, 9), (36, 8), (39, 7), (42, 6)], 2)
p.ell((12, 0, 36, 24), 0, clip=lambda x, y: y <= 12)
p.vl(24, 1, 10, 1)
p.hl(16, 32, 6, 1)
p.rect((22, 9, 26, 12), 2)
p.hl(22, 26, 10, 1)
p.hl(12, 36, 12, 3)
ROWS = p.rows()

if __name__ == '__main__':
    from preview import img
    im = img(ROWS); im = im.resize((48 * 6, 48 * 6), Image.NEAREST); im.save('back_preview.png')
