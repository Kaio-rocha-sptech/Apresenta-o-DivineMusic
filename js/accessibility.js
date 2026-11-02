/* =====================================================================
   ACCESSIBILITY.JS — tema, movimento reduzido, foco e anúncios
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck = window.Deck || {};

  /* ---------- aplica content/theme.js como variáveis CSS ---------- */
  Deck.applyTheme = function () {
    var T = window.THEME || {};
    var root = document.documentElement.style;
    Object.keys(T.colors || {}).forEach(function (k) { root.setProperty('--color-' + k, T.colors[k]); });
    Object.keys(T.fonts || {}).forEach(function (k) { root.setProperty('--font-' + k, T.fonts[k]); });
    Object.keys(T.timing || {}).forEach(function (k) { root.setProperty('--' + k, String(T.timing[k])); });
  };
  Deck.config = function (path, fallback) {
    var parts = path.split('.'), v = window.THEME;
    for (var i = 0; i < parts.length; i++) { if (v == null) return fallback; v = v[parts[i]]; }
    return v === undefined ? fallback : v;
  };

  /* ---------- armazenamento local seguro ---------- */
  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      if (val === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  Deck.store = store;

  /* ---------- movimento reduzido ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  Deck.motion = {
    reduced: function () {
      var html = document.documentElement;
      if (html.classList.contains('reduce-motion')) return true;
      if (html.classList.contains('force-motion')) return false;
      return !!(mq && mq.matches);
    },
    set: function (reduce) {
      var html = document.documentElement;
      html.classList.toggle('reduce-motion', reduce);
      html.classList.toggle('force-motion', !reduce && !!(mq && mq.matches));
      store('dm-reduce-motion', reduce ? 'on' : 'off');
      Deck.announce(reduce ? 'Animações reduzidas' : 'Animações ativadas');
      document.dispatchEvent(new CustomEvent('deck:motion'));
    },
    toggle: function () { this.set(!this.reduced()); },
    init: function () {
      var saved = store('dm-reduce-motion');
      if (saved === 'on') document.documentElement.classList.add('reduce-motion');
      if (saved === 'off' && mq && mq.matches) document.documentElement.classList.add('force-motion');
    }
  };

  /* ---------- anúncios para leitor de tela ---------- */
  Deck.announce = function (text) {
    var live = document.getElementById('live-region');
    if (!live) return;
    live.textContent = '';
    window.setTimeout(function () { live.textContent = text; }, 30);
  };

  /* ---------- prende o foco dentro de um contêiner ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  Deck.trapFocus = function (container) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(container.querySelectorAll(FOCUSABLE), function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', onKey);
    return function release() { container.removeEventListener('keydown', onKey); };
  };
  Deck.FOCUSABLE = FOCUSABLE;
})();
