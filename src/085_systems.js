// ───────── 출퇴근 시계·요일 시즌 ─────────
// G.S.clock: 게임 분 (0일차 00:00 기준). 실제 1초 = 게임 2분
const DAYS = ['월', '화', '수', '목', '금'];
const SEASON = [['기획', '계획 수립의 날'], ['회계', '결산의 날'], ['시설', '안전점검의 날'], ['인사', '인사의 날'], ['민원', '민원 응대의 날']];
function dayIdx() { return Math.floor(G.S.clock / 1440); }
function minOfDay() { return Math.floor(G.S.clock) % 1440; }
function hhmm() { const t = minOfDay(); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }
function isOvertime() { const t = minOfDay(); return t >= 18 * 60 || t < 9 * 60; }
function todaySeason() { return SEASON[dayIdx() % 5]; }
function seasonText() { const s = todaySeason(); return `${DAYS[dayIdx() % 5]}요일 · ${s[1]} (${s[0]}형 기술 +20%)`; }
function tickClock() {
  if (!G.S || G.fade || G.S.clock == null) return;
  if (!(G.scene === OW || (G.scene && G.scene.constructor && G.scene.constructor.name === 'Battle'))) return;
  const before = minOfDay();
  G.S.clock += 2 / 60;
  const after = minOfDay();
  if (before < 17 * 60 && after >= 17 * 60) OW.banner = { text: '17:00 지금 쉬면 칼퇴!', t: 220 };
  if (before < 18 * 60 && after >= 18 * 60) OW.banner = { text: '18:00 야근 시작…', t: 220 };
}
function drawClock() {
  const s = `${DAYS[dayIdx() % 5]} ${hhmm()}`, w = textW(s) + 12;
  box(W - w - 2, 2, w, 18);
  drawText(s, W - w + 4, 6, isOvertime() ? 2 : 3);
}
function nextMorning() {
  const t = minOfDay(), d = dayIdx();
  G.S.clock = (t < 9 * 60 ? d : d + 1) * 1440 + 9 * 60;
}
// 쉼터·집에서 쉰 뒤
async function afterRest() {
  const t = minOfDay();
  if (t >= 17 * 60 && t < 18 * 60) {
    playMusic(null); const w = jingle('badge');
    await say('딱 맞춰 퇴근! 칼퇴 보너스다!');
    G.S.cnt.kaltoe = (G.S.cnt.kaltoe || 0) + 1;
    for (const m of G.S.party) {
      if (m.lv >= MAX_HOBONG) continue;
      const gain = Math.ceil((expAt(m.lv + 1) - expAt(m.lv)) * 0.6);
      m.exp += gain;
      await say(`${J(monName(m), '은는')} 푹 쉬고 경력을 ${gain} 쌓았다!`);
      while (m.lv < MAX_HOBONG && m.exp >= expAt(m.lv + 1)) await levelUp(m, null);
    }
    nextMorning();
    playMusic(curMap().music);
    await say(`다음 날 아침이 밝았다! 오늘은 ${seasonText()}`);
    await checkEvolutions(); await questCheck();
  } else if (isOvertime()) {
    await say('야근 끝에 겨우 퇴근했다… 내일은 꼭 칼퇴하자!');
    nextMorning();
    await say(`다음 날 아침! 오늘은 ${seasonText()}`);
  }
}

// ───────── 근무평정 ─────────
function evalGrade() { const p = G.S.evalPts || 0; return p >= 3 ? 'S' : p === 2 ? 'A' : p === 1 ? 'B' : 'C'; }

// ───────── 결재선 관문 ─────────
function gateOpen(m, x, y) { return !!G.S.flags[`gate_${m.id}_${x}_${y}`]; }
async function gateTry(m, x, y) {
  const boss = G.S.party.find(p => (p.grade || 0) >= 3 && p.hp > 0);
  if (!boss) {
    await says('「결재선 — 실장급(6급 이상) 교행몬의 결재가 있어야 지나갈 수 있습니다」', '지금 팀에는 결재할 수 있는 교행몬이 없다.');
    return;
  }
  if (!(await yesno(`${J(monName(boss), '이가')} 결재할 수 있을 것 같다. 결재를 올릴까?`))) return;
  sfx('thud');
  G.S.flags[`gate_${m.id}_${x}_${y}`] = 1;
  await say(`${J(monName(boss), '이가')} 쾅! 결재했다! 결재선이 열렸다!`);
}

// ───────── 인사교류 (정기 인사) ─────────
const TRADES = [['출석이', '영수증이'], ['포스티', '출석이'], ['영수증이', '포스티'], ['출석이', '포스티'], ['포스티', '영수증이']];
async function tradeTalk() {
  const [want, give] = TRADES[dayIdx() % TRADES.length];
  await say('인사교류 담당입니다. 정기 인사철이라 교행몬 교류를 받고 있어요.');
  if (G.S.trades[dayIdx()]) { await say('오늘 교류는 끝났어요. 정기 인사는 날마다 새로 열려요!'); return; }
  const wantForms = Object.values(SP).filter(q => q.name === want || isLineOf(want, q.name)).map(q => q.name);
  const ok = await yesno(`오늘은 ${J(want, '을를')} 내주시면 ${J(give, '을를')} 보내 드려요. 교류하실래요?`);
  if (!ok) { await say('다음에 또 오세요!'); return; }
  const k = await partyPick(`어느 교행몬을 보낼까요? (${want} 계열)`);
  if (k < 0) return;
  const m = G.S.party[k];
  if (!wantForms.includes(m.sp)) { await say(`그 교행몬은 ${want} 계열이 아니에요.`); return; }
  if (G.S.party.length <= 1) { await say('팀에 한 명뿐이면 보낼 수 없어요.'); return; }
  const nm = makeMon(give, m.lv); nm.traded = 1;
  G.S.party[k] = nm; G.S.seen[nm.sp] = 1; G.S.caught[nm.sp] = 1; G.S.trades[dayIdx()] = 1;
  playMusic(null); jingle('item');
  await say(`${J(monName(m), '이가')} 전보 발령으로 떠나고, ${J(monName(nm), '이가')} 전입해 왔다!`);
  playMusic(curMap().music);
  await say('전입해 온 교행몬은 낯선 곳에서 더 열심히 해서 경력을 1.5배로 쌓아요!');
}
function isLineOf(base, sp) { let s = base; for (let i = 0; i < 3 && s; i++) { if (s === sp) return true; s = SP[s] && SP[s].evo; } return false; }

// ───────── 메신저 쪽지 의뢰 ─────────
const QUESTS = {
  q1: { title: '출석 확인', desc: '미발령 교행몬과 3번 마주치기', prog: () => [G.S.cnt.wild || 0, 3], reward: ['아메리카노', 2] },
  q2: { title: '신규 채용', desc: '교행몬 2마리 영입하기', prog: () => [G.S.cnt.catch || 0, 2], reward: ['우수 발령장', 2] },
  q5: { title: '칼퇴의 달인', desc: '17시대에 쉼터나 집에서 쉬어 칼퇴하기', prog: () => [G.S.cnt.kaltoe || 0, 1], reward: ['표창장', 1] },
  q3: { title: '숲속 업무 대결', desc: '서류숲 트레이너 4명 모두 이기기', prog: () => [['f1', 'f2', 'f3', 'f4'].filter(t => G.S.flags['tr_' + t]).length, 4], reward: ['표창장', 1] },
  q4: { title: '첫 관문', desc: '완주교육지원청 관장 한결 이기기', prog: () => [G.S.badges[0] ? 1 : 0, 1], reward: ['표창장', 2] },
};
async function giveQuest(...ids) {
  const fresh = ids.filter(id => !G.S.quests[id]);
  if (!fresh.length) return;
  sfx('excl');
  await say('딩동! 메신저 쪽지가 도착했다.');
  for (const id of fresh) { G.S.quests[id] = 'on'; await say(`[쪽지] ${QUESTS[id].title} — ${QUESTS[id].desc}`); }
  await say('쪽지는 메뉴의 「쪽지함」에서 다시 볼 수 있다.');
}
async function questCheck() {
  for (const id in G.S.quests) {
    if (G.S.quests[id] !== 'on') continue;
    const [a, b] = QUESTS[id].prog();
    if (a < b) continue;
    G.S.quests[id] = 'done';
    const [it, n] = QUESTS[id].reward;
    playMusic(null); jingle('item');
    await say(`쪽지 의뢰 완료! 「${QUESTS[id].title}」`);
    addItem(it, n);
    await say(`보상으로 ${it} ${n}개를 받았다!`);
    playMusic(curMap().music);
  }
}
async function questMenu() {
  const ids = Object.keys(G.S.quests);
  if (!ids.length) { await say('쪽지함이 비어 있다.'); return; }
  await listMenu({
    x: 0, y: 0, w: 160, h: 96,
    items: () => ids.map(id => { const [a, b] = QUESTS[id].prog(); return { label: QUESTS[id].title, right: G.S.quests[id] === 'done' ? '완료' : `${Math.min(a, b)}/${b}`, dim: G.S.quests[id] === 'done' }; }),
    over: me => { box(0, 96, 160, 48); const q = QUESTS[ids[me.i]]; if (q) { wrap(q.desc, 142).slice(0, 1).forEach(l => drawText(l, 9, 102)); drawText(`보상: ${q.reward[0]} ×${q.reward[1]}`, 9, 120, 2); } },
  });
}

// ───────── 업무혁신 담당 (업무경감 도구) ─────────
async function innovTalk() {
  if (!F().dex) { await say('업무경감 도구를 나눠 드리는 업무혁신 담당이에요. 업무도감을 받고 다시 오세요!'); return; }
  if (!F().tool1) {
    await says('반가워요! 저는 교직원들이 만든 업무경감 도구를 소개하는 일을 해요.', '도구를 교행몬에게 쓰면 새 기술을 익혀요. 몇 번을 써도 닳지 않죠!');
    await getItem('JBEdu FORM', 1);
    F().tool1 = 1;
    await says('한글 문서 서식을 버튼 하나로 맞춰 주는 도구예요. 「서식 일괄 적용」을 가르칠 수 있어요.', '다른 도구는 서류숲과 완주 어딘가에 있대요. 찾아보세요!');
    return;
  }
  await say('도구는 가방에서 꺼내 교행몬에게 쓰면 돼요. 몇 번이든 쓸 수 있어요!');
}
