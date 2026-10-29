var FONDOS_INVERNADERO = [
  { id: "fondo1", archivo: "assets/invernaderos/fondo-1.svg", nombre: "Verde" },
  { id: "fondo2", archivo: "assets/invernaderos/fondo-2.svg", nombre: "Atardecer" },
  { id: "fondo3", archivo: "assets/invernaderos/fondo-3.svg", nombre: "Tierra" },
  { id: "fondo4", archivo: "assets/invernaderos/fondo-4.svg", nombre: "Cielo" }
];

var TIPS_POR_PLANTA = [
  { claves: ["tomate"], consejo: "Los tomates necesitan riego regular pero sin mojar las hojas, para evitar hongos. Tutorálos a medida que crecen." },
  { claves: ["lechuga"], consejo: "La lechuga prefiere riegos frecuentes y suaves, y sufre con el calor fuerte del mediodía." },
  { claves: ["frutilla", "fresa"], consejo: "Las frutillas necesitan buen drenaje: regá seguido pero sin encharcar la tierra." },
  { claves: ["pimiento", "morron", "morrón", "aji", "ají"], consejo: "Los pimientos y ajíes disfrutan el calor, pero necesitan riego constante para no perder flores." },
  { claves: ["zanahoria"], consejo: "La zanahoria necesita tierra suelta y húmeda de forma pareja, sin encharcamientos." },
  { claves: ["cebolla"], consejo: "La cebolla necesita riego moderado; reducí el agua cuando el bulbo ya esté formado." },
  { claves: ["papa", "patata"], consejo: "La papa necesita riego constante mientras se forman los tubérculos, y menos hacia la cosecha." },
  { claves: ["albahaca"], consejo: "La albahaca es sensible al frío: protegela de las heladas y regala seguido en días de calor." },
  { claves: ["pepino", "pepinillo"], consejo: "El pepino necesita mucha agua, sobre todo cuando empieza a dar frutos." },
  { claves: ["zapallo", "calabaza"], consejo: "El zapallo necesita bastante espacio y riego profundo y espaciado, mejor que riegos cortos y frecuentes." },
  { claves: ["flor", "flores"], consejo: "Las flores en general agradecen riegos moderados y buena luz, evitando mojar los pétalos." }
];

var INVERNADERO_STORAGE_KEY = "agromaticalInvernadero";
var fondoSeleccionadoInvernadero = FONDOS_INVERNADERO[0].id;
var fotoPersonalizadaInvernadero = null;

function esFotoPersonalizada(fondo) {
  return !!fondo && fondo.indexOf("data:image") === 0;
}

function archivoDeFondo(id) {
  if (esFotoPersonalizada(id)) {
    return id;
  }

  for (var i = 0; i < FONDOS_INVERNADERO.length; i++) {
    if (FONDOS_INVERNADERO[i].id === id) {
      return FONDOS_INVERNADERO[i].archivo;
    }
  }
  return FONDOS_INVERNADERO[0].archivo;
}

function construirFondoPicker() {
  var contenedor = document.getElementById("fondoPicker");
  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  for (var i = 0; i < FONDOS_INVERNADERO.length; i++) {
    var fondo = FONDOS_INVERNADERO[i];
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "fondo-option" + (fondo.id === fondoSeleccionadoInvernadero ? " selected" : "");
    boton.style.backgroundImage = "url('" + fondo.archivo + "')";
    boton.title = fondo.nombre;
    boton.setAttribute("onclick", "elegirFondoInvernadero('" + fondo.id + "')");
    contenedor.appendChild(boton);
  }

  if (fotoPersonalizadaInvernadero) {
    var botonFoto = document.createElement("button");
    botonFoto.type = "button";
    botonFoto.className = "fondo-option fondo-option-personalizada" + (esFotoPersonalizada(fondoSeleccionadoInvernadero) ? " selected" : "");
    botonFoto.style.backgroundImage = "url('" + fotoPersonalizadaInvernadero + "')";
    botonFoto.title = "Tu foto";
    botonFoto.setAttribute("onclick", "elegirFotoPersonalizadaInvernadero()");
    contenedor.appendChild(botonFoto);
  }
}

function elegirFondoInvernadero(id) {
  fondoSeleccionadoInvernadero = id;
  construirFondoPicker();
}

function elegirFotoPersonalizadaInvernadero() {
  if (fotoPersonalizadaInvernadero) {
    fondoSeleccionadoInvernadero = fotoPersonalizadaInvernadero;
    construirFondoPicker();
  }
}

function cargarFotoInvernadero(evento) {
  var archivo = evento.target.files && evento.target.files[0];
  if (!archivo) {
    return;
  }

  if (archivo.size > 8 * 1024 * 1024) {
    alert("Esa foto es muy pesada. Elegí una imagen más liviana.");
    evento.target.value = "";
    return;
  }

  var lector = new FileReader();
  lector.onload = function (eventoLectura) {
    var imagen = new Image();
    imagen.onload = function () {
      var anchoMax = 800;
      var escala = imagen.width > anchoMax ? anchoMax / imagen.width : 1;

      var canvas = document.createElement("canvas");
      canvas.width = Math.round(imagen.width * escala);
      canvas.height = Math.round(imagen.height * escala);

      var contexto = canvas.getContext("2d");
      contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

      var dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      fotoPersonalizadaInvernadero = dataUrl;
      fondoSeleccionadoInvernadero = dataUrl;
      construirFondoPicker();
    };
    imagen.src = eventoLectura.target.result;
  };
  lector.readAsDataURL(archivo);
}

function tipsSegunPlantas(plantasTexto) {
  var consejos = [];

  if (!plantasTexto) {
    return consejos;
  }

  var texto = plantasTexto.toLowerCase();

  for (var i = 0; i < TIPS_POR_PLANTA.length; i++) {
    var item = TIPS_POR_PLANTA[i];
    for (var j = 0; j < item.claves.length; j++) {
      if (texto.indexOf(item.claves[j]) !== -1) {
        consejos.push(item.consejo);
        break;
      }
    }
  }

  return consejos;
}

function renderizarTipsPlantas(plantasTexto) {
  var caja = document.getElementById("invernaderoTipsBox");
  var lista = document.getElementById("invernaderoTips");
  if (!caja || !lista) {
    return;
  }

  var consejos = tipsSegunPlantas(plantasTexto);
  lista.innerHTML = "";

  if (consejos.length === 0) {
    caja.style.display = "none";
    return;
  }

  caja.style.display = "";

  for (var i = 0; i < consejos.length; i++) {
    var item = document.createElement("li");
    item.textContent = consejos[i];
    lista.appendChild(item);
  }
}

function leerInvernadero() {
  try {
    var guardado = localStorage.getItem(INVERNADERO_STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : null;
  } catch (error) {
    return null;
  }
}

function guardarInvernaderoEnStorage(datos) {
  try {
    localStorage.setItem(INVERNADERO_STORAGE_KEY, JSON.stringify(datos));
  } catch (error) {
    console.error("[Agromatical] No se pudo guardar el invernadero:", error);
    alert("No se pudo guardar el invernadero (puede que la foto sea muy pesada para guardar en este navegador).");
  }
}

function valorODefecto(valor, defecto) {
  var numero = parseFloat(valor);
  return isNaN(numero) ? defecto : numero;
}

function abrirModalInvernadero() {
  var datos = leerInvernadero();

  if (datos) {
    document.getElementById("invernaderoNombreInput").value = datos.nombre;
    document.getElementById("invernaderoPlantasInput").value = datos.plantas;
    document.getElementById("invTempIdealInput").value = valorODefecto(datos.tempIdeal, 22);
    document.getElementById("invMargenAtencionInput").value = valorODefecto(datos.margenAtencion, 3);
    document.getElementById("invMargenCriticoInput").value = valorODefecto(datos.margenCritico, 6);
    fondoSeleccionadoInvernadero = datos.fondo;
    fotoPersonalizadaInvernadero = esFotoPersonalizada(datos.fondo) ? datos.fondo : null;
  } else {
    document.getElementById("invernaderoNombreInput").value = "";
    document.getElementById("invernaderoPlantasInput").value = "";
    document.getElementById("invTempIdealInput").value = 22;
    document.getElementById("invMargenAtencionInput").value = 3;
    document.getElementById("invMargenCriticoInput").value = 6;
    fondoSeleccionadoInvernadero = FONDOS_INVERNADERO[0].id;
    fotoPersonalizadaInvernadero = null;
  }

  var inputArchivo = document.getElementById("fondoArchivoInput");
  if (inputArchivo) {
    inputArchivo.value = "";
  }

  construirFondoPicker();
  document.getElementById("invernaderoModalOverlay").classList.add("open");
}

function cerrarModalInvernadero() {
  document.getElementById("invernaderoModalOverlay").classList.remove("open");
}

function guardarInvernadero() {
  var nombre = document.getElementById("invernaderoNombreInput").value.trim();
  var plantas = document.getElementById("invernaderoPlantasInput").value.trim();

  if (!nombre) {
    alert("Ponele un nombre a tu invernadero.");
    return;
  }

  var tempIdeal = valorODefecto(document.getElementById("invTempIdealInput").value, 22);
  var margenAtencion = valorODefecto(document.getElementById("invMargenAtencionInput").value, 3);
  var margenCritico = valorODefecto(document.getElementById("invMargenCriticoInput").value, 6);

  if (margenCritico <= margenAtencion) {
    alert("El margen crítico tiene que ser más grande que el margen para avisar.");
    return;
  }

  var anterior = leerInvernadero();
  var nuevosDatos = {
    nombre: nombre,
    plantas: plantas,
    fondo: fondoSeleccionadoInvernadero,
    tempIdeal: tempIdeal,
    margenAtencion: margenAtencion,
    margenCritico: margenCritico
  };

  guardarInvernaderoEnStorage(nuevosDatos);

  if (!anterior && typeof borrarChatInvernadero === "function") {
    borrarChatInvernadero();
  }
  if (anterior && anterior.plantas !== plantas && typeof avisarCambioDePlantas === "function") {
    avisarCambioDePlantas(nuevosDatos);
  }

  cerrarModalInvernadero();
  mostrarInvernadero();
}

function borrarInvernadero() {
  localStorage.removeItem(INVERNADERO_STORAGE_KEY);
  if (typeof borrarChatInvernadero === "function") {
    borrarChatInvernadero();
  }
  mostrarInvernadero();
}

function mostrarInvernadero() {
  var datos = leerInvernadero();
  var cta = document.getElementById("invernaderoCta");
  var card = document.getElementById("invernaderoCard");

  if (!cta || !card) {
    return;
  }

  var chat = document.getElementById("chatInvernadero");

  if (!datos) {
    cta.style.display = "";
    card.style.display = "none";
    if (chat) {
      chat.style.display = "none";
    }
    return;
  }

  cta.style.display = "none";
  card.style.display = "";

  document.getElementById("invernaderoFondo").style.backgroundImage = "url('" + archivoDeFondo(datos.fondo) + "')";
  document.getElementById("invernaderoNombre").innerText = datos.nombre;
  document.getElementById("invernaderoPlantas").innerText = datos.plantas || "Sin plantas cargadas todavía.";

  renderizarTipsPlantas(datos.plantas);
  actualizarClimaInvernadero((typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado) ? ultimoClimaMostrado : {});

  if (typeof ultimoSensor !== "undefined" && ultimoSensor && typeof evaluarEstadoPlanta === "function") {
    evaluarEstadoPlanta(ultimoSensor.temperatura);
  }

  if (typeof consultarDatosInvernadero === "function") {
    consultarDatosInvernadero();
  }

  if (typeof mostrarChatInvernadero === "function") {
    mostrarChatInvernadero(datos);
  }
}

function actualizarCieloInvernadero(clima) {
  var contenedor = document.getElementById("invernaderoCielo");
  var icono = document.getElementById("invernaderoCieloIcono");
  var texto = document.getElementById("invernaderoCieloTexto");

  if (!contenedor || !icono || !texto) {
    return;
  }

  if (!clima || !clima.descripcion || clima.descripcion === "Sin dato") {
    contenedor.style.display = "none";
    return;
  }

  contenedor.style.display = "";
  texto.textContent = clima.descripcion;
  icono.innerHTML = (typeof getWeatherIconSvg === "function") ? getWeatherIconSvg(clima.descripcion) : "";
}

function renderizarPronostico(pronostico) {
  var contenedor = document.getElementById("invernaderoPronostico");
  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  if (!pronostico || pronostico.length === 0) {
    return;
  }

  for (var i = 0; i < pronostico.length && i < 3; i++) {
    var dia = pronostico[i];
    var tarjeta = document.createElement("div");
    tarjeta.className = "pronostico-dia";

    var icono = (typeof getWeatherIconSvg === "function") ? getWeatherIconSvg(dia.descripcion) : "";
    var maxTexto = (dia.tempMax !== null && dia.tempMax !== undefined) ? Math.round(dia.tempMax) + "°" : "--";
    var minTexto = (dia.tempMin !== null && dia.tempMin !== undefined) ? Math.round(dia.tempMin) + "°" : "--";

    tarjeta.innerHTML =
      "<span class=\"pronostico-dia-etiqueta\">" + dia.etiqueta + "</span>" +
      "<span class=\"pronostico-dia-icono\">" + icono + "</span>" +
      "<span class=\"pronostico-dia-desc\">" + dia.descripcion + "</span>" +
      "<span class=\"pronostico-dia-temp\">" + maxTexto + " / " + minTexto + "</span>";

    contenedor.appendChild(tarjeta);
  }
}

function generarAlertas(clima) {
  var alertas = [];

  if (!clima) {
    return alertas;
  }

  if (clima.temperatura !== null && clima.temperatura !== undefined && clima.temperatura <= 3) {
    alertas.push({ tipo: "helada", texto: "Hay riesgo de helada ahora mismo (" + Math.round(clima.temperatura) + "°). Cubrí las plantas más sensibles o metélas adentro si podés." });
  }

  if (clima.pronostico) {
    for (var i = 0; i < clima.pronostico.length && i < 3; i++) {
      var dia = clima.pronostico[i];
      if (dia.tempMin !== null && dia.tempMin !== undefined && dia.tempMin <= 2) {
        var cuando = "el " + dia.etiqueta.toLowerCase();
        if (i === 0) {
          cuando = "esta noche";
        } else if (i === 1) {
          cuando = "mañana";
        }
        alertas.push({ tipo: "helada", texto: "Se espera helada " + cuando + " (mínima de " + Math.round(dia.tempMin) + "°). Prepará una cobertura para las plantas." });
      }
    }
  }

  if (clima.temperatura !== null && clima.temperatura !== undefined && clima.temperatura >= 32) {
    alertas.push({ tipo: "ventilacion", texto: "Hace mucho calor (" + Math.round(clima.temperatura) + "°) para tener el invernadero cerrado. Abrí las ventilaciones o la puerta para que no se cocinen las plantas." });
  }

  if (clima.humedad !== null && clima.humedad !== undefined && clima.humedad >= 90 &&
      clima.temperatura !== null && clima.temperatura !== undefined && clima.temperatura >= 20) {
    alertas.push({ tipo: "ventilacion", texto: "Humedad muy alta (" + Math.round(clima.humedad) + "%) con calor adentro. Ventilá un rato para que no aparezcan hongos en las hojas." });
  }

  return alertas;
}

function renderizarAlertas(alertas) {
  var contenedor = document.getElementById("invernaderoAlertas");
  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  if (!alertas || alertas.length === 0) {
    contenedor.style.display = "none";
    return;
  }

  contenedor.style.display = "";

  for (var i = 0; i < alertas.length; i++) {
    var aviso = document.createElement("div");
    aviso.className = "alerta-invernadero alerta-" + alertas[i].tipo;
    aviso.textContent = alertas[i].texto;
    contenedor.appendChild(aviso);
  }
}

function hayDatosRealesDeLaPlaca() {
  return typeof ultimoSensor !== "undefined" && ultimoSensor && !ultimoSensor.simulado;
}

function climaAdentro(clima) {
  var copia = {};
  for (var clave in clima) {
    copia[clave] = clima[clave];
  }

  if (hayDatosRealesDeLaPlaca()) {
    if (ultimoSensor.temperatura !== null) {
      copia.temperatura = ultimoSensor.temperatura;
    }
    if (ultimoSensor.humedad !== null) {
      copia.humedad = ultimoSensor.humedad;
    }
  }
  return copia;
}

function climaParaRiego() {
  var afuera = (typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado) ? ultimoClimaMostrado : {};
  return climaAdentro(afuera);
}

function actualizarClimaInvernadero(clima) {
  setTextoSiExiste("invTemp", (clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) : "--");
  setTextoSiExiste("invHumedad", (clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : "--");
  setTextoSiExiste("invViento", (clima.viento !== null && clima.viento !== undefined) ? Math.round(clima.viento) : "--");

  var adentro = climaAdentro(clima);
  actualizarHorariosRiego(adentro);
  actualizarCieloInvernadero(clima);
  renderizarPronostico(clima.pronostico);
  renderizarAlertas(generarAlertas(adentro));
}

function generarHorariosRiego(clima) {
  if (!clima || clima.temperatura === null || clima.temperatura === undefined) {
    return { horarios: [], mensaje: "Esperando los datos del clima para armar el horario de riego." };
  }

  if (clima.precipitacion !== null && clima.precipitacion !== undefined && clima.precipitacion > 0) {
    return { horarios: [], mensaje: "Está lloviendo (o llovió hace poco: " + clima.precipitacion + " mm). Hoy no hace falta regar." };
  }

  if (clima.humedad !== null && clima.humedad !== undefined && clima.humedad >= 85) {
    return { horarios: [], mensaje: "La humedad ya está muy alta (" + Math.round(clima.humedad) + "%). Mejor no regar hoy, podrías generar hongos." };
  }

  if (clima.temperatura <= 5) {
    return { horarios: ["10:00"], mensaje: "Hace mucho frío (" + Math.round(clima.temperatura) + "°). Alcanza con un riego liviano a media mañana; regar de más puede pudrir la raíz." };
  }

  if (clima.temperatura >= 30) {
    return { horarios: ["06:30", "20:30"], mensaje: "Va a hacer mucho calor (" + Math.round(clima.temperatura) + "°). Conviene regar bien temprano y de noche, para que el agua no se evapore de golpe." };
  }

  if (clima.temperatura >= 22) {
    return { horarios: ["07:00", "19:30"], mensaje: "Buen día para regar dos veces: temprano a la mañana y al atardecer." };
  }

  return { horarios: ["08:30"], mensaje: "El clima está templado, con un riego a media mañana alcanza." };
}

function actualizarHorariosRiego(clima) {
  var caja = document.getElementById("horariosRiegoMensaje");
  var lista = document.getElementById("horariosRiegoLista");
  if (!caja || !lista) {
    return;
  }

  var datosClima = clima || climaParaRiego();
  var resultado = generarHorariosRiego(datosClima);

  caja.textContent = resultado.mensaje;
  caja.className = "consejo-riego " + (resultado.horarios.length > 0 ? "consejo-bueno" : "consejo-malo");

  lista.innerHTML = "";
  for (var i = 0; i < resultado.horarios.length; i++) {
    var chip = document.createElement("span");
    chip.className = "horario-chip";
    chip.textContent = resultado.horarios[i];
    lista.appendChild(chip);
  }
}

mostrarInvernadero();
