// src/selectors.js
//
export function selectItems(allItems, params) {
  const {
    type, // "single" | "album" | "lpu" | "other"
    search = "",
    filters = { format: "all", owned: "all" }, // owned: "all"|"true"|"false"
    sort = { field: "title", dir: "asc" },     // field: title|country|year|owned
    page = 1,
    pageSize = 30
  } = params;

  // 1) фильтр по типу страницы
  let items = allItems.filter(x => x.type === type);

  // 2) фильтры
  if (filters.format !== "all") {
    items = items.filter(x => x.format === filters.format);
  }

  if (filters.owned !== "all") {
    const wantOwned = filters.owned === "true";
    items = items.filter(x => Boolean(x.owned) === wantOwned);
  }

  // 3) умный поиск
  // - текстовый режим: игнорируем пробелы/дефисы/точки -> "one-step closer" == "one step closer"
  // - цифровой режим: для ean/catalog оставляем только цифры -> "0936 2449" найдёт "09362449..."
  const qRaw = String(search ?? "").trim();
  const qText = normalizeTextKey(qRaw);
  const qDigits = digitsOnly(qRaw);

  if (qText || qDigits) {
    items = items.filter(x => {
      const titleKey = normalizeTextKey(x.title);

      const catalogDigits = digitsOnly(x.catalog);
      const eanDigits = digitsOnly(x.ean);

      const matchTitle = qText ? titleKey.includes(qText) : false;

      // Чтобы не было слишком много “шума”, ищем по цифрам только если введено >= 4 цифр
      const matchCode =
        (qDigits && qDigits.length >= 4)
          ? (catalogDigits.includes(qDigits) || eanDigits.includes(qDigits))
          : false;

      return matchTitle || matchCode;
    });
  }

  // 4) сортировка
  items = sortItems(items, sort.field, sort.dir);

  // 5) пагинация
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, pages);

  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    items: pageItems,
    total,
    page: safePage,
    pages,
    startIndex: total === 0 ? 0 : start + 1,
    endIndex: start + pageItems.length,
  };
}

/* ---------------- helpers ---------------- */

function normalizeTextKey(s) {
  // Превращаем строку в "ключ" для сравнения:
  // - lower case
  // - trim
  // - удаляем пробелы/дефисы/подчёркивания/точки (чтобы поиск был “умным”)
  // Пример: "One-Step Closer" -> "onestepcloser"
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s\-_.]+/g, "");
}

function digitsOnly(s) {
  // Оставляем только цифры (EAN/Catalog часто удобнее искать так)
  // Пример: "0936 2449-6328" -> "093624496328"
  return String(s ?? "").replace(/\D/g, "");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sortItems(items, field, dir) {
  const mult = dir === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const av = a[field];
    const bv = b[field];

    // null/undefined в конец
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    // owned: false/true -> 0/1
    if (field === "owned") {
      const an = a.owned ? 1 : 0;
      const bn = b.owned ? 1 : 0;
      return (an - bn) * mult;
    }

    // year: числа (если вдруг строка — тоже нормально)
    if (field === "year") {
      const an = Number(av);
      const bn = Number(bv);
      if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * mult;
      return String(av).localeCompare(String(bv)) * mult;
    }

    // country/title/прочее: строки
    if (typeof av === "string" || typeof bv === "string") {
      return String(av).localeCompare(String(bv)) * mult;
    }

    // fallback: числа
    return (Number(av) - Number(bv)) * mult;
  });
}