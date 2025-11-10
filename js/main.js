/* ==========================================================
   🧩 MAIN.JS – NAVEGACIÓN PRINCIPAL Y HOME
   Versión unificada (main + ui + carga de bancos)
   ========================================================== */

/* ---------- Inicio automático ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  window.app = document.getElementById("app");

  // 🔹 Cargar todos los bancos al iniciar
  console.log("⏳ Cargando bancos...");
  await loadAllBanks();
  console.log(`✅ Bancos cargados: ${BANK.questions.length} preguntas totales`);

  // 🔹 Render inicial
  if (typeof renderHome === "function") renderHome();
});

/* ==========================================================
   📦 CARGA GLOBAL DE TODOS LOS BANCOS
   (materias + exámenes anteriores)
   ========================================================== */

window.BANK = { questions: [] };

async function loadAllBanks() {
  try {
    const folders = [
      "/bancos/pediatria/",
      "/bancos/obstetricia/",
      "/bancos/ginecologia/",
      "/bancos/medicinafamiliar/",
      "/bancos/medicinainterna/",
      "/bancos/cirugiageneral/",
      "/bancos/saludpublica/",
      "/bancos/psiquiatria/",
      "/bancos/cardiologia/",
      "/bancos/otras/",
      "/bancos/anteriores/"
    ];

    let all = [];

    for (const folder of folders) {
      try {
        const res = await fetch(folder);
        if (!res.ok) continue;

        const text = await res.text();
        const matches = text.match(/href="([^"]+\.json)"/g);
        if (!matches) continue;

        for (const m of matches) {
          const file = m.match(/href="([^"]+)"/)[1];
          const url = folder + file;

          try {
            const json = await fetch(url).then(r => r.json());
            if (Array.isArray(json)) {
              all.push(...json);
            } else if (Array.isArray(json.questions)) {
              all.push(...json.questions);
            }
          } catch (err) {
            console.warn("⚠️ Error al leer JSON:", url, err);
          }
        }
      } catch (err) {
        console.warn("⚠️ Error al leer carpeta:", folder, err);
      }
    }

    window.BANK.questions = all;
  } catch (error) {
    console.error("❌ Error general al cargar bancos:", error);
  }
}

/* ==========================================================
   🏠 HOME – Pantalla principal
   ========================================================== */
function renderHome() {
  app.innerHTML = `
    <div class="home-menu fade" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;">
      <button class="btn-main btn-blue" onclick="renderChoice()">🧩 Choice por materia</button>
      <button class="btn-main btn-blue" onclick="renderExamenes()">📄 Exámenes anteriores</button>
      <button class="btn-main btn-blue" onclick="renderExamenSetup()">🧠 Modo Examen – Creá el tuyo</button>
      <button class="btn-main btn-blue" onclick="renderStatsGlobal()">📊 Estadísticas generales</button>
      <button class="btn-main btn-blue" onclick="renderNotas()">📔 Mis notas</button>
      <hr class="divider">
      <button class="btn-small btn-grey" onclick="manualBankReload()">🔄 Actualizar bancos</button>
      <button class="btn-small btn-grey" onclick="forceReloadBank()">♻️ Recarga completa</button>
    </div>
  `;
}

/* ==========================================================
   🔹 PLACEHOLDERS DE NAVEGACIÓN
   ========================================================== */

// 🧩 Choice por materia
function renderChoice() {
  if (typeof renderChoicePorMateria === "function") {
    renderChoicePorMateria();
  } else {
    mostrarModuloFaltante("🧩 Choice por materia", "choice.js");
  }
}

// 📄 Exámenes anteriores
function renderExamenes() {
  if (typeof renderExamenesLista === "function") {
    renderExamenesLista();
  } else {
    mostrarModuloFaltante("📄 Exámenes anteriores", "examenes.js");
  }
}

// 🧠 Modo Examen – Creá el tuyo
function renderExamenSetup() {
  if (typeof renderExamenSetupMain === "function") {
    renderExamenSetupMain();
  } else {
    mostrarModuloFaltante("🧠 Modo Examen", "examen_setup.js");
  }
}

// 📊 Estadísticas generales
function renderStatsGlobal() {
  if (typeof renderStats === "function") {
    renderStats();
  } else {
    mostrarModuloFaltante("📊 Estadísticas generales", "stats.js");
  }
}

// 📔 Mis notas
function renderNotas() {
  if (typeof renderNotasMain === "function") {
    renderNotasMain();
  } else {
    mostrarModuloFaltante("📔 Mis notas", "notas.js");
  }
}

/* ==========================================================
   🔧 Función auxiliar para módulos no cargados
   ========================================================== */
function mostrarModuloFaltante(titulo, archivo) {
  console.warn(`⚠️ Módulo faltante: ${archivo}`);
  app.innerHTML = `
    <div class="card fade" style="text-align:center;">
      <h2>${titulo}</h2>
      <p>El módulo aún no está disponible o no se pudo cargar.</p>
      <p class="small">Verificá que el archivo <code>${archivo}</code> exista en la carpeta <code>js/</code>.</p>
      <button class="btn-small" onclick="renderHome()">⬅️ Volver</button>
    </div>
  `;
}

/* ==========================================================
   🔁 Recarga manual de bancos
   ========================================================== */
async function manualBankReload() {
  alert("⏳ Actualizando bancos...");
  await loadAllBanks();
  alert("✅ Bancos actualizados correctamente");
}

/* ==========================================================
   ♻️ Recarga completa (forzar reload)
   ========================================================== */
function forceReloadBank() {
  localStorage.clear();
  location.reload(true);
}
