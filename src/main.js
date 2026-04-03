const app = document.querySelector("#app");

function render() {
  const hash = location.hash.replace(/^#\/?/, ""); // "#/albums" -> "albums"

  if (hash === "") {
    app.innerHTML = `
      <h1>Home</h1>
      <p>Добро пожаловать в каталог коллекции Linkin Park.</p>
    `;
    return;
  }

  app.innerHTML = `
    <h1>${hash}</h1>
    <p>Пока пусто. Маршрут: <b>#/${hash}</b></p>
  `;
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);
``