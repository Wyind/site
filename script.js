// wyind-site interactive script

(function(){
  const canvas = document.getElementById('field');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
  }
  function make(){
    const count = Math.min(100, Math.floor(window.innerWidth / 14));
    particles = Array.from({length: count}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.35 + 0.06,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.45 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.85 ? 180 : 200
    }));
  }
  function init(){ resize(); make(); }
  window.addEventListener('resize', init);
  init();
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const scrollY = window.scrollY;
    const vTop = scrollY - 300, vBot = scrollY + window.innerHeight + 300;
    for(const p of particles){
      if(p.y < vTop || p.y > vBot) continue;
      p.twinkle += 0.018;
      const flicker = (Math.sin(p.twinkle) + 1) / 2;
      const a = (p.alpha * (0.35 + flicker * 0.65)).toFixed(3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},90%,80%,${a})`;
      ctx.fill();
      p.y -= p.speed;
      p.x += Math.sin(p.twinkle * 0.4) * 0.12 + p.drift * 0.015;
      if(p.y < vTop) p.y = vBot;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

(function(){
  const canvas = document.getElementById('click-ripple');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let ripples = [];
  function size(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  size();
  window.addEventListener('resize', size);
  window.addEventListener('pointerdown', e => {
    ripples.push({x:e.clientX, y:e.clientY, r:0, alpha:0.5});
  });
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ripples = ripples.filter(r => r.alpha > 0.01);
    for(const r of ripples){
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(143,245,255,${r.alpha.toFixed(3)})`; ctx.lineWidth=1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r*0.55,0,Math.PI*2);
      ctx.strokeStyle=`rgba(216,243,255,${(r.alpha*0.55).toFixed(3)})`; ctx.lineWidth=0.8; ctx.stroke();
      r.r+=3.4; r.alpha-=0.013;
    }
    requestAnimationFrame(draw);
  })();
})();

(function(){
  const canvas = document.getElementById('ripple-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let ripples=[];
  function size(){ canvas.width=canvas.parentElement.offsetWidth; canvas.height=canvas.parentElement.offsetHeight; }
  size(); window.addEventListener('resize', size);
  const hero = document.getElementById('hero');
  if(hero) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      ripples.push({x:e.clientX-r.left, y:e.clientY-r.top, r:0, alpha:0.3, big:false});
    });
    hero.addEventListener('pointerdown', e => {
      const r = hero.getBoundingClientRect();
      ripples.push({x:e.clientX-r.left, y:e.clientY-r.top, r:0, alpha:0.6, big:true});
    });
  }
  (function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ripples = ripples.filter(r=>r.alpha>0.01);
    for(const r of ripples){
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(143,245,255,${r.alpha.toFixed(3)})`; ctx.lineWidth=r.big?1.8:1; ctx.stroke();
      r.r+=r.big?2.8:1.6; r.alpha-=r.big?0.011:0.02;
    }
    requestAnimationFrame(draw);
  })();
})();

function getGradientColorAt(p) {
  const stops = [
    { p: 0.00, r: 28, g: 83, b: 150 },
    { p: 0.22, r: 18, g: 59, b: 112 },
    { p: 0.48, r: 10, g: 37, b: 76 },
    { p: 0.75, r: 5,  g: 21, b: 50 },
    { p: 1.00, r: 2,  g: 6,  b: 18 }
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (p >= stops[i].p && p <= stops[i+1].p) {
      const t = (p - stops[i].p) / (stops[i+1].p - stops[i].p);
      const r = Math.round(stops[i].r + t * (stops[i+1].r - stops[i].r));
      const g = Math.round(stops[i].g + t * (stops[i+1].g - stops[i].g));
      const b = Math.round(stops[i].b + t * (stops[i+1].b - stops[i].b));
      return { r, g, b };
    }
  }
  return { r: 2, g: 6, b: 18 };
}

// Card Mouse Glow & 3D Tilt
document.querySelectorAll('.card, .sea-panel').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    card.style.setProperty('--mouse-x', `${px}px`);
    card.style.setProperty('--mouse-y', `${py}px`);

    if (card.classList.contains('card')) {
      const x = px / r.width - 0.5;
      const y = py / r.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateY(-8px)`;
    }
  });
  card.addEventListener('mouseleave', () => {
    if (card.classList.contains('card')) {
      card.style.transform = '';
    }
  });
});

// Web Audio API Ambient Sound & Underwater Reverb Engine
let mainAudioCtx = null;
let oceanMasterGain = null;
let soundOn = true;
let lowpassNode = null;
let reverbNode = null;
let wetGainNode = null;

function getAudioCtx() {
  if (!mainAudioCtx) {
    mainAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setupUnderwaterGraph();
  }
  return mainAudioCtx;
}

function createUnderwaterReverbBuffer(ctx) {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * 5.0);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 1.2);
    const reflection = (t > 0.02 && t < 0.5 && (Math.sin(t * 160) > 0.8)) ? 2.6 : 1.0;
    
    const noiseL = (Math.random() * 2 - 1);
    const noiseR = (Math.random() * 2 - 1);

    left[i] = noiseL * decay * reflection * 6.5;
    right[i] = noiseR * decay * reflection * 6.5;
  }
  return impulse;
}

function setupUnderwaterGraph() {
  const ctx = mainAudioCtx;

  lowpassNode = ctx.createBiquadFilter();
  lowpassNode.type = 'lowpass';
  lowpassNode.frequency.value = 20000;
  lowpassNode.Q.value = 1.2;

  reverbNode = ctx.createConvolver();
  reverbNode.buffer = createUnderwaterReverbBuffer(ctx);

  wetGainNode = ctx.createGain();
  wetGainNode.gain.value = 0.0;

  lowpassNode.connect(reverbNode);
  reverbNode.connect(wetGainNode);
  wetGainNode.connect(ctx.destination);
  lowpassNode.connect(ctx.destination);
}

function updateOceanVolume() {
  if (!oceanMasterGain || !mainAudioCtx) return;
  const now = mainAudioCtx.currentTime;
  oceanMasterGain.gain.cancelScheduledValues(now);
  const isMusicActive = !audioTrack.paused && !audioTrack.muted && soundOn;
  const targetGain = isMusicActive ? 0.18 : 0.65;
  oceanMasterGain.gain.linearRampToValueAtTime(soundOn ? targetGain : 0, now + 0.6);
}

function playDivingSplashSFX() {
  if (!soundOn) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.35);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(700, now);
  lpf.frequency.exponentialRampToValueAtTime(160, now + 0.3);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.012, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  noise.connect(lpf);
  lpf.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
}

function playEmergingSplashSFX() {
  if (!soundOn) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.12));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(600, now);
  lpf.frequency.exponentialRampToValueAtTime(250, now + 0.35);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.012, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

  noise.connect(lpf);
  lpf.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);

  const tone = ctx.createOscillator();
  const toneGain = ctx.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(180, now);
  tone.frequency.exponentialRampToValueAtTime(110, now + 0.3);

  toneGain.gain.setValueAtTime(0.01, now);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

  tone.connect(toneGain);
  toneGain.connect(ctx.destination);
  tone.start(now);
  tone.stop(now + 0.35);
}

function buildOceanSound(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0;

  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for(let i = 0; i < bufferSize; i++){
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.8;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = 520;
  lpf.Q.value = 0.95;

  const waveLFO = ctx.createOscillator();
  waveLFO.type = 'sine';
  waveLFO.frequency.value = 0.14;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.08;

  const waveGain = ctx.createGain();
  waveGain.gain.value = 0.12;

  const swell2 = ctx.createOscillator();
  swell2.type = 'sine';
  swell2.frequency.value = 0.08;
  const swell2Gain = ctx.createGain();
  swell2Gain.gain.value = 0.05;

  noise.connect(lpf);
  lpf.connect(waveGain);
  waveGain.connect(master);

  waveLFO.connect(lfoGain);
  lfoGain.connect(waveGain.gain);

  swell2.connect(swell2Gain);
  swell2Gain.connect(waveGain.gain);

  noise.start();
  waveLFO.start();
  swell2.start();

  master.connect(lowpassNode);
  return master;
}

async function startSound() {
  const ctx = getAudioCtx();
  if (!oceanMasterGain) {
    oceanMasterGain = buildOceanSound(ctx);
  }
  if (ctx.state === 'suspended') await ctx.resume();
  soundOn = true;
  updateOceanVolume();
  updateMuteIcons();
}

function stopSound() {
  if (oceanMasterGain && mainAudioCtx) {
    oceanMasterGain.gain.cancelScheduledValues(mainAudioCtx.currentTime);
    oceanMasterGain.gain.setValueAtTime(oceanMasterGain.gain.value, mainAudioCtx.currentTime);
    oceanMasterGain.gain.linearRampToValueAtTime(0, mainAudioCtx.currentTime + 0.5);
  }
  soundOn = false;
  updateMuteIcons();
}

function updateMuteIcons() {
  const onMain = document.getElementById('sound-icon-on');
  const offMain = document.getElementById('sound-icon-off');

  if (soundOn && baseMusicVolume > 0) {
    if(onMain) onMain.style.display = '';
    if(offMain) offMain.style.display = 'none';
  } else {
    if(onMain) onMain.style.display = 'none';
    if(offMain) offMain.style.display = '';
  }
}

let preMuteVolume = 0.6;

function toggleMuteAll() {
  if (soundOn && baseMusicVolume > 0) {
    preMuteVolume = baseMusicVolume || 0.6;
    baseMusicVolume = 0;
    soundOn = false;
    audioTrack.muted = true;
    stopSound();
    if (musicVolSlider) musicVolSlider.value = 0;
  } else {
    baseMusicVolume = preMuteVolume || 0.6;
    soundOn = true;
    audioTrack.muted = false;
    if (musicVolSlider) musicVolSlider.value = baseMusicVolume;
    startSound();
    if (audioTrack.paused) playTrack();
  }
  updateMuteIcons();
  updateMusicVolume();
}

const mainSoundBtn = document.getElementById('sound-btn');
if (mainSoundBtn) mainSoundBtn.addEventListener('click', toggleMuteAll);

// Submarine Easter Egg with Cooldown
let isSubmarineActive = false;

function launchSubmarine() {
  if (isSubmarineActive) return;
  isSubmarineActive = true;

  const container = document.getElementById('sub-container');
  if (!container) {
    isSubmarineActive = false;
    return;
  }

  if (soundOn && mainAudioCtx) {
    const now = mainAudioCtx.currentTime;
    const osc = mainAudioCtx.createOscillator();
    const g = mainAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.8);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(g);
    g.connect(mainAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  const sub = document.createElement('div');
  sub.className = 'submarine-el';
  const startY = Math.floor(Math.random() * 45 + 30);
  sub.style.bottom = `${startY}%`;

  sub.innerHTML = `
    <svg viewBox="0 0 320 120" width="100%" height="100%" overflow="visible">
      <defs>
        <radialGradient id="subBeamGrad" cx="0%" cy="50%" r="100%">
          <stop offset="0%" stop-color="#8ff5ff" stop-opacity="0.85"/>
          <stop offset="40%" stop-color="#4db8e8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#4db8e8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="40,60 -200,5 -200,115" fill="url(#subBeamGrad)" class="sub-beam"/>
      <g class="sub-propeller">
        <ellipse cx="295" cy="60" rx="4" ry="22" fill="#8ff5ff" opacity="0.8"/>
      </g>
      <path d="M50,60 C50,30 110,24 190,24 C260,24 290,38 290,60 C290,82 260,96 190,96 C110,96 50,90 50,60 Z" fill="#072242" stroke="#8ff5ff" stroke-width="2.5"/>
      <path d="M140,26 L140,8 C140,4 144,0 148,0 L172,0 C176,0 180,4 180,26 Z" fill="#0a2a52" stroke="#8ff5ff" stroke-width="2"/>
      <path d="M165,0 L165,-12 L150,-12" fill="none" stroke="#8ff5ff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="100" cy="58" r="10" fill="#040b1a" stroke="#8ff5ff" stroke-width="2"/>
      <circle cx="100" cy="58" r="7" fill="#8ff5ff" opacity="0.9"/>
      <circle cx="150" cy="58" r="10" fill="#040b1a" stroke="#8ff5ff" stroke-width="2"/>
      <circle cx="150" cy="58" r="7" fill="#8ff5ff" opacity="0.9"/>
      <circle cx="200" cy="58" r="10" fill="#040b1a" stroke="#8ff5ff" stroke-width="2"/>
      <circle cx="200" cy="58" r="7" fill="#8ff5ff" opacity="0.9"/>
      <path d="M50,48 C44,52 44,68 50,72 Z" fill="#d8f3ff"/>
    </svg>
  `;

  container.appendChild(sub);

  let posX = window.innerWidth + 280;
  const endX = -320;
  const speed = 3.6;

  const interval = setInterval(() => {
    posX -= speed;
    sub.style.transform = `translateX(${posX - window.innerWidth}px)`;

    if (Math.random() < 0.25) {
      const subRect = sub.getBoundingClientRect();
      spawnSubBubble(subRect.left + 235, subRect.top + 55);
    }

    if (posX < endX) {
      clearInterval(interval);
      sub.remove();
      setTimeout(() => {
        isSubmarineActive = false;
      }, 1000);
    }
  }, 16);
}

function spawnSubBubble(x, y) {
  const container = document.getElementById('sub-container');
  if (!container) return;
  const b = document.createElement('div');
  b.className = 'sub-bubble';
  b.style.left = `${x}px`;
  b.style.top = `${y + Math.random() * 12 - 6}px`;
  b.style.width = `${Math.random() * 6 + 3}px`;
  b.style.height = b.style.width;

  container.appendChild(b);

  setTimeout(() => {
    b.style.transform = `translate(${(Math.random()-0.5)*20}px, -${Math.random()*50 + 35}px)`;
    b.style.opacity = '0';
  }, 20);

  setTimeout(() => b.remove(), 1900);
}

const footerText = document.getElementById('footer-text');
if (footerText) footerText.addEventListener('click', launchSubmarine);

// Music Player Implementation
const playlist = [
  { title: "Bliss Boutique", artist: "Xploshi", file: "assets/Bliss Boutique.mp3" },
  { title: "Home Menu", artist: "alyzea", file: "assets/home menu.mp3" },
  { title: "Crystal Settings", artist: "alyzea", file: "assets/crystal settings.mp3" },
  { title: "Dream OS", artist: "alyzea", file: "assets/dream OS.mp3" },
  { title: "Offline Forever", artist: "alyzea", file: "assets/offline forever.mp3" },
  { title: "The Past and Now", artist: "Takeshi Abo", file: "assets/The past and now -LEASE-.mp3" },
  { title: "REU, Maybe?", artist: "Takeshi Abo", file: "assets/REU,maybe_.mp3" },
  { title: "Sunlight's Canvas", artist: "Takeshi Abo", file: "assets/Sunlight's canvas.mp3" }
];

let currentTrackIndex = 0;
let baseMusicVolume = 0.6;
let isShuffle = false;
let isRepeat = false;

const audioTrack = new Audio();
audioTrack.preload = "auto";

function updateMusicVolume() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  
  if (baseMusicVolume === 0 || !soundOn) {
    audioTrack.volume = 0;
  } else {
    // Aggressive underwater volume ducking down to ~4% of master volume
    const muffleFactor = Math.pow(1 - progress * 0.92, 1.6);
    audioTrack.volume = Math.max(0.04 * baseMusicVolume, baseMusicVolume * muffleFactor);
  }
}

let isSubmerged = false;

window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  const wordmark = document.querySelector('.wordmark');
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  const c = getGradientColorAt(progress);
  const alpha = window.scrollY > 30 ? 0.85 : 0.4;
  if(nav) {
    nav.style.background = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
    nav.style.borderColor = `rgba(143, 245, 255, ${(0.08 + progress * 0.14).toFixed(3)})`;
  }

  if (wordmark) {
    if (window.scrollY > 120) {
      wordmark.classList.add('visible');
    } else {
      wordmark.classList.remove('visible');
    }
  }

  const depthEl = document.getElementById('depth-val');
  if (depthEl) {
    const meters = Math.floor(progress * 3800);
    depthEl.textContent = `${meters}m`;
  }

  if (!isSubmerged && window.scrollY > 70) {
    isSubmerged = true;
    playDivingSplashSFX();
  } else if (isSubmerged && window.scrollY <= 25) {
    isSubmerged = false;
    playEmergingSplashSFX();
  }

  if (mainAudioCtx && lowpassNode && wetGainNode) {
    const now = mainAudioCtx.currentTime;
    // Aggressive lowpass drop down to 80 Hz sub-bass muffle
    const freq = Math.max(80, 20000 * Math.pow(80 / 20000, Math.pow(progress, 0.45)));
    
    // Aggressive Reverb Wet Gain up to 8.5x
    let wetVal = 0.0;
    if (progress > 0.08) {
      const normalizedDepth = (progress - 0.08) / 0.92;
      wetVal = Math.pow(normalizedDepth, 1.2) * 8.5;
    }

    lowpassNode.frequency.setTargetAtTime(freq, now, 0.03);
    wetGainNode.gain.setTargetAtTime(wetVal, now, 0.03);
  }

  updateMusicVolume();
}, { passive: true });

const musicPanel = document.getElementById('music-panel');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const musicCloseBtn = document.getElementById('music-close-btn');
const musicPlayBtn = document.getElementById('music-play-btn');
const musicPrevBtn = document.getElementById('music-prev-btn');
const musicNextBtn = document.getElementById('music-next-btn');
const musicShuffleBtn = document.getElementById('music-shuffle-btn');
const musicRepeatBtn = document.getElementById('music-repeat-btn');
const musicTitle = document.getElementById('music-title');
const musicArtist = document.getElementById('music-artist');
const musicToggleTitle = document.getElementById('music-toggle-title');
const musicDisc = document.getElementById('music-disc');
const musicPlayIcon = document.getElementById('music-play-icon');
const musicPauseIcon = document.getElementById('music-pause-icon');
const musicProgressBar = document.getElementById('music-progress-bar');
const musicProgressFill = document.getElementById('music-progress-fill');
const musicCurrentTime = document.getElementById('music-current-time');
const musicDuration = document.getElementById('music-duration');
const musicPlaylistItems = document.getElementById('music-playlist-items');
const musicVolSlider = document.getElementById('music-vol-slider');

if (musicVolSlider) {
  musicVolSlider.value = baseMusicVolume;
  musicVolSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    baseMusicVolume = val;
    if (val === 0) {
      soundOn = false;
      audioTrack.muted = true;
      stopSound();
    } else {
      if (!soundOn) {
        soundOn = true;
        audioTrack.muted = false;
        startSound();
      }
      preMuteVolume = val;
    }
    updateMuteIcons();
    updateMusicVolume();
  });
}

if (musicShuffleBtn) {
  musicShuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    musicShuffleBtn.classList.toggle('active', isShuffle);
  });
}

if (musicRepeatBtn) {
  musicRepeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    musicRepeatBtn.classList.toggle('active', isRepeat);
  });
}

function getNextTrackIndex() {
  if (isShuffle) {
    if (playlist.length <= 1) return 0;
    let rand;
    do {
      rand = Math.floor(Math.random() * playlist.length);
    } while (rand === currentTrackIndex);
    return rand;
  }
  return (currentTrackIndex + 1) % playlist.length;
}

function getPrevTrackIndex() {
  if (isShuffle) {
    if (playlist.length <= 1) return 0;
    let rand;
    do {
      rand = Math.floor(Math.random() * playlist.length);
    } while (rand === currentTrackIndex);
    return rand;
  }
  let prevIdx = currentTrackIndex - 1;
  return prevIdx < 0 ? playlist.length - 1 : prevIdx;
}

function renderPlaylist() {
  if (!musicPlaylistItems) return;
  musicPlaylistItems.innerHTML = '';
  playlist.forEach((track, idx) => {
    const item = document.createElement('div');
    item.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
    item.innerHTML = `<span class="playlist-item-title">${idx + 1}. ${track.title}</span><span class="playlist-item-artist">${track.artist}</span>`;
    item.addEventListener('click', () => loadAndPlayTrack(idx));
    musicPlaylistItems.appendChild(item);
  });
}

function loadTrack(idx) {
  currentTrackIndex = idx;
  const track = playlist[currentTrackIndex];
  audioTrack.src = track.file;
  if (musicTitle) musicTitle.textContent = track.title;
  if (musicArtist) musicArtist.textContent = track.artist;
  if (musicToggleTitle) musicToggleTitle.textContent = `${track.title} • ${track.artist}`;
  renderPlaylist();
}

function playTrack() {
  audioTrack.muted = !soundOn;
  const p = audioTrack.play();
  if (p !== undefined) {
    p.then(() => {
      if (musicPlayIcon) musicPlayIcon.style.display = 'none';
      if (musicPauseIcon) musicPauseIcon.style.display = '';
      if (musicDisc) musicDisc.classList.add('playing');
      updateOceanVolume();
    }).catch(err => {
      console.log('Play audio error:', err);
    });
  }
}

function pauseTrack() {
  audioTrack.pause();
  if (musicPlayIcon) musicPlayIcon.style.display = '';
  if (musicPauseIcon) musicPauseIcon.style.display = 'none';
  if (musicDisc) musicDisc.classList.remove('playing');
  updateOceanVolume();
}

function loadAndPlayTrack(idx) {
  loadTrack(idx);
  playTrack();
}

if (musicPlayBtn) {
  musicPlayBtn.addEventListener('click', () => {
    if (audioTrack.paused) {
      playTrack();
    } else {
      pauseTrack();
    }
  });
}

if (musicPrevBtn) {
  musicPrevBtn.addEventListener('click', () => {
    loadAndPlayTrack(getPrevTrackIndex());
  });
}

if (musicNextBtn) {
  musicNextBtn.addEventListener('click', () => {
    loadAndPlayTrack(getNextTrackIndex());
  });
}

audioTrack.addEventListener('ended', () => {
  if (isRepeat) {
    audioTrack.currentTime = 0;
    playTrack();
  } else {
    loadAndPlayTrack(getNextTrackIndex());
  }
});

audioTrack.addEventListener('timeupdate', () => {
  if (!isNaN(audioTrack.duration) && audioTrack.duration > 0) {
    const pct = (audioTrack.currentTime / audioTrack.duration) * 100;
    if (musicProgressFill) musicProgressFill.style.width = `${pct}%`;
    if (musicCurrentTime) musicCurrentTime.textContent = formatTime(audioTrack.currentTime);
    if (musicDuration) musicDuration.textContent = formatTime(audioTrack.duration);
  }
});

if (musicProgressBar) {
  musicProgressBar.addEventListener('click', (e) => {
    const rect = musicProgressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    if (!isNaN(audioTrack.duration)) {
      audioTrack.currentTime = pct * audioTrack.duration;
    }
  });
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

if (musicToggleBtn && musicPanel) {
  musicToggleBtn.addEventListener('click', () => {
    musicPanel.classList.toggle('collapsed');
  });
}
if (musicCloseBtn && musicPanel) {
  musicCloseBtn.addEventListener('click', () => {
    musicPanel.classList.add('collapsed');
  });
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.code === 'Space') {
    e.preventDefault();
    if (musicPlayBtn) musicPlayBtn.click();
  } else if (e.key === 'm' || e.key === 'M') {
    toggleMuteAll();
  } else if (e.key === 'n' || e.key === 'ArrowRight') {
    if (musicNextBtn) musicNextBtn.click();
  } else if (e.key === 'p' || e.key === 'ArrowLeft') {
    if (musicPrevBtn) musicPrevBtn.click();
  } else if (e.key === 'r' || e.key === 'R') {
    if (musicRepeatBtn) musicRepeatBtn.click();
  } else if (e.key === 's' || e.key === 'S') {
    launchSubmarine();
  }
});

loadTrack(0);

const enterOverlay = document.getElementById('enter-overlay');
let isLaunched = false;

function launchSite() {
  if (isLaunched) return;
  isLaunched = true;
  if (enterOverlay) enterOverlay.classList.add('launched');
  startSound();
  playTrack();
  playDivingSplashSFX();
  setTimeout(() => {
    if (enterOverlay) enterOverlay.style.display = 'none';
  }, 1300);
}

if (enterOverlay) {
  enterOverlay.addEventListener('click', launchSite);
  enterOverlay.addEventListener('pointerdown', launchSite);
}
