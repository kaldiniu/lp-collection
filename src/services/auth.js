// src/services/auth.js
//
const LS_KEY = "lp_admin_mode";

// ⚠️ Это НЕ настоящая безопасность. Это режим редактирования на статическом сайте.
const ADMIN_PASSWORD = "iurii";

export function isAuthed() {
  return localStorage.getItem(LS_KEY) === "1";
}

export function login() {
  const pwd = prompt("Admin password:");
  if (pwd === ADMIN_PASSWORD) {
    localStorage.setItem(LS_KEY, "1");
    return true;
  }
  alert("Wrong password");
  return false;
}

export function logout() {
  localStorage.removeItem(LS_KEY);
}
