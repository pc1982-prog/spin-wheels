import React from "react";

const ResultModal = ({ reward, userName, onClose }) => {
  if (!reward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm animate-bounce-in">
        <div className="bg-white border border-pink-100 rounded-3xl p-8 text-center shadow-2xl shadow-pink-200/40">
          {/* Header */}
          <div className="text-5xl mb-4 animate-bounce">🎉</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            Congratulations{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-gray-500 text-sm mb-6">You won an exclusive offer</p>

          {/* Reward badge */}
          <div className="rounded-2xl p-5 mb-6 bg-pink-50 border-2 border-pink-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-pink-400 to-rose-600" />
            <p className="relative text-xl font-bold text-pink-700 leading-tight">
              {reward.label}
            </p>
          </div>

          <p className="text-gray-400 text-xs mb-6">
            Our team will reach out to you shortly to help you redeem this offer.
          </p>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold
              transition-all duration-200 shadow-md shadow-pink-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;