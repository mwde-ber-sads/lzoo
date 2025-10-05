document.addEventListener("DOMContentLoaded", () => {
  const banner = document.createElement("div");
  banner.id = "consentBanner";
  banner.innerHTML = `
    <div class="consent-box">
      <h2>🌍 Interaktiver Globus wird geladen</h2>
      <p>
        Für die Darstellung des Globus werden externe JavaScript-Bibliotheken geladen:
        <a href="https://globe.gl" target="_blank">Globe.GL</a>,
        <a href="https://www.papaparse.com/" target="_blank">PapaParse</a> und
        <a href="https://github.com/Pomax/Font.js" target="_blank">Facetype</a>.
        Diese laden zusätzliche Daten und 3D-Texturen aus dem Internet.
      </p>
      <p>Durch Klick auf „Akzeptieren und laden“ werden diese Ressourcen heruntergeladen und der interaktive Globus gestartet.</p>
      <button id="acceptLoad">✅ Akzeptieren und laden</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById("acceptLoad").addEventListener("click", () => {
    banner.remove();
    loadGlobeScripts();
  });
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
