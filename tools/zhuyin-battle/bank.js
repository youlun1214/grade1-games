// 注音題庫：康軒首冊 9 課的符號、看圖單字、7 種題型產生器（孩子學校 115 學年度用康軒版）
// 課程依據見 docs/curriculum-grade1.md；要加單字就加在 WORDS 裡
(function () {
  // ===== 康軒首冊：每一課教的符號與結合韻 =====
  const LESSONS = [
    { title: '貓咪',       symbols: 'ㄅㄆㄇㄉㄧㄠ',   combos: [] },
    { title: '鵝寶寶',     symbols: 'ㄈㄏㄓㄔㄨㄚㄜ', combos: [] },
    { title: '河馬和河狸', symbols: 'ㄌㄑㄗㄩㄛㄢㄤ', combos: [] },
    { title: '笑嘻嘻',     symbols: 'ㄒㄕㄟㄡㄦ',     combos: ['ㄧㄠ', 'ㄨㄢ'] },
    { title: '翹翹板',     symbols: 'ㄋㄍㄞㄥ',       combos: ['ㄧㄚ', 'ㄧㄡ', 'ㄧㄤ'] },
    { title: '謝謝老師',   symbols: 'ㄐㄙㄝ',         combos: ['ㄧㄝ', 'ㄨㄚ', 'ㄨㄛ', 'ㄨㄥ'] },
    { title: '龜兔賽跑',   symbols: 'ㄊㄎㄣ',         combos: ['ㄧㄢ', 'ㄧㄥ', 'ㄨㄞ', 'ㄨㄟ'] },
    { title: '拔蘿蔔',     symbols: 'ㄖㄘ',           combos: ['ㄧㄛ', 'ㄨㄤ', 'ㄩㄢ', 'ㄩㄥ'] },
    { title: '動物狂歡會', symbols: '',               combos: ['ㄧㄞ', 'ㄧㄣ', 'ㄨㄣ', 'ㄩㄝ', 'ㄩㄣ'] },
  ];
  const BOSS = { title: '注音大魔王', desc: '37 個符號總複習' };

  // ===== 看圖單字（字、注音、圖）=====
  // 會依「用到的符號和結合韻」自動判斷第幾關才出現
  const WORDS = `
    貓 ㄇㄠ 🐱|米 ㄇㄧˇ 🍚|筆 ㄅㄧˇ ✏️|鼻 ㄅㄧˊ 👃|帽 ㄇㄠˋ 🧢|豹 ㄅㄠˋ 🐆|跑 ㄆㄠˇ 🏃
    馬 ㄇㄚˇ 🐴|鵝 ㄜˊ 🦢|虎 ㄏㄨˇ 🐯|豬 ㄓㄨ 🐷|茶 ㄔㄚˊ 🍵|車 ㄔㄜ 🚗
    魚 ㄩˊ 🐟|雨 ㄩˇ 🌧️|蛋 ㄉㄢˋ 🥚|狼 ㄌㄤˊ 🐺|鹿 ㄌㄨˋ 🦌|盤 ㄆㄢˊ 🍽️|帆 ㄈㄢ ⛵
    蛇 ㄕㄜˊ 🐍|書 ㄕㄨ 📖|樹 ㄕㄨˋ 🌳|手 ㄕㄡˇ ✋|耳 ㄦˇ 👂|杯 ㄅㄟ 🥤|山 ㄕㄢ ⛰️|碗 ㄨㄢˇ 🥣|船 ㄔㄨㄢˊ 🚢
    狗 ㄍㄡˇ 🐶|猴 ㄏㄡˊ 🐵|牛 ㄋㄧㄡˊ 🐮|鳥 ㄋㄧㄠˇ 🐦|羊 ㄧㄤˊ 🐑|鴨 ㄧㄚ 🦆|牙 ㄧㄚˊ 🦷|球 ㄑㄧㄡˊ ⚽|燈 ㄉㄥ 💡|鼓 ㄍㄨˇ 🥁|蝦 ㄒㄧㄚ 🦐|象 ㄒㄧㄤˋ 🐘|奶 ㄋㄞˇ 🥛
    花 ㄏㄨㄚ 🌸|雞 ㄐㄧ 🐔|鞋 ㄒㄧㄝˊ 👟|火 ㄏㄨㄛˇ 🔥|鐘 ㄓㄨㄥ ⏰|傘 ㄙㄢˇ ☂️|腳 ㄐㄧㄠˇ 🦶|蛙 ㄨㄚ 🐸
    兔 ㄊㄨˋ 🐰|糖 ㄊㄤˊ 🍬|眼 ㄧㄢˇ 👁️|星 ㄒㄧㄥ ⭐|水 ㄕㄨㄟˇ 💧|龜 ㄍㄨㄟ 🐢|錢 ㄑㄧㄢˊ 💰|門 ㄇㄣˊ 🚪
    熊 ㄒㄩㄥˊ 🐻|床 ㄔㄨㄤˊ 🛏️|肉 ㄖㄡˋ 🍖|草 ㄘㄠˇ 🌿|圓 ㄩㄢˊ ⭕
    月 ㄩㄝˋ 🌙|雲 ㄩㄣˊ ☁️|心 ㄒㄧㄣ ❤️|蚊 ㄨㄣˊ 🦟|雪 ㄒㄩㄝˇ ❄️|裙 ㄑㄩㄣˊ 👗`;

  // ===== 符號分類 =====
  const INITIALS = 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ';   // 聲符
  const MEDIALS = 'ㄧㄨㄩ';                                     // 介符
  const FINALS = 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ';                    // 韻符
  const TONE_MARK = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 5: '˙' };
  const TONE_NAME = { 1: '一聲', 2: '二聲', 3: '三聲', 4: '四聲' };
  // 長得像、容易搞混的符號
  const LOOKALIKE = {
    ㄅ: 'ㄆㄉㄌ', ㄆ: 'ㄅㄉㄊ', ㄇ: 'ㄈㄢㄋ', ㄈ: 'ㄇㄏㄎ', ㄉ: 'ㄅㄌㄊ', ㄊ: 'ㄉㄌㄆ', ㄋ: 'ㄌㄅㄇ', ㄌ: 'ㄋㄉㄅ',
    ㄍ: 'ㄎㄑㄐ', ㄎ: 'ㄍㄏㄈ', ㄏ: 'ㄎㄈㄒ', ㄐ: 'ㄑㄒㄍ', ㄑ: 'ㄐㄍㄒ', ㄒ: 'ㄐㄏㄑ', ㄓ: 'ㄔㄗㄕ', ㄔ: 'ㄓㄘㄗ',
    ㄕ: 'ㄙㄓㄖ', ㄖ: 'ㄗㄘㄕ', ㄗ: 'ㄘㄓㄖ', ㄘ: 'ㄗㄔㄖ', ㄙ: 'ㄕㄥㄓ', ㄧ: 'ㄨㄦㄩ', ㄨ: 'ㄩㄧㄦ', ㄩ: 'ㄨㄡㄧ',
    ㄚ: 'ㄜㄛㄝ', ㄛ: 'ㄜㄚㄝ', ㄜ: 'ㄛㄝㄚ', ㄝ: 'ㄜㄟㄛ', ㄞ: 'ㄟㄠㄝ', ㄟ: 'ㄞㄝㄠ', ㄠ: 'ㄡㄞㄟ', ㄡ: 'ㄠㄩㄞ',
    ㄢ: 'ㄣㄤㄥ', ㄣ: 'ㄢㄥㄤ', ㄤ: 'ㄥㄢㄣ', ㄥ: 'ㄤㄣㄢ', ㄦ: 'ㄧㄖㄨ',
  };

  const symLevel = {}, comboLevel = {};
  LESSONS.forEach((l, i) => { [...l.symbols].forEach(s => symLevel[s] = i + 1); l.combos.forEach(c => comboLevel[c] = i + 1); });

  // ===== 小工具 =====
  const rand = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rand(arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const isSym = c => INITIALS.includes(c) || MEDIALS.includes(c) || FINALS.includes(c);
  const kindOf = s => INITIALS.includes(s) ? 'I' : MEDIALS.includes(s) ? 'M' : 'F';

  // 把「ㄇㄠˋ」拆成 { syms:['ㄇ','ㄠ'], tone:4 }
  function parse(zy) {
    const syms = [...zy].filter(isSym);
    const tone = zy.includes('ˊ') ? 2 : zy.includes('ˇ') ? 3 : zy.includes('ˋ') ? 4 : zy.includes('˙') ? 5 : 1;
    return { syms, tone };
  }
  const fmt = (syms, tone) => tone === 5 ? '˙' + syms.join('') : syms.join('') + TONE_MARK[tone];

  const WORD_LIST = WORDS.trim().split(/[|\n]/).map(s => s.trim()).filter(Boolean).map(s => {
    const [w, zy, e] = s.split(/\s+/);
    const { syms, tone } = parse(zy);
    const rest = INITIALS.includes(syms[0]) ? syms.slice(1) : syms;
    const combo = rest.length === 2 ? rest.join('') : null;
    const level = Math.max(...syms.map(x => symLevel[x] || 9), combo ? (comboLevel[combo] || 9) : 1);
    return { w, zy, e, syms, tone, level };
  });

  function learnedSyms(L) { return LESSONS.slice(0, Math.min(L, 9)).flatMap(l => [...l.symbols]); }
  function newSyms(L) { return L <= 9 ? [...LESSONS[L - 1].symbols] : []; }
  function usableWords(L) { return WORD_LIST.filter(w => w.level <= Math.min(L, 9)); }

  // 選一個單字：60% 考這一課的新字，其他複習前面學過的
  const hasIcon = w => !!(window.Icons && window.Icons.has(w.w));
  // 選項排序：有圖示的排前面（同樣有沒有圖示的再隨機），讓四個選項盡量都是圖示
  const iconFirst = arr => arr.sort((a, b) => hasIcon(b) - hasIcon(a));

  function pickWord(L, last, filter = () => true) {
    const all = usableWords(L).filter(filter);
    const fresh = all.filter(w => w.level === L);
    let pool = (L <= 9 && fresh.length && Math.random() < .6) ? fresh : all;
    // 有圖示的字比較好看，65% 的機會優先出有圖示的字
    const withIcon = pool.filter(hasIcon);
    if (withIcon.length && Math.random() < .65) pool = withIcon;
    const noRepeat = pool.filter(w => !last || w.w !== last.word);
    return pick(noRepeat.length ? noRepeat : pool);
  }

  // 從 pool 挑干擾選項：先挑長得像的，再隨機補
  function distract(answer, pool, n = 3) {
    const out = [];
    const like = [...(LOOKALIKE[answer] || '')].filter(s => pool.includes(s));
    shuffle(like).forEach(s => { if (out.length < n && s !== answer && !out.includes(s)) out.push(s); });
    shuffle([...pool]).forEach(s => { if (out.length < n && s !== answer && !out.includes(s)) out.push(s); });
    return out;
  }

  // 圖示：有 ChatGPT 畫的圖示就用（shared/icons.js），沒有就用 emoji 暫代
  const icon = (w, cls) => (window.Icons ? window.Icons.html(w.w, w.e, cls) : `<span class="ic ic-emoji">${w.e}</span>`);
  // 題目裡要考的字：不加注音（class no-zy），不然注音會直接告訴答案
  const target = w => `<span class="no-zy">${w.w}</span>`;
  const pic = w => `<div class="zq-pic">${icon(w, 'big')}</div><div class="zq-word no-zy">${w.w}</div>`;
  const big = s => `<div class="zq-zy">${s}</div>`;
  const prompt = s => `<div class="zq-prompt">${s}</div>`;

  // ===== 7 種題型 =====
  const TYPES = {
    // 1. 聽音找圖：看符號、聽四個詞，找出有這個音的那一個（符號↔發音）
    hunt(L, last) {
      const words = usableWords(L);
      const fresh = newSyms(L);
      // 能出題的符號：至少 1 個字有、3 個字沒有
      const ok = learnedSyms(L).filter(s => words.some(w => w.syms.includes(s)) && words.filter(w => !w.syms.includes(s)).length >= 3);
      const okFresh = ok.filter(s => fresh.includes(s));
      let target = pick(okFresh.length && Math.random() < .7 ? okFresh : ok);
      if (last && target === last.word && ok.length > 1) target = pick(ok.filter(s => s !== last.word));
      const w = pick(words.filter(x => x.syms.includes(target)));
      // 干擾選項優先挑「有長得像的符號」的字，比較需要仔細聽
      const like = [...(LOOKALIKE[target] || '')];
      const without = iconFirst(shuffle(words.filter(x => !x.syms.includes(target) && x.e !== w.e)));
      const score = x => (x.syms.some(s => like.includes(s)) ? 2 : 0) + (hasIcon(x) ? 1 : 0);   // 發音相近優先，其次有圖示
      without.sort((a, b) => score(b) - score(a));
      const picks = shuffle([w, ...without.slice(0, 3)]);
      // 圖下面附小字，語音沒聲音時大人也能唸給孩子聽
      const choices = picks.map(x => ({ html: `<span class="zq-pick">${icon(x)}<small class="no-zy">${x.w}</small></span>`, value: x.w }));
      return { word: target, html: prompt('聽一聽，哪一個有這個音？') + big(target),
               speech: `聽一聽，哪一個有這個音？${picks.map(x => x.w).join('，')}`,
               choices, ans: w.w, answerText: `${w.e} ${w.w}（${w.zy}）` };
    },
    // 2. 看圖找第一個音（聲符）
    first(L, last) {
      const w = pickWord(L, last, w => INITIALS.includes(w.syms[0]));
      const initials = learnedSyms(L).filter(s => INITIALS.includes(s));
      const choices = shuffle([w.syms[0], ...distract(w.syms[0], initials)]);
      return { word: w.w, html: prompt(`「${target(w)}」的第一個音是？`) + pic(w), speech: `${w.w}，${w.w}的第一個音是哪一個？`,
               choices, ans: w.syms[0], answerText: w.syms[0] };
    },
    // 3. 看圖選注音
    pic2zy(L, last) {
      const w = pickWord(L, last);
      const learned = learnedSyms(L);
      const variants = new Set();
      w.syms.forEach((s, i) => {
        const same = learned.filter(x => kindOf(x) === kindOf(s));
        distract(s, same, 2).forEach(d => { const c = [...w.syms]; c[i] = d; variants.add(fmt(c, w.tone)); });
      });
      if (w.tone !== 5) variants.add(fmt(w.syms, pick([1, 2, 3, 4].filter(t => t !== w.tone))));
      variants.delete(w.zy);
      const choices = shuffle([w.zy, ...shuffle([...variants]).slice(0, 3)]);
      return { word: w.w, html: prompt(`「${target(w)}」的注音是？`) + pic(w), speech: `${w.w}，${w.w}的注音是哪一個？`,
               choices, ans: w.zy, answerText: w.zy };
    },
    // 4. 看注音選圖
    zy2pic(L, last) {
      const w = pickWord(L, last);
      const others = iconFirst(shuffle(usableWords(L).filter(x => x.w !== w.w && x.e !== w.e))).slice(0, 3);
      const choices = shuffle([w, ...others]).map(x => ({ html: icon(x), value: x.w }));
      return { word: w.w, html: prompt('拼一拼，這是什麼？') + big(w.zy), speech: '看注音，拼一拼，這是什麼？',
               choices, ans: w.w, answerText: `${w.e} ${w.w}` };
    },
    // 5. 缺了哪個符號
    missing(L, last) {
      const w = pickWord(L, last, w => w.syms.length >= 2);
      const i = rand(w.syms.length), s = w.syms[i];
      const shown = w.syms.map((x, j) => j === i ? '<span class="zq-blank">？</span>' : x);
      const same = learnedSyms(L).filter(x => kindOf(x) === kindOf(s));
      const choices = shuffle([s, ...distract(s, same.length >= 4 ? same : learnedSyms(L))]);
      const toneMark = w.tone === 5 ? '' : TONE_MARK[w.tone];
      return { word: w.w, html: prompt(`「${target(w)}」少了哪一個？`) + pic(w) + big((w.tone === 5 ? '˙' : '') + shown.join('') + toneMark),
               speech: `${w.w}，${w.w}少了哪一個符號？`, choices, ans: s, answerText: s };
    },
    // 6. 第幾聲
    tone(L, last) {
      const w = pickWord(L, last, w => w.tone <= 4);
      const choices = [1, 2, 3, 4].map(t => ({ html: `<span class="zq-tone">${t === 1 ? 'ˉ' : TONE_MARK[t]}</span>${TONE_NAME[t]}`, value: t }));
      return { word: w.w, html: prompt(`「${target(w)}」是第幾聲？`) + pic(w) + big(w.syms.join('')), speech: `${w.w}，${w.w}是第幾聲？`,
               choices, ans: w.tone, answerText: TONE_NAME[w.tone] };
    },
    // 7. 拼拼看（三拼音）
    spell(L, last) {
      const w = pickWord(L, last, w => w.syms.length === 3);
      const others = iconFirst(shuffle(usableWords(L).filter(x => x.w !== w.w && x.e !== w.e))).slice(0, 3);
      const choices = shuffle([w, ...others]).map(x => ({ html: icon(x), value: x.w }));
      const parts = w.syms.join(' ＋ ') + (w.tone > 1 && w.tone < 5 ? ` ＋ ${TONE_MARK[w.tone]}` : '');
      return { word: w.w, html: prompt('三個符號拼起來，是什麼？') + big(parts), speech: '三個符號拼起來，是什麼？',
               choices, ans: w.w, answerText: `${w.e} ${w.w}` };
    },
  };

  // ===== 每關的題型比重（數字越大越常出現）=====
  function weightsFor(L) {
    if (L === 1) return { hunt: 3, first: 2, pic2zy: 2, zy2pic: 2, tone: 1 };
    if (L <= 3) return { hunt: 3, first: 2, pic2zy: 3, zy2pic: 2, tone: 2, missing: 1 };
    if (L === 4) return { hunt: 2, first: 2, pic2zy: 3, zy2pic: 2, tone: 2, missing: 2 };
    if (L <= 6) return { hunt: 2, first: 2, pic2zy: 3, zy2pic: 2, tone: 2, missing: 2, spell: 2 };
    if (L <= 9) return { hunt: 1, first: 1, pic2zy: 3, zy2pic: 2, tone: 3, missing: 3, spell: 2 };
    return { hunt: 2, first: 1, pic2zy: 2, zy2pic: 2, tone: 2, missing: 2, spell: 2 };
  }

  function question(L, last) {
    const w = weightsFor(L);
    const bag = Object.entries(w).flatMap(([t, n]) => Array(n).fill(t));
    let t = pick(bag);
    if (last && t === last.type && Math.random() < .6) t = pick(bag);   // 少一點連續同題型
    const q = TYPES[t](L, last);
    q.type = t;
    return q;
  }

  function levels() {
    return [...LESSONS.map(l => ({ title: l.title, desc: l.symbols || l.combos.join(' ') })), BOSS];
  }

  window.ZhuyinBank = { LESSONS, WORD_LIST, question, levels, parse, TYPES };
})();
