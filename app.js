/* ============================================================
   VIALIX PSICOTEST - Flujo de la aplicación
   ============================================================ */

const STORAGE_KEYS = {
  NOMBRE: "psicotest_nombre",
  IDENTIFICACION: "psicotest_identificacion",
  PLACA: "psicotest_placa",
  COLA: "psicotest_cola",          // resultados pendientes por enviar
  HISTORIAL: "psicotest_historial" // últimos resultados en este celular
};

// Claves de VIALIX KEY (mismo dominio de GitHub Pages): solo se leen para
// sugerir la persona y la placa.
const VIALIX_KEY_STORAGE = {
  CONDUCTOR: "vialix_conductor",
  IDENTIFICACION: "vialix_identificacion",
  PLACA: "vialix_placa"
};

const ORDEN_PRUEBAS = ["reaccion", "bimanual", "anticipacion"];
const MAX_HISTORIAL = 60;

const state = {
  nombre: null,
  identificacion: null,
  placa: "",
  sesionId: null,     // agrupa las pruebas hechas en una misma visita
  pruebaActual: null, // id de la prueba
  ejecucion: null,    // { detener } de la prueba en curso
  ultimo: null        // último resultado mostrado
};

/* ---------- Utilidades ---------- */

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } }
function lsJson(k) { try { return JSON.parse(lsGet(k) || "[]"); } catch (e) { return []; } }

function esc(t) {
  return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function nuevoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function showView(id) {
  $all(".view").forEach((v) => v.classList.remove("active"));
  $(`#${id}`).classList.add("active");
  window.scrollTo(0, 0);
}

/* ---------- Identificación ---------- */

function initIdentificacion() {
  state.nombre = lsGet(STORAGE_KEYS.NOMBRE);
  state.identificacion = lsGet(STORAGE_KEYS.IDENTIFICACION);
  state.placa = lsGet(STORAGE_KEYS.PLACA) || "";
  if (state.nombre && state.identificacion) return irAHome();
  $("#input-nombre").value = state.nombre || lsGet(VIALIX_KEY_STORAGE.CONDUCTOR) || "";
  $("#input-identificacion").value = state.identificacion || lsGet(VIALIX_KEY_STORAGE.IDENTIFICACION) || "";
  $("#input-placa").value = state.placa || lsGet(VIALIX_KEY_STORAGE.PLACA) || "";
  showView("view-usuario");
}

function guardarUsuario() {
  const nombre = $("#input-nombre").value.trim();
  const identificacion = $("#input-identificacion").value.trim();
  if (!nombre || !identificacion) {
    alert("Escribe el nombre y el número de identificación para continuar.");
    return;
  }
  state.nombre = nombre;
  state.identificacion = identificacion;
  state.placa = $("#input-placa").value.trim().toUpperCase();
  state.sesionId = nuevoId();
  lsSet(STORAGE_KEYS.NOMBRE, nombre);
  lsSet(STORAGE_KEYS.IDENTIFICACION, identificacion);
  lsSet(STORAGE_KEYS.PLACA, state.placa);
  irAHome();
}

function cambiarUsuario() {
  [STORAGE_KEYS.NOMBRE, STORAGE_KEYS.IDENTIFICACION, STORAGE_KEYS.PLACA].forEach(lsDel);
  state.nombre = state.identificacion = null;
  state.placa = "";
  state.sesionId = null;
  $("#input-nombre").value = "";
  $("#input-identificacion").value = "";
  $("#input-placa").value = "";
  showView("view-usuario");
}

/* ---------- Menú ---------- */

// Resultados de esta persona en este celular (el más reciente de cada prueba)
function ultimosDePersona() {
  const propios = lsJson(STORAGE_KEYS.HISTORIAL).filter((r) => r.identificacion === state.identificacion);
  const ultimo = {};
  propios.forEach((r) => { if (!ultimo[r.prueba] || r.fecha > ultimo[r.prueba].fecha) ultimo[r.prueba] = r; });
  return ultimo;
}

function irAHome() {
  if (!state.sesionId) state.sesionId = nuevoId();
  $("#home-nombre").textContent = state.nombre;
  $("#home-detalle").textContent = `${state.identificacion}${state.placa ? " · " + state.placa : ""}`;
  const ultimo = ultimosDePersona();
  $("#lista-pruebas").innerHTML = ORDEN_PRUEBAS.map((id, i) => {
    const p = Pruebas.CATALOGO[id];
    const r = ultimo[id];
    const estado = r
      ? `<span class="pildora ${r.resumen.dentro_referencia ? "ok" : "alerta"}">${r.resumen.dentro_referencia ? "Dentro de referencia" : "Por reforzar"}</span>`
      : `<span class="pildora">Pendiente</span>`;
    return `
      <button type="button" class="prueba-item" data-prueba="${id}">
        <span class="prueba-icono">${p.icono}</span>
        <span class="prueba-texto"><strong>${i + 1}. ${esc(p.nombre)}</strong>${estado}</span>
        <span class="prueba-flecha">›</span>
      </button>`;
  }).join("");
  actualizarCola();
  showView("view-home");
}

/* ---------- Instrucciones y ejecución ---------- */

function irAInstrucciones(id) {
  state.pruebaActual = id;
  const p = Pruebas.CATALOGO[id];
  $("#instr-titulo").textContent = `${p.icono} ${p.nombre}`;
  $("#instr-lista").innerHTML = p.instrucciones.map((t) => `<li>${esc(t)}</li>`).join("");
  $("#instr-horizontal").classList.toggle("hidden", !p.horizontal);
  showView("view-instrucciones");
}

async function pantallaCompleta(horizontal) {
  try {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
    if (horizontal && screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape");
  } catch (err) {
    // iPhone y algunos navegadores no permiten bloquear la orientación: se pide girar a mano
  }
}

function salirPantallaCompleta() {
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* nada */ }
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
}

function cuentaRegresiva() {
  return new Promise((resolve) => {
    const el = $("#arena-cuenta");
    let n = 3;
    el.textContent = n;
    el.classList.remove("hidden");
    const tick = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(tick);
        el.classList.add("hidden");
        resolve();
      } else {
        el.textContent = n;
      }
    }, 1000);
  });
}

async function comenzarPrueba() {
  const id = state.pruebaActual;
  const p = Pruebas.CATALOGO[id];
  $("#arena").classList.remove("hidden");
  document.body.classList.add("en-prueba");
  await pantallaCompleta(p.horizontal);
  // Esperar a que la pantalla termine de girar/ampliarse antes de medir el lienzo
  await new Promise((r) => setTimeout(r, 400));
  const canvas = $("#lienzo");
  const limpiar = canvas.getContext("2d");
  limpiar.clearRect(0, 0, canvas.width, canvas.height);
  if (!p.cuentaPropia) await cuentaRegresiva();
  if ($("#arena").classList.contains("hidden")) return; // salió durante la cuenta
  const inicio = new Date();
  state.ejecucion = p.ejecutar(canvas, (datos) => terminarPrueba(id, inicio, datos));
}

function cerrarArena() {
  $("#arena").classList.add("hidden");
  $("#arena-cuenta").classList.add("hidden");
  document.body.classList.remove("en-prueba");
  salirPantallaCompleta();
}

function salirDePrueba() {
  if (state.ejecucion) state.ejecucion.detener();
  state.ejecucion = null;
  cerrarArena();
  irAInstrucciones(state.pruebaActual);
}

/* ---------- Resultados ---------- */

const ETIQUETAS = {
  reaccion: [
    ["tiempo_medio_ms", "Tiempo medio de reacción", "ms"],
    ["tiempo_mediana_ms", "Mediana", "ms"],
    ["desviacion_ms", "Variabilidad (desviación)", "ms"],
    ["correctas", "Respuestas correctas", ""],
    ["boton_equivocado", "Botón equivocado", ""],
    ["omisiones", "Omisiones (no respondió)", ""],
    ["no_inhibio", "Tocó con luz amarilla", ""],
    ["anticipadas", "Tocó antes de la luz", ""],
    ["errores_totales", "Errores totales", ""]
  ],
  bimanual: [
    ["pct_dentro_total", "Tiempo dentro del camino", "%"],
    ["pct_dentro_izq", "Mano izquierda", "%"],
    ["pct_dentro_der", "Mano derecha", "%"],
    ["salidas_totales", "Salidas del camino", ""],
    ["salidas_izq", "Salidas mano izquierda", ""],
    ["salidas_der", "Salidas mano derecha", ""],
    ["desviacion_media_pct", "Desviación media", "%"]
  ],
  anticipacion: [
    ["error_medio_abs_ms", "Error medio", "ms"],
    ["error_medio_ms", "Error con signo (− antes / + tarde)", "ms"],
    ["tendencia", "Tendencia", ""],
    ["error_max_abs_ms", "Error máximo", "ms"],
    ["anticipados", "Se adelantó", ""],
    ["tardios", "Llegó tarde", ""],
    ["omisiones", "No tocó", ""]
  ]
};

function referenciaTexto(id) {
  const C = PSICOTEST_CONFIG;
  if (id === "reaccion") return `Referencia: tiempo medio ≤ ${C.REACCION.REF_TIEMPO_MEDIO_MS} ms y máximo ${C.REACCION.REF_ERRORES_MAX} errores.`;
  if (id === "bimanual") return `Referencia: ≥ ${C.BIMANUAL.REF_PCT_DENTRO}% dentro y máximo ${C.BIMANUAL.REF_SALIDAS_MAX} salidas.`;
  return `Referencia: error medio ≤ ${C.ANTICIPACION.REF_ERROR_MEDIO_MS} ms y máximo ${C.ANTICIPACION.REF_OMISIONES_MAX} omisión.`;
}

function tablaResultado(id, resumen) {
  return ETIQUETAS[id].map(([k, etiqueta, unidad]) => {
    const v = resumen[k];
    const valor = v == null || v === "" ? "--" : `${v}${unidad ? " " + unidad : ""}`;
    return `<div class="res-fila"><span>${esc(etiqueta)}</span><strong>${esc(valor)}</strong></div>`;
  }).join("");
}

async function terminarPrueba(id, inicio, datos) {
  state.ejecucion = null;
  cerrarArena();
  const resultado = {
    tipo: "resultado",
    id: nuevoId(),
    sesion_id: state.sesionId,
    fecha: inicio.toISOString(),
    fin: new Date().toISOString(),
    nombre: state.nombre,
    identificacion: state.identificacion,
    placa: state.placa,
    prueba: id,
    resumen: datos.resumen,
    ensayos: datos.ensayos,
    dispositivo: `${navigator.userAgent.slice(0, 180)} | ${screen.width}x${screen.height}`
  };
  guardarHistorial(resultado);
  mostrarResultado(resultado, "Enviando…");
  encolar(resultado);
  await sincronizar();
  mostrarResultado(resultado);
}

function mostrarResultado(r, estadoForzado) {
  state.ultimo = r;
  const p = Pruebas.CATALOGO[r.prueba];
  $("#res-titulo").textContent = `${p.icono} ${p.nombre}`;
  const ok = r.resumen.dentro_referencia;
  const nivel = $("#res-nivel");
  nivel.textContent = ok ? "✓ Dentro de la referencia" : "Por reforzar";
  nivel.className = `nivel ${ok ? "ok" : "alerta"}`;
  $("#res-tabla").innerHTML = tablaResultado(r.prueba, r.resumen) +
    `<p class="texto-suave">${esc(referenciaTexto(r.prueba))}</p>`;
  const pendiente = lsJson(STORAGE_KEYS.COLA).some((x) => x.id === r.id);
  const envio = $("#res-envio");
  if (estadoForzado) envio.textContent = estadoForzado;
  else if (!backendConfigurado()) envio.textContent = "Guardado solo en este celular (el backend aún no está configurado).";
  else envio.textContent = pendiente ? "Guardado en el celular · se enviará al recuperar conexión." : "✓ Resultado enviado a Google Sheets.";
  envio.className = `estado-envio ${!estadoForzado && !pendiente && backendConfigurado() ? "ok" : ""}`;
  const idx = ORDEN_PRUEBAS.indexOf(r.prueba);
  const hay = idx < ORDEN_PRUEBAS.length - 1;
  $("#btn-siguiente").textContent = hay ? `Siguiente: ${Pruebas.CATALOGO[ORDEN_PRUEBAS[idx + 1]].nombre}` : "Ver resumen";
  showView("view-resultado");
}

function siguientePrueba() {
  const idx = ORDEN_PRUEBAS.indexOf(state.ultimo.prueba);
  if (idx < ORDEN_PRUEBAS.length - 1) irAInstrucciones(ORDEN_PRUEBAS[idx + 1]);
  else irAResumen();
}

function irAResumen() {
  const ultimo = ultimosDePersona();
  $("#resumen-persona").textContent = `${state.nombre} · ${state.identificacion}`;
  $("#resumen-contenido").innerHTML = ORDEN_PRUEBAS.map((id) => {
    const p = Pruebas.CATALOGO[id];
    const r = ultimo[id];
    if (!r) return `<div class="resumen-bloque"><h2>${p.icono} ${esc(p.nombre)}</h2><p class="texto-suave">Aún no se ha realizado.</p></div>`;
    const ok = r.resumen.dentro_referencia;
    return `
      <div class="resumen-bloque">
        <h2>${p.icono} ${esc(p.nombre)}</h2>
        <div class="nivel ${ok ? "ok" : "alerta"}">${ok ? "✓ Dentro de la referencia" : "Por reforzar"}</div>
        <p class="texto-suave">${new Date(r.fecha).toLocaleString()}</p>
        <div class="res-tabla">${tablaResultado(id, r.resumen)}</div>
      </div>`;
  }).join("");
  showView("view-resumen");
}

/* ---------- Almacenamiento y envío ---------- */

function guardarHistorial(r) {
  // En el historial no se guardan los ensayos, para no llenar el almacenamiento
  const { ensayos, ...liviano } = r;
  const h = lsJson(STORAGE_KEYS.HISTORIAL);
  h.push(liviano);
  lsSet(STORAGE_KEYS.HISTORIAL, JSON.stringify(h.slice(-MAX_HISTORIAL)));
}

function backendConfigurado() {
  const url = PSICOTEST_CONFIG.APPS_SCRIPT_URL;
  return !!url && !url.includes("PEGA_AQUI");
}

function encolar(r) {
  const cola = lsJson(STORAGE_KEYS.COLA);
  cola.push(r);
  lsSet(STORAGE_KEYS.COLA, JSON.stringify(cola));
}

let sincronizando = false;
async function sincronizar() {
  if (sincronizando || !backendConfigurado() || !navigator.onLine) return actualizarCola();
  sincronizando = true;
  try {
    const cola = lsJson(STORAGE_KEYS.COLA);
    const enviados = new Set();
    for (const r of cola) {
      try {
        const res = await fetch(PSICOTEST_CONFIG.APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS
          body: JSON.stringify(r)
        });
        const data = await res.json();
        if (data && data.status === "ok") enviados.add(r.id);
        else console.warn("El backend rechazó el resultado:", data);
      } catch (err) {
        console.warn("No se pudo enviar, queda pendiente:", err);
        break;
      }
    }
    // Releer por si llegó otro resultado mientras se enviaba
    lsSet(STORAGE_KEYS.COLA, JSON.stringify(lsJson(STORAGE_KEYS.COLA).filter((r) => !enviados.has(r.id))));
  } finally {
    sincronizando = false;
    actualizarCola();
  }
}

function actualizarCola() {
  const n = lsJson(STORAGE_KEYS.COLA).length;
  const el = $("#cola-info");
  el.classList.toggle("hidden", n === 0);
  el.textContent = n === 1 ? "1 resultado pendiente por enviar" : `${n} resultados pendientes por enviar`;
}

/* ---------- Inicio ---------- */

document.addEventListener("DOMContentLoaded", () => {
  $("#btn-guardar-usuario").addEventListener("click", guardarUsuario);
  $("#btn-cambiar-usuario").addEventListener("click", cambiarUsuario);
  $("#lista-pruebas").addEventListener("click", (e) => {
    const b = e.target.closest("[data-prueba]");
    if (b) irAInstrucciones(b.dataset.prueba);
  });
  $("#btn-resumen").addEventListener("click", irAResumen);
  $("#btn-comenzar").addEventListener("click", comenzarPrueba);
  $("#btn-volver-instr").addEventListener("click", irAHome);
  $("#btn-salir-prueba").addEventListener("click", salirDePrueba);
  $("#btn-repetir").addEventListener("click", () => irAInstrucciones(state.ultimo.prueba));
  $("#btn-siguiente").addEventListener("click", siguientePrueba);
  $("#btn-res-home").addEventListener("click", irAHome);
  $("#btn-resumen-home").addEventListener("click", irAHome);

  const urlKey = PSICOTEST_CONFIG.URL_VIALIX_KEY;
  if (urlKey) {
    $("#btn-volver-key").href = urlKey;
    $("#btn-volver-key").classList.remove("hidden");
  }

  window.addEventListener("online", sincronizar);
  initIdentificacion();
  sincronizar();
});
