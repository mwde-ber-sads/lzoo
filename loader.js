document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.id = "consentBanner";
  document.body.appendChild(banner);

  // Добавляем слушатель только после того, как баннер вставлен в DOM:
  const acceptButton = banner.querySelector("#acceptLoad");
  if (acceptButton) {
    acceptButton.addEventListener("click", () => {
      banner.remove();
      loadGlobeScripts();
    });
  }
});

function loadGlobeScripts() {
  const scripts = [
    "https://cdn.jsdelivr.net/npm/globe.gl",
    "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js",
    "https://unpkg.com/facetype",
    "./globescript.js"
  ];

  scripts.forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    document.body.appendChild(s);
  });
}
