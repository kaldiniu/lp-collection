//src/pages/list.js
// 
import { loadBaseData } from "../data.js";
import { getPrefs } from "../prefs.js";

export async function renderList(type) {
  const app = document.querySelector("#app");
  app.innerHTML = "<p>Loading...</p>";

  try {
    const data = await loadBaseData();
    const items = (data.items ?? []).filter(x => x.type === type);

    const { view } = getPrefs();

    app.innerHTML = `
      <h1>${type.toUpperCase()}</h1>
      <p>Найдено: <b>${items.length}</b></p>
      ${view === "grid" ? renderGrid(items) : renderTable(items)}
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

function renderGrid(items) {
  return `
    <div class="grid">
      ${items.map(x => `
        <article class="card">
          <div class="card__title">${escapeHtml(x.title)}</div>
          <div class="card__meta">
            ${escapeHtml(String(x.year ?? "—"))}
            · ${escapeHtml(x.format ?? "—")}
            · ${escapeHtml(x.packaging ?? "Unknown")}
          </div>
          <div class="card__meta muted">
            ${escapeHtml(x.country ?? "—")}
            · ${escapeHtml(x.ean ? `EAN: ${x.ean}` : (x.catalog ? `CAT: ${x.catalog}` : "—"))}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderTable(items) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Title</th><th>Year</th><th>Format</th><th>Packaging</th><th>Country</th><th>EAN/Catalog</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(x => `
            <tr>
              <td>${escapeHtml(x.title)}</td>
              <td>${escapeHtml(String(x.year ?? "—"))}</td>
              <td>${escapeHtml(x.format ?? "—")}</td>
              <td>${escapeHtml(x.packaging ?? "Unknown")}</td>
              <td>${escapeHtml(x.country ?? "—")}</td>
              <td>${escapeHtml(x.ean || x.catalog || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}