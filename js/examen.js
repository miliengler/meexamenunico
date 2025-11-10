/* ==========================================================
   🧠 MODO EXAMEN – Configuración y conexión con resolver.js
   ========================================================== */

const normalize = str =>
  str ? str.normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase().trim() : "";

/* ---------- Render del configurador ---------- */
function renderExamenSetup() {
  const subs = subjectsFromBank().sort((a, b) =>
    a.name.replace(/[^\p{L}\p{N} ]/gu, "").localeCompare(
      b.name.replace(/[^\p{L}\p{N} ]/gu, ""), "es", { sensitivity: "base" }
    )
  );

  const resumen = BANK.questions.reduce((acc, q) => {
    const key = normalize(q.materia);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const counts = subs.map(s => {
    const key = normalize(s.slug);
    const total = resumen[key] || 0;
    return { ...s, total };
  });

  const totalAll = counts.reduce((a, b) => a + b.total, 0);

  const checks = counts.map(s => `
    <label class="chk-mat" style="display:block;margin:4px 0;">
      <input type="checkbox" class="mat-check" value="${s.slug}" data-count="${s.total}" ${s.total ? "checked" : ""}>
      ${s.name} <span style="color:var(--muted)">(${s.total})</span>
    </label>`).join("");

  app.innerHTML = `
    <div class="card" style="max-width:700px;margin:auto;">
      <h2>🧠 Modo Examen – Creá el tuyo</h2>
      <p>Tenés <b>${totalAll}</b> preguntas disponibles en total.</p>

      <div id="matList">${checks || "<p class='small'>No hay materias cargadas.</p>"}</div>

      <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <label for="numPreg" class="small">Número de preguntas:</label>
          <input id="numPreg" type="number" min="1" value="${totalAll}" max="${totalAll}" style="width:80px;">
        </div>

        <div style="display:flex;align-items:center;gap:6px;">
          <input type="checkbox" id="chkTimer">
          <label for="chkTimer" style="font-size:14px;">⏱️ Activar cronómetro</label>
        </div>
      </div>

      <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
        <button class="btn-main" onclick="startExamen()">🎯 Comenzar examen</button>
        <button class="btn-small" onclick="renderHome()">⬅️ Volver al inicio</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".mat-check").forEach(chk => {
    chk.addEventListener("change", updateExamenCount);
  });
}

/* ---------- Actualiza contador ---------- */
function updateExamenCount() {
  const chks = Array.from(document.querySelectorAll(".mat-check"));
  const total = chks.filter(c => c.checked)
                    .reduce((a, c) => a + parseInt(c.dataset.count || 0), 0);
  const numInput = document.getElementById("numPreg");
  if (numInput && !numInput._manual) {
    numInput.value = Math.max(1, total || 1);
    numInput.max = Math.max(1, total || 1);
  }
}
document.addEventListener("input", e => {
  if (e.target && e.target.id === "numPreg") e.target._manual = true;
});

/* ---------- Inicia examen ---------- */
function startExamen() {
  const chks = Array.from(document.querySelectorAll(".mat-check"));
  const selected = chks.filter(c => c.checked).map(c => c.value);
  const numEl = document.getElementById("numPreg");
  const num = Math.max(1, parseInt(numEl?.value || "1", 10));
  const useTimer = document.getElementById("chkTimer")?.checked;

  const selectedNorm = selected.map(s => normalize(s));
  let pool = (BANK.questions || []).filter(q => selectedNorm.includes(normalize(q.materia)));

  if (pool.length === 0) {
    alert("Seleccioná al menos una materia con preguntas.");
    return;
  }

  pool.sort(() => Math.random() - 0.5);
  const chosen = pool.slice(0, Math.min(num, pool.length));

  // ✅ Llama al motor universal de resolución
  iniciarResolucion({
    modo: "examen",
    preguntas: chosen,
    usarTimer: useTimer,
    mostrarNotas: true,
    permitirRetroceso: true,
    titulo: "🧠 Modo Examen",
  });
}
