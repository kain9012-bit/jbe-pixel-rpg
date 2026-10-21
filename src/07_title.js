// ───────── 타이틀 ─────────
const TITLE_MONS = ['m_kkeut', 'm_dongjeon', 'm_ttukttak', 'm_chulseok', 'm_posti', 'm_kanban', 'm_receipt'];
const TITLE = {
  busy: false,
  update() { if ((PRESS.a || PRESS.start) && !this.busy) { sfx('sel'); this.busy = true; run(titleMenu).then(() => { this.busy = false; }); } },
  draw() {
    fillScr(0);
    // 띠
    ctx.fillStyle = PAL[3]; ctx.fillRect(0, 10, 160, 44);
    ctx.fillStyle = PAL[2]; ctx.fillRect(0, 12, 160, 1); ctx.fillRect(0, 51, 160, 1);
    const title = '교행몬';
    const tw = textW(title) * 3, tx = Math.floor((160 - tw) / 2);
    drawText(title, tx + 2, 16, 2, ctx, 3);
    drawText(title, tx, 14, 0, ctx, 3);
    const sub = '전북 에디션';
    drawText(sub, Math.floor((160 - textW(sub)) / 2), 58, 2);
    // 교행몬 행진
    const t = G.frame, k = Math.floor(t / 150) % TITLE_MONS.length, p = t % 150;
    let x = 60;
    if (p < 20) x = 160 - p * 5; else if (p > 130) x = 60 - (p - 130) * 5;
    ctx.drawImage(artCanvas(TITLE_MONS[k]), x, 74);
    ctx.drawImage(artCanvas('c_player_side0', true), 0, 0, 16, 16, 24, 82, 32, 32);
    if ((t >> 5) % 2 && !this.busy) { const s = MODE === 'pc' ? 'Z 키를 누르세요' : 'A 버튼을 누르세요'; drawText(s, Math.floor((160 - textW(s)) / 2), 124, 3); }
    drawText('v0.1', 136, 134, 1);
  },
};
async function titleMenu() {
  const can = hasSave();
  const items = can ? ['이어하기', '새로 시작', '설정'] : ['새로 시작', '설정'];
  const c = await choose(items, { x: 0, y: 0, w: 92 });
  if (c < 0) return;
  const v = items[c];
  if (v === '설정') { await optionMenu(); return; }
  if (v === '이어하기') {
    const s = readSave();
    if (!s) { await say('기록을 읽지 못했다.'); return; }
    G.S = Object.assign(newState(), s);
    await fadeOut(0, 4);
    G.scene = OW; OW.load(G.S.map, G.S.x, G.S.y, G.S.dir); OW.tick();
    await fadeIn(4);
    return;
  }
  if (can && !(await yesno('새로 시작할까요? 저장한 기록은 다음에 저장할 때 덮어씁니다.'))) return;
  await newGame();
}
function newState() {
  return {
    name: '새봄', rival: '한빛', map: 'home', x: 5, y: 5, dir: 'up',
    party: [], box: [], bag: {}, money: 3000, flags: {}, visited: {}, seen: {}, caught: {}, badges: [], time: 0, repel: 0,
    lastHeal: { map: 'home', x: 5, y: 5, msg: '정신을 차려 보니 집이었다. 엄마가 교행몬들을 돌봐 주셨다.' },
  };
}

// ───────── 처음 이야기 ─────────
const INTRO = {
  show: null, x: 0,
  update() {},
  draw() {
    fillScr(0);
    const s = this.show;
    if (!s) return;
    if (s.startsWith('m_')) { ctx.drawImage(artCanvas(s), 60 + this.x, 30); return; }
    ctx.drawImage(artCanvas(`c_${s}_down0`), 0, 0, 16, 16, 56 + this.x, 26, 48, 48);
  },
};
function sayIs(name) { return name + (jong(name) ? '이라고' : '라고'); }
async function pickName(q, presets) {
  for (;;) {
    const c = await ask(q, [...presets, '직접 입력'], { x: 0, y: 0, w: 88 });
    if (c >= 0 && c < presets.length) return presets[c];
    if (c === presets.length) {
      let v = null;
      try { v = window.prompt('이름을 입력하세요 (한글 5자 이내)', ''); } catch (_) { v = null; }
      v = (v || '').replace(/\s+/g, '').slice(0, 5);
      if (v) return v;
    }
  }
}
async function newGame() {
  G.S = newState();
  await fadeOut(0, 4);
  G.scene = INTRO; INTRO.show = 'prof'; INTRO.x = 0;
  playMusic('town');
  await fadeIn(4);
  await says('안녕! 교행몬의 세계에 잘 왔다!', '나는 교행몬 박사. 학교 행정실장으로 오래 일하다가 은퇴했단다.');
  INTRO.show = 'm_chulseok';
  await says('이 세계에는 「교행몬」이라고 불리는 교육행정직들이 살고 있단다.',
    '학교와 교육청 곳곳에서 일하며, 레벨이 오를 때마다 업무경감 기술을 하나씩 익히지.',
    '사람들은 교행몬과 함께 실력을 겨루기도 하고, 서로 도우며 일하기도 한단다.',
    '나는 그런 교행몬을 연구하고 있지.');
  INTRO.show = 'player';
  G.S.name = await pickName('그럼 너의 이름을 알려 주겠니?', ['새봄', '다온', '하람']);
  await say(`그래, ${sayIs(G.S.name)} 하는구나!`);
  INTRO.show = 'rival';
  await say('이 아이는 내 손주란다. 너와는 어릴 적부터 라이벌이었지.');
  G.S.rival = await pickName('음… 이름이 뭐였더라?', ['한빛', '태오', '지호']);
  await say(`맞다, ${G.S.rival}${jong(G.S.rival) ? '이었지' : '였지'}!`);
  INTRO.show = 'player';
  await says(`${G.S.name}! 너의 교행몬 이야기가 지금 시작된다!`, '꿈과 모험과 칼퇴가 기다리는 교행몬의 세계로! 자, 출발이다!');
  await fadeOut(0, 6);
  G.scene = OW; OW.load('home', 5, 5, 'up'); OW.tick();
  await fadeIn(4);
}
