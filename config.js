/* ============================================================
   VIALIX PSICOTEST - Configuración
   Edita estos valores sin tocar el resto del código.
   ============================================================ */

const PSICOTEST_CONFIG = {
  // URL de la Web App de Google Apps Script de ESTE proyecto (termina en /exec).
  // Es un backend NUEVO, distinto al de VIALIX KEY y al de HEADSENSE.
  // Mientras diga PEGA_AQUI, los resultados se guardan solo en el celular.
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwEJsBKhAFFlfLl5PxTvtScCFmusY5K_A4x6fLmsitWE4EV1kMsWo3MuVJxt-WEwliBqQ/exec",

  NOMBRE_CLIENTE: "Eficacia - Extras",

  // Botón para volver a VIALIX KEY. "" para ocultarlo.
  URL_VIALIX_KEY: "https://solucionyservihseq-prog.github.io/vialix-key/",

  // ------------------------------------------------------------
  // Los valores de referencia (REF_*) son ORIENTATIVOS para tamizaje y
  // entrenamiento. No equivalen a los del examen de un CRC. Ajústalos con
  // tu profesional SST después de medir a un grupo piloto: la latencia de
  // la pantalla táctil cambia según el celular (≈ 30–100 ms).
  // ------------------------------------------------------------

  // 1. Tiempos de reacción múltiple
  //    Luz VERDE → ACELERAR (lado derecho). Luz ROJA → FRENAR (lado izquierdo).
  //    Luz AMARILLA → NO tocar (mide control de impulsos).
  REACCION: {
    ESTIMULOS: 24,
    PROPORCION_NO_PRESIONAR: 0.2,   // 20 % de luces amarillas
    ESPERA_MIN_MS: 900,             // pausa aleatoria antes de cada luz
    ESPERA_MAX_MS: 2600,
    LIMITE_RESPUESTA_MS: 1500,      // si no responde en este tiempo = omisión
    DURACION_NO_PRESIONAR_MS: 1100, // cuánto dura encendida la luz amarilla
    REF_TIEMPO_MEDIO_MS: 700,
    REF_ERRORES_MAX: 3
  },

  // 2. Coordinación bimanual
  //    Un pulgar guía cada bolita por su camino; los caminos se mueven
  //    de forma independiente.
  BIMANUAL: {
    DURACION_SEG: 45,
    VELOCIDAD_INICIAL: 0.30,  // pantallas por segundo al empezar
    VELOCIDAD_FINAL: 0.45,    // y al terminar (sube de forma gradual)
    ANCHO_CAMINO: 0.30,       // fracción del ancho de cada carril
    AMPLITUD_CURVAS: 0.30,    // cuánto se desplaza el camino a los lados
    REF_PCT_DENTRO: 85,
    REF_SALIDAS_MAX: 12
  },

  // 3. Anticipación de la velocidad
  //    La bolita entra a un túnel; se toca la pantalla en el instante en
  //    que debería salir.
  ANTICIPACION: {
    ENSAYOS: 10,
    VELOCIDADES: [0.22, 0.32, 0.45],  // fracción del ancho de pantalla por segundo
    LARGOS_TUNEL: [0.30, 0.45],       // fracción del ancho de pantalla
    LIMITE_TARDE_MS: 1500,            // si no toca en este tiempo = omisión
    REF_ERROR_MEDIO_MS: 200,
    REF_OMISIONES_MAX: 1
  }
};
