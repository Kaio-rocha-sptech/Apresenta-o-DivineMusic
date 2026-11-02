/* =====================================================================
   LAYOUTS TÉCNICOS (Bauhaus) — kanban · tools · requirements · nfr · costs
   ===================================================================== */
(function () {
  'use strict';
  var L = window.Deck.layouts;
  var ui = window.Deck.ui;
  var t = ui.t, esc = ui.esc;
  var SHAPES = ['circle', 'square', 'half', 'triangle'];

  function each(list, fn) { return (list || []).map(fn).join(''); }
  function shape(i) { return '<span class="geo geo-' + SHAPES[i % SHAPES.length] + '" aria-hidden="true"></span>'; }

  /* seleção única dentro de um grupo de botões [data-sel] */
  function selectable(el, selector, onPick) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest(selector); if (!b || !el.contains(b)) return;
      var already = b.getAttribute('aria-pressed') === 'true';
      onPick(already ? -1 : +b.getAttribute('data-i'), b);
    });
  }
  function markPressed(el, selector, idx) {
    Array.prototype.forEach.call(el.querySelectorAll(selector), function (b) {
      b.setAttribute('aria-pressed', String(+b.getAttribute('data-i') === idx));
    });
    el.classList.toggle('has-selection', idx >= 0);
  }
  window.Deck.ui.selectable = selectable;
  window.Deck.ui.markPressed = markPressed;

  /* ---------------------------------------------------------- kanban */
  L.kanban = {
    render: function (s) {
      var c = s.content || {};
      var cols = c.columns || [];
      return ui.decor('corner') +
        '<div class="slide-inner kb">' +
          '<div class="kb-top">' + ui.header(s, c.lead) +
            '<div class="kb-view" role="group" aria-label="Visualização" data-anim="text">' +
              '<button class="btn" data-view="board" aria-pressed="true">Quadro</button>' +
              '<button class="btn" data-view="shot" aria-pressed="false">Ver captura</button>' +
            '</div>' +
          '</div>' +
          '<div class="kb-board" style="--cols:' + Math.max(cols.length, 1) + '">' +
            each(cols, function (col, i) {
              return '<button class="kb-col" data-i="' + i + '" aria-pressed="false" data-anim="card" style="--i:' + i + '">' +
                '<span class="kb-head">' + shape(i) + '<span class="kb-name">' + t(col.name) + '</span>' +
                '<span class="kb-count t-mono">' + (col.tasks || []).length + '</span></span>' +
                '<span class="kb-tasks">' + each(col.tasks, function (tk) { return '<span class="kb-task">' + t(tk) + '</span>'; }) + '</span>' +
              '</button>';
            }) +
          '</div>' +
          '<figure class="kb-shot" hidden>' + ui.media(s.media, { fit: 'contain' }) +
            '<figcaption>' + t(s.media && s.media.caption) + '</figcaption></figure>' +
        '</div>';
    },
    mount: function (el) {
      var board = el.querySelector('.kb-board'), shot = el.querySelector('.kb-shot');
      selectable(board, '.kb-col', function (i) { markPressed(board, '.kb-col', i); });
      el._kbView = function (v) {
        board.hidden = v !== 'board'; shot.hidden = v === 'board';
        Array.prototype.forEach.call(el.querySelectorAll('[data-view]'), function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v));
        });
      };
      el.querySelector('.kb-view').addEventListener('click', function (e) {
        var b = e.target.closest('[data-view]'); if (b) el._kbView(b.getAttribute('data-view'));
      });
    },
    reset: function (el) { el._kbView('board'); markPressed(el.querySelector('.kb-board'), '.kb-col', -1); },
    escape: function (el) {
      var board = el.querySelector('.kb-board');
      if (board.classList.contains('has-selection') || board.hidden) { this.reset(el); return true; }
      return false;
    }
  };

  /* ----------------------------------------------------------- tools */
  L.tools = {
    render: function (s) {
      var c = s.content || {};
      return ui.decor('grid') +
        '<div class="slide-inner tools">' +
          '<div class="tools-side">' +
            ui.header(s, c.hint) +
            '<section class="tools-detail" aria-live="polite" data-anim="text"></section>' +
          '</div>' +
          '<ul class="tools-grid">' +
            each(c.tools, function (tl, i) {
              return '<li><button class="tool" data-i="' + i + '" aria-pressed="false" data-anim="card" style="--i:' + i + '">' +
                '<span class="tool-icon">' + ui.icon(tl.icon) + '</span>' +
                '<span class="tool-name">' + t(tl.name) + '</span>' +
                '<span class="tool-cat">' + t(tl.category) + '</span>' +
                shape(i) +
              '</button></li>';
            }) +
          '</ul>' +
        '</div>';
    },
    mount: function (el, s) {
      var tools = (s.content || {}).tools || [];
      var grid = el.querySelector('.tools-grid'), detail = el.querySelector('.tools-detail');
      function show(i) {
        markPressed(grid, '.tool', i);
        if (i < 0) {
          detail.innerHTML = '<p class="tools-empty">' + tools.length + ' ferramentas. Selecione uma para ver o papel dela no projeto.</p>';
          return;
        }
        var tl = tools[i];
        detail.innerHTML = '<h3>' + t(tl.name) + '</h3><p class="tools-cat">' + t(tl.category) + '</p><p class="tools-use">' + t(tl.use) + '</p>';
      }
      el._show = show;
      selectable(grid, '.tool', show);
      show(-1);
    },
    reset: function (el) { el._show(-1); },
    escape: function (el) { if (el.querySelector('.tools-grid').classList.contains('has-selection')) { el._show(-1); return true; } return false; }
  };

  /* ---------------------------------------------------- requirements */
  L.requirements = {
    hint: 'Espaço revela a próxima categoria',
    render: function (s) {
      var c = s.content || {};
      return ui.decor('grid') +
        '<div class="slide-inner req">' +
          ui.header(s, c.lead) +
          '<div class="req-list">' +
            each(c.categories, function (cat, i) {
              return '<section class="req-cat" data-step="' + (i + 1) + '" data-step-mode="dim">' +
                '<h3>' + shape(i) + '<span>' + t(cat.name) + '</span></h3>' +
                '<ul>' + each(cat.items, function (it) {
                  return '<li><span class="req-id t-mono">' + esc(it.id) + '</span><span>' + t(it.text) + '</span></li>';
                }) + '</ul>' +
              '</section>';
            }) +
          '</div>' +
        '</div>';
    }
  };

  /* ------------------------------------------------------------- nfr */
  L.nfr = {
    render: function (s) {
      var c = s.content || {};
      return ui.decor('corner') +
        '<div class="slide-inner nfr">' +
          '<div class="nfr-side">' +
            ui.header(s, c.lead) +
            '<section class="nfr-detail" aria-live="polite" data-anim="text"></section>' +
          '</div>' +
          '<ul class="nfr-grid">' +
            each(c.cards, function (cd, i) {
              return '<li><button class="nfr-card" data-i="' + i + '" aria-pressed="false" data-anim="card" style="--i:' + i + '">' +
                '<span class="nfr-id t-mono">' + esc(cd.id) + '</span>' + shape(i) +
                '<span class="nfr-title">' + t(cd.title) + '</span>' +
                '<span class="nfr-crit">' + t(cd.criterion) + '</span>' +
              '</button></li>';
            }) +
          '</ul>' +
        '</div>';
    },
    mount: function (el, s) {
      var cards = (s.content || {}).cards || [];
      var grid = el.querySelector('.nfr-grid'), detail = el.querySelector('.nfr-detail');
      function show(i) {
        markPressed(grid, '.nfr-card', i);
        if (i < 0) { detail.innerHTML = '<p class="nfr-empty">Selecione um critério para ver o detalhe.</p>'; return; }
        var cd = cards[i];
        detail.innerHTML = '<p class="nfr-d-id t-mono">' + esc(cd.id) + '</p><h3>' + t(cd.title) + '</h3>' +
          '<dl><dt>Como medir</dt><dd>' + t(cd.criterion) + '</dd><dt>Detalhe</dt><dd>' + t(cd.detail) + '</dd></dl>';
      }
      el._show = show;
      selectable(grid, '.nfr-card', show);
      show(-1);
    },
    reset: function (el) { el._show(-1); },
    escape: function (el) { if (el.querySelector('.nfr-grid').classList.contains('has-selection')) { el._show(-1); return true; } return false; }
  };

  /* ----------------------------------------------------------- costs */
  function money(v, cur) {
    return (cur ? cur + ' ' : '') + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  L.costs = {
    hint: 'Espaço revela o próximo item',
    render: function (s) {
      var c = s.content || {}, items = c.items || [];
      var known = items.every(function (it) { return typeof it.value === 'number' && isFinite(it.value); });
      var total = known ? items.reduce(function (a, it) { return a + it.value; }, 0) : null;
      var n = items.length;
      var bar = known && total > 0
        ? '<div class="cost-bar" role="img" aria-label="Composição dos custos">' + each(items, function (it, i) {
            return '<span class="seg seg-' + (i % 4) + '" style="flex:' + it.value + '" title="' + esc(it.label) + '"></span>';
          }) + '</div>'
        : '<div class="cost-bar is-empty"><span>A composição aparece quando todos os valores forem preenchidos</span></div>';
      return ui.decor('blocks') +
        '<div class="slide-inner costs">' +
          ui.header(s, c.lead) +
          '<div class="costs-body">' +
            '<table class="cost-table">' +
              '<caption class="sr-only">Itens de custo</caption>' +
              '<thead><tr><th scope="col">Item</th><th scope="col">Premissa</th><th scope="col" class="num">Valor ' + t(c.period) + '</th></tr></thead>' +
              '<tbody>' + each(items, function (it, i) {
                var val = typeof it.value === 'number' ? money(it.value, c.currency) : '<mark class="ph">' + esc(c.currency || '') + ' [valor]</mark>';
                return '<tr data-step="' + (i + 1) + '" data-step-mode="dim"><th scope="row">' + t(it.label) + '</th><td>' + t(it.note) + '</td><td class="num t-mono">' + val + '</td></tr>';
              }) + '</tbody>' +
            '</table>' +
            '<aside class="cost-total" data-step="' + (n + 1) + '">' +
              '<p class="cost-total-label">' + t(c.totalLabel) + '</p>' +
              '<p class="cost-total-value t-mono">' + (known ? money(total, c.currency) : '<mark class="ph">' + esc(c.currency || '') + ' [total]</mark>') + '</p>' +
              '<p class="cost-total-period">' + t(c.period) + '</p>' +
              bar +
            '</aside>' +
          '</div>' +
          '<p class="costs-source" data-anim="text">Fonte: ' + t(c.source) + '</p>' +
        '</div>';
    }
  };
})();
