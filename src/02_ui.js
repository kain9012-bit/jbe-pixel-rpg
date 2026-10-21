// ───────── 전역 상태 ─────────
const G = {
  scene: null, ui: [], waits: [], frame: 0, lock: 0, fade: 0, fadeCol: 0,
  opt: { speed: 1, sound: 1, pal: 0 },
  S: null, // 저장 대상 상태
};

function pushUI(w) {
  G.ui.push(w);
  return new Promise(r => { w.resolve = v => { const i = G.ui.indexOf(w); if (i >= 0) G.ui.splice(i, 1); r(v); }; });
}
function removeUI(w) { const i = G.ui.indexOf(w); if (i >= 0) G.ui.splice(i, 1); }

// ───────── 대화창 ─────────
const TB = { x: 0, y: 96, w: 160, h: 48 };
class TextBox {
  constructor(text, o = {}) {
    this.lines = wrap(fmt(text), 142);
    this.page = 0; this.shown = 0; this.o = o; this.t = 0;
    this.keep = !!o.keep; this.finished = false;
  }
  pageLines() { return this.lines.slice(this.page * 2, this.page * 2 + 2); }
  pageLen() { return this.pageLines().join('').length; }
  update() {
    this.t++;
    const len = this.pageLen();
    if (this.shown < len) {
      const sp = [0.5, 1, 3][G.opt.speed];
      this.shown = Math.min(len, this.shown + sp);
      if (PRESS.a || PRESS.b) this.shown = len;
      return;
    }
    const last = (this.page + 1) * 2 >= this.lines.length;
    if (last && this.keep) { if (!this.finished) { this.finished = true; this.resolve2 && this.resolve2(); } return; }
    if (this.o.auto != null) { if (--this.o.auto <= 0) this.advance(last); return; }
    if (PRESS.a || PRESS.b) { sfx('sel'); this.advance(last); }
  }
  advance(last) {
    if (last) this.resolve(); else { this.page++; this.shown = 0; }
  }
  draw() {
    box(TB.x, TB.y, TB.w, TB.h);
    const ls = this.pageLines();
    let n = Math.floor(this.shown);
    ls.forEach((l, i) => { const s = l.slice(0, Math.max(0, n)); n -= l.length; drawText(s, 9, 104 + i * 17); });
    const last = (this.page + 1) * 2 >= this.lines.length;
    if (this.shown >= this.pageLen() && !(last && this.keep) && this.o.auto == null && (G.frame >> 4) % 2) downArrow(146, 134);
  }
}
function fmt(s) {
  if (!G.S) return s;
  return String(s).replace(/\{P\}/g, G.S.name).replace(/\{R\}/g, G.S.rival);
}
function say(text, o = {}) { return pushUI(new TextBox(text, o)); }
async function says(...arr) { for (const t of arr) await say(t); }

// 글을 띄워 둔 채 선택지
async function ask(text, items, o = {}) {
  const tb = new TextBox(text, { keep: true });
  G.ui.push(tb);
  await new Promise(r => { tb.resolve2 = r; tb.resolve = () => {}; });
  const v = await choose(items, o);
  removeUI(tb);
  return v;
}
async function yesno(text) { return (await ask(text, ['예', '아니요'], { x: 112, y: 56 })) === 0; }

// ───────── 선택 상자 ─────────
class Choice {
  constructor(items, o) {
    this.items = items; this.o = o; this.i = o.start || 0; this.cols = o.cols || 1;
    const rows = Math.ceil(items.length / this.cols);
    this.w = o.w || Math.max(...items.map(s => textW(s))) * 1 + 24 + (this.cols > 1 ? 40 : 0);
    this.rh = o.rh || 16;
    this.h = o.h || rows * this.rh + 10;
    this.x = o.x != null ? o.x : W - this.w;
    this.y = o.y != null ? o.y : TB.y - this.h;
  }
  update() {
    const n = this.items.length, c = this.cols;
    if (nav('down') && this.i + c < n) { this.i += c; sfx('sel'); }
    else if (nav('up') && this.i - c >= 0) { this.i -= c; sfx('sel'); }
    else if (c > 1 && nav('right') && this.i % c < c - 1 && this.i + 1 < n) { this.i++; sfx('sel'); }
    else if (c > 1 && nav('left') && this.i % c > 0) { this.i--; sfx('sel'); }
    else if (this.o.wrap && nav('down')) { this.i = 0; sfx('sel'); }
    if (PRESS.a) { sfx('sel'); this.resolve(this.i); }
    else if (PRESS.b && this.o.cancel !== false) { sfx('sel'); this.resolve(-1); }
  }
  draw() {
    box(this.x, this.y, this.w, this.h);
    const cw = (this.w - 8) / this.cols;
    this.items.forEach((s, k) => {
      const cx = this.x + 6 + (k % this.cols) * cw, cy = this.y + 6 + Math.floor(k / this.cols) * this.rh;
      drawText(s, cx + 8, cy);
      if (k === this.i) cursor(cx, cy);
    });
  }
}
function choose(items, o = {}) { return pushUI(new Choice(items, o)); }

// ───────── 스크롤 목록 ─────────
class ListMenu {
  constructor(o) {
    this.o = o; this.i = o.start || 0; this.top = 0;
    this.x = o.x ?? 0; this.y = o.y ?? 0; this.w = o.w ?? W; this.h = o.h ?? 96;
    this.rows = Math.floor((this.h - 10) / 16);
  }
  get items() { return this.o.items(); }
  update() {
    const n = this.items.length;
    if (nav('down') && this.i < n - 1) { this.i++; sfx('sel'); }
    else if (nav('up') && this.i > 0) { this.i--; sfx('sel'); }
    else if (nav('right') && this.o.page) { this.i = Math.min(n - 1, this.i + this.rows); sfx('sel'); }
    else if (nav('left') && this.o.page) { this.i = Math.max(0, this.i - this.rows); sfx('sel'); }
    if (this.i < this.top) this.top = this.i;
    if (this.i >= this.top + this.rows) this.top = this.i - this.rows + 1;
    if (PRESS.a) { sfx('sel'); this.resolve(this.i); }
    else if (PRESS.b) { sfx('sel'); this.resolve(-1); }
  }
  draw() {
    if (this.o.under) this.o.under();
    box(this.x, this.y, this.w, this.h);
    const its = this.items;
    for (let r = 0; r < this.rows; r++) {
      const k = this.top + r; if (k >= its.length) break;
      const it = its[k], cy = this.y + 6 + r * 16;
      drawText(it.label, this.x + 14, cy, it.dim ? 2 : 3);
      if (it.right != null) drawTextR(it.right, this.x + this.w - 7, cy, it.dim ? 2 : 3);
      if (k === this.i) cursor(this.x + 6, cy);
    }
    if (this.top > 0 && (G.frame >> 4) % 2) { ctx.fillStyle = PAL[3]; ctx.fillRect(this.x + this.w - 10, this.y + 3, 5, 1); ctx.fillRect(this.x + this.w - 9, this.y + 2, 3, 1); }
    if (this.top + this.rows < its.length && (G.frame >> 4) % 2) downArrow(this.x + this.w - 11, this.y + this.h - 7);
    if (this.o.over) this.o.over(this);
  }
}
function listMenu(o) { return pushUI(new ListMenu(o)); }

// 그리기만 하는 판 (A·B로 닫힘)
class Panel {
  constructor(drawFn, o = {}) { this.drawFn = drawFn; this.o = o; }
  update() { if (this.o.wait) return; if (PRESS.a || PRESS.b) { sfx('sel'); this.resolve(PRESS.a ? 1 : 0); } }
  draw() { this.drawFn(); }
}
function panel(fn, o) { return pushUI(new Panel(fn, o)); }
function showPanel(fn) { const p = new Panel(fn, { wait: true }); G.ui.push(p); return p; }

// 수량 선택
class Qty {
  constructor(max, price) { this.n = 1; this.max = Math.max(1, max); this.price = price; }
  update() {
    if (nav('up')) { this.n = this.n >= this.max ? 1 : this.n + 1; sfx('sel'); }
    if (nav('down')) { this.n = this.n <= 1 ? this.max : this.n - 1; sfx('sel'); }
    if (nav('right')) { this.n = Math.min(this.max, this.n + 10); sfx('sel'); }
    if (nav('left')) { this.n = Math.max(1, this.n - 10); sfx('sel'); }
    if (PRESS.a) { sfx('sel'); this.resolve(this.n); } else if (PRESS.b) { sfx('sel'); this.resolve(0); }
  }
  draw() {
    const w = this.price ? 88 : 48;
    box(W - w, 64, w, 30);
    drawText('×' + String(this.n).padStart(2, '0'), W - w + 8, 74);
    if (this.price) drawTextR((this.n * this.price).toLocaleString() + '원', W - 8, 74);
  }
}
function qty(max, price) { return pushUI(new Qty(max, price)); }

// ───────── 화면 전환 ─────────
async function fadeOut(col = 0, f = 4) { G.fadeCol = col; for (let i = 1; i <= 4; i++) { G.fade = i; await sleepF(f); } }
async function fadeIn(f = 4) { for (let i = 3; i >= 0; i--) { G.fade = i; await sleepF(f); } }
function drawFade() {
  if (!G.fade) return;
  ctx.globalAlpha = [0, 0.35, 0.65, 0.88, 1][G.fade];
  ctx.fillStyle = PAL[G.fadeCol]; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

// ───────── 주 반복 ─────────
let lastT = performance.now(), accT = 0;
function step() {
  G.frame++;
  for (const w of G.waits.slice()) if (--w.n <= 0) { G.waits.splice(G.waits.indexOf(w), 1); w.r(); }
  const top = G.ui[G.ui.length - 1];
  if (top) top.update(); else if (G.scene && G.scene.update) G.scene.update();
  if (G.scene && G.scene.tick) G.scene.tick();
  if (G.S) G.S.time += 1 / 60;
  PRESS = {};
}
function render() {
  ctx.save();
  if (G.shake) ctx.translate(G.shake, 0);
  if (G.scene && G.scene.draw) G.scene.draw(); else fillScr(0);
  ctx.restore();
  for (const w of G.ui) w.draw && w.draw();
  drawFade();
}
function loop(t) {
  const mult = window.__FAST || 1;
  accT += (t - lastT) * mult; lastT = t;
  if (accT > 200 * mult) accT = 200 * mult;
  let n = 0;
  while (accT >= 1000 / 60 && n < 8 * mult) { step(); accT -= 1000 / 60; n++; }
  render();
  requestAnimationFrame(loop);
}
