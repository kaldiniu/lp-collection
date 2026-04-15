// src/constants/format.js

export const FORMATS = [
  "CD",
  "DVD",
  "Cassette",
  "Vinyl 7 inch",
  "Vinyl 10 inch",
  "Vinyl 12 inch",  
  "DVD-A",
  "CD + DVD",
  "CD + VCD",
  "CD + VHS",
  "Blu-ray",
  "VHS",
  "Box Set",
  "Other",
];

const MAP = {
  "cd": "CD",
  "compact disc": "CD",

  "vinyl": "Vinyl",
  "lp": "Vinyl",

  "cassette": "Cassette",
  "tape": "Cassette",

  "dvd": "DVD",
  "bluray": "Blu-ray",
  "blu-ray": "Blu-ray",

  "sacd": "SACD",

  "digital": "Digital",

  "vhs": "VHS",

  "box": "Box Set",
  "box set": "Box Set",
};

export function normalizeFormat(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Other";

  const key = raw.toLowerCase();
  const mapped = MAP[key] ?? raw;

  // строгий режим: если не из списка — Other
  return FORMATS.includes(mapped) ? mapped : "Other";
}
