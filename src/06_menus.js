// ───────── 시작 메뉴 ─────────
async function startMenu() {
  let start = 0;
  for (;;) {
    const opts = [];
    if (G.S.flags.dex) opts.push(['업무도감', dexMenu]);
    if (G.S.party.length) opts.push(['교행몬', () => partyMenu('field')]);
    opts.push(['가방', () => bagMenu(false)]);
    opts.push([G.S.name, cardMenu]);
    opts.push(['저장', saveMenu]);
    opts.push(['설정', optionMenu]);
    opts.push(['닫기', null]);
    const c = await choose(opts.map(o => o[0]), { x: 86, y: 0, w: 74, start, rh: 16 });
    if (c < 0 || !opts[c][1]) return;
    start = c;
    const r = await opts[c][1]();
    if (r === 'close') return;
  }
}

// ───────── 교행몬 목록 ─────────
class PartyPick {
  constructor(msg, o = {}) { this.msg = msg; this.o = o; this.i = o.start || 0; }
  update() {
    const n = G.S.party.length;
    if (nav('down')) { this.i = (this.i + 1) % n; sfx('sel'); }
    if (nav('up')) { this.i = (this.i + n - 1) % n; sfx('sel'); }
    if (PRESS.a) { sfx('sel'); this.resolve(this.i); }
    else if (PRESS.b && !this.o.forced) { sfx('sel'); this.resolve(-1); }
  }
  draw() {
    fillScr(0);
    G.S.party.forEach((m, k) => {
      const y = 3 + k * 15;
      if (k === this.i) cursor(2, y);
      if (this.o.mark === k) { ctx.fillStyle = PAL[1]; ctx.fillRect(9, y - 1, 150, 13); }
      drawText(monName(m), 10, y, m.hp ? 3 : 2);
      drawText(m.st ? STS[m.st] : 'Lv' + m.lv, 64, y, m.st ? 2 : 3);
      const bx = 94, bw = 40;
      ctx.fillStyle = PAL[3]; ctx.fillRect(bx, y + 3, bw + 2, 5);
      ctx.fillStyle = PAL[0]; ctx.fillRect(bx + 1, y + 4, bw, 3);
      ctx.fillStyle = PAL[m.hp / m.mhp < 0.25 ? 3 : 2]; ctx.fillRect(bx + 1, y + 4, Math.ceil(bw * m.hp / m.mhp), 3);
      drawTextR(m.hp, 158, y, 3);
    });
    box(0, 96, 160, 48);
    wrap(fmt(this.msg), 142).slice(0, 2).forEach((l, i) => drawText(l, 9, 104 + i * 17));
  }
}
function partyPick(msg, o) { return pushUI(new PartyPick(msg, o)); }

async function partyMenu(mode, B) {
  let start = mode === 'battle' || mode === 'forced' ? (B ? B.pi : 0) : 0;
  for (;;) {
    const msg = mode === 'forced' ? '다음에 내보낼 교행몬을 고르세요.' : '교행몬을 고르세요.';
    const k = await partyPick(msg, { start, forced: mode === 'forced' });
    if (k < 0) return null;
    start = k;
    const m = G.S.party[k];
    if (mode === 'forced') {
      if (m.hp <= 0) { await say('일할 기운이 남아 있지 않다!'); continue; }
      return k;
    }
    const items = mode === 'battle' ? ['교체', '능력치', '취소'] : ['능력치', '순서 바꾸기', '취소'];
    const pick = showPanel(() => new PartyPick(msg, { start: k }).draw());
    const c = await choose(items, { x: 88, y: 96 - items.length * 16 - 10 });
    removeUI(pick);
    if (c < 0 || items[c] === '취소') continue;
    if (items[c] === '능력치') { await statPages(m); continue; }
    if (items[c] === '교체') {
      if (m.hp <= 0) { await say('일할 기운이 남아 있지 않다!'); continue; }
      if (k === B.pi) { await say(`${J(monName(m), '은는')} 이미 나가 있다!`); continue; }
      return k;
    }
    if (items[c] === '순서 바꾸기') {
      const j = await partyPick('어디로 옮길까요?', { start: k, mark: k });
      if (j >= 0 && j !== k) { const p = G.S.party; [p[k], p[j]] = [p[j], p[k]]; sfx('stat'); }
    }
  }
}
async function statPages(m) {
  const sp = SP[m.sp];
  const r = await panel(() => {
    fillScr(0);
    ctx.drawImage(artCanvas(sp.art), 6, 6);
    drawText('No.' + String(sp.no).padStart(3, '0'), 54, 4);
    drawText(monName(m), 54, 17);
    drawText('Lv' + m.lv, 118, 17);
    drawText('유형/' + sp.type, 54, 30);
    drawText(m.st ? STN[m.st] : (m.hp ? '정상' : '기절'), 118, 30, 2);
    ctx.fillStyle = PAL[3]; ctx.fillRect(4, 50, 152, 1);
    const rows = [['체력', `${m.hp}/${m.mhp}`], ['추진력', m.atk], ['내공', m.def], ['전문성', m.spc], ['처리속도', m.spd]];
    rows.forEach(([a, b], i) => { drawText(a, 8, 55 + i * 14); drawTextR(b, 88, 55 + i * 14); });
    drawText('경험치', 96, 55); drawTextR(m.exp, 156, 69);
    drawText('다음 Lv', 96, 87); drawTextR(m.lv >= 100 ? 0 : expAt(m.lv + 1) - m.exp, 156, 101);
    if ((G.frame >> 4) % 2) downArrow(148, 134);
  });
  if (!r) return;
  await panel(() => {
    fillScr(0);
    ctx.drawImage(artCanvas(sp.art), 6, 6);
    drawText(monName(m), 54, 10); drawText('Lv' + m.lv, 118, 10);
    drawText('익힌 기술', 54, 26, 2);
    ctx.fillStyle = PAL[3]; ctx.fillRect(4, 50, 152, 1);
    m.moves.forEach((v, i) => {
      const y = 55 + i * 21;
      drawText(v.id, 8, y);
      drawText(MV[v.id].t || '일반', 8, y + 10, 2);
      drawTextR(`PP ${v.pp}/${MV[v.id].pp}`, 154, y + 5);
    });
  });
}

// ───────── 가방 ─────────
function bagList(inBattle) {
  const ids = Object.keys(G.S.bag).filter(id => G.S.bag[id] > 0);
  const order = id => ({ ball: 0, heal: 1, cure: 2, repel: 3, tm: 4, key: 5 }[ITEMS[id].k]);
  ids.sort((a, b) => order(a) - order(b));
  return inBattle ? ids.filter(id => ['ball', 'heal', 'cure'].includes(ITEMS[id].k)) : ids;
}
async function bagMenu(inBattle, B) {
  let start = 0;
  for (;;) {
    const ids = bagList(inBattle);
    const items = () => [...bagList(inBattle).map(id => ({ label: id, right: ITEMS[id].k === 'key' ? '' : '×' + G.S.bag[id] })), { label: '닫기' }];
    const k = await listMenu({
      x: 24, y: 2, w: 136, h: 92, start, items,
      over: me => { box(0, 96, 160, 48); const id = bagList(inBattle)[me.i]; if (id) wrap(ITEMS[id].d, 142).slice(0, 2).forEach((l, i) => drawText(l, 9, 104 + i * 17)); },
    });
    if (k < 0 || k >= ids.length) return null;
    start = k;
    const id = ids[k], it = ITEMS[id];
    if (it.k === 'ball') {
      if (!inBattle) { await say('지금은 쓸 수 없다.'); continue; }
      return { t: 'ball', id };
    }
    if (it.k === 'heal' || it.k === 'cure') {
      const j = await partyPick(`${J(id, '을를')} 누구에게 쓸까요?`);
      if (j < 0) continue;
      const m = G.S.party[j];
      if (it.k === 'heal') {
        if (m.hp <= 0 || m.hp >= m.mhp) { await say('써도 효과가 없다.'); continue; }
        const before = m.hp; m.hp = Math.min(m.mhp, m.hp + it.hp); useItem(id); sfx('stat');
        await say(`${monName(m)}의 체력이 ${m.hp - before} 회복되었다!`);
      } else {
        if (m.st !== it.st) { await say('써도 효과가 없다.'); continue; }
        m.st = null; useItem(id); sfx('stat');
        await say(`${monName(m)}의 상태가 정상으로 돌아왔다!`);
      }
      if (inBattle) { if (B && m === B.M) B.dP = m.hp; return { t: 'item' }; }
      continue;
    }
    if (it.k === 'repel') {
      useItem(id); G.S.repel = 100; sfx('stat');
      await say(`${J(G.S.name, '은는')} ${J(id, '을를')} 붙였다! 한동안 조용할 것 같다.`);
      continue;
    }
    if (it.k === 'tm') {
      if (!(await yesno(`${id}에는 「${it.mv}」${J(it.mv, '이가').slice(it.mv.length)} 담겨 있다. 가르칠까?`))) continue;
      const j = await partyPick(`누구에게 가르칠까요?`);
      if (j < 0) continue;
      const m = G.S.party[j];
      if (m.moves.some(v => v.id === it.mv)) { await say(`${J(monName(m), '은는')} 이미 ${J(it.mv, '을를')} 알고 있다!`); continue; }
      if (await learnMove(m, it.mv)) useItem(id);
      continue;
    }
    await say(`${J(G.S.name, '은는')} ${J(id, '을를')} 꺼내 보았다. 지금은 쓸 때가 아니다.`);
  }
}

// ───────── 업무도감 ─────────
async function dexMenu() {
  let start = 0;
  for (;;) {
    const seenN = Object.keys(G.S.seen).length, cN = Object.keys(G.S.caught).length;
    const k = await listMenu({
      x: 0, y: 18, w: 160, h: 126, start, page: true,
      items: () => DEX.map(([n]) => ({ label: String(SP[n].no).padStart(3, '0') + ' ' + (G.S.seen[n] ? n : '-----'), right: G.S.caught[n] ? '●' : '', dim: !G.S.seen[n] })),
      under: () => { fillScr(0); drawText('업무도감', 6, 4); drawTextR(`발견 ${seenN}  영입 ${cN}`, 156, 4, 2); },
    });
    if (k < 0) return;
    start = k;
    const n = DEX[k][0];
    if (G.S.seen[n]) await showDexPage(n);
  }
}
async function showDexPage(n) {
  const sp = SP[n];
  await panel(() => {
    fillScr(0);
    if (sp.art) ctx.drawImage(artCanvas(sp.art), 8, 6);
    else { box(8, 6, 40, 40); drawText('?', 25, 20); }
    drawText('No.' + String(sp.no).padStart(3, '0'), 58, 6);
    drawText(n, 58, 20);
    drawText(sp.type + '형 교행몬', 58, 34, 2);
    drawText(G.S.caught[n] ? '영입함' : '본 적 있음', 112, 6, 2);
    box(0, 54, 160, 90);
    const lines = G.S.caught[n] ? wrap(sp.desc, 142) : ['영입하면 자세한 내용을', '볼 수 있다.'];
    lines.slice(0, 5).forEach((l, i) => drawText(l, 9, 62 + i * 15));
  });
}

// ───────── 신분증 ─────────
async function cardMenu() {
  await panel(() => {
    fillScr(0);
    box(0, 0, 160, 76);
    ctx.drawImage(artCanvas('c_player_down0'), 0, 0, 16, 16, 118, 14, 32, 32);
    drawText('교행몬 트레이너', 8, 6, 2);
    drawText('이름  ' + G.S.name, 8, 22);
    drawText('소지금  ' + G.S.money.toLocaleString() + '원', 8, 38);
    const t = Math.floor(G.S.time), hh = Math.floor(t / 3600), mm = Math.floor(t / 60) % 60;
    drawText(`시간  ${hh}:${String(mm).padStart(2, '0')}`, 8, 54);
    box(0, 78, 160, 66);
    drawText('관문 배지', 8, 83, 2);
    for (let i = 0; i < 14; i++) {
      const x = 8 + (i % 7) * 21, y = 99 + Math.floor(i / 7) * 21;
      ctx.fillStyle = PAL[3]; ctx.fillRect(x, y, 18, 18);
      ctx.fillStyle = PAL[G.S.badges[i] ? 1 : 0]; ctx.fillRect(x + 1, y + 1, 16, 16);
      if (G.S.badges[i]) { ctx.fillStyle = PAL[3]; ctx.fillRect(x + 8, y + 4, 2, 10); ctx.fillRect(x + 5, y + 7, 8, 2); ctx.fillStyle = PAL[2]; ctx.fillRect(x + 4, y + 11, 10, 2); }
      else drawText(String(i + 1), x + (i + 1 > 9 ? 2 : 6), y + 4, 1);
    }
  });
}

// ───────── 저장 ─────────
const SAVE_KEY = 'gyohaengmon_save_v1';
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (_) { return false; } }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.S)); return true; } catch (_) { return false; } }
function readSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (_) { return null; } }
async function saveMenu() {
  if (!(await yesno('지금까지의 기록을 저장할까?'))) return;
  if (writeSave()) { jingle('item'); await say(`${J(G.S.name, '은는')} 기록을 저장했다!`); }
  else await say('저장하지 못했다… 이 브라우저에서는 저장이 막혀 있는 것 같다.');
}

// ───────── 설정 ─────────
function saveOpt() { try { localStorage.setItem('gyohaengmon_opt', JSON.stringify(G.opt)); } catch (_) {} }
function loadOpt() { try { const o = JSON.parse(localStorage.getItem('gyohaengmon_opt')); if (o) Object.assign(G.opt, o); } catch (_) {} AU.on = !!G.opt.sound; setPalette(G.opt.pal); }
async function optionMenu() {
  let start = 0;
  for (;;) {
    const items = [`글자 속도  ${['느림', '보통', '빠름'][G.opt.speed]}`, `소리  ${G.opt.sound ? '켬' : '끔'}`, `화면 색  ${PALS[G.opt.pal].name}`, '닫기'];
    const c = await choose(items, { x: 0, y: 0, w: 160, start });
    if (c < 0 || c === 3) { saveOpt(); return; }
    start = c;
    if (c === 0) G.opt.speed = (G.opt.speed + 1) % 3;
    if (c === 1) { G.opt.sound = G.opt.sound ? 0 : 1; AU.on = !!G.opt.sound; if (!AU.on) { const t = AU.track; AU.track = null; playMusic(null); AU.resume = t; } else { playMusic(AU.resume || (G.S && curMap() ? curMap().music : 'title')); } }
    if (c === 2) { G.opt.pal = (G.opt.pal + 1) % PALS.length; setPalette(G.opt.pal); }
  }
}

// ───────── 매점 ─────────
async function shop(stock) {
  let first = true;
  for (;;) {
    const c = await ask(first ? '어서 오세요! 무엇을 도와 드릴까요?' : '더 필요한 건 없으세요?', ['사기', '팔기', '그만'], { x: 0, y: 0 });
    first = false;
    if (c === 0) {
      let start = 0;
      for (;;) {
        const k = await listMenu({
          x: 24, y: 24, w: 136, h: 72, start,
          items: () => [...stock.map(id => ({ label: id, right: ITEMS[id].price.toLocaleString() + '원' })), { label: '그만' }],
          over: me => { box(0, 96, 160, 48); const id = stock[me.i]; if (id) wrap(ITEMS[id].d, 142).slice(0, 2).forEach((l, i) => drawText(l, 9, 104 + i * 17)); drawMoney(); },
        });
        if (k < 0 || k >= stock.length) break;
        start = k;
        const id = stock[k], price = ITEMS[id].price;
        const max = Math.min(99, Math.floor(G.S.money / price));
        if (max < 1) { await say('돈이 모자라시네요.'); continue; }
        const n = await qty(max, price);
        if (!n) continue;
        if (!(await yesno(`${id} ${n}개, ${(n * price).toLocaleString()}원입니다. 괜찮으세요?`))) continue;
        G.S.money -= n * price; addItem(id, n); sfx('stat');
        await say('감사합니다!');
      }
    } else if (c === 1) {
      let start = 0;
      for (;;) {
        const ids = bagList(false).filter(id => ITEMS[id].price);
        const k = await listMenu({ x: 24, y: 24, w: 136, h: 72, start, items: () => [...ids.map(id => ({ label: id, right: '×' + G.S.bag[id] })), { label: '그만' }], over: () => drawMoney() });
        if (k < 0 || k >= ids.length) break;
        start = k;
        const id = ids[k], price = Math.floor(ITEMS[id].price / 2);
        const n = await qty(G.S.bag[id], price);
        if (!n) continue;
        if (!(await yesno(`${(n * price).toLocaleString()}원에 사 드릴게요. 괜찮으세요?`))) continue;
        G.S.bag[id] -= n; if (G.S.bag[id] <= 0) delete G.S.bag[id];
        G.S.money += n * price; sfx('stat');
      }
    } else { await say('또 오세요!'); return; }
  }
}
function drawMoney() { box(0, 0, 24 + textW(G.S.money.toLocaleString() + '원'), 22); drawText(G.S.money.toLocaleString() + '원', 8, 6); }

// ───────── 쉼터 ─────────
async function restCounter(n) {
  await say('교직원 쉼터에 오신 것을 환영합니다!');
  if (!(await yesno('교행몬들을 쉬게 해 드릴까요?'))) { await say('또 들러 주세요!'); return; }
  await say('그럼 잠시 맡아 둘게요!', { auto: 40 });
  playMusic(null);
  const w = jingle('heal');
  await sleepF(Math.max(30, w));
  healAll();
  const m = curMap();
  G.S.lastHeal = { map: m.id, x: OW.P.x, y: OW.P.y, msg: '정신을 차려 보니 쉼터였다. 교행몬들도 기운을 되찾았다.' };
  playMusic(m.music);
  await say('기다리셨죠! 교행몬들이 모두 기운을 되찾았어요.');
  await say('또 들러 주세요!');
}
