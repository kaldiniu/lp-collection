//src/router.js
// 
import { renderHome } from "./pages/home.js";
import { renderList } from "./pages/list.js";
import { renderNotFound } from "./pages/notFound.js";

const routes = {
  "": () => renderHome(),
  "albums": () => renderList("album"),
  "singles": () => renderList("single"),
  "lpu": () => renderList("lpu"),
  "other": () => renderList("other"),
};

function getRoute() {
  return location.hash.replace(/^#\/?/, "").trim(); // "#/albums" -> "albums"
}

export function startRouter() {
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("load", renderRoute);
}

async function renderRoute() {
  const route = getRoute();
  const action = routes[route];

  if (action) {
    await action();
  } else {
    renderNotFound(route);
  }
}