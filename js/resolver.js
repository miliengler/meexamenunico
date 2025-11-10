/* ==========================================================
   🎯 RESOLVER UNIVERSAL – Motor de preguntas y navegación
   Basado en el diseño del modo examen, adaptable a todos los modos
   ========================================================== */

let CURRENT = { list: [], i: 0, modo: "", session: {}, config: {} };

/**
 * Inicia la resolución de un set de preguntas con interfaz moderna.
 * @param {Object} config
 * @param {string} config.modo - tipo de sesión ("examen", "choice", "anteriores", etc.)
 * @param {Array} config.preguntas - lista de preguntas
 * @param {boolean} [config.usarTimer=false] - activa cronómetro
 * @param {boolean} [config.mostrarNotas=true] - activa área de notas
 * @param {boolean} [config.permitirRetroceso=true] - activa botón "Anterior"
 * @param {string} [config.titulo="Resolución"] - título visible
 */
function iniciarResolucion(config) {
  if (!config || !config.preguntas || !config.preguntas.length) {
    alert("⚠️ No hay preguntas disponibles para resolver.");
    renderHome();
    return;
  }

  CURRENT = {
    modo: config.modo || "general",
    list: config.preguntas,
    i: 0,
    session: {},
    config
  };

  if (config.usarTimer) initTimer("app");
  renderPreguntaUniversal();
}

/* ---------- Render de pregunta ---------- */
function renderPreguntaUniversal() {
  const q = CURRENT.list[CURRENT.i];
  if (!q) {
    renderFinUniversal();
    return;
  }

  const { config } = CURRENT;

  // 🕒 Cronómetro flotante
  if (config.usarTimer && !document.getElementById("exam-timer")) {
    const timerEl = document.createElement("div");
    timerEl.id = "exam-timer";
    timerEl.style = `
      position:fixed;
      top:12px;
      right:12px;
      background:#1e3a8a;
      color:white;
      font-weight:600;
      font-size:14px;
      padding:8px 12px;
      border-radius:8px;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);
      z-index:90;
    `;
    timerEl.textContent = "⏱️ 00:00";
    document.body.appendChild(timerEl);
  }

  const opts = q.opciones.map((t, i) => `
    <label class="option" onclick="answerUniversal(${i})">
      <input type="radio" name="opt"> ${String.fromCharCode(97 + i)}) ${t}
    </label>`).join("");

  app.innerHTML = `
    <div class="q-layout">
      <div class="q-card fade">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <b>${config.titulo || "Resolución"}</b>
          <span class="small">${CURRENT.i + 1}/${CURRENT.list.length} · ${q.materia?.toUpperCase() || ""}</span>
        </div>
        <div class="enunciado">${q.enunciado}</div>
        <div class="options">${opts}</div>

        <div class="nav-row">
          <button class="btn-small" onclick="prevUniversal()" 
            ${!config.permitirRetroceso || CURRENT.i === 0 ? "disabled" : ""}>⬅️ Anterior</button>
          <button class="btn-small" onclick="nextUniversal()" 
            ${CURRENT.i === CURRENT.list.length - 1 ? "disabled" : ""}>Siguiente ➡️</button>
          <button class="btn-small" style="background:#64748b;border-color:#64748b"
            onclick="stopTimer(); if(confirm('¿Salir?')) renderHome()">🏠 Salir</button>
        </div>
      </div>
    </div>
  `;

  // Sidebar
  if (!document.getElementById("exam-sidebar")) initSidebar();
  else renderSidebarPage();

  // Notas (opcional)
  if (config.mostrarNotas) {
    const noteArea = document.getElementById("noteText");
    if (noteArea) {
      noteArea.value = CURRENT.session[`nota_${CURRENT.i}`] || "";
      noteArea.oninput = (e) => {
        CURRENT.session[`nota_${CURRENT.i}`] = e.target.value;
      };
    }
  }
}

/* ---------- Registrar respuesta ---------- */
function answerUniversal(i) {
  const q = CURRENT.list[CURRENT.i];
  if (!q) return;

  const correcta = i === q.correcta;
  CURRENT.session[q.id] = correcta ? "ok" : "bad";

  const options = document.querySelectorAll(".option");
  options.forEach((opt, idx) => {
    if (idx === q.correcta) opt.classList.add("correct");
    else if (idx === i) opt.classList.add("wrong");
    opt.style.pointerEvents = "none";
  });

  setTimeout(() => nextUniversal(), 1000);
}

/* ---------- Navegación ---------- */
function nextUniversal() {
  if (CURRENT.i < CURRENT.list.length - 1) {
    CURRENT.i++;
    renderPreguntaUniversal();
  } else {
    renderFinUniversal();
  }
}

function prevUniversal() {
  if (CURRENT.config.permitirRetroceso && CURRENT.i > 0) {
    CURRENT.i--;
    renderPreguntaUniversal();
  }
}

/* ---------- Fin del modo ---------- */
function renderFinUniversal() {
  stopTimer();
  const timerEl = document.getElementById("exam-timer");
  if (timerEl) timerEl.remove();

  const total = CURRENT.list.length;
  const correctas = Object.values(CURRENT.session).filter(v => v === "ok").length;
  const incorrectas = Object.values(CURRENT.session).filter(v => v === "bad").length;
  const porc = total ? Math.round((correctas / total) * 100) : 0;
  const tiempo = TIMER.elapsed ? formatTime(TIMER.elapsed) : null;

  app.innerHTML = `
    <div class="card fade" style="text-align:center;">
      <h2>${CURRENT.config.titulo || "Resolución completada"}</h2>
      <p>Preguntas totales: <b>${total}</b></p>
      <p style="color:#16a34a;">✔ Correctas: ${correctas}</p>
      <p style="color:#ef4444;">✖ Incorrectas: ${incorrectas}</p>
      <p><b>Precisión:</b> ${porc}%</p>
      ${tiempo ? `<p><b>⏱️ Tiempo total:</b> ${tiempo}</p>` : ""}
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-main" onclick="renderHome()">🏠 Volver al inicio</button>
      </div>
    </div>
  `;
}
