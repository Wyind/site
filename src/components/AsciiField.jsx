import { useEffect, useRef } from 'react';

const CHARS = ' .:-~=+*#01%&$@';
const CELL_W = 11;
const CELL_H = 21;
const FONT = '16px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const REACH = 170;

export default function AsciiField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    let mx = -9999;
    let my = -9999;
    let moved = false;
    let raf = 0;
    let last = 0;

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
          cells[i++] = { x: x * CELL_W, y: y * CELL_H, level: 0, ci: scramble() };
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

    function frame(ts) {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
      last = ts;
      const ease = Math.min(1, dt * 9);

      ctx.clearRect(0, 0, W, H);
      const reach2 = REACH * REACH;
      let busy = false;

      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        const dx = c.x - mx;
        const dy = c.y - my;
        const d2 = dx * dx + dy * dy;
        const target = d2 < reach2 ? 1 - Math.sqrt(d2) / REACH : 0;
        c.level += (target - c.level) * ease;
        if (c.level < 0.003) c.level = 0;
        if (c.level > 0) busy = true;
        paint(c);
      }

      const go = moved;
      moved = false;

      if (go || busy) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        last = 0;
      }
    }

    function wake() {
      moved = true;
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      wake();
    }

    function onOut() {
      mx = -9999;
      my = -9999;
      wake();
    }

    function onResize() {
      resize();
      if (reduced) drawStatic();
      else wake();
    }

    resize();

    if (reduced) {
      drawStatic();
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('blur', onOut);
      document.documentElement.addEventListener('pointerleave', onOut);
      wake();
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('blur', onOut);
      document.documentElement.removeEventListener('pointerleave', onOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas id="bg" ref={ref} aria-hidden="true" />;
}
