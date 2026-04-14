// src/pages/list.js
//
import { loadBaseData } from "../data.js";
import { getPrefs } from "../prefs.js";
import { selectItems } from "../selectors.js";
import {
  loadListState,
  saveListState,
  resetListState,
  isDefaultState,
} from "../listState.js";
import { openModal } from "../ui/modal.js";
import { resolveImage, initLazyImages, getPlaceholder } from "../ui/images.js";

// -------------------- cache --------------------
let cache = {
  loaded: false,
  all: [],
  formatsByType: new Map(),
};

// -------------------- entry --------------------
export async function renderList(type) {
  const app = document.querySelector("#app");

  // 1) Load data once
  if (!cache.loaded) {
    app.innerHTML = "<p>Loading...</p>";
    const data = await loadBaseData();
    cache.all = data.items ?? [];
    cache.loaded = true;

    // Pre-calc formats per type
    for (const t of ["single", "album", "lpu", "other"]) {
      const typeItems = cache.all.filter((x) => x.type === t);
      const formats = Array.from(
        new Set(typeItems.map((x) => x.format).filter(Boolean))
      ).sort();
      cache.formatsByType.set(t, formats);
    }
  }

  // 2) Ensure layout exists for this type
  ensureLayout(app, type);

  // 3) Update content only (keeps input focus)
  updateContent(type);
}

// -------------------- layout --------------------
function ensureLayout(app, type) {
  const root = app.querySelector('[data-list-layout="1"]');

  // If layout exists but for another type — rebuild
  if (root && root.dataset.type !== type) {
    app.innerHTML = "";
    return ensureLayout(app, type);
  }

  // If layout already exists for this type — just update title
  if (root) {
    const title = root.querySelector("#page-title");
    if (title) title.textContent = type.toUpperCase();
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

// -------------------- content update --------------------
function updateContent(type) {
  const state = loadListState(type);

  const result = selectItems(cache.all, {
    type,
    search: state.search,
    filters: state.filters,
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  });

  // Sync page if clamped by selector (e.g., after filters)
  if (result.page !== state.page) {
    state.page = result.page;
    saveListState(type, state);
  }

  const { view } = getPrefs();
  const root = document.querySelector('[data-list-layout="1"]');

  // Count line
  const countLine = root.querySelector("#count-line");
  countLine.textContent = `Показано: ${result.startIndex}-${result.endIndex} из ${result.total}`;

  // Content
  const content = root.querySelector("#content");
  content.innerHTML = view === "grid" ? renderGrid(result.items) : renderTable(result.items);

  // Lazy images in list (grid or table)
  initLazyImages(content);

  // Pager
  const pager = root.querySelector("#pager");
  pager.innerHTML = renderPager(result.page, result.pages);
  bindPager(type, result.page, result.pages);

  // Reset button state
  const btnReset = root.querySelector("#btn-reset");
  if (btnReset) {
    const disabled = isDefaultState(state);
    btnReset.disabled = disabled;
    btnReset.classList.toggle("btn--disabled", disabled);
  }
}

// -------------------- toolbar --------------------
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
          ${formats.map((f) => `
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
          ${[16, 32, 64, 128].map((n) => `
            <option value="${n}" ${Number(state.pageSize) === n ? "selected" : ""}>${n}</option>
          `).join("")}
        </select>
      </label>

      <label class="field">
        <span class="field__label">Sort</span>
        <select class="select" id="s-field">
          ${["title", "country", "year", "owned"].map((f) =>
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
  const root = document.querySelector('[data-list-layout="1"]');
  const q = root.querySelector("#q");
  const fFormat = root.querySelector("#f-format");
  const fOwned = root.querySelector("#f-owned");
  const sField = root.querySelector("#s-field");
  const sDir = root.querySelector("#s-dir");
  const btnReset = root.querySelector("#btn-reset");
  const pageSizeSel = root.querySelector("#page-size");

  let t = null; // debounce timer

  const read = () => loadListState(type);
  const write = (st) => saveListState(type, st);
  const apply = () => updateContent(type);

  q?.addEventListener("input", () => {
    const st = read();
    st.search = q.value;
    st.page = 1;
    write(st);
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
    st.pageSize = Number(pageSizeSel.value) || st.pageSize;
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
    sDir.textContent = st.sort.dir === "asc" ? "↑" : "↓";
    apply();
  });

  btnReset?.addEventListener("click", () => {
    const st = resetListState(type);

    // reset UI values (toolbar persists)
    q.value = st.search;
    fFormat.value = st.filters.format;
    fOwned.value = st.filters.owned;
    sField.value = st.sort.field;
    sDir.textContent = st.sort.dir === "asc" ? "↑" : "↓";
    pageSizeSel.value = String(st.pageSize);

    apply();
    root.querySelector("#page-title")?.scrollIntoView({ block: "start" });
  });
}

// -------------------- pager --------------------
function renderPager(page, pages) {
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

  pager.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = Number(btn.dataset.page);
      if (!Number.isFinite(targetPage)) return;
      if (targetPage < 1 || targetPage > pages) return;
      if (targetPage === page) return;

      const st = loadListState(type);
      st.page = targetPage;
      saveListState(type, st);
      updateContent(type);
      document.querySelector("#page-title")?.scrollIntoView({ block: "start" });
    });
  });
}

// -------------------- list views --------------------
function renderGrid(items) {
  const placeholder = getPlaceholder();

  return `
    <div class="grid">
      ${items.map((x) => {
        const first =
          Array.isArray(x.images) && x.images.length
            ? resolveImage(x.images[0])
            : placeholder;

        return `
          <article class="card" data-open="${escapeHtml(x.id)}">
            <img class="card__img"
                 src="${placeholder}"
                 data-src="${escapeHtml(first)}"
                 alt="${escapeHtml(x.title)}"
                 loading="lazy" />

            <div class="card__title">${escapeHtml(x.title)}</div>
            <div class="card__meta">
              ${escapeHtml(String(x.year ?? "—"))}
              · ${escapeHtml(x.format ?? "—")}
              · ${escapeHtml(x.packaging ?? "Unknown")}
            </div>
            <div class="card__meta muted">
              ${escapeHtml(x.country ?? "—")}
              · ${escapeHtml(
                x.ean
                  ? `EAN: ${x.ean}`
                  : x.catalog
                  ? `CAT: ${x.catalog}`
                  : "—"
              )}
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderTable(items) {
  const placeholder = getPlaceholder();

  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Year</th>
            <th>Format</th>
            <th>Packaging</th>
            <th>Country</th>
            <th>EAN/Catalog</th>
            <th>Owned</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((x) => {
            const first =
              Array.isArray(x.images) && x.images.length
                ? resolveImage(x.images[0])
                : placeholder;

            return `
              <tr data-open="${escapeHtml(x.id)}" style="cursor:pointer;">
                <td>
                  <img class="thumb"
                       src="${placeholder}"
                       data-src="${escapeHtml(first)}"
                       alt="${escapeHtml(x.title)}"
                       loading="lazy" />
                </td>
                <td>${escapeHtml(x.title)}</td>
                <td>${escapeHtml(String(x.year ?? "—"))}</td>
                <td>${escapeHtml(x.format ?? "—")}</td>
                <td>${escapeHtml(x.packaging ?? "Unknown")}</td>
                <td>${escapeHtml(x.country ?? "—")}</td>
                <td>${escapeHtml(x.ean || x.catalog || "—")}</td>
                <td>${x.owned ? "✓" : "—"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// -------------------- modal open (delegation) --------------------
function bindOpenRelease() {
  const content = document.querySelector("#content");
  if (!content) return;

  // bind once per layout instance
  if (content.dataset.boundOpen === "1") return;
  content.dataset.boundOpen = "1";

  content.addEventListener("click", (e) => {
    const el = e.target.closest("[data-open]");
    if (!el) return;

    const id = el.dataset.open;
    const item = cache.all.find((x) => x.id === id);
    if (!item) return;

    openModal(renderRelease(item));

    // Lazy images inside modal + mount gallery
    const modalRoot = document.querySelector("#modal-root");
    if (modalRoot) {
      initLazyImages(modalRoot);
      mountGallery(item);
    }
  });
}

// -------------------- release details --------------------
function renderRelease(item) {
  const tracks = Array.isArray(item.tracklist) ? item.tracklist : [];
  const images = Array.isArray(item.images) ? item.images : [];
  const placeholder = getPlaceholder();

  const urls = images.length ? images.map(resolveImage) : [placeholder];

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

    <h3>Images</h3>
    <div class="gallery" data-gallery>
      <div class="gallery__main">
        <button class="gallery__btn gallery__btn--prev" type="button" data-g-prev aria-label="Previous image">‹</button>

        <img class="release-img"
             src="${placeholder}"
             data-src="${escapeHtml(urls[0])}"
             alt="${escapeHtml(item.title)}"
             loading="lazy"
             data-g-main />

        <button class="gallery__btn gallery__btn--next" type="button" data-g-next aria-label="Next image">›</button>
      </div>

      <div class="gallery__count" data-g-count>1 / ${urls.length}</div>

      ${urls.length > 1 ? `
        <div class="gallery__thumbs">
          ${urls.map((u, i) => `
            <img class="gallery__thumb ${i === 0 ? "is-active" : ""}"
                 src="${placeholder}"
                 data-src="${escapeHtml(u)}"
                 alt="thumb ${i + 1}"
                 loading="lazy"
                 data-g-thumb="${i}" />
          `).join("")}
        </div>
      ` : ""}
    </div>

    <h3>Tracklist</h3>
    ${tracks.length ? `
      <ol class="tracklist">
        ${tracks.map((t) => `
          <li>
            <span>${escapeHtml(t.title ?? "")}</span>
            <span class="muted">${escapeHtml(t.duration ? t.duration : "—")}</span>
          </li>
        `).join("")}
      </ol>
    ` : `<p class="muted">—</p>`}

    ${item.notes ? `<h3>Notes</h3><p>${escapeHtml(item.notes)}</p>` : ""}
  `;
}

function kv(label, value) {
  if (value == null || value === "") return "";
  return `
    <div class="kv__row">
      <span class="muted">${escapeHtml(label)}</span>
      <span>${escapeHtml(String(value))}</span>
    </div>
  `;
}

// -------------------- gallery mount (6C) --------------------
function mountGallery(item) {
  const modalRoot = document.querySelector("#modal-root");
  if (!modalRoot) return;

  const gallery = modalRoot.querySelector("[data-gallery]");
  if (!gallery) return;

  const placeholder = getPlaceholder();
  const raw = Array.isArray(item.images) ? item.images : [];
  const urls = raw.length ? raw.map(resolveImage) : [placeholder];

  const imgMain = gallery.querySelector("[data-g-main]");
  const btnPrev = gallery.querySelector("[data-g-prev]");
  const btnNext = gallery.querySelector("[data-g-next]");
  const count = gallery.querySelector("[data-g-count]");
  const thumbs = gallery.querySelectorAll("[data-g-thumb]");

  let idx = 0;

  function setIndex(next) {
    if (!urls.length) return;

    idx = (next + urls.length) % urls.length;

    // main image: set directly for instant switching
    imgMain.src = urls[idx];
    imgMain.onerror = () => { imgMain.src = placeholder; };

    if (count) count.textContent = `${idx + 1} / ${urls.length}`;

    thumbs.forEach((t) => {
      t.classList.toggle("is-active", Number(t.dataset.gThumb) === idx);
    });

    if (btnPrev) btnPrev.disabled = urls.length <= 1;
    if (btnNext) btnNext.disabled = urls.length <= 1;
  }

  // Buttons
  btnPrev?.addEventListener("click", () => setIndex(idx - 1));
  btnNext?.addEventListener("click", () => setIndex(idx + 1));

  // Thumbs
  thumbs.forEach((t) => {
    t.addEventListener("click", () => setIndex(Number(t.dataset.gThumb)));
  });

  // Swipe (pointer events)
  let startX = 0;
  let active = false;

  imgMain?.addEventListener("pointerdown", (e) => {
    active = true;
    startX = e.clientX;
    imgMain.setPointerCapture?.(e.pointerId);
  });

  imgMain?.addEventListener("pointerup", (e) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setIndex(idx + 1);
    else setIndex(idx - 1);
  });

  // Keyboard navigation: ← →, Home, End
  const onKey = (e) => {
    // only if modal still open
    const stillOpen = document.querySelector("#modal-root")?.querySelector("[data-gallery]");
    if (!stillOpen) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex(idx - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setIndex(idx + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(urls.length - 1);
    }
  };

  document.addEventListener("keydown", onKey);

  // Auto cleanup keyboard listener when modal closes
  const obs = new MutationObserver(() => {
    // modal closed => modalRoot becomes empty
    if (!document.querySelector("#modal-root")?.firstElementChild) {
      document.removeEventListener("keydown", onKey);
      obs.disconnect();
    }
  });

  obs.observe(modalRoot, { childList: true });

  // Initialize
  setIndex(0);
}

// -------------------- utils --------------------
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}