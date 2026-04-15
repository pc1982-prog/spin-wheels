import React from "react";

const ResultModal = ({ reward, userName, onClose }) => {
  if (!reward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm animate-bounce-in">
        <div className="bg-gradient-to-b from-[#1e1e3f] to-[#0f0f1a] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          {/* Confetti emoji header */}
          <div className="text-5xl mb-4 animate-bounce">🎉</div>

          <h2 className="font-display text-2xl font-bold text-white mb-1">
            Congratulations{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-gray-400 text-sm mb-6">You won an exclusive offer</p>

          {/* Reward badge */}
          <div
            className="rounded-2xl p-5 mb-6 relative overflow-hidden"
            style={{ backgroundColor: reward.color + "22", border: `2px solid ${reward.color}66` }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{ background: `radial-gradient(circle at center, ${reward.color}, transparent)` }}
            />
            <p className="relative font-display text-xl font-bold text-white leading-tight">
              {reward.label}
            </p>
          </div>

          <p className="text-gray-400 text-xs mb-6">
            Our team will reach out to you shortly to help you redeem this offer.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium
              transition-all duration-200 border border-white/20 hover:border-white/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;