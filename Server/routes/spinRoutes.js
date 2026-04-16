const express = require("express");
const router  = express.Router();
const { submitSpin, getRewards }  = require("../controllers/spinController");
const { spinValidators }          = require("../utils/validators");
const { spinLimiter }             = require("../middleware/rateLimiter");
const { debugWhitelist }          = require("../utils/debugWhitelist");

// GET /api/spin/rewards — fetch all reward segments for wheel rendering
router.get("/rewards", getRewards);

// ⚠️ DEBUG ONLY — production mein comment out kar dena
// GET /api/spin/debug-whitelist?phone=+91XXXXXXXX&email=test@example.com
router.get("/debug-whitelist", debugWhitelist);

// POST /api/spin — submit lead + get reward
router.post("/", spinLimiter, spinValidators, submitSpin);

module.exports = router;