//src/main.js
// 
import { startRouter, rerender } from "./router.js";
import { getPrefs, setTheme, setView, applyTheme } from "./prefs.js";

function initUI() {
  const btnTheme = document.querySelector("#btn-theme");
  const btnView = document.querySelector("#btn-view");

  const prefs = getPrefs();

  // применяем тему сразу (до рендера страниц)
  applyTheme(prefs.theme);

  // выставим подписи кнопок
  if (btnTheme) btnTheme.textContent = prefs.theme === "dark" ? "Dark" : "Light";
  if (btnView) btnView.textContent = prefs.view === "grid" ? "Grid" : "Table";

  // обработчик темы
  btnTheme?.addEventListener("click", () => {
    const current = getPrefs().theme;
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    btnTheme.textContent = next === "dark" ? "Dark" : "Light";
  });

  // обработчик вида
  btnView?.addEventListener("click", async () => {
    const current = getPrefs().view;
    const next = current === "grid" ? "table" : "grid";
    setView(next);
    btnView.textContent = next === "grid" ? "Grid" : "Table";
    await rerender(); // перерисуем текущую страницу
  });
}

initUI();
startRouter();
``