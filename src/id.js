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
  const tail = String(ean || catalog || year || "").trim();
  const tailSlug = slug(tail);
  return `lp-${t}-${f}-${cc}-${tailSlug}`.replace(/-+/g, "-");
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