const express = require("express");
const router  = express.Router();
const { submitSpin, getRewards }  = require("../controllers/spinController");
const { spinValidators }          = require("../utils/validators");
const { spinLimiter }             = require("../middleware/rateLimiter");


// GET /api/spin/rewards — fetch all reward segments for wheel rendering
router.get("/rewards", getRewards);



// POST /api/spin — submit lead + get reward
router.post("/", spinLimiter, spinValidators, submitSpin);

module.exports = router;