/* Coreografias visuais. Conteúdo aprovado permanece em content/slides.js. */
(function () {
  'use strict';
  var D = window.Deck, active = null, micros = [], NS = 'http://www.w3.org/2000/svg';
  var EASE = 'cubic-bezier(.16,1,.3,1)', enabled = !!Element.prototype.animate;
  if (enabled) document.documentElement.classList.add('cinema-ready');

  function motionOff() { return !enabled || D.motion.reduced(); }
  function valid(run) { return active === run && D.state.token === run.token; }
  function animate(run, node, frames, options) {
    if (!node) return;
    var a = node.animate(frames, Object.assign({ duration: 620, easing: EASE, fill: 'both' }, options || {}));
    run.animations.push(a); a.finished.catch(function () {}); return a;
  }
  function temporary(run, node, parent) {
    node.setAttribute('aria-hidden', 'true'); node.classList.add('cinema-temporary');
    (parent || D.state.els[D.state.index]).appendChild(node); run.nodes.push(node); return node;
  }
  function cleanup(run) {
    if (!run) return;
    clearTimeout(run.timer); cancelAnimationFrame(run.raf);
    run.animations.forEach(function (a) { a.cancel(); });
    run.nodes.forEach(function (n) { n.remove(); });
    run.restore.forEach(function (fn) { fn(); });
    if (active === run) active = null;
  }
  function cancel() {
    var busy = !!active || micros.length > 0;
    cleanup(active); micros.splice(0).forEach(function (a) { a.cancel(); }); return busy;
  }
  function rect(node) {
    if (!node) return null;
    var r = node.getBoundingClientRect(), stage = document.getElementById('stage').getBoundingClientRect(), scale = D.stageScale || 1;
    return { x: (r.x - stage.x) / scale, y: (r.y - stage.y) / scale, w: r.width / scale, h: r.height / scale };
  }
  function layer(run) {
    if (run.layer) return run.layer;
    var el = document.createElement('div'); el.className = 'cinema-layer';
    run.layer = temporary(run, el, document.getElementById('stage')); return el;
  }
  function ghostImage(run, source, bounds) {
    if (!source || !bounds) return null;
    var el = document.createElement('div'), img = document.createElement('img'), cs = getComputedStyle(source);
    el.className = 'cinema-ghost-image';
    el.style.cssText = 'left:' + bounds.x + 'px;top:' + bounds.y + 'px;width:' + bounds.w + 'px;height:' + bounds.h + 'px;';
    img.src = source.currentSrc || source.src; img.alt = ''; img.style.objectFit = cs.objectFit; img.style.objectPosition = cs.objectPosition;
    el.appendChild(img); return temporary(run, el, layer(run));
  }
  function enterNodes(run, nodes, options) {
    options = options || {};
    Array.prototype.forEach.call(nodes, function (node, i) {
      if (node.closest('[hidden],[data-step]:not(.is-revealed)')) return;
      animate(run, node, [
        { opacity: 0, transform: 'translate3d(' + (options.x || 0) + 'px,' + (options.y === undefined ? 26 : options.y) + 'px,0) scale(' + (options.scale || 1) + ')' },
        { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }
      ], { duration: options.duration || 680, delay: (options.delay || 130) + Math.min(i, 7) * (options.stagger || 65) });
    });
  }
  function family(slide) {
    if (slide.layout === 'jwt') return 'token';
    if (slide.layout === 'inspector') return slide.sourceId === 'S11' ? 'architecture' : 'diagram';
    return ({ modernCover: 'opening', team: 'portraits', personaProfile: 'portrait', modernCards: 'editorial', kanbanPlan: 'kanban', beforeAfter: 'compare', tools: 'tools', requirements: 'backlog', crud: 'crud', nfr: 'quality', flow: 'flow', finance: 'finance', wireframe: 'interface', api: 'console', closing: 'closing' })[slide.layout] || 'editorial';
  }
  function bridge(run, from, to, previous, slide) {
    if (!from || run.dir !== 'fwd' || D.state.els.indexOf(to) - D.state.els.indexOf(from) !== 1) return;
    if (previous.layout === 'personaProfile' && slide.layout === 'personaProfile') {
      var oldPhoto = from.querySelector('.profile-photo img'), oldFrame = rect(from.querySelector('.profile-photo'));
      var nextFrame = rect(to.querySelector('.profile-photo')), photo = ghostImage(run, oldPhoto, oldFrame);
      if (photo && nextFrame) {
        run.sharedPortrait = true;
        animate(run, photo, [
          { clipPath: 'inset(0 0% 0 0)', transform: 'translate3d(0,0,0)' },
          { clipPath: 'inset(0 100% 0 0)', transform: 'translate3d(' + (nextFrame.x - oldFrame.x) + 'px,' + (nextFrame.y - oldFrame.y) + 'px,0)' }
        ], { duration: 680 });
      }
    }
    if (previous.layout === 'wireframe' && slide.layout === 'api') {
      var image = from.querySelector('.wf-frame img'), a = rect(from.querySelector('.wf-frame')), b = rect(to.querySelector('.api-console'));
      var screen = ghostImage(run, image, a);
      if (screen && b) {
        screen.style.transformOrigin = '0 0';
        animate(run, screen, [
          { opacity: 1, transform: 'translate3d(0,0,0) scale(1)', offset: 0 },
          { opacity: .75, transform: 'translate3d(' + (b.x - a.x + 35) + 'px,' + (b.y - a.y + 50) + 'px,0) scale(.32)', offset: .7 },
          { opacity: 0, transform: 'translate3d(' + (b.x - a.x + 75) + 'px,' + (b.y - a.y + 75) + 'px,0) scale(.24)', offset: 1 }
        ], { duration: 850 });
      }
    }
    if (previous.sourceId === 'S11' && slide.layout === 'finance') {
      var nat = rect(from.querySelector('.inspector-region[data-i="3"]')), label = to.querySelector('.cost-category span'), destination = rect(label);
      if (nat && label && destination) {
        var tag = document.createElement('div'); tag.className = 'cinema-nat-label'; tag.textContent = label.textContent;
        tag.style.left = (nat.x + nat.w / 2 - 100) + 'px'; tag.style.top = (nat.y + nat.h / 2 - 25) + 'px';
        temporary(run, tag, layer(run));
        animate(run, label, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 620 });
        animate(run, tag, [
          { opacity: 0, transform: 'translate3d(0,0,0)', offset: 0 },
          { opacity: 1, transform: 'translate3d(0,-12px,0)', offset: .15 },
          { opacity: 0, transform: 'translate3d(' + (destination.x - nat.x - nat.w / 2 + 100) + 'px,' + (destination.y - nat.y - nat.h / 2 + 25) + 'px,0)', offset: 1 }
        ], { duration: 880 });
      }
    }
  }

  /* Os traçados são os mesmos do SVG aprovado, não novas conexões. */
  var ARCH_PATHS = [
    ['M170 285H235', 80], ['M400 285H456', 150], ['M494 285H605', 220],
    ['M825 285H885V205H945', 320], ['M885 285V425H945', 320],
    ['M1165 205H1230V327.5H1290', 470], ['M1165 425H1230V327.5', 470],
    ['M1045 510H825', 670, true], ['M605 502.5H317.5V340', 740, true]
  ];
  function architecture(run, el) {
    var frame = el.querySelector('.inspector-image'); if (!frame) return;
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 1600 620'); svg.classList.add('cinema-route-overlay');
    var signals = [];
    ARCH_PATHS.forEach(function (data) {
      var path = document.createElementNS(NS, 'path'), dot = document.createElementNS(NS, 'circle');
      path.setAttribute('d', data[0]); path.setAttribute('fill', 'none'); path.setAttribute('stroke', data[2] ? '#C39A29' : '#2C9260');
      path.setAttribute('stroke-width', '5'); path.setAttribute('stroke-linecap', 'round');
      dot.setAttribute('r', '7'); dot.setAttribute('fill', data[2] ? '#D3A329' : '#1F6B46'); dot.setAttribute('stroke', '#FFFFFF'); dot.setAttribute('stroke-width', '2'); dot.setAttribute('opacity', '0');
      svg.appendChild(path); svg.appendChild(dot); signals.push({ path: path, dot: dot, delay: data[1] });
    });
    temporary(run, svg, frame);
    signals.forEach(function (s) {
      s.length = s.path.getTotalLength(); s.path.style.strokeDasharray = s.length + ' ' + s.length;
      animate(run, s.path, [
        { strokeDashoffset: s.length, opacity: 0, offset: 0 },
        { opacity: .9, offset: .3 },
        { strokeDashoffset: 0, opacity: 0, offset: 1 }
      ], { duration: 550, delay: s.delay });
    });
    var start = performance.now();
    function tick(now) {
      if (!valid(run)) return;
      var elapsed = now - start;
      signals.forEach(function (s) {
        var p = (elapsed - s.delay) / 530;
        if (p >= 0 && p <= 1) { var xy = s.path.getPointAtLength(p * s.length); s.dot.setAttribute('cx', xy.x); s.dot.setAttribute('cy', xy.y); s.dot.setAttribute('opacity', Math.sin(p * Math.PI)); }
        else s.dot.setAttribute('opacity', '0');
      });
      if (elapsed < 1300) run.raf = requestAnimationFrame(tick);
    }
    run.raf = requestAnimationFrame(tick);
  }
  function finance(run, el) {
    el.querySelectorAll('.month-bar').forEach(function (bar, i) {
      var fill = document.createElement('span'), color = getComputedStyle(bar).backgroundColor;
      fill.className = 'cinema-bar-fill'; fill.style.backgroundColor = color;
      temporary(run, fill, bar); bar.classList.add('cinema-chart-bar');
      run.restore.push(function () { bar.classList.remove('cinema-chart-bar'); });
      animate(run, fill, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 850, delay: 160 + i * 100 });
      animate(run, bar.querySelector('.month-amount'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 370 + i * 100 });
    });
    el.querySelectorAll('.category-track>span').forEach(function (bar, i) {
      animate(run, bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 760, delay: 240 + i * 85 });
    });
    enterNodes(run, el.querySelectorAll('.finance-total,.finance-insight'), { y: 18, delay: 80, stagger: 120 });
  }
  function choreography(run, el, slide) {
    var kind = family(slide); run.kind = kind; el.dataset.cinema = kind;
    var headers = el.querySelectorAll('.s-head h2,.persona-label,.cover-copy h1');
    enterNodes(run, headers, { y: 22, delay: 40, duration: 680 });
    enterNodes(run, el.querySelectorAll('.t-lead,.wf-hint'), { y: 12, delay: 130, duration: 550 });
    switch (kind) {
      case 'portraits': enterNodes(run, el.querySelectorAll('.member-card'), { y: 38, scale: .975, stagger: 80 }); break;
      case 'portrait':
        enterNodes(run, el.querySelectorAll(run.sharedPortrait ? '.profile-person' : '.profile-identity'), { x: run.sharedPortrait ? 0 : (run.dir === 'fwd' ? -24 : 24), y: run.sharedPortrait ? 14 : 0, delay: 80 });
        enterNodes(run, el.querySelectorAll('.profile-detail'), { x: run.dir === 'fwd' ? 28 : -28, y: 0, delay: 180 }); break;
      case 'kanban': enterNodes(run, el.querySelectorAll('.kanban-stage'), { x: 44, y: 0, stagger: 125 }); break;
      case 'compare': enterNodes(run, el.querySelectorAll('.ba-side,.ba-compare'), { y: 24, scale: .98, stagger: 100 }); break;
      case 'tools': enterNodes(run, el.querySelectorAll('.tool'), { y: 28, scale: .96, stagger: 70 }); break;
      case 'backlog': enterNodes(run, el.querySelectorAll('.req-cat'), { x: 44, y: 0, stagger: 95 }); break;
      case 'crud':
        enterNodes(run, el.querySelectorAll('.crud-op'), { y: 38, scale: .965, stagger: 105 });
        enterNodes(run, el.querySelectorAll('.crud-letter'), { y: 20, delay: 230, stagger: 105, duration: 740 }); break;
      case 'quality': enterNodes(run, el.querySelectorAll('.nfr-card'), { y: 28, stagger: 95 }); break;
      case 'diagram':
        enterNodes(run, el.querySelectorAll('.inspector-figure'), { y: 20, scale: .985, delay: 80 });
        el.querySelectorAll('.inspector-region').forEach(function (node, i) { animate(run, node, [{ borderColor: 'transparent' }, { borderColor: '#2C9260', offset: .45 }, { borderColor: 'transparent' }], { duration: 750, delay: 180 + i * 130 }); }); break;
      case 'architecture':
        enterNodes(run, el.querySelectorAll('.inspector-figure'), { y: 15, scale: .99, delay: 50 }); architecture(run, el); break;
      case 'flow': enterNodes(run, el.querySelectorAll('.flow-node'), { y: 12, scale: .8, stagger: 140 }); break;
      case 'finance': finance(run, el); break;
      case 'interface':
        enterNodes(run, el.querySelectorAll('.wf-feature'), { x: -24, y: 0, scale: .985, delay: 50, duration: 800 });
        enterNodes(run, el.querySelectorAll('.wf-thumbs>li'), { x: 32, y: 0, stagger: 65 }); break;
      case 'console':
        enterNodes(run, el.querySelectorAll('.api-ep'), { x: -24, y: 0, stagger: 80 });
        enterNodes(run, el.querySelectorAll('.api-console'), { x: 24, y: 0, scale: .985, delay: 180, duration: 800 }); break;
      case 'token': enterNodes(run, el.querySelectorAll('.jwt-token,.jwt-part'), { y: 20, stagger: 80 }); break;
      case 'closing':
        enterNodes(run, el.querySelectorAll('.timeline>li'), { x: -28, y: 0, stagger: 140 });
        enterNodes(run, el.querySelectorAll('.closing-thanks'), { y: 28, scale: .975, delay: 200, duration: 850 }); break;
      default: enterNodes(run, el.querySelectorAll('.modern-card,.ods-point,.ods-goal,.cover-brand'), { y: 28, stagger: 90 });
    }
  }
  function run(info) {
    cancel();
    if (motionOff() || info.instant || (info.slide.layout === 'jwt' && info.to._jwt && info.to._jwt.busy)) return;
    var current = { token: info.token, dir: info.dir, animations: [], nodes: [], restore: [], raf: 0, timer: 0, kind: '' };
    active = current;
    try {
      bridge(current, info.from, info.to, info.previous || {}, info.slide);
      animate(current, info.from, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'cubic-bezier(.4,0,1,1)' });
      animate(current, info.to, [{ opacity: 0 }, { opacity: 1 }], { duration: 520 });
      choreography(current, info.to, info.slide);
      current.timer = setTimeout(function () { if (valid(current)) cleanup(current); }, 1380);
    } catch (error) { cleanup(current); console.warn('[motion] apresentação mantida sem efeito', error); }
  }
  function swap(node) {
    if (motionOff() || !node) return;
    if (node._cinemaSwap) node._cinemaSwap.cancel();
    var a = node.animate([{ opacity: .25, transform: 'translateY(8px) scale(.99)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
    node._cinemaSwap = a; micros.push(a);
    a.finished.catch(function () {}).finally(function () { micros = micros.filter(function (item) { return item !== a; }); if (node._cinemaSwap === a) node._cinemaSwap = null; });
  }
  function reduceNow() {
    if (!D.motion.reduced()) return;
    cancel();
    var state = D.state; if (!state || state.index < 0) return;
    var slide = window.SLIDES[state.index], layout = D.layouts[slide.layout], el = state.els[state.index];
    if (layout && layout.isBusy && layout.isBusy(el) && layout.skip) layout.skip(el);
  }
  D.cinema = { run: run, cancel: cancel, skip: cancel, swap: swap, family: family, isBusy: function () { return !!active; }, status: function () { return active ? { token: active.token, kind: active.kind, animations: active.animations.length } : null; } };
  document.addEventListener('deck:motion', reduceNow);
  var media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.addEventListener) media.addEventListener('change', reduceNow);
})();
