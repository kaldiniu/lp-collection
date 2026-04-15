// src/services/auth.js
const LS_KEY = "lp_admin_mode";
const ADMIN_PASSWORD = "iurii";

export function isAuthed() {
  return localStorage.getItem(LS_KEY) === "1";
}

export function loginWithPassword(password) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(LS_KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(LS_KEY);
}
``