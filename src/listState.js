//src/listState.js
// 
const KEY_PREFIX = "lp_list_state_";

const DEFAULT_STATE = {
  search: "",
  filters: { format: "all", owned: "all" },  // owned: all | true | false (строками)
  sort: { field: "title", dir: "asc" },      // field: title|country|year|owned
  page: 1,
  pageSize: 12
};

export function loadListState(type) {
  const key = KEY_PREFIX + type;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);

    // лёгкая защита от битых данных
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      filters: { ...DEFAULT_STATE.filters, ...(parsed.filters ?? {}) },
      sort: { ...DEFAULT_STATE.sort, ...(parsed.sort ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveListState(type, state) {
  const key = KEY_PREFIX + type;
  localStorage.setItem(key, JSON.stringify(state));
}

export function resetListState(type) {
  saveListState(type, structuredClone(DEFAULT_STATE));
  return structuredClone(DEFAULT_STATE);
}

export function isDefaultState(state) {
  return (
    (state.search ?? "") === "" &&
    (state.page ?? 1) === 1 &&
    (state.filters?.format ?? "all") === "all" &&
    (state.filters?.owned ?? "all") === "all" &&
    (state.sort?.field ?? "title") === "title" &&
    (state.sort?.dir ?? "asc") === "asc"
  );
}