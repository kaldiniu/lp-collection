//src/pages/list.js
// 
import { loadBaseData } from "../data.js";

export async function renderList(type) {
  const app = document.querySelector("#app");
  app.innerHTML = "<p>Loading...</p>";

  try {
    const data = await loadBaseData();
    const items = (data.items ?? []).filter(x => x.type === type);

    app.innerHTML = `
      <h1>${type.toUpperCase()}</h1>
      <p>Найдено: <b>${items.length}</b></p>

      <ul>
        ${items.map(x => `<li>${escapeHtml(x.title)} (${x.year ?? ""})</li>`).join("")}
      </ul>
    `;
  } catch (err) {
    console.error(err);
    app.innerHTML = `
      <h1>${type.toUpperCase()}</h1>
      <p style="color:crimson"><b>Error:</b> ${escapeHtml(err.message)}</p>
      <p>Открой DevTools → Console / Network и проверь, грузится ли base.json</p>
    `;
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}