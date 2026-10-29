// Lo explica: Ailin
// Chicos, acá está todo lo de "Tu invernadero": la ventana para crearlo o editarlo,
// los fondos (o la foto que suba el usuario) y la tarjeta con los datos.
// Se guarda en el navegador con localStorage, así si recargás la página no se pierde.

var FONDOS = [
  "assets/invernaderos/fondo-1.svg",
  "assets/invernaderos/fondo-2.svg",
  "assets/invernaderos/fondo-3.svg",
  "assets/invernaderos/fondo-4.svg"
];

var CLAVE_INVERNADERO = "agromaticalInvernadero";
var fondoElegido = FONDOS[0];
var fotoSubida = null;

function leerInvernadero() {
  var guardado = localStorage.getItem(CLAVE_INVERNADERO);
  return guardado ? JSON.parse(guardado) : null;
}

function dibujarFondos() {
  var contenedor = document.getElementById("fondoPicker");
  contenedor.innerHTML = "";

  for (var i = 0; i < FONDOS.length; i++) {
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = (FONDOS[i] === fondoElegido) ? "fondo-option selected" : "fondo-option";
    boton.style.backgroundImage = "url('" + FONDOS[i] + "')";
    boton.setAttribute("onclick", "elegirFondo(" + i + ")");
    contenedor.appendChild(boton);
  }

  if (fotoSubida) {
    var botonFoto = document.createElement("button");
    botonFoto.type = "button";
    botonFoto.className = (fotoSubida === fondoElegido) ? "fondo-option fondo-option-personalizada selected" : "fondo-option fondo-option-personalizada";
    botonFoto.style.backgroundImage = "url('" + fotoSubida + "')";
    botonFoto.setAttribute("onclick", "elegirFotoSubida()");
    contenedor.appendChild(botonFoto);
  }
}

function elegirFondo(numero) {
  fondoElegido = FONDOS[numero];
  dibujarFondos();
}

function elegirFotoSubida() {
  fondoElegido = fotoSubida;
  dibujarFondos();
}

// Las fotos del celular pesan mucho y no entran en localStorage, así que antes de
// guardarla la dibujamos más chica en un canvas y la pasamos a JPG.
function cargarFoto(evento) {
  var archivo = evento.target.files[0];
  if (!archivo) {
    return;
  }

  var lector = new FileReader();
  lector.onload = function () {
    var imagen = new Image();
    imagen.onload = function () {
      var escala = Math.min(1, 800 / imagen.width);
      var canvas = document.createElement("canvas");
      canvas.width = imagen.width * escala;
      canvas.height = imagen.height * escala;
      canvas.getContext("2d").drawImage(imagen, 0, 0, canvas.width, canvas.height);

      fotoSubida = canvas.toDataURL("image/jpeg", 0.7);
      fondoElegido = fotoSubida;
      dibujarFondos();
    };
    imagen.src = lector.result;
  };
  lector.readAsDataURL(archivo);
}

function abrirModalInvernadero() {
  var datos = leerInvernadero();

  if (datos) {
    document.getElementById("invernaderoNombreInput").value = datos.nombre;
    document.getElementById("invernaderoPlantasInput").value = datos.plantas;
    document.getElementById("invTempIdealInput").value = datos.tempIdeal;
    document.getElementById("invMargenAtencionInput").value = datos.margenAtencion;
    document.getElementById("invMargenCriticoInput").value = datos.margenCritico;
    fondoElegido = datos.fondo;
    fotoSubida = (datos.fondo.indexOf("data:image") === 0) ? datos.fondo : null;
  } else {
    document.getElementById("invernaderoNombreInput").value = "";
    document.getElementById("invernaderoPlantasInput").value = "";
    document.getElementById("invTempIdealInput").value = 22;
    document.getElementById("invMargenAtencionInput").value = 3;
    document.getElementById("invMargenCriticoInput").value = 6;
    fondoElegido = FONDOS[0];
    fotoSubida = null;
  }

  document.getElementById("fondoArchivoInput").value = "";
  dibujarFondos();
  document.getElementById("invernaderoModalOverlay").classList.add("open");
}

function cerrarModalInvernadero() {
  document.getElementById("invernaderoModalOverlay").classList.remove("open");
}

function guardarInvernadero() {
  var nombre = document.getElementById("invernaderoNombreInput").value.trim();
  var plantas = document.getElementById("invernaderoPlantasInput").value.trim();
  var tempIdeal = parseFloat(document.getElementById("invTempIdealInput").value);
  var margenAtencion = parseFloat(document.getElementById("invMargenAtencionInput").value);
  var margenCritico = parseFloat(document.getElementById("invMargenCriticoInput").value);

  if (!nombre) {
    alert("Ponele un nombre a tu invernadero.");
    return;
  }
  if (isNaN(tempIdeal) || isNaN(margenAtencion) || isNaN(margenCritico)) {
    alert("Completá la temperatura ideal y los márgenes con números.");
    return;
  }
  if (margenCritico <= margenAtencion) {
    alert("El margen crítico tiene que ser más grande que el margen para avisar.");
    return;
  }

  var anterior = leerInvernadero();
  var datos = {
    nombre: nombre,
    plantas: plantas,
    fondo: fondoElegido,
    tempIdeal: tempIdeal,
    margenAtencion: margenAtencion,
    margenCritico: margenCritico
  };

  try {
    localStorage.setItem(CLAVE_INVERNADERO, JSON.stringify(datos));
  } catch (error) {
    alert("No se pudo guardar. Probá con una foto más liviana.");
    return;
  }

  if (!anterior) {
    borrarChatInvernadero();
  } else if (anterior.plantas !== plantas) {
    avisarCambioDePlantas(datos);
  }

  cerrarModalInvernadero();
  mostrarInvernadero();
}

function borrarInvernadero() {
  if (!confirm("¿Seguro que querés eliminar tu invernadero?")) {
    return;
  }
  localStorage.removeItem(CLAVE_INVERNADERO);
  borrarChatInvernadero();
  mostrarInvernadero();
}

function mostrarInvernadero() {
  var datos = leerInvernadero();

  if (!datos) {
    document.getElementById("invernaderoCta").style.display = "";
    document.getElementById("invernaderoCard").style.display = "none";
    document.getElementById("chatInvernadero").style.display = "none";
    return;
  }

  document.getElementById("invernaderoCta").style.display = "none";
  document.getElementById("invernaderoCard").style.display = "";

  document.getElementById("invernaderoFondo").style.backgroundImage = "url('" + datos.fondo + "')";
  setTextoSiExiste("invernaderoNombre", datos.nombre);
  setTextoSiExiste("invernaderoPlantas", datos.plantas || "Sin plantas cargadas todavía.");

  mostrarConsejosPlantas(datos.plantas);
  actualizarClimaInvernadero();
  mostrarChatInvernadero(datos);
  consultarServidorDelProfe();
}

// Para regar usamos la temperatura y humedad de ADENTRO (servidor del profe) si hay
// conexión. Si no hay, usamos las de afuera (Open-Meteo). La lluvia siempre es de afuera.
function datosParaElRiego() {
  var afuera = ultimoClimaMostrado || {};
  var datos = {
    temperatura: afuera.temperatura,
    humedad: afuera.humedad,
    precipitacion: afuera.precipitacion,
    pronostico: afuera.pronostico
  };

  if (hayConexionConElProfe()) {
    datos.temperatura = datosDelProfe.temperatura;
    datos.humedad = datosDelProfe.humedad;
  }
  return datos;
}

function actualizarClimaInvernadero() {
  var afuera = ultimoClimaMostrado || {};
  var datos = datosParaElRiego();

  setTextoSiExiste("invTemp", redondeado(afuera.temperatura));
  setTextoSiExiste("invHumedad", redondeado(afuera.humedad));
  setTextoSiExiste("invViento", redondeado(afuera.viento));

  mostrarCielo(afuera.descripcion);
  mostrarMiniPronostico(afuera.pronostico);
  mostrarHorarioRiego(riegoSegunClima(datos.temperatura, datos.humedad, datos.precipitacion, null, null));
  mostrarAlertas(generarAlertas(datos));
}

function mostrarCielo(descripcion) {
  var caja = document.getElementById("invernaderoCielo");
  if (!descripcion) {
    caja.style.display = "none";
    return;
  }
  caja.style.display = "";
  setTextoSiExiste("invernaderoCieloTexto", descripcion);
  document.getElementById("invernaderoCieloIcono").innerHTML = iconoDelClima(descripcion);
}

function mostrarMiniPronostico(pronostico) {
  var contenedor = document.getElementById("invernaderoPronostico");
  contenedor.innerHTML = "";
  if (!pronostico) {
    return;
  }

  for (var i = 0; i < 3; i++) {
    var dia = pronostico[i];
    var tarjeta = document.createElement("div");
    tarjeta.className = "pronostico-dia";
    tarjeta.innerHTML =
      "<span class=\"pronostico-dia-etiqueta\">" + dia.etiqueta + "</span>" +
      "<span class=\"pronostico-dia-icono\">" + iconoDelClima(dia.descripcion) + "</span>" +
      "<span class=\"pronostico-dia-desc\">" + dia.descripcion + "</span>" +
      "<span class=\"pronostico-dia-temp\">" + redondeado(dia.tempMax, "°") + " / " + redondeado(dia.tempMin, "°") + "</span>";
    contenedor.appendChild(tarjeta);
  }
}

function mostrarHorarioRiego(riego) {
  var caja = document.getElementById("horariosRiegoMensaje");
  var lista = document.getElementById("horariosRiegoLista");

  caja.textContent = riego.mensaje;
  caja.className = (riego.horarios.length > 0) ? "consejo-riego consejo-bueno" : "consejo-riego consejo-malo";

  lista.innerHTML = "";
  for (var i = 0; i < riego.horarios.length; i++) {
    var chip = document.createElement("span");
    chip.className = "horario-chip";
    chip.textContent = riego.horarios[i];
    lista.appendChild(chip);
  }
}

function mostrarAlertas(alertas) {
  var contenedor = document.getElementById("invernaderoAlertas");
  contenedor.innerHTML = "";
  contenedor.style.display = (alertas.length > 0) ? "" : "none";

  for (var i = 0; i < alertas.length; i++) {
    var aviso = document.createElement("div");
    aviso.className = "alerta-invernadero alerta-" + alertas[i].tipo;
    aviso.textContent = alertas[i].texto;
    contenedor.appendChild(aviso);
  }
}

function mostrarConsejosPlantas(plantas) {
  var consejos = consejosParaPlantas(plantas);
  var lista = document.getElementById("invernaderoTips");

  document.getElementById("invernaderoTipsBox").style.display = (consejos.length > 0) ? "" : "none";
  lista.innerHTML = "";
  for (var i = 0; i < consejos.length; i++) {
    var item = document.createElement("li");
    item.textContent = consejos[i];
    lista.appendChild(item);
  }
}
