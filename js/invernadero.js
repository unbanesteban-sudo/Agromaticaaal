var FONDOS_INVERNADERO = [
  { id: "fondo1", archivo: "assets/invernaderos/fondo-1.svg", nombre: "Verde" },
  { id: "fondo2", archivo: "assets/invernaderos/fondo-2.svg", nombre: "Atardecer" },
  { id: "fondo3", archivo: "assets/invernaderos/fondo-3.svg", nombre: "Tierra" },
  { id: "fondo4", archivo: "assets/invernaderos/fondo-4.svg", nombre: "Cielo" }
];

var INVERNADERO_STORAGE_KEY = "agromaticalInvernadero";
var fondoSeleccionadoInvernadero = FONDOS_INVERNADERO[0].id;

function archivoDeFondo(id) {
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
}

function elegirFondoInvernadero(id) {
  fondoSeleccionadoInvernadero = id;
  construirFondoPicker();
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
  }
}

function abrirModalInvernadero() {
  var datos = leerInvernadero();

  if (datos) {
    document.getElementById("invernaderoNombreInput").value = datos.nombre;
    document.getElementById("invernaderoPlantasInput").value = datos.plantas;
    fondoSeleccionadoInvernadero = datos.fondo;
  } else {
    document.getElementById("invernaderoNombreInput").value = "";
    document.getElementById("invernaderoPlantasInput").value = "";
    fondoSeleccionadoInvernadero = FONDOS_INVERNADERO[0].id;
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

  guardarInvernaderoEnStorage({
    nombre: nombre,
    plantas: plantas,
    fondo: fondoSeleccionadoInvernadero
  });

  cerrarModalInvernadero();
  mostrarInvernadero();
}

function borrarInvernadero() {
  localStorage.removeItem(INVERNADERO_STORAGE_KEY);
  mostrarInvernadero();
}

function mostrarInvernadero() {
  var datos = leerInvernadero();
  var cta = document.getElementById("invernaderoCta");
  var card = document.getElementById("invernaderoCard");

  if (!cta || !card) {
    return;
  }

  if (!datos) {
    cta.style.display = "";
    card.style.display = "none";
    return;
  }

  cta.style.display = "none";
  card.style.display = "";

  document.getElementById("invernaderoFondo").style.backgroundImage = "url('" + archivoDeFondo(datos.fondo) + "')";
  document.getElementById("invernaderoNombre").innerText = datos.nombre;
  document.getElementById("invernaderoPlantas").innerText = datos.plantas || "Sin plantas cargadas todavía.";

  actualizarHorariosRiego();

  if (typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado) {
    actualizarClimaInvernadero(ultimoClimaMostrado);
  }
}

function actualizarClimaInvernadero(clima) {
  setTextoSiExiste("invTemp", (clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) : "--");
  setTextoSiExiste("invHumedad", (clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : "--");
  setTextoSiExiste("invViento", (clima.viento !== null && clima.viento !== undefined) ? Math.round(clima.viento) : "--");
  actualizarHorariosRiego(clima);
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

  var datosClima = clima || (typeof ultimoClimaMostrado !== "undefined" ? ultimoClimaMostrado : null);
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
