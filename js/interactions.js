/* =====================================================================
   INTERACTIONS.JS — overlays (mapa, ajuda), modal com zoom
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck = window.Deck || {};

  /* ---------- pilha de overlays: ESC fecha o de cima ---------- */
  var stack = [];
  Deck.overlays = {
    open: function (el, opts) {
      opts = opts || {};
      if (stack.some(function (s) { return s.el === el; })) return;
      var entry = {
        el: el,
        origin: opts.origin || document.activeElement,
        onClose: opts.onClose,
        release: Deck.trapFocus(el)
      };
      stack.push(entry);
      el.classList.add('is-open');
      el.setAttribute('aria-hidden', 'false');
      el.removeAttribute('inert');
      var target = opts.focus || el.querySelector('[data-autofocus]') || el.querySelector(Deck.FOCUSABLE);
      window.setTimeout(function () { if (target) target.focus({ preventScroll: true }); }, 40);
    },
    close: function (el) {
      var idx = -1;
      for (var i = stack.length - 1; i >= 0; i--) if (!el || stack[i].el === el) { idx = i; break; }
      if (idx < 0) return false;
      var entry = stack.splice(idx, 1)[0];
      entry.el.classList.remove('is-open');
      entry.el.setAttribute('aria-hidden', 'true');
      entry.el.setAttribute('inert', '');
      entry.release();
      if (entry.onClose) entry.onClose();
      if (entry.origin && document.contains(entry.origin)) {
        try { entry.origin.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
      return true;
    },
    closeTop: function () { return this.close(null); },
    isOpen: function (el) { return el ? stack.some(function (s) { return s.el === el; }) : stack.length > 0; },
    toggle: function (el, opts) { if (this.isOpen(el)) this.close(el); else { this.close(null); this.open(el, opts); } }
  };

  /* fechar ao clicar fora do painel */
  document.addEventListener('mousedown', function (e) {
    var top = stack[stack.length - 1];
    if (top && e.target === top.el) Deck.overlays.close(top.el);
  });

  /* ---------- modal com zoom ---------- */
  var M = Deck.modal = {};
  var state = { scale: 1, tx: 0, ty: 0, w: 0, h: 0, zoomable: false };

  M.build = function (stage) {
    var el = document.createElement('div');
    el.className = 'overlay';
    el.id = 'modal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'modal-title');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('inert', '');
    el.innerHTML =
      '<div class="panel modal-panel">' +
        '<div class="modal-head">' +
          '<h2 id="modal-title"></h2>' +
          '<div class="zoom-tools" role="group" aria-label="Zoom">' +
            '<button class="icon-btn" data-zoom="out" aria-label="Diminuir zoom"><img src="assets/icons/minus.svg" alt=""></button>' +
            '<span class="zoom-level" aria-live="polite">100%</span>' +
            '<button class="icon-btn" data-zoom="in" aria-label="Aumentar zoom"><img src="assets/icons/plus.svg" alt=""></button>' +
            '<button class="icon-btn" data-zoom="fit" aria-label="Ajustar à tela"><img src="assets/icons/fit.svg" alt=""></button>' +
            '<button class="icon-btn" data-zoom="reset" aria-label="Tamanho original (100%)"><img src="assets/icons/reset.svg" alt=""></button>' +
          '</div>' +
          '<button class="icon-btn" data-close aria-label="Fechar (Esc)"><img src="assets/icons/close.svg" alt=""></button>' +
        '</div>' +
        '<div class="modal-body"><div class="zoom-canvas" tabindex="0" role="group" aria-label="Diagrama ampliado. Use as setas para deslocar, mais e menos para zoom e zero para ajustar."><div class="zoom-content"></div></div></div>' +
      '</div>';
    stage.appendChild(el);
    M.el = el;
    M.title = el.querySelector('#modal-title');
    M.body = el.querySelector('.modal-body');
    M.canvas = el.querySelector('.zoom-canvas');
    M.content = el.querySelector('.zoom-content');
    M.tools = el.querySelector('.zoom-tools');
    M.level = el.querySelector('.zoom-level');

    el.querySelector('[data-close]').addEventListener('click', function () { Deck.overlays.close(el); });
    M.tools.addEventListener('click', function (e) {
      var b = e.target.closest('[data-zoom]');
      if (!b) return;
      var a = b.getAttribute('data-zoom');
      if (a === 'in') zoomBy(1.25);
      if (a === 'out') zoomBy(0.8);
      if (a === 'fit') fit();
      if (a === 'reset') setScale(1, true);
    });
    bindPan();
  };

  /**
   * Abre o modal.
   * opts.title  título
   * opts.src    caminho de imagem (zoom ativo)
   * opts.alt    texto alternativo
   * opts.node   elemento HTML a mostrar (zoom ativo se opts.zoom)
   * opts.html   conteúdo de texto (sem zoom)
   */
  M.open = function (opts) {
    opts = opts || {};
    M.title.textContent = opts.title || '';
    M.content.innerHTML = '';
    state.zoomable = opts.zoom !== false && !!(opts.src || opts.node);
    M.tools.style.display = state.zoomable ? '' : 'none';
    M.body.classList.toggle('is-text', !state.zoomable);

    if (!state.zoomable) {
      M.canvas.style.display = 'none';
      var wrap = M.body.querySelector('.modal-text');
      if (!wrap) { wrap = document.createElement('div'); wrap.className = 'modal-text t-body'; M.body.appendChild(wrap); }
      wrap.style.display = '';
      wrap.innerHTML = opts.html || '';
    } else {
      M.canvas.style.display = '';
      var t = M.body.querySelector('.modal-text'); if (t) t.style.display = 'none';
      if (opts.src) {
        var img = new Image();
        img.alt = opts.alt || '';
        img.draggable = false;
        img.onload = function () { state.w = img.naturalWidth || 1600; state.h = img.naturalHeight || 900; fit(); };
        img.onerror = function () {
          M.content.innerHTML = '';
          M.content.appendChild(Deck.ui.placeholder(opts.alt || opts.title, opts.src, { width: 1200, height: 700 }));
          state.w = 1200; state.h = 700; fit();
        };
        img.src = opts.src;
        M.content.appendChild(img);
      } else if (opts.node) {
        M.content.appendChild(opts.node);
        window.requestAnimationFrame(function () {
          state.w = opts.width || opts.node.offsetWidth || 1400;
          state.h = opts.height || opts.node.offsetHeight || 800;
          fit();
        });
      }
    }
    Deck.overlays.open(M.el, { origin: opts.origin, focus: M.el.querySelector('[data-close]') });
  };
  M.close = function () { Deck.overlays.close(M.el); };

  function apply() {
    M.content.style.transform = 'translate(' + state.tx + 'px,' + state.ty + 'px) scale(' + state.scale + ')';
    M.level.textContent = Math.round(state.scale * 100) + '%';
  }
  function view() { return { w: M.canvas.offsetWidth, h: M.canvas.offsetHeight }; }
  function center() {
    var v = view();
    state.tx = (v.w - state.w * state.scale) / 2;
    state.ty = (v.h - state.h * state.scale) / 2;
  }
  function fit() {
    var v = view();
    if (!state.w || !v.w) return;
    state.scale = Math.min((v.w - 64) / state.w, (v.h - 64) / state.h, 4);
    center(); apply();
  }
  function setScale(s, recenter, cx, cy) {
    s = Math.max(0.1, Math.min(6, s));
    var v = view();
    if (cx === undefined) { cx = v.w / 2; cy = v.h / 2; }
    var k = s / state.scale;
    state.tx = cx - (cx - state.tx) * k;
    state.ty = cy - (cy - state.ty) * k;
    state.scale = s;
    if (recenter) center();
    apply();
  }
  function zoomBy(f, cx, cy) { setScale(state.scale * f, false, cx, cy); }
  M.zoomBy = zoomBy;
  M.fit = fit;

  function bindPan() {
    var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    M.canvas.addEventListener('pointerdown', function (e) {
      dragging = true; sx = e.clientX; sy = e.clientY; ox = state.tx; oy = state.ty;
      M.canvas.classList.add('is-dragging');
      M.canvas.setPointerCapture(e.pointerId);
    });
    M.canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var k = Deck.stageScale || 1;
      state.tx = ox + (e.clientX - sx) / k;
      state.ty = oy + (e.clientY - sy) / k;
      apply();
    });
    function end() { dragging = false; M.canvas.classList.remove('is-dragging'); }
    M.canvas.addEventListener('pointerup', end);
    M.canvas.addEventListener('pointercancel', end);
    M.canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = M.canvas.getBoundingClientRect(), k = Deck.stageScale || 1;
      zoomBy(e.deltaY < 0 ? 1.12 : 0.89, (e.clientX - r.left) / k, (e.clientY - r.top) / k);
    }, { passive: false });
  }

  /* teclas + e − dentro do modal */
  document.addEventListener('keydown', function (e) {
    if (!M.el || !Deck.overlays.isOpen(M.el) || !state.zoomable) return;
    if (e.key === '+' || e.key === '=') { zoomBy(1.25); e.preventDefault(); }
    if (e.key === '-' || e.key === '_') { zoomBy(0.8); e.preventDefault(); }
    if (e.key === '0') { fit(); e.preventDefault(); }
    var pan = e.shiftKey ? 120 : 48;
    if (e.key === 'ArrowRight') { state.tx -= pan; apply(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { state.tx += pan; apply(); e.preventDefault(); }
    if (e.key === 'ArrowDown') { state.ty -= pan; apply(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { state.ty += pan; apply(); e.preventDefault(); }
  });
})();
