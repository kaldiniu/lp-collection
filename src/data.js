//src/data.js
// 
export async function loadBaseData() {
  const res = await fetch("./assets/data/base.json", { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load base.json: ${res.status} ${res.statusText}`);
  }
  return res.json();
}