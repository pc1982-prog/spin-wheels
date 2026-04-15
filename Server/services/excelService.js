const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../data");
const EXCEL_FILE = path.join(DATA_DIR, "leads.xlsx");

// Ensure data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

/**
 * Appends a new lead row to the Excel file.
 * Creates the file with headers if it doesn't exist.
 */
const appendLeadToExcel = (leadData) => {
  try {
    ensureDataDir();

    let workbook;
    let worksheet;
    let existingData = [];

    if (fs.existsSync(EXCEL_FILE)) {
      workbook = XLSX.readFile(EXCEL_FILE);
      const sheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[sheetName];
      existingData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      workbook = XLSX.utils.book_new();
    }

    const newRow = {
      Name: leadData.name,
      Email: leadData.email,
      Phone: leadData.phone,
      Reward: leadData.reward,
      Source: leadData.sourceWebsite || "spin-wheel-app",
      Timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    existingData.push(newRow);

    const newWorksheet = XLSX.utils.json_to_sheet(existingData);

    // Style column widths
    newWorksheet["!cols"] = [
      { wch: 25 }, // Name
      { wch: 35 }, // Email
      { wch: 20 }, // Phone
      { wch: 55 }, // Reward
      { wch: 20 }, // Source
      { wch: 25 }, // Timestamp
    ];

    workbook.SheetNames = ["Leads"];
    workbook.Sheets["Leads"] = newWorksheet;

    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(`📊 Lead saved to Excel: ${leadData.email}`);
    return true;
  } catch (error) {
    // Non-fatal: log but don't crash the request
    console.error("Excel write error:", error.message);
    return false;
  }
};

module.exports = { appendLeadToExcel };