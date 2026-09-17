var SYSTEM_PROMPT_BASE = "Sos el asistente de Climaxer (Agromatical), un sistema de monitoreo de " +
  "temperatura y humedad para agricultores. Respondés dudas sobre riego, cuidado de " +
  "cultivos, y cómo interpretar la temperatura y humedad que muestra la página. " +
  "Sos claro y breve (unos pocos párrafos como mucho), y si no estás seguro de algo " +
  "específico del cultivo del usuario, lo aclarás en vez de inventar. Respondés " +
  "siempre en español.";

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
