// 連線對戰：和同學在不同的家，用 4 位數房號連線，同一題比賽（兩位奧特曼互打）
// 資料放在 Firebase Firestore 的 rooms/{房號}（安全規則見 firestore.rules）；小朋友用匿名登入，不用帳號
// 房間裡只有暱稱、角色和每題的對錯；離開時房主會刪掉房間
//
// 規則：兩台用同一個亂數種子出題，所以題目一模一樣；答對打對方（越快越痛，暴擊、必殺技照舊），答錯不扣自己的血
//       兩個人都答完（或 15 秒到）才一起換下一題；先把對方打到 0 血的人贏，10 題打完比剩下的血量
//
// 用法（遊戲頁面）：Online.open({ root, base, gameId, levels, name, code, bank(L, last), renderQuestion, speech, answerText, moves, onWrong(L, q, chosen, text), onExit })
//       首頁輸入房號：Online.joinFromHome(el, base)
(function () {
  const ROUNDS = 10, TIME_LIMIT = 15, MAX_HP = 100, OFFLINE_SEC = 30, PING_SEC = 8;
  const EMOTES = ['👍', '😄', '😮', '💪', '😭', '🎉'];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const zy = el => { if (window.Zhuyin && el) Zhuyin.apply(el); };
  const say = t => window.Sound && Sound.say(t);
  const sum = obj => Object.values(obj || {}).reduce((n, a) => n + (a.p || 0), 0);
  const heroOf = name => (window.Levels ? Levels.heroOf(name) : { id: 'classic', name: '經典奧特曼' });

  // 同樣的種子 → 同樣的亂數 → 兩台出一模一樣的題目（出題時暫時換掉 Math.random）
  function seeded(seed, fn) {
    const orig = Math.random;
    let s = seed >>> 0;
    Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { return fn(); } finally { Math.random = orig; }
  }

  // ===== Firebase =====
  async function fire() {
    for (let i = 0; i < 100 && !window.Cloud; i++) await new Promise(r => setTimeout(r, 100));
    if (!window.Cloud) throw new Error('連不上網路');
    const user = await Cloud.ensureUser();
    const fb = Cloud.raw();
    return { fb, F: fb.F, uid: user.uid, ref: code => fb.F.doc(fb.db, 'rooms', code) };
  }
  async function lookup(code) {
    const { F, ref } = await fire();
    const snap = await F.getDoc(ref(code));
    return snap.exists() ? snap.data() : null;
  }

  let S = null;   // 這一次連線的狀態

  function open(o) {
    close();
    S = { o, code: null, role: null, room: null, unsub: null, timers: [], battle: null, n: 0, err: '' };
    if (!o.root.dataset.olBound) { o.root.addEventListener('click', e => onClick(e)); o.root.dataset.olBound = '1'; }   // 只綁一次
    if (o.code) joinCode(o.code); else menu();
  }

  // ===== 畫面 =====
  function frame(title, body) {
    S.o.root.innerHTML = `
      <div class="lv ol bg-space">
        <div class="lv-bar">
          <button class="ui-round" data-ol="back" aria-label="返回">←</button>
          <div class="lv-ribbon">${title}</div>
          <span class="lv-bar-r"><button class="ui-round" data-music-toggle aria-label="背景音樂">🎵</button></span>
        </div>
        ${body}
        <p class="ol-err no-zy">${esc(S.err || '')}</p>
      </div>`;
    S.err = '';
    zy(S.o.root.querySelector('.lv-ribbon'));
    S.o.root.querySelectorAll('.ol-zy').forEach(zy);
    S.o.root.onclick = null;   // 清掉上一場戰鬥的按鈕處理
  }

  function menu() {
    S.screen = 'menu';
    frame('連線對戰', `
      <p class="ol-tip ol-zy">和同學用房號連線，同一題比賽！</p>
      <div class="ol-me">${heroImg(heroOf(S.o.name))}<b class="no-zy">${esc(S.o.name)}</b></div>
      <button class="btn btn-gold ol-big ol-zy" data-ol="host">🏠 開房間</button>
      <button class="btn btn-blue ol-big ol-zy" data-ol="join">🔑 加入房間</button>`);
    window.Music && Music.play('title');
  }

  function pickLevel() {
    S.screen = 'level';
    frame('選關卡', `
      <p class="ol-tip ol-zy">兩個人會比同一關的題目</p>
      <div class="ol-levels">${S.o.levels.map((l, i) => `<button class="ol-level" data-ol="lv" data-i="${i + 1}"><small>第 ${i + 1} 關</small><span class="ol-zy">${esc(l.title)}</span></button>`).join('')}</div>`);
  }

  function keypad() {
    S.screen = 'pad'; S.typed = '';
    frame('加入房間', `
      <p class="ol-tip ol-zy">輸入同學給你的房號</p>
      <div class="ol-digits">${'<b></b>'.repeat(4)}</div>
      <div class="ol-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-ol="key" data-k="${n}">${n}</button>`).join('')}
        <button data-ol="del" aria-label="刪掉">⌫</button><button data-ol="key" data-k="0">0</button><button class="go ol-zy" data-ol="ok">加入</button></div>`);
  }
  function drawTyped() {
    S.o.root.querySelectorAll('.ol-digits b').forEach((b, i) => { b.textContent = S.typed[i] || ''; });
  }

  // 等待室：房號、兩位玩家
  function lobby() {
    S.screen = 'lobby';
    const r = S.room, host = S.role === 'host';
    const card = (p, label) => p ? `<div class="ol-card">${heroImg(Levels.HEROES.find(h => h.id === p.hero) || heroOf(p.name))}<b class="no-zy">${esc(p.name)}</b><small class="ol-zy">${label}</small></div>`
                                 : `<div class="ol-card empty"><span class="ol-dots">…</span><small class="ol-zy">等同學加入</small></div>`;
    frame('連線對戰', `
      <div class="ol-codebox"><small class="ol-zy">房號</small><div class="ol-code">${[...S.code].map(c => `<b>${c}</b>`).join('')}</div>
        <small class="ol-zy">${host ? '把房號告訴同學' : '已經加入房間了'}</small></div>
      <p class="ol-tip ol-zy">第 ${r.level} 關・${esc(S.o.levels[r.level - 1].title)}</p>
      <div class="ol-vs">${card(host ? { name: S.o.name, hero: heroOf(S.o.name).id } : r.host, '房主')}<em>VS</em>${card(host ? r.guest : { name: S.o.name, hero: heroOf(S.o.name).id }, '同學')}</div>
      ${host ? `<button class="btn btn-gold ol-big ol-zy" data-ol="start" ${r.guest ? '' : 'disabled'}>開始對戰 ▶</button>` : '<p class="ol-tip ol-zy">等房主按開始…</p>'}
      ${emoteBar()}`);
  }

  function heroImg(h) { return `<img class="ol-hero" src="${S.o.base}assets/heroes/${h.id}/player-pose.png" alt="" draggable="false">`; }
  function emoteBar() { return `<div class="ol-emotes">${EMOTES.map(e => `<button data-ol="em" data-e="${e}">${e}</button>`).join('')}</div>`; }

  // ===== 開房間、加入 =====
  async function createRoom(level) {
    try {
      const { F, uid, ref } = await fire();
      const me = { uid, name: S.o.name.slice(0, 20), hero: heroOf(S.o.name).id };
      for (let tries = 0; tries < 8; tries++) {
        const code = String(1000 + Math.floor(Math.random() * 9000));
        try {
          await F.setDoc(ref(code), { game: S.o.gameId, level, seed: 0, state: 'wait', n: 0, updated: F.serverTimestamp(),
                                      host: me, guest: null, ah: {}, ag: {}, ph: 0, pg: 0, em: null });
          S.code = code; S.role = 'host';
          return listen();
        } catch (e) { if (!/permission/i.test(e.code || e.message || '')) throw e; }   // 房號被別人用了 → 換一個
      }
      throw new Error('房間太多了，請再試一次');
    } catch (e) { S.err = '開房間失敗：' + (e.message || e); menu(); }
  }

  async function joinCode(code) {
    try {
      const { F, uid, ref } = await fire();
      const r = await lookup(code);
      if (!r) { S.err = `找不到 ${code} 這個房間，請再確認一次房號`; return keypad(); }
      if (r.game !== S.o.gameId) { location.href = `${S.o.base}tools/${r.game}/?room=${code}`; return; }   // 是別的遊戲的房間：換到那個遊戲
      if (r.host.uid === uid) { S.code = code; S.role = 'host'; return listen(); }
      if (r.guest && r.guest.uid !== uid) { S.err = '這個房間已經有兩個人了'; return keypad(); }
      if (!r.guest) await F.updateDoc(ref(code), { guest: { uid, name: S.o.name.slice(0, 20), hero: heroOf(S.o.name).id }, updated: F.serverTimestamp() });
      S.code = code; S.role = 'guest';
      listen();
    } catch (e) { S.err = '加入失敗：' + (e.message || e); keypad(); }
  }

  // ===== 即時同步 =====
  async function listen() {
    const { F, ref, uid } = await fire();
    S.uid = uid;
    S.side = S.role === 'host' ? 'ah' : 'ag'; S.oside = S.role === 'host' ? 'ag' : 'ah';
    S.pingKey = S.role === 'host' ? 'ph' : 'pg'; S.opingKey = S.role === 'host' ? 'pg' : 'ph';
    S.ping = 0; S.lastOppPing = null; S.lastOppSeen = Date.now();
    S.unsub = F.onSnapshot(ref(S.code), snap => onRoom(snap.exists() ? snap.data() : null), e => { S.err = '連線中斷了：' + e.message; });
    // 每幾秒報一次「我還在」；對方太久沒報就當成斷線
    S.timers.push(setInterval(() => {
      if (!S || !S.code) return;
      write({ [S.pingKey]: ++S.ping });
      const playing = S.battle && !S.ended;
      if ((playing || S.screen === 'lobby') && Date.now() - S.lastOppSeen > OFFLINE_SEC * 1000 && otherPlayer()) {
        if (playing) endMatch('win', '同學好像斷線了');
      }
    }, PING_SEC * 1000));
  }
  async function write(data) {
    try { const { F, ref } = await fire(); await F.updateDoc(ref(S.code), Object.assign({ updated: F.serverTimestamp() }, data)); } catch (e) {}
  }
  const otherPlayer = () => S.room && (S.role === 'host' ? S.room.guest : S.room.host);

  function onRoom(r) {
    if (!S) return;
    if (!r) {   // 房主刪掉房間
      if (S.role === 'guest') { const playing = S.battle && !S.ended; cleanup(); S.code = null; if (playing) { S.battle.end('win', overHtml('win', '房主離開了')); S.battle = null; return; } S.err = '房主離開了'; return menu(); }
      return;
    }
    const before = S.room;
    S.room = r;
    // 對方的「我還在」有更新
    const op = r[S.opingKey];
    if (op !== S.lastOppPing) { S.lastOppPing = op; S.lastOppSeen = Date.now(); }
    // 表情
    if (r.em && r.em.by !== S.uid && (!before || !before.em || before.em.t !== r.em.t)) showEmote(r.em.e);
    // 有人加入、離開
    if (S.role === 'host' && before && !before.guest && r.guest) { say(`${r.guest.name}來了！`); S.lastOppSeen = Date.now(); }
    if (S.role === 'host' && before && before.guest && !r.guest) {
      if (S.battle && !S.ended) { endMatch('win', '同學離開了'); }
      else if (S.screen !== 'lobby') { S.battle = null; }
    }
    // 開始（或再來一場）
    if (r.state === 'play' && r.n !== S.n) return startMatch(r);
    if (S.battle && !S.ended) return applyAnswers();
    if (!S.battle && S.screen !== 'pad') lobby();
  }

  // ===== 對戰 =====
  function startMatch(r) {
    S.n = r.n; S.ended = false; S.applied = {}; S.mine = {}; S.pending = null;
    S.lastOppSeen = Date.now();
    const o = S.o, opp = S.role === 'host' ? r.guest : r.host;
    const oh = Levels.HEROES.find(h => h.id === opp.hero) || Levels.HEROES[0];
    const p = n => `${o.base}assets/heroes/${oh.id}/${n}.png`;
    let qi = 0;
    S.oppName = opp.name;
    S.screen = 'battle';
    S.battle = Battle.start({
      root: o.root,
      level: { no: r.level, title: o.levels[r.level - 1].title, label: '連線對戰',
               monster: { name: opp.name, emoji: '🦸', moves: ['光線', '飛踢', '光之拳', '旋風腳'], img: { idle: p('player'), hurt: p('player-hurt'), down: p('player-hurt') } },
               rules: { firstAttackAt: 1e9, monsterHp: MAX_HP, playerHp: MAX_HP } },
      player: Levels.player(o.base, o.moves, o.name, r.level),
      story: false,
      nextQuestion: last => seeded(r.seed + (++qi) * 7919, () => o.bank(r.level, last)),
      renderQuestion: o.renderQuestion, speech: o.speech, answerText: o.answerText,
      background: Levels.scene(r.level - 1, o.base),
      exitLabel: '離開',
      onWrong: (q, chosen, text) => o.onWrong && o.onWrong(r.level, q, chosen, text),
      onExit: leave,
      versus: {
        timeLimit: TIME_LIMIT,
        hud: '<button class="ui-round" data-ol="emote" aria-label="表情">😀</button>',
        onAnswer: (round, a) => { a = JSON.parse(JSON.stringify(a)); S.mine[round] = a; write({ [`${S.side}.${round}`]: a }); },   // Firestore 不收 undefined
        waitNext: go => { S.pending = go; check(); },
      },
    });
    applyAnswers();
  }

  // 對方答對 → 打過來；兩個人都答完 → 下一題或分勝負
  function applyAnswers() {
    const opp = (S.room && S.room[S.oside]) || {};
    Object.keys(opp).sort((a, b) => a - b).forEach(k => {
      if (S.applied[k]) return;
      S.applied[k] = true;
      const a = opp[k];
      if (a.ok) S.battle.hit(a.p, a.s ? `${S.oppName} 使出必殺技！` : `${S.oppName} ${a.c ? '暴擊！' : '答對了！'}`);
    });
    check();
  }
  function check() {
    if (!S || !S.battle || S.ended || !S.pending) return;
    const round = Math.max(0, ...Object.keys(S.mine).map(Number));
    const opp = (S.room && S.room[S.oside]) || {};
    if (!opp[round]) {
      const logEl = S.o.root.querySelector('.bt-log');
      if (logEl) { logEl.textContent = `等 ${S.oppName} 回答…`; logEl.className = 'bt-log'; }
      return;
    }
    // 兩台用一樣的紀錄算血量，結果一定一樣
    const myHp = MAX_HP - sum(opp), oppHp = MAX_HP - sum(S.mine);
    if (myHp <= 0 || oppHp <= 0 || round >= ROUNDS) {
      S.pending = null;
      const kind = myHp > oppHp ? 'win' : myHp < oppHp ? 'lose' : 'tie';
      return setTimeout(() => endMatch(kind), 900);
    }
    const go = S.pending; S.pending = null; go();
  }

  function overHtml(kind, note) {
    const right = Object.values(S.mine || {}).filter(a => a.ok).length;
    const title = { win: '你贏了！', lose: '差一點點！', tie: '平手！' }[kind];
    return `
      <div class="bt-over-hero"><img src="${S.o.base}assets/heroes/${heroOf(S.o.name).id}/player-${kind === 'lose' ? 'hurt' : 'win'}.png" alt=""></div>
      <div class="logo-text ${kind === 'lose' ? 'purple ' : ''}bt-over-title">${title}</div>
      <p>${note ? esc(note) + '。' : ''}答對 ${right} 題</p>
      <div class="bt-over-btns">${S.role === 'host' && !note ? '<button class="btn btn-gold" data-ol="rematch">再來一場 ▶</button>' : note ? '' : '<p class="ol-wait">等房主按「再來一場」…</p>'}</div>
      ${note ? '' : emoteBar()}`;
  }
  function endMatch(kind, note) {
    if (!S || !S.battle || S.ended) return;
    S.ended = true;
    S.battle.end(kind, overHtml(kind, note));
    say({ win: `你贏了！`, lose: '差一點點，再來一場！', tie: '平手！' }[kind]);
  }

  // ===== 按鈕 =====
  function onClick(e) {
    const b = e.target.closest('[data-ol]');
    if (!b || !S) return;
    const act = b.dataset.ol;
    if (act === 'back') return S.screen === 'menu' ? leave() : (S.code ? leave() : menu());
    if (act === 'host') return pickLevel();
    if (act === 'join') return keypad();
    if (act === 'lv') { b.disabled = true; return createRoom(+b.dataset.i); }
    if (act === 'key' && S.typed.length < 4) { S.typed += b.dataset.k; drawTyped(); if (window.Sound) Sound.beep([660], .05); return; }
    if (act === 'del') { S.typed = S.typed.slice(0, -1); return drawTyped(); }
    if (act === 'ok') { if (S.typed.length === 4) { b.disabled = true; joinCode(S.typed); } else { S.err = '房號是 4 個數字'; keypad(); } return; }
    if (act === 'start' && S.room && S.room.guest) return write({ state: 'play', seed: Math.floor(Math.random() * 1e9), n: (S.room.n || 0) + 1, ah: {}, ag: {} });
    if (act === 'rematch') return write({ state: 'play', seed: Math.floor(Math.random() * 1e9), n: (S.room.n || 0) + 1, ah: {}, ag: {} });
    if (act === 'em') { write({ em: { by: S.uid, e: b.dataset.e, t: Date.now() } }); showEmote(b.dataset.e, true); return closePicker(); }
    if (act === 'emote') return togglePicker();
  }

  // 表情：自己按的顯示在下面，同學的顯示在上面
  function showEmote(e, mine) {
    const d = document.createElement('div');
    d.className = 'ol-bubble' + (mine ? ' mine' : '');
    d.innerHTML = `${mine ? '' : `<small class="no-zy">${esc(S.oppName || (otherPlayer() || {}).name || '')}</small>`}<span>${e}</span>`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 2200);
    if (!mine && window.Sound) Sound.beep([880, 1175], .08);
  }
  function togglePicker() {
    if (closePicker()) return;
    const d = document.createElement('div');
    d.className = 'ol-picker';
    d.innerHTML = EMOTES.map(e => `<button data-ol="em" data-e="${e}">${e}</button>`).join('');
    d.onclick = onClick;
    document.body.appendChild(d);
  }
  function closePicker() { const p = document.querySelector('.ol-picker'); if (p) { p.remove(); return true; } return false; }

  // ===== 離開 =====
  function cleanup() {
    if (!S) return;
    S.timers.forEach(clearInterval); S.timers = [];
    if (S.unsub) S.unsub(); S.unsub = null;
    closePicker();
  }
  async function leave() {
    if (!S) return;
    const { code, role, o, battle, ended } = S;
    cleanup();
    S = null;   // 先清掉，battle.quit() 會再呼叫 leave()，這時就直接結束
    if (battle && !ended) try { battle.quit(); } catch (e) {}
    if (code) {
      try {
        const { F, ref } = await fire();
        if (role === 'host') await F.deleteDoc(ref(code));
        else await F.updateDoc(ref(code), { guest: null, ag: {}, updated: F.serverTimestamp() });
      } catch (e) {}
    }
    o.onExit && o.onExit();
  }
  function close() { if (S) { cleanup(); S = null; } }
  // 關掉網頁時盡量通知（可能來不及）
  window.addEventListener('pagehide', () => { if (S && S.code) leave(); });

  // ===== 首頁：輸入房號，自動換到那個遊戲 =====
  function joinFromHome(el, base) {
    let typed = '';
    const draw = msg => {
      el.innerHTML = `<div class="ol-home">
        <p class="ol-tip ol-zy">輸入同學給你的房號</p>
        <div class="ol-digits">${[0, 1, 2, 3].map(i => `<b>${typed[i] || ''}</b>`).join('')}</div>
        <div class="ol-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
          <button data-k="del" aria-label="刪掉">⌫</button><button data-k="0">0</button><button class="go ol-zy" data-k="ok">加入</button></div>
        <p class="ol-err no-zy">${esc(msg || '')}</p></div>`;
      el.querySelectorAll('.ol-zy').forEach(zy);
    };
    draw();
    el.onclick = async e => {
      const k = e.target.closest('[data-k]')?.dataset.k;
      if (!k) return;
      if (k === 'del') typed = typed.slice(0, -1);
      else if (k === 'ok') {
        if (typed.length !== 4) return draw('房號是 4 個數字');
        draw('找房間中…');
        try { const r = await lookup(typed); if (!r) return draw(`找不到 ${typed} 這個房間`); location.href = `${base}tools/${r.game}/?room=${typed}`; }
        catch (err) { draw('連不上網路：' + (err.message || err)); }
        return;
      } else if (typed.length < 4) typed += k;
      draw();
    };
  }

  window.Online = { open, joinFromHome, seeded };
})();
