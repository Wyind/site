
(function () {
  'use strict';

  var KEY = 'wyind-settings-v1';
  var BASE_FONT_SIZE = 17;

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DEFAULTS = {
    theme: 'dark',
    accent: 'blue',
    uiScale: 100,
    font: 'pixel',
    cursorSize: 'small',
    musicVolume: 12,
    clickSfx: true,
    clickVolume: 50,
    bootBeep: true,
    autoplay: true,
    scanlines: true,
    scanlineIntensity: 50,
    gridDots: true,
    clickRadar: true,
    diskLED: true,
    pixelMotion: !prefersReducedMotion,
    uiAnimations: !prefersReducedMotion,
    hotkeys: true
  };

  var ACCENTS = {
    blue: { trackpoint: '#4da8ff', glow: 'rgba(77,168,255,.4)', dot: 'rgba(77,168,255,.09)' },
    red: { trackpoint: '#e01a22', glow: 'rgba(224,26,34,.4)', dot: 'rgba(224,26,34,.09)' },
    green: { trackpoint: '#10b981', glow: 'rgba(16,185,129,.4)', dot: 'rgba(16,185,129,.09)' },
    amber: { trackpoint: '#f59e0b', glow: 'rgba(245,158,11,.4)', dot: 'rgba(245,158,11,.09)' },
    purple: { trackpoint: '#a855f7', glow: 'rgba(168,85,247,.4)', dot: 'rgba(168,85,247,.09)' }
  };

  function pick(src, shape) {
    var out = {};
    for (var k in shape) if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
    return out;
  }

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    var state = Object.assign({}, DEFAULTS, pick(saved, DEFAULTS));
    var legacy = localStorage.getItem('wyind-theme-v2');
    if (legacy && !Object.prototype.hasOwnProperty.call(saved, 'theme')) {
      state.theme = legacy === 'light' ? 'light' : 'dark';
    }
    return state;
  }

  var state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function accent() {
    return ACCENTS[state.accent] || ACCENTS.blue;
  }

  /* Only touches the DOM + this file's own state. Audio / theme-in-script.js
     are driven by script.js, which listens for the "wyind:setting" event. */
  var APPLY = {
    theme: function (v) {
      document.documentElement.setAttribute('data-theme', v);
      try { localStorage.setItem('wyind-theme-v2', v); } catch (e) {}
    },
    accent: function (v) {
      var a = ACCENTS[v] || ACCENTS.blue;
      var r = document.documentElement.style;
      r.setProperty('--trackpoint', a.trackpoint);
      r.setProperty('--trackpoint-glow', a.glow);
      r.setProperty('--ibm-green', a.trackpoint);
      if (state.gridDots) r.setProperty('--grid-dot', a.dot);
    },
    gridDots: function (v) {
      document.documentElement.style.setProperty('--grid-dot', v ? accent().dot : 'transparent');
    },
    scanlines: function () { APPLY.scanlineIntensity(state.scanlineIntensity); },
    scanlineIntensity: function (v) {
      document.documentElement.style.setProperty('--scanline-level', state.scanlines ? v : 0);
    },
    uiScale: function (v) {
      document.documentElement.style.fontSize = (BASE_FONT_SIZE * v / 100).toFixed(2) + 'px';
    },
    font: function (v) { document.body.classList.toggle('font-mono', v === 'mono'); },
    uiAnimations: function (v) { document.body.classList.toggle('no-anim', !v); },
    cursorSize: function (v) {
      document.documentElement.style.setProperty('--px-cursor-active', 'var(--px-cursor-' + v + ',var(--px-cursor-md))');
    },
    pixelMotion: function (v) {
      if (window.WYIND_PIXEL && window.WYIND_PIXEL.setMotion) window.WYIND_PIXEL.setMotion(!!v);
    },
    diskLED: function (v) {
      var el = document.getElementById('disk-led');
      if (el) el.style.display = v ? '' : 'none';
    }
  };

  function applyAll() {
    for (var k in state) {
      if (!APPLY[k]) continue;
      try { APPLY[k](state[k]); } catch (err) { console.error('[settings] apply failed:', k, err); }
    }
  }

  function set(key, value, opts) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return;
    state[key] = value;
    save();
    try { if (APPLY[key]) APPLY[key](value); } catch (err) { console.error('[settings] apply failed:', key, err); }
    window.dispatchEvent(new CustomEvent('wyind:setting', { detail: { key: key, value: value } }));
    syncControls();
    if (!opts || !opts.silent) flashSaved();
  }

  

  var PANELS = [
    {
      id: 'appearance', label: 'APPEARANCE', icon: 'fa-palette', items: [
        { key: 'theme', name: 'Theme', desc: 'ThinkLight mode. Dark for late-night tinkering, light for daylight.', type: 'seg', options: [['dark', 'DARK'], ['light', 'LIGHT']] },
        { key: 'accent', name: 'Accent color', desc: 'Highlight color used for links, badges and the progress bar.', type: 'swatches', options: [['blue', '#4da8ff'], ['red', '#e01a22'], ['green', '#10b981'], ['amber', '#f59e0b'], ['purple', '#a855f7']] },
        { key: 'uiScale', name: 'UI scale', desc: 'Scales every pixel of the interface.', type: 'range', min: 85, max: 125, step: 5, unit: '%' },
        { key: 'font', name: 'Interface font', desc: 'Pixelify Sans for the arcade look, IBM Plex Mono for a flat terminal.', type: 'seg', options: [['pixel', 'PIXELIFY'], ['mono', 'PLEX MONO']] },
        { key: 'cursorSize', name: 'Cursor size', desc: 'Compact pixel-art cursor; small is the default.', type: 'seg', options: [['small', 'SMALL'], ['medium', 'MEDIUM'], ['large', 'LARGE']] }
      ]
    },
    {
      id: 'audio', label: 'AUDIO', icon: 'fa-music', items: [
        { key: 'musicVolume', name: 'Music volume', desc: 'Output level of the audio console playlist.', type: 'range', min: 0, max: 100, step: 2, unit: '%' },
        { key: 'clickSfx', name: 'Mechanical clicks', desc: 'ThinkPad keyboard clack on every click.', type: 'toggle' },
        { key: 'clickVolume', name: 'Click volume', desc: 'How loud the keyboard clacks are.', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
        { key: 'bootBeep', name: 'Boot POST beep', desc: 'Beeps when the boot screen is dismissed.', type: 'toggle' },
        { key: 'autoplay', name: 'Autoplay on boot', desc: 'Start the playlist as soon as you press start.', type: 'toggle' },
        { key: 'settingsTrack', name: 'Now playing', desc: 'Playlist order: Cold Like December v4 first, then the Sega Superstars Tennis main menu.', type: 'info', text: 'COLD LIKE DECEMBER V4 &rarr; MAIN MENU &rarr; PLANET SUPERSTARS &rarr; LUFA II BOSS BATTLE &rarr; FLYING BATTERY ZONE &rarr; ANO KO SECRET &rarr; DATA SELECT' }
      ]
    },
    {
      id: 'visuals', label: 'VISUALS', icon: 'fa-tv', items: [
        { key: 'scanlines', name: 'CRT scanlines', desc: 'Horizontal scanline overlay over the whole page.', type: 'toggle' },
        { key: 'scanlineIntensity', name: 'Scanline intensity', desc: 'How dark the scanlines are drawn.', type: 'range', min: 0, max: 100, step: 5, unit: '%' },
        { key: 'gridDots', name: 'Dot grid background', desc: 'The dotted graph-paper backdrop.', type: 'toggle' },
        { key: 'clickRadar', name: 'Click ripples', desc: 'Blue tracking rings wherever you click.', type: 'toggle' },
        { key: 'diskLED', name: 'Disk activity LED', desc: 'Blinks the amber disk LED on clicks and scrolls.', type: 'toggle' },
        { key: 'pixelMotion', name: 'City scene motion', desc: 'Animates the pixel city and the ThinkPad cat.', type: 'toggle' },
        { key: 'uiAnimations', name: 'Blink / bob animations', desc: 'Blinking prompt, bobbing sprite, pulsing trackpoint.', type: 'toggle' }
      ]
    },
    {
      id: 'system', label: 'SYSTEM', icon: 'fa-sliders', items: [
        { key: 'hotkeys', name: 'Keyboard shortcuts', desc: 'Global hotkeys for playback and navigation.', type: 'toggle' },
        { key: 'kbd', name: 'Shortcut map', desc: 'Everything you can press.', type: 'info', text: '<span class="settings-kbd-list"><kbd>S</kbd><span>settings console</span><kbd>Space</kbd><span>play / pause</span><kbd>N</kbd><span>next track</span><kbd>P</kbd><span>previous track</span><kbd>M</kbd><span>mute</span><kbd>K</kbd><span>click SFX</span><kbd>Esc</kbd><span>close console</span></span>' },
        { key: 'store', name: 'Config file', desc: 'Values live in localStorage under "wyind-settings-v1".', type: 'info', text: 'AUTOSAVE: ON' }
      ]
    }
  ];

  var overlay = document.getElementById('settings-overlay');
  var navEl = document.getElementById('settings-nav');
  var contentEl = document.getElementById('settings-content');
  var statusEl = document.getElementById('settings-status');
  var controls = {};
  var activePanel = PANELS[0].id;

  function controlHtml(item) {
    switch (item.type) {
      case 'seg':
        return '<div class="seg" data-setting="' + item.key + '" data-type="seg">' +
          item.options.map(function (o) {
            return '<button type="button" data-value="' + o[0] + '">' + o[1] + '</button>';
          }).join('') + '</div>';
      case 'swatches':
        return '<div class="swatches" data-setting="' + item.key + '" data-type="swatches">' +
          item.options.map(function (o) {
            return '<button type="button" class="swatch" data-value="' + o[0] + '" title="' + o[0] + '" style="border-color:var(--border-dim)"><i style="background:' + o[1] + '"></i></button>';
          }).join('') + '</div>';
      case 'toggle':
        return '<button type="button" class="px-switch" data-setting="' + item.key + '" data-type="toggle" aria-pressed="false">' +
          '<span class="px-switch-track"><span class="px-switch-knob"></span></span><span class="px-switch-state">OFF</span></button>';
      case 'range':
        return '<div class="settings-range" data-setting="' + item.key + '" data-type="range">' +
          '<input type="range" min="' + item.min + '" max="' + item.max + '" step="' + item.step + '" value="0" aria-label="' + item.name + '" />' +
          '<span class="range-value">0</span></div>';
      default:
        return '<span class="settings-info">' + item.text + '</span>';
    }
  }

  function rowHtml(item) {
    return '<div class="settings-row' + (item.type === 'info' ? ' info' : '') + '">' +
      '<div class="settings-meta"><span class="settings-name">' + item.name + '</span><span class="settings-desc">' + item.desc + '</span></div>' +
      '<div class="settings-control">' + controlHtml(item) + '</div></div>';
  }

  function render() {
    navEl.innerHTML = '<span class="settings-nav-head">SECTIONS</span>' + PANELS.map(function (p) {
      return '<button type="button" class="settings-nav-btn' + (p.id === activePanel ? ' active' : '') + '" data-panel="' + p.id + '"><i class="fa-solid ' + p.icon + '"></i>' + p.label + '</button>';
    }).join('');

    contentEl.innerHTML = PANELS.map(function (p) {
      return '<section class="settings-panel' + (p.id === activePanel ? ' active' : '') + '" data-panel="' + p.id + '">' +
        '<h3 class="settings-panel-title">' + p.label + '</h3>' +
        p.items.map(rowHtml).join('') + '</section>';
    }).join('');
  }

  function indexControls() {
    controls = {};
    contentEl.querySelectorAll('[data-setting]').forEach(function (wrap) {
      controls[wrap.getAttribute('data-setting')] = {
        type: wrap.getAttribute('data-type'),
        el: wrap
      };
    });
  }

  function syncControls() {
    for (var key in controls) {
      var c = controls[key];
      var value = state[key];
      if (c.type === 'seg') {
        c.el.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-value') === String(value));
        });
      } else if (c.type === 'swatches') {
        c.el.querySelectorAll('.swatch').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-value') === String(value));
        });
      } else if (c.type === 'toggle') {
        c.el.setAttribute('aria-pressed', value ? 'true' : 'false');
        var s = c.el.querySelector('.px-switch-state');
        if (s) s.textContent = value ? 'ON' : 'OFF';
      } else if (c.type === 'range') {
        var input = c.el.querySelector('input');
        var out = c.el.querySelector('.range-value');
        if (input) input.value = value;
        if (out) out.textContent = value + '%';
      }
    }
  }

  var savedTimer = null;
  function flashSaved() {
    if (!statusEl) return;
    statusEl.textContent = 'SAVED';
    statusEl.classList.add('flash');
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(function () { statusEl.classList.remove('flash'); }, 650);
  }

  function showPanel(id) {
    activePanel = id;
    navEl.querySelectorAll('.settings-nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-panel') === id);
    });
    contentEl.querySelectorAll('.settings-panel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === id);
    });
    contentEl.scrollTop = 0;
  }

  function isOpen() { return overlay && overlay.classList.contains('open'); }

  function openSettings() {
    if (!overlay) return;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('settings-open');
    syncControls();
    var first = navEl.querySelector('.settings-nav-btn');
    if (first) first.focus();
  }

  function closeSettings() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('settings-open');
  }

  function toggleSettings() { isOpen() ? closeSettings() : openSettings(); }

  function wire() {
    var navBtns = navEl.querySelectorAll('.settings-nav-btn');
    Array.prototype.forEach.call(navBtns, function (b) {
      b.addEventListener('click', function () { showPanel(b.getAttribute('data-panel')); });
    });

    contentEl.addEventListener('click', function (e) {
      var target = e.target;
      var wrap = target.closest ? target.closest('[data-setting]') : null;
      if (!wrap) return;
      var key = wrap.getAttribute('data-setting');
      var type = wrap.getAttribute('data-type');
      if (type === 'seg') {
        var btn = target.closest('button');
        if (btn) set(key, btn.getAttribute('data-value'));
      } else if (type === 'swatches') {
        var sw = target.closest('.swatch');
        if (sw) set(key, sw.getAttribute('data-value'));
      } else if (type === 'toggle') {
        set(key, !state[key]);
      }
    });

    contentEl.addEventListener('input', function (e) {
      var wrap = e.target.closest ? e.target.closest('[data-setting]') : null;
      if (!wrap || wrap.getAttribute('data-type') !== 'range') return;
      set(wrap.getAttribute('data-setting'), parseInt(e.target.value, 10));
    });

    var closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeSettings);

    var openBtn = document.getElementById('settings-toggle-btn');
    if (openBtn) openBtn.addEventListener('click', toggleSettings);

    var resetBtn = document.getElementById('settings-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        for (var k in DEFAULTS) set(k, DEFAULTS[k]);
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeSettings();
      });
    }
  }

  window.addEventListener('keydown', function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      closeSettings();
      return;
    }
    if (typing) return;
    if ((e.key === 's' || e.key === 'S') && state.hotkeys) {
      e.preventDefault();
      toggleSettings();
    }
  });

  if (!overlay || !navEl || !contentEl) {
    console.error('[settings] overlay markup missing from index.html');
    return;
  }

  render();
  indexControls();
  applyAll();
  wire();
  syncControls();

  window.WYIND_SETTINGS = {
    get: function (k) { return state[k]; },
    set: set,
    all: function () { return Object.assign({}, state); },
    defaults: function () { return Object.assign({}, DEFAULTS); },
    open: openSettings,
    close: closeSettings,
    toggle: toggleSettings,
    isOpen: isOpen
  };
})();
