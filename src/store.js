// src/store.js
//
import { loadBaseData } from "./data.js";

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
  // base + overlay(add/update) - overlay(deleted)
  const byId = new Map(baseItems.map(it => [it.id, it]));

  for (const [id, it] of Object.entries(overlay.itemsById)) {
    byId.set(id, it);
  }
  for (const id of Object.keys(overlay.deleted)) {
    byId.delete(id);
  }

  return Array.from(byId.values());
}

export function addRelease(item) {
  overlay.itemsById[item.id] = item;
  delete overlay.deleted[item.id];
  saveOverlay();
}

export function updateRelease(id, patch) {
  const current = getAll().find(x => x.id === id);
  if (!current) return;
  overlay.itemsById[id] = { ...current, ...patch };
  saveOverlay();
}

export function deleteRelease(id) {
  overlay.deleted[id] = true;
  delete overlay.itemsById[id];
  saveOverlay();
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