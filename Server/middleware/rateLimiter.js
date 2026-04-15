const rateLimit = require("express-rate-limit");

const spinLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5, // Max 5 attempts per window
  message: {
    success: false,
    message: "Too many spin attempts from this IP. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress,
});

module.exports = { spinLimiter };