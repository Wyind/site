import { useEffect, useRef } from 'react';

// the whole page is the field: glyphs that heat up and swirl around the
// cursor, scatter when you click, and re-scramble a few at a time when idle.
const CHARS = ' .:-~=+*#01%&$@';
const CELL_W = 11;
const CELL_H = 21;
const FONT = '16px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const REACH = 160;
const PUSH = 2.2;
const SWIRL = 1.6;
const SPRING = 0.085;
const WAVE_SPEED = 900;
const WAVE_WIDTH = 90;
const WAVE_POWER = 4.5;
const WAVE_LIFE = 0.9;

export default function AsciiField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 16 pre-baked stops from dim gray-green up to the accent green,
    // so the hot loop never parses a color string
    const styles = [];
    for (let i = 0; i < 16; i++) {
      const k = i / 15;
      const r = Math.round(118 + (74 - 118) * k);
      const g = Math.round(148 + (222 - 148) * k);
      const b = Math.round(130 + (128 - 130) * k);
      const a = 0.16 + 0.31 * k;
      styles.push('rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(3) + ')');
    }

    let W = 0;
    let H = 0;
    let cells = [];
    let pulses = [];
    let mx = -9999;
    let my = -9999;
    let moved = false;
    let awake = true;
    let raf = 0;
    let last = 0;
    let time = 0;
    let drift = 0;

    function scramble() {
      return Math.random() < 0.16 ? 0 : 1 + ((Math.random() * 4) | 0);
    }

    function seed() {
      const cols = Math.ceil(W / CELL_W) + 2;
      const rows = Math.ceil(H / CELL_H) + 2;
      cells = new Array(cols * rows);
      let i = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          cells[i++] = {
            hx: x * CELL_W,
            hy: y * CELL_H,
            x: x * CELL_W,
            y: y * CELL_H,
            vx: 0,
            vy: 0,
            level: 0,
            ci: scramble(),
          };
        }
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = FONT;
      ctx.textBaseline = 'top';
      seed();
      awake = true;
    }

    function paint(c) {
      const lv = c.level;
      const idx = Math.min(CHARS.length - 1, Math.floor(lv * 15 + c.ci * (1 - lv)));
      const ch = CHARS[idx];
      if (ch === ' ') return;
      const si = Math.min(15, (lv * 14 + (1 - lv) * (c.ci % 2)) | 0);
      ctx.fillStyle = styles[si];
      ctx.fillText(ch, c.x, c.y);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < cells.length; i++) paint(cells[i]);
    }

    function step(dt) {
      const f = Math.min(dt * 60, 2);
      const rot = time * 0.6;
      const reach2 = REACH * REACH;

      // age the click shockwaves
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += dt;
        if (pulses[i].t > WAVE_LIFE) pulses.splice(i, 1);
      }

      ctx.clearRect(0, 0, W, H);
      let busy = false;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];

        // the spring that pulls everything home, always on
        let ax = (c.hx - c.x) * SPRING;
        let ay = (c.hy - c.y) * SPRING;

        // cursor: push away, plus a slow orbit so it turns instead of bulges
        const dx = c.x - mx;
        const dy = c.y - my;
        const d2 = dx * dx + dy * dy;
        let target = 0;

        if (d2 < reach2) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / REACH;
          target = k;

          const nx = dx / d;
          const ny = dy / d;

          const push = k * k * PUSH;
          ax += nx * push;
          ay += ny * push;

          const ang = Math.atan2(ny, nx) + Math.PI / 2 + rot;
          const swirl = k * SWIRL;
          ax += Math.cos(ang) * swirl;
          ay += Math.sin(ang) * swirl;
        }

        // clicks send a shockwave rippling through the field
        for (let p = 0; p < pulses.length; p++) {
          const pl = pulses[p];
          const px = c.x - pl.x;
          const py = c.y - pl.y;
          const pd = Math.sqrt(px * px + py * py) || 1;
          const band = Math.abs(pd - pl.t * WAVE_SPEED);
          if (band < WAVE_WIDTH) {
            const s = (1 - band / WAVE_WIDTH) * (1 - pl.t / WAVE_LIFE) * WAVE_POWER;
            ax += (px / pd) * s;
            ay += (py / pd) * s;
          }
        }

        c.vx = (c.vx + ax * f) * 0.9;
        c.vy = (c.vy + ay * f) * 0.9;
        c.x += c.vx * f;
        c.y += c.vy * f;

        c.level += (target - c.level) * Math.min(1, 0.15 * f);
        if (c.level < 0.002) c.level = 0;

        const loose =
          c.level > 0 ||
          Math.abs(c.x - c.hx) > 0.4 ||
          Math.abs(c.y - c.hy) > 0.4 ||
          Math.abs(c.vx) > 0.4 ||
          Math.abs(c.vy) > 0.4;

        if (loose) {
          busy = true;
        } else {
          c.x = c.hx;
          c.y = c.hy;
          c.vx = 0;
          c.vy = 0;
        }

        paint(c);
      }

      return busy;
    }

    function frame(ts) {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      time += dt;

      // a few idle cells re-scramble now and then, so the field breathes
      drift += dt;
      let tick = false;
      if (drift > 0.7) {
        drift = 0;
        const n = Math.max(3, (cells.length * 0.01) | 0);
        for (let i = 0; i < n; i++) {
          const c = cells[(Math.random() * cells.length) | 0];
          if (c.level < 0.02) c.ci = scramble();
        }
        tick = true;
      }

      const go = moved;
      moved = false;

      // when everything has settled and the mouse is quiet, keep the last
      // frame on screen and stop doing any work at all
      if (awake || go || tick || pulses.length > 0) {
        awake = step(dt);
      }

      raf = requestAnimationFrame(frame);
    }

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      moved = true;
    }

    function onOut() {
      mx = -9999;
      my = -9999;
      moved = true;
    }

    function onDown(e) {
      pulses.push({ x: e.clientX, y: e.clientY, t: 0 });
    }

    function onResize() {
      resize();
      if (reduced) drawStatic();
    }

    resize();

    if (reduced) {
      drawStatic();
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onDown, { passive: true });
      window.addEventListener('blur', onOut);
      document.documentElement.addEventListener('pointerleave', onOut);
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('blur', onOut);
      document.documentElement.removeEventListener('pointerleave', onOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas id="bg" ref={ref} aria-hidden="true" />;
}
