// src/ui/backup.js
//
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export function pickJsonFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", async () => {
      try {
        const file = input.files?.[0];
        if (!file) throw new Error("No file selected");

        const text = await file.text();
        const json = JSON.parse(text);

        resolve(json);
      } catch (e) {
        reject(e);
      } finally {
        input.remove();
      }
    }, { once: true });

    input.click();
  });
}