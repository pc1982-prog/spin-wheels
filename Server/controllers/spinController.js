const { validationResult } = require("express-validator");
const Lead = require("../models/Lead");
const { selectReward, getAllRewards, getRewardIndex } = require("../services/rewardService");
const { appendLeadToExcel } = require("../services/excelService");
const { appendLeadToSheets } = require("../services/googleSheetsService");

/**
 * POST /api/spin
 * Validates user input, assigns reward, saves to DB + Excel + Google Sheets
 */
const submitSpin = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, phone, sourceWebsite } = req.body;

    // Check for duplicate email
    const existingEmail = await Lead.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "This email has already been used to spin the wheel.",
        field: "email",
      });
    }

    // Check for duplicate phone
    const existingPhone = await Lead.findOne({ phone: phone.trim() });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "This phone number has already been used to spin the wheel.",
        field: "phone",
      });
    }

    // Select reward using probability logic
    const reward = selectReward();
    const rewardIndex = getRewardIndex(reward.id);

    // Get client IP
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // Save lead to MongoDB
    const lead = await Lead.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      reward: reward.label,
      rewardId: reward.id,
      sourceWebsite: sourceWebsite || "spin-wheel-app",
      ipAddress,
    });

    // ✅ Save to Excel + Google Sheets — dono parallel mein, non-blocking
    const saveData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      reward: lead.reward,
      sourceWebsite: lead.sourceWebsite,
    };

    Promise.all([
      appendLeadToExcel(saveData),
      appendLeadToSheets(saveData),
    ]).then(([excelOk, sheetsOk]) => {
      if (!excelOk)  console.warn("⚠️  Excel save failed for:", lead.email);
      if (!sheetsOk) console.warn("⚠️  Google Sheets save failed for:", lead.email);
    }).catch((err) => {
      console.error("❌ Save error:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Spin registered successfully!",
      data: {
        leadId: lead._id,
        reward: {
          id: reward.id,
          label: reward.label,
          color: reward.color,
          index: rewardIndex,
        },
      },
    });
  } catch (error) {
    // Handle MongoDB duplicate key errors (race conditions)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field} has already been used to spin the wheel.`,
        field,
      });
    }
    next(error);
  }
};

/**
 * GET /api/spin/rewards
 * Returns all possible rewards (for frontend wheel rendering)
 */
const getRewards = (req, res) => {
  const rewards = getAllRewards();
  res.status(200).json({ success: true, data: rewards });
};

module.exports = { submitSpin, getRewards };