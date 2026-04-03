export function renderList(type) {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <h1>${type.toUpperCase()}</h1>
    <p>Здесь будет список релизов типа: <b>${type}</b>.</p>
  `;
}