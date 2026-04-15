// src/constants/packaging.js

export const PACKAGING = [
  "Unknown",

  // CD / DVD / BD
  "Jewel Case",
  "Slim Jewel Case",
  "J-Card Case (7mm)",
  "Digipak",
  "Cardboard Sleeve",
  "PVC Sleeve",
  "Amaray Case",
  "Slipcase",
  "Box",

  // Vinyl
  "Single Sleeve",
  "Gatefold",
  "Trifold",

  // Cassette (если понадобится)
  "J-Card",
];

// Алиасы -> канон (ключи в lower-case)
export const PACKAGING_ALIASES = {
  "": "Unknown",
  "unknown": "Unknown",

  // Maxi CD / Maxibox / 7mm -> J-Card Case (7mm)
  "maxibox": "J-Card Case (7mm)",
  "maxi box": "J-Card Case (7mm)",
  "maxi cd case": "J-Card Case (7mm)",
  "maxi single box": "J-Card Case (7mm)",
  "j-card case": "J-Card Case (7mm)",
  "j card case": "J-Card Case (7mm)",
  "7mm": "J-Card Case (7mm)",
  "7 mm": "J-Card Case (7mm)",

  // cardsleeve
  "cardsleeve": "Cardboard Sleeve",
  "card sleeve": "Cardboard Sleeve",
  "cardboard sleeve": "Cardboard Sleeve",

  // jewel variants
  "jewelcase": "Jewel Case",
  "jewel": "Jewel Case",
  "slimcase": "Slim Jewel Case",
  "slim jewel": "Slim Jewel Case",

  // misc
  "dvd case": "Keep Case",
  "keepcase": "Keep Case",
  "steel book": "Steelbook",
};

export function normalizePackaging(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Unknown";

  const key = raw.toLowerCase();
  const mapped = PACKAGING_ALIASES[key] ?? raw;

  if (PACKAGING.includes(mapped)) return mapped;
  return "Unknown";
}