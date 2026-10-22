# ☁️ Firebase 設定步驟（答錯清單存到雲端）

做完這 6 步，孩子在平板上答錯的題目就會存到你的 Firebase，在任何裝置登入同一個 Google 帳號，打開「家長專區」都看得到。
**全部免費**（Firebase 免費方案 Spark 就夠用，不需要綁信用卡）。

> 專案：`cb-working-base`
> 主控台：https://console.firebase.google.com/

## ✅ 目前進度（2026-10-22，由 Claude 透過 Firebase MCP 完成）
| 步驟 | 狀態 |
|---|---|
| 1. 開啟 Google 登入 | ✅ 已完成（`firebase.json` 的 auth 設定，已部署） |
| 2. 授權網域 `localhost`、`youlun1214.github.io` | ✅ 家長已在主控台手動加好（工具做不到這步） |
| 3. 建立資料庫 | ✅ 原本就有（同專案的「即時文字雲」在用） |
| 4. 安全規則 | ✅ 已部署（`firestore.rules`：保留文字雲規則，再加上答錯清單規則）；已測試沒登入讀不到 |
| 5. 網頁應用程式 `grade1-games` | ✅ 已建立，設定碼已放進 `shared/firebase-config.js` |
| 6. 登入 | ✅ 電腦上已登入成功、答錯紀錄已確認存進雲端；⬜ 平板還要按「☁️ 家長登入」一次 |

> ⚠️ 這個 Firebase 專案和「即時文字雲」共用。**安全規則部署時是整份覆蓋**，以後改 `firestore.rules` 一定要保留文字雲那一段。

---

## 1. 開啟 Google 登入
1. 進入專案 `cb-working-base`
2. 左邊選單 **建構（Build）→ Authentication** → 按「開始使用」
3. 上方分頁 **Sign-in method（登入方式）** → 選 **Google** → 打開「啟用」
4. 「專案支援電子郵件」選你的 Gmail → **儲存**

## 2. 允許遊戲網站使用登入
1. 一樣在 **Authentication** → 上方分頁 **設定（Settings）** → **授權網域（Authorized domains）**
2. 按「新增網域」，加入：`youlun1214.github.io`
3. 確認清單裡已經有 `localhost`（電腦上測試用，預設就有）

## 3. 建立資料庫
1. 左邊選單 **建構 → Firestore Database** → 按「建立資料庫」
2. 位置選 **asia-east1（台灣）**（選了就不能改）
3. 安全規則選 **「以正式版模式啟動」**（先全部鎖住，下一步再開放給你自己）

## 4. 貼上安全規則
1. **Firestore Database → 上方分頁「規則」**
2. 把裡面的內容全部換成下面這段（也存在專案根目錄的 `firestore.rules`），按 **發布**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

意思是：**只有登入的本人，才能讀寫自己帳號底下的資料**。網站是公開的，別人就算打開遊戲也看不到、改不到你的紀錄。

## 5. 新增網頁應用程式，拿到設定碼
1. 左上角 ⚙️ → **專案設定** → 「一般」分頁往下拉到 **你的應用程式**
2. 按 **`</>`（網頁）** 圖示 → 應用程式暱稱填 `grade1-games` → **不用**勾 Firebase Hosting → 註冊應用程式
3. 畫面會出現一段 `const firebaseConfig = { apiKey: "...", authDomain: "...", ... };`
4. **把這一段整個複製貼給 Claude**（或自己貼到 `shared/firebase-config.js`，把 `null` 換掉）

> 這段設定碼本來就是放在網頁上給瀏覽器用的，公開沒關係；真正保護資料的是第 4 步的安全規則。

## 6. 在平板上登入
1. 平板打開遊戲 → 輸入名字的畫面，按 **「☁️ 家長登入」** → 選你的 Google 帳號
2. 之後平板會記住登入狀態，孩子正常玩就好
3. 登入前存在平板上的答錯紀錄，登入後會**自動上傳**

---

## 怎麼看答錯清單
- 遊戲首頁最下面 **「👨‍👩‍👦 家長專區（答錯清單）」**，或直接開 `https://youlun1214.github.io/grade1-games/parent/`
- 可以切換「注音／數學」、選玩家，看到：題目、正確答案、孩子選了什麼、錯幾次、最近什麼時候錯
- 上方有「哪種題型最常錯」的統計
- 可以手動按「✓ 已學會」或「刪除」

## 錯題複習
- 關卡地圖上的 **「📝 錯題複習」**：只出這位玩家答錯過、還沒學會的題目
- 同一題**連續答對 2 次**就自動標成已學會

## 資料存在哪裡
```
users/{家長的帳號 ID}/mistakes/{遊戲~玩家~題目}
  game, player, level, type    哪個遊戲、哪位玩家、第幾關、題型
  q                            題目內容（可以重新出同一題）
  chosen / chosenText          孩子選了什麼
  count                        錯了幾次
  streak / resolved            複習連續答對幾次／是否已學會
  lastWrong                    最近一次答錯的時間
```
玩家名字建議用暱稱，不要用全名。
