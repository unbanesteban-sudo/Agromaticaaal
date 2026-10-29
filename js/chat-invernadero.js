var CHAT_INVERNADERO_KEY = "agromaticalChatInvernadero";
var MAX_MENSAJES_CHAT = 40;
var MAX_MENSAJES_PARA_IA = 16;
var chatInvernaderoPensando = false;

function leerChatInvernadero() {
  try {
    var guardado = localStorage.getItem(CHAT_INVERNADERO_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    return [];
  }
}

function guardarChatInvernadero(mensajes) {
  if (mensajes.length > MAX_MENSAJES_CHAT) {
    mensajes = mensajes.slice(mensajes.length - MAX_MENSAJES_CHAT);
  }
  try {
    localStorage.setItem(CHAT_INVERNADERO_KEY, JSON.stringify(mensajes));
  } catch (error) {
    console.error("[AgrIA] No se pudo guardar el chat:", error);
  }
}

function borrarChatInvernadero() {
  localStorage.removeItem(CHAT_INVERNADERO_KEY);
}

function separarPlantas(texto) {
  var lista = [];
  if (!texto) {
    return lista;
  }

  var partes = texto.split(/,|;|\n|\sy\s|\se\s/i);
  for (var i = 0; i < partes.length; i++) {
    var planta = partes[i].trim();
    if (planta) {
      lista.push(planta.charAt(0).toUpperCase() + planta.slice(1));
    }
  }
  return lista;
}

function textoRiegoDeHoy() {
  if (typeof ultimoClimaMostrado === "undefined" || !ultimoClimaMostrado || typeof generarHorariosRiego !== "function") {
    return "";
  }

  var riego = generarHorariosRiego(ultimoClimaMostrado);
  if (riego.horarios.length > 0) {
    return "Para hoy te recomiendo regar a las " + riego.horarios.join(" y ") + ".";
  }
  return "Para hoy: " + riego.mensaje;
}

function mensajesDeBienvenida(datos) {
  var plantas = separarPlantas(datos.plantas);

  if (plantas.length === 0) {
    return [
      "¡Hola! Soy AgrIA y desde hoy te voy a ayudar con \"" + datos.nombre + "\".",
      "Todavía no me contaste qué plantas tenés. Tocá Editar y agregalas, así te doy consejos para cada una."
    ];
  }

  var lista = "Esta es tu lista de plantas:";
  for (var i = 0; i < plantas.length; i++) {
    lista += "\n• " + plantas[i];
  }

  return [
    "¡Wow, qué lindo \"" + datos.nombre + "\"! Soy AgrIA, tu asistente.",
    lista,
    "Vamos a empezar a cuidarlas juntos de hoy en adelante. " + textoRiegoDeHoy() + " Preguntame lo que quieras sobre tus plantas."
  ];
}

function crearBurbujaChatInv(texto, rol) {
  var lista = document.getElementById("chatInvMensajes");
  var burbuja = document.createElement("div");
  burbuja.className = "chat-inv-msg chat-inv-" + rol;
  burbuja.textContent = texto;
  lista.appendChild(burbuja);
  lista.scrollTop = lista.scrollHeight;
  return burbuja;
}

function agregarMensajeChatInv(texto, rol) {
  var mensajes = leerChatInvernadero();
  mensajes.push({ rol: rol, texto: texto });
  guardarChatInvernadero(mensajes);
  crearBurbujaChatInv(texto, rol);
}

function mostrarChatInvernadero(datos) {
  var chat = document.getElementById("chatInvernadero");
  var lista = document.getElementById("chatInvMensajes");
  if (!chat || !lista) {
    return;
  }

  chat.style.display = "";

  var mensajes = leerChatInvernadero();
  if (mensajes.length === 0) {
    var bienvenida = mensajesDeBienvenida(datos);
    for (var i = 0; i < bienvenida.length; i++) {
      mensajes.push({ rol: "asistente", texto: bienvenida[i] });
    }
    guardarChatInvernadero(mensajes);
  }

  lista.innerHTML = "";
  for (var j = 0; j < mensajes.length; j++) {
    crearBurbujaChatInv(mensajes[j].texto, mensajes[j].rol);
  }
}

function avisarCambioDePlantas(datos) {
  var plantas = separarPlantas(datos.plantas);
  var mensajes = leerChatInvernadero();

  if (mensajes.length === 0) {
    return;
  }

  var texto = "Vi que cambiaste tus plantas. ";
  if (plantas.length === 0) {
    texto += "Ahora no tengo ninguna anotada, agregalas cuando quieras.";
  } else {
    texto += "Tu lista nueva es:";
    for (var i = 0; i < plantas.length; i++) {
      texto += "\n• " + plantas[i];
    }
  }

  mensajes.push({ rol: "asistente", texto: texto });
  guardarChatInvernadero(mensajes);
}

function mensajesParaLaIA() {
  var mensajes = leerChatInvernadero();
  var resultado = [];

  for (var i = 0; i < mensajes.length; i++) {
    resultado.push({
      role: (mensajes[i].rol === "usuario") ? "user" : "assistant",
      content: mensajes[i].texto
    });
  }

  if (resultado.length > MAX_MENSAJES_PARA_IA) {
    resultado = resultado.slice(resultado.length - MAX_MENSAJES_PARA_IA);
  }
  while (resultado.length > 0 && resultado[0].role !== "user") {
    resultado.shift();
  }

  if (resultado.length > 0 && typeof datoRealComoTexto === "function") {
    var ultimo = resultado[resultado.length - 1];
    ultimo.content = datoRealComoTexto() + "\n\n" + ultimo.content;
  }

  return resultado;
}

function enviarMensajeChatInvernadero() {
  if (chatInvernaderoPensando) {
    return;
  }

  var input = document.getElementById("chatInvInput");
  var pregunta = input.value.trim();
  if (!pregunta) {
    return;
  }

  input.value = "";
  agregarMensajeChatInv(pregunta, "usuario");

  chatInvernaderoPensando = true;
  var burbujaPensando = crearBurbujaChatInv("AgrIA está escribiendo...", "pensando");

  preguntarAlAsistente(mensajesParaLaIA()).then(function (respuesta) {
    burbujaPensando.remove();
    agregarMensajeChatInv(respuesta, "asistente");
    chatInvernaderoPensando = false;
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

var datosInvernaderoAlCargar = leerInvernadero();
if (datosInvernaderoAlCargar) {
  mostrarChatInvernadero(datosInvernaderoAlCargar);
}
