// src/ui/loginPopup.js
import { loginWithPassword } from "../services/auth.js";

export function loginPopup() {
  const root = ensureDialogRoot();
  const previouslyFocused = document.activeElement;

  return new Promise((resolve) => {
    root.innerHTML = render();

    const input = root.querySelector("#login-password");
    const btnOk = root.querySelector("#login-ok");
    const btnCancel = root.querySelector("#login-cancel");
    const errorBox = root.querySelector("#login-error");

    const cleanup = () => {
      root.innerHTML = "";
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };

    const close = (result) => {
      cleanup();
      resolve(result);
    };

    btnOk?.addEventListener("click", submit);
    btnCancel?.addEventListener("click", () => close(false));

    async function submit() {
      const pwd = input.value;
      const ok = loginWithPassword(pwd);

      if (!ok) {
        // показываем ошибку внутри формы
        errorBox.textContent = "Wrong password";
        errorBox.hidden = false;

        input.focus();
        input.select();
        return;
      }

      close(true);
    }

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    }

    document.addEventListener("keydown", onKey);

    input.focus();
  });
}

function render() {
  return `
    <div class="dialog-backdrop">
      <div class="dialog" role="dialog" aria-modal="true" aria-label="Login">
        <div class="dialog__title">Admin login</div>

        <div class="dialog__body">
          <label class="field">
            <span class="field__label">Password</span>
            <input
              id="login-password"
              class="input"
              type="password"
              autocomplete="current-password"
            />
          </label>

          <div id="login-error" class="dialog__error" hidden aria-live="polite"></div>
        </div>

        <div class="dialog__actions">
          <button class="btn" id="login-cancel" type="button">Cancel</button>
          <button class="btn btn--accent" id="login-ok" type="button">Login</button>
        </div>
      </div>
    </div>
  `;
}

function ensureDialogRoot() {
  let root = document.querySelector("#dialog-root");
  if (root) return root;

  root = document.createElement("div");
  root.id = "dialog-root";
  document.body.appendChild(root);
  return root;
}
``