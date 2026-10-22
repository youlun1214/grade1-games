# 🎨 圖片庫（assets）

所有遊戲共用的圖片都放這裡。這個資料夾會推上 GitHub（公開），**不要放真人照片**。
**檔名照下面的表放進去，遊戲就會自動換上**；還沒放的圖會用 emoji 暫代。

## 請 AI 畫圖
把 [`docs/art-brief-for-gpt.md`](../docs/art-brief-for-gpt.md) 上傳給 ChatGPT，它就知道遊戲畫面、風格、尺寸和每隻怪獸要畫什麼。
下載後照下面的檔名改名放進來，再跟 Claude 說「圖放好了」，Claude 會幫你檢查透明背景、方向和檔案大小（太大會幫你壓縮）。

### 如果 ChatGPT 給的是「全部畫在一張」的素材總圖
把總圖放進 `assets/_source/`（這個資料夾不會上傳 GitHub），跟 Claude 說要裁切。
- `assets/_source/cut.py`：從怪獸素材總圖裁出 33 張怪獸圖並去背
- `assets/_source/cut_ui.py`：從設計總覽圖裁出 10 張場景，從英雄動作圖裁出 12 個動作

## 檔名清單

### 🐲 怪獸（`monsters/`）：10 隻，每隻 3 張
奧特曼經典怪獸，數學和注音遊戲共用同一組，第 1 關用 `monster-01`、第 10 關（魔王）用 `monster-10`。

| 關卡 | 怪獸（暫代 emoji） | 平常 | 被打到 | 被打倒 |
|---|---|---|---|---|
| 1 | 卡內貢 👛 | `monster-01.png` | `monster-01-hurt.png` | `monster-01-down.png` |
| 2 | 巴爾坦星人 🦞 | `monster-02.png` | `monster-02-hurt.png` | `monster-02-down.png` |
| 3 | 艾雷王 ⚡ | `monster-03.png` | `monster-03-hurt.png` | `monster-03-down.png` |
| 4 | 雷德王 🦖 | `monster-04.png` | `monster-04-hurt.png` | `monster-04-down.png` |
| 5 | 哥莫拉 🦏 | `monster-05.png` | `monster-05-hurt.png` | `monster-05-down.png` |
| 6 | 貝蒙斯坦 🦅 | `monster-06.png` | `monster-06-hurt.png` | `monster-06-down.png` |
| 7 | 梅菲拉斯星人 👽 | `monster-07.png` | `monster-07-hurt.png` | `monster-07-down.png` |
| 8 | 金古橋 🤖 | `monster-08.png` | `monster-08-hurt.png` | `monster-08-down.png` |
| 9 | 傑頓 👾 | `monster-09.png` | `monster-09-hurt.png` | `monster-09-down.png` |
| 10 | 貝利亞（魔王） 😈 | `monster-10.png` | `monster-10-hurt.png` | `monster-10-down.png` |

怪獸的名字和招式寫在 `shared/levels.js` 的 `MONSTERS`，想改名字（例如照 AI 畫出來的樣子取名）改那裡就好。
畫圖時怪獸請**面向左邊**（看著玩家）；Q 版奧特曼特攝風，越後面的關卡越大、越威風，但兇得可愛、不可怕。

### 🧒 玩家（`player/`）：小小英雄 12 式動作
從 `_source/小小英雄十二式動作貼圖.png` 裁出來，全部同一個比例、腳底貼齊。

| 檔名 | 動作 | 遊戲裡用在 |
|---|---|---|
| `player.png` | 握拳站好 | 戰鬥中平常狀態 |
| `player-pose.png` | 伸手擺姿勢 | 首頁、開始畫面、故事對話 |
| `player-attack.png`、`player-kick.png`、`player-fire.png`、`player-fire2.png`、`player-punch.png`、`player-slash.png`、`player-spin.png` | 光線、飛踢、火焰拳、雙拳、衝拳、斬擊、旋風腳 | 答對攻擊時**隨機挑一個** |
| `player-hurt.png` | 被打飛 | 被怪獸打到、失敗畫面 |
| `player-win.png` | 舉拳歡呼 | 過關畫面 |
| `player-shield.png` | 光之盾 | 目前沒用到（之後可以做防禦） |

### 🌄 關卡場景（`backgrounds/`）：一關一張
從 `_source/小一打怪獸遊戲設計總覽.png` 裁出來（原圖很小，放大後會有點模糊，之後可以請 AI 重畫高解析度版，檔名不變直接覆蓋）。

| 檔名 | 場景 | 關卡 |
|---|---|---|
| `scene-01.jpg` | 城市廢墟 | 第 1 關（卡內貢）、首頁 |
| `scene-02.jpg` | 宇宙太空站 | 第 2 關（巴爾坦星人） |
| `scene-03.jpg` | 沙漠荒原 | 第 3 關（艾雷王） |
| `scene-04.jpg` | 山谷地形 | 第 4 關（雷德王）、10 以內加減 |
| `scene-05.jpg` | 森林古遺跡 | 第 5 關（哥莫拉） |
| `scene-06.jpg` | 火山熔岩 | 第 6 關（貝蒙斯坦） |
| `scene-07.jpg` | 夜晚都市 | 第 7 關（梅菲拉斯星人） |
| `scene-08.jpg` | 沙漠機械基地 | 第 8 關（金古橋） |
| `scene-09.jpg` | 宇宙浮島 | 第 9 關（傑頓） |
| `scene-10.jpg` | 黑暗宇宙 | 第 10 關（貝利亞） |

### 🖼️ 題目圖示（`icons/`）：95 個
從 `_source/注音題目的ICON`、`_source/數學題目的ICON`（`_source/cut_icons.py`）和 `_source/47個圖示：趣味中文詞彙圖卡.png`（`_source/cut_icons2.py`）三張素材圖裁出來，**只裁圖案、不要下面的國字**，避免直接告訴答案。
名稱和檔名的對照在 `shared/icons.js` 的 `MAP`（例如 `蘋果 → apple.png`）；題目用 `Icons.html('蘋果', '🍎')`，沒有圖示的就用後面的 emoji 暫代。

- 動物：豬 猴子 熊 熊貓 狗 貓 青蛙 兔子 魚
- 水果：蘋果 香蕉 葡萄 橘子 草莓 西瓜 鳳梨 水蜜桃
- 交通：車 飛機 火車 船 公車 消防車 警車 救護車
- 文具：鉛筆 橡皮擦 尺 剪刀 書 書包 黑板 椅子
- 天空：太陽 月亮 星星 雲 彩虹 樹 雨傘
- 其他：杯 帽 跑 學校 球 時鐘 披薩 蛋糕

- 注音看圖單字：米 鼻 豹 馬 鵝 虎 茶 雨 蛋 狼 鹿 盤 帆 蛇 手 耳 山 碗 牛 鳥 羊 鴨 牙 燈 鼓 蝦 象 奶 花 雞 鞋 火 腳 糖 眼 水 龜 錢 門 床 肉 草 圓 心 蚊 雪 裙

注音打怪獸的 69 個看圖單字**全部都有圖示**了。之後新增單字時，記得也補一個圖示。

### ✨ 其他小圖（`ui/`）
按鈕、星星、HP 條等都用 CSS 畫（`shared/ui.css`），目前不需要圖片。

## 圖片規格
- **角色、怪獸**：透明背景 PNG，約 512×512 像素，每張 300KB 以內
- **背景**：JPG 或 WebP，橫向約 1280×800 像素，500KB 以內（只會用在上半部的戰場）
- **檔名**：英文小寫＋數字＋連字號，不要用中文、空白

## 兒子的真實照片放哪？
放在 `assets/_private/`。這個資料夾**已設定不會上傳 GitHub**，只存在 Google 雲端硬碟，用來給 AI 當參考、畫出卡通版角色。
