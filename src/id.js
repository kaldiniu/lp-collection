// src/id.js
//
const COUNTRY = {
  germany: "de",
  australia: "au",
  japan: "jp",
  austria: "at",
  eu: "eu",
  uk: "gb",
  "united kingdom": "gb",
  usa: "us",
  "united states": "us",
};

export function makeId({ title, format, country, ean, catalog, year }) {
  const t = slug(title);
  const f = slug(format);
  const cc = countryCode(country);

  const tailRaw = String(ean || catalog || year || "").trim();

  // ✅ если нет хвоста — генерим уникальный (разрешено по твоему требованию)
  const tail = tailRaw ? slug(tailRaw) : autoTail();

  return `lp-${t}-${f}-${cc}-${tail}`.replace(/-+/g, "-");
}

function autoTail() {
  const a = Date.now().toString(36);
  const b = Math.random().toString(36).slice(2, 7);
  return `${a}-${b}`;
}

function slug(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function countryCode(country) {
  const raw = String(country ?? "").trim();
  if (!raw) return "xx";

  if (/^[a-z]{2}$/i.test(raw)) {
    const c = raw.toLowerCase();
    return c === "uk" ? "gb" : c;
  }

  const key = raw.toLowerCase();
  return COUNTRY[key] ?? slug(raw).slice(0, 2) ?? "xx";
}
