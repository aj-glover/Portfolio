/**
 * Loading screen with real asset progress.
 *
 * Works with the bundled app (three.js GLTF/DRACO loaders use fetch/XHR under
 * the hood) by instrumenting network requests before the app bundle executes.
 * Progress is weighted: network assets (models, textures, css, js) drive the
 * bar, and the screen is dismissed once the WebGL canvas has actually rendered.
 */
(function () {
  'use strict';

  if (window.__loadingScreen) return;

  // ---------------------------------------------------------------- markup ---
  var STYLES = [
    '#app-loader{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;',
    'align-items:center;justify-content:center;gap:28px;background:radial-gradient(circle at 50% 45%,#10162b 0%,#05060d 70%);',
    'color:#e8ecff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif;',
    'transition:opacity .7s ease,visibility .7s ease;opacity:1;visibility:visible}',
    '#app-loader.is-hidden{opacity:0;visibility:hidden;pointer-events:none}',
    '#app-loader .al-stars{position:absolute;inset:0;overflow:hidden;opacity:.6}',
    '#app-loader .al-stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;',
    'animation:al-twinkle 3s ease-in-out infinite}',
    '@keyframes al-twinkle{0%,100%{opacity:.15;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}',
    '#app-loader .al-body{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px;padding:0 24px;text-align:center}',
    '#app-loader .al-ring{width:78px;height:78px;border-radius:50%;border:2px solid rgba(232,236,255,.15);',
    'border-top-color:#7aa2ff;animation:al-spin 1s linear infinite}',
    '@keyframes al-spin{to{transform:rotate(360deg)}}',
    '#app-loader .al-title{font-size:14px;letter-spacing:.28em;text-transform:uppercase;color:#9fb2e6;margin:0}',
    '#app-loader .al-track{width:min(320px,70vw);height:4px;border-radius:99px;background:rgba(232,236,255,.12);overflow:hidden}',
    '#app-loader .al-fill{height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,#7aa2ff,#c69cff);',
    'transition:width .35s ease}',
    '#app-loader .al-meta{display:flex;gap:10px;align-items:baseline;font-size:12px;color:#8091bd;min-height:16px}',
    '#app-loader .al-pct{font-variant-numeric:tabular-nums;font-size:13px;color:#e8ecff}',
    '@media (prefers-reduced-motion:reduce){#app-loader .al-ring,#app-loader .al-stars i{animation:none}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = STYLES;

  var el = document.createElement('div');
  el.id = 'app-loader';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML =
    '<div class="al-stars"></div>' +
    '<div class="al-body">' +
      '<div class="al-ring"></div>' +
      '<p class="al-title">Entering the universe</p>' +
      '<div class="al-track"><div class="al-fill"></div></div>' +
      '<div class="al-meta"><span class="al-pct">0%</span><span class="al-status">Preparing assets…</span></div>' +
    '</div>';

  function mount() {
    if (!document.head.contains(style)) document.head.appendChild(style);
    if (document.body && !document.body.contains(el)) {
      document.body.insertBefore(el, document.body.firstChild);
      // sprinkle stars
      var sky = el.querySelector('.al-stars');
      for (var i = 0; i < 60; i++) {
        var s = document.createElement('i');
        s.style.left = (Math.random() * 100).toFixed(2) + '%';
        s.style.top = (Math.random() * 100).toFixed(2) + '%';
        s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
        sky.appendChild(s);
      }
    }
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });

  var fillEl = el.querySelector('.al-fill');
  var pctEl = el.querySelector('.al-pct');
  var statusEl = el.querySelector('.al-status');

  // -------------------------------------------------------------- progress ---
  var total = 0;      // requests started
  var done = 0;       // requests finished
  var shown = 0;      // last rendered percentage (monotonic)
  var finished = false;
  var startedAt = Date.now();
  var MIN_VISIBLE = 600;   // avoid a jarring flash
  var MAX_VISIBLE = 15000; // never trap the user

  function track(url) {
    return /\.(glb|gltf|bin|hdr|exr|ktx2?|png|jpe?g|webp|avif|mp4|webm|woff2?|css|js|json|wasm)(\?|$)/i.test(
      String(url || '')
    );
  }

  function label(url) {
    var name = String(url).split('?')[0].split('/').pop() || '';
    return name ? 'Loading ' + name : 'Loading assets…';
  }

  function render() {
    var ratio = total ? done / total : 0;
    // Cap network-driven progress at 92% until the scene is actually ready.
    var pct = Math.min(92, Math.round(ratio * 92));
    if (pct > shown) shown = pct;
    fillEl.style.width = shown + '%';
    pctEl.textContent = shown + '%';
  }

  function begin(url) {
    if (finished || !track(url)) return false;
    total++;
    statusEl.textContent = label(url);
    render();
    return true;
  }

  function end(counted) {
    if (!counted) return;
    done++;
    render();
  }

  // fetch
  if (window.fetch) {
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var counted = begin(url);
      return nativeFetch(input, init).then(
        function (res) { end(counted); return res; },
        function (err) { end(counted); throw err; }
      );
    };
  }

  // XHR
  var NativeXHR = window.XMLHttpRequest;
  if (NativeXHR) {
    var open = NativeXHR.prototype.open;
    var send = NativeXHR.prototype.send;
    NativeXHR.prototype.open = function (method, url) {
      this.__alUrl = url;
      return open.apply(this, arguments);
    };
    NativeXHR.prototype.send = function () {
      var counted = begin(this.__alUrl);
      if (counted) {
        var settle = function () { end(counted); counted = false; };
        this.addEventListener('load', settle);
        this.addEventListener('error', settle);
        this.addEventListener('abort', settle);
      }
      return send.apply(this, arguments);
    };
  }

  // ------------------------------------------------------------- finishing ---
  function finish(reason) {
    if (finished) return;
    finished = true;
    var wait = Math.max(0, MIN_VISIBLE - (Date.now() - startedAt));
    setTimeout(function () {
      shown = 100;
      fillEl.style.width = '100%';
      pctEl.textContent = '100%';
      statusEl.textContent = 'Ready';
      el.classList.add('is-hidden');
      document.documentElement.classList.remove('is-loading');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 800);
      window.dispatchEvent(new CustomEvent('app-loader:hidden', { detail: { reason: reason } }));
    }, wait);
  }

  // The scene is "ready" when a canvas exists, has real dimensions, and one
  // more animation frame has passed (so the first draw is on screen).
  function sceneReady() {
    var canvas = document.querySelector('#root canvas, canvas');
    return !!(canvas && canvas.width > 1 && canvas.height > 1);
  }

  function poll() {
    if (finished) return;
    if (Date.now() - startedAt > MAX_VISIBLE) return finish('timeout');
    if (document.readyState === 'complete' && sceneReady()) {
      return requestAnimationFrame(function () {
        requestAnimationFrame(function () { finish('scene-ready'); });
      });
    }
    // Fall back: page fully loaded and no pending tracked requests.
    if (document.readyState === 'complete' && total > 0 && done >= total) {
      return setTimeout(function () {
        if (!finished && done >= total) finish('network-idle');
      }, 1200);
    }
    setTimeout(poll, 120);
  }

  document.documentElement.classList.add('is-loading');
  setTimeout(poll, 200);

  // Public API so the app can control the loader explicitly if desired.
  window.__loadingScreen = {
    element: el,
    setStatus: function (text) { if (!finished) statusEl.textContent = text; },
    setProgress: function (value) {
      if (finished) return;
      var pct = Math.max(0, Math.min(99, Math.round(value)));
      if (pct > shown) { shown = pct; fillEl.style.width = pct + '%'; pctEl.textContent = pct + '%'; }
    },
    hide: function () { finish('manual'); }
  };
})();
