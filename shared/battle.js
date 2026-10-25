// 怪獸對戰引擎：數學、注音遊戲共用。規則說明見 docs/battle-rules.md
// 畫面依「小一打怪獸 遊戲設計總覽」：關卡故事對話 → 戰鬥（場景背景、怪獸右上、玩家左下、下方答題框）→ 過關／失敗畫面
// 需要先載入 shared/ui.css、shared/sound.js、shared/battle.css
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
  const starsHtml = (n, total = 3) => Array.from({ length: total }, (_, i) => `<span class="ui-star${i < n ? '' : ' off'}">⭐</span>`).join('');

  // 國字旁邊加注音（有載入 shared/zhuyin.js 才會加）
  // 只加在：題目、答案選項、過關／失敗的大標題（其他文字不加，畫面才不會太亂）
  const zy = el => { if (window.Zhuyin && el) window.Zhuyin.apply(el); };

  // 依剩下血量給星星
  function starsFor(hp, max) { return hp >= max * .7 ? 3 : hp >= max * .4 ? 2 : 1; }

  // 角色圖片：有放圖就用圖，沒有就用 emoji 暫代
  // cfg.img 的每個狀態可以是一張圖，或一組圖（例如攻擊有好幾招，每次隨機挑一張）
  function makeSprite(el, cfg) {
    const loaded = {};
    let state = 'idle', current = null;
    function draw() {
      const list = loaded[state] && loaded[state].length ? loaded[state] : loaded.idle;
      current = list && list.length ? pickOne(list) : null;
      if (current) el.innerHTML = `<img src="${current}" alt="">`;
      else el.textContent = cfg.emoji;
    }
    Object.entries(cfg.img || {}).forEach(([k, srcs]) => {
      [].concat(srcs).forEach(src => {
        const im = new Image();
        im.onload = () => { (loaded[k] = loaded[k] || []).push(src); if (k === state) draw(); };
        im.src = src;
      });
    });
    draw();
    return { set(s) { state = s; draw(); }, src: s => (loaded[s] && loaded[s][0]) || (loaded.idle && loaded.idle[0]) || null };
  }

  /**
   * 開始一場對戰（一關）
   * opts.root            放對戰畫面的元素
   * opts.level           { no, title, monster:{ name, emoji, img:{idle,hurt,down}, moves:[...] }, rules:{...} }
   * opts.player          { name, level, emoji, img:{ idle, attack:[...], hurt, win, pose }, moves:[...] }
   * opts.nextQuestion(last)   回傳題目 { choices:[...], ans }；choices 可以是文字，或 { html, value }
   * opts.renderQuestion(q, el) 把題目畫進題目框
   * opts.speech(q)       要唸出來的題目文字
   * opts.answerText(q)   答錯時顯示的正確答案（可省略，預設用 ans）
   * opts.background      這一關的場景背景圖
   * opts.story           開場故事對話（預設 true）
   * opts.hasNext         有沒有下一關
   * opts.isLast          是不是最後一關（過關時顯示「全部破關」）
   * opts.onWin(result)   過關時呼叫（result = { stars, hp }）
   * opts.onCorrect(q)    答對一題時呼叫（錯題複習用）
   * opts.onWrong(q, 選的值, 選項文字)  答錯一題時呼叫（記到答錯清單）
   * opts.onEnd(result)   一場打完（輸贏都算）時呼叫，result = { won, stars, hp, correct, crit, wrong, score }
   * opts.overExtra(result)  結算畫面要多顯示的 HTML（例如排行榜）
   * opts.onNext()        按「下一關」
   * opts.onExit()        按 ⌂ 或「回關卡地圖」
   * opts.exitLabel      離開按鈕的文字（預設「回關卡地圖」）
   */
  function start(opts) {
    const root = opts.root;
    const level = opts.level || { no: 1, title: '', monster: opts.monster };
    const R = Object.assign({}, RULES, level.rules || {});
    const mon = level.monster;
    const ply = opts.player;
    // 關卡名稱：一般是「第 N 關」，錯題複習等特殊關卡可以用 level.label 自訂
    const levelName = level.label || `第 ${level.no} 關`;

    root.innerHTML = `
      <div class="bt">
        <div class="bt-field">
          <div class="bt-hud">
            <span class="bt-hud-l"><button class="ui-round" data-act="quit" aria-label="回關卡地圖">⌂</button><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button></span>
            <div class="bt-round">${esc(levelName)}${level.title ? '・' + esc(level.title) : ''}</div>
            <button class="ui-round" data-act="speak" aria-label="唸題目">🔊</button>
          </div>
          <div class="bt-info bt-info-m">
            <div class="bt-info-name"><span>${esc(mon.name)}</span>${level.no ? `<span class="bt-lv">Lv.${level.no}</span>` : ''}</div>
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
            <div class="bt-info-name"><span class="no-zy">${esc(ply.name)}</span><span class="bt-lv">Lv.${ply.level || 1}</span></div>
            <div class="bt-hp"><b>HP</b><div class="bt-bar"><div class="bt-fill" data-hp="p"></div></div></div>
            <div class="bt-num" data-num="p"></div>
          </div>
          <div class="bt-wipe"></div>
        </div>
        <div class="bt-panel">
          <div class="bt-log"></div>
          <div class="bt-q"></div>
          <div class="bt-choices"></div>
        </div>
        <div class="bt-story"></div>
        <div class="bt-over"></div>
      </div>`;

    const $ = sel => root.querySelector(sel);
    const bt = $('.bt'), mEl = $('.bt-m'), pEl = $('.bt-p');
    const qEl = $('.bt-q'), logEl = $('.bt-log'), choicesEl = $('.bt-choices'), overEl = $('.bt-over'), storyEl = $('.bt-story');
    const monster = makeSprite(mEl, mon);
    const player = makeSprite(pEl, ply);

    let bgUrl = '';
    if (opts.background) {
      const im = new Image();
      im.onload = () => {
        bgUrl = opts.background;
        $('.bt-field').style.backgroundImage = `url("${bgUrl}")`;
        storyEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.35)), url("${bgUrl}")`;
        bt.classList.add('has-bg');
      };
      im.src = opts.background;
    }

    // ===== 狀態 =====
    let mHp, pHp, q, round, elapsed, nextAttackAt, state, last, clock, timers, stats;
    // state：story（故事對話）、asking（作答中，會計時）、busy（動畫中）、over（結束）

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; clearInterval(clock); }
    function log(text, kind) { logEl.textContent = text; logEl.className = 'bt-log' + (kind ? ' ' + kind : ''); }

    // 背景音樂：第 1～5 關戰鬥曲、第 6～9 關快一點的戰鬥曲、第 10 關魔王曲
    const battleSong = level.no >= 10 ? 'boss' : level.no >= 6 ? 'battle2' : 'battle';

    function reset(withStory) {
      if (timers) clearAll();
      window.Music && Music.play(battleSong);
      timers = [];
      mHp = R.monsterHp; pHp = R.playerHp; q = null; round = 0;
      stats = { correct: 0, crit: 0, wrong: 0, hitByTime: 0 };
      monster.set('idle'); player.set('idle');
      mEl.className = 'bt-sprite bt-m'; pEl.className = 'bt-sprite bt-p';
      overEl.className = 'bt-over';
      qEl.innerHTML = ''; choicesEl.innerHTML = ''; log('');
      drawHp();
      last = performance.now();
      clock = setInterval(tick, 100);   // 每 0.1 秒檢查一次時間
      if (withStory && opts.story !== false) showStory(); else intro();
    }

    // ===== 關卡故事對話：英雄和怪獸對看，按「開始戰鬥」才開始 =====
    function showStory() {
      state = 'story';
      storyEl.innerHTML = `
        <div class="bt-bubble"><b>${esc(levelName)}　${esc(mon.name)} 出現了！</b><br>用你的智慧打敗牠吧！</div>
        <div class="bt-story-hero">${imgOr(ply, ['pose', 'idle'])}</div>
        <div class="bt-story-mon">${imgOr(mon, ['idle'])}</div>
        <button class="btn btn-gold bt-go" data-act="go">開始戰鬥</button>`;
      storyEl.classList.add('on');
      Sound.say(`${levelName}，${mon.name}出現了！用你的智慧打敗牠吧！`);
    }

    // 開場：畫面閃一下，雙方滑進來
    function intro() {
      state = 'busy';
      storyEl.classList.remove('on');
      bt.classList.remove('intro'); void bt.offsetWidth; bt.classList.add('intro');
      log(`${mon.name} 跳出來了！`);
      Sound.beep([392, 523, 659, 784], .1, 'square');
      later(() => { log(`加油！打倒 ${mon.name}！`); }, 1300);
      later(() => bt.classList.remove('intro'), 2000);   // 動畫結束後移除，避免畫面停在黑幕
      later(nextQ, 2100);
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
      zy(qEl);
      log(`第 ${round} 題`);
      choicesEl.innerHTML = '';
      choicesEl.dataset.n = q.choices.length;
      q.choices.map(norm).forEach(c => {
        const b = document.createElement('button');
        b.innerHTML = `<span class="bt-c">${c.html}</span>`;
        b.dataset.value = String(c.value);
        b.onclick = () => pick(b, c.value);
        choicesEl.appendChild(b);
      });
      zy(choicesEl);
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
      if (state === 'asking') log(`${mon.name} 正在蓄力！快回答！`, 'bad');
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
      log(`${mon.name} 使出了 ${move}！`, 'bad');
      flash(mEl, 'lunge', 300);
      later(() => {
        if (state === 'over') return;   // 已經分出勝負就不再扣血
        pHp -= power;
        player.set('hurt');
        flash(pEl, 'hit', 450);
        floatDmg('p', `-${power}`);
        Sound.beep([180, 120], .15, 'square');
        drawHp();
        later(() => { if (state !== 'over') player.set('idle'); }, 700);
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
        opts.onCorrect && opts.onCorrect(q);
        btn.classList.add('right');
        const move = pickOne(ply.moves || ['衝撞']);
        log(tier.crit ? `你使出了 ${move}！⚡ 暴擊！` : `你使出了 ${move}！${pickOne(CHEERS)}`, 'good');
        Sound.beep(tier.crit ? [660, 880, 1100, 1320] : [660, 880, 1100]);
        Sound.say(tier.crit ? '暴擊！' : pickOne(CHEERS));
        // 玩家攻擊：隨機挑一個招式動作
        player.set('attack');
        flash(pEl, 'lunge', 300);
        later(() => {
          mHp -= tier.power;
          monster.set('hurt');
          flash(mEl, 'hit', 450);
          floatDmg('m', `-${tier.power}`, tier.crit);
          drawHp();
          if (mHp <= 0) return win();
          later(() => { monster.set('idle'); player.set('idle'); }, 700);
          later(nextQ, 1300);
        }, 250);
      } else {
        // 答錯：顯示正確答案，怪獸蓄力後攻擊，再換新題目
        stats.wrong++;
        // 通知遊戲：記到答錯清單（choice 是孩子選的那個選項）
        opts.onWrong && opts.onWrong(q, value, choiceText(btn));
        btn.classList.add('wrong');
        if (rightBtn) rightBtn.classList.add('right');
        const ansText = opts.answerText ? opts.answerText(q) : String(q.ans);
        log(`答案是 ${ansText}，小心！`, 'bad');
        Sound.say(q.answerSpeech ? ['答案是', ...[].concat(q.answerSpeech)] : `答案是 ${ansText}`);   // answerSpeech：英文答案用英文聲音唸，例如 { en: 'cat' }
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
      later(() => { mEl.classList.add('down'); log(`${mon.name} 倒下了！`, 'good'); }, 300);
      later(() => player.set('win'), 600);
      Sound.beep([523, 659, 784, 1047], .15);
      window.Music && Music.jingle('win');
      const stars = starsFor(pHp, R.playerHp);
      const result = finish(true, stars);
      opts.onWin && opts.onWin({ stars, hp: pHp });
      later(() => {
        Sound.say(`過關！打倒 ${mon.name} 了！`);
        showOver('win', `
          <div class="bt-over-stars">${starsHtml(stars)}</div>
          ${heroImg('win')}
          <div class="logo-text bt-over-title">過關！</div>
          <p>打倒 ${esc(mon.name)}！答對 ${stats.correct} 題、暴擊 ${stats.crit} 次，得到 <b>${result.score}</b> 分</p>
          ${opts.isLast && !opts.hasNext ? '<p class="bt-final">🎉 全部關卡都破關了！</p>' : ''}
          <div class="bt-over-btns">
            ${opts.hasNext ? '<button class="btn btn-gold" data-act="next">下一關 ▶</button>' : ''}
            <button class="btn btn-blue" data-act="again">再玩一次</button>
          </div>`, result);
      }, 1500);
    }

    function lose() {
      state = 'over';
      stopCharge();
      player.set('hurt');
      log('你沒有力氣了……', 'bad');
      Sound.beep([392, 330, 262], .2);
      window.Music && Music.jingle('lose');
      const result = finish(false, 0);
      later(() => {
        Sound.say('再試一次吧！');
        showOver('lose', `
          <div class="logo-text purple bt-over-title">再試一次！</div>
          ${heroImg('hurt')}
          <p>${mHp < R.monsterHp ? `${esc(mon.name)} 只剩 ${Math.max(0, mHp)} 滴血了！` : '多練習幾次，一定打得倒！'}答對 ${stats.correct} 題，得到 <b>${result.score}</b> 分</p>
          <div class="bt-over-btns">
            <button class="btn btn-blue" data-act="again">重新挑戰</button>
          </div>`, result);
      }, 1200);
    }

    function heroImg(stateName) {
      return `<div class="bt-over-hero">${imgOr(ply, [stateName, 'idle'])}</div>`;
    }

    // 選項上看得到的文字（去掉旁邊的注音；只有圖片時用圖片名稱）
    function choiceText(btn) {
      const c = btn.cloneNode(true);
      c.querySelectorAll('.zy-r').forEach(e => e.remove());
      return c.textContent.replace(/\s+/g, ' ').trim() || [...c.querySelectorAll('img')].map(i => i.alt).join('、');
    }

    // 直接放圖片；圖片不存在時換成 emoji
    function imgOr(cfg, states) {
      const st = states.find(k => cfg.img && cfg.img[k]);
      const src = st && [].concat(cfg.img[st])[0];
      return src ? `<img src="${src}" alt="" onerror="this.outerHTML='<span>${cfg.emoji}</span>'">` : `<span>${cfg.emoji}</span>`;
    }

    // 算分數：每題答對 10 分＋暴擊 5 分＋過關時剩下的血量
    function finish(won, stars) {
      const result = { won, stars, hp: Math.max(0, pHp), correct: stats.correct, crit: stats.crit, wrong: stats.wrong,
                       score: stats.correct * 10 + stats.crit * 5 + (won ? Math.max(0, pHp) : 0) };
      opts.onEnd && opts.onEnd(result);
      return result;
    }

    function showOver(kind, html, result) {
      overEl.innerHTML = `<div class="bt-over-box">${html}
        <button class="btn btn-gray bt-over-exit" data-act="quit">${opts.exitLabel || '回關卡地圖'}</button>
        ${opts.overExtra ? opts.overExtra(result) : ''}</div>`;
      overEl.className = `bt-over on ${kind}`;
      zy(overEl.querySelector('.bt-over-title'));
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
      else if (act === 'go' && state === 'story') intro();
      else if (act === 'again') reset(false);
      else if (act === 'next') { clearAll(); state = 'over'; opts.onNext && opts.onNext(); }
      else if (act === 'speak' && q && state === 'asking') Sound.say(opts.speech(q));
    };

    reset(true);
    return { quit };
  }

  window.Battle = { start, RULES, starsFor, starsHtml };
})();
