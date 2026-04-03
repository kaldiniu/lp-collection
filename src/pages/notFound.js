export function renderNotFound(route) {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <h1>404</h1>
    <p>Маршрут <b>#/${route}</b> не найден.</p>
  `;
}