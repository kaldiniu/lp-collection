// src/ui/dialogs.js

const DEFAULTS = {
  title: "Message",
  confirmText: "OK",
  cancelText: "Cancel",
  danger: false,
  closeOnBackdrop: false, // строго: только кнопки
};

export function confirmPopup(message, options = {}) {
  const opts = { ...DEFAULTS, ...options, closeOnBackdrop: false };
  const root = ensureDialogRoot();
  const previouslyFocused = document.activeElement;

  return new Promise((resolve) => {
    root.innerHTML = renderConfirm(opts.title, message, opts);

    const backdrop = root.querySelector(".dialog-backdrop");
    const btnOk = root.querySelector("#dlg-ok");
    const btnCancel = root.querySelector("#dlg-cancel");
    const focusables = [btnCancel, btnOk].filter(Boolean);

    const cleanup = () => {
      root.innerHTML = "";
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };

    const close = (result) => {
      cleanup();
      resolve(result);
    };

    // клик по фону НЕ закрывает (по твоему требованию)
    if (opts.closeOnBackdrop) {
      backdrop?.addEventListener("click", (e) => {
        if (e.target === backdrop) close(false);
      });
    }

    btnOk?.addEventListener("click", () => close(true));
    btnCancel?.addEventListener("click", () => close(false));

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key === "Tab") trapTab(e, focusables);
    }

    document.addEventListener("keydown", onKey);

    // безопаснее фокус на Cancel
    btnCancel?.focus();
  });
}

export function alertPopup(message, options = {}) {
  const opts = { ...DEFAULTS, ...options, closeOnBackdrop: false };
  const root = ensureDialogRoot();
  const previouslyFocused = document.activeElement;

  return new Promise((resolve) => {
    root.innerHTML = renderAlert(opts.title, message, opts);

    const btnOk = root.querySelector("#dlg-ok");
    const focusables = [btnOk].filter(Boolean);

    const cleanup = () => {
      root.innerHTML = "";
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };

    const close = () => {
      cleanup();
      resolve();
    };

    btnOk?.addEventListener("click", close);

    function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab") trapTab(e, focusables);
    }

    document.addEventListener("keydown", onKey);

    btnOk?.focus();
  });
}

/* ---------- render helpers ---------- */

function renderConfirm(title, message, opts) {
  return `
    <div class="dialog-backdrop">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="dialog__title">${escapeHtml(title)}</div>
        <div class="dialog__body">${renderMessage(message)}</div>
        <div class="dialog__actions">
          <button class="btn" id="dlg-cancel" type="button">${escapeHtml(opts.cancelText)}</button>
          <button class="btn ${opts.danger ? "btn--danger" : "btn--accent"}" id="dlg-ok" type="button">
            ${escapeHtml(opts.confirmText)}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderAlert(title, message, opts) {
  return `
    <div class="dialog-backdrop">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
        <div class="dialog__title">${escapeHtml(title)}</div>
        <div class="dialog__body">${renderMessage(message)}</div>
        <div class="dialog__actions">
          <button class="btn ${opts.danger ? "btn--danger" : "btn--accent"}" id="dlg-ok" type="button">
            ${escapeHtml(opts.confirmText)}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderMessage(message) {
  if (Array.isArray(message)) {
    return message.map((line) => `<p class="dialog__p">${escapeHtml(line)}</p>`).join("");
  }
  return `<p class="dialog__p">${escapeHtml(String(message ?? ""))}</p>`;
}

function ensureDialogRoot() {
  let root = document.querySelector("#dialog-root");
  if (root) return root;

  root = document.createElement("div");
  root.id = "dialog-root";
  document.body.appendChild(root);
  return root;
}

function trapTab(e, focusables) {
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}