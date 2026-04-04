//src/pages/home.js
//
export function renderHome() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <h1>Home</h1>
    <p>Добро пожаловать в каталог коллекции Linkin Park.</p>
  `;
}