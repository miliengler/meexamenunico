/* ==========================================================
   📄 EXÁMENES ANTERIORES — Lista expandida (2016–2025)
   Estilo igual a Choice por materia
   ========================================================== */

let currentExamSort = localStorage.getItem("examSort") || "desc";

/* ---------- Render principal ---------- */
function renderExamenesLista() {
  const examenes = [];
  for (let year = 2025; year >= 2016; year--) {
    examenes.push({
      slug: `examen_unico_${year}`,
      name: `Examen Único ${year}`,
    });
  }

  // Ordenar según configuración
  examenes.sort((a, b) => {
    const ay = parseInt(a.name.match(/\d+/)?.[0] || "0");
    const by = parseInt(b.name.match(/\d+/)?.[0] || "0");
    return currentExamSort === "asc" ? ay - by : by - ay;
  });

  // Construir lista expandible (igual que choice)
  const list = examenes.map(ex => {
    const pool = (BANK.questions || []).filter(q => q.examen === ex.slug);
    const total = pool.length;

    return `
      <div class="choice-item" onclick="toggleExam('${ex.slug}')">
        <div class="choice-top">
          <span class="choice-title">${ex.name}</span>
          <span style="font-size:13px;color:#64748b;">
            ${total ? `${total} preguntas` : "sin preguntas cargadas"}
          </span>
        </div>

        <div id="exam-body-${ex.slug}" class="choice-body" style="display:none;">
          ${
            total
              ? `
              <div class="choice-row" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <button class="btn-practica" onclick="abrirExamen('${ex.slug}', event)">Iniciar examen</button>
                <button class="btn-notas" onclick="alert('📘 Notas del ${ex.name}')">Notas</button>
              </div>`
              : `<p style="color:#64748b;font-size:13px;">⚠️ Aún no se cargaron las preguntas de este examen.</p>`
          }
        </div>
      </div>`;
  }).join("");

  app.innerHTML = `
    <div class="choice-container fade">
      <div class="choice-header-global">
        <span>📄</span>
        <h2>Exámenes anteriores</h2>

        <div class="sort-control" style="margin-left:auto;">
          <label for="sort-exam">Ordenar:</label>
          <select id="sort-exam">
            <option value="desc" ${currentExamSort === "desc" ? "selected" : ""}>Más recientes</option>
            <option value="asc" ${currentExamSort === "asc" ? "selected" : ""}>Más antiguos</option>
          </select>
        </div>
      </div>

      <p class="choice-subtitle">Seleccioná un examen para practicar o revisar.</p>
      <div id="exam-list">${list}</div>

      <div style="text-align:center;margin-top:20px;">
        <button class="btn-small" onclick="renderHome()">⬅️ Volver</button>
      </div>
    </div>
  `;

  const sel = document.getElementById("sort-exam");
  if (sel) {
    sel.onchange = (e) => {
      currentExamSort = e.target.value;
      localStorage.setItem("examSort", currentExamSort);
      renderExamenesLista();
    };
  }
}

/* ---------- Mostrar/ocultar examen ---------- */
function toggleExam(slug) {
  document.querySelectorAll(".choice-body").forEach(el => {
    if (el.id !== `exam-body-${slug}`) el.style.display = "none";
  });
  const body = document.getElementById(`exam-body-${slug}`);
  if (body) body.style.display = body.style.display === "block" ? "none" : "block";
}

/* ---------- Abrir examen ---------- */
function abrirExamen(slug, event) {
  event.stopPropagation();
  const pool = (BANK.questions || []).filter(q => q.examen === slug);
  if (!pool.length) return alert("⚠️ Aún no hay preguntas cargadas para este examen.");

  CURRENT = { list: pool, i: 0, materia: slug, modo: "anteriores" };
  iniciarResolucion({
    modo: "anteriores",
    preguntas: pool,
    usarTimer: true,
    mostrarNotas: true,
    permitirRetroceso: true,
    titulo: `🧾 ${slug.replace(/_/g, " ").toUpperCase()}`
  });
}

/* ---------- Exportar ---------- */
window.renderExamenesLista = renderExamenesLista;
