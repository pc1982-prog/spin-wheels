import React, { useEffect, useRef } from "react";

const COLORS = ["#FF6B6B","#4ECDC4","#FFE66D","#A29BFE","#FD79A8"];

const SpinWheel = ({ rewards, rotation, isSpinning, spinDuration }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rewards.length) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const arc = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, size, size);

    rewards.forEach((reward, i) => {
      const angle = arc * i - Math.PI / 2;

      // Segment
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${size < 400 ? 9 : 11}px DM Sans, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 4;

      // Word wrap
      const maxWidth = radius - 30;
      const words = reward.label.split(" ");
      let lines = [];
      let line = "";
      words.forEach((word) => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      });
      lines.push(line);

      const lineHeight = size < 400 ? 11 : 13;
      const startY = -(lines.length * lineHeight) / 2 + lineHeight / 2;
      lines.forEach((l, li) => {
        ctx.fillText(l, radius - 15, startY + li * lineHeight);
      });
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,50,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center star/icon
    ctx.fillStyle = "#FFE66D";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", center, center);
  }, [rewards]);

  const transitionStyle = isSpinning
    ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
    : "none";

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl scale-110" />

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 wheel-pointer">
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
          <path d="M14 36 L0 4 Q14 -4 28 4 Z" fill="#FFD700" stroke="#fff" strokeWidth="1.5"/>
          <circle cx="14" cy="10" r="5" fill="#fff" opacity="0.9"/>
        </svg>
      </div>

      {/* Spinning canvas wrapper */}
      <div
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: transitionStyle,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(255,200,0,0.25), 0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="block"
          style={{ maxWidth: "min(380px, 85vw)", height: "auto" }}
        />
      </div>
    </div>
  );
};

export default SpinWheel;