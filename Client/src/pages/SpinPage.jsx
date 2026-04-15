import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import LeadForm from "../components/LeadForm";
import SpinWheel from "../components/SpinWheel";
import ResultModal from "../components/ResultModal";
import { useSpinWheel } from "../hooks/useSpinWheel";
import { submitSpin, fetchRewards } from "../services/api";

const STEPS = { FORM: "form", WHEEL: "wheel", RESULT: "result" };

const SpinPage = () => {
  const [step, setStep] = useState(STEPS.FORM);
  const [rewards, setRewards] = useState([]);
  const [leadData, setLeadData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const { isSpinning, rotation, winner, spinToIndex, reset, SPIN_DURATION } =
    useSpinWheel(rewards);

  useEffect(() => {
    fetchRewards()
      .then((res) => setRewards(res.data.data))
      .catch(() => toast.error("Failed to load wheel rewards."));
  }, []);

  const handleFormSubmit = async (formValues) => {
    setIsSubmitting(true);
    try {
      const res = await submitSpin(formValues);
      const { reward } = res.data.data;
      setLeadData({ ...formValues, reward });
      setStep(STEPS.WHEEL);
      // Auto-spin after short delay
      setTimeout(() => {
        spinToIndex(reward.index, () => {
          setTimeout(() => setShowModal(true), 600);
        });
      }, 800);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] relative overflow-hidden flex flex-col">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 text-center pt-8 pb-4 px-4">
        <span className="text-yellow-400 text-2xl">⚕️</span>
        <span className="ml-2 font-display text-white font-bold text-lg">HealthSpin</span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        {step === STEPS.FORM && (
          <div className="w-full max-w-md animate-fade-up">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
              <LeadForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
            </div>
          </div>
        )}

        {step === STEPS.WHEEL && (
          <div className="flex flex-col items-center gap-8 animate-fade-up">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold text-white mb-2">
                {isSpinning ? "Spinning..." : winner ? "You Won! 🎉" : "Ready to spin?"}
              </h2>
              <p className="text-gray-400 text-sm">
                {isSpinning
                  ? "The wheel is picking your reward..."
                  : winner
                  ? "Check your reward below"
                  : "The wheel is about to spin!"}
              </p>
            </div>

            <SpinWheel
              rewards={rewards}
              rotation={rotation}
              isSpinning={isSpinning}
              spinDuration={SPIN_DURATION}
            />

            {!isSpinning && winner && (
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 
                  text-gray-900 font-semibold shadow-lg shadow-orange-500/30 
                  hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                🎁 View My Reward
              </button>
            )}
          </div>
        )}
      </main>

      {/* Result Modal */}
      {showModal && (
        <ResultModal
          reward={leadData?.reward}
          userName={leadData?.name}
          onClose={() => setShowModal(false)}
        />
      )}

      <footer className="relative z-10 text-center py-4 text-gray-600 text-xs">
        © {new Date().getFullYear()} HealthSpin. All rights reserved.
      </footer>
    </div>
  );
};

export default SpinPage;