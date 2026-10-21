// ───────── 전투 ─────────
const stg = n => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
const freshStages = () => ({ atk: 0, def: 0, spc: 0, spd: 0, acc: 0, eva: 0 });
const freshVol = () => ({ confuse: 0, recharge: false });
async function anim(n, fn) { for (let i = 0; i < n; i++) { fn(i); await sleepF(1); } }
function monName(m) { return m.nick || m.sp; }

class Battle {
  constructor(opt) {
    this.opt = opt; this.wild = !opt.trainer; this.tr = opt.trainer;
    this.eParty = this.wild ? [makeMon(opt.wild[0], opt.wild[1])] : opt.trainer.team.map(([s, l]) => makeMon(s, l, 9));
    this.ei = 0; this.E = this.eParty[0];
    this.pi = G.S.party.findIndex(m => m.hp > 0); this.M = G.S.party[this.pi];
    this.stE = freshStages(); this.stP = freshStages(); this.vE = freshVol(); this.vP = freshVol();
    this.part = new Set([this.pi]); this.tries = 0;
    this.eX = -48; this.pX = 160; this.eDy = 0; this.pDy = 0; this.eHide = false; this.pHide = false;
    this.eBlink = 0; this.pBlink = 0; this.hudE = false; this.hudP = false;
    this.eTrainer = !this.wild; this.pTrainer = true; this.ball = null;
    this.dE = this.E.hp; this.dP = this.M.hp; this.menu = 0; this.mvi = 0;
    G.S.seen[this.E.sp] = 1;
  }
  tick() {
    const step = (d, m) => d === m.hp ? d : (d > m.hp ? Math.max(m.hp, d - Math.max(1, Math.ceil(m.mhp / 48))) : Math.min(m.hp, d + Math.max(1, Math.ceil(m.mhp / 48))));
    this.dE = step(this.dE, this.E); this.dP = step(this.dP, this.M);
    if (this.eBlink > 0) this.eBlink--; if (this.pBlink > 0) this.pBlink--;
  }
  async waitHp() { while (this.dE !== this.E.hp || this.dP !== this.M.hp) await sleepF(1); await sleepF(6); }
  draw() {
    fillScr(0);
    const blink = b => b > 0 && (b >> 2) % 2 === 0;
    // 상대
    if (this.eTrainer) {
      const c = artCanvas(`c_${this.tr.ch}_down0`);
      ctx.drawImage(c, 0, 0, 16, 16, this.eX + 4, 4, 32, 32);
    } else if (!this.eHide && !blink(this.eBlink)) {
      const img = artCanvas(SP[this.E.sp].art);
      const h = Math.max(0, 40 - this.eDy);
      if (h > 0) ctx.drawImage(img, 0, 0, 40, h, this.eX, 4 + this.eDy, 40, h);
    }
    // 내 쪽
    if (this.pTrainer) {
      const c = artCanvas('c_player_up0');
      ctx.drawImage(c, 0, 0, 16, 16, this.pX + 4, 52, 32, 32);
    } else if (!this.pHide && !blink(this.pBlink)) {
      const img = artCanvas(SP[this.M.sp].art, true);
      const h = Math.max(0, 40 - this.pDy);
      if (h > 0) ctx.drawImage(img, 0, 0, 40, h, this.pX, 52 + this.pDy, 40, h);
    }
    if (this.ball) ctx.drawImage(artCanvas('t_envelope'), this.ball[0], this.ball[1]);
    if (this.sweat && this.sweat.t > 0) {
      this.sweat.t--;
      const [sx, sy] = this.sweat.side === 'p' ? [46, 54] : [146, 6];
      const dy = (40 - this.sweat.t) >> 3;
      ctx.fillStyle = PAL[3]; ctx.fillRect(sx + 1, sy + dy, 1, 1); ctx.fillRect(sx, sy + dy + 1, 3, 3); ctx.fillStyle = PAL[0]; ctx.fillRect(sx + 1, sy + dy + 2, 1, 1);
    }
    this.drawFx();
    if (this.hudE) this.drawHud(this.E, this.dE, 6, 2, false);
    if (this.hudP) this.drawHud(this.M, this.dP, 76, 52, true);
    if (!G.ui.length) box(TB.x, TB.y, TB.w, TB.h);
  }
  drawHud(m, dh, x, y, mine) {
    drawText(monName(m), x + 2, y);
    if (m.st) drawText(STN[m.st], x + 2, y + 11, 2);
    else drawText('Lv' + m.lv, x + (mine ? 34 : 34), y + 11);
    const bx = x + 16, by = y + 25, bw = 62;
    drawText('HP', x + 2, y + 21);
    ctx.fillStyle = PAL[3]; ctx.fillRect(bx, by, bw + 2, 5);
    ctx.fillStyle = PAL[0]; ctx.fillRect(bx + 1, by + 1, bw, 3);
    const fw = Math.ceil(bw * dh / m.mhp);
    ctx.fillStyle = PAL[dh / m.mhp < 0.25 ? 3 : 2]; ctx.fillRect(bx + 1, by + 1, fw, 3);
    ctx.fillStyle = PAL[3];
    if (mine) {
      drawTextR(`${dh}/${m.mhp}`, x + 80, y + 30);
      ctx.fillRect(x + 82, y + 8, 1, 34); ctx.fillRect(x - 4, y + 41, 87, 1);
    } else {
      ctx.fillRect(x - 2, y + 12, 1, 22); ctx.fillRect(x - 2, y + 33, 86, 1);
      ctx.fillRect(x + 82, y + 31, 2, 1); ctx.fillRect(x + 83, y + 32, 1, 1);
    }
  }

  // ── 진행 ──
  async run() {
    // 등장
    await anim(40, i => { const k = (i + 1) / 40; this.eX = Math.round(-48 + (112 + 48) * k); this.pX = Math.round(160 - (160 - 12) * k); });
    if (this.wild) {
      this.eTrainer = false; this.hudE = true;
      await say(`앗! 미발령 ${J(this.E.sp, '이가')} 나타났다!`);
    } else {
      await say(`${J(this.tr.name, '이가')} 업무 대결을 신청했다!`);
      await anim(16, i => { this.eX = 112 + i * 4; });
      this.eTrainer = false; this.eX = 112;
      await this.sendEnemy();
    }
    await anim(16, i => { this.pX = 12 - i * 4; });
    this.pTrainer = false; this.pX = 12;
    await this.sendMine();
    // 반복
    for (;;) {
      const act = this.vP.recharge ? { t: 'recharge' } : await this.chooseAction();
      if (act.t === 'run') {
        if (!this.wild) { await say('트레이너와의 승부에서는 퇴근할 수 없다!'); continue; }
        this.tries++;
        const ok = this.M.spd >= this.E.spd || Math.random() * 256 < (this.M.spd * 32 / Math.max(1, (this.E.spd >> 2) & 255) + 30 * this.tries);
        if (ok) { sfx('run'); await say('무사히 퇴근했다!'); return 'run'; }
        await say('퇴근할 수 없었다!');
        if (await this.enemyTurnOnly()) return this.result;
        continue;
      }
      if (act.t === 'ball') {
        const r = await this.throwBall(act.id);
        if (r === 'caught') return 'caught';
        if (r === 'blocked') continue;
        if (await this.enemyTurnOnly()) return this.result;
        continue;
      }
      if (act.t === 'item' || act.t === 'switch') {
        if (await this.enemyTurnOnly()) return this.result;
        continue;
      }
      // 기술
      const eMove = this.vE.recharge ? null : this.aiMove();
      const pMove = act.t === 'recharge' ? null : act.mv;
      const pPri = pMove && MV[pMove.id].fx === 'prio' ? 1 : 0, ePri = eMove && MV[eMove.id].fx === 'prio' ? 1 : 0;
      const pS = this.M.spd * stg(this.stP.spd) * (this.M.st === 'wait' ? 0.25 : 1), eS = this.E.spd * stg(this.stE.spd) * (this.E.st === 'wait' ? 0.25 : 1);
      const pFirst = pPri !== ePri ? pPri > ePri : (pS !== eS ? pS > eS : chance(0.5));
      const order = pFirst ? ['p', 'e'] : ['e', 'p'];
      for (const s of order) {
        const end = await this.doTurn(s, s === 'p' ? pMove : eMove);
        if (end) return this.result;
        if (end === null) break;
      }
      if (await this.endOfTurn()) return this.result;
    }
  }
  async sendEnemy() {
    this.E = this.eParty[this.ei]; this.dE = this.E.hp; this.stE = freshStages(); this.vE = freshVol();
    G.S.seen[this.E.sp] = 1;
    this.eHide = true; this.hudE = true;
    if (!this.wild) await say(`${J(this.tr.name, '은는')} ${J(this.E.sp, '을를')} 내보냈다!`, { auto: 50 });
    this.eHide = false; this.eDy = 0;
    await anim(10, i => { this.eBlink = i % 2 ? 0 : 4; });
  }
  async sendMine() {
    this.M = G.S.party[this.pi]; this.dP = this.M.hp; this.stP = freshStages(); this.vP = freshVol();
    this.part.add(this.pi);
    this.pHide = true; this.hudP = false;
    await say(`부탁해, ${monName(this.M)}!`, { auto: 40 });
    this.pHide = false; this.pDy = 0; this.hudP = true;
    await anim(10, i => { this.pBlink = i % 2 ? 0 : 4; });
  }

  // ── 명령 ──
  async chooseAction() {
    for (;;) {
      const p = showPanel(() => { box(0, 96, 160, 48); drawText(J(monName(this.M), '은는'), 9, 104); drawText('무엇을 할까?', 9, 121); });
      const c = await choose(['기술', '가방', '교행몬', '퇴근'], { x: 72, y: 96, w: 88, h: 48, cols: 2, rh: 17, start: this.menu, cancel: false });
      removeUI(p);
      this.menu = c;
      if (c === 0) {
        const usable = this.M.moves.filter(m => m.pp > 0);
        if (!usable.length) { await say(`${monName(this.M)}에게는 쓸 수 있는 기술이 없다!`); return { t: 'move', mv: { id: '야근', pp: 99 } }; }
        const mv = await this.moveMenu();
        if (mv < 0) continue;
        const m = this.M.moves[mv];
        if (m.pp <= 0) { await say('남은 PP가 없다!'); continue; }
        return { t: 'move', mv: m };
      }
      if (c === 1) {
        const r = await bagMenu(true, this);
        if (r) return r;
        continue;
      }
      if (c === 2) {
        const r = await partyMenu('battle', this);
        if (r != null && r !== this.pi) {
          await say(`수고했어, ${monName(this.M)}! 돌아와!`, { auto: 40 });
          this.pHide = true;
          this.pi = r; await this.sendMine();
          return { t: 'switch' };
        }
        continue;
      }
      if (c === 3) return { t: 'run' };
    }
  }
  moveMenu() {
    const B = this;
    const w = {
      i: B.mvi,
      update() {
        const n = B.M.moves.length;
        if (nav('down')) { this.i = (this.i + 1) % n; sfx('sel'); }
        if (nav('up')) { this.i = (this.i + n - 1) % n; sfx('sel'); }
        if (PRESS.a) { sfx('sel'); B.mvi = this.i; this.resolve(this.i); }
        else if (PRESS.b) { sfx('sel'); this.resolve(-1); }
      },
      draw() {
        box(0, 78, 160, 66);
        B.M.moves.forEach((m, k) => {
          const y = 84 + k * 14;
          drawText(m.id, 15, y);
          drawTextR(`${m.pp}/${MV[m.id].pp}`, 153, y, m.pp ? 3 : 2);
          if (k === this.i) cursor(7, y);
        });
        const mv = MV[B.M.moves[this.i].id];
        box(0, 58, 92, 22);
        drawText('유형/' + (mv.t || '일반'), 8, 64);
      },
    };
    return pushUI(w);
  }
  aiMove() {
    const ms = this.E.moves.filter(m => m.pp > 0);
    if (!ms.length) return { id: '야근', pp: 99 };
    if (!this.wild && chance(0.5)) {
      const good = ms.filter(m => MV[m.id].p > 0 && eff(MV[m.id].t, SP[this.M.sp].type) > 1);
      if (good.length) return good[rnd(0, good.length - 1)];
    }
    return ms[rnd(0, ms.length - 1)];
  }

  // ── 한 차례 ──  반환: true=전투 끝, null=이번 턴 남은 행동 생략, false=계속
  async doTurn(side, move) {
    const me = side === 'p' ? this.M : this.E, foe = side === 'p' ? this.E : this.M;
    const vol = side === 'p' ? this.vP : this.vE;
    const nm = side === 'p' ? monName(me) : (this.wild ? '미발령 ' : '상대 ') + me.sp;
    if (me.hp <= 0) return false;
    if (vol.recharge) { vol.recharge = false; await say(`${J(nm, '은는')} 숨을 고르느라 움직일 수 없다!`); return false; }
    if (me.st === 'sleep') {
      if (--me.sleepN <= 0) { me.st = null; await say(`${J(nm, '은는')} 졸음에서 깨어났다!`); }
      else await say(`${J(nm, '은는')} 꾸벅꾸벅 졸고 있다.`);
      return false;
    }
    if (me.st === 'freeze') {
      if (chance(0.2)) { me.st = null; await say(`${nm}의 전산이 복구됐다!`); }
      else { await say(`${J(nm, '은는')} 전산먹통이라 움직일 수 없다!`); return false; }
    }
    if (me.st === 'wait' && chance(0.25)) { await say(`${J(nm, '은는')} 결재대기 중이라 움직일 수 없다!`); return false; }
    if (vol.confuse > 0) {
      if (--vol.confuse <= 0) await say(`${nm}의 지침혼선이 풀렸다!`);
      else {
        await say(`${J(nm, '은는')} 지침혼선에 빠져 있다!`);
        if (chance(0.5)) {
          const d = Math.max(1, Math.floor(Math.floor((Math.floor(2 * me.lv / 5) + 2) * 40 * me.atk / me.def / 50) + 2));
          await this.hurt(side, d, 'weak');
          await say('헷갈려서 엉뚱한 일을 해 버렸다!');
          return await this.checkFaint();
        }
      }
    }
    if (!move) return false;
    const mv = MV[move.id];
    if (move.id !== '야근') move.pp--;
    await say(`${nm}의 ${move.id}!`, { auto: 30 });
    // 명중
    const stA = side === 'p' ? this.stP : this.stE, stD = side === 'p' ? this.stE : this.stP;
    if (mv.a && !(mv.fx && mv.fx.startsWith('self'))) {
      const acc = mv.a / 100 * stg(stA.acc) / stg(stD.eva);
      if (Math.random() > acc) { await this.playFx(side, mv.t, true); await say('그러나 헛수고였다!'); return false; }
    }
    if (mv.p > 0) {
      await this.playFx(side, mv.t);
      let hits = 1;
      if (mv.fx === 'multi') hits = [2, 2, 2, 3, 3, 3, 4, 5][rnd(0, 7)];
      let total = 0, lastE = 1, crit = false, n = 0;
      for (n = 0; n < hits; n++) {
        const r = this.calc(me, foe, mv, side);
        crit = r.crit; lastE = r.e;
        const d = Math.min(foe.hp, r.d); total += d;
        if (n > 0) await this.playFx(side, mv.t);
        await this.hurt(side === 'p' ? 'e' : 'p', d, r.e > 1 ? 'hit2' : r.e < 1 ? 'weak' : 'hit');
        if (crit) await say('핵심을 짚었다!', { auto: 40 });
        if (foe.hp <= 0) { n++; break; }
      }
      if (FLAVOR[move.id]) await say(FLAVOR[move.id], { auto: 45 });
      if (hits > 1) await say(`${n}건을 한꺼번에 처리했다!`, { auto: 40 });
      if (lastE > 1) await say('제대로 통했다!', { auto: 45 });
      else if (lastE < 1) await say('별로 통하지 않았다…', { auto: 45 });
      if (mv.fx === 'recharge') vol.recharge = true;
      if (mv.fx === 'struggle') { await this.hurt(side, Math.max(1, Math.floor(total / 2)), 'weak'); await say(`${J(nm, '은는')} 무리한 탓에 지쳐 버렸다!`); }
      if (mv.fx && mv.fx.startsWith('c30') && foe.hp > 0 && chance(0.3)) { const [, , st, v] = mv.fx.split(':'); await this.stage(side === 'p' ? 'e' : 'p', st, +v); }
      const end = await this.checkFaint();
      return end;
    }
    // 변화 기술
    const fx = mv.fx || '';
    if (fx === 'heal') {
      if (me.hp >= me.mhp) { await say('그러나 체력이 이미 가득하다!'); return false; }
      me.hp = Math.min(me.mhp, me.hp + Math.floor(me.mhp / 2)); sfx('stat');
      await this.waitHp(); await say(`${J(nm, '은는')} 체력을 회복했다!`); return false;
    }
    if (fx.startsWith('st:')) {
      const st = fx.slice(3);
      const fvol = side === 'p' ? this.vE : this.vP;
      const fn = side === 'p' ? (this.wild ? '미발령 ' : '상대 ') + foe.sp : monName(foe);
      if (st === 'confuse') {
        if (fvol.confuse > 0) { await say(`${J(fn, '은는')} 이미 지침혼선 상태다!`); return false; }
        fvol.confuse = rnd(2, 5); await say(`${J(fn, '은는')} 지침혼선에 빠졌다!`); return false;
      }
      if (foe.st) { await say('그러나 아무 일도 일어나지 않았다!'); return false; }
      foe.st = st; if (st === 'sleep') foe.sleepN = rnd(1, 3);
      await say(`${J(fn, '은는')} ${STN[st]} 상태가 되었다!`); return false;
    }
    const [who, st, v] = fx.split(':');
    await this.stage(who === 'self' ? side : (side === 'p' ? 'e' : 'p'), st, +v);
    return false;
  }
  calc(att, def, mv, side) {
    const phys = !!PHYS[mv.t];
    const stA = side === 'p' ? this.stP : this.stE, stD = side === 'p' ? this.stE : this.stP;
    let crate = Math.floor(SP[att.sp].base[4] / 2) / 256;
    if (mv.fx === 'crit') crate = Math.min(0.99, crate * 8);
    const crit = Math.random() < crate;
    let A = phys ? att.atk : att.spc, D = phys ? def.def : def.spc;
    if (!crit) { A *= stg(stA[phys ? 'atk' : 'spc']); D *= stg(stD[phys ? 'def' : 'spc']); }
    if (phys && att.st === 'stress') A /= 2;
    const L = att.lv * (crit ? 2 : 1);
    let d = Math.floor(Math.floor((Math.floor(2 * L / 5) + 2) * mv.p * A / Math.max(1, D)) / 50) + 2;
    if (mv.t && mv.t === SP[att.sp].type) d = Math.floor(d * 1.5);
    const e = eff(mv.t, SP[def.sp].type);
    d = Math.floor(d * e);
    d = Math.floor(d * rnd(217, 255) / 255);
    return { d: Math.max(1, d), e, crit };
  }
  async stage(side, st, v) {
    const S = side === 'p' ? this.stP : this.stE;
    const m = side === 'p' ? this.M : this.E;
    const nm = side === 'p' ? monName(m) : (this.wild ? '미발령 ' : '상대 ') + m.sp;
    const cur = S[st], nv = clamp(cur + v, -6, 6);
    if (nv === cur) { await say(`${nm}의 ${J(STATN[st], '은는')} 더 이상 ${v > 0 ? '오르지' : '떨어지지'} 않는다!`); return; }
    S[st] = nv;
    sfx(v > 0 ? 'stat' : 'down');
    if (v > 0) { if (side === 'p') await anim(12, i => { this.pDy = i % 4 < 2 ? -1 : 0; }); else await anim(12, i => { this.eDy = i % 4 < 2 ? -1 : 0; }); }
    this.pDy = 0; this.eDy = 0;
    const word = Math.abs(v) >= 2 ? (v > 0 ? '크게 올라갔다!' : '크게 떨어졌다!') : (v > 0 ? '올라갔다!' : '떨어졌다!');
    await say(`${nm}의 ${J(STATN[st], '이가')} ${word}`);
  }
  async playFx(side, type, miss) {
    const kind = type || '일반';
    const snd = { 일반: 'paper', 기획: 'scribble', 회계: 'ding', 시설: 'tick', 계약: 'thud', 인사: 'clock', 민원: 'pop', 정보: 'click', 감사: 'ping' }[kind];
    this.fx = { kind, side, t: 0, miss };
    for (let i = 0; i < 44; i++) {
      this.fx.t = i;
      if (i === 0 || (i === 22 && kind !== '계약') || (i === 18 && kind === '계약')) sfx(snd);
      await sleepF(1);
    }
    this.fx = null;
  }
  drawFx() {
    const fx = this.fx; if (!fx) return;
    const t = fx.t;
    const A = fx.side === 'p' ? [32, 72] : [132, 24], D = fx.side === 'p' ? [132, 24] : [32, 72];
    const lerp = (k) => [Math.round(A[0] + (D[0] - A[0]) * k), Math.round(A[1] + (D[1] - A[1]) * k)];
    const f = (c, x, y, w, h) => { ctx.fillStyle = PAL[c]; ctx.fillRect(x, y, w, h); };
    const paper = (x, y, c = 0) => { f(3, x, y, 9, 11); f(c, x + 1, y + 1, 7, 9); f(2, x + 2, y + 3, 5, 1); f(2, x + 2, y + 5, 5, 1); f(2, x + 2, y + 7, 3, 1); };
    const check = (x, y) => { f(3, x, y + 3, 2, 2); f(3, x + 1, y + 4, 2, 2); f(3, x + 3, y + 2, 2, 2); f(3, x + 4, y + 1, 2, 2); f(3, x + 5, y, 2, 2); };
    const bubble = (x, y, ch) => { box(x, y, 15, 15); f(3, x + 3, y + 15, 3, 2); drawText(ch, x + 5, y + 3); };
    const stampBox = (x, y, txt) => { const w = textW(txt) + 8; f(2, x - w / 2, y - 7, w, 15); f(0, x - w / 2 + 1, y - 6, w - 2, 13); drawText(txt, x - w / 2 + 4, y - 4, 2); };
    const miss = fx.miss;
    const tgt = miss ? [D[0] + 26, D[1] - 10] : D;
    switch (fx.kind) {
      case '일반': {
        const k = Math.min(1, t / 20), p = lerp(k);
        if (t < 22) { paper(p[0] - 4, p[1] - 12 - Math.round(Math.sin(k * Math.PI) * 10)); paper(p[0] - 1, p[1] - 9 - Math.round(Math.sin(k * Math.PI) * 10)); }
        else { for (let i = 0; i < 3; i++) paper(tgt[0] - 12 + i * 6, tgt[1] - 10 + (i % 2) * 3); }
        break;
      }
      case '기획':
        for (let i = 0; i < 3; i++) {
          const k = Math.min(1, Math.max(0, (t - i * 5) / 18)); if (k <= 0) continue;
          const p = [Math.round(A[0] + (tgt[0] - 14 + i * 12 - A[0]) * k), Math.round(A[1] + (tgt[1] - 14 + (i % 2) * 10 - A[1]) * k - Math.sin(k * Math.PI) * 14)];
          f(3, p[0], p[1], 9, 9); f(1, p[0] + 1, p[1] + 1, 7, 7); f(2, p[0] + 2, p[1] + 3, 5, 1); f(2, p[0] + 2, p[1] + 5, 3, 1);
        }
        break;
      case '회계': {
        const ds = ['1', '+', '2', '=', '3', '원'];
        ds.forEach((d, i) => { const st = i * 4; if (t < st) return; const yy = tgt[1] + 6 - Math.min(18, (t - st)); drawText(d, tgt[0] - 22 + i * 8, yy, 3); });
        if (t > 28 && !miss) stampBox(tgt[0], tgt[1] + 12, '합계');
        break;
      }
      case '시설':
        for (let i = 0; i < 3; i++) if (t > 6 + i * 8) { const x = tgt[0] - 16 + i * 12, y = tgt[1] - 16 + i * 7; box(x - 2, y - 2, 12, 11); check(x + 1, y + 1); }
        break;
      case '계약': {
        const y = t < 18 ? tgt[1] - 40 + t * 2 : tgt[1] - 4;
        if (t < 18) { f(3, tgt[0] - 7, y - 10, 14, 6); f(2, tgt[0] - 2, y - 18, 4, 9); f(1, tgt[0] - 6, y - 9, 12, 4); }
        else stampBox(tgt[0], y, '승인');
        break;
      }
      case '인사': {
        const x = tgt[0], y = tgt[1] - 8;
        f(3, x - 8, y - 8, 17, 17); f(0, x - 7, y - 7, 15, 15); f(3, x, y - 5, 1, 6);
        const a = t / 6; f(3, x + Math.round(Math.cos(a) * 4), y + Math.round(Math.sin(a) * 4), 2, 2);
        if (t > 26 && !miss) stampBox(x, y + 18, '출근');
        break;
      }
      case '민원':
        ['!', '?', '…'].forEach((ch, i) => { if (t > i * 9) bubble(tgt[0] - 24 + i * 15, tgt[1] - 22 + (i % 2) * 8, ch); });
        break;
      case '정보': {
        const k = Math.min(1, t / 18), p = [Math.round(A[0] + (tgt[0] - A[0]) * k), Math.round(A[1] + (tgt[1] - A[1]) * k)];
        f(3, p[0], p[1], 1, 9); for (let i = 1; i < 6; i++) f(3, p[0] + i, p[1] + i, 1, 1); f(3, p[0], p[1] + 8, 4, 1);
        if (t > 20) { box(tgt[0] - 22, tgt[1] + 6, 44, 12); const w = Math.min(36, (t - 20) * 2); f(2, tgt[0] - 18, tgt[1] + 10, w, 4); }
        break;
      }
      case '감사': {
        const x = tgt[0] - 18 + Math.min(36, t * 1.4), y = tgt[1] - 6;
        f(3, x - 5, y - 5, 11, 11); f(0, x - 4, y - 4, 9, 9); f(1, x - 3, y - 3, 3, 2); f(3, x + 5, y + 5, 2, 2); f(3, x + 7, y + 7, 2, 2);
        if (t > 30 && !miss) stampBox(tgt[0], tgt[1] + 14, '지적');
        break;
      }
    }
  }
  async hurt(side, d, snd) {
    const m = side === 'p' ? this.M : this.E;
    sfx(snd);
    this.sweat = { side, t: 40 };
    m.hp = Math.max(0, m.hp - d);
    await this.waitHp();
  }
  async checkFaint() {
    if (this.E.hp <= 0) {
      sfx('faint');
      await anim(24, i => { this.eX = 112 + i * 2; });
      this.eHide = true; this.eX = 112;
      await say(this.wild ? `미발령 ${J(this.E.sp, '은는')} 지쳐서 돌아갔다!` : `상대 ${J(this.E.sp, '은는')} 녹초가 되어 퇴근했다!`);
      this.hudE = false;
      await this.giveExp();
      if (this.M.hp > 0 && false) return false;
      const next = this.eParty.findIndex((m, i) => i > this.ei && m.hp > 0);
      if (next >= 0) {
        this.ei = next; this.part = new Set([this.pi]);
        await this.sendEnemy();
        if (this.M.hp <= 0) return await this.playerFaint();
        return null;
      }
      return await this.win();
    }
    if (this.M.hp <= 0) return await this.playerFaint();
    return false;
  }
  async playerFaint() {
    sfx('faint');
    await anim(24, i => { this.pX = 12 - i * 2; });
    this.pHide = true; this.pX = 12; this.hudP = false;
    await say(`${J(monName(this.M), '은는')} 녹초가 되어 퇴근했다!`);
    if (!G.S.party.some(m => m.hp > 0)) {
      await say(`${G.S.name}에게는 일할 수 있는 교행몬이 없다!`);
      await say(`${J(G.S.name, '은는')} 정신이 아득해졌다…`);
      this.result = 'lose';
      return true;
    }
    if (this.E.hp <= 0) return true;
    let r;
    do { r = await partyMenu('forced', this); } while (r == null || G.S.party[r].hp <= 0);
    this.pi = r;
    await this.sendMine();
    return null;
  }
  async giveExp() {
    const alive = [...this.part].filter(i => G.S.party[i] && G.S.party[i].hp > 0);
    if (!alive.length) return;
    const base = Math.floor(SP[this.E.sp].exp * this.E.lv / 7 * (this.wild ? 1 : 1.5));
    const each = Math.max(1, Math.floor(base / alive.length));
    for (const i of alive) {
      const m = G.S.party[i];
      if (m.lv >= 100) continue;
      m.exp += each;
      await say(`${J(monName(m), '은는')} 경험치를 ${each} 얻었다!`);
      while (m.lv < 100 && m.exp >= expAt(m.lv + 1)) {
        await levelUp(m, this);
        if (m === this.M) this.dP = m.hp;
      }
    }
  }
  async win() {
    if (this.wild) { this.result = 'win'; return true; }
    playMusic(null);
    jingle('win');
    this.eTrainer = true; this.eHide = false;
    await anim(20, i => { this.eX = 160 - i * 2.4; });
    this.eX = 112;
    await say(`${J(this.tr.name, '과와')}의 업무 대결에서 이겼다!`);
    if (this.tr.defeat) await says(...[].concat(this.tr.defeat));
    const money = (this.tr.money || 20) * this.eParty[this.eParty.length - 1].lv;
    G.S.money += money;
    await say(`${J(G.S.name, '은는')} 상금으로 ${money.toLocaleString()}원을 받았다!`);
    this.result = 'win';
    return true;
  }
  async enemyTurnOnly() {
    const end = await this.doTurn('e', this.vE.recharge ? null : this.aiMove());
    if (end) return true;
    return await this.endOfTurn();
  }
  async endOfTurn() {
    for (const s of ['p', 'e']) {
      const m = s === 'p' ? this.M : this.E;
      if (m.hp <= 0) continue;
      if (m.st === 'burn' || m.st === 'stress') {
        const nm = s === 'p' ? monName(m) : (this.wild ? '미발령 ' : '상대 ') + m.sp;
        await this.hurt(s, Math.max(1, Math.floor(m.mhp / 16)), 'weak');
        await say(m.st === 'burn' ? `${J(nm, '은는')} 번아웃으로 지쳐 간다!` : `${J(nm, '은는')} 민원 스트레스로 괴로워한다!`);
        const end = await this.checkFaint();
        if (end) return true;
      }
    }
    return false;
  }
  async throwBall(id) {
    if (!this.wild) {
      await say('트레이너의 교행몬은 영입할 수 없다!');
      return 'blocked';
    }
    useItem(id);
    await say(`${J(G.S.name, '은는')} ${J(id, '을를')} 던졌다!`, { auto: 30 });
    sfx('throw');
    await anim(24, i => { const t = i / 23; this.ball = [Math.round(40 + 82 * t), Math.round(60 - 70 * t + 50 * t * t)]; });
    this.ball = [122, 26];
    this.eHide = true;
    await sleepF(16);
    const E = this.E, sp = SP[E.sp];
    let a = ((3 * E.mhp - 2 * E.hp) * sp.rate * ITEMS[id].mult) / (3 * E.mhp);
    if (E.st === 'sleep' || E.st === 'freeze') a *= 2; else if (E.st) a *= 1.5;
    const p = Math.min(1, a / 255);
    const ok = Math.random() < p;
    const shakes = ok ? 3 : (p > 0.6 ? 2 : p > 0.3 ? rnd(1, 2) : rnd(0, 1));
    for (let s = 0; s < shakes; s++) {
      sfx('shake');
      await anim(16, i => { this.ball = [122 + (i < 8 ? (i % 4 < 2 ? -2 : 2) : 0), 26]; });
      await sleepF(10);
    }
    if (ok) {
      playMusic(null);
      const w = jingle('catch');
      await say(`좋았어! ${J(E.sp, '을를')} 영입했다!`);
      if (w) await sleepF(10);
      this.ball = null;
      const isNew = !G.S.caught[E.sp];
      G.S.caught[E.sp] = 1; G.S.seen[E.sp] = 1;
      if (isNew && G.S.flags.dex) { await say(`업무도감에 ${E.sp}의 정보가 새로 기록되었다!`); await showDexPage(E.sp); }
      E.st = E.st || null;
      if (G.S.party.length < 6) G.S.party.push(E);
      else { G.S.box.push(E); await say(`${J(E.sp, '은는')} 인력풀로 보내졌다.`); }
      this.result = 'caught';
      return 'caught';
    }
    this.ball = null; this.eHide = false;
    await say(['앗! 발령장을 뿌리쳤다!', '아까워! 거의 됐는데!', '아아! 조금만 더였는데!'][Math.min(2, shakes)]);
    return 'miss';
  }
}

async function levelUp(m, B) {
  const old = { mhp: m.mhp, atk: m.atk, def: m.def, spc: m.spc, spd: m.spd };
  m.lv++;
  calcStats(m);
  m.hp += m.mhp - old.mhp;
  const w = jingle('level');
  await say(`${monName(m)}의 레벨이 ${m.lv}${(jong(String(m.lv)) === 0 || jong(String(m.lv)) === 8) ? '로' : '으로'} 올랐다!`);
  await panel(() => {
    box(64, 0, 96, 92);
    [['체력', 'mhp'], ['추진력', 'atk'], ['내공', 'def'], ['전문성', 'spc'], ['처리속도', 'spd']].forEach(([n, k], i) => {
      drawText(n, 72, 6 + i * 16); drawTextR(m[k], 152, 6 + i * 16);
    });
  });
  for (const [l, mv] of SP[m.sp].learn) if (l === m.lv && !m.moves.some(x => x.id === mv)) await learnMove(m, mv);
}
async function learnMove(m, mv) {
  const nm = monName(m);
  if (m.moves.length < 4) {
    m.moves.push({ id: mv, pp: MV[mv].pp });
    jingle('level');
    await say(`${J(nm, '은는')} ${J(mv, '을를')} 익혔다!`);
    return true;
  }
  for (;;) {
    await say(`${J(nm, '은는')} ${J(mv, '을를')} 익히고 싶어 한다!`);
    await say(`하지만 ${nm}에게는 이미 기술이 4개 있다.`);
    if (!(await yesno(`${J(mv, '을를')} 익히기 위해 다른 기술을 잊게 할까?`))) {
      if (await yesno(`${J(mv, '을를')} 익히는 것을 포기할까?`)) { await say(`${J(nm, '은는')} ${J(mv, '을를')} 익히지 않았다!`); return false; }
      continue;
    }
    await say('어떤 기술을 잊게 할까?', { auto: 1 });
    const k = await choose(m.moves.map(x => x.id), { x: 40, y: 34 });
    if (k < 0) continue;
    const old = m.moves[k].id;
    m.moves[k] = { id: mv, pp: MV[mv].pp };
    await say(`하나 둘… 짠! ${J(nm, '은는')} ${J(old, '을를')} 깨끗이 잊었다!`);
    jingle('level');
    await say(`그리고 ${J(nm, '은는')} ${J(mv, '을를')} 익혔다!`);
    return true;
  }
}

class Flash {
  constructor() { this.t = 0; }
  update() {}
  draw() {
    const t = this.t++;
    if (t < 36) { if ((t >> 2) % 2) fillScr(3); }
    else {
      const k = t - 36;
      ctx.fillStyle = PAL[3];
      for (let i = 0; i < 9; i++) { const w = Math.min(160, k * 6 - i * 4); if (w > 0) { if (i % 2) ctx.fillRect(160 - w, i * 16, w, 16); else ctx.fillRect(0, i * 16, w, 16); } }
    }
  }
}
async function battle(opt) {
  playMusic('battle');
  const fl = new Flash();
  G.ui.push(fl);
  await sleepF(36 + 36);
  removeUI(fl);
  const prev = G.scene;
  const B = new Battle(opt);
  G.scene = B;
  const res = await B.run();
  await fadeOut(0, 3);
  G.scene = prev;
  for (const m of G.S.party) { delete m.sleepN; }
  if (res === 'lose' && !opt.noWhiteout) { await whiteout(); return res; }
  if (res === 'lose') healAll();
  G.fade = 4;
  await checkEvolutions();
  playMusic(curMap().music);
  OW.tick();
  await fadeIn(3);
  return res;
}
// ───────── 승진 ─────────
class EvoScene {
  constructor(m, to) { this.m = m; this.from = SP[m.sp].art; this.to = SP[to].art; this.show = this.from; this.flash = 0; }
  update() {}
  draw() {
    fillScr(0);
    const img = artCanvas(this.show);
    ctx.drawImage(img, 60, 22);
    if (this.flash) { ctx.globalAlpha = 0.5; ctx.fillStyle = PAL[0]; ctx.fillRect(0, 0, W, 96); ctx.globalAlpha = 1; }
    if (!G.ui.length) box(TB.x, TB.y, TB.w, TB.h);
  }
}
async function checkEvolutions() {
  for (const m of G.S.party) {
    const e = SP[m.sp].evo;
    if (!e || m.lv < e[0] || !SP[e[1]].art || m.hp <= 0) continue;
    await evolve(m, e[1]);
  }
}
async function evolve(m, to) {
  const prev = G.scene, old = m.sp;
  const S = new EvoScene(m, to);
  playMusic(null);
  await fadeOut(0, 3); G.scene = S; await fadeIn(3);
  await say(`어? ${monName(m)}의 상태가…!`);
  let cancel = false;
  for (let i = 0, gap = 24; i < 14; i++, gap = Math.max(3, gap - 2)) {
    S.show = i % 2 ? S.to : S.from; sfx('tick');
    for (let k = 0; k < gap; k++) { await sleepF(1); if (BTN.b) cancel = true; }
    if (cancel) break;
  }
  if (cancel) {
    S.show = S.from;
    await say(`어라? ${J(monName(m), '은는')} 승진을 미뤘다.`);
  } else {
    S.show = S.to; S.flash = 1; await sleepF(6); S.flash = 0;
    const w = jingle('badge');
    const oldMhp = m.mhp;
    m.sp = to; calcStats(m); m.hp = Math.max(1, m.hp + m.mhp - oldMhp);
    G.S.seen[to] = 1; G.S.caught[to] = 1;
    await say(`축하합니다! ${J(old, '은는')} ${to}${(jong(to) === 0 || jong(to) === 8) ? '로' : '으로'} 승진했다!`);
    if (w) await sleepF(10);
    for (const [l, mv] of SP[to].learn) if (l === m.lv && !m.moves.some(x => x.id === mv)) await learnMove(m, mv);
  }
  await fadeOut(0, 3); G.scene = prev;
}

async function wildBattle(sp, lv) { await battle({ wild: [sp, lv] }); }
async function whiteout() {
  const lost = Math.floor(G.S.money / 2);
  G.S.money -= lost;
  const h = G.S.lastHeal;
  healAll();
  OW.load(h.map, h.x, h.y, 'up');
  OW.tick();
  G.fade = 0;
  if (lost) await say(`${lost.toLocaleString()}원을 잃어버렸다…`);
  await say(h.msg || '정신을 차려 보니 쉼터였다. 교행몬들도 기운을 되찾았다.');
}
