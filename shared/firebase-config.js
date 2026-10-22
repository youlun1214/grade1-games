// Firebase 設定：從 Firebase 主控台「專案設定 → 一般 → 你的應用程式 → 網頁應用程式」複製 firebaseConfig 貼過來
// 這些值本來就是給網頁用的，放在公開網站上是安全的；真正保護資料的是 Firestore 安全規則（docs/firebase-setup.md）
// 還沒設定時保持 null：答錯紀錄會先存在這台裝置上，設定好、登入後再自動上傳
window.FIREBASE_CONFIG = null;
