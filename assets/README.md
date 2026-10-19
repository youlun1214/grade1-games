# 🎨 圖片庫（assets）

所有遊戲共用的圖片都放這裡。這個資料夾會推上 GitHub（公開），**不要放真人照片**。

| 資料夾 | 放什麼 | 檔名範例 |
|---|---|---|
| `monsters/` | 怪獸、恐龍 | `dino-green.png`、`dino-green-hurt.png`、`dino-green-down.png` |
| `player/` | 玩家角色（兒子的**卡通版**） | `player.png`、`player-attack.png`、`player-hurt.png` |
| `backgrounds/` | 對戰背景 | `forest.jpg`、`volcano.webp` |
| `ui/` | 按鈕、愛心、星星、特效等小圖 | `heart.png`、`hit-effect.png` |

## 圖片規格
- **角色、怪獸**：透明背景 PNG，約 512×512 像素，每張 300KB 以內
- **背景**：JPG 或 WebP，約 1280×800 像素（橫向）或 800×1280（直向），500KB 以內
- **檔名**：英文小寫 + 連字號，不要用中文、空白

## 每隻怪獸建議畫 3 種狀態
| 狀態 | 檔名結尾 | 什麼時候出現 |
|---|---|---|
| 平常 | `dino-green.png` | 等待作答 |
| 被打到 | `dino-green-hurt.png` | 玩家答對、攻擊成功 |
| 被打倒 | `dino-green-down.png` | 血量歸零 |

玩家角色也一樣：平常、攻擊、被打到。

## 兒子的真實照片放哪？
放在 `assets/_private/`。這個資料夾**已設定不會上傳 GitHub**，只存在 Google 雲端硬碟，用來給 AI 當參考、畫出卡通版角色。
