// 怪獸對戰引擎：數學、注音遊戲共用。規則說明見 docs/battle-rules.md
// 需要先載入 shared/sound.js 與 shared/battle.css
(function () {
  // ===== 規則數字（要調整改這裡）=====
  const RULES = {
    monsterHp: 100,
    playerHp: 100,
    attackTiers: [                 // 答對時，依花費秒數決定攻擊力
      { within: 3, power: 20, crit: true },
      { within: 6, power: 15 },
      { within: Infinity, power: 10 },
    ],
    wrongPower: 10,                // 答錯：怪獸攻擊力
    firstAttackAt: 6,              // 拖太久：第幾秒第一次攻擊
    attackEvery: 5,                // 之後每幾秒攻擊一次
    timedPower: 5,                 // 拖太久：每次攻擊力
    chargeTime: 2,                 // 攻擊前蓄力提示秒數
    wrongChargeTime: .8,           // 答錯時的蓄力秒數
  };

  const CHEERS = ['打中了！', '好厲害！', '太棒了！', '漂亮！'];
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

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
   * 開始一場對戰
   * opts.root           放對戰畫面的元素
   * opts.nextQuestion() 回傳題目 { choices:[...], ans }
   * opts.renderQuestion(q, el)  把題目畫進 el
   * opts.revealAnswer(q, el)    顯示正確答案
   * opts.speech(q)      要唸出來的題目文字
   * opts.monster        { name, emoji, img:{ idle, hurt, down } }
   * opts.player         { name, emoji, img:{ idle, attack, hurt } }
   * opts.background     背景圖路徑（可省略）
   * opts.color          答案按鈕顏色
   * opts.onExit()       按「回選單」或 ✕ 時呼叫
   */
  function start(opts) {
    const root = opts.root;
    root.innerHTML = `
      <div class="bt">
        <div class="bt-top">
          <button class="bt-icon" data-act="quit" aria-label="離開">✕</button>
          <div class="bt-round"></div>
          <button class="bt-icon" data-act="speak" aria-label="唸題目">🔊</button>
        </div>
        <div class="bt-monster">
          <div class="bt-hp"><span class="bt-name">${opts.monster.emoji} ${opts.monster.name}</span>
            <div class="bt-bar"><div class="bt-fill" data-hp="m"></div></div><span class="bt-num" data-num="m"></span></div>
          <div class="bt-stage" data-stage="m"><div class="bt-sprite bt-m"></div><div class="bt-warn">⚡</div></div>
          <div class="bt-charge"><div></div></div>
        </div>
        <div class="bt-q"></div>
        <div class="bt-msg"></div>
        <div class="bt-choices"></div>
        <div class="bt-player">
          <div class="bt-pstage" data-stage="p"><div class="bt-sprite bt-p"></div></div>
          <div class="bt-hp"><span class="bt-name">${opts.player.name}</span>
            <div class="bt-bar"><div class="bt-fill" data-hp="p"></div></div><span class="bt-num" data-num="p"></span></div>
        </div>
        <div class="bt-over"></div>
      </div>`;

    const $ = sel => root.querySelector(sel);
    const bt = $('.bt'), mEl = $('.bt-m'), pEl = $('.bt-p');
    const qEl = $('.bt-q'), msgEl = $('.bt-msg'), choicesEl = $('.bt-choices'), overEl = $('.bt-over');
    if (opts.color) choicesEl.style.setProperty('--c', opts.color);
    const monster = makeSprite(mEl, opts.monster);
    const player = makeSprite(pEl, opts.player);

    if (opts.background) {
      const im = new Image();
      im.onload = () => { bt.style.backgroundImage = `url("${opts.background}")`; bt.classList.add('has-bg'); };
      im.src = opts.background;
    }

    // ===== 狀態 =====
    let mHp, pHp, q, round, elapsed, nextAttackAt, state, last, clock, timers, stats;
    // state：asking（作答中，會計時）、busy（動畫中）、over（結束）

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; clearInterval(clock); }

    function reset() {
      if (timers) clearAll();
      timers = [];
      mHp = RULES.monsterHp; pHp = RULES.playerHp; q = null; round = 0;
      stats = { correct: 0, crit: 0, wrong: 0, hitByTime: 0 };
      monster.set('idle'); player.set('idle');
      mEl.className = 'bt-sprite bt-m'; pEl.className = 'bt-sprite bt-p';
      overEl.classList.remove('on');
      drawHp();
      last = performance.now();
      clock = setInterval(tick, 100);   // 每 0.1 秒檢查一次時間
      nextQ();
    }

    function drawHp() {
      [['m', mHp, RULES.monsterHp], ['p', pHp, RULES.playerHp]].forEach(([k, hp, max]) => {
        const pct = Math.max(0, hp) / max * 100;
        const fill = $(`[data-hp="${k}"]`);
        fill.style.width = pct + '%';
        fill.classList.toggle('mid', pct <= 50 && pct > 25);
        fill.classList.toggle('low', pct <= 25);
        $(`[data-num="${k}"]`).textContent = Math.max(0, hp);
      });
    }

    function nextQ() {
      q = opts.nextQuestion(q);
      round++;
      elapsed = 0; nextAttackAt = RULES.firstAttackAt;
      stopCharge();
      $('.bt-round').textContent = `第 ${round} 題`;
      opts.renderQuestion(q, qEl);
      msgEl.textContent = '';
      choicesEl.innerHTML = '';
      q.choices.forEach(c => {
        const b = document.createElement('button');
        b.textContent = c;
        b.onclick = () => pick(b, c);
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
        if (!bt.classList.contains('charging') && elapsed >= nextAttackAt - RULES.chargeTime) startCharge(RULES.chargeTime);
        if (elapsed >= nextAttackAt) {
          nextAttackAt += RULES.attackEvery;
          stopCharge();
          stats.hitByTime++;
          monsterAttack(RULES.timedPower);
        }
      }
    }

    function startCharge(sec) {
      bt.style.setProperty('--charge', sec + 's');
      bt.classList.remove('charging'); void bt.offsetWidth;   // 重新播放蓄力動畫
      bt.classList.add('charging');
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
    function pick(btn, c) {
      if (state !== 'asking') return;
      state = 'busy';
      stopCharge();
      choicesEl.querySelectorAll('button').forEach(b => b.disabled = true);

      if (c === q.ans) {
        const tier = RULES.attackTiers.find(t => elapsed <= t.within);
        stats.correct++; if (tier.crit) stats.crit++;
        btn.classList.add('right');
        opts.revealAnswer(q, qEl);
        msgEl.style.color = '#5cb85c';
        msgEl.textContent = tier.crit ? '⚡ 暴擊！' : '🎉 ' + pickOne(CHEERS);
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
        [...choicesEl.children].find(b => +b.textContent === q.ans || b.textContent === String(q.ans))?.classList.add('right');
        opts.revealAnswer(q, qEl);
        msgEl.style.color = '#e05555';
        msgEl.textContent = `答案是 ${q.ans}，小心怪獸！`;
        Sound.say(`答案是 ${q.ans}`);
        startCharge(RULES.wrongChargeTime);
        later(() => {
          stopCharge();
          monsterAttack(RULES.wrongPower);
          later(() => { if (state !== 'over') nextQ(); }, 1600);
        }, RULES.wrongChargeTime * 1000);
      }
    }

    // ===== 勝負 =====
    function win() {
      state = 'over';
      monster.set('down');
      later(() => mEl.classList.add('down'), 300);
      Sound.beep([523, 659, 784, 1047], .15);
      later(() => {
        Sound.say('打倒怪獸了！你好厲害！');
        showOver('🏆', '打倒怪獸了！', [
          `答對 ${stats.correct} 題，暴擊 ${stats.crit} 次`,
          `你還剩 ${pHp} 滴血`,
        ]);
      }, 1200);
    }

    function lose() {
      state = 'over';
      stopCharge();
      player.set('hurt');
      pEl.classList.add('down');
      Sound.beep([392, 330, 262], .2);
      later(() => {
        Sound.say('怪獸好強！再挑戰一次吧！');
        showOver('💪', '怪獸好強！', [
          mHp < RULES.monsterHp ? `怪獸只剩 ${Math.max(0, mHp)} 滴血了` : '多練習幾次，一定打得倒！',
          `答對 ${stats.correct} 題，再挑戰一次吧！`,
        ]);
      }, 1200);
    }

    function showOver(emoji, title, lines) {
      overEl.innerHTML = `<div class="bt-big-emoji">${emoji}</div><h2>${title}</h2>
        ${lines.map(l => `<p>${l}</p>`).join('')}
        <button data-act="again">再挑戰一次</button>
        <button class="alt" data-act="quit">回選單</button>`;
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
      else if (act === 'speak' && q) Sound.say(opts.speech(q));
    };

    reset();
    return { quit };
  }

  window.Battle = { start, RULES };
})();
