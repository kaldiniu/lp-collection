// src/constants/country.js

// Канон: храним НАЗВАНИЯ (как ты выбрал), но UK — именно "UK"
export const COUNTRIES = [
  "Germany",
  "Australia",
  "Japan",
  "Austria",
  "Taiwan",
  "Brazil",
  "EU",
  "UK",
  "US",
  "Unknown",
];

// Алиасы -> канон (lower-case)
const MAP = {
  // Germany
  "de": "Germany",
  "ger": "Germany",
  "germany": "Germany",
  "deutschland": "Germany",

  // Australia
  "au": "Australia",
  "australia": "Australia",

  // Japan
  "jp": "Japan",
  "ja": "Japan",
  "japan": "Japan",

  // Taiwan
  "tw": "Taiwan",
  "taiwan": "Taiwan",

  // Austria
  "at": "Austria",
  "austria": "Austria",

  // Brazil
  "br": "Brazil",
  "brazil": "Brazil",

  // EU
  "eu": "EU",
  "europe": "EU",

  // UK
  "uk": "UK",
  "gb": "UK",
  "united kingdom": "UK",
  "great britain": "UK",
  "england": "UK",
  "scotland": "UK",
  "wales": "UK",
  "northern ireland": "UK",

  // US
  "us": "US",
  "usa": "US",
  "u.s.a.": "US",
  "united states": "US",
  "united states of america": "US",
};

export function normalizeCountry(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Unknown";

  // Если 2 буквы (DE/AU/JP/AT/UK/GB/US/EU) — считаем кодом/сокращением
  if (/^[a-z]{2}$/i.test(raw)) {
    const key = raw.toLowerCase();
    return MAP[key] ?? "Unknown";
  }

  const key = raw.toLowerCase();
  return MAP[key] ?? "Unknown";
}