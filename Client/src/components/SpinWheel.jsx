import React, { useEffect, useRef, useCallback } from "react";

const COLORS = [
  "#E91E8C",
  "#F06292",
  "#C2185B",
  "#FF80AB",
  "#AD1457",
  "#F48FB1",
  "#880E4F",
  "#FCE4EC",
];

const TEXT_COLORS = [
  "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#AD1457"
];

/* ─────────────────────────────────────────────
   Web Audio helpers  (no external files needed)
───────────────────────────────────────────── */
const getAudioCtx = (() => {
  let ctx = null;
  return () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

/** Single short tick / click */
const playTick = (freq = 900, vol = 0.18, duration = 0.04) => {
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  } catch (_) {}
};

/** Ascending win fanfare */
const playWinSound = () => {
  try {
    const ctx   = getAudioCtx();
    const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t);
      osc.stop(t + 0.42);
    });
  } catch (_) {}
};

/* ─────────────────────────────────────────────
   SpinWheel component
───────────────────────────────────────────── */
const SpinWheel = ({ rewards, rotation, isSpinning, spinDuration }) => {
  const canvasRef        = useRef(null);
  const prevSpinning     = useRef(false);
  const tickTimerRef     = useRef(null);

  /* ── Tick sound engine ── */
  const startTicks = useCallback(() => {
    let elapsed = 0;

    const fire = () => {
      // progress 0→1 over spinDuration
      const progress    = Math.min(elapsed / spinDuration, 1);
      // interval: 45 ms (fast) → 380 ms (slow)
      const interval    = 45 + progress * 335;
      // pitch: high when fast, lower when slow
      const freq        = 1100 - progress * 500;
      // volume: slightly louder at start
      const vol         = 0.22 - progress * 0.08;

      playTick(freq, vol, 0.035);
      elapsed += interval;

      if (elapsed < spinDuration) {
        tickTimerRef.current = setTimeout(fire, interval);
      }
    };

    fire();
  }, [spinDuration]);

  const stopTicks = useCallback(() => {
    clearTimeout(tickTimerRef.current);
  }, []);

  /* ── React to isSpinning changes ── */
  useEffect(() => {
    if (isSpinning && !prevSpinning.current) {
      // Wheel just started spinning
      startTicks();
    } else if (!isSpinning && prevSpinning.current) {
      // Wheel just stopped
      stopTicks();
      setTimeout(playWinSound, 180);
    }
    prevSpinning.current = isSpinning;

    return () => stopTicks();
  }, [isSpinning, startTicks, stopTicks]);

  /* ── Canvas drawing ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rewards.length) return;

    const LOGICAL_SIZE = 440;
    // Force at least 3× for razor-sharp text on all screens
    const dpr = Math.max(window.devicePixelRatio || 1, 3);

    canvas.width  = LOGICAL_SIZE * dpr;
    canvas.height = LOGICAL_SIZE * dpr;
    canvas.style.width  = `${LOGICAL_SIZE}px`;
    canvas.style.height = `${LOGICAL_SIZE}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // Smooth all paths
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const size   = LOGICAL_SIZE;
    const center = size / 2;
    const radius = center - 14;
    const arc    = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, size, size);

    rewards.forEach((reward, i) => {
      const angle     = arc * i - Math.PI / 2;
      const color     = COLORS[i % COLORS.length];
      const textColor = TEXT_COLORS[i % TEXT_COLORS.length];

      /* Segment */
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      /* Text — NO shadow, NO blur → crystal clear */
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);

      const segCount = rewards.length;
      const fontSize = segCount <= 5 ? 14 : segCount <= 7 ? 12.5 : 11.5;

      // Crisp font: system-ui is the sharpest on every OS
      ctx.font         = `700 ${fontSize}px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle    = textColor;
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";

      // ── ZERO shadow / blur ── keeps text HD
      ctx.shadowColor  = "transparent";
      ctx.shadowBlur   = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Thin dark stroke for contrast on light segments
      ctx.lineWidth   = fontSize > 12 ? 3.5 : 3;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineJoin    = "round";

      const textStart = 42;
      const textEnd   = radius - 18;
      const zoneWidth = textEnd - textStart;
      const midX      = textStart + zoneWidth / 2;

      /* Word wrap */
      const words = reward.label.split(" ");
      let lines = [], cur = "";
      words.forEach((w) => {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > zoneWidth - 4 && cur) {
          lines.push(cur);
          cur = w;
        } else {
          cur = test;
        }
      });
      if (cur) lines.push(cur);
      if (lines.length > 3) lines = lines.slice(0, 3);

      const lh     = fontSize + 4.5;
      const totalH = lines.length * lh;
      const startY = -totalH / 2 + lh / 2;

      lines.forEach((line, li) => {
        const y = startY + li * lh;
        // Stroke first (outline), then fill → sharp edge + contrast
        ctx.strokeText(line, midX, y);
        ctx.fillText(line, midX, y);
      });

      ctx.restore();
    });

    /* Outer ring */
    ctx.beginPath();
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "#E91E8C";
    ctx.lineWidth   = 5;
    ctx.stroke();

    /* Center circle */
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 32);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(1, "#fce4ec");
    ctx.fillStyle   = grad;
    ctx.fill();
    ctx.strokeStyle = "#E91E8C";
    ctx.lineWidth   = 3;
    ctx.stroke();

    /* Center star — no shadow */
    ctx.shadowBlur = 0;
    ctx.fillStyle  = "#E91E8C";
    ctx.font       = "bold 22px system-ui, sans-serif";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", center, center);

  }, [rewards]);

  const transitionStyle = isSpinning
    ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
    : "none";

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-rose-500/20 blur-xl scale-110" />

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path d="M14 36 L0 4 Q14 -4 28 4 Z" fill="#E91E8C" stroke="#fff" strokeWidth="1.5" />
          <circle cx="14" cy="10" r="5" fill="#fff" opacity="0.95" />
        </svg>
      </div>

      {/* Spinning wrapper */}
      <div
        style={{
          transform:    `rotate(${rotation}deg)`,
          transition:   transitionStyle,
          borderRadius: "50%",
          overflow:     "hidden",
          willChange:   "transform",
          boxShadow:    "0 0 40px rgba(233,30,140,0.2), 0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            maxWidth: "min(440px, 88vw)",
            height:   "auto",
            // pixelated would blur scaled-down canvas — remove it
          }}
        />
      </div>
    </div>
  );
};

export default SpinWheel;