// 共用音效與語音：所有遊戲都可以用 Sound.beep()、Sound.say()
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

  // 用瀏覽器內建語音唸中文
  function say(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-TW'; u.rate = .85;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function hush() { try { speechSynthesis.cancel(); } catch (e) {} }

  window.Sound = { beep, say, hush };
})();
