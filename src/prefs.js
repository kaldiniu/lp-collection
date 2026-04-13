//src/prefs.js
// 
const KEYS = {
  THEME: "lp_theme",
  VIEW: "lp_view",
};

const DEFAULTS = {
  theme: "dark", // "light" | "dark"
  view: "grid",  // "grid" | "table"
  pageSize: 12
};

export function getPrefs() {
  return {
    theme: localStorage.getItem(KEYS.THEME) ?? DEFAULTS.theme,
    view: localStorage.getItem(KEYS.VIEW) ?? DEFAULTS.view,
  };
}

export function setTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme);
}

export function setView(view) {
  localStorage.setItem(KEYS.VIEW, view);
}

export function applyTheme(theme) {
  // будем использовать data-атрибут в CSS
  document.documentElement.dataset.theme = theme;
}