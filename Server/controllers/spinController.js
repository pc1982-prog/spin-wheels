const { validationResult } = require("express-validator");
const Lead = require("../models/Lead");
const { selectReward, getAllRewards, getRewardIndex } = require("../services/rewardService");
const { appendLeadToExcel }                           = require("../services/excelService");
const { appendLeadToSheets, isUserWhitelisted }       = require("../services/googleSheetsService");

/**
 * POST /api/spin
 * Validates → Whitelist check → Assign reward → Save (unique-index guards duplicates)
 *
 * ── WHY findOne CHECKS WERE REMOVED ──────────────────────────────────────────
 * Pehle email aur phone ke liye alag-alag Lead.findOne() calls the.
 * Problem: do requests ek saath aate the, dono findOne karte the (koi
 * document nahi milta abhi tak), aur dono Lead.create() kar dete the.
 * MongoDB ka unique index hi sahi jagah hai ye guard karne ki.
 * Lead model mein email aur phone dono par `unique: true` hona ZAROORI hai
 * (neeche note dekho). Duplicate aane par Mongo 11000 throw karega — woh
 * pehle se handle hai.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * NOTE — Lead model mein ye dono fields unique honi chahiye:
 *   email: { type: String, required: true, unique: true, lowercase: true, trim: true }
 *   phone: { type: String, required: true, unique: true, trim: true }
 */
const submitSpin = async (req, res, next) => {
  try {
    // ── 1. Validate request body ─────────────────────────────────────────
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, email, phone, sourceWebsite } = req.body;

    // ── 2. Whitelist check (Sheet2: Phone + Email dono match hone chahiye) ─
    const whitelisted = await isUserWhitelisted(phone, email);
    if (!whitelisted) {
      return res.status(403).json({
        success: false,
        message: "Please add a review first to spin the wheel.",
        code:    "NOT_WHITELISTED",
      });
    }

    // ── 3. Select reward ─────────────────────────────────────────────────
    const reward      = selectReward();
    const rewardIndex = getRewardIndex(reward.id);

    // ── 4. Get client IP ─────────────────────────────────────────────────
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "unknown";

    // ── 5. Save lead to MongoDB ──────────────────────────────────────────
    // Agar email ya phone already exist karta hai, Mongo 11000 throw karega.
    // Woh catch block mein handle hai — koi race condition nahi.
    const lead = await Lead.create({
      name:          name.trim(),
      email:         email.toLowerCase().trim(),
      phone:         phone.trim(),
      reward:        reward.label,
      rewardId:      reward.id,
      sourceWebsite: sourceWebsite || "spin-wheel-app",
      ipAddress,
    });

    // ── 6. Save to Excel + Google Sheets (non-blocking) ──────────────────
    const saveData = {
      name:          lead.name,
      email:         lead.email,
      phone:         lead.phone,
      reward:        lead.reward,
      sourceWebsite: lead.sourceWebsite,
    };

    Promise.all([
      appendLeadToExcel(saveData),
      appendLeadToSheets(saveData),
    ]).then(([excelOk, sheetsOk]) => {
      if (!excelOk)  console.warn("⚠️  Excel save failed for:",  lead.email);
      if (!sheetsOk) console.warn("⚠️  Google Sheets save failed for:", lead.email);
    }).catch((err) => {
      console.error("❌ Save error:", err.message);
    });

    // ── 7. Respond ────────────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      message: "Spin registered successfully!",
      data: {
        leadId: lead._id,
        reward: {
          id:    reward.id,
          label: reward.label,
          color: reward.color,
          index: rewardIndex,
        },
      },
    });
  } catch (error) {
    // ── MongoDB duplicate key (email ya phone already used) ───────────────
    // Ye race condition ko bhi handle karta hai: agar do requests ek saath
    // aayein, ek succeed hogi, doosri yahan 409 milega.
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const label = field === "email" ? "email" : "phone number";
      return res.status(409).json({
        success: false,
        message: `This ${label} has already been used to spin the wheel.`,
        field,
      });
    }
    next(error);
  }
};

/**
 * GET /api/spin/rewards
 */
const getRewards = (req, res) => {
  const rewards = getAllRewards();
  res.status(200).json({ success: true, data: rewards });
};

module.exports = { submitSpin, getRewards };