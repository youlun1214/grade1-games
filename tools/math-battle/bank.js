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

  // ===== 情境題用的小工具（參考翰林評量的題型，自己重新出題）=====
  const ICONS = { 機器人: '🤖', 泰迪熊: '🧸', 球: '⚽', 汽車: '🚗', 公車: '🚌', 向日葵: '🌻', 蜜蜂: '🐝', 蝸牛: '🐌', 蝴蝶: '🦋', 青蛙: '🐸', 魚: '🐟', 白天鵝: '🦢', 黑天鵝: '🦢',
    禮物: '🎁', 布丁: '🍮', 蛋塔: '🥧', 果汁: '🧃', 蛋糕: '🎂', 餅乾: '🍪', 水餃: '🥟', 小籠包: '🥟', 紅蘿蔔: '🥕', 棒棒糖: '🍭', 土司: '🍞', 彈珠: '🔮', 氣球: '🎈', 珍珠奶茶: '🧋',
    書: '📘', 時鐘: '🕒', 鉛筆: '✏️', 蘋果: '🍎', 盤: '🍽️', 籃子: '🧺', 手: '✋', 蒸籠: '🥘', 圈圈: '⭕', 兔子: '🐰', 熊貓: '🐼', 猴子: '🐵', 豬: '🐷' };
  const icn = (name, cls = 'sm') => ic(name, ICONS[name] || '❓', cls);
  const repeat = (n, s) => Array.from({ length: n }, () => s).join('');
  // 東西混在一起的場景
  const SCENES = [
    { cls: 'toy',    title: '玩具攤', items: [['機器人', '個'], ['泰迪熊', '隻'], ['球', '顆'], ['汽車', '輛']] },
    { cls: 'garden', title: '花園',   items: [['向日葵', '朵'], ['蜜蜂', '隻'], ['蝸牛', '隻'], ['蝴蝶', '隻']] },
    { cls: 'pond',   title: '池塘',   items: [['青蛙', '隻'], ['魚', '條'], ['白天鵝', '隻'], ['黑天鵝', '隻']] },
    { cls: 'party',  title: '派對',   items: [['禮物', '個'], ['布丁', '個'], ['蛋塔', '個'], ['果汁', '杯']] },
  ];
  // 把東西隨機撒在場景裡（不排整齊，要自己分開數）
  function scatter(list, cls) {
    const cols = 6, rows = Math.max(3, Math.ceil(list.length / 4));
    const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i));
    const items = shuffle([...list]).map((h, i) => {
      const c = cells[i] % cols, r = Math.floor(cells[i] / cols), jit = () => (Math.random() - .5) * .18;
      return `<i style="left:${(c + .5 + jit()) * 100 / cols}%;top:${(r + .5 + jit()) * 100 / rows}%">${h}</i>`;
    });
    return `<div class="mq-scene ${cls}" style="--rows:${rows}">${items.join('')}</div>`;
  }
  const mixed = (kinds, counts) => kinds.flatMap((k, i) => Array(counts[i]).fill(icn(k[0])));
  const mini = (n, name) => `<span class="mq-mini">${repeat(n, icn(name))}</span>`;
  // 紙牌（撲克牌配對）
  const card = (n, red) => `<span class="mq-card${red ? ' red' : ''}"><b>${n}</b><span>${repeat(n, red ? '♦' : '♣')}</span></span>`;
  // 繩子、路（SVG）
  const rope = d => `<svg class="mq-rope" viewBox="0 0 100 50"><path d="${d}"/></svg>`;
  const STRAIGHT = ['M8 25 H92', 'M12 42 L88 8', 'M12 8 L88 42', 'M30 45 L70 5'];
  const CURVES = ['M8 40 C 25 -10, 45 60, 60 20 S 85 5, 92 30', 'M10 25 q 13 -24 26 0 t 26 0 t 26 0', 'M15 45 C 15 5, 85 5, 85 45', 'M12 12 C 40 12, 20 42, 50 42 S 70 10, 90 30'];
  const pencilLen = () => rand(5, 7);
  // 第幾顆／幾顆：一排蘋果，塗色的亮起來
  const rowPick = (total, on) => `<span class="mq-rowpick">${Array.from({ length: total }, (_, i) => `<i class="${on.has(i) ? 'on' : ''}">${icn('蘋果')}</i>`).join('')}</span>`;
  const range = (a, n) => new Set(Array.from({ length: n }, (_, i) => a + i));

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

    // ===== 以下參考翰林評量的情境題 =====
    // ── 1. 10 以內的數 ──
    mixCount() {           // 東西混在一起，只數其中一種
      const sc = pick(SCENES), kinds = shuffle([...sc.items]).slice(0, 3), counts = kinds.map(() => rand(2, 8));
      if (counts.reduce((x, y) => x + y) > 16) counts[0] = 2;
      const i = rand(0, 2), [name, unit] = kinds[i], n = counts[i];
      return { key: 'mix' + name + n, html: prompt(`${sc.title}裡有幾${unit}${name}？`) + scatter(mixed(kinds, counts), sc.cls),
               speech: `${sc.title}裡有好多東西，數一數，有幾${unit}${name}？`, choices: numChoices(n, 1, 10), ans: n, answerText: `${n} ${unit}` };
    },
    listMatch() {          // 照清單找一樣多
      const name = pick(['餅乾', '布丁', '蛋塔', '蛋糕', '棒棒糖']), n = rand(3, 9), opts = numChoices(n, 2, 10);
      return { key: 'list' + name + n, html: prompt(`要買 ${n} 個${name}，哪一盤剛剛好？`) + `<div class="mq-note">${n} 個 ${icn(name)}</div>`,
               speech: `清單上要買 ${n} 個${name}，哪一盤剛剛好？`,
               choices: opts.map(x => ({ html: mini(x, name), value: x })), ans: n, answerText: `${n} 個` };
    },
    perOne() {             // 一對一：每個都要 1 個
      const [who, unitA, thingName, unitB] = pick([['珍珠奶茶', '杯', '吸管', '根'], ['籃子', '個', '紅蘿蔔', '根'], ['盤', '個', '蛋塔', '個'], ['果汁', '杯', '吸管', '根']]);
      const n = rand(2, 9), label = who === '盤' ? '盤子' : who;
      const q = `每${unitA}${label}要配 1 ${unitB}${thingName}，一共要幾${unitB}？`;
      return { key: 'per' + who + n, html: prompt(q) + `<div class="mq-pile">${repeat(n, icn(who))}</div>`, speech: q, choices: numChoices(n, 1, 10), ans: n, answerText: `${n} ${unitB}` };
    },

    // ── 2. 比長短 ──
    curveLine() {          // 曲線、直線
      const askCurve = Math.random() < .6;
      const right = pick(askCurve ? CURVES : STRAIGHT), rest = shuffle(askCurve ? STRAIGHT : CURVES).slice(0, 3);
      return { key: 'line' + askCurve + right.length, html: prompt(`哪一條是${askCurve ? '曲線（彎彎的）' : '直線（直直的）'}？`), speech: `哪一條是${askCurve ? '曲線' : '直線'}？`,
               choices: shuffle([right, ...rest]).map(d => ({ html: rope(d), value: d })), ans: right, answerText: askCurve ? '彎彎的是曲線' : '直直的是直線' };
    },
    wavyRoad() {           // 起點終點一樣，越彎的路越長
      const askLong = Math.random() < .6, cols = shuffle([...COLORS]).slice(0, 3), order = shuffle([0, 1, 2]);
      const path = (kind, y) => kind === 0 ? `M14 ${y} H286` : kind === 1 ? `M14 ${y} q 68 -18 136 0 t 136 0` : `M14 ${y} q 23 -22 45 0 t 45 0 t 45 0 t 45 0 t 45 0 t 47 0`;
      const lines = order.map((k, i) => `<path d="${path(k, 26 + i * 44)}" stroke="${cols[i][0]}"/>`).join('');
      const target = cols[order.indexOf(askLong ? 2 : 0)];
      return { key: 'road' + order.join('') + askLong, html: prompt(`從左邊走到右邊，哪一條路${askLong ? '最長' : '最短'}？`) +
               `<svg class="mq-road" viewBox="0 0 300 150"><line x1="14" y1="4" x2="14" y2="146"/><line x1="286" y1="4" x2="286" y2="146"/>${lines}</svg>`,
               speech: `從左邊走到右邊，哪一條路${askLong ? '最長' : '最短'}？`, choices: cols.map(c => swatch(c)), ans: target[1], answerText: `${target[1]}的路${askLong ? '（越彎越長）' : '（直直的最短）'}` };
    },
    penFit() {             // 放得進鉛筆盒嗎
      const box = pencilLen(), cols = shuffle([...COLORS]).slice(0, 3);
      const lens = shuffle([box + rand(1, 2), box - 1, box - 2]);
      const i = lens.findIndex(l => l > box);
      return { key: 'pen' + box + lens.join(), html: prompt('哪一枝筆太長，放不進鉛筆盒？') +
               `<div class="mq-bars"><small>鉛筆盒</small>${bar(box, '#8a5a2b')}${lens.map((l, k) => bar(l, cols[k][0])).join('')}</div>`,
               speech: '上面是鉛筆盒。哪一枝筆太長，放不進鉛筆盒？', choices: cols.map(c => swatch(c)), ans: cols[i][1], answerText: `${cols[i][1]}的筆比鉛筆盒長` };
    },
    stoolTall() {          // 站在椅子上頭頂一樣高，要看本來誰高
      const names = shuffle(['兔子', '熊貓', '猴子', '豬']).slice(0, 3), stools = shuffle([0, 26, 52]), askTall = Math.random() < .6;
      const i = stools.indexOf(askTall ? 0 : 52);
      return { key: 'stool' + stools.join() + askTall, html: prompt(`有的站在椅子上。誰本來${askTall ? '最高' : '最矮'}？`) +
               `<div class="mq-stands">${names.map((n, k) => `<div class="mq-stand"><span style="height:${120 - stools[k]}px">${icn(n, '')}</span>${stools[k] ? `<u style="height:${stools[k]}px"></u>` : ''}</div>`).join('')}</div>`,
               speech: `頭頂一樣高，但是有的站在椅子上。誰本來${askTall ? '最高' : '最矮'}？`,
               choices: names.map(n => ({ html: icn(n, 'ch'), value: n })), ans: names[i], answerText: askTall ? '沒有站椅子的最高' : '站最高椅子的最矮' };
    },
    thinner() {            // 比厚薄：大的不一定厚
      const cols = shuffle([...COLORS]).slice(0, 3), thick = shuffle([12, 26, 42]), askThin = Math.random() < .6;
      const hs = thick.map(t => 130 - t);            // 比較薄的反而比較高，大的不一定比較厚
      const i = thick.indexOf(askThin ? 12 : 42);
      return { key: 'thin' + thick.join() + askThin, html: prompt(`哪一本書${askThin ? '最薄' : '最厚'}？`) +
               `<div class="mq-books">${thick.map((t, k) => `<span style="width:${t}px;height:${hs[k]}px;background:${cols[k][0]}"></span>`).join('')}</div>`,
               speech: `哪一本書${askThin ? '最薄' : '最厚'}？大的不一定比較厚喔。`, choices: cols.map(c => swatch(c)), ans: cols[i][1], answerText: `${cols[i][1]}的書` };
    },
    copyStrip() {          // 不能對齊時，複製長度再比
      const [c1, c2] = shuffle([...COLORS]).slice(0, 2);
      const a = rand(5, 8), b = a + pick([-2, -1, 1, 2]), askLong = Math.random() < .6;
      const ans = (a > b) === askLong ? '甲' : '乙';
      const rot = (l, c, r, t) => `<span style="width:${l * 17}px;background:${c};rotate:${r}deg">${t}</span>`;
      return { key: 'copy' + a + b + askLong, html: prompt(`用紙條量好，哪一個比較${askLong ? '長' : '短'}？`) +
               `<div class="mq-rot no-zy">${rot(a, c1[0], 28, '甲')}${rot(b, c2[0], -34, '乙')}</div><div class="mq-bars"><small>量好的紙條</small>${bar(a, c1[0])}${bar(b, c2[0])}</div>`,
               speech: `甲和乙沒辦法放在一起，先用紙條量好，再比一比。哪一個比較${askLong ? '長' : '短'}？`,
               choices: [{ html: `<span class="mq-swatch" style="--c:${c1[0]}"></span>甲`, value: '甲' }, { html: `<span class="mq-swatch" style="--c:${c2[0]}"></span>乙`, value: '乙' }], ans, answerText: `${ans}的紙條比較${askLong ? '長' : '短'}` };
    },

    // ── 3. 順序與多少 ──
    train() {              // 火車車廂
      const n = rand(2, 9), mode = pick(['gap', 'between', 'after']);
      const q = mode === 'between' ? `${n - 1} 和 ${n + 1} 的中間是幾？` : mode === 'after' ? `${n - 1} 的後面是幾？` : '火車少了哪一號？';
      return { key: 'train' + n + mode, html: prompt(q) + `<div class="mq-train"><em>🚂</em>${Array.from({ length: 10 }, (_, i) => `<b class="${i + 1 === n ? 'q' : ''}">${i + 1 === n ? '？' : i + 1}</b>`).join('')}</div>`,
               speech: q, choices: numChoices(n, 1, 10), ans: n, answerText: String(n) };
    },
    countdown() {          // 倒數
      const n = rand(2, 9);
      return { key: 'down' + n, html: prompt('倒著數，？是幾？') + `<div class="mq-train down">${Array.from({ length: 10 }, (_, i) => `<b class="${10 - i === n ? 'q' : ''}">${10 - i === n ? '？' : 10 - i}</b>`).join('')}</div>`,
               speech: '煙火要開始了！從 10 倒著數，問號是幾？', choices: numChoices(n, 1, 10), ans: n, answerText: String(n) };
    },
    nthVsCount() {         // 「第 3 顆」只有一顆，「3 顆」是三顆
      const k = rand(2, 6), nth = Math.random() < .5, total = 8;
      const right = nth ? new Set([k - 1]) : range(rand(0, total - k), k);
      const w1 = nth ? range(0, k) : new Set([k - 1]);
      const w2 = nth ? new Set([k]) : range(0, k + 1);
      const q = nth ? `從左邊數，<b>第 ${k} 顆</b>塗顏色` : `<b>${k} 顆</b>塗顏色`;
      return { key: 'nth' + k + nth, html: prompt(q), speech: nth ? `從左邊數，第 ${k} 顆，只有一顆喔。哪一排是對的？` : `${k} 顆，要塗 ${k} 顆喔。哪一排是對的？`,
               choices: shuffle([{ html: rowPick(total, right), value: 'r' }, { html: rowPick(total, w1), value: 'a' }, { html: rowPick(total, w2), value: 'b' }]), ans: 'r',
               answerText: nth ? `第 ${k} 顆只有一顆` : `${k} 顆要塗 ${k} 顆` };
    },
    queue() {              // 排隊：排在第幾隻
      const names = shuffle(['兔子', '熊貓', '猴子', '豬', '青蛙']), k = rand(1, 5), who = names[k - 1];
      return { key: 'queue' + k + who, html: prompt(`排隊盪鞦韆，${who}排在第幾隻？`) + `<div class="mq-row"><em>🚩</em>${names.map(n => `<i>${icn(n)}</i>`).join('')}</div>`,
               speech: `動物排隊盪鞦韆，旗子旁邊是第 1 隻。${who}排在第幾隻？`, choices: numChoices(k, 1, 6), ans: k, answerText: `第 ${k} 隻` };
    },
    cabinet() {            // 櫃子：從上往下、從下往上
      const items = shuffle(['書', '球', '時鐘', '泰迪熊', '機器人', '鉛筆', '禮物']).slice(0, 5), k = rand(1, 5), fromTop = Math.random() < .4;
      const ans = fromTop ? items[k - 1] : items[5 - k], q = `${fromTop ? '從上往下' : '從下往上'}數，第 ${k} 格是什麼？`;
      return { key: 'cab' + k + fromTop + ans, html: prompt(q) + `<div class="mq-cab"><em>${fromTop ? '⬇️' : '⬆️'}</em><div>${items.map(n => `<i>${icn(n)}</i>`).join('')}</div></div>`,
               speech: q, choices: shuffle([ans, ...shuffle(items.filter(n => n !== ans)).slice(0, 3)]).map(n => ({ html: icn(n, 'ch'), value: n })), ans, answerText: `第 ${k} 格是${ans}` };
    },
    enough() {             // 一個對一個，夠不夠
      const [food, plate, label] = pick([['蛋塔', '盤', '盤子'], ['布丁', '盤', '盤子'], ['紅蘿蔔', '籃子', '籃子']]);
      const a = rand(3, 9), b = Math.max(2, Math.min(10, a + pick([-2, -1, 0, 1, 2]))), max = Math.max(a, b), ok = b >= a;
      const cell = (i, n, name) => `<i>${i < n ? icn(name) : ''}</i>`;
      return { key: 'enough' + food + a + b, html: prompt(`1 個${label}放 1 個${food}，${label}夠不夠？`) +
               `<div class="mq-match" style="--n:${max}">${Array.from({ length: max }, (_, i) => cell(i, a, food)).join('')}${Array.from({ length: max }, (_, i) => cell(i, b, plate)).join('')}</div>`,
               speech: `1 個${label}放 1 個${food}，${label}夠不夠？`, choices: [{ html: '✅ 夠', value: '夠' }, { html: '❌ 不夠', value: '不夠' }], ans: ok ? '夠' : '不夠', answerText: `${a} 個${food}、${b} 個${label}，${ok ? '夠' : '不夠'}` };
    },
    mixMore() {            // 混在一起比多少
      const sc = pick(SCENES), [x, y] = shuffle([...sc.items]).slice(0, 2), a = rand(2, 9);
      let b = rand(2, 9); if (Math.random() < .15) b = a; while (b === a && Math.random() < .85) b = rand(2, 9);
      const ans = a > b ? x[0] : b > a ? y[0] : '一樣多';
      return { key: 'mm' + x[0] + y[0] + a + b, html: prompt(`${x[0]}和${y[0]}，哪一種比較多？`) + scatter(mixed([x, y], [a, b]), sc.cls), speech: `${x[0]}和${y[0]}，哪一種比較多？分開數一數。`,
               choices: [{ html: icn(x[0], 'ch'), value: x[0] }, { html: icn(y[0], 'ch'), value: y[0] }, { html: '一樣多', value: '一樣多' }], ans, answerText: `${x[0]} ${a}、${y[0]} ${b}` };
    },
    chartMost() {          // 畫○的表，找最多、最少
      const names = shuffle(SCENES[3].items.map(i => i[0])), counts = shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, 4), askMost = Math.random() < .65;
      const n = askMost ? Math.max(...counts) : Math.min(...counts), ans = names[counts.indexOf(n)];
      return { key: 'chart' + counts.join() + askMost, html: prompt(`哪一種${askMost ? '最多' : '最少'}？`) +
               `<div class="mq-chart">${names.map((nm, i) => `<div>${icn(nm)}<span>${repeat(counts[i], '<b></b>')}</span></div>`).join('')}</div>`,
               speech: `派對的東西畫成圓圈，哪一種${askMost ? '最多' : '最少'}？`, choices: names.map(nm => ({ html: icn(nm, 'ch'), value: nm })), ans, answerText: `${ans}有 ${n} 個` };
    },

    // ── 4. 分與合 ──
    shareTwo() {           // 分給兩個人
      const [food, unit] = pick([['餅乾', '包'], ['水餃', '個'], ['蛋塔', '個'], ['棒棒糖', '根'], ['紅蘿蔔', '根'], ['土司', '片']]);
      const total = rand(4, 10), a = rand(1, total - 1), ans = total - a, q = `${total} ${unit}${food}分給哥哥和妹妹，哥哥拿 ${a} ${unit}，妹妹拿幾${unit}？`;
      return { key: 'share' + total + a, html: prompt(q) + `<div class="mq-pile">${repeat(total, icn(food))}</div>`, speech: q, choices: numChoices(ans, 0, 9), ans, answerText: `${total} 可以分成 ${a} 和 ${ans}` };
    },
    hiddenBox() {          // 蓋住的彈珠
      const total = rand(4, 9), shown = rand(1, total - 1), ans = total - shown;
      return { key: 'box' + total + shown, html: prompt(`每盒有 ${total} 顆彈珠，被蓋住的有幾顆？`) + `<div class="mq-box"><span>${repeat(shown, icn('彈珠'))}</span><u>❓</u></div>`,
               speech: `每盒有 ${total} 顆彈珠，被蓋住的有幾顆？`, choices: numChoices(ans, 0, 9), ans, answerText: `${total} 可以分成 ${shown} 和 ${ans}` };
    },
    ringToss() {           // 套圈圈
      const total = rand(5, 8), hit = rand(0, total), miss = total - hit, ask = Math.random() < .6;
      const q = ask ? `丟 ${total} 個圈圈，套中 ${hit} 個，沒套中幾個？` : `丟 ${total} 個圈圈，沒套中 ${miss} 個，套中幾個？`;
      return { key: 'ring' + total + hit + ask, html: prompt(q) + `<div class="mq-toss"><div class="pole">${repeat(hit, '<b></b>')}</div><span>${repeat(miss, icn('圈圈'))}</span></div>`,
               speech: q, choices: numChoices(ask ? miss : hit, 0, 8), ans: ask ? miss : hit, answerText: `${total} 可以分成 ${hit} 和 ${miss}` };
    },
    steamer() {            // 蒸籠裡有幾個（常常是 0）
      const n = Math.random() < .35 ? 0 : rand(1, 5), spots = [[50, 45], [28, 30], [72, 30], [30, 62], [70, 62]];
      return { key: 'steam' + n, html: prompt('蒸籠裡有幾個小籠包？') + `<div class="mq-steamer">${icn('蒸籠', '')}${spots.slice(0, n).map(([x, y]) => `<i style="left:${x}%;top:${y}%">${icn('小籠包')}</i>`).join('')}</div>`,
               speech: '蒸籠裡有幾個小籠包？什麼都沒有就是零喔。', choices: numChoices(n, 0, 6), ans: n, answerText: n ? `${n} 個` : '0 個，什麼都沒有' };
    },
    pairSum() {            // 哪兩個數合起來
      const total = rand(5, 10), a = rand(1, total - 1), ans = `${a} 和 ${total - a}`, set = new Set([ans]);
      while (set.size < 4) { const x = rand(1, 8), y = rand(1, 8); if (x + y !== total && x + y <= 12) set.add(`${x} 和 ${y}`); }
      return { key: 'pair' + total + a, html: prompt(`哪兩個數合起來是 ${total}？`) + big(total), speech: `哪兩個數合起來是 ${total}？`, choices: shuffle([...set]), ans, answerText: ans };
    },
    cardsTen() {           // 撲克牌：合起來是 10
      const n = rand(1, 9), ans = 10 - n, opts = new Set([ans]);
      while (opts.size < 4) opts.add(rand(1, 9));
      return { key: 'card' + n, html: prompt('哪一張牌和它合起來是 10？') + `<div class="mq-center">${card(n, false)}</div>`, speech: `${n} 和哪一張牌合起來是 10？`,
               choices: shuffle([...opts]).map(x => ({ html: card(x, true), value: x })), ans, answerText: `${n} 和 ${ans} 合起來是 10` };
    },
    basketPair() {         // 哪兩籃合起來
      const food = pick(['紅蘿蔔', '蛋塔', '餅乾']), total = rand(4, 8), a = rand(1, total - 1), used = new Set([a * 10 + total - a]), rows = [[a, total - a]];
      while (rows.length < 3) { const x = rand(1, 5), y = rand(1, 5); if (x + y !== total && !used.has(x * 10 + y)) { used.add(x * 10 + y); rows.push([x, y]); } }
      return { key: 'bk' + food + total + a, html: prompt(`哪兩籃的${food}合起來是 ${total} 個？`), speech: `哪兩籃的${food}合起來是 ${total} 個？`,
               choices: shuffle(rows).map(([x, y]) => ({ html: `<span class="mq-rowpick two">${mini(x, food)}<em>＋</em>${mini(y, food)}</span>`, value: `${x}+${y}` })), ans: `${a}+${total - a}`, answerText: `${a} 和 ${total - a}` };
    },
    handMarbles() {        // 兩手的彈珠
      const total = rand(4, 9), left = rand(1, total - 1), right = total - left, ask = Math.random() < .5;
      const hand = (t, n, cover) => `<div class="mq-hand"><small>${t}</small>${icn('手', '')}<span>${cover ? '❓' : repeat(n, icn('彈珠'))}</span></div>`;
      const q = ask ? `兩手一共有 ${total} 顆彈珠，右手有幾顆？` : '兩手的彈珠合起來有幾顆？';
      return { key: 'hand' + left + right + ask, html: prompt(q) + `<div class="mq-hands">${hand('左手', left)}${hand('右手', right, ask)}</div>`, speech: q,
               choices: numChoices(ask ? right : total, 0, 10), ans: ask ? right : total, answerText: `${left} 和 ${right} 合起來是 ${total}` };
    },
    mixedPart() {          // 兩種東西，分與合一起
      const [x, y, unit] = pick([['公車', '汽車', '輛'], ['泰迪熊', '機器人', '個'], ['蛋塔', '布丁', '個']]);
      const a = rand(1, 6), b = rand(1, 9 - a), q = `${a} ${unit}${x}和幾${unit}${y}合起來是 ${a + b} ${unit}？`;
      return { key: 'part' + x + a + b, html: prompt(q) + `<div class="mq-pile">${repeat(a, icn(x))}${repeat(b, icn(y))}</div>`, speech: q, choices: numChoices(b, 0, 9), ans: b, answerText: `${a} 和 ${b} 合起來是 ${a + b}` };
    },
  };

  // ===== 10 關：翰林一上單元 =====
  const LEVELS = [
    { title: '10 以內的數',  desc: '數一數、混在一起數', types: { count: 2, pickAmount: 1, numWord: 1, mixCount: 3, listMatch: 2, perOne: 2 } },
    { title: '比長短',       desc: '曲線、彎路、高矮、厚薄', types: { longest: 1, unitLength: 1, curveLine: 2, wavyRoad: 2, penFit: 2, stoolTall: 2, thinner: 2, copyStrip: 2 } },
    { title: '順序與多少',   desc: '第幾個、幾個、比多少', types: { ordinal: 1, more: 1, nextNum: 1, train: 2, countdown: 1, nthVsCount: 4, queue: 1, cabinet: 2, enough: 2, mixMore: 2, chartMost: 2 } },
    { title: '分與合',       desc: '分給兩人、蓋住的、湊 10', types: { split: 1, combine: 1, make10: 2, shareTwo: 2, hiddenBox: 2, ringToss: 2, steamer: 2, pairSum: 2, cardsTen: 2, basketPair: 2, handMarbles: 2, mixedPart: 1 } },
    { title: '認識形狀',     desc: '圓形、三角形、正方形', types: { whichShape: 2, thingShape: 2, corners: 1 } },
    { title: '10 以內的加法', desc: '合起來、又來了', types: { addPic: 3, addStory: 2, combine: 1, handMarbles: 1, mixedPart: 1 } },
    { title: '10 以內的減法', desc: '拿走、剩下', types: { subPic: 3, subStory: 2, split: 1, hiddenBox: 1, ringToss: 1 } },
    { title: '加減大挑戰',   desc: '多幾個、少幾個', types: { mixed: 2, missing: 2, compareDiff: 2, shareTwo: 1, cardsTen: 1 } },
    { title: '30 以內的數',  desc: '十和一、比大小', types: { tensOnes: 3, bigger: 2, next30: 2 } },
    { title: '數學大魔王',   desc: '全部總複習', types: { mixCount: 1, wavyRoad: 1, stoolTall: 1, nthVsCount: 2, cabinet: 1, chartMost: 1, hiddenBox: 1, cardsTen: 1, ringToss: 1, thingShape: 1, addStory: 1, subStory: 1, compareDiff: 1, missing: 1, tensOnes: 1, bigger: 1 } },
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
