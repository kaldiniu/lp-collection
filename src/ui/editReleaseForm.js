// src/ui/editReleaseForm.js
//
export function renderEditReleaseForm(item) {
  const images = Array.isArray(item.images) ? item.images.join("\n") : "";
  const tracklist = Array.isArray(item.tracklist)
    ? item.tracklist
        .map((t) => (t.duration ? `${t.title} | ${t.duration}` : `${t.title}`))
        .join("\n")
    : "";

  return `
    <h2>Edit release</h2>
    <p class="muted small">ID (read-only): <b>${escapeHtml(item.id)}</b></p>

    <form id="edit-release-form" class="form">
      <div class="form__grid">
        <label class="field">
          <span class="field__label">Title *</span>
          <input class="input" name="title" required value="${escapeHtml(item.title ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Year</span>
          <input class="input" name="year" type="number" min="1900" max="2100"
                 value="${escapeHtml(item.year ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Format *</span>
          <input class="input" name="format" required value="${escapeHtml(item.format ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Packaging</span>
          <input class="input" name="packaging" value="${escapeHtml(item.packaging ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Era</span>
          <input class="input" name="era" value="${escapeHtml(item.era ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Country</span>
          <input class="input" name="country" value="${escapeHtml(item.country ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">Catalog</span>
          <input class="input" name="catalog" value="${escapeHtml(item.catalog ?? "")}" />
        </label>

        <label class="field">
          <span class="field__label">EAN</span>
          <input class="input" name="ean" value="${escapeHtml(item.ean ?? "")}" />
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
  const format = String(fd.get("format") ?? "").trim();
  const packaging = String(fd.get("packaging") ?? "").trim();
  const era = String(fd.get("era") ?? "").trim();
  const country = String(fd.get("country") ?? "").trim();
  const catalog = String(fd.get("catalog") ?? "").trim();
  const ean = String(fd.get("ean") ?? "").trim();
  const notes = String(fd.get("notes") ?? "").trim();

  const yearRaw = String(fd.get("year") ?? "").trim();
  const year = yearRaw ? Number(yearRaw) : null;

  const owned = String(fd.get("owned")) === "true";

  if (!title) throw new Error("Title is required");
  if (!format) throw new Error("Format is required");

  const images = parseLines(String(fd.get("images") ?? ""));
  const tracklist = parseTracklist(String(fd.get("tracklist") ?? ""));

  return {
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