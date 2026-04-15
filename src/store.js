// src/store.js
//
import { loadBaseData } from "./data.js";
import { isAuthed } from "./services/auth.js";

const LS_KEY = "lp_data_overlay_v1";

let ready = false;
let baseItems = [];
let overlay = loadOverlay();

export async function initStore() {
  if (ready) return;
  const data = await loadBaseData();
  baseItems = data.items ?? [];
  ready = true;
}

export function getAll() {
  const byId = new Map(baseItems.map((it) => [it.id, it]));

  // apply added/updated
  for (const [id, it] of Object.entries(overlay.itemsById)) {
    byId.set(id, it);
  }

  // apply deleted
  for (const id of Object.keys(overlay.deleted)) {
    byId.delete(id);
  }

  return Array.from(byId.values());
}

export function addRelease(item) {
  if (!isAuthed()) throw new Error("Not authorized");

  const ids = new Set(getAll().map((x) => x.id));
  item.id = ensureUniqueId(item.id, ids);

  overlay.itemsById[item.id] = item;
  delete overlay.deleted[item.id];
  saveOverlay();
}

export function updateRelease(id, patch) {
  if (!isAuthed()) throw new Error("Not authorized");

  const current = getAll().find((x) => x.id === id);
  if (!current) return;

  overlay.itemsById[id] = { ...current, ...patch };
  saveOverlay();
}

export function deleteRelease(id) {
  if (!isAuthed()) throw new Error("Not authorized");

  overlay.deleted[id] = true;
  delete overlay.itemsById[id];
  saveOverlay();
}

// ---------------- helpers ----------------

function ensureUniqueId(id, existingIds) {
  if (!existingIds.has(id)) return id;

  let i = 2;
  while (existingIds.has(`${id}-${String(i).padStart(3, "0")}`)) i++;
  return `${id}-${String(i).padStart(3, "0")}`;
}

function loadOverlay() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { itemsById: {}, deleted: {} };
    const parsed = JSON.parse(raw);
    return {
      itemsById: parsed.itemsById ?? {},
      deleted: parsed.deleted ?? {},
    };
  } catch {
    return { itemsById: {}, deleted: {} };
  }
}

function saveOverlay() {
  localStorage.setItem(LS_KEY, JSON.stringify(overlay));
}

export function exportData() {
  return {
    meta: {
      app: "lp-collection",
      version: 1,
      exportedAt: new Date().toISOString(),
    },
    items: getAll(),
  };
}

export function importData(payload, { mode = "merge" } = {}) {
  if (!isAuthed()) throw new Error("Not authorized");
  if (!payload || !Array.isArray(payload.items)) throw new Error("Invalid file");

  const incoming = payload.items;

  if (mode === "replace") {
    // optional: полная замена overlay
    overlay = { itemsById: {}, deleted: {} };
  }

  // ✅ MERGE (overwrite): импортируемый объект полностью заменяет существующий
  for (const it of incoming) {
    if (!it || !it.id) continue;

    overlay.itemsById[it.id] = it;     // overwrite целиком
    delete overlay.deleted[it.id];     // если было удалено — вернуть
  }

  saveOverlay();
}

export function resetOverlay() {
  if (!isAuthed()) throw new Error("Not authorized");

  // очистка overlay в памяти
  overlay = { itemsById: {}, deleted: {} };

  // очистка overlay в localStorage
  localStorage.removeItem(LS_KEY);
}