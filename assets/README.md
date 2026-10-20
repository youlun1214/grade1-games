# 🎨 圖片庫（assets）

所有遊戲共用的圖片都放這裡。這個資料夾會推上 GitHub（公開），**不要放真人照片**。
**檔名照下面的表放進去，遊戲就會自動換上**；還沒放的圖會用 emoji 暫代。

## 檔名清單

### 🐲 怪獸（`monsters/`）：10 隻，每隻 3 張
數學和注音遊戲共用同一組怪獸，第 1 關用 `monster-01`、第 10 關（魔王）用 `monster-10`。

| 關卡 | 怪獸（暫代 emoji） | 平常 | 被打到 | 被打倒 |
|---|---|---|---|---|
| 1 | 蛋蛋龍 🐣 | `monster-01.png` | `monster-01-hurt.png` | `monster-01-down.png` |
| 2 | 黏黏蝸 🐌 | `monster-02.png` | `monster-02-hurt.png` | `monster-02-down.png` |
| 3 | 呱呱蛙 🐸 | `monster-03.png` | `monster-03-hurt.png` | `monster-03-down.png` |
| 4 | 硬殼龜 🐢 | `monster-04.png` | `monster-04-hurt.png` | `monster-04-down.png` |
| 5 | 夾夾蟹 🦀 | `monster-05.png` | `monster-05-hurt.png` | `monster-05-down.png` |
| 6 | 墨墨章魚 🐙 | `monster-06.png` | `monster-06-hurt.png` | `monster-06-down.png` |
| 7 | 黑翼蝙蝠 🦇 | `monster-07.png` | `monster-07-hurt.png` | `monster-07-down.png` |
| 8 | 月光狼 🐺 | `monster-08.png` | `monster-08-hurt.png` | `monster-08-down.png` |
| 9 | 暴暴龍 🦖 | `monster-09.png` | `monster-09-hurt.png` | `monster-09-down.png` |
| 10 | 魔王龍 🐉 | `monster-10.png` | `monster-10-hurt.png` | `monster-10-down.png` |

怪獸的名字和招式寫在 `shared/levels.js` 的 `MONSTERS`，想改名字（例如照 AI 畫出來的樣子取名）改那裡就好。
畫圖時怪獸請**面向左邊**（看著玩家）；越後面的關卡可以畫得越大、越威風，但還是要可愛、不可怕。

### 🧒 玩家（`player/`）：兒子的**卡通版**
| 狀態 | 檔名 |
|---|---|
| 平常 | `player.png` |
| 攻擊 | `player-attack.png` |
| 被打到 | `player-hurt.png` |

玩家站在左下角，請**面向右邊**（看著怪獸）。

### 🌄 背景（`backgrounds/`）
| 用途 | 檔名 |
|---|---|
| 對戰場地 | `battle.jpg` |

### ✨ 其他小圖（`ui/`）
按鈕、愛心、特效等，之後需要再加。

## 圖片規格
- **角色、怪獸**：透明背景 PNG，約 512×512 像素，每張 300KB 以內
- **背景**：JPG 或 WebP，橫向約 1280×800 像素，500KB 以內（只會用在上半部的戰場）
- **檔名**：英文小寫＋數字＋連字號，不要用中文、空白

## 兒子的真實照片放哪？
放在 `assets/_private/`。這個資料夾**已設定不會上傳 GitHub**，只存在 Google 雲端硬碟，用來給 AI 當參考、畫出卡通版角色。
