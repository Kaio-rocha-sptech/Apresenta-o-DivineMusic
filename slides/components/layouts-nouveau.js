/* =====================================================================
   LAYOUTS NOUVEAU — slides conceituais e humanos
   hero · ods · persona · beforeAfter · wireframe · retro · closing
   Os textos vêm de content/slides.js; aqui fica só a estrutura.
   ===================================================================== */
(function () {
  'use strict';
  var L = window.Deck.layouts;
  var ui = window.Deck.ui;
  var t = ui.t, esc = ui.esc;

  function each(list, fn) { return (list || []).map(fn).join(''); }

  /* ------------------------------------------------------------ hero */
  L.hero = {
    render: function (s) {
      var c = s.content || {};
      var team = (window.DECK && window.DECK.team) || [];
      var words = String(c.product || '').split(' ');
      var first = words.shift() || '', rest = words.join(' ');
      return ui.decor('whiplash') +
        '<div class="slide-inner hero">' +
          '<div class="hero-arch" data-anim="card" style="--i:0">' +
            '<div class="hero-arch-body">' +
              '<p class="hero-company" data-anim="text" style="--i:0">' + t(c.company) + '</p>' +
              '<h1 class="hero-product" data-anim="title">' +
                '<span class="w1">' + t(first) + '</span>' +
                (rest ? '<span class="w2">' + t(rest) + '</span>' : '') +
              '</h1>' +
              '<p class="hero-tagline" data-anim="text" style="--i:1">' + t(c.tagline) + '</p>' +
              '<div class="hero-rule" aria-hidden="true"><span></span></div>' +
              '<ul class="hero-team" data-anim="text" style="--i:2" aria-label="Equipe">' +
                each(team, function (n) { return '<li>' + esc(n) + '</li>'; }) +
              '</ul>' +
            '</div>' +
          '</div>' +
          '<div class="hero-side">' +
            '<figure class="hero-logo" data-anim="card" style="--i:1">' + ui.media(s.media, { fit: 'contain' }) + '</figure>' +
            '<section class="hero-why" data-anim="card" style="--i:2">' +
              '<h2>' + t(c.justificationTitle) + '</h2>' +
              '<p>' + t(c.justification) + '</p>' +
            '</section>' +
          '</div>' +
        '</div>';
    }
  };

  /* ------------------------------------------------------------- ods */
  L.ods = {
    hint: 'Espaço revela o próximo ponto',
    render: function (s) {
      var c = s.content || {};
      return ui.decor('stem') +
        '<div class="slide-inner ods">' +
          '<div class="ods-goal">' +
            '<div class="ods-mark" data-anim="card" style="--i:0">' +
              '<span class="ods-num" aria-hidden="true">' + esc(c.number) + '</span>' +
              '<figure class="ods-icon">' + ui.media(s.media, { fit: 'contain' }) + '</figure>' +
            '</div>' +
            '<div class="ods-text">' +
              '<h2 class="t-title" data-anim="title"><span class="sr-only">ODS ' + esc(c.number) + ' — </span>' + t(c.goalName) + '</h2>' +
              '<p class="t-body ods-quote" data-anim="text">' + t(c.goalText) + '</p>' +
              '<p class="ods-source" data-anim="text">' + t(c.source) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="ods-links">' +
            '<h3 class="ods-links-title" data-anim="text">' + t(c.connectionTitle) + '</h3>' +
            '<ol class="ods-points">' +
              each((c.points || []).slice(0, 3), function (p, i) {
                return '<li class="ods-point" data-step="' + (i + 1) + '" data-step-mode="dim">' +
                  '<span class="leaf" aria-hidden="true"></span>' +
                  '<div><h4>' + t(p.title) + '</h4><p>' + t(p.text) + '</p></div>' +
                '</li>';
              }) +
            '</ol>' +
          '</div>' +
        '</div>';
    }
  };

  /* --------------------------------------------------------- persona */
  L.persona = {
    render: function (s) {
      var c = s.content || {};
      var tabs = c.tabs || [];
      return ui.decor('vines') +
        '<div class="slide-inner persona">' +
          '<figure class="persona-portrait" data-anim="card" style="--i:0">' + ui.media(s.media, { fit: 'cover' }) + '</figure>' +
          '<div class="persona-main">' +
            '<h2 class="t-title persona-label" data-anim="title">' + t(s.title) + '</h2>' +
            '<p class="persona-name" data-anim="text">' + t(c.name) + '</p>' +
            '<p class="persona-desc" data-anim="text">' + t(c.descriptor) + '</p>' +
            '<blockquote class="persona-quote" data-anim="text">' + t(c.quote) + '</blockquote>' +
            '<div class="persona-tabs" data-anim="card" style="--i:2">' +
              '<div class="tablist" role="tablist" aria-label="Detalhes da persona">' +
                each(tabs, function (tb, i) {
                  return '<button role="tab" class="tab" id="' + s.id + '-tab-' + i + '" aria-controls="' + s.id + '-panel-' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t(tb.label) + '</button>';
                }) +
              '</div>' +
              each(tabs, function (tb, i) {
                return '<div role="tabpanel" class="tabpanel" id="' + s.id + '-panel-' + i + '" aria-labelledby="' + s.id + '-tab-' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
                  '<ul>' + each(tb.items, function (it) { return '<li>' + t(it) + '</li>'; }) + '</ul></div>';
              }) +
            '</div>' +
          '</div>' +
        '</div>';
    },
    mount: function (el) { bindTabs(el); },
    reset: function (el) { selectTab(el, 0); }
  };

  function selectTab(el, idx) {
    var tabs = el.querySelectorAll('[role="tab"]'), panels = el.querySelectorAll('[role="tabpanel"]');
    Array.prototype.forEach.call(tabs, function (tb, i) {
      tb.setAttribute('aria-selected', String(i === idx));
      tb.tabIndex = i === idx ? 0 : -1;
    });
    Array.prototype.forEach.call(panels, function (p, i) { p.hidden = i !== idx; });
  }
  function bindTabs(el) {
    var list = el.querySelector('[role="tablist"]'); if (!list) return;
    list.addEventListener('click', function (e) {
      var tb = e.target.closest('[role="tab"]'); if (!tb) return;
      selectTab(el, Array.prototype.indexOf.call(list.children, tb));
    });
    list.addEventListener('keydown', function (e) {
      if (['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].indexOf(e.key) < 0) return;
      var tabs = list.querySelectorAll('[role="tab"]');
      var cur = Array.prototype.findIndex.call(tabs, function (x) { return x.getAttribute('aria-selected') === 'true'; });
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length-1 : (cur + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(el, n); tabs[n].focus(); e.preventDefault();
    });
  }
  window.Deck.ui.bindTabs = bindTabs;

  /* ---------------------------------------------------- antes/depois */
  L.beforeAfter = {
    render: function (s) {
      var c = s.content || {}, b = c.before || {}, a = c.after || {};
      function side(x, cls) {
        return '<section class="ba-side ' + cls + '" data-anim="card">' +
          '<h3 class="ba-label">' + t(x.label) + '</h3>' +
          '<p class="ba-title">' + t(x.title) + '</p>' +
          '<ul>' + each(x.points, function (p) { return '<li>' + t(p) + '</li>'; }) + '</ul>' +
        '</section>';
      }
      return ui.decor('vines') +
        '<div class="slide-inner ba">' +
          ui.header(s, null) +
          '<div class="ba-body">' +
            side(b, 'is-before') +
            '<div class="ba-compare" data-anim="card" style="--pos:50%">' +
              '<div class="ba-layer ba-after">' + ui.media(a.image) + '<span class="ba-tag">' + t(a.label) + '</span></div>' +
              '<div class="ba-layer ba-before">' + ui.media(b.image) + '<span class="ba-tag">' + t(b.label) + '</span></div>' +
              '<div class="ba-handle" aria-hidden="true"><span class="knob"><img src="assets/icons/drag.svg" alt=""></span></div>' +
              '<input class="ba-range" type="range" min="0" max="100" value="50" step="1" aria-label="Comparar antes e depois: arraste ou use as setas">' +
            '</div>' +
            side(a, 'is-after') +
          '</div>' +
          '<div class="ba-buttons" data-anim="text">' +
            '<button class="btn" data-ba="100">' + t(b.label) + '</button>' +
            '<button class="btn" data-ba="50">Comparar</button>' +
            '<button class="btn" data-ba="0">' + t(a.label) + '</button>' +
          '</div>' +
        '</div>';
    },
    mount: function (el) {
      var box = el.querySelector('.ba-compare'), range = el.querySelector('.ba-range');
      function set(v) {
        v = Math.max(0, Math.min(100, +v));
        range.value = v;
        box.style.setProperty('--pos', v + '%');
        el.style.setProperty('--before-w', (0.35 + 0.65 * v / 100).toFixed(3));
        el.style.setProperty('--after-w', (0.35 + 0.65 * (100 - v) / 100).toFixed(3));
      }
      el._baSet = set;
      range.addEventListener('input', function () { set(range.value); });
      el.querySelector('.ba-buttons').addEventListener('click', function (e) {
        var b = e.target.closest('[data-ba]'); if (b) set(b.getAttribute('data-ba'));
      });
      set(50);
    },
    reset: function (el) { if (el._baSet) el._baSet(50); },
    escape: function (el) {
      var r = el.querySelector('.ba-range');
      if (r && +r.value !== 50) { el._baSet(50); return true; }
      return false;
    }
  };

  /* ------------------------------------------------------- wireframe */
  L.wireframe = {
    render: function (s) {
      var c = s.content || {}, screens = c.screens || [];
      var first = screens[0] || {};
      return ui.decor('blob') +
        '<div class="slide-inner wf'+(screens.length>1?' wf-multi':'')+'" style="--screen-count:'+screens.length+'">' +
          '<div class="wf-intro">' +
            ui.header(s, c.lead) +
            '<p class="wf-hint" data-anim="text">Clique na tela em destaque para ampliar.</p>' +
          '</div>' +
          '<button class="wf-feature" data-anim="card" style="--i:0" aria-label="Ampliar tela">' +
            '<span class="wf-frame">' + ui.media(first, { fit: first.fit || 'cover' }) + '</span>' +
            '<span class="wf-cap" aria-live="polite"><strong>' + t(first.title) + '</strong><span>' + t(first.caption) + '</span></span>' +
          '</button>' +
          '<ul class="wf-thumbs" aria-label="Telas">' +
            each(screens, function (sc, i) {
              return '<li><button class="wf-thumb" data-i="' + i + '" aria-pressed="' + (i === 0) + '">' +
                '<span class="wf-mini">' + ui.media(sc, { fit: sc.fit || 'cover' }) + '</span>' +
                '<span class="wf-thumb-t">' + t(sc.title) + '</span></button></li>';
            }) +
          '</ul>' +
        '</div>';
    },
    mount: function (el, s) {
      var screens = (s.content || {}).screens || [];
      var feature = el.querySelector('.wf-feature');
      function pick(i) {
        var sc = screens[i] || {};
        el._wfIndex = i;
        feature.querySelector('.wf-frame').innerHTML = ui.media(sc, { fit: sc.fit || 'cover' });
        feature.querySelector('.wf-cap').innerHTML = '<strong>' + t(sc.title) + '</strong><span>' + t(sc.caption) + '</span>';
        feature.setAttribute('aria-label', 'Ampliar: ' + (sc.title || 'tela'));
        if (window.Deck.cinema) window.Deck.cinema.swap(feature.querySelector('.wf-frame'));
        Array.prototype.forEach.call(el.querySelectorAll('.wf-thumb'), function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      }
      el._wfPick = pick;
      el.querySelector('.wf-thumbs').addEventListener('click', function (e) {
        var b = e.target.closest('.wf-thumb'); if (b) pick(+b.getAttribute('data-i'));
      });
      feature.addEventListener('click', function () {
        var sc = screens[el._wfIndex || 0] || {};
        var opts = { title: sc.title || 'Tela', alt: sc.alt || sc.title, origin: feature };
        if (sc.src) opts.src = sc.src;
        else { opts.node = ui.placeholder(sc.alt || sc.title, '', { width: 1200, height: 750 }); opts.width = 1200; opts.height = 750; }
        window.Deck.modal.open(opts);
      });
      pick(0);
    },
    reset: function (el) { if (el._wfPick) el._wfPick(0); }
  };

  /* ----------------------------------------------------------- retro */
  L.retro = {
    hint: 'Espaço revela a próxima coluna',
    render: function (s) {
      var c = s.content || {};
      var marks = ['circle', 'arch', 'wave'];
      return ui.decor('whiplash') +
        '<div class="slide-inner retro">' +
          ui.header(s, null) +
          '<div class="retro-cols">' +
            each(c.columns, function (col, i) {
              return '<section class="retro-col" data-step="' + (i + 1) + '" data-step-mode="dim">' +
                '<span class="retro-mark m-' + marks[i % 3] + '" aria-hidden="true"></span>' +
                '<h3>' + t(col.name) + '</h3>' +
                '<ul>' + each(col.items, function (it) { return '<li>' + t(it) + '</li>'; }) + '</ul>' +
              '</section>';
            }) +
          '</div>' +
        '</div>';
    }
  };

  /* --------------------------------------------------------- closing */
  L.closing = {
    render: function (s) {
      var c = s.content || {};
      var team = (window.DECK && window.DECK.team) || [];
      return ui.decor('stem') +
        '<div class="slide-inner closing">' +
          '<section class="closing-next">' +
            '<h2 class="t-title" data-anim="title">' + t(c.stepsTitle) + '</h2>' +
            '<ol class="timeline">' +
              each(c.steps, function (st, i) {
                return '<li data-anim="card" style="--i:' + i + '">' +
                  '<span class="tl-dot" aria-hidden="true"></span>' +
                  '<span class="tl-when">' + t(st.when) + '</span>' +
                  '<span class="tl-text">' + t(st.text) + '</span></li>';
              }) +
            '</ol>' +
          '</section>' +
          '<section class="closing-thanks" data-anim="card" style="--i:3">' +
            '<p class="thanks">' + t(c.thanks) + '</p>' +
            '<p class="closing-brand">' + t(window.DECK.project) + ' · <em>' + t(window.DECK.product) + '</em></p>' +
            '<ul class="closing-team">' + each(team, function (n) { return '<li>' + esc(n) + '</li>'; }) + '</ul>' +
            '<p class="closing-contact">' + t(c.contact) + '</p>' +
          '</section>' +
        '</div>';
    }
  };
})();
