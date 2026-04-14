// src/ui/images.js

const PLACEHOLDER = "./assets/img/placeholder.svg";
const LOCAL_BASE = "./assets/img/";

export function getPlaceholder() {
  return PLACEHOLDER;
}

/**
 * Превращает значение из JSON в реальный URL для <img>.
 * Поддерживает:
 *  - "file.jpg"  -> "./assets/img/file.jpg"
 *  - "assets/img/file.jpg" -> "./assets/img/file.jpg" (на всякий случай)
 *  - "https://..." -> 그대로
 */
export function resolveImage(src) {
  const s = String(src ?? "").trim();
  if (!s) return PLACEHOLDER;

  // внешний URL
  if (/^https?:\/\//i.test(s)) return s;

  // если вдруг уже полный локальный путь (на будущее) — поддержим
  if (s.startsWith("assets/")) return `./${s}`;

  // основной случай: только имя файла
  return LOCAL_BASE + s;
}

/** Fallback: если картинка не загрузилась — показываем placeholder */
export function attachImgFallback(img) {
  if (!img) return;
  img.addEventListener(
    "error",
    () => {
      img.src = PLACEHOLDER;
    },
    { once: true }
  );
}

/**
 * Lazy loading: работает с ....
 * Когда img в зоне видимости — подставляем src.
 */
export function initLazyImages(root = document) {
  const imgs = root.querySelectorAll("img[data-src]");
  if (!imgs.length) return;

  if (!("IntersectionObserver" in window)) {
    imgs.forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      attachImgFallback(img);
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        attachImgFallback(img);
        io.unobserve(img);
      }
    },
    { rootMargin: "200px" }
  );

  imgs.forEach((img) => io.observe(img));
}