//src/listState.js
// 
const KEY_PREFIX = "lp_list_state_";

const DEFAULT_STATE = {
  search: "",
  filters: { format: "all", owned: "all" },  // owned: all | true | false (строками)
  sort: { field: "title", dir: "asc" },      // field: title|country|year|owned
  page: 1,
  pageSize: 32
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
    (state.search ?? "") === DEFAULT_STATE.search &&
    (state.page ?? DEFAULT_STATE.page) === DEFAULT_STATE.page &&
    (state.pageSize ?? DEFAULT_STATE.pageSize) === DEFAULT_STATE.pageSize &&
    (state.filters?.format ?? DEFAULT_STATE.filters.format) === DEFAULT_STATE.filters.format &&
    (state.filters?.owned ?? DEFAULT_STATE.filters.owned) === DEFAULT_STATE.filters.owned &&
    (state.sort?.field ?? DEFAULT_STATE.sort.field) === DEFAULT_STATE.sort.field &&
    (state.sort?.dir ?? DEFAULT_STATE.sort.dir) === DEFAULT_STATE.sort.dir
  );
}