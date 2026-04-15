// src/ui/editReleaseForm.js
import { normalizeReleasePatch } from "../normalize.js";
import { FORMATS } from "../constants/format.js";
import { PACKAGING } from "../constants/packaging.js";
import { COUNTRIES } from "../constants/country.js";

export function renderEditReleaseForm(item) {
  const images = Array.isArray(item.images) ? item.images.join("\n") : "";
  const tracklist = Array.isArray(item.tracklist)
    ? item.tracklist
        .map((t) => (t.duration ? `${t.title} | ${t.duration}` : `${t.title}`))
        .join("\n")
    : "";

  const fmt = FORMATS.includes(item.format) ? item.format : "Other";
  const pkg = PACKAGING.includes(item.packaging) ? item.packaging : "Unknown";
  const ctry = COUNTRIES.includes(item.country) ? item.country : "Unknown";

  return `
    <h2>Edit release</h2>
    <p class="muted small">ID (read-only): <b>${escapeHtml(item.id)}</b></p>

    <form id="edit-release-form" class="form">
      <div class="form__grid">
        <label class="field">
          <span class="field__label">Title *</span>
          <input class="input" name="title" required value="${escapeAttr(item.title ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Year</span>
          <input class="input" name="year" type="number" min="1900" max="2100"
                 value="${escapeAttr(item.year ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Format *</span>
          <select class="select" name="format" required>
            ${FORMATS.map(f => `<option value="${escapeAttr(f)}" ${fmt === f ? "selected" : ""}>${escapeHtml(f)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Packaging</span>
          <select class="select" name="packaging">
            ${PACKAGING.map(p => `<option value="${escapeAttr(p)}" ${pkg === p ? "selected" : ""}>${escapeHtml(p)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Era</span>
          <input class="input" name="era" value="${escapeAttr(item.era ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Country</span>
          <select class="select" name="country">
            ${COUNTRIES.map(c => `<option value="${escapeAttr(c)}" ${ctry === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
          </select>
        </label>

        <label class="field">
          <span class="field__label">Catalog</span>
          <input class="input" name="catalog" value="${escapeAttr(item.catalog ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">EAN</span>
          <input class="input" name="ean" value="${escapeAttr(item.ean ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Owned</span>
          <select class="select" name="owned">
            <option value="true" ${item.owned ? "selected" : ""}>true</option>
            <option value="false" ${!item.owned ? "selected" : ""}>false</option>
          </select>
        </label>
      </div>

      <label class="field">
        <span class="field__label">Images (one per line: file.jpg or https://...)</span>
        <textarea class="textarea" name="images" rows="4">${escapeHtml(images)}</textarea>
      </label>

      <label class="field">
        <span class="field__label">Tracklist (one per line: Title | mm:ss)</span>
        <textarea class="textarea" name="tracklist" rows="6">${escapeHtml(tracklist)}</textarea>
      </label>

      <label class="field">
        <span class="field__label">Notes</span>
        <textarea class="textarea" name="notes" rows="4">${escapeHtml(item.notes ?? "")}</textarea>
      </label>

      <div class="form__actions">
        <button class="btn btn--accent" type="submit">Save</button>
      </div>
    </form>
  `;
}

export function readEditReleaseForm(form) {
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

  // patch: только поля, которые мы редактируем
  const patch = {
    title,
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
  };

  return normalizeReleasePatch(patch);
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

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}