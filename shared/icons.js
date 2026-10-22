// 題目圖示：從 ChatGPT 產的「注音題目的ICON」「數學題目的ICON」裁出來（assets/icons/）
// 用法：Icons.html('蘋果', '🍎') → 有圖示就用圖示，沒有就用後面的 emoji 暫代
(function () {
  // 名稱 → 圖示檔名（assets/icons/<檔名>.png）
  const MAP = {
    豬: 'pig', 猴子: 'monkey', 猴: 'monkey', 熊: 'bear', 熊貓: 'panda', 狗: 'dog', 小狗: 'dog', 貓: 'cat', 小貓: 'cat',
    青蛙: 'frog', 蛙: 'frog', 兔子: 'rabbit', 兔: 'rabbit',
    蘋果: 'apple', 香蕉: 'banana', 葡萄: 'grape', 橘子: 'orange', 草莓: 'strawberry', 西瓜: 'watermelon', 鳳梨: 'pineapple', 水蜜桃: 'peach',
    車: 'car', 汽車: 'car', 飛機: 'plane', 火車: 'train', 船: 'ship', 公車: 'bus', 消防車: 'firetruck', 警車: 'police', 救護車: 'ambulance',
    鉛筆: 'pencil', 筆: 'pencil', 橡皮擦: 'eraser', 尺: 'ruler', 剪刀: 'scissors', 書: 'book', 書包: 'backpack', 黑板: 'blackboard', 椅子: 'chair',
    太陽: 'sun', 月亮: 'moon', 月: 'moon', 星星: 'star', 星: 'star', 雲: 'cloud', 彩虹: 'rainbow', 樹: 'tree', 雨傘: 'umbrella', 傘: 'umbrella', 蛋糕: 'cake',
    // 注音打怪獸的看圖單字（「47個圖示：趣味中文詞彙圖卡」）
    米: 'rice', 鼻: 'nose', 豹: 'leopard', 馬: 'horse', 鵝: 'goose', 虎: 'tiger', 茶: 'tea', 雨: 'rain', 蛋: 'egg', 狼: 'wolf',
    鹿: 'deer', 盤: 'plate', 帆: 'sailboat', 蛇: 'snake', 手: 'hand', 耳: 'ear', 山: 'mountain', 碗: 'bowl', 牛: 'cow', 鳥: 'bird',
    羊: 'sheep', 鴨: 'duck', 牙: 'tooth', 燈: 'lantern', 鼓: 'drum', 蝦: 'shrimp', 象: 'elephant', 奶: 'milk', 花: 'flower', 雞: 'chicken',
    鞋: 'shoe', 火: 'fire', 腳: 'foot', 糖: 'candy', 眼: 'eye', 水: 'water', 龜: 'turtle', 錢: 'money', 門: 'door', 床: 'bed',
    肉: 'meat', 草: 'grass', 圓: 'circle', 心: 'heart', 蚊: 'mosquito', 雪: 'snowflake', 裙: 'skirt',
    杯: 'cup', 杯子: 'cup', 帽: 'cap', 帽子: 'cap', 跑: 'run', 學校: 'school', 球: 'ball', 時鐘: 'clock', 鐘: 'clock', 披薩: 'pizza', 魚: 'fish',
  };

  // 專案根目錄：從這支 js 的位置推回去（shared/icons.js → ../）
  const me = document.currentScript && document.currentScript.src;
  const BASE = me ? me.replace(/shared\/icons\.js.*$/, '') : '../../';

  const has = name => !!MAP[name];
  const src = name => MAP[name] ? `${BASE}assets/icons/${MAP[name]}.png` : null;

  // cls：額外的 class（例如 big、small）
  function html(name, emoji, cls = '') {
    const s = src(name);
    if (!s) return `<span class="ic ic-emoji ${cls}">${emoji || '❓'}</span>`;
    return `<img class="ic ${cls}" src="${s}" alt="${name}" draggable="false">`;
  }

  window.Icons = { MAP, has, src, html };
})();
