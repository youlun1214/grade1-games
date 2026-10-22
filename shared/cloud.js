// 雲端答錯紀錄（Firebase）：家長用 Google 帳號登入後，答錯的題目會存到 Firestore，任何裝置都能在「家長專區」查看
// 還沒設定 Firebase 或還沒登入時，紀錄先存在這台裝置（localStorage），登入後自動上傳
// 資料位置：users/{家長的 uid}/mistakes/{遊戲~玩家~題目}，安全規則只讓本人讀寫（見 docs/firebase-setup.md）
// 用法（其他程式透過 window.Cloud 呼叫）：Cloud.recordMistake()、Cloud.recordReviewCorrect()、Cloud.list()、Cloud.signIn()
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const QUEUE_KEY = 'grade1-games:mistake-queue';
const REVIEW_PASS = 2;   // 錯題複習：同一題連續答對幾次算學會

const listeners = new Set();
const state = { ready: false, configured: !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey), user: null, error: '' };
let fb = null;   // 載入後的 Firebase 函式

// 圖示網址存成 {{BASE}}，在 localhost 或正式網站都能正確顯示
const BASE = location.href.replace(/(tools\/[^/]+\/|parent\/)?[^/]*$/, '');
const pack = obj => JSON.parse(JSON.stringify(obj).split(BASE).join('{{BASE}}'));
const unpack = obj => JSON.parse(JSON.stringify(obj).split('{{BASE}}').join(BASE));
const docId = (game, player, item) => encodeURIComponent(`${game}~${player}~${item}`).replace(/\./g, '%2E');

function readQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch (e) { return []; } }
function writeQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }
function emit() { listeners.forEach(cb => { try { cb(state); } catch (e) {} }); }

async function init() {
  if (!state.configured) { state.ready = true; emit(); return; }
  try {
    const [app, auth, fs] = await Promise.all([
      import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
    ]);
    const a = app.initializeApp(window.FIREBASE_CONFIG);
    fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
    auth.onAuthStateChanged(fb.auth, async user => {
      state.user = user ? { uid: user.uid, email: user.email, name: user.displayName } : null;
      state.ready = true;
      if (user) await flushQueue();
      emit();
    });
    // iPad 有時候會用「跳轉」的方式登入，回來時要接住結果
    auth.getRedirectResult(fb.auth).catch(() => {});
  } catch (e) {
    state.error = '連不上 Firebase：' + (e.message || e);
    state.ready = true; emit();
  }
}

async function signIn() {
  if (!fb) { alert(state.configured ? '還在連線中，請稍等一下再試。' : 'Firebase 還沒設定好（請看 docs/firebase-setup.md）。'); return; }
  const provider = new fb.A.GoogleAuthProvider();
  try { await fb.A.signInWithPopup(fb.auth, provider); }
  catch (e) {
    if (/popup/i.test(e.code || '')) await fb.A.signInWithRedirect(fb.auth, provider);   // 跳出視窗被擋住時，改用跳轉
    else alert('登入失敗：' + (e.message || e));
  }
}
async function signOut() { if (fb) await fb.A.signOut(fb.auth); }

function col() { return fb.F.collection(fb.db, 'users', state.user.uid, 'mistakes'); }
function ref(id) { return fb.F.doc(fb.db, 'users', state.user.uid, 'mistakes', id); }

// 答錯一題：同一題錯很多次會累加次數
async function recordMistake(rec) {
  const item = { ...rec, q: pack(rec.q), at: Date.now() };
  if (!fb || !state.user) { const q = readQueue(); q.push(item); writeQueue(q.slice(-500)); return; }
  await saveMistake(item);
}
async function saveMistake(item) {
  const { F } = fb;
  await F.setDoc(ref(docId(item.game, item.player, item.itemKey)), {
    game: item.game, player: item.player, itemKey: item.itemKey, level: item.level, type: item.type,
    q: item.q, chosen: item.chosen, chosenText: item.chosenText || '',
    count: F.increment(1), streak: 0, resolved: false, lastWrong: item.at,
  }, { merge: true });
}
// 還沒登入時存在這台裝置的紀錄，登入後一次上傳
async function flushQueue() {
  const q = readQueue(); if (!q.length) return;
  for (const item of q) { try { await saveMistake(item); } catch (e) { return; } }
  writeQueue([]);
}

// 錯題複習答對：連續答對 2 次就算學會
async function recordReviewCorrect(m) {
  if (!fb || !state.user) return;
  const streak = (m.streak || 0) + 1;
  await fb.F.updateDoc(ref(m.id), { streak, resolved: streak >= REVIEW_PASS, lastReview: Date.now() });
  m.streak = streak;
}
async function recordReviewWrong(m, chosen, chosenText) {
  if (!fb || !state.user) return;
  await fb.F.updateDoc(ref(m.id), { streak: 0, count: fb.F.increment(1), lastWrong: Date.now(), chosen, chosenText: chosenText || '' });
  m.streak = 0;
}

// 列出答錯的題目（可以只看某個遊戲、某位玩家）
async function list({ game, player, includeResolved = true } = {}) {
  if (!fb || !state.user) {
    // 沒登入時，只能看這台裝置上還沒上傳的紀錄
    const map = {};
    readQueue().filter(m => (!game || m.game === game) && (!player || m.player === player)).forEach(m => {
      const id = docId(m.game, m.player, m.itemKey);
      map[id] = Object.assign(map[id] || { count: 0, streak: 0, resolved: false }, m, { id, count: ((map[id] && map[id].count) || 0) + 1, lastWrong: m.at });
    });
    return Object.values(map).map(unpack).filter(m => includeResolved || !m.resolved).sort((a, b) => b.count - a.count);
  }
  const conds = [];
  if (game) conds.push(fb.F.where('game', '==', game));
  if (player) conds.push(fb.F.where('player', '==', player));
  const snap = await fb.F.getDocs(fb.F.query(col(), ...conds));
  return snap.docs.map(d => unpack({ id: d.id, ...d.data() }))
    .filter(m => includeResolved || !m.resolved)
    .sort((a, b) => (a.resolved - b.resolved) || (b.count - a.count) || (b.lastWrong - a.lastWrong));
}
async function setResolved(id, resolved) { if (fb && state.user) await fb.F.updateDoc(ref(id), { resolved, streak: resolved ? REVIEW_PASS : 0 }); }
async function remove(id) { if (fb && state.user) await fb.F.deleteDoc(ref(id)); }

window.Cloud = {
  state, signIn, signOut, recordMistake, recordReviewCorrect, recordReviewWrong, list, setResolved, remove,
  pending: () => readQueue().length, REVIEW_PASS,
  onChange(cb) { listeners.add(cb); if (state.ready) cb(state); return () => listeners.delete(cb); },
};
init();
