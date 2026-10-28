import { useEffect, useRef, useState } from 'react';
import { makeStars } from './stars.js';
import { ComputerIcon, FlagIcon, ErrorIcon, SpeakerIcon, SpeakerOffIcon } from './components/icons.jsx';
import Taskbar from './components/Taskbar.jsx';

const TASKBAR_H = 28;

export default function App() {
  const year = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [pos, setPos] = useState(null);
  const [showError, setShowError] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [booting, setBooting] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [pcSrc, setPcSrc] = useState('/mypc.png');
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('wyind-muted') === '1';
    } catch {
      return false;
    }
  });

  const windowRef = useRef(null);
  const iconRef = useRef(null);
  const bootAudioRef = useRef(null);
  const bootTimersRef = useRef([]);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const shutdownBtnRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.backgroundImage = 'url("' + makeStars() + '")';
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      setCtxMenu(null);
      setShowError(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
    try {
      localStorage.setItem('wyind-muted', muted ? '1' : '0');
    } catch {}
  }, [muted]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-booting', booting);
    return () => document.documentElement.classList.remove('is-booting');
  }, [booting]);

  useEffect(
    () => () => {
      bootTimersRef.current.forEach((t) => clearTimeout(t));
      if (bootAudioRef.current) bootAudioRef.current.pause();
    },
    []
  );

  useEffect(() => {
    if (shutdown && shutdownBtnRef.current) shutdownBtnRef.current.focus();
  }, [shutdown]);

  function requestBoot() {
    if (open || booting) return;
    setCtxMenu(null);
    runBoot();
  }

  function reboot() {
    bootTimersRef.current.forEach((t) => clearTimeout(t));
    bootTimersRef.current = [];
    setOpen(false);
    setMaximized(false);
    setPos(null);
    setShutdown(false);
    runBoot();
  }

  function runBoot() {
    setBooting(true);
    const audio = new Audio('/boot.mp3');
    audio.volume = 0.8;
    audio.play().catch(() => {});
    bootAudioRef.current = audio;
    bootTimersRef.current.push(
      setTimeout(() => {
        setOpen(true);
        setGlitching(true);
        const el = windowRef.current;
        if (el) el.focus({ preventScroll: true });
      }, 30000)
    );
    bootTimersRef.current.push(
      setTimeout(() => {
        setGlitching(false);
        setBooting(false);
        const a = bootAudioRef.current;
        if (!a) return;
        let step = 0;
        const fade = setInterval(() => {
          step += 1;
          a.volume = Math.max(0, 0.8 * (1 - step / 10));
          if (step >= 10) {
            clearInterval(fade);
            a.pause();
          }
        }, 100);
      }, 36000)
    );
  }

  function focusWindow() {
    setOpen(true);
    requestAnimationFrame(() => {
      const el = windowRef.current;
      if (el) el.focus({ preventScroll: true });
    });
  }

  function openAt(section) {
    setCtxMenu(null);
    focusWindow();
    if (section) {
      requestAnimationFrame(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function closeWindow() {
    setOpen(false);
    setShowError(false);
    setMaximized(false);
    requestAnimationFrame(() => {
      if (iconRef.current) iconRef.current.focus();
    });
  }

  function toggleMax() {
    setMaximized((v) => !v);
  }

  function onTitleDown(e) {
    if (e.button !== 0 || maximized) return;
    if (e.target.closest('.title-bar-controls')) return;
    const el = windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const fromX = rect.left;
    const fromY = rect.top;
    setPos({ x: fromX, y: fromY });
    function onMove(ev) {
      const x = Math.max(-620, Math.min(fromX + (ev.clientX - startX), window.innerWidth - 80));
      const y = Math.max(0, Math.min(fromY + (ev.clientY - startY), window.innerHeight - 60));
      setPos({ x, y });
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function refreshStars() {
    document.documentElement.style.backgroundImage = 'url("' + makeStars() + '")';
  }

  const winStyle = maximized
    ? {
        position: 'fixed',
        margin: 0,
        left: 0,
        top: 0,
        right: 0,
        bottom: TASKBAR_H,
        maxWidth: 'none',
        width: 'auto',
        zIndex: 10,
      }
    : pos
      ? {
          position: 'fixed',
          margin: 0,
          left: pos.x,
          top: pos.y,
          width: 'min(680px, calc(100vw - 8px))',
          zIndex: 10,
        }
      : {};

  return (
    <>
      <div
        className="desktop"
        onContextMenu={(e) => {
          if (e.target.closest('.window, .taskbar, .desktop-icon, .error-dialog')) return;
          e.preventDefault();
          setCtxMenu({
            x: Math.min(e.clientX, window.innerWidth - 170),
            y: Math.min(e.clientY, window.innerHeight - 90),
          });
        }}
        onPointerDown={() => setCtxMenu(null)}
      />

      <button type="button" ref={iconRef} className="desktop-icon" onClick={requestBoot}>
        {pcSrc ? (
          <img src={pcSrc} width="32" height="32" alt="" onError={() => setPcSrc(null)} />
        ) : (
          <ComputerIcon />
        )}
        <span className="desktop-icon-label">My Computer</span>
      </button>

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
          <button type="button" role="menuitem" onClick={() => openAt('about')}>
            Properties
          </button>
        </div>
      )}

      <div
        ref={windowRef}
        className={'window site-window' + (maximized ? ' is-max' : '') + (glitching ? ' is-glitch' : '')}
        style={winStyle}
        hidden={!open}
        tabIndex={-1}
        onPointerDown={() => setCtxMenu(null)}
      >
        <div className="title-bar active" onPointerDown={onTitleDown} onDoubleClick={toggleMax}>
          <span className="title-bar-text">wyind</span>
          <div className="title-bar-controls">
            <button type="button" aria-label="Minimize" onClick={() => setOpen(false)} />
            <button type="button" aria-label="Maximize" onClick={toggleMax} />
            <button type="button" aria-label="Close" onClick={() => setShowError(true)} />
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
              onClick={() => setMuted((v) => !v)}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute' : 'Mute'}
              title={muted ? 'Sound off' : 'Sound on'}
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerIcon />}
            </button>
          </div>
        </div>
      </div>

      {showError && (
        <div className="error-dialog" role="dialog" aria-modal="true" aria-label="Error">
          <div className="title-bar active">
            <span className="title-bar-text">Error</span>
          </div>
          <div className="dialog-body">
            <ErrorIcon />
            <p>This program has performed an illegal operation and must be closed.</p>
          </div>
          <div className="dialog-actions">
            <button type="button" onClick={closeWindow}>OK</button>
          </div>
        </div>
      )}

      <Taskbar
        open={open || booting}
        onToggle={() => {
          if (booting) return;
          setOpen((v) => !v);
        }}
        onNav={openAt}
        onBoot={requestBoot}
        onShutdown={() => setShutdown(true)}
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
