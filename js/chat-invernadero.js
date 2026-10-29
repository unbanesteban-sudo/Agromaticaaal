// Lo explica: Thiago
// Chicos, este es el chat con AgrIA que aparece abajo del invernadero. Cuando alguien
// crea su invernadero, AgrIA lo saluda solo y le muestra su lista de plantas.
// Los mensajes se guardan en localStorage para que no se borren al recargar.
// Para responder usa preguntarAAgria(), que está en asistente-ia.js.

var CLAVE_CHAT = "agromaticalChatInvernadero";
var chatPensando = false;

function leerChatInvernadero() {
  var guardado = localStorage.getItem(CLAVE_CHAT);
  return guardado ? JSON.parse(guardado) : [];
}

function guardarChatInvernadero(mensajes) {
  localStorage.setItem(CLAVE_CHAT, JSON.stringify(mensajes.slice(-40)));
}

function borrarChatInvernadero() {
  localStorage.removeItem(CLAVE_CHAT);
}

// Convierte "tomates, lechuga y frutillas" en una lista: Tomates / Lechuga / Frutillas.
function separarPlantas(texto) {
  var lista = [];
  var partes = (texto || "").split(/,| y /);

  for (var i = 0; i < partes.length; i++) {
    var planta = partes[i].trim();
    if (planta) {
      lista.push(planta.charAt(0).toUpperCase() + planta.slice(1));
    }
  }
  return lista;
}

function listaDePlantas(plantas) {
  var texto = "";
  for (var i = 0; i < plantas.length; i++) {
    texto += "\n• " + plantas[i];
  }
  return texto;
}

function mensajesDeBienvenida(datos) {
  var plantas = separarPlantas(datos.plantas);

  if (plantas.length === 0) {
    return [
      "¡Hola! Soy AgrIA y desde hoy te voy a ayudar con \"" + datos.nombre + "\".",
      "Todavía no me contaste qué plantas tenés. Tocá Editar y agregalas, así te doy consejos para cada una."
    ];
  }

  return [
    "¡Wow, qué lindo \"" + datos.nombre + "\"! Soy AgrIA, tu asistente.",
    "Esta es tu lista de plantas:" + listaDePlantas(plantas),
    "Vamos a empezar a cuidarlas juntos de hoy en adelante. Preguntame lo que quieras sobre tus plantas."
  ];
}

function crearBurbujaChat(texto, rol) {
  var lista = document.getElementById("chatInvMensajes");
  var burbuja = document.createElement("div");
  burbuja.className = "chat-inv-msg chat-inv-" + rol;
  burbuja.textContent = texto;
  lista.appendChild(burbuja);
  lista.scrollTop = lista.scrollHeight;
  return burbuja;
}

function agregarMensajeChat(texto, rol) {
  var mensajes = leerChatInvernadero();
  mensajes.push({ rol: rol, texto: texto });
  guardarChatInvernadero(mensajes);
  crearBurbujaChat(texto, rol);
}

function mostrarChatInvernadero(datos) {
  document.getElementById("chatInvernadero").style.display = "";

  var mensajes = leerChatInvernadero();
  if (mensajes.length === 0) {
    var bienvenida = mensajesDeBienvenida(datos);
    for (var i = 0; i < bienvenida.length; i++) {
      mensajes.push({ rol: "asistente", texto: bienvenida[i] });
    }
    guardarChatInvernadero(mensajes);
  }

  document.getElementById("chatInvMensajes").innerHTML = "";
  for (var j = 0; j < mensajes.length; j++) {
    crearBurbujaChat(mensajes[j].texto, mensajes[j].rol);
  }
}

function avisarCambioDePlantas(datos) {
  var plantas = separarPlantas(datos.plantas);
  var mensajes = leerChatInvernadero();
  var texto = (plantas.length === 0)
    ? "Vi que borraste tus plantas. Agregalas cuando quieras."
    : "Vi que cambiaste tus plantas. Tu lista nueva es:" + listaDePlantas(plantas);

  mensajes.push({ rol: "asistente", texto: texto });
  guardarChatInvernadero(mensajes);
}

// Pasamos el chat guardado al formato que entiende la IA (role: "user" o "assistant").
function conversacionParaAgria() {
  var mensajes = leerChatInvernadero().slice(-10);
  var conversacion = [];

  for (var i = 0; i < mensajes.length; i++) {
    conversacion.push({
      role: (mensajes[i].rol === "usuario") ? "user" : "assistant",
      content: mensajes[i].texto
    });
  }
  return conversacion;
}

function enviarMensajeChatInvernadero() {
  var input = document.getElementById("chatInvInput");
  var pregunta = input.value.trim();
  if (!pregunta || chatPensando) {
    return;
  }

  input.value = "";
  agregarMensajeChat(pregunta, "usuario");

  chatPensando = true;
  var pensando = crearBurbujaChat("AgrIA está escribiendo...", "pensando");

  preguntarAAgria(conversacionParaAgria()).then(function (respuesta) {
    pensando.remove();
    agregarMensajeChat(respuesta, "asistente");
    chatPensando = false;
  });
}

function preguntaRapidaChat(texto) {
  document.getElementById("chatInvInput").value = texto;
  enviarMensajeChatInvernadero();
}

function teclaChatInvernadero(evento) {
  if (evento.key === "Enter") {
    enviarMensajeChatInvernadero();
  }
}
