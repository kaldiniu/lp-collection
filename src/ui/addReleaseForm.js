// src/ui/addReleaseForm.js
import { makeId } from "../id.js";
import { normalizeRelease } from "../normalize.js";
import { FORMATS } from "../constants/format.js";
import { PACKAGING } from "../constants/packaging.js";
import { COUNTRIES } from "../constants/country.js";

export function renderAddReleaseForm(currentType) {
  return `
    <h2>Add ${escapeHtml(currentType)} release</h2>
    <p class="muted small">Type fixed: <b>${escapeHtml(currentType)}</b></p>

    <form id="add-release-form" class="form">
      <div class="form__grid">
        <label class="field">
          <span class="field__label">Title *</span>
          <input class="input" name="title" required />
        </label>

        <label class="field">
          <span class="field__label">Year</span>
          <input class="input" name="year" type="number" min="1900" max="2100" />
        </label>

        <label class="field">
          <span class="field__label">Format *</span>
          <select class="select" name="format" required>
            ${FORMATS.map(f => `<option value="${escapeAttr(f)}">${escapeHtml(f)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Packaging</span>
          <select class="select" name="packaging">
            ${PACKAGING.map(p => `<option value="${escapeAttr(p)}">${escapeHtml(p)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Era</span>
          <input class="input" name="era" />
        </label>

        <label class="field">
          <span class="field__label">Country</span>
          <select class="select" name="country">
            ${COUNTRIES.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Catalog</span>
          <input class="input" name="catalog" />
        </label>

        <label class="field">
          <span class="field__label">EAN</span>
          <input class="input" name="ean" />
        </label>

        <label class="field">
          <span class="field__label">Owned</span>
          <select class="select" name="owned">
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </label>
      </div>

      <label class="field">
        <span class="field__label">Images (one per line: file.jpg or https://...)</span>
        <textarea class="textarea" name="images" rows="4"></textarea>
      </label>

      <label class="field">
        <span class="field__label">Tracklist (one per line: Title | mm:ss)</span>
        <textarea class="textarea" name="tracklist" rows="6"></textarea>
      </label>

      <label class="field">
        <span class="field__label">Notes</span>
        <textarea class="textarea" name="notes" rows="4"></textarea>
      </label>

      <div class="form__actions">
        <button class="btn btn--accent" type="submit">Save</button>
      </div>
    </form>
  `;
}

export function readAddReleaseForm(form, currentType) {
  const fd = new FormData(form);

  const title = String(fd.get("title") ?? "").trim();
  const yearRaw = String(fd.get("year") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : null;

  const format = String(fd.get("format") ?? "").trim();
  const packaging = String(fd.get("packaging") ?? "").trim();
  const era = String(fd.get("era") ?? "").trim();
  const country = String(fd.get("country") ?? "").trim();

  const catalog = String(fd.get("catalog") ?? "").trim();
  const ean = String(fd.get("ean") ?? "").trim();
  const owned = String(fd.get("owned")) === "true";

  const images = parseLines(String(fd.get("images") ?? ""));
  const tracklist = parseTracklist(String(fd.get("tracklist") ?? ""));
  const notes = String(fd.get("notes") ?? "").trim();

  if (!title) throw new Error("Title is required");

  const id = makeId({ title, format, country, ean, catalog, year });

  return normalizeRelease({
    id,
    title,
    type: currentType, // fixed by section
    year,
    format,
    packaging,
    era,
    country,
    catalog,
    ean,
    owned,
    images,
    tracklist,
    notes,
  });
}

function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseTracklist(text) {
  const lines = parseLines(text);
  return lines.map((line) => {
    const [left, right] = line.split("|").map((x) => x?.trim());
    const title = left ?? "";
    const duration =
      right && /^\d{1,3}:[0-5]\d$/.test(right) ? right : undefined;
    return duration ? { title, duration } : { title };
  });
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

// Для value="" внутри option лучше экранировать ещё и кавычки
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}