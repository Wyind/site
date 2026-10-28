import { useEffect, useState } from 'react';
import { ComputerIcon, StartGlyph } from './icons.jsx';

export default function Taskbar({ open, onToggle, onNav, onBoot, onShutdown }) {
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState('');
  const [pcSrc, setPcSrc] = useState('/mypc.png');

  useEffect(() => {
    function tick() {
      const d = new Date();
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      setClock(h + ':' + m + ' ' + ap);
    }
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onDown(e) {
      if (!startOpen) return;
      if (e.target.closest('.start-menu, .start-button')) return;
      setStartOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setStartOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [startOpen]);

  function nav(section) {
    setStartOpen(false);
    onNav(section);
  }

  return (
    <div className="taskbar">
      {startOpen && (
        <div className="start-menu" role="menu">
          <div className="start-banner" aria-hidden="true">
            <span>wyind98</span>
          </div>
          <div className="start-items">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setStartOpen(false);
                onBoot();
              }}
            >
              {pcSrc ? (
                <img src={pcSrc} width="16" height="16" alt="" onError={() => setPcSrc(null)} />
              ) : (
                <ComputerIcon small />
              )}
              <span>My Computer</span>
            </button>
            <div className="start-sep" />
            <button type="button" role="menuitem" onClick={() => nav('about')}>
              About
            </button>
            <button type="button" role="menuitem" onClick={() => nav('projects')}>
              Projects
            </button>
            <button type="button" role="menuitem" onClick={() => nav('contact')}>
              Contact
            </button>
            <div className="start-sep" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setStartOpen(false);
                onShutdown();
              }}
            >
              Shut Down...
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className="start-button"
        aria-expanded={startOpen}
        aria-label="Start"
        onClick={() => setStartOpen((v) => !v)}
      >
        <StartGlyph />
        <span>Start</span>
      </button>
      <button
        type="button"
        className={'taskbar-window' + (open ? ' is-open is-pressed' : '')}
        onClick={onToggle}
      >
        <span>wyind</span>
      </button>
      <div className="taskbar-spacer" />
      <div className="taskbar-tray">
        <span className="taskbar-clock">{clock}</span>
      </div>
    </div>
  );
}
