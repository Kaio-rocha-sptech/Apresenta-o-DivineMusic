/* =====================================================================
   DIAGRAMAS — der · flow · architecture
   Pontos clicáveis são elementos HTML posicionados por porcentagem
   (x, y em content/slides.js). Assim o diagrama pode ser qualquer
   imagem (.svg/.png) exibida em <img>, sem depender de IDs internos.
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck;
  var L = Deck.layouts, ui = Deck.ui;
  var t = ui.t, esc = ui.esc;
  function each(list, fn) { return (list || []).map(fn).join(''); }

  /* ------------------------------------------------------------- DER */
  L.der = {
    render: function (s) {
      var c = s.content || {}, m = s.media || {};
      var img = m.src
        ? '<img class="der-img" src="' + esc(m.src) + '" alt="' + esc(m.alt || '') + '" data-fallback="' + esc(m.alt || 'DER') + '">'
        : '<div class="media-ph">' + ui.placeholderHTML(m.alt || 'DER') + '</div>';
      return ui.decor('blocks') +
        '<div class="slide-inner der">' +
          '<div class="der-side">' +
            ui.header(s, c.lead) +
            '<section class="der-detail" aria-live="polite" data-anim="text"></section>' +
            '<button class="btn der-zoom" data-anim="text"><img src="assets/icons/zoom.svg" alt="" class="on-light-icon">Ampliar diagrama</button>' +
          '</div>' +
          '<figure class="der-stage" data-anim="card">' +
            '<div class="der-canvas">' + img +
              each(c.entities, function (en, i) {
                return '<button class="hotspot" data-i="' + i + '" aria-pressed="false" style="left:' + (+en.x) + '%;top:' + (+en.y) + '%">' +
                  '<span class="hs-dot" aria-hidden="true"></span><span class="hs-label">' + t(en.label) + '</span></button>';
              }) +
            '</div>' +
            (m.caption ? '<figcaption>' + t(m.caption) + '</figcaption>' : '') +
          '</figure>' +
        '</div>';
    },
    mount: function (el, s) {
      var c = s.content || {}, ents = c.entities || [];
      var stage = el.querySelector('.der-stage'), canvas = el.querySelector('.der-canvas');
      var detail = el.querySelector('.der-detail');
      var img = canvas.querySelector('img');
      function fitCanvas() {
        var W = 1080, H = 700;
        var iw = img && img.naturalWidth ? img.naturalWidth : 16, ih = img && img.naturalHeight ? img.naturalHeight : 10;
        var k = Math.min(W / iw, H / ih);
        canvas.style.width = Math.round(iw * k) + 'px';
        canvas.style.height = Math.round(ih * k) + 'px';
      }
      if (img) { if (img.complete) fitCanvas(); img.addEventListener('load', fitCanvas); } else fitCanvas();
      function show(i) {
        ui.markPressed(canvas, '.hotspot', i);
        if (i < 0) { detail.innerHTML = '<p class="der-empty">' + ents.length + ' entidades destacadas. Selecione uma no diagrama.</p>'; return; }
        var en = ents[i];
        detail.innerHTML = '<h3>' + t(en.label) + '</h3><dl><dt>Armazena</dt><dd>' + t(en.description) + '</dd><dt>Relacionamentos</dt><dd>' + t(en.relations) + '</dd></dl>';
      }
      el._show = show;
      ui.selectable(canvas, '.hotspot', show);
      show(-1);
      el.querySelector('.der-zoom').addEventListener('click', function (e) {
        var clone = canvas.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('button'), function (b) { b.setAttribute('tabindex', '-1'); b.setAttribute('aria-hidden', 'true'); });
        clone.classList.add('is-zoom-clone');
        Deck.modal.open({ title: s.title + ' — ' + (s.media.alt || ''), node: clone, width: canvas.offsetWidth, height: canvas.offsetHeight, origin: e.currentTarget });
      });
    },
    reset: function (el) { el._show(-1); },
    escape: function (el) { if (el.querySelector('.der-canvas').classList.contains('has-selection')) { el._show(-1); return true; } return false; }
  };

  /* ------------------------------------------------------------ flow */
  L.flow = {
    hint: 'Espaço avança uma etapa',
    render: function (s) {
      var c = s.content || {}, steps = c.steps || [];
      return ui.decor('grid') +
        '<div class="slide-inner flow">' +
          ui.header(s, c.lead) +
          '<ol class="flow-track" style="--n:' + steps.length + '">' +
            '<li class="flow-line" aria-hidden="true"><span class="flow-line-fill"></span></li>' +
            each(steps, function (st, i) {
              return '<li class="flow-step" data-step="' + (i + 1) + '" data-step-mode="dim">' +
                '<button class="flow-node" data-i="' + i + '" aria-label="Etapa ' + (i + 1) + ': ' + esc(st.title) + '">' +
                  '<span class="t-mono">' + (i + 1) + '</span></button>' +
                '<h3>' + t(st.title) + '</h3>' +
                '<p class="flow-actor">' + t(st.actor) + '</p>' +
                '<p class="flow-text">' + t(st.text) + '</p>' +
              '</li>';
            }) +
          '</ol>' +
        '</div>';
    },
    mount: function (el) {
      el.querySelector('.flow-track').addEventListener('click', function (e) {
        var b = e.target.closest('.flow-node'); if (!b) return;
        Deck.setStep(+b.getAttribute('data-i') + 1);
      });
    },
    onStep: function (el, s, n) {
      var total = ((s.content || {}).steps || []).length;
      var p = total > 1 ? Math.max(0, n - 1) / (total - 1) : (n ? 1 : 0);
      el.querySelector('.flow-track').style.setProperty('--flow-p', p);
      Array.prototype.forEach.call(el.querySelectorAll('.flow-step'), function (li, i) {
        li.classList.toggle('is-current', i === n - 1);
      });
    }
  };

  /* ---------------------------------------------------- architecture */
  var AW = 1080, AH = 760;
  L.architecture = {
    render: function (s) {
      var c = s.content || {}, nodes = c.nodes || [], edges = c.edges || [];
      var byId = {};
      nodes.forEach(function (n) { byId[n.id] = n; });
      function px(n) { return { x: (+n.x / 100) * AW, y: (+n.y / 100) * AH }; }
      var lines = each(edges, function (e, i) {
        var a = byId[e.from], b = byId[e.to]; if (!a || !b) return '';
        var p = px(a), q = px(b);
        return '<line class="edge" data-e="' + i + '" x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '"/>' +
               '<line class="edge-flow" data-e="' + i + '" x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '"/>';
      });
      var labels = each(edges, function (e, i) {
        var a = byId[e.from], b = byId[e.to]; if (!a || !b || !e.label) return '';
        var p = px(a), q = px(b);
        return '<span class="edge-label t-mono" data-e="' + i + '" style="left:' + ((p.x + q.x) / 2) + 'px;top:' + ((p.y + q.y) / 2) + 'px">' + t(e.label) + '</span>';
      });
      return ui.decor('grid') +
        '<div class="slide-inner arch">' +
          '<div class="arch-side">' +
            ui.header(s, c.lead) +
            '<section class="arch-detail" aria-live="polite" data-anim="text"></section>' +
            '<button class="btn arch-zoom" data-anim="text"><img src="assets/icons/zoom.svg" alt="">Ampliar</button>' +
          '</div>' +
          '<div class="arch-stage" data-anim="card" style="width:' + AW + 'px;height:' + AH + 'px">' +
            '<svg class="arch-edges" viewBox="0 0 ' + AW + ' ' + AH + '" aria-hidden="true">' + lines + '</svg>' +
            labels +
            each(nodes, function (n, i) {
              var p = px(n);
              return '<button class="arch-node" data-i="' + i + '" data-id="' + esc(n.id) + '" aria-pressed="false" style="left:' + p.x + 'px;top:' + p.y + 'px">' +
                ui.icon(n.icon) +
                '<span class="an-label">' + t(n.label) + '</span>' +
                '<span class="an-tech t-mono">' + t(n.tech) + '</span>' +
              '</button>';
            }) +
          '</div>' +
        '</div>';
    },
    mount: function (el, s) {
      var c = s.content || {}, nodes = c.nodes || [], edges = c.edges || [];
      var stage = el.querySelector('.arch-stage'), detail = el.querySelector('.arch-detail');
      var byId = {}; nodes.forEach(function (n) { byId[n.id] = n; });
      function show(i) {
        ui.markPressed(stage, '.arch-node', i);
        var id = i >= 0 ? nodes[i].id : null;
        var related = {};
        Array.prototype.forEach.call(stage.querySelectorAll('[data-e]'), function (ln) {
          var e = edges[+ln.getAttribute('data-e')];
          var hot = !!id && (e.from === id || e.to === id);
          ln.classList.toggle('is-hot', hot);
          if (hot) { related[e.from === id ? e.to : e.from] = e.label; }
        });
        Array.prototype.forEach.call(stage.querySelectorAll('.arch-node'), function (b) {
          b.classList.toggle('is-related', !!related[b.getAttribute('data-id')] || related.hasOwnProperty(b.getAttribute('data-id')));
        });
        if (i < 0) { detail.innerHTML = '<p class="arch-empty">' + nodes.length + ' camadas. Selecione um nó para ver sua função e conexões.</p>'; return; }
        var n = nodes[i];
        var rel = Object.keys(related).map(function (k) {
          return '<li><span>' + t(byId[k] ? byId[k].label : k) + '</span>' + (related[k] ? '<span class="t-mono">' + t(related[k]) + '</span>' : '') + '</li>';
        }).join('');
        detail.innerHTML = '<h3>' + t(n.label) + '</h3><p class="arch-tech t-mono">' + t(n.tech) + '</p>' +
          '<p>' + t(n.description) + '</p>' + (rel ? '<p class="arch-rel-title">Conecta-se a</p><ul class="arch-rel">' + rel + '</ul>' : '');
      }
      el._show = show;
      ui.selectable(stage, '.arch-node', show);
      show(-1);
      el.querySelector('.arch-zoom').addEventListener('click', function (e) {
        var m = s.media || {};
        if (m.src) { Deck.modal.open({ title: m.alt || s.title, src: m.src, alt: m.alt, origin: e.currentTarget }); return; }
        var clone = stage.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll('button'), function (b) { b.setAttribute('tabindex', '-1'); });
        clone.removeAttribute('data-anim');
        Deck.modal.open({ title: s.title, node: clone, width: AW, height: AH, origin: e.currentTarget });
      });
    },
    reset: function (el) { el._show(-1); },
    escape: function (el) { if (el.querySelector('.arch-stage').classList.contains('has-selection')) { el._show(-1); return true; } return false; }
  };
})();
