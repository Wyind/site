(function () {
  'use strict';

  
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');

  const THEME_ICONS = { light: '☾', dark: '☀' };

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('wyind-theme', theme);
    if (themeToggle) themeToggle.textContent = THEME_ICONS[theme];
  }

  setTheme(root.getAttribute('data-theme') || 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    }
  });

  
  const playlist = [
    { title: "Cold Like December v4", artist: "SailorHearts", file: "assets/coldjustlikedecemberV4 - SailorHearts.mp3" },
    { title: "Planet Superstars", artist: "Sega Superstars Tennis — Sonic's Mixtapes", file: "assets/Planet Superstars - Sega Superstars Tennis - Sonic's Mixtapes.mp3" },
    { title: "Lufia 2: Boss Battle Theme", artist: "GSS1-Sirius", file: "assets/Lufia 2： Boss battle theme - GSS1-Sirius.mp3" },
    { title: "Flying Battery Zone", artist: "SomeBoyWhoMusics", file: "assets/Flying Battery Zone「フライングバッテリーゾーン」[YM2151, YMZ280B] - SomeBoyWhoMusics.mp3" },
    { title: "Ano ko Secret [8-bit]", artist: "DastardlyNun", file: "assets/E ve - Ano ko Secret [8-bit] Cover - DastardlyNun.mp3" },
    { title: "Data Select", artist: "SomeBoyWhoMusics", file: "assets/Data Select「データ選択」[YM2151, SEGAPCM] - SomeBoyWhoMusics.mp3" },
    { title: "Illusion of Control", artist: "usedcvnt", file: "assets/illusion of control - usedcvnt.mp3" },
    { title: "Serial Experiments", artist: "RoseHipRose", file: "assets/Serial Experiments - RoseHipRose.mp3" },
    { title: "All the Joy", artist: "Sewerslvt", file: "assets/Sewerslvt - all the joy In life was gone once you left - Sewerslvt.mp3" }
  ];

  const audio = new Audio();
  audio.preload = 'metadata';

  const storedVol = parseFloat(localStorage.getItem('wyind-volume'));
  let currentVolume = Number.isFinite(storedVol) ? storedVol : 0.2;
  audio.volume = currentVolume;

  let currentIdx = 0;
  let isPlaying = false;
  let wantsPlay = false;

  const panel = document.getElementById('music-panel');
  const toggleBtn = document.getElementById('music-toggle-btn');
  const closeBtn = document.getElementById('player-close-btn');
  const playBtn = document.getElementById('player-play-btn');
  const prevBtn = document.getElementById('player-prev-btn');
  const nextBtn = document.getElementById('player-next-btn');
  const titleEl = document.getElementById('player-track-title');
  const artistEl = document.getElementById('player-track-artist');
  const dockTitle = document.getElementById('dock-title-preview');
  const progressBar = document.getElementById('player-progress-bar');
  const progressFill = document.getElementById('player-progress-fill');
  const currentTimeEl = document.getElementById('player-current-time');
  const durationEl = document.getElementById('player-duration');
  const volSlider = document.getElementById('player-vol-slider');
  const playlistEl = document.getElementById('player-playlist-items');

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = '';
    playlist.forEach((track, idx) => {
      const item = document.createElement('div');
      item.className = 'playlist-item' + (idx === currentIdx ? ' active' : '');
      item.innerHTML = '<span></span><span></span>';
      item.children[0].textContent = track.title;
      item.children[1].textContent = track.artist;
      item.addEventListener('click', () => {
        loadTrack(idx);
        play();
      });
      playlistEl.appendChild(item);
    });
  }

  function loadTrack(idx) {
    currentIdx = idx;
    const track = playlist[currentIdx];
    audio.src = encodeURI(track.file);
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (dockTitle) dockTitle.textContent = track.title;
    if (currentTimeEl) currentTimeEl.textContent = '0:00';
    if (durationEl) durationEl.textContent = '0:00';
    if (progressFill) progressFill.style.width = '0%';
    renderPlaylist();
  }

  function play() {
    wantsPlay = true;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        isPlaying = true;
        updatePlayUI();
      }).catch(() => {
        isPlaying = false;
        updatePlayUI();
      });
    } else {
      isPlaying = true;
      updatePlayUI();
    }
  }

  function pause() {
    wantsPlay = false;
    audio.pause();
    isPlaying = false;
    updatePlayUI();
  }

  function toggle() {
    if (isPlaying) pause();
    else play();
  }

  function updatePlayUI() {
    if (playBtn) playBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;';
    if (toggleBtn) toggleBtn.classList.toggle('playing', isPlaying);
  }

  function next() {
    loadTrack((currentIdx + 1) % playlist.length);
    if (wantsPlay) play();
  }

  function prev() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    loadTrack((currentIdx - 1 + playlist.length) % playlist.length);
    if (wantsPlay) play();
  }

  if (playBtn) playBtn.addEventListener('click', toggle);
  if (nextBtn) nextBtn.addEventListener('click', next);
  if (prevBtn) prevBtn.addEventListener('click', prev);

  audio.addEventListener('timeupdate', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      progressFill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', next);

  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const rect = progressBar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });
  }

  if (volSlider) {
    volSlider.value = currentVolume;
    volSlider.addEventListener('input', (e) => {
      currentVolume = parseFloat(e.target.value);
      audio.volume = currentVolume;
      localStorage.setItem('wyind-volume', String(currentVolume));
    });
  }

  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  }

  loadTrack(0);

  
  const gate = document.getElementById('gate');
  const enterBtn = document.getElementById('enter-btn');
  let entered = false;

  function enterSite() {
    if (!gate || entered) return;
    entered = true;
    gate.classList.add('leaving');
    document.body.classList.remove('gate-open');
    play();
    window.setTimeout(() => gate.classList.add('gone'), 550);
  }

  if (gate) gate.addEventListener('click', enterSite);
  if (enterBtn) enterBtn.addEventListener('click', (e) => { e.stopPropagation(); enterSite(); });

  document.addEventListener('keydown', (e) => {
    if (gate && gate.classList.contains('gone')) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      enterSite();
    }
  });

  
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
