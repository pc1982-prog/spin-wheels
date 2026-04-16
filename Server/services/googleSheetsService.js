const { google } = require("googleapis");

const SHEET_NAME      = "Sheet1";
const WHITELIST_SHEET = "Sheet2";

/* ─────────────────────────────────────────────
   Shared Sheets client (created once, reused)
───────────────────────────────────────────── */
let _sharedSheets = null;

const getSheetsClient = () => {
  if (_sharedSheets) return _sharedSheets;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      `Google Sheets credentials missing! ` +
      `ID: ${!!process.env.GOOGLE_SPREADSHEET_ID}, ` +
      `Email: ${!!process.env.GOOGLE_CLIENT_EMAIL}, Key: ${!!privateKey}`
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key:  privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  _sharedSheets = google.sheets({ version: "v4", auth });
  return _sharedSheets;
};

/* ─────────────────────────────────────────────
   In-Memory Whitelist Cache
───────────────────────────────────────────── */
let _whitelistCache = [];
let _cacheLoadedAt  = null;        // null = kabhi load nahi hua
const CACHE_TTL_MS  = 2 * 60 * 1000; // 2 minutes

// ── FIX: refresh in-flight ko track karo taki ek saath kai live fetches na hon
let _refreshPromise = null;

/* ─────────────────────────────────────────────
   Fetch whitelist rows from Sheet2
───────────────────────────────────────────── */
const _fetchWhitelistFromSheets = async () => {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    range:         `${WHITELIST_SHEET}!A:B`,
  });

  const rows = response.data.values || [];

  return rows
    .filter((row) => {
      const a = (row[0] || "").toLowerCase();
      const b = (row[1] || "").toLowerCase();
      return a !== "phone" && b !== "email" && (a || b);
    })
    .map((row) => ({
      phone: (row[0] || "").trim().replace(/\s+/g, ""),
      email: (row[1] || "").trim().toLowerCase(),
    }));
};

/* ─────────────────────────────────────────────
   Cache helpers
───────────────────────────────────────────── */
const _isCacheStale = () => {
  if (!_cacheLoadedAt) return true;
  return (Date.now() - _cacheLoadedAt.getTime()) > CACHE_TTL_MS;
};

// ── FIX: _refreshCache ab promise return karta hai aur concurrent calls ko
//    deduplicate karta hai — server restart ke baad kai saari requests ek
//    saath live fetch shuru nahi karein.
const _refreshCache = async () => {
  if (_refreshPromise) return _refreshPromise; // already in-flight

  _refreshPromise = (async () => {
    try {
      _whitelistCache = await _fetchWhitelistFromSheets();
      _cacheLoadedAt  = new Date();
      console.log(`🔄 Whitelist cache refreshed: ${_whitelistCache.length} entries`);
    } catch (err) {
      console.warn("⚠️  Cache refresh failed (keeping old data):", err.message);
    } finally {
      _refreshPromise = null; // in-flight khatam
    }
  })();

  return _refreshPromise;
};

const _lookupInCache = (phone, email) =>
  _whitelistCache.some(
    (entry) => entry.phone === phone && entry.email === email
  );

/* ─────────────────────────────────────────────
   PUBLIC: initWhitelistCache
   server.js mein `await initWhitelistCache()` ke saath call karo.
   Ye RESOLVE hone tak server listen nahi karega — pehli request hamesha
   warm cache milegi.
───────────────────────────────────────────── */
const initWhitelistCache = async () => {
  try {
    _whitelistCache = await _fetchWhitelistFromSheets();
    _cacheLoadedAt  = new Date();
    console.log(`✅ Whitelist cache loaded: ${_whitelistCache.length} entries`);
  } catch (err) {
    // Startup pe fail hua — server fir bhi chalega, live fetch se kaam chalega
    console.error("❌ Initial whitelist load failed:", err.message);
  }

  // Auto-refresh every 2 minutes in background
  setInterval(_refreshCache, CACHE_TTL_MS);
};

/* ─────────────────────────────────────────────
   PUBLIC: isUserWhitelisted

   Flow:
   1. Cache stale → refresh (deduplicated)
   2. Cache hit → fast allow
   3. Cache miss → ek live fetch, cache update
   4. Nahi mila → block
───────────────────────────────────────────── */
const isUserWhitelisted = async (phone, email) => {
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  const normalizedEmail = email.trim().toLowerCase();

  // ── Step 1: Stale hai toh refresh ────────────────────────────────────
  if (_isCacheStale()) {
    await _refreshCache();
  }

  // ── Step 2: Cache hit ────────────────────────────────────────────────
  if (_lookupInCache(normalizedPhone, normalizedEmail)) {
    console.log(`✅ Whitelist hit (cache): ${normalizedEmail}`);
    return true;
  }

  // ── Step 3: Cache miss → live fetch (naya entry ho sakta hai) ─────────
  console.log(`🔍 Cache miss — live Sheet2 check: ${normalizedEmail}`);
  try {
    await _refreshCache(); // deduplicated — agar already in-flight hai toh wait karega

    const found = _lookupInCache(normalizedPhone, normalizedEmail);

    if (found) {
      console.log(`✅ Whitelist hit (live): ${normalizedEmail}`);
      return true;
    }
  } catch (err) {
    console.error("❌ Live whitelist fetch failed:", err.message);
    return false;
  }

  // ── Step 4: Nahi mila ─────────────────────────────────────────────────
  console.log(`🚫 Not in whitelist: phone=${normalizedPhone}, email=${normalizedEmail}`);
  return false;
};

/* ─────────────────────────────────────────────
   PUBLIC: appendLeadToSheets → Sheet1
───────────────────────────────────────────── */
const appendLeadToSheets = async (leadData) => {
  try {
    const sheets = getSheetsClient();

    const row = [
      leadData.name,
      leadData.email,
      leadData.phone,
      leadData.reward,
      leadData.sourceWebsite || "spin-wheel-app",
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId:    process.env.GOOGLE_SPREADSHEET_ID,
      range:            `${SHEET_NAME}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody:      { values: [row] },
    });

    console.log(`✅ Google Sheets saved: ${leadData.email}`);
    return true;
  } catch (error) {
    console.error("❌ Google Sheets FAILED for:", leadData.email);
    console.error("   Error:", error.message);
    return false;
  }
};

module.exports = { appendLeadToSheets, isUserWhitelisted, initWhitelistCache };