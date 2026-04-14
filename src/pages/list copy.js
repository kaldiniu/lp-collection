//src/pages/list.js
// 
import { loadBaseData } from "../data.js";
import { getPrefs } from "../prefs.js";
import { selectItems } from "../selectors.js";
import { loadListState, saveListState, resetListState, isDefaultState } from "../listState.js";
import { openModal } from "../ui/modal.js";
import { resolveImage, initLazyImages, getPlaceholder } from "../ui/images.js";

let cache = {
  loaded: false,
  all: [],
  formatsByType: new Map(),
};

export async function renderList(type) {
  const app = document.querySelector("#app");

  // 1) Загружаем данные один раз (кэш)
  if (!cache.loaded) {
    app.innerHTML = "<p>Loading...</p>";
    const data = await loadBaseData();
    cache.all = data.items ?? [];
    cache.loaded = true;

    // заранее посчитаем форматы для каждого типа (быстро и удобно)
    for (const t of ["single", "album", "lpu", "other"]) {
      const typeItems = cache.all.filter(x => x.type === t);
      const formats = Array.from(new Set(typeItems.map(x => x.format).filter(Boolean))).sort();
      cache.formatsByType.set(t, formats);
    }
  }

  // 2) Рисуем каркас страницы ОДИН РАЗ (toolbar + контейнеры)
  ensureLayout(app, type);

  // 3) Обновляем содержимое (count + list) без перерисовки toolbar
  updateContent(type);
}

function bindOpenRelease() {
  const content = document.querySelector("#content");
  if (!content) return;

  content.addEventListener("click", (e) => {
    const el = e.target.closest("[data-open]");
    if (!el) return;

    const id = el.dataset.open;
    const item = cache.all.find(x => x.id === id);
    if (!item) return;

    openModal(renderRelease(item));
  });
}

function ensureLayout(app, type) {
  const root = app.querySelector("[data-list-layout='1']");

  // если layout уже есть, но для другого type — пересоздадим полностью
  if (root && root.dataset.type !== type) {
    app.innerHTML = "";          // уничтожаем старый layout
    return ensureLayout(app, type); // создаём новый под новый type
  }

  // если layout уже есть и type тот же — ничего не пересоздаём
  if (root) {
    app.querySelector("#page-title").textContent = type.toUpperCase();
    return;
  }

  const state = loadListState(type);
  const formats = cache.formatsByType.get(type) ?? [];

  app.innerHTML = `
    <div data-list-layout="1" data-type="${type}">
      <h1 id="page-title">${escapeHtml(type.toUpperCase())}</h1>

      ${renderToolbar(state, formats)}

      <p id="count-line"></p>

      <div id="content"></div>

      <div id="pager"></div>
    </div>
  `;

  bindToolbar(type);
  bindOpenRelease();
}

function updateContent(type) {
  const state = loadListState(type);

  const result = selectItems(cache.all, {
    type,
    search: state.search,
    filters: state.filters,
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize
  });

  const { view } = getPrefs();

  // count
  const countLine = document.querySelector("#count-line");
  countLine.textContent = `Показано: ${result.startIndex}-${result.endIndex} из ${result.total}`;

  // list
  const content = document.querySelector("#content");
  content.innerHTML = view === "grid" ? renderGrid(result.items) : renderTable(result.items);

  // pagination
  const pager = document.querySelector("#pager");
  pager.innerHTML = renderPager(result.page, result.pages);
  bindPager(type, result.page, result.pages);

  // reset button enabled/disabled
  const btnReset = document.querySelector("#btn-reset");
  if (btnReset) {
    const disabled = isDefaultState(state);
    btnReset.disabled = disabled;
    btnReset.classList.toggle("btn--disabled", disabled);
  }
}

/* ---------- toolbar ---------- */

function renderToolbar(state, formats) {
  const resetDisabled = isDefaultState(state);

  return `
    <div class="toolbar">
      <label class="field">
        <span class="field__label">Search</span>
        <input class="input" id="q" type="search"
          placeholder="Title / Catalog / EAN"
          value="${escapeHtml(state.search)}" />
      </label>

      <label class="field">
        <span class="field__label">Format</span>
        <select class="select" id="f-format">
          <option value="all">All</option>
          ${formats.map(f => `
            <option value="${escapeHtml(f)}" ${state.filters.format === f ? "selected" : ""}>${escapeHtml(f)}</option>
          `).join("")}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Owned</span>
        <select class="select" id="f-owned">
          <option value="all" ${state.filters.owned === "all" ? "selected" : ""}>All</option>
          <option value="true" ${state.filters.owned === "true" ? "selected" : ""}>Owned</option>
          <option value="false" ${state.filters.owned === "false" ? "selected" : ""}>Not owned</option>
        </select>
      </label>

      <label class="field">
        <span class="field__label">Per page</span>
        <select class="select" id="page-size">
          ${[16, 32, 64, 128].map(n => `
            <option value="${n}" ${Number(state.pageSize) === n ? "selected" : ""}>${n}</option>
          `).join("")}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Sort</span>
        <select class="select" id="s-field">
          ${["title","country","year","owned"].map(f =>
            `<option value="${f}" ${state.sort.field === f ? "selected" : ""}>${f}</option>`
          ).join("")}
        </select>
      </label>

      <button class="btn" id="s-dir" type="button">${state.sort.dir === "asc" ? "↑" : "↓"}</button>

      <button class="btn ${resetDisabled ? "btn--disabled" : ""}" id="btn-reset"
        type="button" ${resetDisabled ? "disabled" : ""}>
        Reset
      </button>
    </div>
  `;
}

function bindToolbar(type) {
  const q = document.querySelector("#q");
  const fFormat = document.querySelector("#f-format");
  const fOwned = document.querySelector("#f-owned");
  const pageSizeSel = document.querySelector("#page-size");
  const sField = document.querySelector("#s-field");
  const sDir = document.querySelector("#s-dir");
  const btnReset = document.querySelector("#btn-reset");

  // debounce для input (не обязателен, но приятно)
  let t = null;

  const read = () => loadListState(type);
  const write = (st) => saveListState(type, st);

  const apply = () => updateContent(type);

  q?.addEventListener("input", () => {
    const st = read();
    st.search = q.value;
    st.page = 1;
    write(st);

    // debounce: обновляем через 150мс после последнего ввода
    clearTimeout(t);
    t = setTimeout(apply, 150);
  });

  fFormat?.addEventListener("change", () => {
    const st = read();
    st.filters.format = fFormat.value;
    st.page = 1;
    write(st);
    apply();
  });

  fOwned?.addEventListener("change", () => {
    const st = read();
    st.filters.owned = fOwned.value;
    st.page = 1;
    write(st);
    apply();
  });

  pageSizeSel?.addEventListener("change", () => {
    const st = read();
    st.pageSize = Number(pageSizeSel.value) || 32;
    st.page = 1;
    write(st);
    apply();
  });

  sField?.addEventListener("change", () => {
    const st = read();
    st.sort.field = sField.value;
    st.page = 1;
    write(st);
    apply();
  });

  sDir?.addEventListener("click", () => {
    const st = read();
    st.sort.dir = st.sort.dir === "asc" ? "desc" : "asc";
    st.page = 1;
    write(st);

    // обновим стрелку на кнопке, но не перерисовываем весь toolbar
    sDir.textContent = st.sort.dir === "asc" ? "↑" : "↓";

    apply();
  });

  btnReset?.addEventListener("click", () => {
    resetListState(type);
    // сбросим UI значения вручную (toolbar остаётся, поэтому обновим элементы)
    const st = loadListState(type);
    q.value = st.search;
    fFormat.value = st.filters.format;
    fOwned.value = st.filters.owned;
    sField.value = st.sort.field;
    sDir.textContent = st.sort.dir === "asc" ? "↑" : "↓";
    pageSizeSel.value = String(st.pageSize);
    apply();
  });
}

/* ---------- views ---------- */

function renderGrid(items) {
  return `
    <div class="grid">
      ${items.map(x => `
        <article class="card" data-open="${escapeHtml(x.id)}">
          <div class="card__title">${escapeHtml(x.title)}</div>
          <div class="card__meta">
            ${escapeHtml(String(x.year ?? "—"))}
            · ${escapeHtml(x.format ?? "—")}
            · ${escapeHtml(x.packaging ?? "Unknown")}
          </div>
          <div class="card__meta muted">
            ${escapeHtml(x.country ?? "—")}
            · ${escapeHtml(x.ean ? `EAN: ${x.ean}` : (x.catalog ? `CAT: ${x.catalog}` : "n/a"))}
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
            <th>Title</th><th>Year</th><th>Format</th><th>Packaging</th><th>Country</th><th>EAN/Catalog</th><th>Owned</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(x => `
            <tr data-open="${escapeHtml(x.id)}">
              <td>${escapeHtml(x.title)}</td>
              <td>${escapeHtml(String(x.year ?? "—"))}</td>
              <td>${escapeHtml(x.format ?? "—")}</td>
              <td>${escapeHtml(x.packaging ?? "Unknown")}</td>
              <td>${escapeHtml(x.country ?? "—")}</td>
              <td>${escapeHtml(x.ean || x.catalog || "n/a")}</td>
              <td>${x.owned ? "✓" : "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderPager(page, pages) {
  // если страниц 1 — не показываем ничего
  if (pages <= 1) return "";

  const prevDisabled = page <= 1 ? "disabled" : "";
  const nextDisabled = page >= pages ? "disabled" : "";

  return `
    <div class="pager">
      <button class="btn" data-page="1" ${prevDisabled}>« First</button>
      <button class="btn" data-page="${page - 1}" ${prevDisabled}>‹ Prev</button>

      <span class="pager__info">Page <b>${page}</b> / <b>${pages}</b></span>

      <button class="btn" data-page="${page + 1}" ${nextDisabled}>Next ›</button>
      <button class="btn" data-page="${pages}" ${nextDisabled}>Last »</button>
    </div>
  `;
}

function bindPager(type, page, pages) {
  const pager = document.querySelector("#pager");
  if (!pager || pages <= 1) return;

  pager.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPage = Number(btn.dataset.page);
      if (!Number.isFinite(targetPage)) return;
      if (targetPage < 1 || targetPage > pages) return;
      if (targetPage === page) return;

      const st = loadListState(type);
      st.page = targetPage;
      saveListState(type, st);

      // обновляем только контент (toolbar не трогаем)
      updateContent(type);

      // опционально: прокрутить к верху списка
      document.querySelector("#page-title")?.scrollIntoView({ block: "start" });
    });
  });
}

function renderRelease(item) {
  const tracks = Array.isArray(item.tracklist) ? item.tracklist : [];
  const images = Array.isArray(item.images) ? item.images : [];

  return `
    <h2>${escapeHtml(item.title)}</h2>

    <div class="kv">
      ${kv("Type", item.type)}
      ${kv("Year", item.year)}
      ${kv("Format", item.format)}
      ${kv("Packaging", item.packaging)}
      ${kv("Era", item.era)}
      ${kv("Country", item.country)}
      ${kv("Catalog", item.catalog)}
      ${kv("EAN", item.ean)}
      ${kv("Owned", item.owned ? "Yes" : "No")}
    </div>

    ${images.length ? `
      <h3>Images</h3>
      <img class="release-img" src="${escapeHtml(images[0])}" alt="">
    ` : ""}

    ${tracks.length ? `
      <h3>Tracklist</h3>
      <ol class="tracklist">
        ${tracks.map(t => `
          <li>
            <span>${escapeHtml(t.title ?? "")}</span>
            <span class="muted">${escapeHtml(t.duration ? t.duration : "—")}</span>
          </li>
        `).join("")}
      </ol>
    ` : `<p class="muted">Tracklist: —</p>`}

    ${item.notes ? `
      <h3>Notes</h3>
      <p>${escapeHtml(item.notes)}</p>
    ` : ""}
  `;
}

function kv(k, v) {
  if (v == null || v === "") return "";
  return `<div class="kv__row"><span class="muted">${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

