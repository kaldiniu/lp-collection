// src/normalize.js
import { normalizePackaging } from "./constants/packaging.js";
import { normalizeCountry } from "./constants/country.js";
import { normalizeFormat } from "./constants/format.js";

/**
 * Нормализация полного релиза (для Add/Import и для сохранения целиком).
 */
export function normalizeRelease(item) {
  const x = { ...item };

  // обязательные текстовые поля
  x.id = String(x.id ?? "").trim();
  x.type = String(x.type ?? "").trim();
  x.title = String(x.title ?? "").trim();

  // справочники
  x.format = normalizeFormat(x.format);
  x.packaging = normalizePackaging(x.packaging);
  x.country = normalizeCountry(x.country);

  // числа/булевы
  x.year = normalizeYear(x.year);
  x.owned = Boolean(x.owned);

  // прочие строки
  x.era = String(x.era ?? "").trim();
  x.catalog = String(x.catalog ?? "").trim();
  x.ean = String(x.ean ?? "").trim();
  x.notes = String(x.notes ?? "").trim();

  // images: массив строк
  x.images = normalizeImages(x.images);

  // tracklist: массив {title, duration?}
  x.tracklist = normalizeTracklist(x.tracklist);

  return x;
}

/**
 * Нормализация patch-объекта (для Update), чтобы не затирать отсутствующие поля дефолтами.
 * Нормализуем только то, что реально присутствует в patch.
 */
export function normalizeReleasePatch(patch) {
  const p = { ...patch };

  if ("title" in p) p.title = String(p.title ?? "").trim();
  if ("type" in p) p.type = String(p.type ?? "").trim();
  if ("format" in p) p.format = normalizeFormat(p.format);
  if ("packaging" in p) p.packaging = normalizePackaging(p.packaging);
  if ("country" in p) p.country = normalizeCountry(p.country);

  if ("year" in p) p.year = normalizeYear(p.year);
  if ("owned" in p) p.owned = Boolean(p.owned);

  if ("era" in p) p.era = String(p.era ?? "").trim();
  if ("catalog" in p) p.catalog = String(p.catalog ?? "").trim();
  if ("ean" in p) p.ean = String(p.ean ?? "").trim();
  if ("notes" in p) p.notes = String(p.notes ?? "").trim();

  if ("images" in p) p.images = normalizeImages(p.images);
  if ("tracklist" in p) p.tracklist = normalizeTracklist(p.tracklist);

  return p;
}

function normalizeYear(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
}

function normalizeTracklist(tracklist) {
  if (!Array.isArray(tracklist)) return [];

  return tracklist
    .map((t) => {
      const title = String(t?.title ?? "").trim();
      const durationRaw = t?.duration == null ? "" : String(t.duration).trim();
      const duration = durationRaw && /^\d{1,3}:[0-5]\d$/.test(durationRaw) ? durationRaw : undefined;

      return duration ? { title, duration } : { title };
    })
    .filter((t) => t.title);
}