const { google } = require("googleapis");

const getAuthClient = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

/**
 * GET /api/spin/debug-whitelist?phone=XXX&email=YYY
 * 
 * Yeh endpoint:
 * 1. Sheet2 ka poora data print karta hai
 * 2. Aapka phone+email dono se compare karke batata hai kya mila
 * 
 * ⚠️ PRODUCTION MEIN IS ROUTE KO HATA DENA
 */
const debugWhitelist = async (req, res) => {
  try {
    const { phone = "", email = "" } = req.query;

    const auth   = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    // Sheet ke saare tab names fetch karo
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    });
    const sheetNames = meta.data.sheets.map((s) => s.properties.title);

    // Sheet2 ka data fetch karo
    let rows = [];
    let fetchError = null;
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range:         `Sheet2!A:B`,
      });
      rows = response.data.values || [];
    } catch (e) {
      fetchError = e.message;
    }

    // Match logic
    const normalizedPhone = phone.trim().replace(/\s+/g, "");
    const normalizedEmail = email.trim().toLowerCase();

    const matchResult = rows.map((row, i) => {
      const rowPhone = (row[0] || "").trim().replace(/\s+/g, "");
      const rowEmail = (row[1] || "").trim().toLowerCase();
      return {
        rowIndex:    i + 1,
        sheetPhone:  rowPhone,
        sheetEmail:  rowEmail,
        phoneMatch:  rowPhone === normalizedPhone,
        emailMatch:  rowEmail === normalizedEmail,
        bothMatch:   rowPhone === normalizedPhone && rowEmail === normalizedEmail,
      };
    });

    const isAllowed = matchResult.some((r) => r.bothMatch);

    return res.json({
      debug: true,
      spreadsheetId:   process.env.GOOGLE_SPREADSHEET_ID,
      allSheetNames:   sheetNames,           // ← check karo "Sheet2" hai ya nahi
      sheet2FetchError: fetchError,          // ← null hona chahiye
      totalRows:       rows.length,
      queryPhone:      normalizedPhone,
      queryEmail:      normalizedEmail,
      rows:            matchResult,          // ← har row ka match status
      finalDecision:   isAllowed ? "✅ ALLOWED" : "🚫 BLOCKED",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
};

module.exports = { debugWhitelist };