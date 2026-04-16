const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const spinRoutes = require("./routes/spinRoutes");
const { globalErrorHandler, notFound } = require("./middleware/errorHandler");
const { initWhitelistCache } = require("./services/googleSheetsService");

dotenv.config();

const app = express();

// ── Security middleware (register before routes) ──────────────────────────────
app.use(helmet());

const allowedOrigins = [
  "http://localhost:5173",
  "https://spin-wheels-frontend.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/spin", spinRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(globalErrorHandler);

// ── Startup: DB → Cache → Listen (sab await) ─────────────────────────────────
// YAHI tha asli bug: pehle connectDB() aur initWhitelistCache() bina await ke
// chal rahe the. Server tabhi listen karna shuru kar deta tha jab DB/cache
// ready bhi nahi hoti thi. Ab server tabhi requests accept karega jab dono
// ready ho jaayein.
const startServer = async () => {
  try {
    // 1. MongoDB connect karo — is ke baat hi duplicate check kaam karega
    await connectDB();

    // 2. Whitelist cache load karo — pehli request kabhi "cache miss" nahi hogi
    await initWhitelistCache();

    // 3. Ab sunna shuru karo
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
      );
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;