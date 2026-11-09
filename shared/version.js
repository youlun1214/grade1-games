// 版本標示：畫面右下角顯示「V.民國年月日」，例如 V.1151102
// 下面這行由 .githooks/pre-commit 在每次 commit 時自動改成當天日期，不用手動改
window.APP_VERSION = 'V.1151109';
(function () {
  function show() {
    const el = document.createElement('div');
    el.className = 'no-zy';
    el.textContent = window.APP_VERSION;
    el.style.cssText = 'position:fixed;right:max(6px, env(safe-area-inset-right));bottom:max(4px, env(safe-area-inset-bottom));z-index:9500;' +
      'font:700 11px/1.4 system-ui, sans-serif;color:#fff;background:rgba(0,0,0,.45);padding:1px 6px;border-radius:6px;pointer-events:none;';
    document.body.appendChild(el);
  }
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
