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

  renderizarTablaRiegos(datos.riegos);
  actualizarConsejoRiego();

  if (typeof ultimoClimaMostrado !== "undefined" && ultimoClimaMostrado) {
    actualizarClimaInvernadero(ultimoClimaMostrado);
  }
}

function actualizarClimaInvernadero(clima) {
  setTextoSiExiste("invTemp", (clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) : "--");
  setTextoSiExiste("invHumedad", (clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : "--");
  setTextoSiExiste("invViento", (clima.viento !== null && clima.viento !== undefined) ? Math.round(clima.viento) : "--");
  actualizarConsejoRiego(clima);
}

function calcularConsejoRiego(clima) {
  var hora = new Date().getHours();

  if (!clima || clima.temperatura === null || clima.temperatura === undefined) {
    return { bueno: false, texto: "Todavía no hay datos del clima para darte un consejo de riego." };
  }

  if (clima.humedad !== null && clima.humedad !== undefined && clima.humedad >= 80) {
    return { bueno: false, texto: "La humedad ya está muy alta (" + Math.round(clima.humedad) + "%). Regar ahora puede generar hongos en las plantas, mejor esperá a que baje." };
  }

  if (clima.temperatura <= 5) {
    return { bueno: false, texto: "Hace mucho frío (" + Math.round(clima.temperatura) + "°). Con temperaturas tan bajas las plantas casi no consumen agua, regar de más puede pudrir la raíz." };
  }

  if (hora >= 11 && hora <= 16) {
    return { bueno: false, texto: "El sol está fuerte a esta hora (" + hora + " hs). El agua que queda en las hojas actúa como lupa y las puede quemar, y además se evapora antes de que la planta la aproveche. Mejor esperá a la mañana temprano o el atardecer." };
  }

  if ((hora >= 6 && hora <= 10) || (hora >= 18 && hora <= 20)) {
    return { bueno: true, texto: "Buen momento para regar: el sol no pega tan fuerte a esta hora y el agua se aprovecha mejor." };
  }

  return { bueno: false, texto: "De noche las plantas casi no absorben agua y el ambiente queda húmedo mucho tiempo. Mejor esperá a la mañana temprano." };
}

function actualizarConsejoRiego(clima) {
  var caja = document.getElementById("consejoRiego");
  if (!caja) {
    return;
  }

  var datosClima = clima || (typeof ultimoClimaMostrado !== "undefined" ? ultimoClimaMostrado : null);
  var consejo = calcularConsejoRiego(datosClima);

  caja.textContent = consejo.texto;
  caja.className = "consejo-riego " + (consejo.bueno ? "consejo-bueno" : "consejo-malo");
}

function registrarRiego() {
  var datos = leerInvernadero();
  if (!datos) {
    return;
  }

  if (!datos.riegos) {
    datos.riegos = [];
  }

  var clima = (typeof ultimoClimaMostrado !== "undefined") ? ultimoClimaMostrado : null;
  var ahora = new Date();

  datos.riegos.unshift({
    fecha: ahora.toLocaleDateString("es-AR"),
    hora: ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    temperatura: (clima && clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) : null,
    humedad: (clima && clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : null
  });

  guardarInvernaderoEnStorage(datos);
  renderizarTablaRiegos(datos.riegos);
}

function borrarRiego(indice) {
  var datos = leerInvernadero();
  if (!datos || !datos.riegos) {
    return;
  }

  datos.riegos.splice(indice, 1);
  guardarInvernaderoEnStorage(datos);
  renderizarTablaRiegos(datos.riegos);
}

function renderizarTablaRiegos(riegos) {
  var cuerpo = document.getElementById("tablaRiegosBody");
  var vacio = document.getElementById("tablaRiegosVacio");
  var tabla = document.getElementById("tablaRiegosWrap");

  if (!cuerpo) {
    return;
  }

  riegos = riegos || [];
  cuerpo.innerHTML = "";

  if (vacio) {
    vacio.style.display = riegos.length === 0 ? "" : "none";
  }
  if (tabla) {
    tabla.style.display = riegos.length === 0 ? "none" : "";
  }

  for (var i = 0; i < riegos.length; i++) {
    var riego = riegos[i];
    var fila = document.createElement("tr");

    var celdaFecha = document.createElement("td");
    celdaFecha.textContent = riego.fecha;

    var celdaHora = document.createElement("td");
    celdaHora.textContent = riego.hora;

    var celdaTemp = document.createElement("td");
    celdaTemp.textContent = (riego.temperatura !== null && riego.temperatura !== undefined) ? riego.temperatura + "°" : "--";

    var celdaHum = document.createElement("td");
    celdaHum.textContent = (riego.humedad !== null && riego.humedad !== undefined) ? riego.humedad + "%" : "--";

    var celdaAccion = document.createElement("td");
    var botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.className = "riego-borrar";
    botonBorrar.textContent = "×";
    botonBorrar.setAttribute("onclick", "borrarRiego(" + i + ")");
    celdaAccion.appendChild(botonBorrar);

    fila.appendChild(celdaFecha);
    fila.appendChild(celdaHora);
    fila.appendChild(celdaTemp);
    fila.appendChild(celdaHum);
    fila.appendChild(celdaAccion);
    cuerpo.appendChild(fila);
  }
}

mostrarInvernadero();
