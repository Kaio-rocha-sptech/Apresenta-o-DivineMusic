/* =====================================================================
   API + JWT — simulador de requisições e demonstração de token
   Tudo aqui é SIMULAÇÃO local: nenhum servidor é chamado.
   O JWT é gerado no navegador a partir dos dados FICTÍCIOS de
   content/slides.js (slide-15), com HMAC-SHA256 implementado abaixo.
   ===================================================================== */
(function () {
  'use strict';
  var Deck = window.Deck;
  var L = Deck.layouts, ui = Deck.ui;
  var t = ui.t, esc = ui.esc;
  function each(list, fn) { return (list || []).map(fn).join(''); }

  /* ================================================================ API */
  function statusClass(code) { return 's-' + String(code).charAt(0) + 'xx'; }

  L.api = {
    render: function (s) {
      var c = s.content || {};
      return ui.decor('grid') +
        '<div class="slide-inner api">' +
          '<div class="api-top">' + ui.header(s, c.lead) +
            (c.demo ? '<p class="demo-badge" data-anim="text"><img src="assets/icons/flask.svg" alt="">Demonstração · dados fictícios</p>' : '') +
          '</div>' +
          '<div class="api-body">' +
            '<ul class="api-list" aria-label="Endpoints">' +
              each(c.endpoints, function (ep, i) {
                return '<li><button class="api-ep" data-i="' + i + '" aria-pressed="false" data-anim="card" style="--i:' + i + '">' +
                  '<span class="method m-' + esc(String(ep.method).toLowerCase()) + '">' + esc(ep.method) + '</span>' +
                  '<span class="ep-path t-mono">' + t(ep.path) + '</span>' +
                  '<span class="ep-sum">' + t(ep.summary) + '</span>' +
                '</button></li>';
              }) +
            '</ul>' +
            '<section class="api-console" aria-live="polite" data-anim="card" style="--i:2">' +
              '<div class="api-line">' +
                '<span class="method"></span><span class="api-url t-mono"></span>' +
                '<button class="icon-btn api-reset" aria-label="Reiniciar simulação" title="Reiniciar"><img src="assets/icons/reset.svg" alt=""></button>' +
              '</div>' +
              '<div class="api-panes">' +
                '<div class="api-pane"><p class="pane-label">Requisição</p><pre class="code api-req"></pre></div>' +
                '<div class="api-pane"><p class="pane-label">Resposta <span class="api-status"></span></p><pre class="code api-res"></pre></div>' +
              '</div>' +
            '</section>' +
          '</div>' +
        '</div>';
    },
    mount: function (el, s) {
      var c = s.content || {}, eps = c.endpoints || [];
      var list = el.querySelector('.api-list');
      var $m = el.querySelector('.api-line .method'), $url = el.querySelector('.api-url');
      var $req = el.querySelector('.api-req'), $res = el.querySelector('.api-res'), $st = el.querySelector('.api-status');
      var timer = 0;
      function pick(i, instant) {
        if (i < 0) i = 0;
        clearTimeout(timer);
        ui.markPressed(list, '.api-ep', i);
        var ep = eps[i] || {};
        $m.textContent = ep.method || '';
        $m.className = 'method m-' + String(ep.method || '').toLowerCase();
        $url.innerHTML = t((c.baseUrl || '') + (ep.path || ''));
        $req.innerHTML = ui.json(ep.request);
        var done = function () {
          $st.className = 'api-status ' + statusClass(ep.status);
          $st.textContent = ep.status + ' ' + (ep.statusText || '');
          $res.classList.remove('is-loading');
          $res.innerHTML = ui.json(ep.response);
        };
        if (instant || Deck.motion.reduced()) return done();
        $st.className = 'api-status'; $st.textContent = 'aguardando…';
        $res.classList.add('is-loading');
        $res.innerHTML = '<span class="sk"></span><span class="sk w2"></span><span class="sk w3"></span>';
        timer = setTimeout(done, 420);
      }
      el._pick = pick;
      ui.selectable(list, '.api-ep', function (i, b) { pick(+b.getAttribute('data-i')); });
      el.querySelector('.api-reset').addEventListener('click', function () { pick(0, true); });
      pick(0, true);
    },
    reset: function (el) { el._pick(0, true); }
  };

  /* ================================================== SHA-256 / HMAC */
  var K = [], H0 = [];
  (function () {
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) >>> 0; }
    var n = 2, found = 0;
    while (found < 64) {
      var prime = true;
      for (var d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
      if (prime) { if (found < 8) H0[found] = frac(Math.sqrt(n)); K[found] = frac(Math.cbrt(n)); found++; }
      n++;
    }
  })();
  function ror(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256(bytes) {
    var l = bytes.length, total = Math.ceil((l + 9) / 64) * 64;
    var m = new Uint8Array(total); m.set(bytes); m[l] = 0x80;
    var dv = new DataView(m.buffer);
    dv.setUint32(total - 8, Math.floor((l * 8) / 4294967296));
    dv.setUint32(total - 4, (l * 8) >>> 0);
    var H = H0.slice(), w = new Uint32Array(64);
    for (var off = 0; off < total; off += 64) {
      var i;
      for (i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (i = 16; i < 64; i++) {
        var x = w[i - 15], y = w[i - 2];
        w[i] = (w[i - 16] + (ror(x, 7) ^ ror(x, 18) ^ (x >>> 3)) + w[i - 7] + (ror(y, 17) ^ ror(y, 19) ^ (y >>> 10))) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
        var t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    var out = new Uint8Array(32), odv = new DataView(out.buffer);
    for (var k = 0; k < 8; k++) odv.setUint32(k * 4, H[k]);
    return out;
  }
  function utf8(str) { return new TextEncoder().encode(str); }
  function concat(a, b) { var r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; }
  function hmac(keyStr, msgStr) {
    var key = utf8(keyStr), msg = utf8(msgStr);
    if (key.length > 64) key = sha256(key);
    var k = new Uint8Array(64); k.set(key);
    var ik = new Uint8Array(64), ok = new Uint8Array(64);
    for (var i = 0; i < 64; i++) { ik[i] = k[i] ^ 0x36; ok[i] = k[i] ^ 0x5c; }
    return sha256(concat(ok, sha256(concat(ik, msg))));
  }
  function b64url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function encodePart(obj) { return b64url(utf8(JSON.stringify(obj))); }
  function makeToken(header, payload, secret) {
    var h = encodePart(header), p = encodePart(payload);
    return { h: h, p: p, s: b64url(hmac(secret, h + '.' + p)) };
  }
  Deck.jwt = { sha256: sha256, hmac: hmac, b64url: b64url, makeToken: makeToken };

  /* ================================================================ JWT */
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  L.jwt = {
    render: function (s) {
      var c = s.content || {};
      var parts = c.parts || [];
      return ui.decor('grid') +
        '<div class="slide-inner jwt">' +
          '<div class="jwt-top">' +
            ui.header(s, c.lead || 'JSON Web Token: três partes separadas por ponto.') +
            '<div class="jwt-controls" data-anim="text">' +
              '<div class="seg-toggle" role="group" aria-label="Modo de exibição">' +
                '<button class="btn" data-mode="encoded" aria-pressed="true">Codificado</button>' +
                '<button class="btn" data-mode="decoded" aria-pressed="false">Decodificado</button>' +
              '</div>' +
              '<button class="btn jwt-tamper" aria-pressed="false">Simular adulteração</button>' +
            '</div>' +
          '</div>' +
          '<p class="jwt-token t-mono" data-anim="card" aria-label="Token JWT de demonstração">' +
            '<span class="tk tk-h" data-part="0"></span><span class="tk-dot">.</span>' +
            '<span class="tk tk-p" data-part="1"></span><span class="tk-dot">.</span>' +
            '<span class="tk tk-s" data-part="2"></span>' +
          '</p>' +
          '<div class="jwt-parts">' +
            each(parts, function (p, i) {
              return '<section class="jwt-part jp-' + i + '" data-part="' + i + '" data-anim="card" style="--i:' + (i + 1) + '" tabindex="0">' +
                '<h3><span class="jp-swatch" aria-hidden="true"></span>' + t(p.name) + '</h3>' +
                '<p class="jp-text">' + t(p.text) + '</p>' +
                '<pre class="code jp-body"></pre>' +
              '</section>';
            }) +
          '</div>' +
          '<div class="jwt-foot" data-anim="text">' +
            '<p class="jwt-warning"><img src="assets/icons/alert.svg" alt="">' + t(c.warning) + '</p>' +
            '<p class="jwt-verify" aria-live="polite"></p>' +
          '</div>' +
          '<div class="jwt-intro" aria-hidden="true">' +
            '<pre class="jwt-intro-text t-mono"></pre>' +
            '<button class="btn jwt-skip" tabindex="-1">Pular animação</button>' +
          '</div>' +
        '</div>';
    },

    mount: function (el, s) {
      var c = s.content || {};
      var state = el._jwt = { mode: 'encoded', tampered: false, busy: false, raf: 0 };
      var orig = makeToken(c.header || {}, c.payload || {}, c.secret || '');
      state.orig = orig;

      function current() {
        var payload = c.payload || {};
        if (state.tampered) {
          payload = JSON.parse(JSON.stringify(payload));
          var tf = (c.tamper && c.tamper.field) || Object.keys(payload).pop();
          payload[tf] = (c.tamper && c.tamper.value) || 'alterado';
        }
        var h = encodePart(c.header || {}), p = encodePart(payload);
        var expected = b64url(hmac(c.secret || '', h + '.' + p));
        return { h: h, p: p, s: orig.s, payload: payload, valid: expected === orig.s };
      }
      function draw() {
        var cur = current();
        el.querySelector('.tk-h').textContent = cur.h;
        el.querySelector('.tk-p').textContent = cur.p;
        el.querySelector('.tk-s').textContent = cur.s;
        el.querySelector('.jwt-token').classList.toggle('is-tampered', state.tampered);
        var bodies = el.querySelectorAll('.jp-body');
        if (state.mode === 'encoded') {
          bodies[0].textContent = cur.h; bodies[1].textContent = cur.p; bodies[2].textContent = cur.s;
          Array.prototype.forEach.call(bodies, function (b) { b.classList.add('is-encoded'); });
        } else {
          bodies[0].innerHTML = ui.json(c.header);
          bodies[1].innerHTML = ui.json(cur.payload);
          bodies[2].innerHTML = '<span class="j-muted">HMACSHA256(\n  base64url(header) + "." +\n  base64url(payload),\n  chave_secreta\n)</span>';
          Array.prototype.forEach.call(bodies, function (b) { b.classList.remove('is-encoded'); });
        }
        el.querySelectorAll('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === state.mode)); });
        el.querySelector('.jwt-tamper').setAttribute('aria-pressed', String(state.tampered));
        var v = el.querySelector('.jwt-verify');
        v.className = 'jwt-verify ' + (cur.valid ? 'is-valid' : 'is-invalid');
        v.innerHTML = cur.valid
          ? '<img src="assets/icons/check.svg" alt="">Assinatura confere: o conteúdo não foi alterado.'
          : '<img src="assets/icons/alert.svg" alt="">Assinatura não confere: o payload foi alterado depois de assinado.';
      }
      state.draw = draw;

      el.querySelector('.jwt-controls').addEventListener('click', function (e) {
        var m = e.target.closest('[data-mode]');
        if (m) { state.mode = m.getAttribute('data-mode'); draw(); }
        if (e.target.closest('.jwt-tamper')) { state.tampered = !state.tampered; draw(); }
      });
      /* realça a parte do token correspondente ao card */
      function hover(i) {
        el.querySelectorAll('[data-part]').forEach(function (n) {
          n.classList.toggle('is-hot', i !== null && n.getAttribute('data-part') === String(i));
        });
        el.querySelector('.jwt-token').classList.toggle('has-hot', i !== null);
      }
      el.querySelectorAll('.jwt-part').forEach(function (p) {
        var i = p.getAttribute('data-part');
        p.addEventListener('mouseenter', function () { hover(i); });
        p.addEventListener('mouseleave', function () { hover(null); });
        p.addEventListener('focus', function () { hover(i); });
        p.addEventListener('blur', function () { hover(null); });
      });
      el.querySelector('.jwt-skip').addEventListener('click', function () { L.jwt.skip(el); });
      draw();
    },

    reset: function (el) {
      var st = el._jwt; if (!st) return;
      this.skip(el);
      st.mode = 'encoded'; st.tampered = false; st.draw();
    },
    escape: function (el) {
      var st = el._jwt;
      if (st.busy) { this.skip(el); return true; }
      if (st.tampered || st.mode !== 'encoded') { st.tampered = false; st.mode = 'encoded'; st.draw(); return true; }
      return false;
    },
    isBusy: function (el) { return !!(el._jwt && el._jwt.busy); },
    skip: function (el, leaving) {
      var st = el._jwt; if (!st) return;
      var intro = el.querySelector('.jwt-intro');
      var restoreFocus = st.busy && intro.contains(document.activeElement) && !leaving;
      cancelAnimationFrame(st.raf);
      st.busy = false;
      el.classList.remove('jwt-intro-on');
      el.style.removeProperty('--intro-out');
      intro.setAttribute('aria-hidden', 'true');
      if (st.releaseIntro) { st.releaseIntro(); st.releaseIntro = null; }
      var skip = el.querySelector('.jwt-skip'); skip.tabIndex = -1;
      if (restoreFocus && el.classList.contains('is-active')) el.querySelector('[data-mode="encoded"]').focus({ preventScroll: true });
    },
    leave: function (el) { this.skip(el, true); },

    /* transição narrativa API -> JWT (metáfora visual, não criptografia) */
    enter: function (el, s, info) {
      var st = el._jwt;
      if (!st || info.instant || !info.from || info.from.layout !== 'api' || info.dir !== 'fwd') return;
      var c = s.content || {};
      var D = Math.min(2500, Math.max(1600, Deck.config('timing.jwt-transition-ms', 2000)));
      var pre = el.querySelector('.jwt-intro-text');
      var json = JSON.stringify(c.header) + '\n' + JSON.stringify(c.payload, null, 2);
      var token = [st.orig.h, st.orig.p, st.orig.s];
      var order = [];
      for (var i = 0; i < json.length; i++) if (!/\s/.test(json[i])) order.push(i);
      order.sort(function () { return Math.random() - 0.5; });
      var rank = new Array(json.length);
      order.forEach(function (idx, r) { rank[idx] = r / order.length; });

      st.busy = true;
      el.style.removeProperty('--intro-out');
      el.classList.add('jwt-intro-on');
      var intro = el.querySelector('.jwt-intro');
      intro.setAttribute('aria-hidden', 'false');
      if (st.releaseIntro) st.releaseIntro();
      st.releaseIntro = Deck.trapFocus(intro);
      el.querySelector('.jwt-skip').tabIndex = 0;
      el.querySelector('.jwt-skip').focus({ preventScroll: true });
      var t0 = performance.now();

      function frame(now) {
        if (!st.busy) return;
        var p = (now - t0) / D;
        if (p < 0.55) {
          /* 1) trechos do JSON viram caracteres abstratos */
          var q = p / 0.55, out = '';
          for (var k = 0; k < json.length; k++) {
            var ch = json[k];
            if (rank[k] !== undefined && rank[k] < q) out += '<span class="sc">' + B64[(k * 7 + Math.floor(now / 60)) % 64] + '</span>';
            else out += esc(ch);
          }
          pre.innerHTML = out;
          pre.className = 'jwt-intro-text t-mono phase-json';
        } else if (p < 0.82) {
          /* 2) os caracteres se organizam em header.payload.signature */
          var r = (p - 0.55) / 0.27;
          var shown = function (str, from, to) {
            var n = Math.floor(str.length * Math.max(0, Math.min(1, (r - from) / (to - from))));
            return esc(str.slice(0, n));
          };
          pre.className = 'jwt-intro-text t-mono phase-token';
          pre.innerHTML = '<span class="tk-h">' + shown(token[0], 0, 0.3) + '</span>.' +
            '<span class="tk-p">' + shown(token[1], 0.15, 0.7) + '</span>.' +
            '<span class="tk-s">' + shown(token[2], 0.6, 1) + '</span>';
        } else if (p < 1) {
          /* 3) a assinatura fecha o token e o layout aparece */
          pre.className = 'jwt-intro-text t-mono phase-token phase-seal';
          el.style.setProperty('--intro-out', String((p - 0.82) / 0.18));
        } else {
          L.jwt.skip(el);
          el.style.removeProperty('--intro-out');
          el.querySelector('.jwt-token').classList.add('is-sealed');
          setTimeout(function () { el.querySelector('.jwt-token').classList.remove('is-sealed'); }, 1200);
          return;
        }
        st.raf = requestAnimationFrame(frame);
      }
      st.raf = requestAnimationFrame(frame);
    }
  };
})();
