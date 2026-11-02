/* =====================================================================
   NAVIGATION.JS — motor da apresentação
   Fonte única da verdade: window.SLIDES (content/slides.js).
   Contador, barra de progresso, mapa e limites das setas são derivados
   dessa lista — inserir/remover um slide não exige mexer aqui.
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck;
  var SLIDES = window.SLIDES || [];
  var N = SLIDES.length;

  var S = {
    index: -1,
    steps: [],          // etapas reveladas por slide
    els: [],
    token: 0,
    timerOn: false, timerStart: 0, timerId: 0,
    idleId: 0
  };
  Deck.state = S;

  var $stage, $slides, $footer, $map, $help, $count, $title, $speaker, $hint, $timer;

  /* ---------- utilidades ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function layoutOf(i) { return Deck.layouts[SLIDES[i].layout] || Deck.layouts.basic; }
  function stepEls(el) { return el.querySelectorAll('[data-step]'); }
  function maxStep(el) {
    var m = 0;
    Array.prototype.forEach.call(stepEls(el), function (n) { m = Math.max(m, parseInt(n.getAttribute('data-step'), 10) || 0); });
    return m;
  }
  function applySteps(i) {
    var el = S.els[i], n = S.steps[i] || 0;
    Array.prototype.forEach.call(stepEls(el), function (node) {
      var k = parseInt(node.getAttribute('data-step'), 10) || 0;
      var on = k <= n;
      node.classList.toggle('is-revealed', on);
      if (on) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', 'true');
      node.querySelectorAll('button').forEach(function (button) { button.tabIndex = on ? 0 : -1; });
    });
    var L = layoutOf(i);
    if (L.onStep) L.onStep(el, SLIDES[i], n);
    updateHint();
  }

  /* ---------- escala 16:9 ---------- */
  function resize() {
    var W = window.innerWidth, H = window.innerHeight;
    var s = Math.min(W / 1920, H / 1080);
    Deck.stageScale = s;
    $stage.style.transform = 'scale(' + s + ')';
    $stage.style.left = ((W - 1920 * s) / 2) + 'px';
    $stage.style.top = ((H - 1080 * s) / 2) + 'px';
  }

  /* ---------- troca de slide ---------- */
  function show(i, opts) {
    opts = opts || {};
    if (i < 0 || i >= N || i === S.index) return;
    if (Deck.cinema) Deck.cinema.cancel();
    var prev = S.index;
    var dir = prev < 0 || i > prev ? 'fwd' : 'back';
    var instant = opts.instant || Deck.motion.reduced();
    var token = ++S.token;
    var from = prev >= 0 ? S.els[prev] : null;
    var to = S.els[i];

    // limpa qualquer transição em andamento (navegação rápida não duplica slides)
    S.els.forEach(function (e) {
      if (e !== from && e !== to) {
        e.classList.remove('is-leaving', 'leave-fwd', 'leave-back', 'enter-fwd', 'enter-back', 'is-active', 'play');
      }
    });

    if (from) {
      var Lf = layoutOf(prev);
      try { if (Lf.leave) Lf.leave(from, SLIDES[prev]); } catch (e) { console.error(e); }
      from.classList.remove('is-active', 'play', 'enter-fwd', 'enter-back');
      from.setAttribute('aria-hidden', 'true');
      from.setAttribute('inert', '');
      if (!instant) {
        from.classList.add('is-leaving', 'leave-' + dir);
        clearTimeout(from._leaveT);
        from._leaveT = setTimeout(function () {
          from.classList.remove('is-leaving', 'leave-fwd', 'leave-back');
        }, (Deck.config('timing.transition-ms', 520)) + 40);
      } else {
        from.classList.remove('is-leaving', 'leave-fwd', 'leave-back');
      }
    }

    clearTimeout(to._leaveT);
    to.classList.remove('is-leaving', 'leave-fwd', 'leave-back', 'enter-fwd', 'enter-back', 'play');
    void to.offsetWidth; // reinicia as animações de entrada
    to.classList.add('is-active', 'play');
    if (!instant) to.classList.add('enter-' + dir);
    to.removeAttribute('inert');
    to.setAttribute('aria-hidden', 'false');

    S.index = i;
    var L = layoutOf(i);
    var keep = Deck.config('navigation.keepStateOnReturn', false);
    if (!keep || S.steps[i] === undefined) {
      S.steps[i] = maxStep(to) > 0 ? 1 : 0;
      try { if (L.reset) L.reset(to, SLIDES[i]); } catch (e) { console.error(e); }
    }
    applySteps(i);
    try {
      if (L.enter) L.enter(to, SLIDES[i], { from: prev >= 0 ? SLIDES[prev] : null, dir: dir, instant: instant, token: token });
    } catch (e) {
      // fallback seguro: se um efeito especial falhar, o slide continua acessível
      console.error('[deck] efeito de entrada falhou em ' + SLIDES[i].id, e);
    }

    updateUI();
    if (Deck.cinema) Deck.cinema.run({ from: from, to: to, previous: prev >= 0 ? SLIDES[prev] : null, slide: SLIDES[i], dir: dir, instant: instant, token: token });
    try { history.replaceState(null, '', '#' + SLIDES[i].id); } catch (e) { /* file:// em alguns navegadores */ }
    Deck.announce('Slide ' + (i + 1) + ' de ' + N + ': ' + SLIDES[i].title);
    preload(i + 1);
  }
  Deck.go = show;

  function next() {
    var i = S.index, el = S.els[i];
    if (Deck.config('navigation.arrowRevealsSteps', false) && (S.steps[i] || 0) < maxStep(el)) return revealNext();
    show(i + 1);
  }
  function prev() {
    var i = S.index;
    if (Deck.config('navigation.arrowRevealsSteps', false) && (S.steps[i] || 0) > 0) { S.steps[i]--; applySteps(i); return; }
    show(i - 1);
  }
  function advance() {
    if (Deck.cinema && Deck.cinema.skip()) return;
    var i = S.index, L = layoutOf(i);
    if (L.isBusy && L.isBusy(S.els[i])) { L.skip(S.els[i]); return; }
    if ((S.steps[i] || 0) < maxStep(S.els[i])) revealNext(); else show(i + 1);
  }
  function revealNext() {
    var i = S.index, m = maxStep(S.els[i]);
    if ((S.steps[i] || 0) >= m) return false;
    S.steps[i] = (S.steps[i] || 0) + 1;
    applySteps(i);
    return true;
  }
  Deck.revealNext = revealNext;
  Deck.setStep = function (n) {
    var i = S.index;
    S.steps[i] = Math.max(0, Math.min(n, maxStep(S.els[i])));
    applySteps(i);
  };
  Deck.next = next; Deck.prev = prev;

  /* ---------- rodapé, progresso e mapa ---------- */
  function updateUI() {
    var i = S.index, s = SLIDES[i];
    var p = N > 1 ? i / (N - 1) : 1;
    $footer.style.setProperty('--p', p);
    $footer.style.setProperty('--px', (p * $footer.querySelector('.footer-progress').clientWidth) + 'px');
    $count.textContent = pad(i + 1) + ' / ' + pad(N);
    var presenter = (window.DECK.presenters || []).find(function (person) { return person.speaker === s.speaker; });
    $speaker.innerHTML = (presenter ? Deck.ui.portrait(presenter.photo, 'speaker-avatar', '', true) : '') + '<span>' + Deck.ui.esc(s.speaker || '') + '</span>';
    $title.textContent = s.title || '';
    var light = s.surface === 'cream' || s.surface === 'sage';
    $footer.classList.toggle('on-light', light);
    $footer.style.setProperty('--footer-fg', light ? 'var(--color-forest)' : 'var(--color-cream)');
    $footer.style.setProperty('--footer-progress', light ? 'var(--color-forest)' : 'var(--color-gold)');
    $footer.querySelector('[data-act="prev"]').disabled = i === 0;
    $footer.querySelector('[data-act="next"]').disabled = i === N - 1;
    Array.prototype.forEach.call($map.querySelectorAll('.map-item'), function (b) {
      b.setAttribute('aria-current', String(+b.getAttribute('data-index') === i));
    });
  }
  function updateHint() {
    var i = S.index; if (i < 0) return;
    var m = maxStep(S.els[i]), n = S.steps[i] || 0;
    var custom = layoutOf(i).hint;
    if (m > 0 && n < m) {
      $hint.textContent = (custom || 'Espaço revela a próxima etapa') + ' · ' + n + '/' + m;
      $hint.classList.add('is-visible');
    } else {
      $hint.textContent = '';
      $hint.classList.remove('is-visible');
    }
  }

  function buildFooter() {
    $footer = document.createElement('footer');
    $footer.className = 'deck-footer';
    $footer.innerHTML =
      '<div class="footer-progress" aria-hidden="true"><span class="staff"></span><span class="fill"></span><span class="note"></span></div>' +
      '<div class="footer-meta"><span class="footer-count" aria-label="Posição"></span><span class="footer-speaker fades"></span><span class="footer-title fades"></span></div>' +
      '<div class="footer-hint"></div>' +
      '<nav class="footer-controls fades" aria-label="Controles da apresentação">' +
        '<span class="timer" hidden title="Cronômetro de ensaio (T)"></span>' +
        '<button class="icon-btn" data-act="prev" aria-label="Slide anterior (seta esquerda)" title="Anterior (←)"><img src="assets/icons/arrow-left.svg" alt=""></button>' +
        '<button class="icon-btn" data-act="map" aria-label="Mapa de slides (M)" aria-haspopup="dialog" title="Mapa (M)"><img src="assets/icons/map.svg" alt=""></button>' +
        '<button class="icon-btn" data-act="help" aria-label="Atalhos de teclado (?)" aria-haspopup="dialog" title="Atalhos (?)"><img src="assets/icons/help.svg" alt=""></button>' +
        '<button class="icon-btn" data-act="fullscreen" aria-label="Tela cheia (F)" aria-pressed="false" title="Tela cheia (F)"><img src="assets/icons/fullscreen.svg" alt=""></button>' +
        '<button class="icon-btn" data-act="next" aria-label="Próximo slide (seta direita)" title="Próximo (→)"><img src="assets/icons/arrow-right.svg" alt=""></button>' +
      '</nav>';
    $stage.appendChild($footer);
    $count = $footer.querySelector('.footer-count');
    $speaker = $footer.querySelector('.footer-speaker');
    $title = $footer.querySelector('.footer-title');
    $hint = $footer.querySelector('.footer-hint');
    $timer = $footer.querySelector('.timer');
    $footer.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'prev') show(S.index - 1);
      if (a === 'next') show(S.index + 1);
      if (a === 'map') Deck.overlays.toggle($map, { origin: b });
      if (a === 'help') Deck.overlays.toggle($help, { origin: b });
      if (a === 'fullscreen') toggleFullscreen();
    });
  }

  function buildMap() {
    $map = document.createElement('div');
    $map.className = 'overlay';
    $map.setAttribute('role', 'dialog');
    $map.setAttribute('aria-modal', 'true');
    $map.setAttribute('aria-labelledby', 'map-title');
    $map.setAttribute('aria-hidden', 'true');
    $map.setAttribute('inert', '');
    var groups = [], byName = {};
    SLIDES.forEach(function (s, i) {
      var g = s.section || 'Slides';
      if (!byName[g]) { byName[g] = { name: g, items: [] }; groups.push(byName[g]); }
      byName[g].items.push({ s: s, i: i });
    });
    var html = groups.map(function (g) {
      return '<section class="map-group"><h3 class="t-label">' + Deck.ui.esc(g.name) + '</h3><ol>' +
        g.items.map(function (it) {
          return '<li><button class="map-item" data-index="' + it.i + '">' +
            '<span class="n">' + pad(it.i + 1) + '</span>' +
            '<span class="t">' + Deck.ui.esc(it.s.title) + '</span>' +
            '<span class="s">' + Deck.ui.esc(it.s.speaker || '') + '</span>' +
            '</button></li>';
        }).join('') + '</ol></section>';
    }).join('');
    $map.innerHTML =
      '<div class="panel map-panel">' +
        '<button class="icon-btn panel-close" data-close aria-label="Fechar mapa (Esc)"><img src="assets/icons/close.svg" alt=""></button>' +
        '<h2 id="map-title">Mapa da apresentação</h2>' +
        '<div class="map-groups">' + html + '</div>' +
      '</div>';
    $stage.appendChild($map);
    $map.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { Deck.overlays.close($map); return; }
      var b = e.target.closest('.map-item'); if (!b) return;
      var idx = +b.getAttribute('data-index');
      Deck.overlays.close($map);
      show(idx);
    });
  }

  function buildHelp() {
    $help = document.createElement('div');
    $help.className = 'overlay';
    $help.setAttribute('role', 'dialog');
    $help.setAttribute('aria-modal', 'true');
    $help.setAttribute('aria-labelledby', 'help-title');
    $help.setAttribute('aria-hidden', 'true');
    $help.setAttribute('inert', '');
    var rows = [
      ['<kbd>→</kbd><kbd>←</kbd>', 'Próximo / anterior slide'],
      ['<kbd>Espaço</kbd>', 'Conclui animação / revela etapa / avança'],
      ['<kbd>M</kbd>', 'Mapa de slides'],
      ['<kbd>F</kbd>', 'Tela cheia'],
      ['<kbd>Esc</kbd>', 'Fecha interação / conclui animação'],
      ['<kbd>Home</kbd><kbd>End</kbd>', 'Primeiro / último slide'],
      ['<kbd>T</kbd>', 'Cronômetro de ensaio'],
      ['<kbd>R</kbd>', 'Reduzir animações'],
      ['<kbd>?</kbd>', 'Esta ajuda']
    ];
    $help.innerHTML =
      '<div class="panel help-panel">' +
        '<button class="icon-btn panel-close" data-close aria-label="Fechar ajuda (Esc)"><img src="assets/icons/close.svg" alt=""></button>' +
        '<h2 id="help-title">Atalhos</h2>' +
        '<dl class="help-list">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
        '<div class="help-actions">' +
          '<button class="btn" data-motion aria-pressed="false" style="--fg:var(--color-cream);--bg:var(--color-forest)">Reduzir animações</button>' +
          '<button class="btn" data-timer aria-pressed="false" style="--fg:var(--color-cream);--bg:var(--color-forest)">Cronômetro de ensaio</button>' +
        '</div>' +
      '</div>';
    $stage.appendChild($help);
    $help.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) Deck.overlays.close($help);
      if (e.target.closest('[data-motion]')) Deck.motion.toggle();
      if (e.target.closest('[data-timer]')) toggleTimer();
    });
    syncHelp();
    document.addEventListener('deck:motion', syncHelp);
  }
  function syncHelp() {
    var m = $help.querySelector('[data-motion]'), t = $help.querySelector('[data-timer]');
    m.setAttribute('aria-pressed', String(Deck.motion.reduced()));
    t.setAttribute('aria-pressed', String(S.timerOn));
  }

  /* ---------- tela cheia (com fallback) ---------- */
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement) || document.documentElement.classList.contains('pseudo-fullscreen'); }
  function toggleFullscreen() {
    var d = document, el = d.documentElement;
    var api = el.requestFullscreen || el.webkitRequestFullscreen;
    if (api) {
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else {
        var p = api.call(el);
        if (p && p.catch) p.catch(function () { el.classList.toggle('pseudo-fullscreen'); syncFs(); });
      }
    } else {
      el.classList.toggle('pseudo-fullscreen');
      syncFs();
    }
  }
  function syncFs() {
    $footer.querySelector('[data-act="fullscreen"]').setAttribute('aria-pressed', String(isFs()));
    resize();
  }

  /* ---------- cronômetro de ensaio ---------- */
  function toggleTimer() {
    S.timerOn = !S.timerOn;
    clearInterval(S.timerId);
    $timer.hidden = !S.timerOn;
    if (S.timerOn) {
      S.timerStart = Date.now();
      var tick = function () {
        var sec = Math.floor((Date.now() - S.timerStart) / 1000);
        $timer.textContent = pad(Math.floor(sec / 60)) + ':' + pad(sec % 60);
      };
      tick(); S.timerId = setInterval(tick, 1000);
    }
    if ($help) syncHelp();
  }

  /* ---------- rodapé discreto quando ocioso ---------- */
  function wake() {
    $footer.classList.remove('is-idle');
    clearTimeout(S.idleId);
    S.idleId = setTimeout(function () {
      if ($footer.matches(':hover') || $footer.contains(document.activeElement)) return wake();
      $footer.classList.add('is-idle');
    }, Deck.config('navigation.footerIdleSeconds', 2.5) * 1000);
  }

  /* ---------- teclado ---------- */
  function isInteractive(t) {
    return !!(t && t.closest && t.closest('button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="slider"], [contenteditable="true"]'));
  }
  function onKey(e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, target = e.target;
    var typing = target && (target.tagName === 'INPUT' && target.type !== 'range' && target.type !== 'button' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (typing) return;
    wake();

    if (k === 'Escape') {
      if (Deck.overlays.closeTop()) { e.preventDefault(); return; }
      if (Deck.cinema && Deck.cinema.skip()) { e.preventDefault(); return; }
      var L = layoutOf(S.index);
      if (L.escape && L.escape(S.els[S.index], SLIDES[S.index])) e.preventDefault();
      return; // sem nada aberto, o navegador sai da tela cheia normalmente
    }

    var overlay = Deck.overlays.isOpen();
    if (k === 'm' || k === 'M') { e.preventDefault(); Deck.overlays.toggle($map, { origin: $footer.querySelector('[data-act="map"]') }); return; }
    if (k === '?' || k === 'h' || k === 'H') { e.preventDefault(); Deck.overlays.toggle($help, { origin: $footer.querySelector('[data-act="help"]') }); return; }
    if (overlay) return; // com janela aberta, não troca de slide

    var inRange = target && target.type === 'range';
    switch (k) {
      case 'ArrowRight': case 'PageDown':
        if (inRange) return; e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp':
        if (inRange) return; e.preventDefault(); prev(); break;
      case ' ': case 'Spacebar': case 'Enter':
        if (isInteractive(target)) return;
        e.preventDefault(); advance(); break;
      case 'Home': e.preventDefault(); show(0); break;
      case 'End': e.preventDefault(); show(N - 1); break;
      case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      case 't': case 'T': e.preventDefault(); toggleTimer(); break;
      case 'r': case 'R': e.preventDefault(); Deck.motion.toggle(); break;
    }
  }

  /* ---------- pré-carregamento leve ---------- */
  function preload(i) {
    if (i < 0 || i >= N) return;
    Array.prototype.forEach.call(S.els[i].querySelectorAll('img[src]'), function (img) {
      var pre = new Image(); pre.src = img.getAttribute('src');
    });
  }

  function indexFromHash() {
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (!id) return -1;
    for (var i = 0; i < N; i++) if (SLIDES[i].id === id) return i;
    var m = /(\d+)$/.exec(id);
    return m ? Math.min(N - 1, Math.max(0, parseInt(m[1], 10) - 1)) : -1;
  }

  /* ---------- inicialização ---------- */
  function boot() {
    Deck.applyTheme();
    Deck.motion.init();
    $stage = document.getElementById('stage');
    $slides = document.getElementById('slides');
    if (!N) { $slides.innerHTML = '<p style="padding:80px">Nenhum slide em content/slides.js</p>'; return; }

    S.els = Deck.renderAll($slides, SLIDES);
    buildFooter();
    buildMap();
    buildHelp();
    Deck.modal.build($stage);

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousemove', wake, { passive: true });
    document.addEventListener('focusin', wake);
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);
    window.addEventListener('hashchange', function () {
      var i = indexFromHash(); if (i >= 0 && i !== S.index) show(i);
    });

    var start = indexFromHash();
    show(start >= 0 ? start : 0, { instant: true });
    if (Deck.config('navigation.rehearsalTimer', false)) toggleTimer();
    wake();
    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
