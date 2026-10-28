import { useEffect, useState } from 'react';
import { ComputerIcon, SettingsIcon, SpeakerIcon, SpeakerOffIcon, StartGlyph } from './icons.jsx';

export default function Taskbar({
  isOpen,
  isMinimized,
  onToggle,
  onNav,
  onOpenWyind,
  onMyComputer,
  onShutdown,
  showSettings,
  onToggleSettings,
  onOpenSettings,
  muted,
  onToggleMute,
}) {
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
                onOpenWyind();
              }}
            >
              <img src="/avatar.jpg" width="16" height="16" alt="" style={{ borderRadius: '2px' }} />
              <span>wyind</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setStartOpen(false);
                onMyComputer();
              }}
            >
              {pcSrc ? (
                <img src={pcSrc} width="16" height="16" alt="" onError={() => setPcSrc(null)} />
              ) : (
                <ComputerIcon small />
              )}
              <span>My Computer</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setStartOpen(false);
                onOpenSettings();
              }}
            >
              <SettingsIcon small />
              <span>Settings</span>
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

      {isOpen && (
        <button
          type="button"
          className={'taskbar-window' + (!isMinimized ? ' is-open is-pressed' : '')}
          onClick={onToggle}
          title={!isMinimized ? 'Click to minimize wyind' : 'Click to restore wyind'}
        >
          <img
            src="/avatar.jpg"
            width="14"
            height="14"
            alt=""
            style={{ borderRadius: '1px', flexShrink: 0 }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>wyind</span>
        </button>
      )}

      {showSettings && (
        <button
          type="button"
          className="taskbar-window is-open is-pressed"
          onClick={onToggleSettings}
          title={showSettings ? 'Click to minimize Settings' : 'Click to restore Settings'}
        >
          <SettingsIcon small />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Settings</span>
        </button>
      )}

      <div className="taskbar-spacer" />
      <div className="taskbar-tray">
        <button
          type="button"
          className="tray-btn"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
        >
          <SettingsIcon small />
        </button>
        <button
          type="button"
          className="tray-btn"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          title={muted ? 'Sound: Muted' : 'Sound: Enabled'}
        >
          {muted ? <SpeakerOffIcon /> : <SpeakerIcon />}
        </button>
        <span className="taskbar-clock">{clock}</span>
      </div>
    </div>
  );
}
