import React, { useEffect, useRef } from "react";

// Pink/rose palette matching Dr. Payal Bajaj theme
const COLORS = [
  "#E91E8C", // hot pink
  "#F06292", // medium pink
  "#C2185B", // deep rose
  "#FF80AB", // light pink
  "#AD1457", // dark pink
  "#F48FB1", // pale pink
  "#880E4F", // burgundy pink
  "#FCE4EC", // very light pink — use dark text for this
];

const TEXT_COLORS = [
  "#fff", "#fff", "#fff", "#fff", "#fff", "#333", "#fff", "#c2185b"
];

const SpinWheel = ({ rewards, rotation, isSpinning, spinDuration }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rewards.length) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const arc = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, size, size);

    rewards.forEach((reward, i) => {
      const angle = arc * i - Math.PI / 2;
      const color = COLORS[i % COLORS.length];
      const textColor = TEXT_COLORS[i % TEXT_COLORS.length];

      // Segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);

      // Calculate available space
      const segmentHeight = 2 * radius * Math.sin(arc / 2); // approx chord height
      const availableWidth = radius * 0.65; // use 65% of radius for text
      const availableHeight = Math.min(segmentHeight * 0.75, radius * 0.55);

      // Dynamic font size based on segment count and available space
      let fontSize = Math.min(
        10,
        Math.floor(availableHeight / (rewards.length <= 6 ? 2.5 : 3.5))
      );
      fontSize = Math.max(7, fontSize); // minimum 7px

      ctx.textAlign = "right";
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px 'DM Sans', sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 3;

      // Word wrap
      const words = reward.label.split(" ");
      let lines = [];
      let line = "";
      words.forEach((word) => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > availableWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      if (line) lines.push(line);

      // Limit lines to avoid overflow
      const maxLines = Math.floor(availableHeight / (fontSize + 2));
      if (lines.length > maxLines && maxLines > 1) {
        lines = lines.slice(0, maxLines);
        // Truncate last line if needed
        const last = lines[maxLines - 1];
        if (ctx.measureText(last + "…").width > availableWidth) {
          let truncated = last;
          while (ctx.measureText(truncated + "…").width > availableWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          lines[maxLines - 1] = truncated + "…";
        }
      }

      const lineHeight = fontSize + 2;
      const totalTextHeight = lines.length * lineHeight;
      const startY = -totalTextHeight / 2 + lineHeight / 2;
      const textX = radius - 20;

      lines.forEach((l, li) => {
        ctx.fillText(l, textX, startY + li * lineHeight);
      });

      ctx.restore();
    });

    // Outer ring decoration
    ctx.beginPath();
    ctx.arc(center, center, radius + 2, 0, 2 * Math.PI);
    ctx.strokeStyle = "#E91E8C";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 30, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 30);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#fce4ec");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#E91E8C";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center star
    ctx.fillStyle = "#E91E8C";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.fillText("★", center, center);
  }, [rewards]);

  const transitionStyle = isSpinning
    ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
    : "none";

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-rose-500/20 blur-xl scale-110" />

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path d="M14 36 L0 4 Q14 -4 28 4 Z" fill="#E91E8C" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="14" cy="10" r="5" fill="#fff" opacity="0.95"/>
        </svg>
      </div>

      {/* Spinning canvas wrapper */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: transitionStyle,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(233,30,140,0.2), 0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="block"
          style={{ maxWidth: "min(400px, 88vw)", height: "auto" }}
        />
      </div>
    </div>
  );
};

export default SpinWheel;