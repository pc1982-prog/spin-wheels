import { useState, useRef, useCallback } from "react";

const SPIN_DURATION = 5000; // ms

export const useSpinWheel = (rewards) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);
  const currentRotation = useRef(0);

  const spinToIndex = useCallback(
    (targetIndex, onComplete) => {
      if (isSpinning || !rewards.length) return;

      const segmentAngle = 360 / rewards.length;
      // Point the target segment to the top (pointer at 0°)
      const segmentCenter = segmentAngle * targetIndex + segmentAngle / 2;
      const targetAngle = 360 - segmentCenter;

      // Add multiple full rotations for drama
      const fullSpins = 6 + Math.floor(Math.random() * 4);
      const totalRotation = currentRotation.current + fullSpins * 360 + targetAngle;

      currentRotation.current = totalRotation;
      setIsSpinning(true);
      setRotation(totalRotation);

      setTimeout(() => {
        setIsSpinning(false);
        setWinner(rewards[targetIndex]);
        if (onComplete) onComplete(rewards[targetIndex]);
      }, SPIN_DURATION + 200);
    },
    [isSpinning, rewards]
  );

  const reset = () => {
    setWinner(null);
    setIsSpinning(false);
  };

  return { isSpinning, rotation, winner, spinToIndex, reset, SPIN_DURATION };
};