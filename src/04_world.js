// ───────── 타일 ─────────
let TILEC = {}, BLDC = {};
const SOLID = new Set(['J', 'Y', 'R', 'A', 'L', 'Z', 'T', 'F', 'S', 'B', 'w', '#', 'W', 'C', 'K', 'P', 'H', 'O', 'E', 'V', 'X', 'Q']);
function tileCanvas(ch, fr) {
  const key = ch + fr;
  if (TILEC[key]) return TILEC[key];
  const c = mkCanvas(16, 16), x = c.getContext('2d');
  const f = (col, a, b, w, h) => { x.fillStyle = PAL[col]; x.fillRect(a, b, w, h); };
  const art = n => x.drawImage(artCanvas(n), 0, 0);
  switch (ch) {
    case '.': case 'B': case 'D': art('t_ground'); break;
    case ',': art('t_path'); break;
    case 'g': art('t_grass'); break;
    case 'T': art('t_tree'); break;
    case 'F': art('t_fence'); break;
    case 'S': art('t_sign'); break;
    case '*': art(fr ? 't_flower1' : 't_flower0'); break;
    case 'w': art('t_water0'); if (fr) { x.save(); x.translate(16, 0); x.scale(-1, 1); x.drawImage(artCanvas('t_water0'), 0, 0); x.restore(); } break;
    case 'X': f(3, 0, 0, 16, 16); break;
    case 'J': // 기와 얹은 돌담
      art('t_ground'); f(3, 0, 1, 16, 4); f(2, 0, 2, 16, 2); for (let i = 1; i < 16; i += 3) f(1, i, 2, 1, 1);
      f(3, 0, 5, 16, 10); 
      for (const [sx, sy, sw, sh] of [[1, 6, 6, 4], [8, 6, 7, 4], [1, 11, 4, 3], [6, 11, 5, 3], [12, 11, 3, 3]]) { f(1, sx, sy, sw, sh); f(0, sx, sy, sw - 1, 1); f(2, sx + 1, sy + sh - 1, sw - 1, 1); }
      f(2, 0, 15, 16, 1); break;
    case ';': // 박석
      f(1, 0, 0, 16, 16);
      for (const [sx, sy, sw, sh] of [[0, 0, 7, 5], [8, 0, 8, 4], [0, 6, 5, 5], [6, 5, 6, 6], [13, 5, 3, 6], [0, 12, 9, 4], [10, 12, 6, 4]]) { f(0, sx, sy, sw - 1, sh - 1); f(2, sx + sw - 1, sy, 1, sh); f(2, sx, sy + sh - 1, sw, 1); }
      break;
    case 'Y': // 소나무
      art('t_ground');
      f(3, 7, 0, 2, 1); f(3, 5, 1, 6, 1); f(2, 6, 1, 4, 1);
      f(3, 3, 2, 10, 4); f(2, 4, 2, 8, 3); f(1, 5, 2, 2, 1);
      f(3, 1, 6, 14, 5); f(2, 2, 6, 12, 4); f(1, 3, 6, 3, 1); f(1, 9, 7, 2, 1);
      f(3, 6, 11, 4, 4); f(2, 7, 11, 2, 4); f(3, 4, 15, 8, 1); break;
    case 'R': // 바위
      art('t_ground'); f(3, 2, 5, 12, 10); f(3, 4, 3, 7, 2); f(1, 3, 6, 10, 8); f(1, 5, 4, 5, 2); f(0, 4, 5, 3, 2); f(2, 9, 9, 4, 4); f(2, 3, 13, 10, 1); f(3, 2, 15, 12, 1); break;
    case 'U': // 밭고랑
      f(1, 0, 0, 16, 16); for (let yy = 1; yy < 16; yy += 4) { f(2, 0, yy, 16, 1); f(0, 0, yy + 1, 16, 1); for (let i = (yy * 3) % 5; i < 16; i += 5) f(3, i, yy - 1, 1, 1); } break;
    case 'A': // 산
      f(0, 0, 0, 16, 16); f(3, 0, 4, 16, 12); f(2, 1, 5, 14, 11);
      for (let i = 0; i < 8; i++) { f(3, 8 - i, i, 2 * i, 1); }
      f(2, 4, 4, 8, 1); f(1, 6, 2, 3, 1); f(1, 3, 7, 3, 1); f(1, 10, 9, 3, 1); f(1, 5, 11, 2, 1); f(3, 0, 15, 16, 1); break;
    case 'L':
      art('t_ground');
      for (let i = 1; i < 16; i += 4) { f(2, i, 8, 1, 2); f(2, i + 1, 9, 1, 1); }
      f(3, 0, 10, 16, 1); f(2, 0, 11, 16, 2); for (let i = 2; i < 16; i += 5) f(1, i, 12, 2, 1); f(3, 0, 13, 16, 1); f(1, 0, 14, 16, 1); break;
    case 'Z':
      f(3, 0, 0, 16, 16); for (let i = 0; i < 4; i++) { f(1, 1, 1 + i * 4, 14, 3); f(0, 1, 1 + i * 4, 14, 1); } f(3, 0, 0, 1, 16); f(3, 15, 0, 1, 16); break;
    default:
      if (ch === '_' || ch === 'M' || ch[0] === 'K' || 'POVEQ'.includes(ch)) {
        // 마룻바닥
        f(0, 0, 0, 16, 16); f(1, 0, 15, 16, 1); f(1, 15, 0, 1, 15);
        f(1, 4, 4, 1, 1); f(1, 11, 9, 1, 1); f(1, 7, 12, 1, 1);
      }
      if (ch === '_') break;
      if (ch === '#' || ch === 'W') {
        f(1, 0, 0, 16, 10); for (let yy = 1; yy < 10; yy += 4) for (let i = (yy % 8 === 1 ? 1 : 5); i < 16; i += 8) { f(0, i + 1, yy, 1, 1); f(0, i, yy + 1, 3, 1); f(0, i + 1, yy + 2, 1, 1); }
        f(3, 0, 10, 16, 1); f(2, 0, 11, 16, 4); for (let i = 3; i < 16; i += 4) f(3, i, 11, 1, 4); f(1, 0, 11, 16, 1);
        f(3, 0, 15, 16, 1);
        if (ch === 'W') { f(3, 2, 1, 12, 9); f(0, 3, 2, 10, 7); f(1, 3, 2, 10, 1); f(1, 3, 2, 1, 7); f(3, 7, 2, 2, 7); f(3, 3, 5, 10, 1); f(1, 10, 3, 1, 1); f(1, 11, 4, 1, 1); f(0, 2, 10, 12, 1); }
        break;
      }
      if (ch === 'H') {
        f(3, 0, 0, 16, 16); f(2, 1, 1, 14, 14); f(3, 1, 7, 14, 1);
        const books = [[0, 1], [1, 2], [0, 1], [2, 3], [0, 1], [1, 2], [3, 1]];
        let bx = 2;
        for (let i = 0; i < 6; i++) { const [c1, t] = books[i]; f(c1 === 3 ? 1 : c1, bx, 1 + t, 2, 6 - t); bx += 2; }
        bx = 2;
        for (let i = 0; i < 6; i++) { const [c1, t] = books[(i + 3) % 7]; f(c1 === 3 ? 0 : (c1 + 1) % 3, bx, 8 + t, 2, 7 - t); bx += 2; }
        f(3, 1, 15, 14, 1);
        break;
      }
      if (ch === 'C') {
        f(3, 0, 0, 16, 1); f(0, 0, 1, 16, 4); f(1, 0, 4, 16, 1); f(3, 0, 5, 16, 1);
        f(1, 0, 6, 16, 9); for (let i = 3; i < 16; i += 8) { f(2, i, 7, 1, 7); f(0, i + 1, 7, 1, 7); }
        f(2, 0, 14, 16, 1); f(3, 0, 15, 16, 1); break;
      }
      if (ch === 'P') {
        f(3, 2, 0, 12, 9); f(1, 3, 1, 10, 6); f(0, 4, 2, 2, 1); f(2, 7, 3, 4, 1); f(2, 7, 5, 3, 1); f(3, 7, 9, 2, 1);
        f(3, 0, 10, 16, 1); f(1, 0, 11, 16, 2); f(0, 4, 11, 8, 1); f(3, 0, 13, 16, 1); f(3, 1, 14, 2, 2); f(3, 13, 14, 2, 2); break;
      }
      if (ch === 'V') {
        f(3, 4, 0, 1, 2); f(3, 11, 0, 1, 2); f(3, 1, 2, 14, 9); f(2, 2, 3, 12, 7); f(1, 3, 4, 8, 5); f(0, 4, 5, 2, 1); f(0, 12, 5, 1, 1); f(0, 12, 7, 1, 1);
        f(3, 1, 11, 14, 5); f(2, 2, 12, 12, 3); f(1, 3, 13, 4, 1); f(1, 9, 13, 4, 1); break;
      }
      if (ch === 'O') {
        const ell = (cx, cy, rx, ry, col) => { for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) if ((xx * xx) / (rx * rx + 0.5) + (yy * yy) / (ry * ry + 0.5) <= 1) f(col, cx + xx, cy + yy, 1, 1); };
        ell(4, 7, 3, 2, 3); ell(4, 7, 2, 1, 1); ell(11, 7, 3, 2, 3); ell(11, 7, 2, 1, 1); ell(8, 4, 2, 4, 3); ell(8, 4, 1, 3, 1); f(2, 8, 2, 1, 6);
        f(3, 3, 10, 10, 2); f(1, 4, 10, 8, 1); f(3, 4, 12, 8, 4); f(2, 5, 12, 6, 3); f(1, 5, 12, 1, 3); break;
      }
      if (ch === 'M') { f(3, 1, 2, 14, 12); f(2, 2, 3, 12, 10); for (const yy of [5, 8, 11]) for (let i = 3; i < 13; i += 3) f(1, i, yy, 2, 1); break; }
      if (ch === 'E') { f(3, 0, 0, 16, 16); f(2, 1, 1, 14, 2); f(3, 1, 3, 14, 1); f(0, 2, 4, 12, 4); f(1, 3, 6, 10, 1); f(3, 1, 8, 14, 1); f(1, 1, 9, 14, 6); f(0, 1, 9, 14, 1); f(2, 1, 14, 14, 1); break; }
      if (ch === 'Q') { f(3, 3, 11, 10, 5); f(2, 4, 12, 8, 3); f(3, 5, 1, 6, 10); f(1, 6, 2, 4, 8); f(0, 7, 3, 1, 2); break; }
      if (ch[0] === 'K') {
        const l = ch.includes('l'), r = ch.includes('r'), u = ch.includes('u'), d = ch.includes('d');
        const top = u ? 0 : 2, bot = d ? 16 : 10;
        f(1, 0, top, 16, bot - top); for (let yy = top + 2; yy < bot; yy += 3) f(2, (yy * 5) % 11, yy, 4, 1);
        f(0, 0, top, 16, 1);
        if (!u) f(3, 0, top, 16, 1);
        if (!l) f(3, 0, top, 1, bot - top);
        if (!r) f(3, 15, top, 1, bot - top);
        if (!d) { f(3, 0, 10, 16, 1); f(2, 0, 11, 16, 2); f(3, 0, 13, 16, 1); if (!l) { f(3, 0, 11, 1, 2); f(3, 1, 14, 2, 2); } if (!r) { f(3, 15, 11, 1, 2); f(3, 13, 14, 2, 2); } }
        break;
      }
      if (!'_MKPOVEQ#WHC'.includes(ch[0])) art('t_ground');
  }
  TILEC[key] = c;
  return c;
}

// ───────── 건물 ─────────
const BKIND = {
  house: { w: 4, h: 3, door: 1, roof: 2, hi: 1 },
  lab: { w: 6, h: 3, door: 2, roof: 1, hi: 0, label: '연구소' },
  rest: { w: 4, h: 3, door: 2, roof: 3, hi: 2, label: '쉼터' },
  shop: { w: 4, h: 3, door: 1, roof: 1, hi: 0, label: '매점' },
  office: { w: 6, h: 4, door: 2, roof: 2, hi: 1 },
};
function bldCanvas(b) {
  const key = b.k + '|' + (b.label || '') + '|' + (b.style || '');
  if (BLDC[key]) return BLDC[key];
  if (b.style === 'hanok' || b.style === 'mountain') { BLDC[key] = bldRegional(b); return BLDC[key]; }
  const K = BKIND[b.k], w = K.w * 16, h = K.h * 16;
  const c = mkCanvas(w, h), x = c.getContext('2d');
  const f = (col, a, bb, ww, hh) => { x.fillStyle = PAL[col]; x.fillRect(a, bb, ww, hh); };
  const RH = 30; // 지붕 높이
  // 지붕: 기와 줄
  f(3, 0, 1, w, RH);
  f(K.roof, 1, 2, w - 2, RH - 3);
  f(K.hi, 2, 2, w - 4, 1);
  for (let band = 0, yy = 4; yy < RH - 7; band++, yy += 4) {
    f(3, 1, yy, w - 2, 1);
    for (let xx = (band % 2 ? 5 : 1); xx < w - 1; xx += 8) { f(3, xx, yy + 1, 1, 3); f(K.hi, xx + 1, yy + 1, 1, 1); }
  }
  // 처마
  f(3, 0, RH - 7, w, 1); f(K.roof === 3 ? 2 : 3, 0, RH - 6, w, 3);
  for (let xx = 3; xx < w - 2; xx += 6) f(K.roof === 3 ? 3 : 2, xx, RH - 6, 2, 3);
  f(3, 0, RH - 3, w, 1);
  // 벽
  f(3, 1, RH - 2, w - 2, h - RH + 2); f(0, 2, RH - 2, w - 4, h - RH + 1);
  f(2, 2, RH - 2, w - 4, 1);
  for (let yy = RH + 2; yy < h - 2; yy += 3) f(1, 2, yy, w - 4, 1);
  f(2, 2, h - 2, w - 4, 1); f(3, 1, h - 1, w - 2, 1);
  const win = (wx, wy) => { f(3, wx, wy, 12, 10); f(0, wx + 1, wy + 1, 10, 8); f(1, wx + 1, wy + 1, 10, 4); f(3, wx + 5, wy + 1, 2, 8); f(3, wx + 1, wy + 4, 10, 1); f(0, wx + 2, wy + 2, 2, 1); f(2, wx - 1, wy + 10, 14, 1); };
  const dx = K.door * 16;
  const wy = h - 13;
  for (let tx = 0; tx < K.w; tx++) {
    if (tx === K.door) continue;
    if ((K.label || b.label) && Math.abs(tx - K.door) === 1 && b.k !== 'house') continue;
    win(tx * 16 + 2, wy);
  }
  if (b.k === 'office') for (let tx = 0; tx < K.w; tx++) { if (Math.abs(tx - K.door) <= 1) continue; win(tx * 16 + 2, RH + 2); }
  // 문
  f(3, dx + 2, h - 15, 12, 15); f(2, dx + 3, h - 14, 10, 13); f(1, dx + 4, h - 13, 3, 5); f(1, dx + 9, h - 13, 3, 5); f(1, dx + 4, h - 6, 8, 4); f(0, dx + 11, h - 8, 1, 2);
  f(1, dx + 1, h - 1, 14, 1);
  // 굴뚝·깃발
  if (b.k === 'house') { f(3, w - 14, 0, 6, 6); f(2, w - 13, 0, 4, 5); f(1, w - 13, 0, 4, 1); }
  if (b.k === 'office') { f(3, w / 2, 0, 1, 2); }
  // 간판
  const label = b.label || K.label;
  if (label) {
    const tw = textW(label), pw = tw + 8;
    const py0 = b.k === 'office' ? RH + 3 : RH - 15;
    const ppx = clamp(Math.round(dx + 8 - pw / 2), 2, w - pw - 2);
    f(3, ppx, py0, pw, 13); f(0, ppx + 1, py0 + 1, pw - 2, 11); f(1, ppx + 1, py0 + 11, pw - 2, 1);
    drawText(label, ppx + 4, py0 + 2, 3, x);
  }
  BLDC[key] = c;
  return c;
}

// 한옥(전주·완산) / 산골 초가(완주·진안·무주)
function bldRegional(b) {
  const K = BKIND[b.k], w = K.w * 16, h = K.h * 16;
  const c = mkCanvas(w, h), x = c.getContext('2d');
  const f = (col, a, bb, ww, hh) => { if (ww <= 0 || hh <= 0) return; x.fillStyle = PAL[col]; x.fillRect(a, bb, ww, hh); };
  const RH = 28, hanok = b.style === 'hanok';
  const dx = K.door * 16;
  // ── 벽 ──
  const wallTop = RH - 2, baseY = h - 4;
  if (hanok) {
    f(0, 2, wallTop, w - 4, baseY - wallTop);
    for (let tx = 0; tx <= K.w; tx++) f(2, clamp(tx * 16 - 1, 2, w - 4), wallTop, 2, baseY - wallTop);
    f(2, 2, wallTop + 2, w - 4, 2);
    if (b.k === 'office') f(2, 2, wallTop + 18, w - 4, 2);
  } else {
    f(1, 2, wallTop, w - 4, baseY - wallTop);
    for (let yy = wallTop + 3; yy < baseY; yy += 4) for (let xx = 4 + (yy % 8); xx < w - 4; xx += 8) f(2, xx, yy, 1, 1);
    for (let tx = 0; tx <= K.w; tx++) f(3, clamp(tx * 16 - 1, 2, w - 4), wallTop, 2, baseY - wallTop);
  }
  f(3, 1, wallTop, 1, baseY - wallTop); f(3, w - 2, wallTop, 1, baseY - wallTop);
  // 기단(돌)
  f(3, 0, baseY - 1, w, 1); f(1, 0, baseY, w, 4); f(3, 0, h - 1, w, 1);
  for (let xx = 2; xx < w; xx += 7) f(2, xx, baseY + 1, 1, 2);
  // 창
  const win = (wx, wy) => {
    if (hanok) { f(2, wx, wy, 12, 11); f(0, wx + 1, wy + 1, 10, 9); for (let i = 3; i < 11; i += 3) f(1, wx + i, wy + 1, 1, 9); for (let j = 3; j < 10; j += 3) f(1, wx + 1, wy + j, 10, 1); }
    else { f(3, wx + 1, wy + 1, 10, 9); f(0, wx + 2, wy + 2, 8, 7); f(2, wx + 5, wy + 2, 2, 7); f(2, wx + 2, wy + 5, 8, 1); }
  };
  const wy = h - 17;
  for (let tx = 0; tx < K.w; tx++) {
    if (tx === K.door) continue;
    if ((K.label || b.label) && Math.abs(tx - K.door) === 1 && b.k !== 'house') continue;
    win(tx * 16 + 2, wy);
  }
  if (b.k === 'office') for (let tx = 0; tx < K.w; tx++) { if (Math.abs(tx - K.door) <= 1) continue; win(tx * 16 + 2, RH + 4); }
  // 문
  if (hanok) { f(3, dx + 1, h - 18, 14, 14); f(2, dx + 2, h - 17, 12, 13); f(1, dx + 3, h - 16, 4, 6); f(1, dx + 9, h - 16, 4, 6); f(3, dx + 7, h - 17, 2, 13); f(0, dx + 6, h - 9, 1, 2); f(0, dx + 9, h - 9, 1, 2); }
  else { f(3, dx + 2, h - 18, 12, 14); f(2, dx + 3, h - 17, 10, 13); for (let i = 5; i < 13; i += 3) f(3, dx + i, h - 17, 1, 13); f(0, dx + 11, h - 10, 1, 2); }
  // ── 지붕 ──
  if (hanok) {
    // 처마 끝이 들린 기와지붕
    const lift = xx => { const e = Math.min(xx, w - 1 - xx); return e < 6 ? Math.round((6 - e) * 0.8) : 0; };
    for (let xx = 0; xx < w; xx++) {
      const top = 5 + Math.round(Math.max(0, 4 - Math.min(xx, w - 1 - xx)) * 0.5), bot = RH - 3 - lift(xx);
      f(2, xx, top, 1, bot - top);
      if (xx % 3 === 0) f(3, xx, top, 1, bot - top);
      f(3, xx, bot, 1, 2); f(xx % 4 < 2 ? 1 : 3, xx, bot - 1, 1, 1);
    }
    // 용마루
    f(3, 4, 1, w - 8, 5); f(1, 5, 2, w - 10, 2); f(3, 2, 0, 3, 3); f(3, w - 5, 0, 3, 3);
    // 처마 그늘
    f(3, 2, RH - 2, w - 4, 1); f(2, 2, RH - 1, w - 4, 1);
  } else {
    // 둥근 초가지붕
    for (let xx = 0; xx < w; xx++) {
      const e = Math.min(xx, w - 1 - xx);
      const top = Math.max(2, 10 - Math.round(Math.sqrt(Math.max(0, e)) * 3)), bot = RH - 2 + ((xx * 7) % 3 === 0 ? 1 : 0);
      f(1, xx, top, 1, bot - top);
      f(3, xx, top, 1, 1); f(3, xx, bot, 1, 1);
      for (let yy = top + 2; yy < bot; yy += 3) if ((xx + yy) % 5 === 0) f(2, xx, yy, 1, 2);
    }
    for (let k = 0; k < w + 20; k += 9) for (let yy = 4; yy < RH - 2; yy++) { const xx = k - (yy >> 1); if (xx >= 0 && xx < w && x.getImageData(xx, yy, 1, 1).data[3]) f(2, xx, yy, 1, 1); }
  }
  // 현판
  const label = b.label || K.label;
  if (label) {
    const tw = textW(label), pw = tw + 8;
    const py0 = b.k === 'office' ? RH + 3 : RH - 1;
    const ppx = clamp(Math.round(dx + 8 - pw / 2), 2, w - pw - 2);
    if (hanok) { f(2, ppx - 1, py0 - 1, pw + 2, 15); f(3, ppx, py0, pw, 13); drawText(label, ppx + 4, py0 + 2, 0, x); }
    else { f(3, ppx, py0, pw, 13); f(1, ppx + 1, py0 + 1, pw - 2, 11); drawText(label, ppx + 4, py0 + 2, 3, x); }
  }
  return c;
}

// ───────── 지도 ─────────
const MAPS = {};
function defMap(id, o) {
  const rows = o.rows;
  const w = rows[0].length;
  rows.forEach((r, i) => { if (r.length !== w) throw new Error(`지도 ${id} ${i}행 길이 ${r.length}≠${w}`); });
  const m = Object.assign({ id, w, h: rows.length, out: true, music: 'town', npcs: [], signs: {}, warps: {}, edges: {}, buildings: [] }, o);
  m.grid = rows.map(r => r.split(''));
  for (const b of m.buildings) {
    b.style = b.style || m.style;
    const K = BKIND[b.k];
    for (let yy = 0; yy < K.h; yy++) for (let xx = 0; xx < K.w; xx++) m.grid[b.y + yy][b.x + xx] = 'B';
    const d = [b.x + K.door, b.y + K.h - 1];
    m.grid[d[1]][d[0]] = 'D';
    if (b.to) m.warps[d.join(',')] = { to: b.to, door: true };
    b.doorPos = d;
  }
  MAPS[id] = m;
  return m;
}
function curMap() { return MAPS[G.S.map]; }

function tileAt(m, x, y) {
  if (x >= 0 && y >= 0 && x < m.w && y < m.h) return { ch: m.grid[y][x], m, x, y };
  let dir = null;
  if (y < 0 && x >= 0 && x < m.w) dir = 'n'; else if (y >= m.h && x >= 0 && x < m.w) dir = 's';
  else if (x < 0 && y >= 0 && y < m.h) dir = 'w'; else if (x >= m.w && y >= 0 && y < m.h) dir = 'e';
  const e = dir && m.edges[dir];
  if (e) {
    const m2 = MAPS[e[0]], off = e[1] || 0;
    let nx, ny;
    if (dir === 'n') { nx = x + off; ny = m2.h + y; }
    if (dir === 's') { nx = x + off; ny = y - m.h; }
    if (dir === 'w') { nx = m2.w + x; ny = y + off; }
    if (dir === 'e') { nx = x - m.w; ny = y + off; }
    if (nx >= 0 && ny >= 0 && nx < m2.w && ny < m2.h) return { ch: m2.grid[ny][nx], m: m2, x: nx, y: ny, dir };
  }
  return { ch: m.out ? 'T' : 'X', m: null };
}

// ───────── 인물 ─────────
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
class Ent {
  constructor(o) { Object.assign(this, { x: 0, y: 0, dir: 'down', ox: 0, oy: 0, mv: null, par: 0, ch: 'man', hide: false }, o); }
  get busy() { return !!this.mv; }
  startMove(dir, len = 16) {
    const [dx, dy] = DIRV[dir], n = len / 16;
    this.dir = dir; this.x += dx * n; this.y += dy * n; this.ox = -dx * len; this.oy = -dy * len;
    this.mv = { dx, dy, t: 0, len }; this.par ^= 1;
  }
  tickMove(spd = 2) {
    if (!this.mv) return false;
    const L = this.mv.len || 16;
    this.mv.t += spd;
    this.ox = -this.mv.dx * (L - this.mv.t); this.oy = -this.mv.dy * (L - this.mv.t);
    this.hop = L > 16 ? Math.round(Math.sin(Math.min(1, this.mv.t / L) * Math.PI) * 8) : 0;
    if (this.mv.t >= L) { this.mv = null; this.ox = this.oy = 0; this.hop = 0; return true; }
    return false;
  }
  draw(cx, cy) {
    if (this.hide) return;
    const sx = this.x * 16 + this.ox - cx, sy = this.y * 16 + this.oy - cy - 4 - (this.hop || 0);
    if (sx < -16 || sy < -32 || sx > W || sy > H) return;
    if (this.hop) { ctx.fillStyle = PAL[2]; ctx.fillRect(sx + 4, sy + this.hop + 15, 8, 2); }
    if (this.ch === 'envelope') { ctx.drawImage(artCanvas('t_envelope'), sx, sy + 4); return; }
    const walking = this.mv && (this.mv.len > 16 ? this.mv.t < 16 : this.mv.t < 8);
    let name, flip = false;
    if (this.dir === 'down' || this.dir === 'up') { name = `c_${this.ch}_${this.dir}${walking ? 1 : 0}`; flip = walking && this.par === 1; }
    else { name = `c_${this.ch}_side${walking ? 1 : 0}`; flip = this.dir === 'right'; }
    const img = artCanvas(name, flip);
    if (img) ctx.drawImage(img, sx, sy);
    if (this.bubble) { box(sx + 1, sy - 15, 14, 14); drawText('!', sx + 6, sy - 12); }
  }
}

// ───────── 바깥 장면 ─────────
const OW = {
  P: null, npcs: [], cam: [0, 0], turnHold: 0, stepCount: 0,
  load(id, x, y, dir) {
    G.S.map = id; G.S.x = x; G.S.y = y; G.S.dir = dir || G.S.dir || 'down';
    const m = MAPS[id];
    this.P = new Ent({ x, y, dir: G.S.dir, ch: 'player' });
    this.npcs = m.npcs.filter(d => !d.show || d.show()).map(d => new Ent({ def: d, x: d.x, y: d.y, dir: d.dir || 'down', ch: d.ch || 'man', hx: d.x, hy: d.y, wt: rnd(60, 200) }));
    playMusic(m.music);
    this.showName(m);
    if (m.onEnter) run(() => m.onEnter());
  },
  showName(m) {
    if (m.region) { G.S.visited = G.S.visited || {}; G.S.visited[m.region] = 1; }
    if (m.out && m.name && this.lastName !== m.name) { this.banner = { text: m.name, t: 150 }; }
    if (m.out) this.lastName = m.name;
  },
  refreshNpcs() {
    const m = curMap();
    const keep = new Map(this.npcs.map(n => [n.def, n]));
    this.npcs = m.npcs.filter(d => !d.show || d.show()).map(d => keep.get(d) || new Ent({ def: d, x: d.x, y: d.y, dir: d.dir || 'down', ch: d.ch || 'man', hx: d.x, hy: d.y, wt: rnd(60, 200) }));
  },
  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y && !n.hide); },
  npc(id) { return this.npcs.find(n => n.def.id === id); },
  passable(x, y, who) {
    const m = curMap(), t = tileAt(m, x, y);
    if (!t.m) return false;
    if (SOLID.has(t.ch)) return false;
    if (t.ch === 'D') { const w = t.m.warps[t.x + ',' + t.y]; if (!w || w.locked) return false; }
    if (t.m === m && this.npcAt(x, y)) return false;
    if (who !== this.P && this.P.x === x && this.P.y === y) return false;
    return true;
  },
  update() {
    const P = this.P;
    if (G.lock || P.mv) return;
    if (PRESS.start) { sfx('sel'); run(startMenu); return; }
    if (PRESS.a) { this.interact(); return; }
    for (const d of ['up', 'down', 'left', 'right']) {
      if (!BTN[d]) continue;
      if (PRESS[d] && P.dir !== d) { P.dir = d; this.turnHold = 5; return; }
      if (P.dir !== d && !PRESS[d]) P.dir = d;
      if (this.turnHold > 0) { this.turnHold--; return; }
      this.tryMove(d);
      return;
    }
    this.turnHold = 0;
  },
  tryMove(d) {
    const P = this.P, m = curMap();
    const here = m.grid[P.y] && m.grid[P.y][P.x];
    if (here === 'M' && d === 'down' && m.exit) { run(() => exitMat()); return; }
    const [dx, dy] = DIRV[d];
    const ahead = tileAt(m, P.x + dx, P.y + dy);
    if (ahead.ch === 'L' && d === 'down' && this.passable(P.x, P.y + 2, P)) { sfx('jump'); P.startMove('down', 32); return; }
    if (this.passable(P.x + dx, P.y + dy, P)) { P.startMove(d); }
    else { P.dir = d; if (G.frame - (this.bumpT || 0) > 16) { sfx('bump'); this.bumpT = G.frame; } }
  },
  tick() {
    const P = this.P; if (!P) return;
    if (P.tickMove(2)) this.afterStep();
    for (const n of this.npcs) {
      if (n.tickMove(n.spd || 2)) continue;
      if (G.lock || n.mv || n.def.trainer && !trDone(n.def.trainer)) continue;
      if (n.def.move === 'wander' || n.def.move === 'turn') {
        if (--n.wt > 0) continue;
        n.wt = rnd(80, 220);
        const d = ['up', 'down', 'left', 'right'][rnd(0, 3)];
        if (n.def.move === 'turn') { n.dir = d; continue; }
        const [dx, dy] = DIRV[d], nx = n.x + dx, ny = n.y + dy;
        if (Math.abs(nx - n.hx) <= 2 && Math.abs(ny - n.hy) <= 2 && this.passable(nx, ny, n) && !SOLID.has('D') && curMap().grid[ny] && curMap().grid[ny][nx] !== 'D' && curMap().grid[ny][nx] !== 'M') n.startMove(d);
        else n.dir = d;
      }
    }
    const cx = P.x * 16 + P.ox - 64, cy = P.y * 16 + P.oy - 64;
    this.cam = [cx, cy];
  },
  afterStep() {
    const P = this.P;
    let m = curMap();
    // 가장자리 넘어감
    if (P.x < 0 || P.y < 0 || P.x >= m.w || P.y >= m.h) {
      const t = tileAt(m, P.x, P.y);
      G.S.map = t.m.id; P.x = t.x; P.y = t.y;
      m = t.m;
      this.npcs = m.npcs.filter(d => !d.show || d.show()).map(d => new Ent({ def: d, x: d.x, y: d.y, dir: d.dir || 'down', ch: d.ch || 'man', hx: d.x, hy: d.y, wt: rnd(60, 200) }));
      playMusic(m.music);
      this.showName(m);
      if (m.onEnter) run(() => m.onEnter());
    }
    G.S.x = P.x; G.S.y = P.y; G.S.dir = P.dir;
    if (G.lock) return;
    if (G.S.repel > 0) { G.S.repel--; if (!G.S.repel) run(() => say('부재중 표시의 효과가 끝났다.')); }
    const ch = m.grid[P.y][P.x], key = P.x + ',' + P.y;
    if (ch === 'D' && m.warps[key]) { run(() => enterDoor(m.warps[key])); return; }
    if (ch === 'M' && P.dir === 'down' && m.exit) { run(() => exitMat()); return; }
    if (m.onStep && m.onStep(P.x, P.y)) return;
    if (this.checkTrainers()) return;
    if (ch === 'g' && m.wild && chance(1 / 10)) {
      const pick = pickWild(m.wild);
      if (G.S.repel > 0 && pick[1] < leadLevel()) return;
      run(() => wildBattle(pick[0], pick[1]));
    }
  },
  checkTrainers() {
    const P = this.P;
    for (const n of this.npcs) {
      const tr = n.def.trainer;
      if (!tr || trDone(tr)) continue;
      const [dx, dy] = DIRV[n.dir];
      for (let k = 1; k <= (tr.sight ?? 4); k++) {
        const x = n.x + dx * k, y = n.y + dy * k;
        if (x === P.x && y === P.y) { run(() => trainerSpot(n, k - 1)); return true; }
        if (!this.passable(x, y, n)) break;
      }
    }
    return false;
  },
  interact() {
    const P = this.P, m = curMap();
    const [dx, dy] = DIRV[P.dir];
    let tx = P.x + dx, ty = P.y + dy;
    let n = this.npcAt(tx, ty);
    const t = tileAt(m, tx, ty);
    if (!n && t.ch === 'C') { n = this.npcAt(tx + dx, ty + dy); }
    if (n) { run(() => talkTo(n)); return; }
    if (t.m !== m) return;
    const key = tx + ',' + ty;
    if (t.ch === 'D' && m.warps[key] && m.warps[key].locked) { run(() => say(m.warps[key].locked)); return; }
    if (m.signs[key]) { const s = m.signs[key]; run(async () => { if (typeof s === 'function') await s(); else await say(s); }); return; }
    const txt = { H: '업무 관련 책이 빽빽하게 꽂혀 있다.', P: '인력풀 단말이다. 아직 준비 중인 것 같다.', V: '텔레비전에서 교행몬 뉴스가 나오고 있다.', E: '푹신해 보이는 침대다.', Q: '교행몬 모양의 동상이다.', Z: '2층으로 가는 계단이다. 지금은 올라갈 일이 없다.' }[t.ch];
    if (txt) run(() => say(txt));
  },
  draw() {
    const m = curMap(); if (!m) return;
    const [cx, cy] = this.cam;
    const fr = (G.frame >> 5) & 1;
    const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
    for (let ty = y0; ty <= y0 + 10; ty++) for (let tx = x0; tx <= x0 + 11; tx++) {
      const t = tileAt(m, tx, ty);
      let ch = t.ch;
      if (ch === 'K') { const isK = (a, b) => tileAt(m, a, b).ch === 'K'; ch = 'K' + (isK(tx - 1, ty) ? 'l' : '') + (isK(tx + 1, ty) ? 'r' : '') + (isK(tx, ty - 1) ? 'u' : '') + (isK(tx, ty + 1) ? 'd' : ''); }
      ctx.drawImage(tileCanvas(ch, (ch === '*' || ch === 'w') ? fr : 0), tx * 16 - cx, ty * 16 - cy);
    }
    for (const b of m.buildings) ctx.drawImage(bldCanvas(b), b.x * 16 - cx, b.y * 16 - cy);
    const ents = [...this.npcs, this.P].sort((a, b) => (a.y * 16 + a.oy) - (b.y * 16 + b.oy));
    for (const e of ents) {
      e.draw(cx, cy);
      if (e.ch !== 'envelope' && !e.hide) {
        const tt = tileAt(m, e.x, e.y);
        if (tt.ch === 'g' && (!e.mv || e.mv.t > 6)) {
          const g = tileCanvas('g', 0);
          ctx.drawImage(g, 0, 10, 16, 6, e.x * 16 + e.ox - cx, e.y * 16 + e.oy - cy + 10, 16, 6);
        }
      }
    }
    if (this.banner && this.banner.t > 0) {
      this.banner.t--;
      const tw = textW(this.banner.text) + 16;
      const k = this.banner.t, off = k > 140 ? -(k - 140) * 3 : (k < 10 ? -(10 - k) * 3 : 0);
      box(4, 4 + off, tw, 22); drawText(this.banner.text, 12, 10 + off);
    }
  },
};
function pickWild(w) {
  const tot = w.reduce((s, e) => s + e[3], 0);
  let r = Math.random() * tot;
  for (const e of w) { r -= e[3]; if (r <= 0) return [e[0], rnd(e[1], e[2])]; }
  const e = w[0]; return [e[0], e[1]];
}
function leadLevel() { const m = G.S.party.find(p => p.hp > 0); return m ? m.lv : 1; }
function trDone(tr) { return !!G.S.flags['tr_' + tr.id]; }

// ───────── 스크립트 ─────────
async function run(fn) {
  G.lock++;
  try { await fn(); } catch (e) { console.error(e); }
  finally { G.lock--; }
}
async function talkTo(n) {
  const d = n.def;
  if (n.ch !== 'envelope' && !d.noTurn) n.dir = OPP[OW.P.dir];
  if (d.trainer && !trDone(d.trainer)) { await trainerBattle(n); return; }
  if (d.item) { await pickItem(n); return; }
  const t = d.talk;
  if (typeof t === 'function') await t(n);
  else if (Array.isArray(t)) await says(...t);
  else if (t) await say(t);
  else if (d.trainer) await say(d.trainer.after);
}
async function pickItem(n) {
  const it = n.def.item;
  G.S.flags[it.flag] = 1;
  n.hide = true;
  addItem(it.id, it.n || 1);
  jingle('item');
  await say(`${J(G.S.name, '은는')} ${J(it.id, '을를')} 주웠다!`);
  OW.refreshNpcs();
}
function addItem(id, n = 1) { G.S.bag[id] = (G.S.bag[id] || 0) + n; }
function useItem(id) { if (!G.S.bag[id]) return false; if (--G.S.bag[id] <= 0) delete G.S.bag[id]; return true; }
async function getItem(id, n = 1, from) {
  addItem(id, n);
  const w = jingle('item');
  await say(`${J(G.S.name, '은는')} ${n > 1 ? id + ' ' + n + '개를' : J(id, '을를')} 받았다!`);
  if (w > 0) await sleepF(Math.max(0, w - 30));
}
async function walk(ent, dir, n = 1, spd) {
  for (let i = 0; i < n; i++) {
    ent.spd = spd; ent.startMove(dir);
    while (ent.mv) await sleepF(1);
  }
}
async function walkPath(ent, path) { for (const [d, n] of path) await walk(ent, d, n); }
async function enterDoor(wp) {
  sfx('door');
  await fadeOut(0, 3);
  const to = MAPS[wp.to];
  OW.load(wp.to, to.entry[0], to.entry[1], 'up');
  OW.tick();
  await fadeIn(3);
}
async function exitMat() {
  const m = curMap();
  sfx('door');
  await fadeOut(0, 3);
  OW.load(m.exit.to, m.exit.x, m.exit.y, 'down');
  OW.tick();
  await fadeIn(3);
}
async function warpTo(id, x, y, dir) {
  await fadeOut(0, 3);
  OW.load(id, x, y, dir);
  OW.tick();
  await fadeIn(3);
}
function healAll() { for (const m of G.S.party) { m.hp = m.mhp; m.st = null; m.moves.forEach(v => v.pp = MV[v.id].pp); } }
async function trainerSpot(n, dist) {
  n.bubble = true; sfx('excl');
  await sleepF(40);
  n.bubble = false;
  for (let i = 0; i < dist; i++) await walk(n, n.dir, 1);
  OW.P.dir = OPP[n.dir];
  await trainerBattle(n);
}
async function trainerBattle(n) {
  const tr = n.def.trainer;
  await says(...[].concat(tr.before));
  const r = await battle({ trainer: tr });
  if (r === 'win') { G.S.flags['tr_' + tr.id] = 1; if (tr.onWin) await tr.onWin(n); }
}
