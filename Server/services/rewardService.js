const { REWARDS } = require("../config/rewards");

/**
 * Selects a reward based on weighted probability
 * @returns {Object} selected reward
 */
const selectReward = () => {
  const random = Math.random();
  let cumulative = 0;

  for (const reward of REWARDS) {
    cumulative += reward.probability;
    if (random <= cumulative) {
      return reward;
    }
  }

  // Fallback to last reward (handles floating point edge cases)
  return REWARDS[REWARDS.length - 1];
};

/**
 * Returns all rewards (for frontend wheel rendering)
 */
const getAllRewards = () => REWARDS;

/**
 * Returns the index of a reward by id (used to animate wheel to correct segment)
 */
const getRewardIndex = (rewardId) => {
  return REWARDS.findIndex((r) => r.id === rewardId);
};

module.exports = { selectReward, getAllRewards, getRewardIndex };