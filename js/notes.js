/* ==========================================================
   📔 MEbank 3.0 – Sistema de Notas
   ========================================================== */
const STORAGE_KEY_NOTES = "mebank_notes";

/* ----------------------------------------------------------
   🏠 Pantalla Principal: "Mis Notas"
   ---------------------------------------------------------- */
function renderNotasMain() {
  const app = document.getElementById("app");
  const NOTES = getNotes();
  const keys = Object.keys(NOTES);

  if (!keys.length) {
    app.innerHTML = `
      <div class="card fade" style="text-align:center; max-width:500px; margin:auto;">
        <h3>📔 Mis notas</h3>
        <p style="color:#64748b; margin-bottom:20px;">
            Todavía no agregaste notas a ninguna pregunta.
        </p>
        <button class="btn-main" onclick="renderHome()">⬅ Volver al inicio</button>
      </div>`;
    return;
  }

  // Ordenar por fecha (más nuevas primero)
  keys.sort((a, b) => new Date(NOTES[b].date) - new Date(NOTES[a].date));

  const list = keys.map(id => {
    const n = NOTES[id];
    // Buscamos la pregunta en el banco cargado para saber el título
    const q = (typeof BANK !== 'undefined' && BANK.questions) 
              ? BANK.questions.find(x => x.id === id) 
              : null;
    
    // Título inteligente: Si encontramos la pregunta, usamos Materia + Enunciado
    const titulo = q 
      ? `<b>${getMateriaName(q.materia)}</b>: ${recortarTexto(q.enunciado, 60)}` 
      : `Pregunta ID: ${id}`;
    
    const fecha = new Date(n.date).toLocaleDateString("es-AR", {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="materia-block" style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:12px;">
        <div style="font-size:14px; color:#1e293b; margin-bottom:6px;">${titulo}</div>
        <div style="font-size:12px; color:#64748b; margin-bottom:10px;">📅 ${fecha}</div>
        
        <div style="background:#fefce8; padding:10px; border-left:3px solid #facc15; font-size:14px; color:#422006; white-space:pre-wrap; border-radius:4px;">${n.text}</div>
        
        <div style="text-align:right; margin-top:10px; display:flex; gap:10px; justify-content:flex-end;">
          ${q ? `<button class="btn-small" onclick="irAPreguntaDesdeNota('${id}')">🔎 Ver pregunta</button>` : ''}
          <button class="btn-small" style="background:#ef4444; border-color:#ef4444; color:white;" onclick="deleteNoteGlobal('${id}')">🗑️ Borrar</button>
        </div>
      </div>`;
  }).join("");

  app.innerHTML = `
    <div class="card fade" style="max-width:800px; margin:auto;">
      <h3 style="margin-bottom:20px; text-align:center;">📔 Mis notas (${keys.length})</h3>
      ${list}
      <div style="text-align:center; margin-top:20px;">
        <button class="btn-small" onclick="renderHome()">⬅ Volver al inicio</button>
      </div>
    </div>`;
}

/* ----------------------------------------------------------
   ⚙ Lógica de Guardado (Usada desde Resolver)
   ---------------------------------------------------------- */
window.toggleNoteArea = (qid) => {
    const area = document.getElementById(`note-area-${qid}`);
    if(area) {
        area.style.display = area.style.display === "none" ? "block" : "none";
    }
};

window.saveNoteResolver = (qid) => {
    const txtInput = document.getElementById(`note-text-${qid}`);
    const txt = txtInput ? txtInput.value.trim() : "";
    
    const NOTES = getNotes();
    
    if (txt) {
        NOTES[qid] = { text: txt, date: new Date().toISOString() };
        alert("✅ Nota guardada");
    } else {
        // Si guarda vacío, borramos la nota
        delete NOTES[qid];
        alert("🗑 Nota eliminada");
    }
    
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(NOTES));
    
    // Actualizamos la vista de la pregunta para reflejar cambios
    if(typeof renderPregunta === 'function') renderPregunta();
};

window.deleteNoteGlobal = (id) => {
    if(!confirm("¿Seguro que querés borrar esta nota?")) return;
    const NOTES = getNotes();
    delete NOTES[id];
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(NOTES));
    renderNotasMain(); // Recargamos la lista
};

/* ----------------------------------------------------------
   🔧 Helpers
   ---------------------------------------------------------- */
function getNotes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES) || "{}");
}

function getMateriaName(slug) {
    if(typeof BANK !== 'undefined' && BANK.subjects) {
        const m = BANK.subjects.find(s => s.slug === slug);
        return m ? m.name : slug;
    }
    return slug;
}

function recortarTexto(txt, len) {
    if(!txt) return "";
    return txt.length > len ? txt.substring(0, len) + "..." : txt;
}

function irAPreguntaDesdeNota(id) {
    // Truco: Iniciamos una resolución de 1 sola pregunta para verla
    const q = BANK.questions.find(x => x.id === id);
    if(!q) return alert("Pregunta no encontrada en el banco actual.");
    
    iniciarResolucion({
        modo: "revision",
        preguntas: [q],
        usarTimer: false,
        titulo: "Revisión de Nota"
    });
}
