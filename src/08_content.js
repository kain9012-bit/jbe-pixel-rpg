// ───────── 공통 실내 ─────────
const F = () => G.S.flags;
function restMap(id, exitTo, ex, ey) {
  defMap(id, {
    out: false, music: 'town', entry: [4, 7], exit: { to: exitTo, x: ex, y: ey },
    rows: [
      'W#HH##HH#W',
      '__________',
      '___CCCC___',
      '__________',
      '__________',
      'O________P',
      '__________',
      '____MM____',
    ],
    npcs: [
      { id: 'nurse', x: 4, y: 1, ch: 'staff', noTurn: true, talk: restCounter },
      { id: 'nurse2', x: 5, y: 1, ch: 'staff', noTurn: true, talk: restCounter },
      { x: 7, y: 4, ch: 'man', move: 'turn', talk: ['우리 행정실은 9급부터 6급까지 골고루 있어서 일이 술술 풀려요.', '직급이 다양하면 서로 맡는 일이 달라서 능력도 더 잘 나온대요.'] },
      { x: 8, y: 6, ch: 'man2', dir: 'left', talk: tradeTalk },
      { x: 2, y: 6, ch: 'woman', move: 'turn', talk: ['교행몬도 쉬어야 일을 잘하죠. 저는 점심마다 들러요.', '참, 같은 직급만 셋 넘게 데리고 다니면 일이 겹쳐서 힘이 빠진대요.'] },
    ],
  });
}
function shopMap(id, exitTo, ex, ey, stock, extra) {
  defMap(id, {
    out: false, music: 'town', entry: [3, 7], exit: { to: exitTo, x: ex, y: ey },
    rows: [
      'W#HHHH#W',
      '________',
      '_C___HH_',
      '_C___HH_',
      '________',
      '_____HH_',
      '________',
      '___MM___',
    ],
    npcs: [
      { id: 'clerk', x: 0, y: 2, dir: 'right', ch: 'man', noTurn: true, talk: async () => { if (extra && await extra()) return; await shop(stock); } },
      { x: 4, y: 5, ch: 'woman', move: 'wander', talk: '발령장은 미발령 교행몬을 영입할 때 꼭 있어야 해요.' },
    ],
  });
}
function houseMap(id, exitTo, ex, ey, npcs) {
  defMap(id, {
    out: false, music: 'town', entry: [2, 7], exit: { to: exitTo, x: ex, y: ey },
    rows: [
      '#WHH##W#',
      'Z_____V_',
      '__KK____',
      '__KK____',
      '________',
      '______O_',
      '________',
      '__MM____',
    ],
    npcs,
  });
}

// ───────── 완산 마을 ─────────
defMap('town', {
  name: '완산 마을', region: 'wansan', style: 'hanok',
  music: 'town',
  rows: [
    'TTTTTTTT....TTTTTTTT',
    'TTTTTTTT....TTTTTTTT',
    'TT................TT',
    'TT................TT',
    'TT................TT',
    'TT................TT',
    'TT................TT',
    'TT..S.......S.....TT',
    'TT................TT',
    'TT;;;;;;;;;;;;;;;;TT',
    'TT................TT',
    'TT................TT',
    'TT........S.......TT',
    'TT..*.*...........TT',
    'TT................TT',
    'TT..JJJJJ.....*.*.TT',
    'TTwwwwwwwwTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  buildings: [
    { k: 'house', x: 4, y: 4, to: 'home' },
    { k: 'house', x: 12, y: 4, to: 'rhouse' },
    { k: 'lab', x: 11, y: 10, to: 'lab' },
  ],
  edges: { n: ['route1', 0] },
  signs: { '4,7': () => say(`${G.S.name}의 집`), '12,7': () => say(`${G.S.rival}의 집`), '10,12': '교행몬 연구소' },
  npcs: [
    { x: 8, y: 8, ch: 'woman', move: 'wander', talk: '풀숲에서는 미발령 교행몬이 갑자기 튀어나와. 교행몬 없이 들어가면 위험해!' },
    { x: 15, y: 13, ch: 'man', move: 'wander', talk: '요즘은 기술만 잘 익히면 누구든 교행몬과 함께 일할 수 있대!' },
  ],
  onStep(x, y) {
    if (!F().gotStarter && y <= 1) { run(profStop); return true; }
    return false;
  },
});
houseMap('home', 'town', 5, 6, [
  { id: 'mom', x: 4, y: 3, dir: 'left', ch: 'mom', talk: momTalk },
]);
houseMap('rhouse', 'town', 13, 6, [
  { x: 3, y: 4, ch: 'woman', move: 'turn', talk: () => say(F().gotStarter ? '교행몬이 지치면 쉼터에 데려가. 공짜로 기운을 되찾게 해 준대.' : `${J(G.S.rival, '은는')} 아침 일찍 연구소에 갔어. 할아버지가 부르셨다나?`) },
]);
async function momTalk() {
  if (!F().gotStarter) { await says(`${G.S.name}! 박사님이 찾으시더라.`, '연구소에 한번 들러 보렴.'); return; }
  await say(`${G.S.name}! 잠깐 쉬었다 가렴.`);
  playMusic(null);
  const w = jingle('heal');
  await sleepF(Math.max(30, w));
  healAll();
  G.S.lastHeal = { map: 'home', x: 5, y: 5, msg: '정신을 차려 보니 집이었다. 엄마가 교행몬들을 돌봐 주셨다.' };
  playMusic(curMap().music);
  await says('교행몬들이 기운을 되찾았다!', '힘내렴! 엄마는 언제나 네 편이야.');
  await afterRest();
}

// ───────── 연구소 ─────────
const STARTERS = [['끄적이', 6, 2], ['동전이', 7, 2], ['뚝딱이', 8, 2]];
const COUNTER = { 끄적이: '동전이', 동전이: '뚝딱이', 뚝딱이: '끄적이' };
defMap('lab', {
  out: false, music: 'town', entry: [4, 11], exit: { to: 'town', x: 13, y: 12 },
  rows: [
    'HHHHWWHHHH',
    '__________',
    '______KKK_',
    '__________',
    '__________',
    'PP______PP',
    '__________',
    'HHHH__HHHH',
    '__________',
    '__________',
    '__________',
    '____MM____',
  ],
  npcs: [
    { id: 'prof', x: 5, y: 2, ch: 'prof', show: () => F().metProf, talk: profTalk },
    { id: 'rival', x: 4, y: 4, ch: 'rival', dir: 'up', show: () => !F().rival1, talk: rivalLabTalk },
    ...STARTERS.map(([sp, x, y]) => ({ id: 'env_' + sp, x, y, ch: 'envelope', show: () => !F()['env_' + sp], talk: () => envTalk(sp) })),
    { x: 2, y: 9, ch: 'aide', move: 'wander', talk: ['박사님은 원래 학교 행정실장이셨어. 은퇴하고 나서 교행몬 연구를 시작하셨지.', '박사님 연구에 따르면 직급이 고루 섞인 팀일수록 손발이 잘 맞는대. 이걸 「행정실 조화」라고 불러.'] },
    { x: 7, y: 9, ch: 'aide', move: 'turn', talk: () => F().dex ? says('업무도감은 만난 교행몬을 저절로 기록해 줘. 정말 대단한 발명이야!', '트레이너와 대결할 때 아무도 지치지 않고 이기면 근무평정이 올라. 평정 S면 승진할 때 호봉이 안 깎인대!') : say('박사님이 요즘 대단한 걸 만들고 계셔. 택배만 오면 완성이래.') },
  ],
  onStep(x, y) {
    if (F().gotStarter && !F().rival1 && y >= 6) { run(rivalBattle1); return true; }
    return false;
  },
});
async function profStop() {
  const P = OW.P;
  await say('잠깐! 거기 서 보거라!');
  P.dir = 'down';
  const prof = new Ent({ def: { id: 'tmp' }, x: P.x, y: P.y + 4, dir: 'up', ch: 'prof' });
  OW.npcs.push(prof);
  await walk(prof, 'up', 3);
  await says('휴, 겨우 따라잡았구나.', '풀숲에는 미발령 교행몬이 산단다. 교행몬 없이 들어가면 위험해!', '마침 잘됐다. 나를 따라오거라!');
  OW.npcs.splice(OW.npcs.indexOf(prof), 1);
  F().metProf = 1;
  await fadeOut(0, 4);
  OW.load('lab', 5, 3, 'up'); OW.tick();
  const rv = OW.npc('rival'); if (rv) { rv.x = 3; rv.y = 3; rv.dir = 'right'; }
  await fadeIn(4);
  await say(`${G.S.rival}: 할아버지! 나 기다리다 지쳤단 말이야!`);
  await says(`박사: ${G.S.rival}? 아, 그렇지. 너도 불렀었지.`, '박사: 자, 여기 서류봉투 세 개가 보이지? 안에는 교행몬이 하나씩 들어 있단다.', `박사: ${G.S.name}, 하나 골라 보거라. 오늘부터 네 파트너다!`);
  await say(`${G.S.rival}: 에이, 할아버지! 나는?`);
  await say(`박사: 서두르지 마라, ${G.S.rival}. 너도 고를 수 있단다.`);
  F().choose = 1;
}
async function envTalk(sp) {
  if (!F().choose) { await say('서류봉투가 놓여 있다. 무언가 들어 있는 것 같다.'); return; }
  if (F().gotStarter) { await say('박사님이 아끼는 다른 서류봉투다.'); return; }
  const s = SP[sp];
  const pnl = showPanel(() => { box(52, 8, 56, 56); ctx.drawImage(artCanvas(s.art), 60, 16); });
  G.S.seen[sp] = 1;
  const ok = await yesno(`${s.type}형 교행몬 ${sp}${(jong(sp) === 0 || jong(sp) === 8) ? '로' : '으로'} 할래?`);
  removeUI(pnl);
  if (!ok) return;
  await say(`박사: 이 교행몬은 정말 성실하단다!`);
  const m = makeMon(sp, 2);
  G.S.party.push(m); G.S.caught[sp] = 1;
  F().gotStarter = 1; F().starter = sp; F()['env_' + sp] = 1;
  OW.refreshNpcs();
  playMusic(null);
  const w = jingle('item');
  await say(`${J(G.S.name, '은는')} 박사에게서 ${J(sp, '을를')} 받았다!`);
  await sleepF(10);
  playMusic('town');
  const rsp = COUNTER[sp];
  F().rivalSp = rsp;
  const rv = OW.npc('rival');
  if (rv) { rv.dir = 'right'; }
  await say(`${G.S.rival}: 그럼 나는 이걸로 할래!`);
  F()['env_' + rsp] = 1; OW.refreshNpcs();
  G.S.seen[rsp] = 1;
  await say(`${J(G.S.rival, '은는')} 박사에게서 ${J(rsp, '을를')} 받았다!`);
}
async function rivalLabTalk(n) {
  if (!F().metProf) { await says('어? 너도 왔구나.', '할아버지가 안 계셔. 나도 기다리는 중이야.'); return; }
  if (!F().gotStarter) { await say('먼저 골라. 나는 남는 걸로 할 거니까… 아니, 사실 다 좋아 보여!'); return; }
  await say('내 교행몬이 훨씬 세 보이는데?');
}
function rivalTrainer(team, o = {}) {
  return Object.assign({ id: 'rival_x', name: `라이벌 ${G.S.rival}`, ch: 'rival', team, money: 35 }, o);
}
async function rivalBattle1() {
  const rv = OW.npc('rival'); const P = OW.P;
  await say(`${G.S.rival}: 잠깐, ${G.S.name}!`);
  if (rv) {
    // 플레이어 옆으로 다가오기
    rv.dir = 'down';
    while (rv && (Math.abs(rv.x - P.x) + Math.abs(rv.y - P.y)) > 1) {
      let d;
      if (rv.y < P.y - 1) d = 'down'; else if (rv.x < P.x) d = 'right'; else if (rv.x > P.x) d = 'left'; else d = 'down';
      const [dx, dy] = DIRV[d];
      if (!OW.passable(rv.x + dx, rv.y + dy, rv)) break;
      await walk(rv, d, 1);
    }
    const dx = P.x - rv.x, dy = P.y - rv.y;
    rv.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    P.dir = OPP[rv.dir];
  }
  await say(`${G.S.rival}: 할아버지한테 받은 교행몬, 실력 좀 겨뤄 보자!`);
  const r = await battle({ trainer: rivalTrainer([[F().rivalSp, 2]], { defeat: `${G.S.rival}: 쳇! 내가 고른 게 더 센 줄 알았는데!` }), noWhiteout: true });
  if (r !== 'win') await say(`${G.S.rival}: 봤지? 역시 내가 고른 게 최고야!`);
  await says(`${G.S.rival}: 좋아, 밖에 나가서 더 키워 올 거야.`, `${G.S.rival}: 할아버지, 나 먼저 간다! ${G.S.name}, 다음에 또 붙자!`);
  F().rival1 = 1;
  if (rv) {
    const path = [];
    for (let i = 0; i < 12 && (rv.x !== 4 || rv.y !== 11); i++) {
      let d = null;
      if (rv.y < 8 && rv.x !== 4 && rv.x !== 5) d = rv.x < 4 ? 'right' : 'left';
      else if (rv.y < 11) d = 'down';
      else d = rv.x < 4 ? 'right' : 'left';
      const [dx, dy] = DIRV[d];
      if (!OW.passable(rv.x + dx, rv.y + dy, rv)) { if (d === 'down') { d = rv.x <= 4 ? 'right' : 'left'; const v = DIRV[d]; if (!OW.passable(rv.x + v[0], rv.y + v[1], rv)) break; } else break; }
      await walk(rv, d, 1);
    }
    sfx('door');
    rv.hide = true;
  }
  OW.refreshNpcs();
  healAll();
  await say('박사: 둘 다 수고했다. 교행몬들은 내가 쉬게 해 주마.');
}
async function profTalk() {
  if (F().gotStarter && G.S.bag['박사 택배'] && !F().dex) { await giveDex(); return; }
  if (!F().gotStarter) { await say('박사: 서류봉투 중에서 하나 골라 보거라.'); return; }
  if (!F().dex) { await says('박사: 1번 도로를 따라 북쪽으로 가면 전주가 나온단다.', '박사: 교행몬과 함께 걸어 보거라. 함께 다닐수록 서로 가까워지지.'); return; }
  const seen = Object.keys(G.S.seen).length, caught = Object.keys(G.S.caught).length;
  await say(`박사: 어디 업무도감 좀 보자. 발견 ${seen}종, 영입 ${caught}종이로구나.`);
  await say(caught < 5 ? '박사: 아직 시작일 뿐이다. 풀숲을 구석구석 다녀 보거라!' : '박사: 오오, 제법이구나! 이 기세로 계속해 보거라!');
}
async function giveDex() {
  await says(`박사: 오, ${G.S.name}! 그건… 내가 주문한 택배로구나!`, '박사: 일부러 들고 와 줬구나. 고맙다.');
  useItem('박사 택배');
  const P = OW.P;
  const rv = new Ent({ def: { id: 'tmp' }, x: 4, y: 11, dir: 'up', ch: 'rival' });
  OW.npcs.push(rv);
  sfx('door');
  for (let i = 0; i < 7; i++) {
    const nx = rv.x, ny = rv.y - 1;
    if (!OW.passable(nx, ny, rv) || (Math.abs(nx - P.x) + Math.abs(ny - P.y)) === 0) break;
    await walk(rv, 'up', 1);
    if (Math.abs(rv.x - P.x) + Math.abs(rv.y - P.y) <= 1) break;
  }
  await say(`${G.S.rival}: 할아버지! 무슨 일로 불렀어?`);
  await says('박사: 오, 마침 잘 왔다. 너희에게 부탁이 있단다.', '박사: 이게 바로 「업무도감」이다! 만난 교행몬이 저절로 기록되는 최신 기기지.', '박사: 하나씩 가져가거라.');
  F().dex = 1;
  playMusic(null);
  const w = jingle('item');
  await say(`${J(G.S.name, '은는')} 박사에게서 업무도감을 받았다!`);
  await sleepF(10); playMusic('town');
  await says('박사: 전북 곳곳의 교행몬을 모두 기록한 완전한 도감을 만드는 것. 그게 내 오랜 꿈이었단다.',
    '박사: 하지만 나는 이제 너무 늙었구나. 그 일을 너희가 대신 해 주겠니?',
    '박사: 이건 교행몬의 역사에 남을 위대한 일이란다!');
  await says(`${G.S.rival}: 걱정 마, 할아버지! 내가 다 해낼게!`, `${G.S.rival}: ${G.S.name}, 도감은 내가 먼저 채운다. 너한테는 안 져!`);
  rv.dir = 'down';
  for (let i = 0; i < 8 && rv.y < 11; i++) { if (!OW.passable(rv.x, rv.y + 1, rv)) break; await walk(rv, 'down', 1); }
  sfx('door'); OW.npcs.splice(OW.npcs.indexOf(rv), 1);
  await say('박사: 교행몬을 영입하려면 「발령장」이 있어야 한단다. 몇 장 주마.');
  await getItem('발령장', 5);
  await says('박사: 미발령 교행몬을 만나면 먼저 기술로 약하게 만든 다음 발령장을 던지는 게 요령이지.', '박사: 그럼 잘 다녀오거라!');
  await giveQuest('q1', 'q2', 'q5');
}

// ───────── 1번 도로 ─────────
defMap('route1', {
  name: '1번 도로',
  music: 'route',
  rows: [
    'TTTTTTTT....TTTTTTTT',
    'TT......,,,,......TT',
    'TT.gggg.,,,,.ggg..TT',
    'TT.gggg.,,,,.ggg..TT',
    'TT.gggg.,,,,......TT',
    'TT......,,,,..S...TT',
    'TTTTTT..,,,,..TTTTTT',
    'TT......,,,,......TT',
    'TT..gggggggg......TT',
    'TT..gggggggg..ggg.TT',
    'TT..gggggggg..ggg.TT',
    'TT............ggg.TT',
    'TTLLLLLL....LLLLLLTT',
    'TT......,,,,......TT',
    'TTTT....,,,,....TTTT',
    'TT.ggg..,,,,.gggg.TT',
    'TT.ggg..,,,,.gggg.TT',
    'TT.ggg..,,,,.gggg.TT',
    'TT......,,,,......TT',
    'TT..S...,,,,......TT',
    'TTLLLLLL,,,,..TTTTTT',
    'TT.gggg.,,,,......TT',
    'TT.gggg.,,,,......TT',
    'TT......,,,,......TT',
    'TTTTTTTT....TTTTTTTT',
  ],
  edges: { n: ['jeonju', 2], s: ['town', 0] },
  signs: { '14,5': '1번 도로\n완산 마을 ↔ 전주', '4,19': '풀숲에서는 미발령 교행몬이 나와요!\n― 완산 마을 청년회 ―' },
  wild: [['출석이', 2, 3, 55], ['포스티', 2, 3, 45]],
  npcs: [
    { x: 13, y: 18, ch: 'man', talk: async () => {
      if (F().sample) { await say('전주 교직원 매점에도 꼭 들러 주세요!'); return; }
      await say('안녕하세요! 전주 교직원 매점입니다. 시음용으로 하나 드릴게요!');
      await getItem('믹스커피', 1);
      F().sample = 1;
      await say('믹스커피는 교행몬의 체력을 회복해 줘요. 가방에서 꺼내 쓰세요!');
    } },
    { x: 15, y: 9, ch: 'man2', move: 'wander', talk: ['교행몬이 지치면 일단 쉬게 해야 해.', '그리고 9급만 잔뜩 데리고 다니지 마. 같은 직급끼리는 일이 겹치거든.'] },
  ],
});

// ───────── 전주 ─────────
defMap('jeonju', {
  name: '전주', region: 'jeonju', style: 'hanok',
  music: 'town',
  rows: [
    'TTTTTTTTTT....TTTTTTTTTT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT............S.......TT',
    'TT;;;;;;;;;;;;;;;;;;;;TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT.....**...;;..**....TT',
    'TT....................TT',
    'TT..S.................TT',
    'TT..JJJJJJ....JJJJJJ..TT',
    'TT....................TT',
    'TTTTTTTTTT....TTTTTTTTTT',
  ],
  buildings: [
    { k: 'office', x: 15, y: 1, label: '전주교육지원청' },
    { k: 'house', x: 3, y: 2 },
    { k: 'shop', x: 4, y: 9, to: 'jshop' },
    { k: 'rest', x: 14, y: 10, to: 'jrest' },
  ],
  edges: { s: ['route1', -2], n: ['forest', -2] },
  signs: { '14,6': '전주교육지원청\n관장 부재 중', '4,16': '전주\n교육지원청이 있는 도시' },
  npcs: [
    { id: 'guard', x: 9, y: 1, ch: 'man2', dir: 'right', talk: () => say(F().dex ? '서류숲은 길이 꼬불꼬불해요. 조심히 다녀오세요!' : '이 앞은 서류숲이에요. 업무도감 없이 들어가면 길을 잃기 쉬워요.') },
    { x: 7, y: 13, ch: 'old', move: 'wander', talk: async () => {
      if (!F().dex) { await say('커피라도 한잔해야 정신이 들겠군…'); return; }
      if (!(await yesno('자네, 발령장 쓰는 법은 아나? 알려 줄까?'))) { await say('그래, 바쁘면 어쩔 수 없지.'); return; }
      await says('미발령 교행몬을 만나면 먼저 기술로 체력을 깎는 거야.', '체력 막대가 짧아지면 그때 가방에서 발령장을 던지지.', '졸음이나 결재대기 같은 상태로 만들어 두면 더 잘 들어간다네.', '흠흠, 이제 커피 한잔하러 가야겠군.');
    } },
    { x: 18, y: 15, ch: 'woman', move: 'wander', talk: ['전주교육지원청 관장은 어디 간 걸까? 몇 달째 자리를 비웠대.', '참, 18시가 넘으면 야근이야. 17시대에 쉼터에서 쉬면 칼퇴 보너스가 있대!'] },
    { x: 10, y: 12, ch: 'man', move: 'wander', talk: ['쉼터에 가면 교행몬 체력을 공짜로 회복해 줘!', '요일마다 「결산의 날」 같은 업무 시즌이 있어서, 그날 맞는 유형 기술이 세진대.'] },
    { x: 13, y: 13, ch: 'aide', dir: 'down', talk: innovTalk },
  ],
  onStep(x, y) {
    if (!F().dex && y <= 1 && x >= 10 && x <= 13) { run(guardStop); return true; }
    return false;
  },
});
MAPS.jeonju.warps['17,4'] = { locked: '문에 「관장 부재 중」이라는 종이가 붙어 있다. 잠겨 있다.' };
async function guardStop() {
  const g = OW.npc('guard'); const P = OW.P;
  if (g) { g.dir = P.x < g.x ? 'left' : 'right'; }
  await says('잠깐만요!', '이 앞은 서류숲이에요. 업무도감 없이 들어가면 길을 잃기 쉬워요.', '완산 마을 박사님께 도감부터 받아 오세요.');
  P.dir = 'down';
  await walk(P, 'down', 1);
}
restMap('jrest', 'jeonju', 16, 12);
shopMap('jshop', 'jeonju', 5, 11, ['발령장', '믹스커피', '비타민', '결재 독촉', '알람시계'], async () => {
  if (F().dex) return false;
  if (!F().gotStarter) { await say('어서 오세요… 어? 교행몬이 없으시네요. 그럼 발령장도 필요 없으시겠네요.'); return true; }
  if (!G.S.bag['박사 택배']) {
    await says('어서 오세요! 어, 완산 마을에서 오셨어요?', '마침 잘됐다! 박사님 앞으로 택배가 와 있어요. 좀 전해 주실래요?');
    await getItem('박사 택배', 1);
    return true;
  }
  await say('박사님께 택배 꼭 전해 주세요!');
  return true;
});

// ───────── 서류숲 ─────────
defMap('forest', {
  name: '서류숲',
  music: 'route',
  rows: [
    'TTTTTTTT....TTTTTTTT',
    'TT................TT',
    'TT.ggggg....ggggg.TT',
    'TT.ggggg....ggggg.TT',
    'TT..TTTTTTTTTTTTTTTT',
    'TT................TT',
    'TT.gggggg...ggggg.TT',
    'TT.gggggg...ggggg.TT',
    'TTTTTTTTTTTTTTT...TT',
    'TT................TT',
    'TT..gggg...gggggg.TT',
    'TT..gggg...gggggg.TT',
    'TT...TTTTTTTTTTTTTTT',
    'TT................TT',
    'TT.ggggg.....gggg.TT',
    'TT.ggggg.....gggg.TT',
    'TTTTTTTTTTTTT...TTTT',
    'TT................TT',
    'TT..gggggg..ggggg.TT',
    'TT..gggggg..ggggg.TT',
    'TT..........S.....TT',
    'TTTTTTTT....TTTTTTTT',
  ],
  edges: { s: ['jeonju', 2], n: ['wanju', 2] },
  signs: { '12,20': '서류숲\n길을 잃지 않게 조심하세요!' },
  onEnter: () => F().dex ? giveQuest('q3') : null,
  wild: [['포스티', 3, 4, 35], ['영수증이', 3, 4, 35], ['출석이', 3, 5, 30]],
  npcs: [
    { x: 5, y: 17, ch: 'man', dir: 'right', trainer: { id: 'f1', name: '신규 트레이너 민준', ch: 'man', team: [['출석이', 3], ['출석이', 3]], money: 15, sight: 4,
      before: '발령 받은 지 일주일! 내 교행몬 실력 좀 봐!', defeat: '아직 일주일밖에 안 됐다고…' }, talk: '출석이는 아침마다 종을 울려. 덕분에 지각은 안 해.' },
    { x: 7, y: 13, ch: 'woman', dir: 'right', trainer: { id: 'f2', name: '신규 트레이너 서연', ch: 'woman', team: [['포스티', 3]], money: 15, sight: 4,
      before: '숲에서 메모지 날리는 거 봤어? 그거 내 포스티야!', defeat: '메모지가 다 날아가 버렸어…' }, talk: '포스티는 메모를 너무 많이 붙여서 가끔 앞이 안 보인대.' },
    { x: 12, y: 9, ch: 'man2', dir: 'left', trainer: { id: 'f3', name: '신규 트레이너 도현', ch: 'man2', team: [['영수증이', 4], ['출석이', 4]], money: 15, sight: 4,
      before: '증빙 없는 승부는 안 받아! …아, 너는 있구나. 덤벼!', defeat: '영수증은 잘 챙겨 둘게…' }, talk: '영수증이는 회계형이야. 기획형 교행몬한테 특히 강하지.' },
    { x: 6, y: 5, ch: 'aide', dir: 'right', trainer: { id: 'f4', name: '주무관 트레이너 하은', ch: 'aide', team: [['포스티', 5], ['영수증이', 6]], money: 20, sight: 4,
      before: '이 숲을 빠져나가면 완주야. 관장님께 도전하기 전에 나부터 넘어 봐!', defeat: '완주 관장님은 나보다 훨씬 세. 준비 잘 해!' }, talk: ['한결 관장님은 기획형을 써. 회계형이나 민원형이 잘 먹힐 거야.', '완주에는 결재선이 쳐진 곳이 있어. 실장급(6급) 교행몬이 있어야 결재를 받고 지나갈 수 있지.'] },
    { x: 17, y: 13, ch: 'envelope', item: { id: '발령장', n: 1, flag: 'it_f1' }, show: () => !F().it_f1 },
    { x: 2, y: 1, ch: 'envelope', item: { id: '믹스커피', n: 1, flag: 'it_f2' }, show: () => !F().it_f2 },
    { x: 17, y: 9, ch: 'envelope', item: { id: '스캔 이름변경기', n: 1, flag: 'it_f3' }, show: () => !F().it_f3 },
  ],
});

// ───────── 완주 ─────────
defMap('wanju', {
  name: '완주', region: 'wanju', style: 'mountain',
  music: 'town',
  rows: [
    'AAAAYYYAAAAAAYYYAAAAAAAA',
    'YY....................YY',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT..........S.........TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT.UUUU.R......R.UUUU.TT',
    'TTJJJGJJJS............TT',
    'TT..UUUUJ.........R...YY',
    'TY......J.........UUU.TT',
    'YYTTYYTTYT....TYYTTYYTTY',
  ],
  buildings: [
    { k: 'office', x: 9, y: 1, label: '완주교육지원청', to: 'wgym' },
    { k: 'house', x: 3, y: 2 },
    { k: 'house', x: 17, y: 2 },
    { k: 'rest', x: 3, y: 8, to: 'wrest' },
    { k: 'shop', x: 16, y: 8, to: 'wshop' },
  ],
  edges: { s: ['forest', -2] },
  signs: { '12,6': '완주교육지원청 관장 한결\n「모든 일은 계획에서 시작된다」', '9,13': '완주\n첫 관문이 있는 도시' },
  onEnter: () => F().dex ? giveQuest('q4') : null,
  npcs: [
    { x: 3, y: 15, ch: 'envelope', item: { id: '표창장', n: 2, flag: 'it_w1' }, show: () => !F().it_w1 },
    { x: 6, y: 15, ch: 'envelope', item: { id: '쪽지 서식 도우미', n: 1, flag: 'it_w2' }, show: () => !F().it_w2 },
    { x: 8, y: 11, ch: 'man', move: 'wander', talk: '한결 관장은 기획형 교행몬을 써. 기획형은 회계형이랑 민원형에 약하대.' },
    { x: 15, y: 14, ch: 'old', move: 'wander', talk: ['사무관만 다섯 있는 행정실? 회의만 하다 하루가 다 가겠구먼!', '막내도 있고 실장도 있어야 일이 돌아가는 법이지. 허허.', '참, 진안 가는 길은 아직 공사 중이라네.'] },
    { x: 21, y: 4, ch: 'woman', move: 'turn', talk: () => say(G.S.badges[0] ? '새싹 배지를 땄다고? 대단하다!' : '관장님 이기면 배지를 준대. 배지 열네 개를 다 모은 사람은 아직 없대!') },
  ],
});
restMap('wrest', 'wanju', 5, 10);
shopMap('wshop', 'wanju', 17, 10, ['발령장', '믹스커피', '아메리카노', '비타민', '결재 독촉', '알람시계', '부재중 표시']);

defMap('wgym', {
  out: false, music: 'gym', entry: [4, 11], exit: { to: 'wanju', x: 11, y: 4 },
  rows: [
    'W#HH##HH#W',
    '__________',
    '_Q______Q_',
    '__________',
    '_HHH__HHH_',
    '__________',
    '__________',
    '_HHH__HHH_',
    '__________',
    '_Q______Q_',
    '__________',
    '____MM____',
  ],
  signs: Object.fromEntries(['1,2', '8,2', '1,9', '8,9'].map(k => [k, () => say(`완주교육지원청 관장 한결\n도전에 성공한 트레이너: ${G.S.badges[0] ? G.S.name : '아직 없음'}`)])),
  npcs: [
    { id: 'leader', x: 4, y: 1, ch: 'leader', trainer: {
      id: 'g1', name: '관장 한결', ch: 'leader', team: [['기안이', 12], ['칸반이', 14]], money: 99, sight: 0,
      before: ['나는 완주교육지원청 관장 한결.', '모든 일은 계획에서 시작되지. 계획 없는 열정은 야근으로 끝나거든.', '네 계획을 보여 줘!'],
      defeat: '…좋은 계획이었어. 인정할게.',
      onWin: gymWin,
    }, talk: async () => { await says('배지는 너의 계획이 통했다는 증거야.', '다음 관문은 진안교육지원청이야. 계획대로만 가면 문제없을 거야.'); } },
    { x: 1, y: 5, ch: 'aide', dir: 'right', trainer: { id: 'g1t', name: '주무관 트레이너 지훈', ch: 'aide', team: [['칸반이', 10], ['기안이', 11]], money: 20, sight: 4,
      before: '관장님께 가려면 나를 넘어야지! 계획은 세워 왔어?', defeat: '내 계획에 빈틈이 있었네…' }, talk: '기획형은 회계형에 약해. 관장님 칸반이도 마찬가지야.' },
    { x: 7, y: 10, ch: 'man2', dir: 'left', talk: async () => {
      if (G.S.badges[0]) { await say('오! 새싹 배지! 미래의 교행몬 마스터 납시었네!'); return; }
      await says('어이, 미래의 교행몬 마스터! 관장 한결은 기획형 교행몬을 쓴다네.', '기획형은 회계형과 민원형에 약하지. 회계형 교행몬이 있다면 든든할 거야!', '그리고 한결 관장 팀은 직급이 고루 섞여 있어서 손발이 잘 맞는다네. 자네 팀도 직급을 섞어 보게!', '자, 힘내게!');
    } },
  ],
});
async function gymWin() {
  await say('나를 이긴 증표로 「새싹 배지」를 줄게.');
  G.S.badges[0] = 1;
  playMusic(null);
  const w = jingle('badge');
  await say(`${J(G.S.name, '은는')} 한결에게서 새싹 배지를 받았다!`);
  await sleepF(20);
  playMusic('gym');
  await say('그리고 이것도 가져가. 직무연수 이수증 01이야.');
  await getItem('이수증01', 1);
  await says('안에는 「개조식 정리」가 들어 있어. 긴 보고서를 한눈에 정리하는 기술이지.', '가방에서 꺼내 교행몬에게 가르쳐 봐.', '다음 관문은 진안교육지원청이야. 계획대로만 가면 문제없을 거야.');
  await sleepF(20);
  if (!F().demoEnd) {
    F().demoEnd = 1;
    await says('― 체험판은 여기까지입니다 ―', '진안, 무주, 장수… 남은 13개 관문과 야근단 이야기는 다음 판에서 이어집니다.', '저장해 두면 다음 판에서 이어서 할 수 있어요. 고맙습니다!');
  }
}
