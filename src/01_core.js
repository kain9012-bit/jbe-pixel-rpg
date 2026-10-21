'use strict';
// ───────── 기본 ─────────
const W = 160, H = 144, T = 16;
const cv = document.getElementById('scr');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

const PALS = [
  { name: '종이', c: ['#f4f1de', '#b7c9a0', '#5b7a65', '#1e2b26'] },
  { name: '노을', c: ['#fff1e0', '#f0a77a', '#a54b5c', '#2a1a2c'] },
  { name: '흑백', c: ['#f6f6f6', '#ababab', '#5a5a5a', '#161616'] },
];
let PAL = PALS[0].c;

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleepF = n => new Promise(r => G.waits.push({ n, r }));

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return c; }

// ───────── 조사 ─────────
function jong(word) {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return /[013678lmnr]$/i.test(word) ? 1 : 0;
  return (ch - 0xac00) % 28;
}
function J(word, pair) {
  const j = jong(word);
  if (pair === '으로') return word + ((j === 0 || j === 8) ? '로' : '으로');
  const [a, b] = { 이가: ['이', '가'], 을를: ['을', '를'], 은는: ['은', '는'], 과와: ['과', '와'], 아야: ['아', '야'] }[pair];
  return word + (j ? a : b);
}

// ───────── 그림 캐시 ─────────
let IMG = {};
function artCanvas(name, flip) {
  const key = name + (flip ? '|f' : '');
  if (IMG[key]) return IMG[key];
  const a = ART[name];
  if (!a) return null;
  const c = mkCanvas(a.w, a.h), x = c.getContext('2d');
  for (let y = 0; y < a.h; y++) {
    const r = a.rows[y];
    for (let i = 0; i < a.w; i++) {
      const ch = r[i];
      if (ch === '.') continue;
      x.fillStyle = PAL[+ch];
      x.fillRect(flip ? a.w - 1 - i : i, y, 1, 1);
    }
  }
  IMG[key] = c;
  return c;
}
function setPalette(i) {
  PAL = PALS[i].c; IMG = {}; TILEC = {}; BLDC = {};
  document.documentElement.style.setProperty('--scr-bg', PAL[0]);
}

// ───────── 글꼴 (갈무리9 비트맵) ─────────
const FONT = {};
(function loadFont() {
  const bin = atob(FONT_B64);
  let p = 0;
  const s8 = v => v > 127 ? v - 256 : v;
  for (const ch of FONT_CHARS) {
    const adv = bin.charCodeAt(p++), w = bin.charCodeAt(p++), h = bin.charCodeAt(p++);
    const xo = s8(bin.charCodeAt(p++)), yo = s8(bin.charCodeAt(p++));
    const bpr = Math.ceil(w / 8), rows = [];
    for (let y = 0; y < h; y++) {
      let v = 0;
      for (let b = 0; b < bpr; b++) v = (v << 8) | bin.charCodeAt(p++);
      rows.push(v);
    }
    FONT[ch] = { adv, w, h, xo, yo, bpr, rows };
  }
})();
const BASE = 9;
function glyph(ch) { return FONT[ch] || FONT['?']; }
function textW(s) { let w = 0; for (const ch of s) w += glyph(ch).adv; return w; }
function drawText(s, x, y, col = 3, c = ctx, scale = 1) {
  c.fillStyle = PAL[col];
  let cx = x;
  for (const ch of String(s)) {
    const g = glyph(ch);
    const top = y + BASE - g.yo - g.h;
    for (let r = 0; r < g.h; r++) {
      const v = g.rows[r], bits = g.bpr * 8;
      if (!v) continue;
      for (let i = 0; i < g.w; i++) if (v & (1 << (bits - 1 - i))) c.fillRect(cx + (g.xo + i) * scale, y + (top - y + r) * scale, scale, scale);
    }
    cx += g.adv * scale;
  }
  return cx;
}
function drawTextR(s, xr, y, col = 3) { drawText(s, xr - textW(String(s)), y, col); }
function wrap(text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    const words = para.split(' ');
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const cand = line ? line + ' ' + word : word;
      if (textW(cand) <= maxW) { line = cand; continue; }
      if (line) { out.push(line); line = ''; }
      let piece = '';
      for (const ch of word) {
        if (textW(piece + ch) > maxW) { out.push(piece); piece = ''; }
        piece += ch;
      }
      line = piece;
    }
    out.push(line);
  }
  return out;
}

// ───────── 상자·화살표 ─────────
function box(x, y, w, h) {
  ctx.fillStyle = PAL[0]; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL[3];
  ctx.fillRect(x + 1, y, w - 2, 1); ctx.fillRect(x + 1, y + h - 1, w - 2, 1);
  ctx.fillRect(x, y + 1, 1, h - 2); ctx.fillRect(x + w - 1, y + 1, 1, h - 2);
  ctx.fillStyle = PAL[2];
  ctx.fillRect(x + 3, y + 2, w - 6, 1); ctx.fillRect(x + 3, y + h - 3, w - 6, 1);
  ctx.fillRect(x + 2, y + 3, 1, h - 6); ctx.fillRect(x + w - 3, y + 3, 1, h - 6);
}
function cursor(x, y, col = 3) {
  ctx.fillStyle = PAL[col];
  for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + 1 + i, 1, 7 - i * 2);
}
function downArrow(x, y) {
  ctx.fillStyle = PAL[3];
  for (let i = 0; i < 4; i++) ctx.fillRect(x + i, y + i, 7 - i * 2, 1);
}
function fillScr(col) { ctx.fillStyle = PAL[col]; ctx.fillRect(0, 0, W, H); }

// ───────── 입력 ─────────
const BTN = { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, start: 0, select: 0 };
let PRESS = {};
let REPEAT = { k: null, t: 0 };
function press(k) { ensureAudio(); if (!BTN[k]) PRESS[k] = 1; BTN[k] = 1; }
function release(k) { BTN[k] = 0; }
// 한글 입력 상태여도 동작하도록 물리 키(code) 기준
const CODEMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
  KeyZ: 'a', Space: 'a', KeyJ: 'a',
  KeyX: 'b', Escape: 'b', Backspace: 'b', KeyK: 'b',
  Enter: 'start', NumpadEnter: 'start', KeyM: 'start',
  ShiftLeft: 'select', ShiftRight: 'select',
};
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'a', Z: 'a', 'ㅋ': 'a', ' ': 'a', x: 'b', X: 'b', 'ㅌ': 'b', Escape: 'b', Enter: 'start' };
function keyOf(e) { return CODEMAP[e.code] || KEYMAP[e.key]; }
addEventListener('keydown', e => { if (e.ctrlKey || e.altKey || e.metaKey) return; const k = keyOf(e); if (k) { e.preventDefault(); if (!e.repeat) press(k); setMode('pc'); } });
addEventListener('keyup', e => { const k = keyOf(e); if (k) { e.preventDefault(); release(k); } });
addEventListener('blur', () => { for (const k in BTN) BTN[k] = 0; });
// 컴퓨터/터치 화면 모드
let MODE = null;
function setMode(m, force) {
  if (MODE === m && !force) return;
  if (MODE === 'touch' && m === 'pc' && !force) return; // 터치 기기에 키보드를 붙인 경우는 버튼 유지
  MODE = m;
  document.body.classList.toggle('pc', m === 'pc');
  if (typeof fit === 'function') fit();
}
function bindPad() {
  const active = new Map();
  const dpad = document.getElementById('dpad');
  function dirAt(el, x, y) {
    const r = el.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  function down(e) {
    if (e.pointerType === 'touch') setMode('touch');
    const t = e.target.closest('[data-b]');
    if (!t) return;
    e.preventDefault();
    let k = t.dataset.b;
    if (k === 'dpad') k = dirAt(t, e.clientX, e.clientY);
    if (!k) return;
    try { t.setPointerCapture(e.pointerId); } catch (_) {}
    active.set(e.pointerId, { k, el: t });
    press(k); t.classList.add('on');
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
  }
  function move(e) {
    const a = active.get(e.pointerId);
    if (!a || a.el.dataset.b !== 'dpad') return;
    const k = dirAt(a.el, e.clientX, e.clientY);
    if (k && k !== a.k) { release(a.k); a.k = k; press(k); }
  }
  function up(e) {
    const a = active.get(e.pointerId);
    if (!a) return;
    release(a.k); a.el.classList.remove('on'); active.delete(e.pointerId);
  }
  const pad = document.getElementById('pad');
  pad.addEventListener('pointerdown', down);
  pad.addEventListener('pointermove', move);
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', up);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  dpad.addEventListener('contextmenu', e => e.preventDefault());
}
// 메뉴용: 누르는 순간 + 길게 누르면 반복
function nav(k) {
  if (PRESS[k]) { REPEAT = { k, t: 18 }; return true; }
  if (BTN[k] && REPEAT.k === k) { if (--REPEAT.t <= 0) { REPEAT.t = 5; return true; } }
  return false;
}

// ───────── 소리 ─────────
const AU = { ctx: null, on: true, track: null, next: 0, step: 0, timer: null, jingle: 0 };
function ensureAudio() {
  if (!AU.ctx) { try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.5; AU.master.connect(AU.ctx.destination); } catch (_) { return; } }
  if (AU.ctx.state === 'suspended') AU.ctx.resume();
}
const NOTE = (() => {
  const m = {}; const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 1; o <= 7; o++) names.forEach((n, i) => { m[n + o] = 440 * Math.pow(2, ((o - 4) * 12 + i - 9) / 12); });
  return m;
})();
function tone(f, t, d, type = 'square', v = 0.06, slide = 0) {
  if (!AU.ctx || !AU.on) return;
  const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.linearRampToValueAtTime(0, t + d);
  o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + d + 0.02);
}
function noise(t, d, v = 0.08) {
  if (!AU.ctx || !AU.on) return;
  const len = Math.floor(AU.ctx.sampleRate * d), b = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate), data = b.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AU.ctx.createBufferSource(), g = AU.ctx.createGain(); g.gain.value = v;
  s.buffer = b; s.connect(g); g.connect(AU.master); s.start(t);
}
function sfx(n) {
  if (!AU.ctx || !AU.on) return;
  const t = AU.ctx.currentTime;
  switch (n) {
    case 'sel': tone(1200, t, 0.04, 'square', 0.04); break;
    case 'bump': tone(110, t, 0.08, 'square', 0.06, 0.7); break;
    case 'hit': noise(t, 0.12, 0.12); tone(220, t, 0.1, 'square', 0.05, 0.5); break;
    case 'hit2': noise(t, 0.2, 0.16); tone(330, t, 0.18, 'square', 0.06, 0.3); break;
    case 'weak': noise(t, 0.08, 0.06); break;
    case 'faint': tone(600, t, 0.5, 'square', 0.06, 0.15); break;
    case 'throw': tone(400, t, 0.25, 'triangle', 0.08, 2.5); break;
    case 'shake': tone(180, t, 0.06, 'square', 0.06); tone(140, t + 0.08, 0.06, 'square', 0.06); break;
    case 'run': for (let i = 0; i < 3; i++) tone(500 - i * 120, t + i * 0.06, 0.05, 'square', 0.05); break;
    case 'door': noise(t, 0.1, 0.05); tone(300, t, 0.08, 'triangle', 0.06, 0.6); break;
    case 'stat': for (let i = 0; i < 4; i++) tone(500 + i * 150, t + i * 0.05, 0.05, 'square', 0.04); break;
    case 'down': for (let i = 0; i < 4; i++) tone(900 - i * 150, t + i * 0.05, 0.05, 'square', 0.04); break;
    case 'jump': tone(300, t, 0.15, 'square', 0.05, 2); break;
    case 'paper': noise(t, 0.12, 0.05); noise(t + 0.08, 0.08, 0.04); break;
    case 'scribble': for (let i = 0; i < 6; i++) tone(900 + (i % 2) * 300, t + i * 0.04, 0.03, 'square', 0.025); break;
    case 'ding': tone(1568, t, 0.12, 'triangle', 0.08); tone(2093, t + 0.08, 0.2, 'triangle', 0.07); break;
    case 'tick': tone(1200, t, 0.03, 'square', 0.04); tone(1600, t + 0.06, 0.04, 'square', 0.04); break;
    case 'thud': noise(t, 0.12, 0.14); tone(120, t, 0.14, 'square', 0.08, 0.6); break;
    case 'clock': for (let i = 0; i < 4; i++) tone(i % 2 ? 700 : 900, t + i * 0.12, 0.03, 'square', 0.04); break;
    case 'pop': tone(500, t, 0.06, 'square', 0.05, 1.8); break;
    case 'click': for (let i = 0; i < 5; i++) noise(t + i * 0.05, 0.02, 0.06); break;
    case 'ping': tone(2400, t, 0.25, 'triangle', 0.06); break;
    case 'excl': tone(1400, t, 0.06, 'square', 0.05); tone(1800, t + 0.07, 0.08, 'square', 0.05); break;
  }
}
const SONGS = {
  title: { bpm: 132, ch: [
    ['square', 0.05, 'G4:2 C5:2 E5:2 G5:2 F5:2 E5:2 D5:2 C5:2 A4:2 D5:2 F5:2 A5:2 G5:6 R:2 E5:2 G5:2 C6:2 B5:2 A5:2 G5:2 F5:2 E5:2 D5:2 E5:2 F5:2 D5:2 C5:6 R:2'],
    ['triangle', 0.09, 'C3:4 G3:4 F3:4 C3:4 D3:4 A3:4 G2:4 B2:4 C3:4 E3:4 F3:4 A3:4 G2:4 B2:4 C3:4 G2:4'],
  ] },
  town: { bpm: 110, ch: [
    ['square', 0.045, 'E5:2 G5:1 E5:1 D5:2 C5:2 D5:1 E5:1 F5:2 E5:2 R:2 C5:2 E5:1 C5:1 A4:2 G4:2 A4:1 B4:1 C5:2 D5:4 E5:2 G5:1 E5:1 D5:2 C5:2 D5:1 E5:1 F5:2 A5:2 G5:2 F5:2 E5:2 D5:2 B4:2 C5:6 R:2'],
    ['triangle', 0.09, 'C3:2 G3:2 C3:2 G3:2 F3:2 C4:2 F3:2 C4:2 A2:2 E3:2 A2:2 E3:2 G2:2 D3:2 G2:2 B2:2 C3:2 G3:2 C3:2 G3:2 F3:2 C4:2 F3:2 A3:2 D3:2 A3:2 G2:2 B2:2 C3:2 G3:2 C3:4'],
  ] },
  route: { bpm: 140, ch: [
    ['square', 0.045, 'D5:1 G5:1 B5:2 A5:1 G5:1 E5:2 D5:2 B4:2 G4:2 D5:2 C5:1 E5:1 A5:2 G5:1 F#5:1 E5:2 D5:4 R:2 D5:1 E5:1 D5:1 G5:1 B5:2 A5:1 G5:1 E5:2 G5:2 A5:2 B5:2 D6:2 C6:1 B5:1 A5:2 G5:1 F#5:1 A5:2 G5:6 R:2'],
    ['triangle', 0.09, 'G2:2 D3:2 G2:2 D3:2 G2:2 D3:2 B2:2 D3:2 A2:2 E3:2 C3:2 E3:2 D3:2 A3:2 D3:2 F#3:2 G2:2 D3:2 G2:2 D3:2 E3:2 B3:2 E3:2 B3:2 C3:2 G3:2 D3:2 A3:2 G2:2 D3:2 G2:4'],
  ] },
  battle: { bpm: 168, ch: [
    ['square', 0.045, 'A4:1 C5:1 E5:1 A5:1 G5:1 E5:1 C5:1 E5:1 F5:1 A5:1 C6:1 A5:1 G5:2 E5:2 D5:1 F5:1 A5:1 D6:1 C6:1 A5:1 F5:1 A5:1 E5:2 G#5:2 B5:2 E6:2 A5:1 G5:1 E5:1 C5:1 A4:1 C5:1 E5:1 G5:1 F5:2 E5:1 D5:1 C5:2 D5:2 E5:1 C5:1 A4:1 C5:1 B4:1 G#4:1 B4:1 D5:1 A4:6 E5:2'],
    ['triangle', 0.1, 'A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 F2:1 F3:1 F2:1 F3:1 C3:1 C4:1 C3:1 C4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 G#2:1 B2:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 F2:1 F3:1 F2:1 F3:1 G2:1 G3:1 G2:1 G3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 A2:1 A3:1 A2:1 A3:1 A2:1 E3:1 A2:2'],
  ] },
  gym: { bpm: 120, ch: [
    ['square', 0.045, 'C5:2 C5:1 D5:1 E5:2 G5:2 F5:2 E5:2 D5:4 B4:2 B4:1 C5:1 D5:2 F5:2 E5:2 D5:2 C5:4'],
    ['triangle', 0.09, 'C3:2 G3:2 E3:2 G3:2 F3:2 A3:2 G3:2 B3:2 G2:2 D3:2 B2:2 D3:2 G2:2 B2:2 C3:4'],
  ] },
};
const JINGLES = {
  heal: 'C5:1 E5:1 G5:1 C6:1 G5:1 C6:3',
  item: 'G5:1 B5:1 D6:1 G6:3',
  win: 'C5:1 C5:1 C5:1 G5:3 E5:1 G5:1 C6:4',
  level: 'E5:1 G5:1 C6:2',
  catch: 'C5:1 E5:1 G5:1 C6:2 G5:1 C6:4',
  badge: 'G4:1 C5:1 E5:1 G5:2 E5:1 G5:1 C6:2 B5:1 C6:4',
  promo: 'C5:1 E5:1 G5:1 C6:2 G5:1 C6:2 R:1 D6:1 C6:1 B5:1 A5:1 G5:2 E5:1 G5:1 C6:2 E6:1 D6:1 C6:4',
};
function parseSeq(s) { return s.trim().split(/\s+/).map(t => { const [n, d] = t.split(':'); return [n, +d]; }); }
for (const k in SONGS) SONGS[k].ch.forEach(c => { c[2] = parseSeq(c[2]); });
function playMusic(name) {
  if (AU.track === name) return;
  AU.track = name;
  clearInterval(AU.timer);
  if (!name) return;
  const song = SONGS[name];
  const ptr = song.ch.map(() => ({ i: 0, t: 0 }));
  let started = false;
  AU.timer = setInterval(() => {
    if (!AU.ctx) return;
    const now = AU.ctx.currentTime, u = 60 / song.bpm / 2;
    if (!started) { ptr.forEach(p => p.t = now + 0.05); started = true; }
    song.ch.forEach((c, ci) => {
      const p = ptr[ci];
      while (p.t < now + 0.25) {
        const [n, d] = c[2][p.i];
        if (n !== 'R' && now > AU.jingle) tone(NOTE[n], p.t, d * u * 0.9, c[0], c[1]);
        p.t += d * u; p.i = (p.i + 1) % c[2].length;
      }
    });
  }, 60);
}
function jingle(name) {
  if (!AU.ctx || !AU.on) return 0;
  const seq = parseSeq(JINGLES[name]), u = 0.09; let t = AU.ctx.currentTime + 0.02;
  for (const [n, d] of seq) { if (n !== 'R') { tone(NOTE[n], t, d * u * 0.95, 'square', 0.06); tone(NOTE[n] / 2, t, d * u * 0.95, 'triangle', 0.08); } t += d * u; }
  AU.jingle = t;
  return (t - AU.ctx.currentTime) * 60;
}
