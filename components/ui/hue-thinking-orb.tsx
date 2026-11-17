"use client";

import React, { useEffect, useRef } from "react";

/* ───────────────────────── 3D Dotted Particle Geometry ───────────────────────── */
const RINGS = 16;
const TAU = Math.PI * 2;
const CANVAS_SIZE = 260;

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOT_LIST = (() => {
  const rand = mulberry32(7);
  const out: { x: number; y: number; z: number; u: number; seed: number }[] = [];
  for (let k = 0; k < RINGS; k++) {
    const y = 1 - ((k + 0.5) / RINGS) * 2;
    const r = Math.sqrt(1 - y * y);
    const m = Math.max(4, Math.round(30 * r));
    for (let j = 0; j < m; j++) {
      const a = (j / m) * TAU + k * 0.35;
      out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, u: (1 - y) / 2, seed: rand() * 6.283 });
    }
  }
  return out;
})();

const N = DOT_LIST.length;
const DX = Float32Array.from(DOT_LIST, (d) => d.x);
const DY = Float32Array.from(DOT_LIST, (d) => d.y);
const DZ = Float32Array.from(DOT_LIST, (d) => d.z);
const DU = Float32Array.from(DOT_LIST, (d) => d.u);
const DS = Float32Array.from(DOT_LIST, (d) => d.seed);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Palette: Cyber Ice-White (235, 248, 255) -> Electric Lime (204, 255, 0) -> Emerald (16, 185, 129) */
const G_STEPS = 24, A_STEPS = 48;
const COLORS: string[] = (() => {
  const out: string[] = [];
  for (let gi = 0; gi <= G_STEPS; gi++) {
    const g = gi / G_STEPS;
    const r = Math.round(lerp(235, 204, g));
    const gg = 255;
    const b = Math.round(lerp(255, 0, g));
    for (let ai = 0; ai <= A_STEPS; ai++) {
      const a = (ai / A_STEPS);
      out.push(`rgba(${r},${gg},${b},${a.toFixed(3)})`);
    }
  }
  return out;
})();

interface HueThinkingOrbProps {
  isThinking?: boolean;
  size?: number;
  className?: string;
  caption?: string;
}

export function HueThinkingOrb({
  isThinking = false,
  size = 260,
  className = "",
  caption,
}: HueThinkingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isThinkingRef = useRef(isThinking);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dead = false;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let rot = 0;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    canvas.width = Math.round(CANVAS_SIZE * dpr);
    canvas.height = Math.round(CANVAS_SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const S = 0.62;
    const CP = Math.cos(0.35);
    const SP = Math.sin(0.35);
    const C0 = CANVAS_SIZE / 2;

    const lit = new Float32Array(N);
    const SX = new Float32Array(N);
    const SY = new Float32Array(N);
    const SR = new Float32Array(N);
    const SD = new Float32Array(N);
    const SC = new Int16Array(N);

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      time += dt;

      const thinking = isThinkingRef.current;
      const targetSpin = thinking ? 1.05 : 0.42;
      const vortex = thinking ? Math.sin(time * 1.8) * 0.45 : 0;

      rot += targetSpin * dt;
      const yaw = rot + vortex;
      const cyw = Math.cos(yaw);
      const syw = Math.sin(yaw);

      const decay = Math.exp(-dt / 0.5);
      const h0 = (time * 300) % N;
      const h3 = (time * 480) % N;
      const a1 = time * 0.8, b1 = Math.sin(time * 0.5) * 0.9;
      const f1x = Math.cos(b1) * Math.cos(a1), f1y = Math.sin(b1), f1z = Math.cos(b1) * Math.sin(a1);
      const a2 = time * 0.55 + 2.1, b2 = Math.cos(time * 0.42) * 0.9;
      const f2x = Math.cos(b2) * Math.cos(a2), f2y = Math.sin(b2), f2z = Math.cos(b2) * Math.sin(a2);

      for (let n = 0; n < N; n++) {
        let L = lit[n] * decay;
        const d0 = Math.abs(n - h0);
        if (d0 < 7 || d0 > N - 7) L = Math.max(L, 1);
        if (thinking) {
          const d3 = Math.abs(n - h3);
          if (d3 < 10 || d3 > N - 10) L = Math.max(L, 0.9);
        }
        lit[n] = L;

        const x0 = DX[n], y0 = DY[n], z0 = DZ[n];
        const x1 = x0 * cyw + z0 * syw;
        const z1 = -x0 * syw + z0 * cyw;
        const y2 = y0 * CP - z1 * SP;
        const z2 = y0 * SP + z1 * CP;

        const depth = (z2 + 1) * 0.5;
        SD[n] = depth;

        const R = C0 * S * (thinking ? 1.05 : 1.0);
        SX[n] = C0 + x1 * R;
        SY[n] = C0 + y2 * R;
        SR[n] = Math.max(1.1, (1.2 + depth * 1.5 + L * 0.9));

        const baseDot = Math.max(0, x1 * f1x + y2 * f1y + z2 * f1z) * 0.55 +
                        Math.max(0, x1 * f2x + y2 * f2y + z2 * f2z) * 0.45;
        const br = Math.min(1, Math.max(0.12, baseDot * 0.75 + L * 0.5 + depth * 0.3));

        const gIdx = Math.min(G_STEPS, Math.round(br * G_STEPS));
        const aIdx = Math.min(A_STEPS, Math.round(br * A_STEPS));
        SC[n] = gIdx * (A_STEPS + 1) + aIdx;
      }

      // Draw two passes: back half, then front half for genuine 3D occlusion
      for (let pass = 0; pass < 2; pass++) {
        for (let n = 0; n < N; n++) {
          if ((SD[n] >= 0.5) !== (pass === 1)) continue;
          const c = SC[n];
          if (c < 0 || c >= COLORS.length) continue;
          ctx.fillStyle = COLORS[c];
          ctx.beginPath();
          ctx.arc(SX[n], SY[n], SR[n], 0, TAU);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (dead) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      draw(dt);
      raf = requestAnimationFrame(frame);
    };

    last = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Outer Radiant Ambient Atmosphere */}
      <div 
        className={`absolute rounded-full pointer-events-none transition-all duration-700 blur-3xl ${
          isThinking 
            ? "w-80 h-80 bg-[radial-gradient(circle,rgba(204,255,0,0.22)_0%,rgba(16,185,129,0.14)_45%,transparent_70%)] animate-pulse" 
            : "w-64 h-64 bg-[radial-gradient(circle,rgba(204,255,0,0.12)_0%,rgba(16,185,129,0.06)_50%,transparent_70%)]"
        }`} 
      />

      {/* Subtle Inner Glow Core */}
      <div 
        className={`absolute rounded-full pointer-events-none blur-xl transition-all duration-500 ${
          isThinking 
            ? "w-48 h-48 bg-[radial-gradient(circle,rgba(204,255,0,0.3)_0%,transparent_65%)]" 
            : "w-36 h-36 bg-[radial-gradient(circle,rgba(204,255,0,0.18)_0%,transparent_65%)]"
        }`} 
      />

      {/* 3D Particle Canvas */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="relative z-10 pointer-events-none drop-shadow-[0_0_18px_rgba(204,255,0,0.35)]"
        />
      </div>

      {/* Minimal Apple Caption */}
      {caption && (
        <div className="mt-2 text-center z-10 pointer-events-none">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/80">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}

export default HueThinkingOrb;

