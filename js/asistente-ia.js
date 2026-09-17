// ---------------------------------------------------------------
// Asistente de IA para Agromatical (widget flotante, en index.html)
// ---------------------------------------------------------------
// Responde dudas de agricultores sobre riego, cuidado de cultivos, y
// cómo interpretar la temperatura/humedad que muestra la página. Usa
// Workers AI (Cloudflare) a través de un Worker propio (agria), que
// es el único que habla con el modelo de IA. Como Workers AI no usa
// api key propia (viene incluido en la cuenta de Cloudflare), acá no
// hay ningún secreto que cuidar. Ver cloudflare-worker/README.md
// para más detalle.
//
// El widget guarda el historial de la charla en una variable (en
// memoria), para que el asistente tenga contexto de lo que se habló
// antes y no se le "olvide" la pregunta anterior. Ese historial se
// pierde si se recarga la página — no hace falta guardarlo en
// ningún lado para una demo.

var SYSTEM_PROMPT_BASE = "Sos el asistente de Climaxer (Agromatical), un sistema de monitoreo de " +
  "temperatura y humedad para agricultores. Respondés dudas sobre riego, cuidado de " +
  "cultivos, y cómo interpretar la temperatura y humedad que muestra la página. " +
  "Sos claro y breve (unos pocos párrafos como mucho), y si no estás seguro de algo " +
  "específico del cultivo del usuario, lo aclarás en vez de inventar. Respondés " +
  "siempre en español.";

// Arma el system prompt de cada pedido, sumándole el dato real que
// esté mostrando la página en ese momento (lo guarda js/api.js en
// "ultimoClimaMostrado"). Así, si preguntan "¿qué temperatura hace
// en Cutral Có?", la IA usa el número real de la página en vez de
// inventar uno propio (los modelos de lenguaje no tienen acceso a
// datos del clima en tiempo real por sí solos).
function construirSystemPrompt() {
  var prompt = SYSTEM_PROMPT_BASE;

  if (typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado &&
      ultimoClimaMostrado.temperatura !== null && ultimoClimaMostrado.temperatura !== undefined) {
    var c = ultimoClimaMostrado;
    prompt += " Dato real que está mostrando la página ahora mismo (fuente: Open-Meteo) — " +
      "ciudad: " + c.ciudad + ", temperatura: " + Math.round(c.temperatura) + "°C" +
      (c.humedad !== null && c.humedad !== undefined ? ", humedad: " + Math.round(c.humedad) + "%" : "") +
      (c.viento !== null && c.viento !== undefined ? ", viento: " + Math.round(c.viento) + " km/h" : "") +
      ", actualizado a las " + c.actualizado + ". Si te preguntan por la temperatura o el clima actual, " +
      "usá exactamente este dato — nunca inventes ni calcules otro número por tu cuenta, aunque te " +
      "pregunten por otra ciudad: si preguntan por otra ciudad distinta a \"" + c.ciudad + "\", aclará que " +
      "en la página sólo tenés el dato de esa ciudad en este momento.";
  } else {
    prompt += " Todavía no hay ningún dato de clima cargado en la página. Si te preguntan por la " +
      "temperatura o el clima actual, aclará que no tenés ese dato disponible en este momento " +
      "(por ejemplo, porque la página está cargando o no hay conexión) en vez de inventar un valor.";
  }

  return prompt;
}

// Además de ir en el system prompt, el dato real se repite pegado a
// la pregunta misma. Los modelos chicos (como el que usamos acá,
// llama-3.1-8b) a veces "no prestan atención" a una instrucción que
// quedó lejos, al principio de todo, y contestan con su reflejo
// entrenado de "no tengo acceso a datos en tiempo real" aunque el
// dato esté ahí — pegándolo justo al lado de la pregunta se reduce
// mucho ese problema.
function datoRealComoTexto() {
  if (typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado &&
      ultimoClimaMostrado.temperatura !== null && ultimoClimaMostrado.temperatura !== undefined) {
    var c = ultimoClimaMostrado;
    return "[Dato real mostrado en la página ahora mismo — ciudad: " + c.ciudad +
      ", temperatura: " + Math.round(c.temperatura) + "°C" +
      (c.humedad !== null && c.humedad !== undefined ? ", humedad: " + Math.round(c.humedad) + "%" : "") +
      (c.viento !== null && c.viento !== undefined ? ", viento: " + Math.round(c.viento) + " km/h" : "") +
      ", actualizado " + c.actualizado + ". Si la pregunta es sobre el clima o la temperatura actual, " +
      "usá este dato exacto en tu respuesta, no digas que no tenés acceso.]";
  }
  return "[Todavía no hay ningún dato de clima cargado en la página. Si la pregunta es sobre la " +
    "temperatura o el clima actual, aclarar que no está disponible en este momento.]";
}

var AI_CONFIG = {
  endpoint: "https://agria.unbanesteban.workers.dev/"
};

// Cuántos mensajes (entre preguntas y respuestas) se mandan como
// contexto como máximo. Si la charla se hace muy larga, se van
// descartando los mensajes más viejos para no mandar de más.
var MAX_HISTORIAL = 16;

var historialIA = [];
var iaEstaPensando = false;

function preguntarAlAsistente(mensajes) {
  if (!AI_CONFIG.endpoint) {
    console.warn("[Climaxer] Falta configurar AI_CONFIG.endpoint en js/asistente-ia.js");
    return Promise.resolve("El asistente todavía no está conectado.");
  }

  return fetch(AI_CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: construirSystemPrompt(), mensajes: mensajes })
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      if (data && data.respuesta) {
        return data.respuesta;
      }
      if (data && data.error) {
        return "Hubo un error consultando al asistente: " + data.error;
      }
      return "Hubo un error consultando al asistente.";
    })
    .catch(function (error) {
      console.error("[Climaxer] Error al consultar el asistente:", error);
      return "Hubo un error consultando al asistente. Revisá la conexión e intentá de nuevo.";
    });
}

// ---------------------------------------------------------------
// Widget: abrir/cerrar y mostrar mensajes en pantalla
// ---------------------------------------------------------------

function toggleAsistenteIA() {
  var panel = document.getElementById("iaPanel");
  panel.classList.toggle("open");

  if (panel.classList.contains("open")) {
    document.getElementById("iaInput").focus();
  }
}

function agregarBurbujaIA(texto, quien) {
  var lista = document.getElementById("iaMensajes");
  var burbuja = document.createElement("div");
  burbuja.className = "ia-mensaje ia-mensaje-" + quien;
  burbuja.textContent = texto;
  lista.appendChild(burbuja);
  lista.scrollTop = lista.scrollHeight;
  return burbuja;
}

function recortarHistorialIA() {
  if (historialIA.length > MAX_HISTORIAL) {
    historialIA = historialIA.slice(historialIA.length - MAX_HISTORIAL);
  }
}

function enviarMensajeIA() {
  if (iaEstaPensando) {
    return;
  }

  var input = document.getElementById("iaInput");
  var pregunta = input.value.trim();

  if (!pregunta) {
    return;
  }

  input.value = "";
  agregarBurbujaIA(pregunta, "user");

  historialIA.push({ role: "user", content: pregunta });
  recortarHistorialIA();

  iaEstaPensando = true;
  var burbujaPensando = agregarBurbujaIA("Pensando...", "asistente-pensando");

  // Para mandar a la API se arma una copia del historial donde la
  // última pregunta lleva pegado el dato real (ver datoRealComoTexto
  // más arriba). El historialIA que se guarda y se muestra en
  // pantalla queda limpio, sin ese texto extra repetido en cada
  // vuelta.
  var mensajesParaAPI = historialIA.slice();
  mensajesParaAPI[mensajesParaAPI.length - 1] = {
    role: "user",
    content: datoRealComoTexto() + "\n\n" + pregunta
  };

  preguntarAlAsistente(mensajesParaAPI).then(function (respuesta) {
    burbujaPensando.remove();
    agregarBurbujaIA(respuesta, "asistente");

    historialIA.push({ role: "assistant", content: respuesta });
    recortarHistorialIA();

    iaEstaPensando = false;
  });
}

function manejarTeclaIA(evento) {
  if (evento.key === "Enter") {
    enviarMensajeIA();
  }
}
