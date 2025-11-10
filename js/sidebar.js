/* ==========================================================
   📊 ÍNDICE DE PREGUNTAS – Modo examen, choice y anteriores
   Estilo moderno con soporte para paginación y notas
   ========================================================== */

let sidebarPage = 0;
const PAGE_SIZE = 50;

/* ---------- Inicialización ---------- */
function initSidebar() {
  if (!CURRENT || !CURRENT.list) {
    console.warn("🔸 Sidebar: no hay examen activo todavía.");
    return;
  }

  if (document.getElementById("exam-sidebar")) return;

  // === Crear sidebar ===
  const sidebar = document.createElement("div");
  sidebar.id = "exam-sidebar";
  sidebar.style = `
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 220px;
    background: #fff;
    border-left: 1px solid var(--line);
    box-shadow: -4px 0 20px rgba(15,23,42,.08);
    border-radius: 16px 0 0 16px;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 80;
    transition: right 0.3s ease;
  `;

  sidebar.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <b style="font-size:15px;">Índice</b>
      <button id="closeSidebar" style="border:none;background:none;font-size:16px;cursor:pointer;color:var(--muted)">✖</button>
    </div>

    <div id="sidebar-progress" style="font-size:13px;color:var(--muted);">
      Progreso: 0 de 0 (0%)
    </div>

    <div id="sidebar-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;"></div>

    <div id="sidebar-pagination" style="display:flex;justify-content:space-between;align-items:center;">
      <button id="prevPage" class="btn-mini" disabled>⬅️</button>
      <span id="pageInfo" style="font-size:13px;color:var(--muted)">1</span>
      <button id="nextPage" class="btn-mini">➡️</button>
    </div>

    <div id="sidebar-notes" style="margin-top:10px;font-size:13px;">
      <b style="font-size:13px;">📝 Nota personal</b>
      <textarea id="noteText" placeholder="Escribí algo..." style="width:100%;margin-top:4px;border:1px solid var(--line);border-radius:8px;padding:6px;font-family:inherit;resize:none;height:50px;"></textarea>
    </div>
  `;

  document.body.appendChild(sidebar);

  // === Botón flotante ===
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "openSidebarBtn";
  toggleBtn.innerHTML = "📋";
  toggleBtn.title = "Mostrar índice";
  toggleBtn.style = `
    position: fixed;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    z-index: 81;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    display: none;
  `;
  toggleBtn.onclick = showSidebar;
  document.body.appendChild(toggleBtn);

  // === Listeners ===
  document.getElementById("closeSidebar").onclick = hideSidebar;
  document.getElementById("prevPage").onclick = prevSidebarPage;
  document.getElementById("nextPage").onclick = nextSidebarPage;

  // ✅ Ajustar layout principal para dejar espacio
  adjustMainPadding(true);

  renderSidebarPage();
}

/* ---------- Render de página ---------- */
function renderSidebarPage() {
  const total = CURRENT?.list?.length || 0;
  const start = sidebarPage * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const grid = document.getElementById("sidebar-grid");
  if (!grid) return;

  grid.innerHTML = "";

  for (let i = start; i < end; i++) {
    const btn = document.createElement("div");
    btn.textContent = i + 1;
    btn.className = "sidebar-cell";
    btn.style = `
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--soft);
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    `;

    const state = CURRENT?.session?.[i];
    if (i === CURRENT.i) {
      btn.style.border = "2px solid var(--brand)";
      btn.style.background = "#e0e7ff";
    } else if (state === "ok") {
      btn.style.background = "#dcfce7";
      btn.style.border = "1px solid #22c55e";
    } else if (state === "bad") {
      btn.style.background = "#fee2e2";
      btn.style.border = "1px solid #ef4444";
    }

    btn.onclick = () => {
      CURRENT.i = i;
      renderExamenPregunta();
      renderSidebarPage();
    };

    grid.appendChild(btn);
  }

  const correctas = Object.values(CURRENT.session || {}).filter(v => v === "ok").length;
  const respondidas = Object.keys(CURRENT.session || {}).length;
  const progreso = document.getElementById("sidebar-progress");
  if (progreso)
    progreso.textContent = `Progreso: ${respondidas} de ${total} (${Math.round((respondidas / total) * 100)}%)`;

  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");
  const totalPages = Math.ceil(total / PAGE_SIZE);
  prevBtn.disabled = sidebarPage === 0;
  nextBtn.disabled = sidebarPage >= totalPages - 1;
  pageInfo.textContent = `${sidebarPage + 1}/${totalPages}`;
}

/* ---------- Navegación ---------- */
function nextSidebarPage() {
  const total = CURRENT?.list?.length || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (sidebarPage < totalPages - 1) {
    sidebarPage++;
    renderSidebarPage();
  }
}
function prevSidebarPage() {
  if (sidebarPage > 0) {
    sidebarPage--;
    renderSidebarPage();
  }
}

/* ---------- Mostrar / ocultar ---------- */
function hideSidebar() {
  const sidebar = document.getElementById("exam-sidebar");
  const toggleBtn = document.getElementById("openSidebarBtn");
  if (!sidebar || !toggleBtn) return;
  sidebar.style.right = "-230px";
  toggleBtn.style.display = "block";
  adjustMainPadding(false);
}

function showSidebar() {
  const sidebar = document.getElementById("exam-sidebar");
  const toggleBtn = document.getElementById("openSidebarBtn");
  if (!sidebar || !toggleBtn) return;
  sidebar.style.right = "0";
  toggleBtn.style.display = "none";
  adjustMainPadding(true);
}

/* ---------- Ajuste del contenido principal ---------- */
function adjustMainPadding(open) {
  const app = document.getElementById("app");
  if (!app) return;
  app.style.transition = "padding-right 0.3s ease";
  app.style.paddingRight = open ? "240px" : "0";
}
