/* ==========================================================
   💾 BANCO DE PREGUNTAS – Persistencia, carga y actualización
   Incluye bancos por materia + exámenes anteriores
   ========================================================== */

const LS_BANK = "mebank_bank_v6_full";
const LS_PROGRESS = "mebank_prog_v6_full";

/* ==========================================================
   ✨ Normalizador universal de textos
   (quita emojis, tildes, mayúsculas, símbolos)
   ========================================================== */
function normalizeString(str) {
  return str
    ? str
        .normalize("NFD")
        .replace(/[\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}]/gu, "")
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .trim()
    : "";
}

/* ==========================================================
   🧠 Banco base
   ========================================================== */
let BANK = JSON.parse(localStorage.getItem(LS_BANK) || "null") || {
  subjects: [
    { slug: "neumonologia", name: "🫁 Neumonología" },
    { slug: "psiquiatria", name: "💭 Psiquiatría" },
    { slug: "cardiologia", name: "🫀 Cardiología" },
    { slug: "nutricion", name: "🍏 Nutrición" },
    { slug: "urologia", name: "🚽 Urología" },
    { slug: "gastroenterologia", name: "💩 Gastroenterología" },
    { slug: "dermatologia", name: "🧴 Dermatología" },
    { slug: "infectologia", name: "🦠 Infectología" },
    { slug: "reumatologia", name: "💪 Reumatología" },
    { slug: "hematologia", name: "🩸 Hematología" },
    { slug: "neurologia", name: "🧠 Neurología" },
    { slug: "endocrinologia", name: "🧪 Endocrinología" },
    { slug: "pediatria", name: "🧸 Pediatría" },
    { slug: "oncologia", name: "🎗️ Oncología" },
    { slug: "medicinafamiliar", name: "👨‍👩‍👧‍👦 Medicina Familiar" },
    { slug: "ginecologia", name: "🌸 Ginecología" },
    { slug: "obstetricia", name: "🤰 Obstetricia" },
    { slug: "cirugiageneral", name: "🔪 Cirugía General" },
    { slug: "traumatologia", name: "🦴 Traumatología" },
    { slug: "oftalmologia", name: "👁️ Oftalmología" },
    { slug: "otorrinolaringologia", name: "👂 Otorrinolaringología" },
    { slug: "neurocirugia", name: "🧠 Neurocirugía" },
    { slug: "toxicologia", name: "☠️ Toxicología" },
    { slug: "saludpublica", name: "🏥 Salud Pública" },
    { slug: "medicinalegal", name: "⚖️ Medicina Legal" },
    { slug: "imagenes", name: "🩻 Diagnóstico por Imágenes" },
    { slug: "otras", name: "📚 Otras" }
  ],
  questions: []
};

let PROG = JSON.parse(localStorage.getItem(LS_PROGRESS) || "{}");

/* ==========================================================
   💾 Guardado local
   ========================================================== */
function saveAll() {
  localStorage.setItem(LS_BANK, JSON.stringify(BANK));
  localStorage.setItem(LS_PROGRESS, JSON.stringify(PROG));
}

/* ==========================================================
   📘 Materias derivadas del banco
   ========================================================== */
function subjectsFromBank() {
  const known = new Map((BANK.subjects || []).map(s => [normalizeString(s.slug), s]));

  (BANK.questions || []).forEach(q => {
    if (q && q.materia) {
      const slug = normalizeString(q.materia);
      if (!known.has(slug)) known.set(slug, { slug, name: q.materia });
    }
  });

  return Array.from(known.values()).sort((a, b) =>
    normalizeString(a.name).localeCompare(normalizeString(b.name), "es", { sensitivity: "base" })
  );
}

/* ==========================================================
   🌐 Carga completa (materias + exámenes anteriores)
   ========================================================== */
async function loadAllBanks() {
  const loader = showLoader("⏳ Cargando bancos...");
  const existingIds = new Set(BANK.questions.map(q => q.id));
  let totalNuevas = 0;

  const normalizarMateria = (nombre) => {
    if (!nombre) return "";
    const limpio = normalizeString(nombre);
    const match = BANK.subjects.find(s => normalizeString(s.slug) === limpio);
    return match ? match.slug : limpio;
  };

  /* ---------- 1️⃣ Cargar bancos por materia ---------- */
  for (const s of BANK.subjects) {
    const materia = s.slug;
    for (let i = 1; i <= 4; i++) {
      const ruta = `bancos/${materia}/${materia}${i}.json`;
      try {
        const resp = await fetch(ruta);
        if (!resp.ok) continue;
        const data = await resp.json();

        data.forEach(q => {
          if (q.materia) q.materia = normalizarMateria(q.materia);
        });

        const nuevas = data.filter(q => !existingIds.has(q.id));
        nuevas.forEach(q => existingIds.add(q.id));
        BANK.questions.push(...nuevas);
        totalNuevas += nuevas.length;
        console.log(`📘 ${ruta} (${nuevas.length} nuevas preguntas)`);
      } catch {}
    }
  }

  /* ---------- 2️⃣ Cargar exámenes anteriores ---------- */
  const examenes = [
    "examenunico2025.json",
    "examenunico2024.json",
    "examenunico2019.json"
  ];

  for (const ex of examenes) {
    const ruta = `bancos/anteriores/${ex}`;
    try {
      const resp = await fetch(ruta);
      if (!resp.ok) continue;
      const data = await resp.json();

      data.forEach(q => {
        q.tipo = "examen";
        if (q.materia) q.materia = normalizarMateria(q.materia);
      });

      const nuevas = data.filter(q => !existingIds.has(q.id));
      nuevas.forEach(q => existingIds.add(q.id));
      BANK.questions.push(...nuevas);
      totalNuevas += nuevas.length;
      console.log(`📄 ${ruta} (${nuevas.length} preguntas de examen)`);
    } catch {
      console.warn(`⚠️ No se pudo cargar ${ruta}`);
    }
  }

  hideLoader(loader, totalNuevas);
  if (totalNuevas > 0) saveAll();
}

/* ==========================================================
   💬 Indicadores visuales
   ========================================================== */
function showLoader(text) {
  const el = document.createElement("div");
  el.id = "bankLoader";
  el.style = `
    position:fixed;bottom:15px;left:15px;
    background:#1e40af;color:white;padding:8px 12px;
    border-radius:8px;font-size:13px;z-index:9999;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  `;
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

function hideLoader(el, total) {
  el.textContent = total > 0
    ? `✅ ${total} nuevas preguntas cargadas`
    : "✅ Bancos actualizados (sin cambios)";
  setTimeout(() => el.remove(), 2500);
}

/* ==========================================================
   ⚙️ Carga inicial automática
   ========================================================== */
window.addEventListener("DOMContentLoaded", async () => {
  if (!(BANK.questions && BANK.questions.length)) {
    await loadAllBanks();
    if (!BANK.questions.length) {
      console.warn("⚠️ No se cargaron preguntas. Verificá rutas o permisos de CORS.");
    }
  }
});

/* ==========================================================
   ♻️ Forzar recarga completa
   ========================================================== */
async function forceReloadBank() {
  if (!confirm("⚠️ Esto borrará el banco local y lo recargará completo. ¿Continuar?")) return;

  localStorage.removeItem(LS_BANK);
  localStorage.removeItem(LS_PROGRESS);

  BANK = { subjects: [...BANK.subjects], questions: [] };
  PROG = {};

  alert("♻️ Banco borrado. Ahora se recargará completo...");

  await loadAllBanks();
  saveAll();

  alert(`✅ Banco recargado con ${BANK.questions.length} preguntas`);
  renderHome();
}
