// src/ui/modal.js
//
export function openModal(html) {
  const root = getModalRoot();
  root.innerHTML = `
    <div class="modal-backdrop" data-close>
      <div class="modal" role="dialog" aria-modal="true">
        <button class="btn modal__close" type="button" data-close aria-label="Close">✕</button>
        <div class="modal__content">${html}</div>
      </div>
    </div>
  `;

  // закрытие по клику на фон или на кнопку
  root.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", (e) => {
      // закрываем только если кликнули по backdrop или по кнопке
      if (e.target === el) closeModal();
      if (el.matches("button")) closeModal();
    });
  });

  document.addEventListener("keydown", onEsc);
}

export function closeModal() {
  const root = document.querySelector("#modal-root");
  if (root) root.innerHTML = "";
  document.removeEventListener("keydown", onEsc);
}

function onEsc(e) {
  if (e.key === "Escape") closeModal();
}

function getModalRoot() {
  const existing = document.querySelector("#modal-root");
  if (existing) return existing;

  const div = document.createElement("div");
  div.id = "modal-root";
  document.body.appendChild(div);
  return div;
}
