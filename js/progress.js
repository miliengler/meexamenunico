/* ==========================================================
   🟢 Componente reusable: Círculo de progreso (%)
   ========================================================== */
function renderProgressCircle(percent = 0, size = 48, color = "#22c55e") {
  const radius = (size / 2) - 6; // margen interno
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;

  return `
    <div class="progress-ring" title="${percent}% completado" style="width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}">
        <circle class="progress-bg" stroke="#e2e8f0" stroke-width="5" fill="transparent"
                r="${radius}" cx="${size/2}" cy="${size/2}" />
        <circle class="progress-value" stroke="${color}" stroke-width="5" fill="transparent"
                r="${radius}" cx="${size/2}" cy="${size/2}"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${offset}" />
      </svg>
      <div class="progress-text">${percent}%</div>
    </div>
  `;
}
