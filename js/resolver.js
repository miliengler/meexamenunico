/* ==========================================================
   🎯 RESOLVER UNIVERSAL – Motor de preguntas y navegación
   ========================================================== */

let CURRENT = {
  list: [],
  i: 0,
  modo: "",
  config: {},
  session: {}
};

/* ==========================================================
   📊 Estado Interno del Sidebar (Paginación)
   ========================================================== */
const SB_PAGE_SIZE = 60; 
let SB_PAGE = 0;

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function ensureSidebarOnCurrent() {
  const totalPages = Math.max(1, Math.ceil(CURRENT.list.length / SB_PAGE_SIZE));
  const targetPage = Math.floor(CURRENT.i / SB_PAGE_SIZE);
  SB_PAGE = clamp(targetPage, 0, totalPages - 1);
}

function paintSidebarPageInfo() {
  const info = document.getElementById("sbInfo");
  const prev = document.getElementById("sbPrev");
  const next = document.getElementById("sbNext");
  if (!info) return;

  const total = CURRENT.list.length;
  const totalPages = Math.max(1, Math.ceil(total / SB_PAGE_SIZE));
  SB_PAGE = clamp(SB_PAGE, 0, totalPages - 1);
  const start = SB_PAGE * SB_PAGE_SIZE;
  const end = Math.min(total, start + SB_PAGE_SIZE);

  info.textContent = `${start + 1}–${end}`;
  prev.disabled = SB_PAGE === 0;
  next.disabled = SB_PAGE === totalPages - 1;
}

function sbPrevPage() {
  const totalPages = Math.max(1, Math.ceil(CURRENT.list.length / SB_PAGE_SIZE));
  SB_PAGE = clamp(SB_PAGE - 1, 0, totalPages - 1);
  renderPregunta(); 
}

function sbNextPage() {
  const totalPages = Math.max(1, Math.ceil(CURRENT.list.length / SB_PAGE_SIZE));
  SB_PAGE = clamp(SB_PAGE + 1, 0, totalPages - 1);
  renderPregunta();
}

/* ==========================================================
   🚀 Iniciar resolución
   ========================================================== */
function iniciarResolucion(config) {
  if (!config || !Array.isArray(config.preguntas) || !config.preguntas.length) {
    alert("⚠️ No hay preguntas disponibles para resolver.");
    return;
  }

  stopTimer();

  CURRENT = {
    list: config.preguntas.slice(),
    i: 0,
    modo: config.modo || "general",
    config: config,
    session: {}
  };

  SB_PAGE = 0;               
  ensureSidebarOnCurrent();  

  // Timer Opcional
  if (config.usarTimer) {
      initTimer();
  }

  renderPregunta();
}

/* ==========================================================
   🧩 Render Principal
   ========================================================== */
function renderPregunta() {
  const app = document.getElementById("app");
  const q = CURRENT.list[CURRENT.i];

  if (!q) return renderFin();

  window.scrollTo({ top: 0, behavior: "smooth" });

  const total = CURRENT.list.length;
  const numero = CURRENT.i + 1;
  const materiaNombre = getMateriaNombreForQuestion(q);

  const estado = CURRENT.session[q.id] || null;
  const marcada = getRespuestaMarcada(q.id);

  const opciones = getOpcionesArray(q);
  const correctIndex = getCorrectIndex(q, opciones.length);

  // --- NOTAS: Leer si existe ---
  const savedNotes = JSON.parse(localStorage.getItem("mebank_notes") || "{}");
  const currentNote = savedNotes[q.id]; 
  const noteText = currentNote ? currentNote.text : "";
  const hasNote = !!noteText;

  /* ------ OPCIONES ------ */
  const opcionesHTML = opciones.map((op, idx) => {
    let cls = "q-option";
    // Colorear si ya respondió
    if (estado) {
      if (correctIndex != null && idx === correctIndex) cls += " option-correct";
      else if (marcada === idx && estado === "bad") cls += " option-wrong";
    }
    return `
      <label class="${cls}" onclick="answer(${idx})">
        <span class="q-option-letter">${String.fromCharCode(97 + idx)})</span>
        <span class="q-option-text">${op}</span>
      </label>
    `;
  }).join("");

  /* ------ HTML ESTRUCTURA ------ */
  app.innerHTML = `
    <div class="q-layout fade">

      <div class="q-main">
        <div class="q-card">

          <div class="q-header">
            <div class="q-title">
              <b>${CURRENT.config.titulo || "Resolución"}</b>
              <span class="q-counter">${numero}/${total}</span>
            </div>
            <div class="q-meta">
              <span class="q-materia">${materiaNombre || ""}</span>
            </div>
          </div>

          <div class="q-enunciado">${q.enunciado || ""}</div>

          ${q.imagenes && q.imagenes.length ? renderImagenesPregunta(q.imagenes) : ""}

          <div class="q-options">
            ${opcionesHTML || `<p style="color:#94a3b8;font-size:14px;">(Sin opciones)</p>`}
          </div>
          
          ${estado && q.explicacion ? `
            <div class="q-explanation" style="margin-top:15px; padding:10px; background:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; font-size:14px; color:#14532d;">
               <b>Explicación:</b> ${q.explicacion}
            </div>
          ` : ""}

          <div style="margin-top:20px; border-top:1px dashed #e2e8f0; padding-top:10px;">
             <button class="btn-small" 
                     style="background:${hasNote ? '#fefce8' : 'white'}; border-color:${hasNote ? '#facc15' : '#e2e8f0'}; color:${hasNote ? '#854d0e' : '#64748b'};"
                     onclick="toggleNoteArea('${q.id}')">
                ${hasNote ? '📝 Ver/Editar mi nota' : '➕ Agregar nota personal'}
             </button>

             <div id="note-area-${q.id}" style="display:none; margin-top:10px;">
                <textarea id="note-text-${q.id}" 
                          placeholder="Escribí tu apunte acá..."
                          style="width:100%; height:80px; padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:14px; resize:vertical;">${noteText}</textarea>
                <div style="margin-top:6px; text-align:right;">
                   <button class="btn-small" style="background:#3b82f6; color:white; border:none;" 
                           onclick="saveNoteResolver('${q.id}')">💾 Guardar nota</button>
                </div>
             </div>
          </div>

          <div class="q-nav-row" style="margin-top:25px;">
            <button class="btn-small" onclick="prevQuestion()" ${CURRENT.i === 0 ? "disabled" : ""}>⬅ Anterior</button>
            <button class="btn-small" onclick="nextQuestion()">${CURRENT.i === total - 1 ? "Finalizar ➜" : "Siguiente ➡"}</button>
            <button class="btn-small btn-ghost" onclick="salirResolucion()">🏠 Salir</button>
          </div>
        </div>
      </div>

      <aside class="q-sidebar">
        <div class="q-sidebar-header"><b>Navegación</b></div>
        <div class="q-sidebar-pager">
          <button class="btn-small" id="sbPrev" onclick="sbPrevPage()">◀</button>
          <div class="q-sidebar-pageinfo" id="sbInfo">...</div>
          <button class="btn-small" id="sbNext" onclick="sbNextPage()">▶</button>
        </div>
        <div class="q-sidebar-grid" id="sbGrid">
          ${renderSidebarCells()}
        </div>
      </aside>

    </div>
  `;

  paintSidebarPageInfo();
}

/* ==========================================================
   🧠 Responder
   ========================================================== */
function answer(idx) {
  const q = CURRENT.list[CURRENT.i];
  if (!q) return;

  // Si ya respondió en esta sesión, no hacer nada
  if (CURRENT.session[q.id]) return;

  const opciones = getOpcionesArray(q);
  const correctIndex = getCorrectIndex(q, opciones.length);

  const esCorrecta = (correctIndex != null) ? (idx === correctIndex) : false;
  const estado = esCorrecta ? "ok" : "bad";

  // 1. Guardar en Sesión
  CURRENT.session[q.id] = estado;
  setRespuestaMarcada(q.id, idx);

  // 2. Guardar en Progreso Global (PROG)
  const mat = q.materia || "otras";
  if (typeof PROG !== 'undefined') {
      if (!PROG[mat]) PROG[mat] = {};
      PROG[mat][q.id] = { status: estado, fecha: Date.now() };
      if (window.saveProgress) window.saveProgress();
  }

  // 3. Stats Diarios
  if (esCorrecta) {
    const hoy = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem("mebank_stats_daily") || "{}");
    stats[hoy] = (stats[hoy] || 0) + 1;
    localStorage.setItem("mebank_stats_daily", JSON.stringify(stats));
  }

  // 4. Actualizar vista
  renderPregunta();
}

/* ==========================================================
   ⏭ Navegación
   ========================================================== */
function nextQuestion() {
  if (CURRENT.i < CURRENT.list.length - 1) {
    CURRENT.i++;
    ensureSidebarOnCurrent();
    renderPregunta();
  } else {
    renderFin();
  }
}

function prevQuestion() {
  if (CURRENT.i > 0) {
    CURRENT.i--;
    ensureSidebarOnCurrent();
    renderPregunta();
  }
}

function irAPregunta(idx) {
  if (idx < 0 || idx >= CURRENT.list.length) return;
  CURRENT.i = idx;
  renderPregunta();
}

/* ==========================================================
   📊 Sidebar Cells
   ========================================================== */
function renderSidebarCells() {
  const total = CURRENT.list.length;
  const start = SB_PAGE * SB_PAGE_SIZE;
  const end = Math.min(total, start + SB_PAGE_SIZE);

  const out = [];
  for (let idx = start; idx < end; idx++) {
    const q = CURRENT.list[idx];
    const estado = CURRENT.session[q.id];
    const esActual = idx === CURRENT.i;

    let cls = "sb-cell";
    if (esActual) cls += " sb-active";
    if (estado === "ok") cls += " sb-ok";
    if (estado === "bad") cls += " sb-bad";

    out.push(`<div class="${cls}" onclick="irAPregunta(${idx})">${idx + 1}</div>`);
  }
  return out.join("");
}

/* ==========================================================
   🏁 Finalizar
   ========================================================== */
function renderFin() {
  stopTimer();
  const total = CURRENT.list.length;
  const values = Object.values(CURRENT.session);
  const ok = values.filter(v => v === "ok").length;
  const bad = values.filter(v => v === "bad").length;
  const sinResp = total - ok - bad;

  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="card fade" style="max-width:520px;margin:auto;text-align:center;">
      <h2>${CURRENT.config.titulo || "Finalizado"}</h2>
      
      <div style="font-size:16px; margin: 20px 0;">
          <p>Preguntas totales: <b>${total}</b></p>
          <p style="color:#16a34a;">✔ Correctas: ${ok}</p>
          <p style="color:#ef4444;">✖ Incorrectas: ${bad}</p>
          <p style="color:#64748b;">⚪ Sin responder: ${sinResp}</p>
      </div>

      <div style="margin-top:20px;display:flex;justify-content:center;gap:10px;">
        <button class="btn-main" onclick="renderHome()">🏠 Volver al inicio</button>
      </div>
    </div>
  `;
}

function salirResolucion() {
  if (!confirm("¿Seguro que querés salir? Se perderá el progreso de esta sesión.")) return;
  stopTimer();
  renderHome();
}

/* ==========================================================
   🕒 Timer (Estilo Glass / Horas / CSS Class)
   ========================================================== */
let TIMER = { interval: null, start: 0 };

function initTimer() {
  stopTimer();
  TIMER.start = Date.now();
  
  let el = document.getElementById("exam-timer");
  if (!el) {
    el = document.createElement("div");
    el.id = "exam-timer";
    el.className = "exam-timer"; // Usa la clase CSS nueva
    document.body.appendChild(el);
  }
  
  el.textContent = "⏱ 00:00";

  TIMER.interval = setInterval(() => {
    const totalSeconds = Math.floor((Date.now() - TIMER.start) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    
    // Muestra horas solo si hace falta
    const texto = (h > 0) ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
    
    const box = document.getElementById("exam-timer");
    if (box) box.textContent = "⏱ " + texto;
  }, 1000);
}

function stopTimer() {
  if (TIMER.interval) clearInterval(TIMER.interval);
  TIMER.interval = null;
  const el = document.getElementById("exam-timer");
  if (el) el.remove();
}

/* ==========================================================
   🔧 Helpers & Imágenes
   ========================================================== */
const RESP_MARCADAS = {};
function setRespuestaMarcada(id, idx) { RESP_MARCADAS[id] = idx; }
function getRespuestaMarcada(id) { return RESP_MARCADAS[id] ?? null; }

function getOpcionesArray(q) {
  if (Array.isArray(q.opciones)) return q.opciones;
  if (q.opciones && typeof q.opciones === 'object') {
      return ["a","b","c","d","e"].map(k => q.opciones[k]).filter(v=>v);
  }
  return [];
}

function getCorrectIndex(q, len) {
  if (typeof q.correcta === 'number') return q.correcta;
  if (typeof q.correcta === 'string') {
      const map = {a:0, b:1, c:2, d:3, e:4};
      const idx = map[q.correcta.trim().toLowerCase()];
      return (idx != null && idx < len) ? idx : null;
  }
  return null;
}

function getMateriaNombreForQuestion(q) {
  if (!q || !q.materia) return "";
  if (typeof BANK !== 'undefined' && BANK.subjects) {
    const mat = BANK.subjects.find(s => s.slug === q.materia);
    return mat ? mat.name : q.materia;
  }
  return q.materia;
}

function renderImagenesPregunta(imgs) {
  if (!Array.isArray(imgs) || !imgs.length) return "";
  return `
    <div class="q-images">
      ${imgs.map(src => `<div class="q-image-wrap"><img class="q-image" src="${src}"></div>`).join("")}
    </div>
  `;
}
