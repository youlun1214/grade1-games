// 共用音效與語音：所有遊戲都可以用 Sound.beep()、Sound.say()
// 語音會自動挑這台裝置上「最像真人」的中文聲音；家長也可以在「聲音設定」自己選（Sound.openPicker()）
// 從 LINE 打開遊戲時，自動改用手機的 Safari／Chrome 開：LINE 內建的瀏覽器關掉後常會清掉挑戰紀錄，也不能用 Google 登入
(function () {
  if (!/\bLine\//i.test(navigator.userAgent) || /openExternalBrowser=1/.test(location.search)) return;
  try { const u = new URL(location.href); u.searchParams.set('openExternalBrowser', '1'); location.replace(u.href); } catch (e) {}
})();

(function () {
  let ctx;

  // 嗶聲：freqs 是一串音高（Hz），依序播放
  function beep(freqs, dur = .12, type = 'triangle') {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f;
        const t = ctx.currentTime + i * dur;
        g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + dur * 1.5);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur * 1.5);
      });
    } catch (e) {}
  }

  // ===== 挑聲音 =====
  const KEY = 'grade1-games:voice';
  const hasTTS = 'speechSynthesis' in window;
  let voices = [];

  // 中文聲音（台灣優先），依「像不像真人」排序
  const isZh = v => /^(zh|cmn)/i.test(v.lang) && !/yue|HK/i.test(v.lang + v.name);
  function score(v) {
    const n = v.name, tw = /TW|Taiwan|臺灣|台灣/i.test(v.lang + n);
    let s = tw ? 100 : 0;                                         // 台灣口音最優先
    if (/Natural|Neural/i.test(n)) s += 50;                        // Edge 的 AI 自然語音（曉臻、曉雨、雲哲）
    else if (/Premium|高品質/i.test(n)) s += 45;                   // iPad 高品質語音
    else if (/Enhanced|加強/i.test(n)) s += 40;                    // iPad 加強版語音
    else if (/Google/i.test(n)) s += 35;                           // Chrome、Android 的 Google 語音
    else if (/Online/i.test(n)) s += 30;
    if (/Hanhan|Yating|Zhiwei/i.test(n)) s -= 10;                  // Windows 舊版機器人聲音
    return s;
  }
  // 比較像真人的聲音（自然語音的語速可以正常一點；舊的機器人聲音放慢比較聽得清楚）
  const isNatural = v => !!v && /Natural|Neural|Premium|高品質|Enhanced|加強|Google|Online/i.test(v.name);

  function loadVoices() {
    if (!hasTTS) return [];
    voices = speechSynthesis.getVoices().filter(isZh).sort((a, b) => score(b) - score(a));
    return voices;
  }
  if (hasTTS) {
    loadVoices();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  function savedName() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function current() {
    if (!voices.length) loadVoices();
    return voices.find(v => v.name === savedName()) || voices[0] || null;
  }
  function setVoice(name) { try { localStorage.setItem(KEY, name); } catch (e) {} }

  // 用選好的聲音唸中文
  function say(text, voice) {
    try {
      if (!hasTTS) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = voice || current();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'zh-TW';
      u.rate = isNatural(v) ? .95 : .85;
      u.pitch = 1.05;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function hush() { try { speechSynthesis.cancel(); } catch (e) {} }

  // ===== 聲音設定視窗（家長用）=====
  function openPicker() {
    loadVoices();
    const cur = current();
    const old = document.getElementById('voice-picker'); if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'voice-picker';
    const best = voices.filter(isNatural);
    box.innerHTML = `
      <div class="vp-box">
        <div class="vp-head"><b>🔊 聲音設定</b><button class="vp-x" data-vp="close" aria-label="關閉">✕</button></div>
        ${voices.length ? `<p class="vp-tip">點「試聽」聽聽看，選一個最像真人的聲音。${best.length ? '有 ⭐ 的是比較自然的 AI 人聲。' : ''}</p>
        <div class="vp-list">${voices.map((v, i) => `
          <div class="vp-item${cur && v.name === cur.name ? ' on' : ''}">
            <span class="vp-name">${isNatural(v) ? '⭐ ' : ''}${v.name.replace(/^Microsoft /, '').replace(/ - Chinese.*$/, '')}<small>${v.lang}</small></span>
            <button class="vp-btn" data-vp="try" data-i="${i}">試聽</button>
            <button class="vp-btn use" data-vp="use" data-i="${i}">${cur && v.name === cur.name ? '使用中' : '用這個'}</button>
          </div>`).join('')}</div>` : '<p class="vp-tip">這台裝置找不到中文語音。</p>'}
        ${best.length ? '' : `<div class="vp-help"><b>想要更像真人的聲音？</b>
          <ul>
            <li><b>Windows 電腦</b>：用 <b>Edge 瀏覽器</b>開遊戲，會有「曉臻、曉雨、雲哲」AI 自然語音</li>
            <li><b>iPad／iPhone</b>：設定 → 輔助使用 → 朗讀內容 → 聲音 → 中文（台灣）→ 下載「美佳（加強版或高品質）」</li>
            <li><b>Android 平板</b>：用 Chrome 開遊戲，會使用 Google 語音</li>
          </ul></div>`}
      </div>`;
    document.body.appendChild(box);
    box.onclick = e => {
      const b = e.target.closest('[data-vp]');
      if (!b) { if (e.target === box) box.remove(); return; }
      const v = voices[+b.dataset.i];
      if (b.dataset.vp === 'close') box.remove();
      else if (b.dataset.vp === 'try') say('你好！我們一起來打怪獸吧！三加四等於七。', v);
      else if (b.dataset.vp === 'use') { setVoice(v.name); say('好的，就用我的聲音吧！', v); openPicker(); }
    };
  }

  // 設定視窗的樣式（放在這裡，載入 sound.js 的頁面都能用）
  const css = document.createElement('style');
  css.textContent = `
    #voice-picker { position:fixed; inset:0; z-index:9999; background:rgba(10,14,40,.6); display:flex; align-items:center; justify-content:center; padding:16px; font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif; }
    .vp-box { background:#fff; color:#1d2340; border:4px solid #1d2340; border-radius:20px; width:min(100%, 520px); max-height:90vh; overflow:auto; padding:16px; box-shadow:0 8px 0 rgba(0,0,0,.3); }
    .vp-head { display:flex; justify-content:space-between; align-items:center; font-size:1.4rem; }
    .vp-x { border:0; background:#eef; border-radius:50%; width:40px; height:40px; font-size:1.2rem; cursor:pointer; }
    .vp-tip { color:#5a6890; margin:8px 0; }
    .vp-list { display:grid; gap:8px; }
    .vp-item { display:flex; align-items:center; gap:8px; padding:8px 10px; border:2px solid #d6e2f2; border-radius:14px; }
    .vp-item.on { border-color:#2fc23a; background:#effbe9; }
    .vp-name { flex:1; font-weight:700; }
    .vp-name small { display:block; font-weight:400; color:#8a93a8; font-size:.8rem; }
    .vp-btn { border:0; border-radius:999px; padding:8px 14px; font-weight:700; cursor:pointer; background:#dff1ff; color:#1d2340; font-family:inherit; }
    .vp-btn.use { background:#1e8cff; color:#fff; }
    .vp-item.on .vp-btn.use { background:#2fc23a; }
    .vp-help { margin-top:12px; background:#fff7dd; border-radius:14px; padding:10px 14px; }
    .vp-help ul { margin:6px 0 0; padding-left:20px; line-height:1.6; }`;
  document.head.appendChild(css);

  window.Sound = { beep, say, hush, voices: () => loadVoices(), current, setVoice, openPicker };
})();
