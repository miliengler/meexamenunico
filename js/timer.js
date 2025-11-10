/* ========== 🔹 CRONÓMETRO UNIVERSAL (modular) – Estilo B (texto limpio) ========== */
let TIMER = {
  interval: null,
  startTime: 0,
  elapsed: 0,
  running: false
};

/**
 * Inicia un cronómetro centrado abajo con controles discretos (texto).
 */
function initTimer(containerId = "app") {
  const container = document.getElementById(containerId);
  if (!container) return;

  TIMER.elapsed = 0;
  TIMER.running = false;
  clearInterval(TIMER.interval);

  // 🔹 Crear UI del cronómetro
  const timerBox = document.createElement("div");
  timerBox.id = "timerBox";
  timerBox.style = `
    text-align:center;
    margin-top:14px;
    color:var(--muted);
    font-size:14px;
    font-weight:600;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    flex-wrap:wrap;
  `;

timerBox.innerHTML = `
  ⏱️ <span id="timerDisplay">00:00:00</span> –
  <button class="btn-mini" id="pauseBtn" title="Pausar / Reanudar">Pausar</button>
  <button class="btn-mini" id="resetBtn" title="Reiniciar">Reiniciar</button>
  <button class="btn-mini" id="stopBtn" title="Detener">Detener</button>
`;
  
  container.append(timerBox);
  startTimer();

  document.getElementById("pauseBtn").onclick = togglePause;
  document.getElementById("resetBtn").onclick = resetTimer;
  document.getElementById("stopBtn").onclick = stopTimer;
}

/* ========== Lógica interna ========== */
function startTimer() {
  TIMER.startTime = Date.now() - TIMER.elapsed;
  TIMER.running = true;
  TIMER.interval = setInterval(updateTimer, 1000);
  const btn = document.getElementById("pauseBtn");
  if (btn) btn.textContent = "Pausar";
}

function togglePause() {
  const btn = document.getElementById("pauseBtn");
  if (!btn) return;

  if (TIMER.running) {
    clearInterval(TIMER.interval);
    TIMER.running = false;
    btn.textContent = "Reanudar";
  } else {
    startTimer();
  }
}

function resetTimer() {
  TIMER.elapsed = 0;
  TIMER.startTime = Date.now();
  updateTimer();
}

function stopTimer() {
  clearInterval(TIMER.interval);
  TIMER.running = false;
  const el = document.getElementById("timerDisplay");
  if (el) el.textContent = `Finalizado (${formatTime(TIMER.elapsed)})`;
  document.getElementById("pauseBtn").disabled = true;
  document.getElementById("resetBtn").disabled = true;
  document.getElementById("stopBtn").disabled = true;
}

function updateTimer() {
  TIMER.elapsed = Date.now() - TIMER.startTime;
  
  // Actualizar cronómetro del modo examen (flotante) si existe
  const examTimer = document.getElementById("exam-timer");
  if (examTimer) {
    examTimer.textContent = "⏱️ " + formatTime(TIMER.elapsed);
  }

  // Actualizar el cronómetro de práctica (centrado) si existe
  const el = document.getElementById("timerDisplay");
  if (el) el.textContent = formatTime(TIMER.elapsed);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* --- Botón mini minimalista (usa estilos base del sitio) --- */
const style = document.createElement("style");
style.textContent = `
  .btn-mini {
    background:none;
    border:none;
    font-size:13px;
    color:var(--muted);
    cursor:pointer;
    padding:2px 6px;
    border-radius:6px;
    transition:background 0.2s, color 0.2s;
  }
  .btn-mini:hover {
    background:var(--soft);
    color:var(--text);
  }
  .btn-mini:disabled {
    opacity:0.4;
    cursor:default;
  }
`;
document.head.appendChild(style);
