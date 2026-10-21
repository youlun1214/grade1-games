// 8 位元電玩背景音樂：用程式即時合成（不需要音樂檔，也沒有版權問題）
// 曲子都是原創的：title 首頁、map 關卡地圖、battle 戰鬥、battle2 後半段戰鬥、boss 魔王關，還有過關／失敗的短音樂
// 用法：Music.play('map')、Music.jingle('win')、Music.stop()
// 開關按鈕：任何有 data-music-toggle 的按鈕按下去都會開／關音樂（設定記在這台裝置上）
(function () {
  const KEY = 'grade1-games:music';
  let ctx = null, master = null, noiseBuf = null;
  let enabled = read();
  let current = null;        // 現在想播的曲子名稱
  let timer = null, step = 0, nextTime = 0, track = null, oneShot = false;

  function read() { try { return localStorage.getItem(KEY) !== 'off'; } catch (e) { return true; } }
  function save() { try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {} }

  // ===== 音符：C4 → MIDI 60 → 頻率 =====
  const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(name) {
    const m = name.match(/^([A-G])([#b]?)(\d)$/);
    return 12 * (+m[3] + 1) + NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  const freq = n => 440 * Math.pow(2, (n - 69) / 12);

  // 把「C5 - E5 . G5」這種字串變成 [{n, len}]：- 是延長前一個音、. 是休止
  function parse(str, transpose = 0) {
    const out = [];
    str.trim().split(/\s+/).forEach(t => {
      if (t === '-') { if (out.length) out[out.length - 1].len++; else out.push({ n: null, len: 1 }); }
      else if (t === '.') out.push({ n: null, len: 1 });
      else out.push({ n: midi(t) + transpose, len: 1 });
    });
    // 展開成每一拍一格，格子上記錄「這格開始的音」
    const steps = [];
    out.forEach(o => { steps.push(o); for (let i = 1; i < o.len; i++) steps.push(null); });
    return steps;
  }

  // ===== 原創曲子（每格是八分音符）=====
  const SONGS = {
    // 首頁：明亮、有英雄感（C 大調）
    title: { bpm: 132, loop: true,
      lead: `C5 - E5 G5 C6 - G5 E5  F5 - A5 C6 A5 - F5 A5  G5 - B5 D6 G6 - F6 D6  E6 - C6 G5 C6 - - .
             A5 - C6 E6 A5 - G5 F5  E5 - G5 C6 E5 - D5 C5  D5 - F5 A5 G5 - E5 D5  C5 - G4 C5 C5 - - .`,
      bass: `C3 - C3 - G2 - G2 -  F2 - F2 - C3 - C3 -  G2 - G2 - D3 - D3 -  C3 - C3 - G2 - C3 -
             A2 - A2 - E3 - E3 -  C3 - C3 - G2 - G2 -  D3 - D3 - G2 - G2 -  C3 - G2 - C3 - . .`,
      drum: 'k . h . s . h .' },
    // 關卡地圖：輕快的冒險感（F 大調）
    map: { bpm: 112, loop: true,
      lead: `A4 - C5 - D5 - F5 -  E5 - D5 - C5 - A4 -  G4 - A4 - C5 - D5 -  C5 - - - . . . .
             A4 - C5 - D5 - F5 -  G5 - F5 - D5 - C5 -  D5 - C5 - A4 - G4 -  F4 - - - . . . .`,
      bass: `F2 - . F2 C3 - . C3  C3 - . C3 G2 - . G2  D3 - . D3 A2 - . A2  C3 - . C3 C3 - . .
             F2 - . F2 C3 - . C3  Bb2 - . Bb2 F2 - . F2  C3 - . C3 G2 - . G2  F2 - . F2 F2 - . .`,
      drum: 'k . h . s . h h' },
    // 戰鬥：快速、緊張（A 小調）
    battle: { bpm: 150, loop: true,
      lead: `A5 . A5 C6 E6 . D6 C6  B5 . G5 B5 D6 . C6 B5  A5 . A5 C6 E6 . G6 E6  F6 . E6 D6 E6 - - .
             F5 . F5 A5 C6 . B5 A5  G5 . E5 G5 B5 . A5 G5  A5 . C6 E6 A6 . G6 E6  F6 E6 D6 B5 A5 - - .`,
      bass: `A2 A2 A3 A2 A2 A2 A3 A2  G2 G2 G3 G2 G2 G2 G3 G2  A2 A2 A3 A2 A2 A2 A3 A2  F2 F2 F3 F2 E2 E2 E3 E2
             F2 F2 F3 F2 F2 F2 F3 F2  E2 E2 E3 E2 E2 E2 E3 E2  A2 A2 A3 A2 A2 A2 A3 A2  F2 F2 F3 F2 E2 E2 E3 E2`,
      drum: 'k h s h k k s h' },
    // 魔王關：沉重、有壓迫感（E 小調）
    boss: { bpm: 140, loop: true,
      lead: `E5 . E5 F5 E5 . B4 .  E5 . G5 F#5 E5 . D#5 .  E5 . E5 F5 E5 . B4 .  C6 - B5 - A5 - G5 F#5
             E6 . D6 . C6 . B5 .  C6 . B5 . A5 . G5 .  F#5 . G5 . A5 . B5 .  E5 - - - D#5 - E5 .`,
      bass: `E2 E2 E3 E2 F2 F2 F3 F2  E2 E2 E3 E2 F2 F2 F3 F2  E2 E2 E3 E2 F2 F2 F3 F2  C3 C3 C3 C3 B2 B2 B2 B2
             A2 A2 A3 A2 G2 G2 G3 G2  F2 F2 F3 F2 E2 E2 E3 E2  D2 D2 D3 D2 B1 B1 B2 B1  E2 E2 E3 E2 E2 E2 E3 E2`,
      drum: 'k h s h k s s s' },
    // 過關：短短的勝利音樂
    win: { bpm: 168, loop: false,
      lead: `C5 E5 G5 C6 - . G5 C6 E6 - - - - - . .`,
      bass: `C3 - - - G2 - - - C3 - - - - - . .`,
      drum: 'k . . . k . . . s . . . . . . .' },
    // 失敗：短短的「再試一次」音樂
    lose: { bpm: 100, loop: false,
      lead: `G4 - F#4 - F4 - E4 - - - . .`,
      bass: `C3 - B2 - Bb2 - A2 - - - . .`,
      drum: 'k . . . k . . . . . . .' },
  };
  // 後半段戰鬥：同一首戰鬥曲，升高 5 個半音、加快
  SONGS.battle2 = Object.assign({}, SONGS.battle, { bpm: 162, transpose: 5 });

  // ===== 樂器 =====
  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .11;   // 背景音樂小聲一點，才聽得到唸題目
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .3, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  function tone(type, f, t, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.setValueAtTime(vol, t + Math.max(.02, dur - .04)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
  }
  function drum(kind, t) {
    if (kind === 'k') {                                     // 大鼓：快速往下滑的低音
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
      g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .15);
      o.connect(g).connect(master); o.start(t); o.stop(t + .16);
      return;
    }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();   // 小鼓、鈸：雜音
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = kind === 'h' ? 7000 : 1500;
    const len = kind === 'h' ? .04 : .12, vol = kind === 'h' ? .25 : .5;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + len + .01);
  }

  // ===== 播放（預先排好接下來 0.2 秒的音符）=====
  function build(name) {
    const s = SONGS[name], tp = s.transpose || 0;
    return { name, loop: s.loop, stepDur: 60 / s.bpm / 2,
             lead: parse(s.lead, tp), bass: parse(s.bass, tp), drum: s.drum.split(/\s+/) };
  }
  function schedule() {
    while (nextTime < ctx.currentTime + .2) {
      const len = track.lead.length;
      if (step >= len) {
        if (!track.loop) { stopTimer(); if (oneShot) { oneShot = false; current = null; } return; }
        step = 0;
      }
      const L = track.lead[step], B = track.bass[step % track.bass.length], D = track.drum[step % track.drum.length];
      if (L && L.n) tone('square', freq(L.n), nextTime, L.len * track.stepDur * .92, .32);
      if (B && B.n) tone('triangle', freq(B.n), nextTime, B.len * track.stepDur * .95, .55);
      if (D && D !== '.') drum(D, nextTime);
      nextTime += track.stepDur; step++;
    }
  }
  function stopTimer() { clearInterval(timer); timer = null; }
  function startTrack(name) {
    stopTimer();
    if (!enabled || !name || !ensureCtx() || ctx.state !== 'running') return;
    track = build(name); step = 0; nextTime = ctx.currentTime + .05;
    timer = setInterval(schedule, 25); schedule();
  }

  // 換曲子（同一首正在播就不重來）
  function play(name) {
    if (current === name && timer) return;
    current = name; oneShot = false;
    startTrack(name);
  }
  // 播一次的短音樂（過關、失敗），播完就安靜
  function jingle(name) { current = name; oneShot = true; startTrack(name); }
  function stop() { current = null; stopTimer(); }

  // ===== 開關 =====
  function refreshButtons() {
    document.querySelectorAll('[data-music-toggle]').forEach(b => {
      const icon = enabled ? '🎵' : '🔇';
      if (b.textContent === icon) return;   // 沒變就不要動（避免一直觸發畫面更新）
      b.textContent = icon;
      b.setAttribute('aria-label', enabled ? '關掉背景音樂' : '打開背景音樂');
      b.classList.toggle('off', !enabled);
    });
  }
  function toggle() {
    enabled = !enabled; save();
    if (enabled) { unlock(); startTrack(current && !oneShot ? current : null); } else stopTimer();
    refreshButtons();
  }

  // 瀏覽器規定：要等使用者點過畫面才能出聲音
  function unlock() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume().then(() => { if (enabled && current && !timer) startTrack(current); });
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
  document.addEventListener('click', e => { if (e.target.closest('[data-music-toggle]')) toggle(); });
  // 切到別的分頁就暫停，回來再繼續
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
  });
  // 畫面上新增的開關按鈕也要顯示正確的圖示
  new MutationObserver(refreshButtons).observe(document.documentElement, { childList: true, subtree: true });

  // 開關按鈕的樣式
  const css = document.createElement('style');
  css.textContent = `[data-music-toggle].off { filter:grayscale(1); opacity:.75; }`;
  document.head.appendChild(css);

  // status()：檢查用，看現在的狀態
  window.Music = { play, jingle, stop, toggle, isOn: () => enabled, SONGS,
                   status: () => ({ 音訊: ctx ? ctx.state : '還沒啟動', 曲子: current, 播放中: !!timer, 開關: enabled ? '開' : '關' }) };
})();
