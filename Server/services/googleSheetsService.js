const { google } = require("googleapis");
const path = require("path");

// ✅ Tumhari sheet ka ID (URL se liya)
const SPREADSHEET_ID = "1M7B6TT2Kgdq8F8TbUs6DI9aWi2-T-tgXijPeyFac2rQ";

// ✅ Sheet tab ka naam (screenshot mein "Sheet1" tha)
const SHEET_NAME = "Sheet1";

const getAuthClient = () => {
  return new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../config/google-credentials.json"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

/**
 * Appends a new lead row to Google Sheets
 */
const appendLeadToSheets = async (leadData) => {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    const row = [
      leadData.name,
      leadData.email,
      leadData.phone,
      leadData.reward,
      leadData.sourceWebsite || "spin-wheel-app",
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`✅ Google Sheets mein save hua: ${leadData.email}`);
    return true;
  } catch (error) {
    console.error("❌ Google Sheets error:", error.message);
    return false;
  }
};

module.exports = { appendLeadToSheets };