// ---- Config ----
// Google Apps Script Web App URL (deployed from the linked Google Sheet).
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbythleZcAeAJyOY0iY04E2DTvHIluerVWIXBS21EnVnuBv8zSzSLv9VVtdtjsC7alda/exec";

// ---- Session helpers ----
function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("cg_session") || "null");
  } catch { return null; }
}

function requireLogin() {
  const s = getSession();
  if (!s) {
    window.location.href = "index.html";
    return null;
  }
  return s;
}

function logout() {
  sessionStorage.removeItem("cg_session");
  window.location.href = "index.html";
}

function renderUserChip(user) {
  const el = document.getElementById("userChip");
  if (!el) return;
  el.innerHTML = `
    <img src="${user.image || ('https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.firstName))}" alt="">
    <span>${user.firstName} ${user.lastName}</span>
    <a href="profile.html" class="logout-link" id="profileLink">Profile</a>
    <a href="#" class="logout-link" id="logoutLink">Log out</a>
  `;
  document.getElementById("logoutLink").addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

// ---- Fetch users from the Sheet ----
async function fetchUsers() {
  const res = await fetch(`${SHEET_API_URL}?action=getUsers`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load users: ${res.status}`);
  const users = await res.json();
  // Normalize isAdmin to boolean (sheet may give TRUE/FALSE/"" /true/false)
  return users.map(u => ({
    ...u,
    isAdmin: u.isAdmin === true || String(u.isAdmin).toUpperCase() === "TRUE"
  }));
}

// ---- Fetch game history from the Sheet ----
async function fetchHistory() {
  const res = await fetch(`${SHEET_API_URL}?action=getHistory`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load history: ${res.status}`);
  const rows = await res.json();
  // Parse JSON-stringified fields back into objects/arrays
  return rows.map(row => {
    const out = { ...row };
    ["players", "teams", "rounds", "totals", "winningTeam"].forEach(key => {
      if (typeof out[key] === "string" && out[key].trim().startsWith("[")) {
        try { out[key] = JSON.parse(out[key]); } catch { /* leave as-is */ }
      } else if (typeof out[key] === "string" && out[key].trim().startsWith("{")) {
        try { out[key] = JSON.parse(out[key]); } catch { /* leave as-is */ }
      }
    });
    return out;
  });
}

// ---- Append a game to History sheet ----
async function appendGameToHistory(gameRecord) {
  const res = await fetch(SHEET_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // avoids CORS preflight
    body: JSON.stringify({ action: "addGame", game: gameRecord })
  });
  if (!res.ok) {
    throw new Error(`Failed to save game: ${res.status}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// ---- Upload a profile image (base64) and get back a Drive URL ----
async function uploadProfileImage(username, base64Data, mimeType) {
  const res = await fetch(SHEET_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "uploadImage", username, imageData: base64Data, mimeType })
  });
  if (!res.ok) {
    throw new Error(`Failed to upload image: ${res.status}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.url;
}
async function updateUser(username, fields) {
  const res = await fetch(SHEET_API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updateUser", username, fields })
  });
  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.status}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
