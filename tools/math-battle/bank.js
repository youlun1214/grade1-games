// 數學題庫：依翰林一上單元排成 10 關，每關 2～4 種題型（多元評量：看圖、比較、排序、分合、算式、應用題）
// 課程依據見 docs/curriculum-grade1.md；題庫與遊戲邏輯分開，要加題型就加在 TYPES、再放進 LEVELS
(function () {
  // ===== 小工具 =====
  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  // 數字選項：正解＋3 個接近的數（在 lo～hi 之間）
  function numChoices(ans, lo = 0, hi = 10, n = 4) {
    const set = new Set([ans]);
    const near = shuffle([ans - 1, ans + 1, ans - 2, ans + 2, ans - 3, ans + 3].filter(x => x >= lo && x <= hi));
    for (const x of near) { if (set.size >= n) break; set.add(x); }
    while (set.size < n) set.add(rand(lo, hi));
    return shuffle([...set]);
  }

  // 圖示：有 ChatGPT 畫的圖示就用（shared/icons.js），沒有就用 emoji 暫代
  const ic = (name, emoji, cls = '') => (window.Icons ? window.Icons.html(name, emoji, cls) : `<span class="ic ic-emoji ${cls}">${emoji}</span>`);

  // 可以數的東西（emoji 暫代、名稱、量詞）：都有圖示
  const THINGS = [
    ['🍎', '蘋果', '顆'], ['🍓', '草莓', '顆'], ['🍊', '橘子', '顆'], ['🍌', '香蕉', '根'], ['🍇', '葡萄', '串'],
    ['🍉', '西瓜', '顆'], ['🍍', '鳳梨', '顆'], ['🍑', '水蜜桃', '顆'], ['🚗', '汽車', '輛'], ['🚌', '公車', '輛'],
    ['🚢', '船', '艘'], ['⭐', '星星', '顆'], ['🐟', '魚', '條'], ['✏️', '鉛筆', '枝'], ['📘', '書', '本'],
    ['⚽', '球', '顆'], ['🎂', '蛋糕', '個'],
  ];
  // 挑一樣東西：回傳 [圖示 HTML, 名稱, 量詞]
  const thing = () => { const [e, name, unit] = pick(THINGS); return [ic(name, e, 'sm'), name, unit]; };
  // 動物（排順序、比多少用）
  const ANIMALS = [['豬', '🐷'], ['猴子', '🐵'], ['熊', '🐻'], ['熊貓', '🐼'], ['狗', '🐶'], ['貓', '🐱'], ['青蛙', '🐸'], ['兔子', '🐰']];

  // ===== 畫圖的小工具 =====
  const prompt = s => `<div class="mq-prompt">${s}</div>`;
  const big = s => `<div class="mq-big">${s}</div>`;
  // 一堆東西，每 5 個一組，方便數
  function pile(n, e, crossFrom = Infinity) {
    if (n === 0) return `<div class="mq-pile mq-empty">🍽️</div>`;
    let html = '';
    for (let g = 0; g < n; g += 5) {
      html += '<span class="mq-five">' + Array.from({ length: Math.min(5, n - g) }, (_, k) =>
        `<i class="${g + k >= crossFrom ? 'gone' : ''}">${e}</i>`).join('') + '</span>';
    }
    return `<div class="mq-pile">${html}</div>`;
  }
  // 圓點（放在選項按鈕裡）
  const dots = n => `<span class="mq-dots">${'●'.repeat(n) || '○'}</span>`;
  // 一捆十根（30 以內的數）
  const ten = () => `<span class="mq-ten">${'<b></b>'.repeat(10)}</span>`;
  const ones = n => `<span class="mq-ones">${'<b></b>'.repeat(n)}</span>`;
  // 長條（比長短）
  const COLORS = [['#e8443a', '紅色'], ['#2f7de1', '藍色'], ['#2fb24a', '綠色'], ['#f0a800', '黃色']];
  const bar = (units, color, unitBox) => `<div class="mq-bar" style="--w:${units};--c:${color}">${unitBox ? '<b></b>'.repeat(units) : ''}</div>`;
  const swatch = (color, name) => ({ html: `<span class="mq-swatch" style="--c:${color[0]}"></span>${color[1]}`, value: name || color[1] });
  // 形狀（SVG）
  const SHAPES = {
    圓形: '<circle cx="50" cy="50" r="40"/>',
    三角形: '<polygon points="50,10 92,88 8,88"/>',
    正方形: '<rect x="14" y="14" width="72" height="72"/>',
    長方形: '<rect x="5" y="25" width="90" height="50"/>',
  };
  const SHAPE_COLOR = { 圓形: '#2f7de1', 三角形: '#e8443a', 正方形: '#2fb24a', 長方形: '#f0a800' };
  const shapeSvg = (name, size = 64) => `<svg class="mq-shape" viewBox="0 0 100 100" width="${size}" height="${size}" style="fill:${SHAPE_COLOR[name]}">${SHAPES[name]}</svg>`;
  // [圖示名稱, emoji 暫代]；名稱是空字串的只有 emoji
  const SHAPE_THINGS = {
    圓形: [['時鐘', '🕒'], ['球', '⚽'], ['橘子', '🍊'], ['', '🍩']],
    三角形: [['披薩', '🍕'], ['', '🍙'], ['', '⛺']],
    正方形: [['', '🎲'], ['', '🧇']],
    長方形: [['書', '📕'], ['黑板', '📋'], ['橡皮擦', '🧽'], ['', '🚪']],
  };
  const SHAPE_CORNERS = { 圓形: 0, 三角形: 3, 正方形: 4, 長方形: 4 };

  // ===== 題型 =====
  // 每個題型回傳 { key, html, speech, choices, ans, answerText }；key 用來避免連續出一樣的題目
  const TYPES = {
    // ── 1. 10 以內的數 ──
    count() {
      const [e, name, unit] = thing(), n = Math.random() < .1 ? 0 : rand(1, 10);
      return { key: 'count' + n, html: prompt(`有幾${unit}${name}？`) + pile(n, e),
               speech: n === 0 ? `盤子裡有幾${unit}${name}？` : `數一數，有幾${unit}${name}？`,
               choices: numChoices(n), ans: n, answerText: String(n) };
    },
    pickAmount() {
      const n = rand(1, 10), opts = numChoices(n, 1, 10);
      return { key: 'amount' + n, html: prompt('哪一個是這麼多？') + big(n), speech: `哪一個是 ${n} 個？`,
               choices: opts.map(x => ({ html: dots(x), value: x })), ans: n, answerText: `${n} 個點` };
    },
    numWord() {
      const n = rand(1, 10);
      return { key: 'word' + n, html: prompt('這是數字幾？') + big(CN[n]), speech: '這個國字是數字幾？',
               choices: numChoices(n, 1, 10), ans: n, answerText: String(n) };
    },

    // ── 2. 比長短 ──
    longest() {
      const k = Math.random() < .5 ? 2 : 3, longQ = Math.random() < .5;
      const cols = shuffle([...COLORS]).slice(0, k);
      const lens = shuffle([3, 5, 7, 9].slice(0, 4)).slice(0, k);   // 長度差很明顯
      const target = cols[lens.indexOf(longQ ? Math.max(...lens) : Math.min(...lens))];
      return { key: 'long' + lens.join(), html: prompt(`哪一條${longQ ? '最長' : '最短'}？`) +
               `<div class="mq-bars">${cols.map((c, i) => bar(lens[i], c[0])).join('')}</div>`,
               speech: `哪一條${longQ ? '最長' : '最短'}？`,
               choices: cols.map(c => swatch(c)), ans: target[1], answerText: target[1] };
    },
    unitLength() {
      const n = rand(2, 9), c = pick(COLORS);
      return { key: 'unit' + n, html: prompt('這條有幾格長？') + `<div class="mq-bars">${bar(n, c[0], true)}</div>`,
               speech: '數一數，這條有幾格長？', choices: numChoices(n, 1, 10), ans: n, answerText: `${n} 格` };
    },

    // ── 3. 順序與多少 ──
    ordinal() {
      const animals = shuffle(ANIMALS.map(a => a[0])).slice(0, rand(5, 7));
      const em = n => ANIMALS.find(a => a[0] === n)[1];
      const fromLeft = Math.random() < .6, k = rand(1, animals.length);
      const ans = fromLeft ? animals[k - 1] : animals[animals.length - k];
      const others = shuffle(animals.filter(a => a !== ans)).slice(0, 3);
      return { key: 'ord' + k + fromLeft, html: prompt(`從${fromLeft ? '左' : '右'}邊數來，第 ${k} 個是誰？`) +
               `<div class="mq-row">${fromLeft ? '<em>👉</em>' : ''}${animals.map(a => `<i>${ic(a, em(a), 'sm')}</i>`).join('')}${fromLeft ? '' : '<em>👈</em>'}</div>`,
               speech: `從${fromLeft ? '左' : '右'}邊數來，第 ${k} 個是誰？`,
               choices: shuffle([ans, ...others]).map(a => ({ html: ic(a, em(a), 'ch'), value: a })), ans, answerText: ans };
    },
    more() {
      const [e, name] = thing();
      let a = rand(1, 9), b = rand(1, 9); while (a === b) b = rand(1, 9);
      const askMore = Math.random() < .6;
      const ans = (a > b) === askMore ? '上面' : '下面';
      return { key: 'more' + a + b, html: prompt(`哪一排${askMore ? '比較多' : '比較少'}？`) +
               `<div class="mq-two"><div><b>上面</b>${pile(a, e)}</div><div><b>下面</b>${pile(b, e)}</div></div>`,
               speech: `哪一排的${name}${askMore ? '比較多' : '比較少'}？`,
               choices: [{ html: '⬆️ 上面', value: '上面' }, { html: '⬇️ 下面', value: '下面' }], ans, answerText: ans };
    },
    nextNum() {
      const after = Math.random() < .6, n = after ? rand(0, 9) : rand(1, 10), ans = after ? n + 1 : n - 1;
      return { key: 'next' + n + after, html: prompt(`${n} 的${after ? '後面' : '前面'}是幾？`) +
               big(after ? `${n} → ？` : `？ → ${n}`), speech: `${n} 的${after ? '後面' : '前面'}是幾？`,
               choices: numChoices(ans), ans, answerText: String(ans) };
    },

    // ── 4. 分與合 ──
    split() {
      const total = rand(3, 10), a = rand(1, total - 1), ans = total - a;
      return { key: 'split' + total + a, html: prompt(`${total} 可以分成 ${a} 和幾？`) +
               `<div class="mq-split"><span class="mq-whole">${total}</span><span class="mq-parts"><span>${a}</span><span class="q">？</span></span></div>` +
               `<div class="mq-dotline">${'●'.repeat(a)}<span class="faint">${'○'.repeat(ans)}</span></div>`,
               speech: `${total} 可以分成 ${a} 和幾？`, choices: numChoices(ans, 1, 9), ans, answerText: String(ans) };
    },
    combine() {
      const a = rand(1, 8), b = rand(1, 10 - a), ans = a + b;
      return { key: 'comb' + a + b, html: prompt(`${a} 和 ${b} 合起來是幾？`) +
               `<div class="mq-split"><span class="mq-parts"><span>${a}</span><span>${b}</span></span><span class="mq-whole q">？</span></div>` +
               `<div class="mq-dotline">${'●'.repeat(a)} ${'●'.repeat(b)}</div>`,
               speech: `${a} 和 ${b} 合起來是幾？`, choices: numChoices(ans, 2, 10), ans, answerText: String(ans) };
    },
    make10() {
      const a = rand(1, 9), ans = 10 - a;
      return { key: 'ten' + a, html: prompt(`${a} 和幾合起來是 10？`) + `<div class="mq-frame">${Array.from({ length: 10 }, (_, i) => `<b class="${i < a ? 'on' : ''}"></b>`).join('')}</div>`,
               speech: `${a} 和幾合起來是 10？`, choices: numChoices(ans, 1, 9), ans, answerText: String(ans) };
    },

    // ── 5. 認識形狀 ──
    whichShape() {
      const names = Object.keys(SHAPES), target = pick(names);
      return { key: 'shape' + target, html: prompt(`哪一個是${target}？`), speech: `哪一個是${target}？`,
               choices: shuffle([...names]).map(n => ({ html: shapeSvg(n, 60), value: n })), ans: target, answerText: target };
    },
    thingShape() {
      const names = Object.keys(SHAPES), target = pick(names), [tn, te] = pick(SHAPE_THINGS[target]);
      return { key: 'thing' + tn + te, html: prompt('它像什麼形狀？') + `<div class="mq-center">${ic(tn, te, 'big')}</div>`, speech: '它像什麼形狀？',
               choices: shuffle([...names]).map(n => ({ html: `${shapeSvg(n, 48)}<small>${n}</small>`, value: n })), ans: target, answerText: target };
    },
    corners() {
      const target = pick(['三角形', '正方形', '長方形', '圓形']), ans = SHAPE_CORNERS[target];
      return { key: 'corner' + target, html: prompt(`${target}有幾個角？`) + `<div class="mq-center">${shapeSvg(target, 90)}</div>`,
               speech: `${target}有幾個角？`, choices: [0, 2, 3, 4], ans, answerText: `${ans} 個` };
    },

    // ── 6. 10 以內的加法 ──
    addPic() {
      const [e] = thing(), a = rand(0, 9), b = rand(0, 10 - a), ans = a + b;
      return { key: 'add' + a + b, html: big(`${a} + ${b} = <span class="q">？</span>`) +
               `<div class="mq-two row">${pile(a, e)}<em>＋</em>${pile(b, e)}</div>`,
               speech: `${a} 加 ${b} 等於多少？`, choices: numChoices(ans), ans, answerText: String(ans) };
    },
    addStory() {
      const [e, name, unit] = thing(), a = rand(1, 7), b = rand(1, 10 - a), ans = a + b;
      const story = pick([`有 ${a} ${unit}${name}，又來了 ${b} ${unit}，現在有幾${unit}？`, `左邊有 ${a} ${unit}${name}，右邊有 ${b} ${unit}，合起來有幾${unit}？`]);
      return { key: 'adds' + a + b, html: prompt(story) + `<div class="mq-two row">${pile(a, e)}<em>＋</em>${pile(b, e)}</div>`,
               speech: story, choices: numChoices(ans), ans, answerText: `${a} + ${b} = ${ans}` };
    },

    // ── 7. 10 以內的減法 ──
    subPic() {
      const [e] = thing(), a = rand(1, 10), b = rand(0, a), ans = a - b;
      return { key: 'sub' + a + b, html: big(`${a} − ${b} = <span class="q">？</span>`) + pile(a, e, a - b),
               speech: `${a} 減 ${b} 等於多少？`, choices: numChoices(ans), ans, answerText: String(ans) };
    },
    subStory() {
      const [e, name, unit] = thing(), a = rand(3, 10), b = rand(1, a - 1), ans = a - b;
      const story = pick([`有 ${a} ${unit}${name}，拿走 ${b} ${unit}，還剩幾${unit}？`, `有 ${a} ${unit}${name}，跑掉了 ${b} ${unit}，還剩幾${unit}？`]);
      return { key: 'subs' + a + b, html: prompt(story) + pile(a, e, a - b),
               speech: story, choices: numChoices(ans), ans, answerText: `${a} − ${b} = ${ans}` };
    },

    // ── 8. 加減大挑戰 ──
    missing() {
      const plus = Math.random() < .5;
      let a, b, c;
      if (plus) { a = rand(0, 9); b = rand(1, 10 - a); c = a + b; } else { a = rand(2, 10); b = rand(1, a); c = a - b; }
      return { key: 'miss' + a + b + plus, html: prompt('？是多少？') + big(`${a} ${plus ? '+' : '−'} <span class="q">？</span> = ${c}`),
               speech: `${a} ${plus ? '加' : '減'} 多少，等於 ${c}？`, choices: numChoices(b), ans: b, answerText: String(b) };
    },
    compareDiff() {
      const pets = shuffle([['小狗', '狗', '🐶'], ['小貓', '貓', '🐱'], ['兔子', '兔子', '🐰'], ['小豬', '豬', '🐷'], ['小熊', '熊', '🐻']])
        .slice(0, 2).map(([label, icon, e]) => [ic(icon, e, 'sm'), label]);
      let a = rand(3, 10), b = rand(1, a - 1);
      const askMore = Math.random() < .5;
      const q = askMore ? `${pets[0][1]}比${pets[1][1]}多幾隻？` : `${pets[1][1]}比${pets[0][1]}少幾隻？`;
      return { key: 'diff' + a + b, html: prompt(q) +
               `<div class="mq-two"><div><b>${pets[0][0]}</b>${pile(a, pets[0][0])}</div><div><b>${pets[1][0]}</b>${pile(b, pets[1][0])}</div></div>`,
               speech: q, choices: numChoices(a - b, 0, 9), ans: a - b, answerText: `${a} − ${b} = ${a - b}` };
    },
    mixed() { return Math.random() < .5 ? TYPES.addPic() : TYPES.subPic(); },

    // ── 9. 30 以內的數 ──
    tensOnes() {
      const t = rand(1, 2), o = rand(0, 9), n = t * 10 + o;
      return { key: 'to' + n, html: prompt(`${t} 捆十根和 ${o} 根，是多少？`) +
               `<div class="mq-sticks">${Array.from({ length: t }, ten).join('')}${ones(o)}</div>`,
               speech: `${t} 捆十根，和 ${o} 根，合起來是多少？`, choices: numChoices(n, 10, 30), ans: n, answerText: String(n) };
    },
    bigger() {
      let a = rand(10, 30), b = rand(10, 30); while (a === b) b = rand(10, 30);
      const askBig = Math.random() < .6, ans = (a > b) === askBig ? a : b;
      return { key: 'cmp' + a + b, html: prompt(`哪一個比較${askBig ? '大' : '小'}？`), speech: `${a} 和 ${b}，哪一個比較${askBig ? '大' : '小'}？`,
               choices: [a, b], ans, answerText: String(ans) };
    },
    next30() {
      const after = Math.random() < .5, n = after ? rand(10, 29) : rand(11, 30), ans = after ? n + 1 : n - 1;
      return { key: 'n30' + n + after, html: prompt(`${n} 的${after ? '後面' : '前面'}是幾？`) + big(after ? `${n} → ？` : `？ → ${n}`),
               speech: `${n} 的${after ? '後面' : '前面'}是幾？`, choices: numChoices(ans, 10, 30), ans, answerText: String(ans) };
    },
  };

  // ===== 10 關：翰林一上單元 =====
  const LEVELS = [
    { title: '10 以內的數',  desc: '數一數、認數字', types: { count: 3, pickAmount: 2, numWord: 1 } },
    { title: '比長短',       desc: '最長、最短、幾格長', types: { longest: 3, unitLength: 2 } },
    { title: '順序與多少',   desc: '第幾個、比多少', types: { ordinal: 2, more: 2, nextNum: 2 } },
    { title: '分與合',       desc: '分成、合起來、湊 10', types: { split: 2, combine: 2, make10: 2 } },
    { title: '認識形狀',     desc: '圓形、三角形、正方形', types: { whichShape: 2, thingShape: 2, corners: 1 } },
    { title: '10 以內的加法', desc: '合起來、又來了', types: { addPic: 3, addStory: 2, combine: 1 } },
    { title: '10 以內的減法', desc: '拿走、剩下', types: { subPic: 3, subStory: 2, split: 1 } },
    { title: '加減大挑戰',   desc: '多幾個、少幾個', types: { mixed: 2, missing: 2, compareDiff: 2 } },
    { title: '30 以內的數',  desc: '十和一、比大小', types: { tensOnes: 3, bigger: 2, next30: 2 } },
    { title: '數學大魔王',   desc: '全部總複習', types: { count: 1, longest: 1, ordinal: 1, split: 1, make10: 1, thingShape: 1, addStory: 1, subStory: 1, compareDiff: 1, missing: 1, tensOnes: 1, bigger: 1 } },
  ];

  function question(L, last) {
    const w = LEVELS[L - 1].types;
    const bag = Object.entries(w).flatMap(([t, n]) => Array(n).fill(t));
    let q;
    for (let tries = 0; tries < 8; tries++) {
      let t = pick(bag);
      if (last && t === last.type && Object.keys(w).length > 1 && Math.random() < .6) t = pick(bag);   // 少一點連續同題型
      q = TYPES[t](); q.type = t;
      if (!last || q.key !== last.key) break;   // 不要連續出一模一樣的題目
    }
    return q;
  }

  const levels = () => LEVELS.map(l => ({ title: l.title, desc: l.desc }));

  window.MathBank = { TYPES, LEVELS, question, levels };
})();
