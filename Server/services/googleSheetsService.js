const { google } = require("googleapis");

// const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = "Sheet1";

const getAuthClient = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      `Google Sheets credentials missing! ` +
      `ID: ${!!process.env.GOOGLE_SPREADSHEET_ID}, Email: ${!!process.env.GOOGLE_CLIENT_EMAIL}, Key: ${!!privateKey}`
    );
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

const appendLeadToSheets = async (leadData) => {
  try {

    const auth   = getAuthClient();
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
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });

    console.log(`✅ Google Sheets saved: ${leadData.email}`);
    return true;
  } catch (error) {
    console.error("❌ Google Sheets FAILED for:", leadData.email);
    console.error("   Error message :", error.message);
    console.error("   Error code    :", error.code);
    console.error("   HTTP status   :", error.status || error.response?.status);
    if (error.response?.data) {
      console.error("   API response  :", JSON.stringify(error.response.data));
    }
    return false;
  }
};

module.exports = { appendLeadToSheets };