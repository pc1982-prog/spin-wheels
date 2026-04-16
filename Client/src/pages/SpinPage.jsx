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
    <div className="min-h-screen bg-gray-50 relative overflow-hidden flex flex-col">
      {/* Subtle background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

     

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        {step === STEPS.FORM && (
          <div className="w-full max-w-md animate-fade-up">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xl shadow-pink-100/40">
              <LeadForm onSubmit={handleFormSubmit} isLoading={isSubmitting} />
            </div>
          </div>
        )}

        {step === STEPS.WHEEL && (
          <div className="flex flex-col items-center gap-6 animate-fade-up">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                {isSpinning ? "Spinning..." : winner ? (
                  <>You Won! <span className="text-pink-600">🎉</span></>
                ) : "Ready to spin?"}
              </h2>
              <p className="text-gray-500 text-sm">
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
                className="px-8 py-3 rounded-full bg-pink-600 hover:bg-pink-700
                  text-white font-semibold shadow-lg shadow-pink-200
                  hover:shadow-pink-300 hover:-translate-y-0.5 transition-all duration-200"
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

      <footer className="relative z-10 text-center py-4 text-gray-400 text-xs border-t border-gray-100 bg-white">
        © {new Date().getFullYear()} Strategix. All rights reserved.
      </footer>
    </div>
  );
};

export default SpinPage;