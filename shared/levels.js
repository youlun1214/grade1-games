// 關卡制：10 隻怪獸、每關的難度、玩家名字與挑戰紀錄、開始畫面、關卡地圖、排行榜
// 數學、注音遊戲共用。搭配 shared/levels.css 使用
// 紀錄存在這台裝置的瀏覽器裡；家長登入後也會存一份到雲端（Firebase），瀏覽器資料被清掉或換裝置都找得回來
(function () {
  // ===== 10 隻怪獸：奧特曼經典怪獸，由弱到強（數學、注音共用同一組圖）=====
  // 圖片放在 assets/monsters/monster-01.png、monster-01-hurt.png、monster-01-down.png …
  // 畫圖需求見 docs/art-brief-for-gpt.md；emoji 是還沒放圖時的暫代
  const MONSTERS = [
    { name: '卡內貢',       emoji: '👛', moves: ['吞金幣', '金幣噴射'] },
    { name: '巴爾坦星人',   emoji: '🦞', moves: ['分身術', '大鉗子夾擊'] },
    { name: '艾雷王',       emoji: '⚡', moves: ['放電攻擊', '尾巴纏繞'] },
    { name: '雷德王',       emoji: '🦖', moves: ['丟大石頭', '頭槌'] },
    { name: '哥莫拉',       emoji: '🦏', moves: ['超振動波', '尾巴甩擊'] },
    { name: '貝蒙斯坦',     emoji: '🦅', moves: ['吸收光線', '肚子大嘴'] },
    { name: '梅菲拉斯星人', emoji: '👽', moves: ['握手詭計', '黑暗光彈'] },
    { name: '金古橋',       emoji: '🤖', moves: ['合體變形', '破壞光線'] },
    { name: '傑頓',         emoji: '👾', moves: ['一兆度火球', '瞬間移動', '傑頓屏障'] },
    { name: '貝利亞',       emoji: '😈', moves: ['貝利亞爪', '死亡光線', '黑暗衝擊'] },
  ];

  // ===== 每關的難度（規則說明見 docs/battle-rules.md）=====
  // 怪獸血量從 100 起跳，後面的關卡越來越多；怪獸第一次攻擊的秒數越來越短
  // 2026-11：孩子常常用到必殺技，第 2 關以後每關的怪獸血量都再加 10
  const TIMING = [
    { monsterHp: 100, firstAttackAt: 10 }, { monsterHp: 110, firstAttackAt: 10 }, { monsterHp: 110, firstAttackAt: 10 },
    { monsterHp: 130, firstAttackAt: 10 }, { monsterHp: 130, firstAttackAt: 9 },  { monsterHp: 130, firstAttackAt: 9 },
    { monsterHp: 150, firstAttackAt: 9 },  { monsterHp: 150, firstAttackAt: 8 },  { monsterHp: 150, firstAttackAt: 8 },
    { monsterHp: 200, firstAttackAt: 7, attackEvery: 4 },
  ];

  // 國字旁邊加注音（有載入 shared/zhuyin.js 才會加）
  // 只加在：輸入名字的畫面（大標題、名字欄、開始按鈕、玩家清單；副標題和聲音設定不加）、關卡地圖和排行榜的大標題
  const zy = el => { if (window.Zhuyin && el) window.Zhuyin.apply(el); };
  // 重要的按鈕要按兩次：第一次文字變成「再按一次確認」，3 秒內再按才算數
  // （不用瀏覽器的 confirm 確認視窗，有些瀏覽器會把它擋掉，看起來就像按了沒反應）
  function twoStep(btn, sureText) {
    if (btn.dataset.sure) return true;
    const old = btn.innerHTML;
    btn.dataset.sure = '1'; btn.textContent = sureText;
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; btn.innerHTML = old; } }, 3000);
    return false;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MEDALS = ['🥇', '🥈', '🥉'];

  // base：從遊戲頁面回到專案根目錄的路徑，例如 '../../'
  function monster(i, base) {
    const n = String(i + 1).padStart(2, '0');
    const p = `${base}assets/monsters/monster-${n}`;
    return Object.assign({}, MONSTERS[i], { img: { idle: `${p}.png`, hurt: `${p}-hurt.png`, down: `${p}-down.png` } });
  }

  // ===== 8 位可以選的奧特曼（assets/heroes/<id>/，12 式動作＋必殺技姿勢 player-beam.png）=====
  // beam：必殺技名稱；color：光波顏色（光芯都是白色，外圈用這個顏色）
  const HEROES = [
    { id: 'classic', name: '經典奧特曼',   beam: '斯派修姆光線', color: '#6fd2ff' },
    { id: 'zero',    name: '賽羅奧特曼',   beam: '集束光線',     color: '#4fa8ff' },
    { id: 'tiga',    name: '迪迦奧特曼',   beam: '哉佩利敖光線', color: '#c88bff' },
    { id: 'taiga',   name: '泰迦奧特曼',   beam: '風暴射線',     color: '#ff6a5a' },
    { id: 'geed',    name: '捷德奧特曼',   beam: '毀滅爆裂',     color: '#5a9bff' },
    { id: 'z',       name: '澤塔奧特曼',   beam: '傑斯特姆光線', color: '#55e0ff' },
    { id: 'trigger', name: '特利迦奧特曼', beam: '哉佩利敖光線', color: '#ffd166' },
    { id: 'belial',  name: '貝利亞奧特曼', beam: '死亡射線',     color: '#ff2d55' },
  ];
  const HERO_KEY = 'grade1-games:heroes';   // { 玩家名字: 角色 id }，三個遊戲共用
  const heroById = id => HEROES.find(h => h.id === id) || HEROES[0];
  const heroOf = name => heroById(read(HERO_KEY, {})[name]);
  function setHero(name, id) { const all = read(HERO_KEY, {}); all[name] = id; write(HERO_KEY, all); }

  // 玩家：選好的奧特曼，攻擊時從 7 個招式動作隨機挑一個
  function player(base, moves, name, lv) {
    const hero = heroOf(name);
    const p = n => `${base}assets/heroes/${hero.id}/${n}.png`;
    return {
      name: name || '我', level: lv || 1, emoji: '🧒', moves,
      img: {
        idle: p('player'), pose: p('player-pose'), hurt: p('player-hurt'), win: p('player-win'),
        attack: ['player-attack', 'player-kick', 'player-fire', 'player-fire2', 'player-punch', 'player-slash', 'player-spin'].map(p),
        beam: p('player-beam'),
      },
      special: { name: hero.beam, color: hero.color },
    };
  }

  // ===== 10 個關卡場景（assets/backgrounds/scene-01.jpg …）=====
  const SCENES = ['城市廢墟', '宇宙太空站', '沙漠荒原', '山谷地形', '森林古遺跡', '火山熔岩', '夜晚都市', '沙漠機械基地', '宇宙浮島', '黑暗宇宙'];
  const scene = (i, base) => `${base}assets/backgrounds/scene-${String(i + 1).padStart(2, '0')}.jpg`;

  // ===== 玩家紀錄 =====
  // { 名字: { name, unlocked, stars:{關卡:星數}, best, lastLevel, lastWon, plays, totalScore, lastPlayed } }
  const key = (gameId, k) => `grade1-games:${gameId}:${k}`;
  function read(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch (e) { return fallback; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function allPlayers(gameId) { return read(key(gameId, 'players'), {}); }
  function getPlayer(gameId, name) {
    return Object.assign({ name, unlocked: 1, stars: {}, best: 0, lastLevel: 0, lastWon: false, plays: 0, totalScore: 0, lastPlayed: '' },
                         allPlayers(gameId)[name] || {});
  }
  function savePlayer(gameId, p) { const all = allPlayers(gameId); all[p.name] = p; write(key(gameId, 'players'), all); pushCloud(gameId); }

  // ===== 雲端同步（家長登入後）=====
  // 同一個人在兩邊都有紀錄時合併：星星、過關、次數取比較多的，「上次挑戰」取比較新的
  function mergePlayer(a, b) {
    if (!a) return b; if (!b) return a;
    const [old, neu] = (a.lastPlayed || '') > (b.lastPlayed || '') ? [b, a] : [a, b];
    const stars = Object.assign({}, old.stars);
    Object.entries(neu.stars || {}).forEach(([k, v]) => { stars[k] = Math.max(stars[k] || 0, v); });
    return Object.assign({}, old, neu, { stars, best: Math.max(a.best || 0, b.best || 0), unlocked: Math.max(a.unlocked || 1, b.unlocked || 1),
      plays: Math.max(a.plays || 0, b.plays || 0), totalScore: Math.max(a.totalScore || 0, b.totalScore || 0) });
  }
  const loggedIn = () => !!(window.Cloud && Cloud.state.user);
  const pushTimers = {};
  function pushCloud(gameId) {
    if (!loggedIn()) return;
    clearTimeout(pushTimers[gameId]);
    pushTimers[gameId] = setTimeout(() => Cloud.savePlayers(gameId, allPlayers(gameId)).catch(() => {}), 800);
  }
  // 登入後把雲端的紀錄拿回來合併；有變動就呼叫 onChanged（重畫畫面）
  const syncing = {};
  function syncCloud(gameId, onChanged) {
    syncing[gameId] = onChanged;
    if (syncing[gameId + ':on']) return;
    if (!window.Cloud) { setTimeout(() => syncCloud(gameId, onChanged), 200); return; }
    syncing[gameId + ':on'] = true;
    let lastUid = '';
    Cloud.onChange(async st => {
      if (!st.user || st.user.uid === lastUid) return;
      lastUid = st.user.uid;
      try {
        const remote = await Cloud.loadPlayers(gameId) || {};
        const local = allPlayers(gameId), merged = Object.assign({}, local);
        Object.entries(remote).forEach(([n, p]) => { merged[n] = mergePlayer(local[n], p); });
        const changed = JSON.stringify(merged) !== JSON.stringify(local);
        write(key(gameId, 'players'), merged);
        if (JSON.stringify(merged) !== JSON.stringify(remote)) await Cloud.savePlayers(gameId, merged);
        if (changed && syncing[gameId]) syncing[gameId]();
      } catch (e) {}
    });
  }
  function current(gameId) { return read(key(gameId, 'current'), ''); }
  function setCurrent(gameId, name) { write(key(gameId, 'current'), name); if (!allPlayers(gameId)[name]) savePlayer(gameId, getPlayer(gameId, name)); }
  const totalStars = p => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);

  // 一場打完（不論輸贏）都記下來
  function recordResult(gameId, name, levelNo, r, totalLevels) {
    const p = getPlayer(gameId, name);
    p.plays++;
    p.totalScore += r.score;
    p.lastLevel = levelNo;
    p.lastWon = r.won;
    p.lastPlayed = new Date().toISOString();
    if (r.won) {
      p.stars[levelNo] = Math.max(p.stars[levelNo] || 0, r.stars);
      p.best = Math.max(p.best, levelNo);
      p.unlocked = Math.min(totalLevels, Math.max(p.unlocked, levelNo + 1));
    }
    savePlayer(gameId, p);
    return p;
  }

  // 排行榜：過到第幾關 → 星星總數 → 總分
  function ranking(gameId) {
    return Object.values(allPlayers(gameId)).map(p => getPlayer(gameId, p.name))
      .sort((a, b) => b.best - a.best || totalStars(b) - totalStars(a) || b.totalScore - a.totalScore);
  }

  function lastText(p) {
    if (!p.lastLevel) return '還沒開始挑戰';
    return `上次挑戰第 ${p.lastLevel} 關${p.lastWon ? ' ✅ 過關' : '，差一點點'}`;
  }

  // ===== 排行榜表格（結算畫面和排行榜頁共用）=====
  function boardHtml(gameId, highlight, limit) {
    const list = ranking(gameId);
    if (!list.length) return '<p class="lb-empty">還沒有紀錄</p>';
    let rows = list.map((p, i) => ({ p, i }));
    if (limit && rows.length > limit) {
      const me = rows.find(r => r.p.name === highlight);
      rows = rows.slice(0, limit);
      if (me && me.i >= limit) rows.push(me);   // 自己不在前幾名也要看得到
    }
    return `<table class="lb"><thead><tr><th>名次</th><th>名字</th><th>過關</th><th>⭐</th><th>總分</th></tr></thead><tbody>
      ${rows.map(({ p, i }) => `<tr class="${p.name === highlight ? 'me' : ''}">
        <td>${MEDALS[i] || i + 1}</td><td class="lb-name no-zy">${esc(p.name)}</td>
        <td>${p.best ? '第 ' + p.best + ' 關' : '—'}</td><td>${totalStars(p)}</td><td>${p.totalScore}</td></tr>`).join('')}
      </tbody></table>`;
  }

  /**
   * 開始畫面：輸入名字或選以前玩過的人（依設計總覽 01 開始畫面）
   * o.gameId, o.title, o.subtitle, o.base, o.homeHref, o.onStart(name), o.onBoard()
   */
  function renderStart(el, o) {
    // 家長登入後，雲端的紀錄拿回來合併，還停在這個畫面就重畫一次
    syncCloud(o.gameId, () => { if (el.querySelector('.lv-start')) renderStart(el, o); });
    const players = Object.values(allPlayers(o.gameId)).map(p => getPlayer(o.gameId, p.name))
      .sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || ''));
    el.innerHTML = `
      <div class="lv lv-start" style="background-image:linear-gradient(rgba(20,10,40,.15), rgba(20,10,40,.55)), url('${scene(0, o.base)}')">
        <div class="lv-bar">
          <a class="ui-round" href="${o.homeHref}" aria-label="回首頁">⌂</a>
          <span class="lv-bar-r"><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button><button class="ui-round" data-act="board" aria-label="排行榜">🏆</button></span>
        </div>
        <div class="lv-hero-row">
          <img class="lv-hero" src="${o.base}assets/player/player-pose.png" alt="" onerror="this.remove()">
          <div class="lv-titles">
            <div class="logo-text lv-logo">${o.title}</div>
            <p class="lv-sub no-zy">${o.subtitle || ''}</p>
          </div>
        </div>
        <div class="lv-tools no-zy"><button class="lv-voice" type="button" data-act="voice">🔊 聲音設定</button><span class="lv-cloud" data-cloud></span></div>
        <form class="lv-namebox">
          <label for="lv-name">你的名字是？</label>
          <input id="lv-name" maxlength="10" autocomplete="off" placeholder="中文、英文都可以">
          <button class="btn btn-gold" type="submit">開始挑戰 ▶</button>
          <p class="lv-err"></p>
        </form>
        ${players.length ? `<h2 class="lv-h2">之前玩過的人，點名字繼續</h2>
          <div class="lv-players">${players.map(p => `
            <button class="lv-player" data-name="${esc(p.name)}">
              <span class="lv-pname">🧒 <span class="no-zy">${esc(p.name)}</span> <small>Lv.${p.best + 1}</small></span>
              <span class="lv-plast">${lastText(p)}</span>
              <span class="lv-pstar">⭐ ${totalStars(p)}</span>
            </button>`).join('')}</div>` : ''}
      </div>`;
    zy(el);
    window.Music && Music.play('title');
    const input = el.querySelector('#lv-name');
    el.querySelector('form').onsubmit = e => {
      e.preventDefault();
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!name) { el.querySelector('.lv-err').textContent = '請先輸入名字喔！'; input.focus(); return; }
      setCurrent(o.gameId, name);
      pick(name);
    };
    // 名字確定後先選角色，選好才進關卡地圖
    const pick = name => renderSelect(el, { name, base: o.base, onDone: () => o.onStart(name), onBack: () => renderStart(el, o) });
    el.querySelectorAll('.lv-player').forEach(b => b.onclick = () => { setCurrent(o.gameId, b.dataset.name); pick(b.dataset.name); });
    el.querySelector('[data-act="board"]').onclick = o.onBoard;
    el.querySelector('[data-act="voice"]').onclick = () => window.Sound && Sound.openPicker();
    cloudBar(el.querySelector('[data-cloud]'));
  }

  /**
   * 關卡地圖（依設計總覽 03 選擇關卡：星空背景、圓形關卡按鈕、魔王關紅色發光）
   * o.gameId, o.name, o.title, o.base, o.levels:[{ title, desc }], o.onPick(index), o.onSwitch(), o.onBoard(), o.onReview()、o.onOnline()（可省略）
   */
  /**
   * 選擇角色：左右滑動（或按箭頭）選奧特曼，按確定後記在這位玩家身上
   * o.name, o.base, o.onDone(), o.onBack()
   */
  function renderSelect(el, o) {
    const start = HEROES.indexOf(heroOf(o.name));
    el.innerHTML = `
      <div class="lv lv-select" style="background-image:linear-gradient(rgba(20,10,40,.25), rgba(20,10,40,.6)), url('${scene(1, o.base)}')">
        <div class="lv-bar">
          <button class="ui-round" data-act="back" aria-label="返回">←</button>
          <div class="lv-ribbon">選擇角色</div>
          <span class="lv-bar-r"><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button></span>
        </div>
        <div class="hs-stage">
          <button class="hs-arrow left" data-act="prev" aria-label="上一位">‹</button>
          <div class="hs-track">
            ${HEROES.map(h => `<div class="hs-card" style="--c:${h.color}">
              <img src="${o.base}assets/heroes/${h.id}/player-pose.png" alt="" draggable="false">
              <div class="hs-name">${h.name}</div>
              <div class="hs-beam no-zy">必殺技：${h.beam}</div>
            </div>`).join('')}
          </div>
          <button class="hs-arrow right" data-act="next" aria-label="下一位">›</button>
        </div>
        <div class="hs-dots">${HEROES.map(() => '<i></i>').join('')}</div>
        <button class="btn btn-gold hs-go" data-act="go">就決定是你了！</button>
      </div>`;
    zy(el.querySelector('.lv-ribbon'));
    el.querySelectorAll('.hs-name, .hs-go').forEach(zy);
    window.Music && Music.play('title');
    const track = el.querySelector('.hs-track'), cards = [...track.children], dots = [...el.querySelectorAll('.hs-dots i')];
    let now = start, spoken = start, target = start;   // target：箭頭要去的位置（連按時才不會少跳）
    const paint = () => { cards.forEach((c, i) => c.classList.toggle('on', i === now)); dots.forEach((d, i) => d.classList.toggle('on', i === now)); };
    const center = c => c.offsetLeft + c.offsetWidth / 2 - track.clientWidth / 2;
    const go = (i, smooth = true) => track.scrollTo({ left: center(cards[i]), behavior: smooth ? 'smooth' : 'auto' });
    let timer;
    track.addEventListener('scroll', () => {
      const mid = track.scrollLeft;
      now = cards.reduce((b, c, i) => Math.abs(center(c) - mid) < Math.abs(center(cards[b]) - mid) ? i : b, 0);
      paint();
      clearTimeout(timer);   // 停下來才唸名字，滑動途中不要一直唸
      timer = setTimeout(() => { target = now; if (now !== spoken) { spoken = now; window.Sound && Sound.say(HEROES[now].name); } }, 260);
    }, { passive: true });
    paint(); requestAnimationFrame(() => go(start, false));
    el.querySelector('.lv-select').onclick = e => {
      const c = e.target.closest('.hs-card');
      if (c) return go(target = cards.indexOf(c));
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'prev') go(target = (target + HEROES.length - 1) % HEROES.length);
      else if (act === 'next') go(target = (target + 1) % HEROES.length);
      else if (act === 'back') o.onBack();
      else if (act === 'go') { setHero(o.name, HEROES[now].id); o.onDone(); }
    };
  }

  function renderMap(el, o) {
    const p = getPlayer(o.gameId, o.name);
    const total = o.levels.length;
    const node = (lv, i) => {
      const no = i + 1, m = monster(i, o.base);
      const locked = no > p.unlocked, boss = no === total;
      const s = p.stars[no] || 0;
      return `<button class="lv-node${locked ? ' locked' : ''}${boss ? ' boss' : ''}${no === p.lastLevel ? ' last' : ''}${no === p.unlocked && !locked ? ' next' : ''}"
                data-i="${i}" ${locked ? 'disabled' : ''} aria-label="第 ${no} 關 ${esc(lv.title)}">
        <span class="lv-ring"><img src="${m.img.idle}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${m.emoji}'}))"></span>
        <span class="lv-no">${no}</span>
        ${locked ? '<span class="lv-lock">🔒</span>' : ''}
        <span class="lv-stars">${Array.from({ length: 3 }, (_, k) => `<span class="ui-star${k < s ? '' : ' off'}">⭐</span>`).join('')}</span>
        <span class="lv-title">${esc(lv.title)}</span>
      </button>`;
    };
    const half = Math.ceil(total / 2);
    el.innerHTML = `
      <div class="lv lv-map bg-space">
        <div class="lv-bar">
          <button class="ui-round" data-act="switch" aria-label="換人">←</button>
          <div class="lv-ribbon">選擇關卡</div>
          <span class="lv-bar-r"><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button><button class="ui-round" data-act="board" aria-label="排行榜">🏆</button></span>
        </div>
        <div class="lv-who">${o.title}　🦸 ${heroOf(o.name).name}　<b class="no-zy">${esc(p.name)}</b> Lv.${p.best + 1}　${lastText(p)}</div>
        <div class="lv-path">
          <div class="lv-row">${o.levels.slice(0, half).map((lv, i) => node(lv, i)).join('<span class="lv-arrow">➜</span>')}</div>
          <div class="lv-turn">⤵</div>
          <div class="lv-row">${o.levels.slice(half).map((lv, i) => node(lv, i + half)).join('<span class="lv-arrow">➜</span>')}</div>
        </div>
        ${o.onReview ? `<button class="btn btn-orange lv-review" data-act="review">📝 錯題複習 <span data-review-n></span></button>` : ''}
        ${o.onOnline ? `<button class="btn btn-green lv-review" data-act="online">🌐 連線對戰</button>` : ''}
        <div class="lv-tools no-zy"><button class="lv-voice" type="button" data-act="hero">🦸 換角色</button><span class="lv-cloud" data-cloud></span></div>
        <button class="lv-unlock" data-act="unlock">家長：幫 <span class="no-zy">${esc(p.name)}</span> 解鎖全部關卡</button>
      </div>`;
    zy(el.querySelector('.lv-ribbon'));
    window.Music && Music.play('map');
    cloudBar(el.querySelector('[data-cloud]'));
    // 錯題複習按鈕上顯示還有幾題要複習
    const nEl = el.querySelector('[data-review-n]');
    const showCount = () => {
      if (!nEl || !nEl.isConnected) return;
      if (!window.Cloud) return setTimeout(showCount, 200);
      Cloud.onChange(() => Cloud.list({ game: o.gameId, player: o.name, includeResolved: false })
        .then(list => { nEl.textContent = list.length ? `（${list.length} 題）` : '（沒有錯題）'; }).catch(() => {}));
    };
    showCount();
    el.onclick = e => {
      const n = e.target.closest('.lv-node');
      if (n && !n.disabled) return o.onPick(+n.dataset.i);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'switch') o.onSwitch();
      else if (act === 'hero') renderSelect(el, { name: o.name, base: o.base, onDone: () => renderMap(el, o), onBack: () => renderMap(el, o) });
      else if (act === 'review') o.onReview();
      else if (act === 'online') o.onOnline();
      else if (act === 'board') o.onBoard();
      else if (act === 'unlock' && twoStep(e.target.closest('[data-act]'), `確定要幫 ${p.name} 解鎖全部 ${total} 關？再按一次`)) {
        const pp = getPlayer(o.gameId, o.name); pp.unlocked = total; savePlayer(o.gameId, pp);
        renderMap(el, o);
      }
    };
  }

  /** 排行榜頁：o.gameId, o.title, o.name（要標出來的人）, o.onBack() */
  function renderBoard(el, o) {
    el.innerHTML = `
      <div class="lv lv-board bg-space">
        <div class="lv-bar"><button class="ui-round" data-act="back" aria-label="返回">←</button><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button></div>
        <div class="logo-text lv-logo">🏆 排行榜</div>
        <p class="lv-sub">${o.title}・先比過到第幾關，再比星星和總分</p>
        ${boardHtml(o.gameId, o.name)}
        <p class="lv-note">紀錄存在這台裝置上。總分＝每題答對 10 分＋暴擊 5 分＋過關時剩下的血量。</p>
      </div>`;
    zy(el.querySelector('.lv-logo'));
    window.Music && Music.play('map');
    el.querySelector('[data-act="back"]').onclick = o.onBack;
  }

  // ===== 雲端答錯紀錄（shared/cloud.js）=====
  // 顯示「家長登入」或「已連線」
  function cloudBar(span) {
    if (!span) return;
    // cloud.js 是模組，會比畫面晚一點載入：還沒好就等一下再畫
    if (!window.Cloud) { setTimeout(() => span.isConnected && cloudBar(span), 200); return; }
    Cloud.onChange(st => {
      if (!st.configured) { span.innerHTML = `<span class="lv-cloud-off">☁️ 答錯紀錄先存在這台裝置</span>`; return; }
      if (st.user) {
        span.innerHTML = `☁️ 已連線雲端（${esc(st.user.email || '')}）<button class="lv-link" data-cloud-act="out">登出</button>`;
      } else {
        const n = Cloud.pending();
        span.innerHTML = `<button class="lv-voice" data-cloud-act="in">☁️ 家長登入</button>${n ? `<small>有 ${n} 筆答錯紀錄等著上傳</small>` : ''}`;
      }
      span.querySelector('[data-cloud-act="in"]') && (span.querySelector('[data-cloud-act="in"]').onclick = e => { e.stopPropagation(); Cloud.signIn(); });
      span.querySelector('[data-cloud-act="out"]') && (span.querySelector('[data-cloud-act="out"]').onclick = e => { e.stopPropagation(); if (twoStep(e.currentTarget, '確定登出？再按一次')) Cloud.signOut(); });
    });
  }

  // 答錯一題時記下來（itemKey：同一題用同一個代號，錯很多次會累加）
  function recordWrong(game, player, levelNo, q, chosen, chosenText, itemKey) {
    if (!window.Cloud) return;
    const keep = { html: q.html, choices: q.choices, ans: q.ans, speech: q.speech, choiceSpeech: q.choiceSpeech, answerText: q.answerText, answerSpeech: q.answerSpeech, type: q.type };
    Cloud.recordMistake({ game, player, level: levelNo, type: q.type, itemKey, q: keep, chosen: String(chosen), chosenText }).catch(() => {});
  }

  /**
   * 錯題複習：只出這位玩家答錯過、還沒學會的題目，連續答對 2 次就算學會
   * o.game, o.player, o.root, o.base, o.moves, o.speech(q), o.answerText(q), o.onExit()
   */
  // 舊的錯題紀錄修正：「找一找」以前的選項有標注音（等於給答案），複習時拿掉注音，改成一個一個唸選項
  function fixOld(q) {
    if (q.type !== 'hunt' || !Array.isArray(q.choices)) return q;
    const strip = h => String(h).replace(/<span class="zy-r">(?:<span[^>]*>[^<]*<\/span>){2}<\/span>/g, '').replace('class="zq-hw"', 'class="zq-hw no-zy"');
    q.choices = q.choices.map(c => (c && typeof c === 'object') ? Object.assign({}, c, { html: strip(c.html) }) : c);
    if (!q.choiceSpeech) q.choiceSpeech = q.choices.map(c => (c && typeof c === 'object') ? c.value : c);
    if (/哪一個有這個音|哪一個詞有這個音/.test(q.speech || '')) q.speech = '聽一聽，哪一個詞有這個音？';
    return q;
  }

  async function startReview(o) {
    if (!window.Cloud) { alert('雲端紀錄還沒載入，請稍等一下再試。'); return false; }
    const items = await Cloud.list({ game: o.game, player: o.player, includeResolved: false });
    if (!items.length) { alert('太棒了！目前沒有要複習的題目 🎉'); return false; }
    let order = [], last = null;
    const nextItem = () => {
      if (!order.length) order = items.filter(m => !m.resolved).sort(() => Math.random() - .5);
      if (!order.length) order = items.slice();
      let m = order.shift();
      if (m === last && order.length) { order.push(m); m = order.shift(); }
      return (last = m);
    };
    const i = Math.floor(Math.random() * MONSTERS.length);
    Battle.start({
      root: o.root,
      level: { no: 0, label: '錯題複習', title: `${items.length} 題`, monster: monster(i, o.base),
               rules: { monsterHp: Math.max(40, Math.min(100, items.length * 20)), firstAttackAt: 12 } },
      player: player(o.base, o.moves, o.player, getPlayer(o.game, o.player).best + 1),
      nextQuestion: () => { const m = nextItem(); return fixOld(Object.assign({}, m.q, { _item: m, key: m.id, word: m.id })); },
      renderQuestion: (q, el) => { el.innerHTML = q.html; },
      speech: o.speech, answerText: o.answerText,
      background: scene(i, o.base),
      onCorrect: q => Cloud.recordReviewCorrect(q._item).catch(() => {}),
      onWrong: (q, v, t) => Cloud.recordReviewWrong(q._item, String(v), t).catch(() => {}),
      onExit: o.onExit, exitLabel: '回關卡地圖',
    });
    return true;
  }

  window.Levels = { HEROES, heroOf, recordWrong, startReview, cloudBar, MONSTERS, TIMING, SCENES, scene, monster, player, current, setCurrent, getPlayer, recordResult, ranking, boardHtml,
                    renderStart, renderMap, renderBoard, totalStars };
})();
