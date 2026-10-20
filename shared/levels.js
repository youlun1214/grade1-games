// 關卡制：10 隻怪獸、每關的難度、玩家名字與挑戰紀錄、開始畫面、關卡地圖、排行榜
// 數學、注音遊戲共用。搭配 shared/levels.css 使用
// 紀錄存在這台裝置的瀏覽器裡（換平板或清除瀏覽資料就會不見）
(function () {
  // ===== 10 隻怪獸（數學、注音共用同一組圖）=====
  // 圖片放在 assets/monsters/monster-01.png、monster-01-hurt.png、monster-01-down.png …
  const MONSTERS = [
    { name: '蛋蛋龍',   emoji: '🐣', moves: ['蛋殼撞擊', '啾啾叫'] },
    { name: '黏黏蝸',   emoji: '🐌', moves: ['黏液噴射', '慢慢滾'] },
    { name: '呱呱蛙',   emoji: '🐸', moves: ['水槍', '舌頭鞭'] },
    { name: '硬殼龜',   emoji: '🐢', moves: ['縮殼衝撞', '水泡泡'] },
    { name: '夾夾蟹',   emoji: '🦀', moves: ['大鉗子', '泡沫光線'] },
    { name: '墨墨章魚', emoji: '🐙', moves: ['噴墨汁', '八爪纏繞'] },
    { name: '黑翼蝙蝠', emoji: '🦇', moves: ['超音波', '翅膀拍打'] },
    { name: '月光狼',   emoji: '🐺', moves: ['月光咬', '狼嚎'] },
    { name: '暴暴龍',   emoji: '🦖', moves: ['甩尾巴', '大地重踩'] },
    { name: '魔王龍',   emoji: '🐉', moves: ['魔王火焰', '雷電吐息', '龍捲風'] },
  ];

  // ===== 每關的難度（規則說明見 docs/battle-rules.md）=====
  // 怪獸血量從 100 起跳，後面的關卡越來越多；怪獸第一次攻擊的秒數越來越短
  const TIMING = [
    { monsterHp: 100, firstAttackAt: 10 }, { monsterHp: 100, firstAttackAt: 10 }, { monsterHp: 100, firstAttackAt: 10 },
    { monsterHp: 120, firstAttackAt: 10 }, { monsterHp: 120, firstAttackAt: 9 },  { monsterHp: 120, firstAttackAt: 9 },
    { monsterHp: 140, firstAttackAt: 9 },  { monsterHp: 140, firstAttackAt: 8 },  { monsterHp: 140, firstAttackAt: 8 },
    { monsterHp: 180, firstAttackAt: 7, attackEvery: 4 },
  ];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MEDALS = ['🥇', '🥈', '🥉'];

  // base：從遊戲頁面回到專案根目錄的路徑，例如 '../../'
  function monster(i, base) {
    const n = String(i + 1).padStart(2, '0');
    const p = `${base}assets/monsters/monster-${n}`;
    return Object.assign({}, MONSTERS[i], { img: { idle: `${p}.png`, hurt: `${p}-hurt.png`, down: `${p}-down.png` } });
  }

  function player(base, moves, name) {
    const p = `${base}assets/player/player`;
    return { name: name || '我', emoji: '🧒', moves, img: { idle: `${p}.png`, attack: `${p}-attack.png`, hurt: `${p}-hurt.png` } };
  }

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
  function savePlayer(gameId, p) { const all = allPlayers(gameId); all[p.name] = p; write(key(gameId, 'players'), all); }
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
        <td>${MEDALS[i] || i + 1}</td><td class="lb-name">${esc(p.name)}</td>
        <td>${p.best ? '第 ' + p.best + ' 關' : '—'}</td><td>${totalStars(p)}</td><td>${p.totalScore}</td></tr>`).join('')}
      </tbody></table>`;
  }

  /**
   * 開始畫面：輸入名字或選以前玩過的人
   * o.gameId, o.title, o.subtitle, o.homeHref, o.onStart(name), o.onBoard()
   */
  function renderStart(el, o) {
    const players = Object.values(allPlayers(o.gameId)).map(p => getPlayer(o.gameId, p.name))
      .sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || ''));
    el.innerHTML = `
      <div class="lv lv-start">
        <a class="lv-home" href="${o.homeHref}">← 回首頁</a>
        <h1>${o.title}</h1>
        <p class="lv-sub">${o.subtitle || ''}</p>
        <form class="lv-namebox">
          <label for="lv-name">你的名字是？</label>
          <input id="lv-name" maxlength="10" autocomplete="off" placeholder="中文、英文都可以">
          <button type="submit">開始挑戰 ▶</button>
          <p class="lv-err"></p>
        </form>
        ${players.length ? `<h2 class="lv-h2">之前玩過的人，點名字繼續</h2>
          <div class="lv-players">${players.map(p => `
            <button class="lv-player" data-name="${esc(p.name)}">
              <span class="lv-pname">🧒 ${esc(p.name)}</span>
              <span class="lv-plast">${lastText(p)}</span>
              <span class="lv-pstar">⭐ ${totalStars(p)}・${p.best ? `過到第 ${p.best} 關` : '還沒過關'}</span>
            </button>`).join('')}</div>` : ''}
        <button class="lv-boardbtn" data-act="board">🏆 排行榜</button>
      </div>`;
    const input = el.querySelector('#lv-name');
    el.querySelector('form').onsubmit = e => {
      e.preventDefault();
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!name) { el.querySelector('.lv-err').textContent = '請先輸入名字喔！'; input.focus(); return; }
      setCurrent(o.gameId, name);
      o.onStart(name);
    };
    el.querySelectorAll('.lv-player').forEach(b => b.onclick = () => { setCurrent(o.gameId, b.dataset.name); o.onStart(b.dataset.name); });
    el.querySelector('[data-act="board"]').onclick = o.onBoard;
  }

  /**
   * 關卡地圖
   * o.gameId, o.name, o.title, o.base, o.levels:[{ title, desc }], o.onPick(index), o.onSwitch(), o.onBoard()
   */
  function renderMap(el, o) {
    const p = getPlayer(o.gameId, o.name);
    const cards = o.levels.map((lv, i) => {
      const no = i + 1, m = monster(i, o.base);
      const locked = no > p.unlocked;
      const s = p.stars[no] || 0;
      return `<button class="lv-card${locked ? ' locked' : ''}${no === o.levels.length ? ' boss' : ''}${no === p.lastLevel ? ' last' : ''}" data-i="${i}" ${locked ? 'disabled' : ''}>
        <span class="lv-no">第 ${no} 關${no === o.levels.length ? '・魔王' : ''}${no === p.lastLevel ? '・上次' : ''}</span>
        <span class="lv-mon" data-img="${m.img.idle}">${locked ? '🔒' : m.emoji}</span>
        <span class="lv-title">${lv.title}</span>
        <span class="lv-desc">${lv.desc || ''}</span>
        <span class="lv-stars">${locked ? '' : '⭐'.repeat(s) + `<i>${'⭐'.repeat(3 - s)}</i>`}</span>
      </button>`;
    }).join('');
    el.innerHTML = `
      <div class="lv">
        <div class="lv-bar">
          <button class="lv-link" data-act="switch">← 換人</button>
          <button class="lv-link" data-act="board">🏆 排行榜</button>
        </div>
        <h1>${o.title}</h1>
        <div class="lv-who">🧒 <b>${esc(p.name)}</b>　${lastText(p)}</div>
        <div class="lv-grid">${cards}</div>
        <button class="lv-unlock" data-act="unlock">家長：幫 ${esc(p.name)} 解鎖全部關卡</button>
      </div>`;
    // 有放怪獸圖就換上
    el.querySelectorAll('.lv-card:not(.locked) .lv-mon').forEach(s => {
      const im = new Image();
      im.onload = () => { s.innerHTML = `<img src="${s.dataset.img}" alt="">`; };
      im.src = s.dataset.img;
    });
    el.onclick = e => {
      const card = e.target.closest('.lv-card');
      if (card && !card.disabled) return o.onPick(+card.dataset.i);
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'switch') o.onSwitch();
      else if (act === 'board') o.onBoard();
      else if (act === 'unlock' && confirm(`要幫 ${p.name} 解鎖全部 ${o.levels.length} 關嗎？`)) {
        const pp = getPlayer(o.gameId, o.name); pp.unlocked = o.levels.length; savePlayer(o.gameId, pp);
        renderMap(el, o);
      }
    };
  }

  /** 排行榜頁：o.gameId, o.title, o.name（要標出來的人）, o.onBack() */
  function renderBoard(el, o) {
    el.innerHTML = `
      <div class="lv">
        <div class="lv-bar"><button class="lv-link" data-act="back">← 返回</button></div>
        <h1>🏆 排行榜</h1>
        <p class="lv-sub">${o.title}・先比過到第幾關，再比星星和總分</p>
        ${boardHtml(o.gameId, o.name)}
        <p class="lv-note">紀錄存在這台裝置上。總分＝每題答對 10 分＋暴擊 5 分＋過關時剩下的血量。</p>
      </div>`;
    el.querySelector('[data-act="back"]').onclick = o.onBack;
  }

  window.Levels = { MONSTERS, TIMING, monster, player, current, setCurrent, getPlayer, recordResult, ranking, boardHtml,
                    renderStart, renderMap, renderBoard, totalStars };
})();
