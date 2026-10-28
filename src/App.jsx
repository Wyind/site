import { useEffect, useRef, useState } from 'react';
import { makeStars } from './stars.js';
import { ComputerIcon, SettingsIcon, SpeakerIcon, SpeakerOffIcon } from './components/icons.jsx';
import Taskbar from './components/Taskbar.jsx';

const DEFAULT_SETTINGS = {
  muted: false,
  stars: true,
  glitch: true,
  openOnStartup: true,
  desktopSettingsIcon: true,
};

const BOOT_STAGES = [
  'Scanning drives and reading drive C:\\ ...',
  'Checking filesystem integrity and device registry...',
  'Loading VxD VMM32 virtual memory subsystem...',
  'Addressing memory page 0028:C0011E36...',
];

export default function App() {
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('wyind-settings');
      const base = saved ? JSON.parse(saved) : {};
      const legacyMuted = localStorage.getItem('wyind-muted');
      return {
        ...DEFAULT_SETTINGS,
        ...base,
        muted: base.muted !== undefined ? base.muted : legacyMuted === '1',
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isOpen, setIsOpen] = useState(settings.openOnStartup);
  const [isMinimized, setIsMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [mainPos, setMainPos] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPos, setSettingsPos] = useState(null);
  const [bsod, setBsod] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [booting, setBooting] = useState(false);
  const [bootPos, setBootPos] = useState(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStage, setBootStage] = useState(0);
  const [glitching, setGlitching] = useState(false);
  const [pcSrc, setPcSrc] = useState('/mypc.png');
  const [dragOutline, setDragOutline] = useState(null);

  const windowRef = useRef(null);
  const iconRef = useRef(null);
  const bootAudioRef = useRef(null);
  const bootTimersRef = useRef([]);
  const fadeIntervalRef = useRef(null);
  const mutedRef = useRef(settings.muted);
  mutedRef.current = settings.muted;
  const shutdownBtnRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('wyind-settings', JSON.stringify(settings));
      localStorage.setItem('wyind-muted', settings.muted ? '1' : '0');
    } catch {}
  }, [settings]);

  function updateSetting(key, val) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  useEffect(() => {
    if (settings.stars) {
      document.documentElement.style.backgroundImage = 'url("' + makeStars() + '")';
    } else {
      document.documentElement.style.backgroundImage = 'none';
    }
  }, [settings.stars]);

  useEffect(() => {
    function onKey(e) {
      if (bsod) {
        setBsod(false);
        return;
      }
      if (e.key === 'Escape') {
        if (booting) {
          cancelBoot();
          return;
        }
        setCtxMenu(null);
        setShowSettings(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bsod, booting]);

  useEffect(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return undefined;
    const ctx = new AC();
    let clickBuf = null;

    fetch('/click.wav')
      .then((r) => r.arrayBuffer())
      .then((d) => ctx.decodeAudioData(d))
      .then((b) => {
        clickBuf = b;
      })
      .catch(() => {});

    function play(rate, vol) {
      if (!clickBuf || mutedRef.current) return;
      if (ctx.state === 'suspended') ctx.resume();
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = clickBuf;
      src.playbackRate.value = rate;
      g.gain.value = vol;
      src.connect(g);
      g.connect(ctx.destination);
      src.start();
    }

    let lastHover = null;

    function onDown(e) {
      if (e.button !== 0) return;
      play(1, 0.5);
    }

    function onOver(e) {
      if (!e.target.closest) return;
      const el = e.target.closest('.menu-bar a');
      if (!el) {
        lastHover = null;
        return;
      }
      if (el === lastHover) return;
      lastHover = el;
      play(1.9, 0.13);
    }

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerover', onOver);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerover', onOver);
      ctx.close();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-booting', booting);
    return () => document.documentElement.classList.remove('is-booting');
  }, [booting]);

  useEffect(
    () => () => {
      bootTimersRef.current.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (bootAudioRef.current) bootAudioRef.current.pause();
    },
    []
  );

  useEffect(() => {
    if (shutdown && shutdownBtnRef.current) shutdownBtnRef.current.focus();
  }, [shutdown]);

  function cancelBoot() {
    bootTimersRef.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    bootTimersRef.current = [];

    setBooting(false);
    setGlitching(false);
    setBootProgress(0);
    setBootStage(0);
    setBootPos(null);

    // Fade out audio smoothly
    if (bootAudioRef.current && !bootAudioRef.current.paused) {
      const audio = bootAudioRef.current;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      const startVol = audio.volume;
      const steps = 15;
      let step = 0;
      fadeIntervalRef.current = setInterval(() => {
        step += 1;
        audio.volume = Math.max(0, startVol * (1 - step / steps));
        if (step >= steps) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.8;
        }
      }, 40);
    }
  }

  function startBoot() {
    if (booting) return;
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    cancelBoot();
    setBooting(true);
    setGlitching(false);
    setBootProgress(0);
    setBootStage(0);

    if (!settings.muted) {
      const audio = new Audio('/boot.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {});
      bootAudioRef.current = audio;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / 36000) * 100));
      setBootProgress(pct);
      if (elapsed >= 36000) {
        clearInterval(interval);
      }
    }, 250);
    bootTimersRef.current.push(interval);

    bootTimersRef.current.push(
      setTimeout(() => setBootStage(1), 9000),
      setTimeout(() => setBootStage(2), 19000),
      setTimeout(() => {
        setBootStage(3);
        if (settings.glitch) setGlitching(true);
      }, 29000),
      setTimeout(() => {
        if (bootAudioRef.current) {
          bootAudioRef.current.pause();
          bootAudioRef.current.currentTime = 0;
        }
        clearInterval(interval);
        setBooting(false);
        setGlitching(false);
        setBootProgress(0);
        setBootPos(null);
        setBsod(true);
      }, 36000)
    );
  }

  function reboot() {
    cancelBoot();
    setIsOpen(false);
    setIsMinimized(false);
    setMaximized(false);
    setShutdown(false);
    setBsod(false);
    startBoot();
  }

  function focusWindow() {
    requestAnimationFrame(() => {
      const el = windowRef.current;
      if (el) el.focus({ preventScroll: true });
    });
  }

  function openWyind() {
    setIsOpen(true);
    setIsMinimized(false);
    focusWindow();
  }

  function minimizeWyind() {
    setIsMinimized(true);
  }

  function toggleWyind() {
    if (isMinimized) {
      setIsMinimized(false);
      focusWindow();
    } else {
      setIsMinimized(true);
    }
  }

  function openAt(section) {
    setCtxMenu(null);
    openWyind();
    if (section) {
      requestAnimationFrame(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function closeWindow() {
    setIsOpen(false);
    setIsMinimized(false);
    setMaximized(false);
    requestAnimationFrame(() => {
      if (iconRef.current) iconRef.current.focus();
    });
  }

  function toggleMax() {
    setMaximized((v) => !v);
  }

  function refreshStars() {
    if (settings.stars) {
      document.documentElement.style.backgroundImage = 'url("' + makeStars() + '")';
    }
  }

  // Windows 98 Wireframe Window Dragging
  function startWindowDrag(e, targetType) {
    if (e.button !== 0 || e.target.closest('.title-bar-controls, button, a')) return;
    if (targetType === 'main' && maximized) return;

    const windowSelector = targetType === 'main'
      ? '.site-window'
      : targetType === 'settings'
        ? '.settings-window'
        : '.loading-dialog';

    const el = e.currentTarget.closest(windowSelector);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const shiftX = e.clientX - rect.left;
    const shiftY = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    let currentX = rect.left;
    let currentY = rect.top;

    setDragOutline({ x: currentX, y: currentY, width, height });

    function onPointerMove(ev) {
      currentX = Math.max(0, Math.min(window.innerWidth - width, ev.clientX - shiftX));
      currentY = Math.max(0, Math.min(window.innerHeight - height - 30, ev.clientY - shiftY));
      setDragOutline({ x: currentX, y: currentY, width, height });
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      setDragOutline(null);

      // Teleport window to outline's final position
      if (targetType === 'main') {
        setMainPos({ x: currentX, y: currentY });
      } else if (targetType === 'settings') {
        setSettingsPos({ x: currentX, y: currentY });
      } else if (targetType === 'boot') {
        setBootPos({ x: currentX, y: currentY });
      }
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return (
    <>
      <div
        className="desktop"
        onContextMenu={(e) => {
          if (e.target.closest('.window, .taskbar, .desktop-icon, .settings-window, .bsod-screen, .loading-dialog')) return;
          e.preventDefault();
          setCtxMenu({
            x: Math.min(e.clientX, window.innerWidth - 170),
            y: Math.min(e.clientY, window.innerHeight - 90),
          });
        }}
        onPointerDown={() => setCtxMenu(null)}
      />

      <div className="desktop-icons">
        <button
          type="button"
          ref={iconRef}
          className="desktop-icon"
          onClick={startBoot}
        >
          {pcSrc ? (
            <img src={pcSrc} width="32" height="32" alt="" onError={() => setPcSrc(null)} />
          ) : (
            <ComputerIcon />
          )}
          <span className="desktop-icon-label">My Computer</span>
        </button>

        <button
          type="button"
          className="desktop-icon"
          onClick={openWyind}
        >
          <img
            src="/avatar.jpg"
            width="32"
            height="32"
            alt=""
            style={{ border: '1px solid var(--hl-1)' }}
          />
          <span className="desktop-icon-label">wyind</span>
        </button>

        {settings.desktopSettingsIcon && (
          <button
            type="button"
            className="desktop-icon"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon />
            <span className="desktop-icon-label">Settings</span>
          </button>
        )}
      </div>

      {ctxMenu && (
        <div className="ctx-menu" style={{ left: ctxMenu.x, top: ctxMenu.y }} role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCtxMenu(null);
              refreshStars();
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setCtxMenu(null);
              setShowSettings(true);
            }}
          >
            Properties
          </button>
        </div>
      )}

      <div
        ref={windowRef}
        className={'window site-window' + (maximized ? ' is-max' : '') + (glitching && settings.glitch ? ' is-glitch' : '')}
        hidden={!isOpen || isMinimized}
        tabIndex={-1}
        style={
          !maximized && mainPos
            ? { left: `${mainPos.x}px`, top: `${mainPos.y}px`, right: 'auto', marginInline: 0 }
            : undefined
        }
        onPointerDown={() => setCtxMenu(null)}
      >
        <div
          className="title-bar active"
          onDoubleClick={toggleMax}
          onPointerDown={(e) => startWindowDrag(e, 'main')}
        >
          <span className="title-bar-text">wyind</span>
          <div className="title-bar-controls">
            <button type="button" aria-label="Minimize" onClick={minimizeWyind} />
            <button type="button" aria-label={maximized ? 'Restore' : 'Maximize'} onClick={toggleMax} />
            <button type="button" aria-label="Close" onClick={closeWindow} />
          </div>
        </div>

        <nav className="menu-bar">
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="window-body">
          <main id="top">

            <section className="hero">
              <img className="avatar" src="/avatar.jpg" alt="wyind" width="72" height="72" />

              <h1>wyind</h1>
              <p className="tagline">I tinker with Linux, build browsers, and make terminal tools. Usually at 2am.</p>

              <p className="links">
                <a href="https://github.com/Wyind" target="_blank" rel="noopener">GitHub &#8599;</a>
                <a href="https://x.com/wyindszn" target="_blank" rel="noopener">X / Twitter &#8599;</a>
                <a href="#projects">Projects</a>
              </p>
            </section>

            <section id="about">
              <h2>## about</h2>
              <div className="prose">
                <p>
                  Hey, I'm <strong>wyind.</strong> I make stuff for Linux. Mostly browsers, TUI tools, and whatever else sounds fun at 2am.
                </p>
                <p>
                  My daily driver is a desktop running <strong>Ubuntu 26.10</strong>. The <strong>ThinkPad X13 Gen 2</strong> is a separate setup and stays on Fedora. There's also a <strong>T420</strong> sitting in a box with a broken screen. I'll fix it eventually, who really cares :)
                </p>
                <p>
                  I'm really into <strong>right to repair</strong>. Things should be built to last, be fixable, and not need a subscription to exist. Same reason I love <strong>Casio watches</strong> and ThinkPads: honest, durable, repairable hardware. I keep thinking about a <strong>Fairphone 6</strong>, but I haven't committed yet.
                </p>
                <p>
                  Outside of games and code, I like cat gifs quite a bit.
                </p>
              </div>
            </section>

            <section id="projects">
              <h2>## projects</h2>
              <p className="projects-intro">
                <img src="/abyss_software_logo_transparent_arrow.svg" alt="" width="20" height="20" />
                <span>Everything below lives under <a href="https://github.com/abysssoftware-dev" target="_blank" rel="noopener">Abyss Software &#8599;</a>, where my stuff ends up.</span>
              </p>

              <ul className="project-list">
                <li>
                  <h3>Umbra Browser</h3>
                  <p>A browser I'm building from scratch. Fast, private, and mine.</p>
                  <a href="https://umbra-browser.org" target="_blank" rel="noopener">umbra-browser.org &#8599;</a>
                </li>

                <li>
                  <h3>ascii-studio</h3>
                  <p>Make ASCII art, avatars, and banners in your terminal.</p>
                  <a href="https://github.com/Wyind/ascii-studio" target="_blank" rel="noopener">github.com/Wyind/ascii-studio &#8599;</a>
                </li>

                <li>
                  <h3>aether</h3>
                  <p>A TUI text editor. It lives in the terminal.</p>
                  <a href="https://github.com/Wyind/aether" target="_blank" rel="noopener">github.com/Wyind/aether &#8599;</a>
                </li>
              </ul>
            </section>

            <section id="contact">
              <h2>## contact</h2>
              <p className="prose">If you want to talk about Linux, browsers, or open source, I'm easy to find.</p>
              <p className="links">
                <a href="https://github.com/Wyind" target="_blank" rel="noopener">GitHub &#8599;</a>
                <a href="https://x.com/wyindszn" target="_blank" rel="noopener">X / Twitter &#8599;</a>
              </p>
            </section>

          </main>
        </div>

        <div className="status-bar">
          <div className="status-bar-field"><span>&copy; {year} wyind</span></div>
          <div className="status-bar-field"><span>view source is encouraged</span></div>
          <div className="status-bar-field mute-field">
            <button
              type="button"
              className="mute-btn"
              onClick={() => updateSetting('muted', !settings.muted)}
              aria-pressed={settings.muted}
              aria-label={settings.muted ? 'Unmute' : 'Mute'}
              title={settings.muted ? 'Sound off' : 'Sound on'}
            >
              {settings.muted ? <SpeakerOffIcon /> : <SpeakerIcon />}
            </button>
          </div>
        </div>
      </div>

      {booting && (
        <div
          className={'loading-dialog window' + (glitching && settings.glitch ? ' is-glitch' : '')}
          role="dialog"
          aria-modal="false"
          aria-label="Starting My Computer"
          style={
            bootPos
              ? { left: `${bootPos.x}px`, top: `${bootPos.y}px`, transform: 'none' }
              : undefined
          }
          onPointerDown={() => setCtxMenu(null)}
        >
          <div className="title-bar active" onPointerDown={(e) => startWindowDrag(e, 'boot')}>
            <span className="title-bar-text">My Computer</span>
            <div className="title-bar-controls">
              <button type="button" aria-label="Close" onClick={cancelBoot} />
            </div>
          </div>
          <div className="window-body">
            <div className="loading-content">
              {pcSrc ? (
                <img src={pcSrc} width="32" height="32" alt="" onError={() => setPcSrc(null)} />
              ) : (
                <ComputerIcon />
              )}
              <div className="loading-text">
                <span>{BOOT_STAGES[bootStage] || BOOT_STAGES[0]}</span>
              </div>
            </div>
            <div className="progress-indicator segmented">
              <span className="progress-indicator-bar" style={{ width: `${bootProgress}%` }} />
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={cancelBoot}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div
          className="settings-window"
          role="dialog"
          aria-modal="false"
          aria-label="Settings"
          style={
            settingsPos
              ? { left: `${settingsPos.x}px`, top: `${settingsPos.y}px`, transform: 'none' }
              : undefined
          }
          onPointerDown={() => setCtxMenu(null)}
        >
          <div className="title-bar active" onPointerDown={(e) => startWindowDrag(e, 'settings')}>
            <span className="title-bar-text">Settings</span>
            <div className="title-bar-controls">
              <button type="button" aria-label="Close" onClick={() => setShowSettings(false)} />
            </div>
          </div>

          <div className="window-body">
            <fieldset>
              <legend>Sound</legend>
              <div className="field-row">
                <input
                  type="checkbox"
                  id="setting-sound"
                  checked={!settings.muted}
                  onChange={(e) => updateSetting('muted', !e.target.checked)}
                />
                <label htmlFor="setting-sound">Enable sound effects (clicks, boot sound)</label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Display</legend>
              <div className="field-row">
                <input
                  type="checkbox"
                  id="setting-stars"
                  checked={settings.stars}
                  onChange={(e) => updateSetting('stars', e.target.checked)}
                />
                <label htmlFor="setting-stars">Starfield wallpaper</label>
              </div>
              <div className="field-row">
                <input
                  type="checkbox"
                  id="setting-glitch"
                  checked={settings.glitch}
                  onChange={(e) => updateSetting('glitch', e.target.checked)}
                />
                <label htmlFor="setting-glitch">CRT & glitch effects</label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Desktop</legend>
              <div className="field-row">
                <input
                  type="checkbox"
                  id="setting-startup"
                  checked={settings.openOnStartup}
                  onChange={(e) => updateSetting('openOnStartup', e.target.checked)}
                />
                <label htmlFor="setting-startup">Open wyind page on startup</label>
              </div>
              <div className="field-row">
                <input
                  type="checkbox"
                  id="setting-desktopicon"
                  checked={settings.desktopSettingsIcon}
                  onChange={(e) => updateSetting('desktopSettingsIcon', e.target.checked)}
                />
                <label htmlFor="setting-desktopicon">Show Settings shortcut on desktop</label>
              </div>
            </fieldset>

            <div className="dialog-actions">
              <button type="button" onClick={() => setShowSettings(false)}>
                OK
              </button>
              <button type="button" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {bsod && (
        <div
          className="bsod-screen"
          role="alertdialog"
          tabIndex={0}
          onClick={() => setBsod(false)}
          ref={(el) => el && el.focus()}
        >
          <div className="bsod-inner">
            <div className="bsod-header-wrap">
              <span className="bsod-header">Windows</span>
            </div>
            <p>
              A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
              00010E36. The current application will be terminated.
            </p>
            <br />
            <p>* Press any key to terminate the current application.</p>
            <p>
              * Press CTRL+ALT+DEL again to restart your computer. You will lose any
              unsaved information in all applications.
            </p>
            <br />
            <p>
              Press any key or click to continue <span className="bsod-blink">_</span>
            </p>
          </div>
        </div>
      )}

      {dragOutline && (
        <div
          className="window-drag-outline"
          style={{
            left: `${dragOutline.x}px`,
            top: `${dragOutline.y}px`,
            width: `${dragOutline.width}px`,
            height: `${dragOutline.height}px`,
          }}
        />
      )}

      <Taskbar
        isOpen={isOpen}
        isMinimized={isMinimized}
        onToggle={toggleWyind}
        onNav={openAt}
        onOpenWyind={openWyind}
        onMyComputer={startBoot}
        onShutdown={() => setShutdown(true)}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings((v) => !v)}
        onOpenSettings={() => setShowSettings(true)}
        muted={settings.muted}
        onToggleMute={() => updateSetting('muted', !settings.muted)}
      />

      {shutdown && (
        <div className="shutdown" role="dialog" aria-modal="true" aria-label="System shutdown">
          <p>It is now safe to turn off your computer.</p>
          <div className="shutdown-actions">
            <button type="button" ref={shutdownBtnRef} onClick={reboot}>
              Restart
            </button>
            <button type="button" onClick={() => window.close()}>
              Turn Off
            </button>
          </div>
        </div>
      )}
    </>
  );
}
