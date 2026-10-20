// 怪獸對戰引擎：數學、注音遊戲共用。規則說明見 docs/battle-rules.md
// 畫面參考寶可夢 GB 版戰鬥：怪獸在右上、玩家在左下、下方是訊息框與 2×2 選單
// 需要先載入 shared/sound.js 與 shared/battle.css
(function () {
  // ===== 規則數字（要調整改這裡；每一關可以用 level.rules 覆蓋）=====
  const RULES = {
    monsterHp: 100,
    playerHp: 100,
    attackTiers: [                 // 答對時，依花費秒數決定攻擊力
      { within: 3, power: 20, crit: true },
      { within: 6, power: 15 },
      { within: Infinity, power: 10 },
    ],
    wrongPower: 10,                // 答錯：怪獸攻擊力
    firstAttackAt: 10,             // 拖太久：第幾秒第一次攻擊
    attackEvery: 5,                // 之後每幾秒攻擊一次
    timedPower: 5,                 // 拖太久：每次攻擊力
    chargeTime: 2,                 // 攻擊前蓄力提示秒數
    wrongChargeTime: .8,           // 答錯時的蓄力秒數
  };

  const CHEERS = ['打中了！', '好厲害！', '太棒了！', '漂亮！'];
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 依剩下血量給星星
  function starsFor(hp, max) { return hp >= max * .7 ? 3 : hp >= max * .4 ? 2 : 1; }

  // 角色圖片：有放圖就用圖，沒有就用 emoji 暫代
  function makeSprite(el, cfg) {
    const loaded = {};
    let state = 'idle';
    function draw() {
      const src = loaded[state] || loaded.idle;
      if (src) el.innerHTML = `<img src="${src}" alt="">`;
      else el.textContent = cfg.emoji;
    }
    Object.entries(cfg.img || {}).forEach(([k, src]) => {
      const im = new Image();
      im.onload = () => { loaded[k] = src; draw(); };
      im.src = src;
    });
    draw();
    return { set(s) { state = s; draw(); } };
  }

  /**
   * 開始一場對戰（一關）
   * opts.root            放對戰畫面的元素
   * opts.level           { no, title, monster:{ name, emoji, img:{idle,hurt,down}, moves:[...] }, rules:{...} }
   * opts.player          { name, emoji, img:{ idle, attack, hurt }, moves:[...] }
   * opts.nextQuestion(last)   回傳題目 { choices:[...], ans }；choices 可以是文字，或 { html, value }
   * opts.renderQuestion(q, el) 把題目畫進題目框
   * opts.speech(q)       要唸出來的題目文字
   * opts.answerText(q)   答錯時顯示的正確答案（可省略，預設用 ans）
   * opts.background      背景圖路徑（可省略）
   * opts.hasNext         有沒有下一關
   * opts.isLast          是不是最後一關（過關時顯示「全部破關」）
   * opts.onWin(result)   過關時呼叫（result = { stars, hp }），用來存進度
   * opts.onEnd(result)   一場打完（輸贏都算）時呼叫，result = { won, stars, hp, correct, crit, wrong, score }
   * opts.overExtra(result)  結算畫面要多顯示的 HTML（例如排行榜）
   * opts.onNext()        按「下一關」
   * opts.onExit()        按 ✕ 或「回關卡地圖」
   * opts.exitLabel      離開按鈕的文字（預設「回關卡地圖」）
   */
  function start(opts) {
    const root = opts.root;
    const level = opts.level || { no: 1, title: '', monster: opts.monster };
    const R = Object.assign({}, RULES, level.rules || {});
    const mon = level.monster;
    const ply = opts.player;

    root.innerHTML = `
      <div class="bt">
        <div class="bt-top">
          <button class="bt-icon" data-act="quit" aria-label="離開">✕</button>
          <div class="bt-round">第 ${level.no} 關${level.title ? '・' + esc(level.title) : ''}</div>
          <button class="bt-icon" data-act="speak" aria-label="唸題目">🔊</button>
        </div>
        <div class="bt-field">
          <div class="bt-info bt-info-m">
            <div class="bt-info-name"><span>${esc(mon.name)}</span><span class="bt-lv">Lv${level.no}</span></div>
            <div class="bt-hp"><b>HP</b><div class="bt-bar"><div class="bt-fill" data-hp="m"></div></div></div>
            <div class="bt-charge"><div></div></div>
          </div>
          <div class="bt-spot bt-spot-m" data-stage="m">
            <div class="bt-ground"></div><div class="bt-sprite bt-m"></div><div class="bt-warn">⚡</div>
          </div>
          <div class="bt-spot bt-spot-p" data-stage="p">
            <div class="bt-ground"></div><div class="bt-sprite bt-p"></div>
          </div>
          <div class="bt-info bt-info-p">
            <div class="bt-info-name"><span>${esc(ply.name)}</span></div>
            <div class="bt-hp"><b>HP</b><div class="bt-bar"><div class="bt-fill" data-hp="p"></div></div></div>
            <div class="bt-num" data-num="p"></div>
          </div>
          <div class="bt-wipe"></div>
        </div>
        <div class="bt-log"></div>
        <div class="bt-q"></div>
        <div class="bt-choices"></div>
        <div class="bt-over"></div>
      </div>`;

    const $ = sel => root.querySelector(sel);
    const bt = $('.bt'), mEl = $('.bt-m'), pEl = $('.bt-p');
    const qEl = $('.bt-q'), logEl = $('.bt-log'), choicesEl = $('.bt-choices'), overEl = $('.bt-over');
    const monster = makeSprite(mEl, mon);
    const player = makeSprite(pEl, ply);

    if (opts.background) {
      const im = new Image();
      im.onload = () => { $('.bt-field').style.backgroundImage = `url("${opts.background}")`; bt.classList.add('has-bg'); };
      im.src = opts.background;
    }

    // ===== 狀態 =====
    let mHp, pHp, q, round, elapsed, nextAttackAt, state, last, clock, timers, stats;
    // state：asking（作答中，會計時）、busy（動畫中）、over（結束）

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; clearInterval(clock); }
    function log(text, color) { logEl.textContent = text; logEl.style.color = color || ''; }

    function reset() {
      if (timers) clearAll();
      timers = [];
      mHp = R.monsterHp; pHp = R.playerHp; q = null; round = 0;
      stats = { correct: 0, crit: 0, wrong: 0, hitByTime: 0 };
      monster.set('idle'); player.set('idle');
      mEl.className = 'bt-sprite bt-m'; pEl.className = 'bt-sprite bt-p';
      overEl.classList.remove('on');
      qEl.innerHTML = ''; choicesEl.innerHTML = '';
      drawHp();
      last = performance.now();
      clock = setInterval(tick, 100);   // 每 0.1 秒檢查一次時間
      intro();
    }

    // 開場：畫面閃一下，雙方滑進來
    function intro() {
      state = 'busy';
      bt.classList.remove('intro'); void bt.offsetWidth; bt.classList.add('intro');
      log(`野生的 ${mon.name} 跳出來了！`);
      Sound.beep([392, 523, 659, 784], .1, 'square');
      Sound.say(`野生的 ${mon.name} 跳出來了！`);
      later(() => { log(`加油！打倒 ${mon.name}！`); }, 1600);
      later(() => bt.classList.remove('intro'), 2200);   // 動畫結束後移除，避免畫面停在黑幕
      later(nextQ, 2400);
    }

    function drawHp() {
      [['m', mHp, R.monsterHp], ['p', pHp, R.playerHp]].forEach(([k, hp, max]) => {
        const pct = Math.max(0, hp) / max * 100;
        const fill = $(`[data-hp="${k}"]`);
        fill.style.width = pct + '%';
        fill.classList.toggle('mid', pct <= 50 && pct > 20);
        fill.classList.toggle('low', pct <= 20);
      });
      $('[data-num="p"]').textContent = `${Math.max(0, pHp)} / ${R.playerHp}`;
    }

    const norm = c => (c && typeof c === 'object') ? c : { html: esc(c), value: c };

    function nextQ() {
      q = opts.nextQuestion(q);
      round++;
      elapsed = 0; nextAttackAt = R.firstAttackAt;
      stopCharge();
      opts.renderQuestion(q, qEl);
      log(`第 ${round} 題`);
      choicesEl.innerHTML = '';
      choicesEl.classList.toggle('three', q.choices.length === 3);
      q.choices.map(norm).forEach(c => {
        const b = document.createElement('button');
        b.innerHTML = `<span class="bt-cur">▶</span><span class="bt-c">${c.html}</span>`;
        b.dataset.value = String(c.value);
        b.onclick = () => pick(b, c.value);
        choicesEl.appendChild(b);
      });
      state = 'asking';
      Sound.say(opts.speech(q));
    }

    // ===== 計時：拖太久怪獸會攻擊 =====
    function tick() {
      const now = performance.now();
      const dt = Math.min(.25, (now - last) / 1000);   // 平板休眠回來時不會一次跳很多秒
      last = now;
      if (state === 'asking' && !document.hidden) {   // 切到別的分頁時暫停計時
        elapsed += dt;
        if (!bt.classList.contains('charging') && elapsed >= nextAttackAt - R.chargeTime) startCharge(R.chargeTime);
        if (elapsed >= nextAttackAt) {
          nextAttackAt += R.attackEvery;
          stopCharge();
          stats.hitByTime++;
          monsterAttack(R.timedPower);
        }
      }
    }

    function startCharge(sec) {
      bt.style.setProperty('--charge', sec + 's');
      bt.classList.remove('charging'); void bt.offsetWidth;   // 重新播放蓄力動畫
      bt.classList.add('charging');
      if (state === 'asking') log(`${mon.name} 正在蓄力！快回答！`, '#d33');
      Sound.beep([200, 240, 280, 320], sec / 4, 'sawtooth');
    }
    function stopCharge() { bt.classList.remove('charging'); }

    function flash(el, cls, ms) {
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      later(() => el.classList.remove(cls), ms);
    }

    function floatDmg(stage, text, crit) {
      const d = document.createElement('div');
      d.className = 'bt-dmg' + (crit ? ' crit' : '');
      d.textContent = text;
      $(`[data-stage="${stage}"]`).appendChild(d);
      later(() => d.remove(), 1200);
    }

    // ===== 怪獸攻擊玩家 =====
    function monsterAttack(power) {
      const move = pickOne(mon.moves || ['撞擊']);
      log(`${mon.name} 使出了 ${move}！`, '#d33');
      flash(mEl, 'lunge', 300);
      later(() => {
        if (state === 'over') return;   // 已經分出勝負就不再扣血
        pHp -= power;
        player.set('hurt');
        flash(pEl, 'hit', 450);
        floatDmg('p', `-${power}`);
        Sound.beep([180, 120], .15, 'square');
        drawHp();
        later(() => { if (state !== 'over') player.set('idle'); }, 600);
        if (pHp <= 0) lose();
      }, 200);
    }

    // ===== 作答 =====
    function pick(btn, value) {
      if (state !== 'asking') return;
      state = 'busy';
      stopCharge();
      choicesEl.querySelectorAll('button').forEach(b => b.disabled = true);
      const rightBtn = [...choicesEl.children].find(b => b.dataset.value === String(q.ans));

      if (String(value) === String(q.ans)) {
        const tier = R.attackTiers.find(t => elapsed <= t.within);
        stats.correct++; if (tier.crit) stats.crit++;
        btn.classList.add('right');
        const move = pickOne(ply.moves || ['衝撞']);
        log(tier.crit ? `你使出了 ${move}！⚡ 暴擊！` : `你使出了 ${move}！${pickOne(CHEERS)}`, '#2a8a2a');
        Sound.beep(tier.crit ? [660, 880, 1100, 1320] : [660, 880, 1100]);
        Sound.say(tier.crit ? '暴擊！' : pickOne(CHEERS));
        // 玩家攻擊
        player.set('attack');
        flash(pEl, 'lunge', 300);
        later(() => {
          mHp -= tier.power;
          monster.set('hurt');
          flash(mEl, 'hit', 450);
          floatDmg('m', `-${tier.power}`, tier.crit);
          drawHp();
          player.set('idle');
          if (mHp <= 0) return win();
          later(() => monster.set('idle'), 600);
          later(nextQ, 1300);
        }, 250);
      } else {
        // 答錯：顯示正確答案，怪獸蓄力後攻擊，再換新題目
        stats.wrong++;
        btn.classList.add('wrong');
        if (rightBtn) rightBtn.classList.add('right');
        const ansText = opts.answerText ? opts.answerText(q) : String(q.ans);
        log(`答案是 ${ansText}，小心！`, '#d33');
        Sound.say(`答案是 ${ansText}`);
        startCharge(R.wrongChargeTime);
        later(() => {
          stopCharge();
          monsterAttack(R.wrongPower);
          later(() => { if (state !== 'over') nextQ(); }, 1600);
        }, R.wrongChargeTime * 1000);
      }
    }

    // ===== 勝負 =====
    function win() {
      state = 'over';
      monster.set('down');
      later(() => { mEl.classList.add('down'); log(`${mon.name} 倒下了！`, '#2a8a2a'); }, 300);
      Sound.beep([523, 659, 784, 1047], .15);
      const stars = starsFor(pHp, R.playerHp);
      const result = finish(true, stars);
      opts.onWin && opts.onWin({ stars, hp: pHp });
      later(() => {
        Sound.say(`打倒 ${mon.name} 了！`);
        showOver('🏆', `打倒 ${esc(mon.name)} 了！`, [
          `<div class="bt-stars">${'⭐'.repeat(stars)}<span>${'⭐'.repeat(3 - stars)}</span></div>`,
          `答對 ${stats.correct} 題，暴擊 ${stats.crit} 次，得到 ${result.score} 分`,
        ], result, opts.hasNext
          ? `<button data-act="next">▶ 下一關</button><button class="alt" data-act="again">再玩一次</button>`
          : `${opts.isLast ? '<p class="bt-final">🎉 全部關卡都破關了！</p>' : ''}<button class="alt" data-act="again">再玩一次</button>`);
      }, 1400);
    }

    function lose() {
      state = 'over';
      stopCharge();
      player.set('hurt');
      pEl.classList.add('down');
      log('你沒有力氣了……', '#d33');
      Sound.beep([392, 330, 262], .2);
      const result = finish(false, 0);
      later(() => {
        Sound.say('再挑戰一次吧！');
        showOver('💪', `${esc(mon.name)} 好強！`, [
          mHp < R.monsterHp ? `${esc(mon.name)} 只剩 ${Math.max(0, mHp)} 滴血了` : '多練習幾次，一定打得倒！',
          `答對 ${stats.correct} 題，得到 ${result.score} 分，再挑戰一次吧！`,
        ], result, `<button data-act="again">再挑戰一次</button>`);
      }, 1200);
    }

    // 算分數：每題答對 10 分＋暴擊 5 分＋過關時剩下的血量
    function finish(won, stars) {
      const result = { won, stars, hp: Math.max(0, pHp), correct: stats.correct, crit: stats.crit, wrong: stats.wrong,
                       score: stats.correct * 10 + stats.crit * 5 + (won ? Math.max(0, pHp) : 0) };
      opts.onEnd && opts.onEnd(result);
      return result;
    }

    function showOver(emoji, title, lines, result, buttons) {
      overEl.innerHTML = `<div class="bt-over-box"><div class="bt-big-emoji">${emoji}</div><h2>${title}</h2>
        ${lines.map(l => l.startsWith('<') ? l : `<p>${l}</p>`).join('')}
        ${opts.overExtra ? opts.overExtra(result) : ''}
        ${buttons}
        <button class="alt" data-act="quit">${opts.exitLabel || '回關卡地圖'}</button></div>`;
      overEl.classList.add('on');
    }

    function quit() {
      clearAll();
      state = 'over';
      Sound.hush();
      opts.onExit && opts.onExit();
    }

    root.onclick = e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'quit') quit();
      else if (act === 'again') reset();
      else if (act === 'next') { clearAll(); state = 'over'; opts.onNext && opts.onNext(); }
      else if (act === 'speak' && q && state === 'asking') Sound.say(opts.speech(q));
    };

    reset();
    return { quit };
  }

  window.Battle = { start, RULES, starsFor };
})();
