/* ==========================================================
   🧩 CHOICE POR MATERIA — Orden A–Z / Progreso (sin efectos)
   Compatible con iniciarResolucion() y normalizeString()
   ========================================================== */

// usar el normalizador global si existe; si no, defino uno local
const _normalizeChoice = typeof normalizeString === "function"
  ? normalizeString
  : (str) =>
      str
        ? str.normalize("NFD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase().trim()
        : "";

// estado de orden (persistente)
let currentChoiceSort = localStorage.getItem("choiceSort") || "az";

/* ---------- Render principal ---------- */
function renderChoicePorMateria() {
  let subs = subjectsFromBank();

  // total de preguntas por materia
  const resumen = (BANK.questions || []).reduce((acc, q) => {
    const key = _normalizeChoice(q.materia);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // progreso
  const pctBySlug = {};
  subs.forEach((s) => {
    const key = _normalizeChoice(s.slug);
    const total = resumen[key] || 0;
    const prog = PROG[key] || {};
    const vals = Object.entries(prog).filter(
      ([k, v]) => !k.startsWith("_") && v && typeof v === "object"
    );
    const ok = vals.filter(([, v]) => v.status === "ok").length;
    pctBySlug[key] = total ? ok / total : 0;
  });

  // orden
  if (currentChoiceSort === "az") {
    const cleanName = (str) =>
      str
        ? str
            .normalize("NFD")
            .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "")
            .trim()
            .toLowerCase()
        : "";

    subs = subs
      .slice()
      .sort((a, b) =>
        cleanName(a.name).localeCompare(cleanName(b.name), "es", {
          sensitivity: "base",
        })
      );
  } else if (currentChoiceSort === "progress") {
    subs = subs
      .slice()
      .sort((a, b) => {
        const ka = _normalizeChoice(a.slug);
        const kb = _normalizeChoice(b.slug);
        const pa = pctBySlug[ka] || 0;
        const pb = pctBySlug[kb] || 0;
        if (pb === pa)
          return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        return pb - pa;
      });
  }

  // construir lista
  const list = subs
    .map((s) => {
      const key = _normalizeChoice(s.slug);
      const total = resumen[key] || 0;

      const prog = PROG[key] || {};
      const answered = Object.entries(prog).filter(([k]) => !k.startsWith("_"));
      const ok = answered.filter(([, v]) => v?.status === "ok").length;
      const pct = total ? Math.round((ok / total) * 100) : 0;

      const progressCircle =
        typeof renderProgressCircle === "function"
          ? renderProgressCircle(pct)
          : `<span style="font-size:12px;color:#64748b">${pct}%</span>`;

      const lastIndex = answered.length ? answered.length : null;

      return `
        <div class="choice-item" onclick="toggleChoiceMateria('${s.slug}', ${total})">
          <div class="choice-top">
            <span class="choice-title">${s.name}</span>
            ${progressCircle}
          </div>

          <div id="choice-body-${s.slug}" class="choice-body" style="display:none;">
            <p class="choice-count">
              <strong style="color:#64748b;font-size:13px;">
                ${total} preguntas cargadas
              </strong>
            </p>

            <div class="choice-row" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <label style="font-size:14px;">Desde #</label>
              <input 
                type="number" 
                id="start-${s.slug}" 
                value="1" 
                min="1" 
                max="${total || 1}"
                style="width:70px;padding:4px 6px;border:1px solid var(--line);
                       border-radius:6px;text-align:center;background:#fff;">
              <div class="choice-buttons" style="margin-top:0;">
                <button class="btn-practica" onclick="startChoice('${s.slug}', event)">Práctica</button>
                <button class="btn-repaso" onclick="startRepaso('${s.slug}', event)">Repaso</button>
                ${
                  lastIndex
                    ? `<button class="btn-repaso" onclick="resumeChoice('${s.slug}', event)">Reanudar (${lastIndex})</button>`
                    : ""
                }
                <button class="btn-notas" onclick="openNotas('${s.slug}', event)">Notas</button>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");

  app.innerHTML = `
    <div class="choice-container fade">
      <div class="choice-header-global">
        <span>🧩</span>
        <h2>Practicá por materia</h2>

        <div class="sort-control" style="margin-left:auto;">
          <label for="sort-choice">Ordenar:</label>
          <select id="sort-choice">
            <option value="az" ${
              currentChoiceSort === "az" ? "selected" : ""
            }>A–Z</option>
            <option value="progress" ${
              currentChoiceSort === "progress" ? "selected" : ""
            }>Por progreso</option>
          </select>
        </div>
      </div>

      <p class="choice-subtitle">Elegí una materia para comenzar tu práctica.</p>
      <div id="choice-list">${list}</div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn-small" onclick="renderHome()">⬅️ Volver</button>
      </div>
    </div>
  `;

  const sel = document.getElementById("sort-choice");
  if (sel) {
    sel.onchange = (e) => {
      currentChoiceSort = e.target.value;
      localStorage.setItem("choiceSort", currentChoiceSort);
      renderChoicePorMateria();
    };
  }
}

/* ---------- Toggle materia ---------- */
function toggleChoiceMateria(slug, total) {
  document.querySelectorAll(".choice-body").forEach((el) => {
    if (el.id !== `choice-body-${slug}`) el.style.display = "none";
  });
  const body = document.getElementById(`choice-body-${slug}`);
  if (!body) return;
  body.style.display = body.style.display === "block" ? "none" : "block";

  const input = document.getElementById(`start-${slug}`);
  if (input) input.max = total;
}

/* ---------- Acciones ---------- */
function startChoice(slug, e) {
  e.stopPropagation();
  const input = document.getElementById(`start-${slug}`);
  const desde = parseInt(input?.value || "1", 10);

  const pool = (BANK.questions || []).filter(
    (q) => _normalizeChoice(q.materia) === _normalizeChoice(slug)
  );
  const list = pool.slice(desde - 1);
  if (!list.length) return alert("No hay preguntas disponibles.");

  iniciarResolucion({
    modo: "choice",
    preguntas: list,
    usarTimer: true,
    mostrarNotas: true,
    permitirRetroceso: true,
    titulo: `🧩 ${slug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
  });
}

function startRepaso(slug, e) {
  e.stopPropagation();
  const key = _normalizeChoice(slug);
  const prog = PROG[key] || {};
  const incorrectas = Object.entries(prog)
    .filter(([id, data]) => !id.startsWith("_") && data && data.status === "bad")
    .map(([id]) => id);

  const pool = (BANK.questions || []).filter((q) => incorrectas.includes(q.id));
  if (!pool.length) return alert("No tenés incorrectas para repasar.");

  iniciarResolucion({
    modo: "repaso",
    preguntas: pool,
    usarTimer: true,
    mostrarNotas: true,
    permitirRetroceso: true,
    titulo: `🧩 Repaso de ${slug}`,
  });
}

function resumeChoice(slug, e) {
  e.stopPropagation();
  const key = _normalizeChoice(slug);
  const prog = PROG[key] || {};
  const answered = Object.keys(prog).filter((k) => !k.startsWith("_"));
  const resumeIndex = answered.length;

  const pool = (BANK.questions || []).filter(
    (q) => _normalizeChoice(q.materia) === key
  );
  if (!pool.length) return alert("No hay preguntas disponibles.");

  iniciarResolucion({
    modo: "choice",
    preguntas: pool,
    usarTimer: true,
    mostrarNotas: true,
    permitirRetroceso: true,
    titulo: `🧩 ${slug.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
  });
}

function openNotas(slug, e) {
  e.stopPropagation();
  alert(`📘 Abrir notas de ${slug}`);
}

/* ---------- Exponer al scope global ---------- */
window.renderChoicePorMateria = renderChoicePorMateria;
