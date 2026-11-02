/* =====================================================================
   SLIDE-RENDERER.JS — transforma content/slides.js em slides na tela
   Os layouts ficam em slides/components/*.js e se registram em
   Deck.layouts['nome'] = { render, mount, enter, reset, escape }.
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck = window.Deck || {};
  Deck.layouts = Deck.layouts || {};

  /* ---------- utilitários de texto ---------- */
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  /* escapa e destaca lacunas "[...]" como placeholders visíveis */
  function t(s) {
    return escapeHTML(s).replace(/\[([^\]]+)\]/g, '<mark class="ph" title="Lacuna a preencher em content/slides.js">[$1]</mark>');
  }
  function isPlaceholder(s) { return /^\s*\[[^\]]*\]\s*$/.test(String(s || '')); }

  var ui = Deck.ui = {
    esc: escapeHTML,
    t: t,
    isPlaceholder: isPlaceholder,

    /* Enquadramento nativo: o bitmap original fica intacto. */
    portrait: function (photo, className, alt, avatar) {
      if (!photo || !photo.src) return '';
      var r = avatar ? photo.avatar : photo.crop, size = photo.imageSize;
      return '<span class="photo-crop ' + escapeHTML(className || '') + '" style="--photo-ratio:' + r[2] + '/' + r[3] + '"' + (avatar ? ' aria-hidden="true"' : '') + '>' +
        '<img src="' + escapeHTML(photo.src) + '" alt="' + escapeHTML(alt || '') + '" decoding="async" style="width:' + (100 * size[0] / r[2]) + '%;left:' + (-100 * r[0] / r[2]) + '%;top:' + (-100 * r[1] / r[3]) + '%">' +
        '</span>';
    },

    /* placeholder de mídia como elemento */
    placeholder: function (desc, path, opts) {
      opts = opts || {};
      var d = document.createElement('div');
      d.className = 'media-ph';
      if (opts.width) { d.style.position = 'relative'; d.style.width = opts.width + 'px'; d.style.height = opts.height + 'px'; }
      d.innerHTML = ui.placeholderHTML(desc, path);
      return d;
    },
    placeholderHTML: function (desc, path) {
      return '<img src="assets/icons/image.svg" alt="" width="40" height="40" class="ph-icon">' +
        '<strong>Inserir imagem</strong>' +
        '<span>' + escapeHTML(desc || 'imagem') + '</span>' +
        (path ? '<code>' + escapeHTML(path) + ' (não encontrado)</code>' : '<code>media.src em content/slides.js</code>');
    },

    /* bloco de mídia: imagem real ou placeholder elegante */
    media: function (m, opts) {
      m = m || {}; opts = opts || {};
      var cls = 'media' + (opts.className ? ' ' + opts.className : '');
      var fit = m.fit || opts.fit || 'cover';
      if (!m.src) {
        return '<div class="' + cls + '"><div class="media-ph">' + ui.placeholderHTML(m.alt || m.caption) + '</div></div>';
      }
      return '<div class="' + cls + '" style="--fit:' + escapeHTML(fit) + '">' +
        '<img src="' + escapeHTML(m.src) + '" alt="' + escapeHTML(m.alt || '') + '" data-fallback="' + escapeHTML(m.alt || m.caption || '') + '" loading="eager" decoding="async">' +
        '</div>';
    },

    icon: function (src, cls) {
      return '<img class="icon ' + (cls || '') + '" src="' + escapeHTML(src || 'assets/icons/tool.svg') + '" alt="" aria-hidden="true">';
    },

    /* cabeçalho padrão: título + texto de apoio opcional */
    header: function (slide, lead, opts) {
      opts = opts || {};
      return '<header class="s-head ' + (opts.className || '') + '">' +
        '<h2 class="t-title" data-anim="title">' + t(opts.title || slide.title) + '</h2>' +
        (lead ? '<p class="t-lead" data-anim="text">' + t(lead) + '</p>' : '') +
        '</header>';
    },

    /* trecho JSON formatado e escapado */
    json: function (obj) {
      if (obj === null || obj === undefined) return '<span class="j-muted">— sem corpo —</span>';
      var s = JSON.stringify(obj, null, 2);
      return escapeHTML(s)
        .replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="j-key">$1</span>$2')
        .replace(/:\s(&quot;.*?&quot;)/g, ': <span class="j-str">$1</span>')
        .replace(/:\s(-?\d+(\.\d+)?)/g, ': <span class="j-num">$1</span>');
    }
  };

  /* imagens que falham viram placeholder (nunca ícone quebrado) */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-fallback')) return;
    var box = img.parentNode;
    var ph = document.createElement('div');
    ph.className = 'media-ph';
    ph.innerHTML = ui.placeholderHTML(img.getAttribute('data-fallback'), img.getAttribute('src'));
    box.replaceChild(ph, img);
  }, true);

  /* ---------- ornamentos de fundo (SVG leve, sem interação) ---------- */
  var DECOR = {
    /* Art Nouveau: linha em chicote + forma orgânica (fica acima do rodapé) */
    whiplash:
      '<path class="drift" d="M1500 -60 C 1780 120 1980 300 1960 620 C 1940 900 1700 1000 1560 1140 L 2000 1140 L 2000 -60 Z" fill="var(--shape-1)" opacity=".55"/>' +
      '<path data-anim="draw" style="--len:2600" d="M-40 900 C 260 760 420 1010 700 900 C 980 790 900 560 1180 500 C 1460 440 1560 640 1820 520 C 1900 484 1940 430 1960 380" fill="none" stroke="var(--shape-2)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M-40 948 C 270 820 430 985 710 928" fill="none" stroke="var(--shape-2)" stroke-width="1.2" opacity=".6"/>',
    /* arcos concêntricos (moldura de cartaz) — use só em slides com a direita livre */
    arches:
      '<path d="M1360 1140 V 520 A 260 260 0 0 1 1880 520 V 1140" fill="none" stroke="var(--shape-2)" stroke-width="2" opacity=".75"/>' +
      '<path d="M1392 1140 V 530 A 228 228 0 0 1 1848 530 V 1140" fill="none" stroke="var(--shape-2)" stroke-width="1" opacity=".5"/>',
    /* vinha no topo + forma orgânica no canto */
    vines:
      '<path data-anim="draw" style="--len:2400" d="M-20 46 C 300 6 520 86 820 40 S 1360 -10 1600 36 S 1880 70 1960 40" fill="none" stroke="var(--shape-2)" stroke-width="2" stroke-linecap="round" opacity=".9"/>' +
      '<path class="drift" d="M-80 -80 C 220 -40 360 120 300 300 C 240 470 40 520 -80 470 Z" fill="var(--shape-1)" opacity=".5"/>',
    /* só a forma orgânica do canto */
    blob:
      '<path class="drift" d="M-80 -80 C 220 -40 360 120 300 300 C 240 470 40 520 -80 470 Z" fill="var(--shape-1)" opacity=".5"/>',
    /* haste com folhas na margem direita */
    stem:
      '<path data-anim="draw" style="--len:1200" d="M1858 960 C 1820 760 1900 600 1856 420 C 1820 280 1880 180 1860 90" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M1856 420 C 1890 400 1906 370 1904 340 C 1874 352 1858 382 1856 420 Z" fill="var(--color-gold)" opacity=".85"/>' +
      '<path d="M1846 640 C 1812 624 1800 594 1804 566 C 1832 578 1846 606 1846 640 Z" fill="var(--color-gold)" opacity=".7"/>' +
      '<path d="M1866 200 C 1896 186 1906 160 1902 136 C 1878 146 1866 172 1866 200 Z" fill="var(--color-gold)" opacity=".6"/>' +
      '<path class="drift" d="M-80 -80 C 220 -40 360 120 300 300 C 240 470 40 520 -80 470 Z" fill="var(--shape-1)" opacity=".35"/>',
    /* Bauhaus: quarto de círculo, quadrado e barra — dentro da margem direita */
    corner:
      '<path d="M1920 0 V 150 A 150 150 0 0 1 1770 0 Z" fill="var(--shape-1)" opacity=".45"/>' +
      '<rect x="1844" y="190" width="24" height="24" fill="var(--color-gold)"/>' +
      '<rect x="1876" y="236" width="8" height="110" fill="var(--color-accent)" opacity=".85"/>',
    /* Bauhaus: grade fina + semicírculo na margem */
    grid:
      '<g stroke="var(--color-line)" stroke-width="1" opacity=".08">' +
        '<path d="M128 0V1080M448 0V1080M768 0V1080M1088 0V1080M1408 0V1080M1792 0V1080"/>' +
        '<path d="M0 80H1920M0 360H1920M0 640H1920M0 920H1920"/>' +
      '</g>' +
      '<path d="M1920 800 A 120 120 0 0 0 1920 1040 Z" fill="var(--shape-1)" opacity=".45"/>' +
      '<rect x="1844" y="64" width="24" height="24" fill="var(--color-gold)"/>',
    /* Bauhaus sobre claro — na margem direita */
    blocks:
      '<rect x="1800" y="0" width="120" height="120" fill="var(--color-sage)" opacity=".4"/>' +
      '<path d="M1800 120 A 60 60 0 0 1 1920 120 Z" fill="var(--color-gold)" opacity=".9"/>' +
      '<circle cx="1860" cy="560" r="14" fill="var(--color-accent)"/>',
    none: ''
  };
  ui.decor = function (name) {
    var d = DECOR[name];
    if (!d) return '';
    return '<svg class="decor" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + d + '</svg>';
  };

  /* ---------- layout de reserva (quando o layout não existe) ---------- */
  Deck.layouts.basic = {
    render: function (s) {
      var c = s.content || {};
      var bullets = (c.bullets || []).map(function (b, i) { return '<li data-anim="text" style="--i:' + i + '">' + t(b) + '</li>'; }).join('');
      return ui.decor('vines') +
        '<div class="slide-inner l-basic">' + ui.header(s, c.subtitle || c.lead) +
        (bullets ? '<ul class="t-body">' + bullets + '</ul>' : '') + '</div>';
    }
  };

  /* ---------- monta todos os slides ---------- */
  Deck.renderAll = function (container, slides) {
    container.innerHTML = '';
    var els = [];
    slides.forEach(function (s, i) {
      var el = document.createElement('section');
      var layout = Deck.layouts[s.layout] || Deck.layouts.basic;
      if (!Deck.layouts[s.layout]) console.warn('[deck] layout desconhecido "' + s.layout + '" em ' + s.id + ' — usando "basic".');
      el.className = 'slide l-' + (s.layout || 'basic');
      el.id = s.id;
      el.setAttribute('data-surface', s.surface || 'forest');
      el.setAttribute('data-style', s.style || 'bauhaus');
      el.setAttribute('role', 'group');
      el.setAttribute('aria-roledescription', 'slide');
      el.setAttribute('aria-label', (i + 1) + ' de ' + slides.length + ': ' + (s.title || ''));
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('inert', '');
      try {
        el.innerHTML = layout.render(s, ui, i);
        if (layout.mount) layout.mount(el, s, ui);
      } catch (err) {
        console.error('[deck] erro ao montar ' + s.id, err);
        el.innerHTML = Deck.layouts.basic.render(s, ui, i);
      }
      // numera entradas animadas para o escalonamento
      ['text', 'card'].forEach(function (kind) {
        Array.prototype.forEach.call(el.querySelectorAll('[data-anim="' + kind + '"]'), function (n, k) {
          if (!n.style.getPropertyValue('--i')) n.style.setProperty('--i', k);
        });
      });
      container.appendChild(el);
      els.push(el);
    });
    return els;
  };
})();
