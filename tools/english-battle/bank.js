// 英文題庫：10 關（字母 3 關、顏色、數字、交通工具、動物、水果、身體、魔王關）
// 依學校一年級「國際教育」的主題（顏色：叭叭計程車、叮叮腳踏車、嘟嘟巴士）＋小一常見入門單字
// 之後拿到康軒英語課本，把課本的單字照格式加進 UNITS 就好（英文、中文、emoji、圖示名稱）
(function () {
  const rand = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rand(arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const others = (arr, ans, n = 3, same = (a, b) => a === b) => shuffle(arr.filter(x => !same(x, ans))).slice(0, n);

  // ===== 單字：'英文 中文 emoji 圖示名稱'（圖示名稱對到 shared/icons.js，沒有就用 emoji）=====
  const parse = s => s.trim().split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [en, zh, e, icon] = l.split('|').map(x => x.trim());
    return { en, zh, e, icon: icon || zh };
  });
  const UNITS = {
    colors: [
      ['red', '紅色', '#e8443a'], ['blue', '藍色', '#2f7de1'], ['yellow', '黃色', '#ffd400'], ['green', '綠色', '#2fb34a'],
      ['orange', '橘色', '#ff8a1f'], ['purple', '紫色', '#8a4fd8'], ['pink', '粉紅色', '#ff8fc8'], ['black', '黑色', '#1d1d1d'],
      ['white', '白色', '#ffffff'], ['brown', '咖啡色', '#8a5a2b'],
    ].map(([en, zh, c]) => ({ en, zh, c })),
    numbers: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'].map((en, n) => ({ en, n })).slice(1),
    transport: parse(`
      taxi | 計程車 | 🚕 | 計程車
      bus | 公車 | 🚌 | 公車
      bike | 腳踏車 | 🚲 | 腳踏車
      car | 汽車 | 🚗 | 汽車
      train | 火車 | 🚆 | 火車
      boat | 船 | 🚢 | 船
      plane | 飛機 | ✈️ | 飛機
      fire truck | 消防車 | 🚒 | 消防車`),
    animals: parse(`
      cat | 貓 | 🐱
      dog | 狗 | 🐶
      bird | 鳥 | 🐦
      fish | 魚 | 🐟
      pig | 豬 | 🐷
      duck | 鴨子 | 🦆 | 鴨
      rabbit | 兔子 | 🐰
      monkey | 猴子 | 🐵
      elephant | 大象 | 🐘 | 象
      frog | 青蛙 | 🐸
      bear | 熊 | 🐻
      tiger | 老虎 | 🐯 | 虎`),
    fruits: parse(`
      apple | 蘋果 | 🍎
      banana | 香蕉 | 🍌
      grapes | 葡萄 | 🍇
      strawberry | 草莓 | 🍓
      watermelon | 西瓜 | 🍉
      pineapple | 鳳梨 | 🍍
      peach | 水蜜桃 | 🍑
      cake | 蛋糕 | 🎂`),
    body: parse(`
      eye | 眼睛 | 👁️ | 眼
      ear | 耳朵 | 👂 | 耳
      nose | 鼻子 | 👃 | 鼻
      mouth | 嘴巴 | 👄
      hand | 手 | ✋
      foot | 腳 | 🦶 | 腳
      tooth | 牙齒 | 🦷 | 牙
      heart | 心 | ❤️ | 心`),
  };
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  // 字母開頭的單字（看圖找第一個字母用）
  const ALL_WORDS = [...UNITS.transport, ...UNITS.animals, ...UNITS.fruits, ...UNITS.body];

  // ===== 畫題目的小工具 =====
  const ic = (w, cls = '') => (window.Icons ? window.Icons.html(w.icon, w.e, cls) : `<span class="ic ic-emoji ${cls}">${w.e}</span>`);
  const prompt = s => `<div class="eq-prompt">${s}</div>`;
  const ear = '<div class="eq-ear" data-act="speak">🔊</div>';
  const en = s => `<span class="eq-en no-zy">${s}</span>`;
  const swatch = c => `<span class="eq-swatch" style="--c:${c.c}"></span>`;
  const word = w => ({ html: en(w.en), value: w.en });

  // ===== 題型 =====
  const TYPES = {
    // 聽字母，選字母
    letterListen(L) {
      const pool = letterPool(L), a = pick(pool);
      const choices = shuffle([a, ...others(pool.length >= 4 ? pool : LETTERS, a)]).map(x => ({ html: en(`${x}${x.toLowerCase()}`), value: x }));
      return { key: a, html: prompt('聽一聽，是哪一個字母？') + ear, speech: ['聽一聽，是哪一個字母？', { en: a }],
               choices, ans: a, answerText: `${a}${a.toLowerCase()}`, answerSpeech: { en: a } };
    },
    // 大寫找小寫
    upperLower(L) {
      const pool = letterPool(L), a = pick(pool);
      const choices = shuffle([a, ...others(pool.length >= 4 ? pool : LETTERS, a)]).map(x => ({ html: en(x.toLowerCase()), value: x }));
      return { key: a, html: prompt('大寫字母的小寫是哪一個？') + `<div class="eq-big">${en(a)}</div>`, speech: ['大寫字母', { en: a }, '的小寫是哪一個？'],
               choices, ans: a, answerText: a.toLowerCase(), answerSpeech: { en: a } };
    },
    // 看圖找第一個字母（apple → A）
    firstLetter() {
      const w = pick(ALL_WORDS.filter(x => !x.en.includes(' '))), a = w.en[0].toUpperCase();
      const choices = shuffle([a, ...others(LETTERS, a)]).map(x => ({ html: en(`${x}${x.toLowerCase()}`), value: x }));
      return { key: w.en, html: prompt('第一個字母是哪一個？') + `<div class="eq-pic">${ic(w, 'big')}</div>`, speech: [{ en: w.en }, '，第一個字母是哪一個？'],
               choices, ans: a, answerText: `${a}（${w.en}）`, answerSpeech: { en: `${a}. ${w.en}` } };
    },
    // 聽單字，選圖
    listen(L, unit) {
      const list = UNITS[unit], w = pick(list);
      const choices = shuffle([w, ...others(list, w)]).map(x => ({ html: unit === 'colors' ? swatch(x) : unit === 'numbers' ? `<span class="eq-num">${x.n}</span>` : ic(x), value: x.en }));
      return { key: w.en, html: prompt('聽一聽，是哪一個？') + ear, speech: ['聽一聽，是哪一個？', { en: w.en }],
               choices, ans: w.en, answerText: `${w.en}（${w.zh || w.n}）`, answerSpeech: { en: w.en } };
    },
    // 看圖，選英文（四個英文單字會一個一個唸給你聽：按 🔊）
    look(L, unit) {
      const list = UNITS[unit], w = pick(list);
      const shown = unit === 'colors' ? `<div class="eq-pic">${swatch(w)}</div>` : unit === 'numbers' ? `<div class="eq-big">${w.n}</div>` : `<div class="eq-pic">${ic(w, 'big')}</div>`;
      const opts = shuffle([w, ...others(list, w)]);
      return { key: w.en, html: prompt('英文怎麼說？') + shown,
               speech: ['英文怎麼說？', ...opts.flatMap((x, i) => [i ? '，還是' : '是', { en: x.en }])],
               choices: opts.map(word), ans: w.en, answerText: `${w.en}（${w.zh || w.n}）`, answerSpeech: { en: w.en } };
    },
  };

  // ===== 10 關 =====
  const LEVELS = [
    { title: '字母 A～I',   desc: 'A B C D E F G H I', letters: 'ABCDEFGHI', types: { letterListen: 3, upperLower: 2 } },
    { title: '字母 J～R',   desc: 'J K L M N O P Q R', letters: 'JKLMNOPQR', types: { letterListen: 3, upperLower: 2 } },
    { title: '字母 S～Z',   desc: 'S T U V W X Y Z', letters: 'STUVWXYZ', types: { letterListen: 3, upperLower: 2, firstLetter: 1 } },
    { title: '顏色 Colors', desc: '叭叭計程車：red、blue…', unit: 'colors', types: { listen: 3, look: 2 } },
    { title: '數字 Numbers', desc: 'one 到 ten', unit: 'numbers', types: { listen: 3, look: 2 } },
    { title: '交通工具',    desc: '叮叮腳踏車、嘟嘟巴士', unit: 'transport', types: { listen: 3, look: 2 } },
    { title: '動物 Animals', desc: 'cat、dog…', unit: 'animals', types: { listen: 3, look: 2 } },
    { title: '水果 Fruits', desc: 'apple、banana…', unit: 'fruits', types: { listen: 3, look: 2 } },
    { title: '身體 Body',   desc: 'eye、ear、nose…', unit: 'body', types: { listen: 3, look: 2 } },
    { title: '英文大魔王',  desc: '全部總複習', boss: true },
  ];
  const letterPool = L => [...(LEVELS[L - 1].letters || LETTERS.join(''))];

  function question(L, last) {
    const lv = LEVELS[L - 1];
    // 魔王關：字母、各單元都可能出
    const bag = lv.boss
      ? [['letterListen'], ['upperLower'], ['firstLetter'], ...Object.keys(UNITS).flatMap(u => [['listen', u], ['listen', u], ['look', u]])]
      : Object.entries(lv.types).flatMap(([t, n]) => Array(n).fill([t, lv.unit]));
    const make = () => { const [t, u] = pick(bag); const q = TYPES[t](L, u); q.type = t; return q; };
    let q;
    for (let i = 0; i < 8; i++) { q = make(); if (!last || q.key !== last.key) break; }   // 不要連續出一樣的
    return q;
  }

  const levels = () => LEVELS.map(l => ({ title: l.title, desc: l.desc }));
  window.EnglishBank = { UNITS, LEVELS, TYPES, question, levels };
})();
