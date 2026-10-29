// Lo explica: Roman
// Chicos, esto conecta la página con AgrIA, nuestra inteligencia artificial.
// La IA corre en un servidor nuestro de Cloudflare (está en cloudflare-worker/worker.js).
// Nosotros le mandamos la pregunta + los datos que está mostrando la página, así
// responde con el clima y las plantas reales del usuario en vez de inventar.
// También maneja la burbujita flotante del chat (abajo a la derecha).

var AGRIA_URL = "https://agria.unbanesteban.workers.dev/";

var INSTRUCCIONES_AGRIA = "Sos AgrIA, el asistente de Agromatical, una página para cuidar invernaderos. " +
  "Respondés dudas sobre riego y cuidado de plantas, en español, claro y breve. " +
  "Si no estás seguro de algo, lo decís en vez de inventar. " +
  "Nunca inventes temperaturas: usá solo los datos que te pasa la página.";

function datosParaAgria() {
  var texto = "";
  var afuera = ultimoClimaMostrado;

  if (afuera) {
    texto += " Clima de afuera en " + afuera.ciudad + " (Open-Meteo): " + Math.round(afuera.temperatura) + " °C, humedad " +
      Math.round(afuera.humedad) + "%, viento " + Math.round(afuera.viento) + " km/h, cielo " + afuera.descripcion + ".";
  } else {
    texto += " Todavía no cargó el clima de afuera.";
  }

  var invernadero = (typeof leerInvernadero === "function") ? leerInvernadero() : null;
  if (invernadero) {
    texto += " El usuario tiene un invernadero llamado \"" + invernadero.nombre + "\" con: " + (invernadero.plantas || "plantas sin cargar") + ".";

    if (hayConexionConElProfe()) {
      texto += " Adentro del invernadero (servidor del profe) hay " + datosDelProfe.temperatura.toFixed(1) + " °C, humedad " +
        Math.round(datosDelProfe.humedad) + "% y luz " + Math.round(datosDelProfe.luz) + ".";
    }

    var datos = datosParaElRiego();
    var riego = riegoSegunClima(datos.temperatura, datos.humedad, datos.precipitacion, null, null);
    texto += " Riego sugerido hoy: " + (riego.horarios.length > 0 ? riego.horarios.join(" y ") : "no regar") + " (" + riego.mensaje + ").";
  }

  return texto;
}

// Le mandamos a nuestro servidor las instrucciones y la conversación. A la última
// pregunta le pegamos los datos de la página, porque si no la IA a veces se los olvida.
function preguntarAAgria(mensajes) {
  var conversacion = mensajes.slice();
  var ultima = conversacion[conversacion.length - 1];
  conversacion[conversacion.length - 1] = {
    role: "user",
    content: "[Datos de la página:" + datosParaAgria() + "]\n\n" + ultima.content
  };

  return fetch(AGRIA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: INSTRUCCIONES_AGRIA, mensajes: conversacion })
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      return data.respuesta || "Hubo un error consultando a AgrIA.";
    })
    .catch(function () {
      return "No me pude conectar. Revisá la conexión a internet e intentá de nuevo.";
    });
}

var historialBurbuja = [];
var agriaPensando = false;

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

function enviarMensajeIA() {
  var input = document.getElementById("iaInput");
  var pregunta = input.value.trim();
  if (!pregunta || agriaPensando) {
    return;
  }

  input.value = "";
  agregarBurbujaIA(pregunta, "user");
  historialBurbuja.push({ role: "user", content: pregunta });

  agriaPensando = true;
  var pensando = agregarBurbujaIA("Pensando...", "asistente-pensando");

  preguntarAAgria(historialBurbuja.slice(-10)).then(function (respuesta) {
    pensando.remove();
    agregarBurbujaIA(respuesta, "asistente");
    historialBurbuja.push({ role: "assistant", content: respuesta });
    agriaPensando = false;
  });
}

function manejarTeclaIA(evento) {
  if (evento.key === "Enter") {
    enviarMensajeIA();
  }
}
