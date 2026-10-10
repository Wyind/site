(function () {
  'use strict';

  let audioCtx = null;
  let sfxGain = null;
  let sfxEnabled = true;
  let sfxVolume = 0.5;
  let radarEnabled = true;
  const SETTINGS = window.WYIND_SETTINGS || null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        sfxGain = audioCtx.createGain();
        sfxGain.gain.value = sfxVolume;
        sfxGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playPostBeep() {
    initAudioContext();
    if (!audioCtx || !sfxEnabled) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  function playKeyClackSFX() {
    initAudioContext();
    if (!audioCtx || !sfxEnabled) return;

    try {
      const now = audioCtx.currentTime;

      const bufferSize = Math.floor(audioCtx.sampleRate * 0.026);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.0035));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const snapFilter = audioCtx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(3800 + Math.random() * 500, now);
      snapFilter.Q.value = 3.6;

      const snapGain = audioCtx.createGain();
      snapGain.gain.setValueAtTime(0.28, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      noise.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(sfxGain);

      noise.start(now);

      const pingFreq = 2250 + Math.random() * 300;
      const pingOsc = audioCtx.createOscillator();
      const pingGain = audioCtx.createGain();

      pingOsc.type = 'triangle';
      pingOsc.frequency.setValueAtTime(pingFreq, now);
      pingOsc.frequency.exponentialRampToValueAtTime(pingFreq * 0.6, now + 0.028);

      pingGain.gain.setValueAtTime(0.18, now);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      pingOsc.connect(pingGain);
      pingGain.connect(sfxGain);

      pingOsc.start(now);
      pingOsc.stop(now + 0.03);
    } catch (e) {}
  }

  (function initClickRadar() {
    const canvas = document.getElementById('click-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rings = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('pointerdown', (e) => {
      flashDiskLED();
      playKeyClackSFX();
      if (!radarEnabled) return;

      rings.push({
        x: e.clientX,
        y: e.clientY,
        r: 4,
        alpha: 0.9,
        maxR: 38
      });
    });

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rings = rings.filter(r => r.alpha > 0.01);

      for (const r of rings) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(77, 168, 255, ${r.alpha.toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        if (r.r < 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, 3.5 * (1 - r.r / 15), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(77, 168, 255, ${r.alpha.toFixed(3)})`;
          ctx.fill();
        }

        r.r += 2.4;
        r.alpha -= 0.04;
      }

      requestAnimationFrame(draw);
    }
    draw();
  })();

  const diskLED = document.getElementById('disk-led');
  let diskTimeout = null;

  function flashDiskLED() {
    if (!diskLED) return;
    diskLED.classList.add('active');
    diskLED.style.opacity = '1';

    if (diskTimeout) clearTimeout(diskTimeout);
    diskTimeout = setTimeout(() => {
      diskLED.classList.remove('active');
      diskLED.style.opacity = '0.35';
    }, 60 + Math.random() * 70);
  }

  window.addEventListener('scroll', () => {
    if (Math.random() < 0.25) flashDiskLED();
  }, { passive: true });

  const bootOverlay = document.getElementById('boot-overlay');
  let hasBooted = false;

  function bootSystem() {
    if (hasBooted) return;
    hasBooted = true;
    if (!SETTINGS || SETTINGS.get('bootBeep')) playPostBeep();
    if (bootOverlay) {
      bootOverlay.classList.add('booted');
      setTimeout(() => {
        bootOverlay.style.display = 'none';
      }, 500);
    }
    flashDiskLED();
    if (!SETTINGS || SETTINGS.get('autoplay')) playTrack();
  }

  if (bootOverlay) {
    bootOverlay.addEventListener('click', bootSystem);
    bootOverlay.addEventListener('pointerdown', bootSystem);
    window.addEventListener('keydown', () => {
      if (!hasBooted) bootSystem();
    });
  }

  let isDarkMode = localStorage.getItem('wyind-theme-v2') !== 'light';

  function applyTheme(dark) {
    isDarkMode = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('wyind-theme-v2', dark ? 'dark' : 'light');
  }

  applyTheme(isDarkMode);

  const sfxBtn = document.getElementById('sfx-toggle-btn');

  function setSfxEnabled(on) {
    sfxEnabled = !!on;
    if (sfxBtn) {
      sfxBtn.innerHTML = sfxEnabled
        ? '<span><i class="fa-solid fa-keyboard"></i> CLICKS: ON</span>'
        : '<span><i class="fa-solid fa-keyboard"></i> CLICKS: OFF</span>';
    }
  }
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      if (SETTINGS) SETTINGS.set('clickSfx', !sfxEnabled);
      else setSfxEnabled(!sfxEnabled);
    });
  }

  const playlist = [
    { title: "coldlikedecemberv4", artist: "SailorHearts", file: "assets/coldjustlikedecemberV4 - SailorHearts.mp3", durationDisplay: "—" },
    { title: "Planet Superstars", artist: "Sega Superstars Tennis — Sonic's Mixtapes", file: "assets/Planet Superstars - Sega Superstars Tennis - Sonic's Mixtapes.mp3", durationDisplay: "—" },
    { title: "Lufia 2: Boss Battle Theme", artist: "GSS1-Sirius", file: "assets/Lufia 2： Boss battle theme - GSS1-Sirius.mp3", durationDisplay: "—" },
    { title: "Flying Battery Zone", artist: "SomeBoyWhoMusics", file: "assets/Flying Battery Zone「フライングバッテリーゾーン」[YM2151, YMZ280B] - SomeBoyWhoMusics.mp3", durationDisplay: "—" },
    { title: "Ano ko Secret [8-bit]", artist: "DastardlyNun", file: "assets/E ve - Ano ko Secret [8-bit] Cover - DastardlyNun.mp3", durationDisplay: "—" },
    { title: "Data Select", artist: "SomeBoyWhoMusics", file: "assets/Data Select「データ選択」[YM2151, SEGAPCM] - SomeBoyWhoMusics.mp3", durationDisplay: "—" },
    { title: "Illusion of Control", artist: "usedcvnt", file: "assets/illusion of control - usedcvnt.mp3", durationDisplay: "—" },
    { title: "Serial Experiments", artist: "RoseHipRose", file: "assets/Serial Experiments - RoseHipRose.mp3", durationDisplay: "—" },
    { title: "Sewerslvt - All the Joy", artist: "Sewerslvt", file: "assets/Sewerslvt - all the joy In life was gone once you left - Sewerslvt.mp3", durationDisplay: "—" }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false;
  let currentVolume = window.WYIND_SETTINGS ? (Number(window.WYIND_SETTINGS.get('musicVolume')) / 100) : 0.12;

  const audioPlayer = new Audio();
  audioPlayer.preload = "auto";
  audioPlayer.volume = currentVolume;

  const musicPanel = document.getElementById('music-panel');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const playerCloseBtn = document.getElementById('player-close-btn');
  const playerPlayBtn = document.getElementById('player-play-btn');
  const playerPrevBtn = document.getElementById('player-prev-btn');
  const playerNextBtn = document.getElementById('player-next-btn');
  const playerShuffleBtn = document.getElementById('player-shuffle-btn');
  const playerRepeatBtn = document.getElementById('player-repeat-btn');
  const playerTrackTitle = document.getElementById('player-track-title');
  const playerTrackArtist = document.getElementById('player-track-artist');
  const dockTitlePreview = document.getElementById('dock-title-preview');
  const playerProgressBar = document.getElementById('player-progress-bar');
  const playerProgressFill = document.getElementById('player-progress-fill');
  const playerCurrentTime = document.getElementById('player-current-time');
  const playerDuration = document.getElementById('player-duration');
  const playerVolSlider = document.getElementById('player-vol-slider');
  const playerPlaylistItems = document.getElementById('player-playlist-items');

  function formatTime(sec) {
    if (isNaN(sec) || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function renderPlaylist() {
    if (!playerPlaylistItems) return;
    playerPlaylistItems.innerHTML = '';

    playlist.forEach((track, idx) => {
      const item = document.createElement('div');
      item.className = `playlist-item ${idx === currentTrackIdx ? 'active' : ''}`;
      item.innerHTML = `
        <span>${idx + 1}. ${track.title}</span>
        <span style="font-size:0.68rem; color:var(--text-muted);">${track.durationDisplay}</span>
      `;
      item.addEventListener('click', () => {
        loadTrack(idx);
        playTrack();
      });
      playerPlaylistItems.appendChild(item);
    });
  }

  function loadTrack(idx) {
    currentTrackIdx = idx;
    const track = playlist[currentTrackIdx];

    audioPlayer.src = encodeURI(track.file);
    audioPlayer.currentTime = 0;

    if (playerTrackTitle) playerTrackTitle.textContent = track.title;
    if (playerTrackArtist) playerTrackArtist.textContent = track.artist;
    if (dockTitlePreview) dockTitlePreview.textContent = track.title;
    if (playerDuration) playerDuration.textContent = track.durationDisplay;
    if (playerCurrentTime) playerCurrentTime.textContent = '0:00';
    if (playerProgressFill) playerProgressFill.style.width = '0%';

    renderPlaylist();
  }

  function playTrack() {
    initAudioContext();
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isPlaying = true;
        if (playerPlayBtn) playerPlayBtn.textContent = 'PAUSE';
        if (musicToggleBtn) musicToggleBtn.classList.add('playing');
      }).catch(() => {
        isPlaying = false;
if (playerPlayBtn) playerPlayBtn.textContent = 'PLAY';
        if (musicToggleBtn) musicToggleBtn.classList.remove('playing');
      });
    }
  }

  function pauseTrack() {
    audioPlayer.pause();
    isPlaying = false;
    if (playerPlayBtn) playerPlayBtn.textContent = 'PLAY';
    if (musicToggleBtn) musicToggleBtn.classList.remove('playing');
  }

  function nextTrack() {
    let nextIdx = currentTrackIdx + 1;
    if (isShuffle) {
      if (playlist.length > 1) {
        do {
          nextIdx = Math.floor(Math.random() * playlist.length);
        } while (nextIdx === currentTrackIdx);
      } else {
        nextIdx = 0;
      }
    } else if (nextIdx >= playlist.length) {
      nextIdx = 0;
    }
    loadTrack(nextIdx);
    playTrack();
  }

  function prevTrack() {
    let prevIdx = currentTrackIdx - 1;
    if (isShuffle) {
      if (playlist.length > 1) {
        do {
          prevIdx = Math.floor(Math.random() * playlist.length);
        } while (prevIdx === currentTrackIdx);
      } else {
        prevIdx = 0;
      }
    } else if (prevIdx < 0) {
      prevIdx = playlist.length - 1;
    }
    loadTrack(prevIdx);
    playTrack();
  }

  audioPlayer.addEventListener('timeupdate', () => {
    if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
      const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      if (playerProgressFill) playerProgressFill.style.width = `${pct}%`;
      if (playerCurrentTime) playerCurrentTime.textContent = formatTime(audioPlayer.currentTime);
      if (playerDuration) playerDuration.textContent = formatTime(audioPlayer.duration);
    }
  });

  audioPlayer.addEventListener('loadedmetadata', () => {
    if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
      if (playerDuration) playerDuration.textContent = formatTime(audioPlayer.duration);
    }
  });

  audioPlayer.addEventListener('ended', () => {
    if (isRepeat) {
      audioPlayer.currentTime = 0;
      playTrack();
    } else {
      nextTrack();
    }
  });

  if (playerPlayBtn) {
    playerPlayBtn.addEventListener('click', () => {
      if (isPlaying) pauseTrack();
      else playTrack();
    });
  }

  if (playerNextBtn) playerNextBtn.addEventListener('click', nextTrack);
  if (playerPrevBtn) playerPrevBtn.addEventListener('click', prevTrack);

  if (playerShuffleBtn) {
    playerShuffleBtn.addEventListener('click', () => {
      isShuffle = !isShuffle;
      playerShuffleBtn.classList.toggle('active', isShuffle);
    });
  }

  if (playerRepeatBtn) {
    playerRepeatBtn.addEventListener('click', () => {
      isRepeat = !isRepeat;
      playerRepeatBtn.classList.toggle('active', isRepeat);
    });
  }

  if (playerProgressBar) {
    playerProgressBar.addEventListener('click', (e) => {
      const rect = playerProgressBar.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      if (!isNaN(audioPlayer.duration) && audioPlayer.duration > 0) {
        audioPlayer.currentTime = pct * audioPlayer.duration;
      }
    });
  }

  if (playerVolSlider) {
    playerVolSlider.value = currentVolume;
    playerVolSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      currentVolume = val;
      audioPlayer.volume = val;
      if (SETTINGS) SETTINGS.set('musicVolume', Math.round(val * 100), { silent: true });
    });
  }

  if (musicToggleBtn && musicPanel) {
    musicToggleBtn.addEventListener('click', () => {
      musicPanel.classList.toggle('collapsed');
    });
  }

  if (playerCloseBtn && musicPanel) {
    playerCloseBtn.addEventListener('click', () => {
      musicPanel.classList.add('collapsed');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (SETTINGS && (!SETTINGS.get('hotkeys') || SETTINGS.isOpen())) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (isPlaying) pauseTrack();
      else playTrack();
    } else if (e.key === 't' || e.key === 'T') {
      if (SETTINGS) SETTINGS.set('theme', isDarkMode ? 'light' : 'dark');
      else applyTheme(!isDarkMode);
    } else if (e.key === 'k' || e.key === 'K') {
      if (sfxBtn) sfxBtn.click();
    } else if (e.key === 'n' || e.key === 'ArrowRight') {
      nextTrack();
    } else if (e.key === 'p' || e.key === 'ArrowLeft') {
      prevTrack();
    } else if (e.key === 'm' || e.key === 'M') {
      if (audioPlayer.volume > 0) {
        audioPlayer.volume = 0;
        if (playerVolSlider) playerVolSlider.value = 0;
      } else {
        audioPlayer.volume = currentVolume || 0.12;
        if (playerVolSlider) playerVolSlider.value = audioPlayer.volume;
      }
    }
  });

  /* ---- settings bridge: apply runtime-only settings owned by this file ---- */
  function applyRuntimeSetting(key, value) {
    switch (key) {
      case 'theme':
        applyTheme(value !== 'light');
        break;
      case 'musicVolume':
        currentVolume = value / 100;
        audioPlayer.volume = currentVolume;
        if (playerVolSlider) playerVolSlider.value = currentVolume;
        break;
      case 'clickSfx':
        setSfxEnabled(value);
        break;
      case 'clickVolume':
        sfxVolume = value / 100;
        if (sfxGain) sfxGain.gain.value = sfxVolume;
        break;
      case 'clickRadar':
        radarEnabled = !!value;
        break;
    }
  }

  if (SETTINGS) {
    const all = SETTINGS.all();
    Object.keys(all).forEach((k) => applyRuntimeSetting(k, all[k]));
    window.addEventListener('wyind:setting', (e) => applyRuntimeSetting(e.detail.key, e.detail.value));
  }

  loadTrack(0);

})();
