const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      match: [/^[+]?[\d\s\-().]{7,20}$/, "Please enter a valid phone number"],
    },
    reward: {
      type: String,
      required: [true, "Reward is required"],
    },
    rewardId: {
      type: Number,
      required: true,
    },
    sourceWebsite: {
      type: String,
      default: "spin-wheel-app",
    },
    ipAddress: {
      type: String,
    },
    hasSpun: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate spins
leadSchema.index({ email: 1 }, { unique: true });
leadSchema.index({ phone: 1 }, { unique: true });

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;