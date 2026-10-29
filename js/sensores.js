var SENSOR_CONFIG = {
  url: "http://192.168.4.1/",
  cadaMs: 3000,
  esperaMaxMs: 2500
};

var IP_SERVIDOR_KEY = "agromaticalIpPlaca";

var ultimoSensor = null;
var sensorConectado = false;
var consultandoSensor = false;
var avisoSinConexionMostrado = false;

function cargarIpGuardada() {
  try {
    var guardada = localStorage.getItem(IP_SERVIDOR_KEY);
    if (guardada) {
      SENSOR_CONFIG.url = guardada;
    }
  } catch (error) {
    return;
  }
}

function ipSinFormato() {
  return SENSOR_CONFIG.url.replace("http://", "").replace(/\/+$/, "");
}

function cambiarIpPlaca() {
  var nueva = prompt("Escribí la IP del servidor del profe:", ipSinFormato());
  if (!nueva) {
    return;
  }

  nueva = nueva.trim().replace("http://", "").replace(/\/+$/, "");
  SENSOR_CONFIG.url = "http://" + nueva + "/";
  try {
    localStorage.setItem(IP_SERVIDOR_KEY, SENSOR_CONFIG.url);
  } catch (error) {
    console.warn("[Agromatical] No se pudo guardar la IP del servidor.");
  }
  mostrarIpPlaca();
  consultarDatosInvernadero();
}

function mostrarIpPlaca() {
  setTextoSiExiste("sensorIp", ipSinFormato());
}

function numeroODefecto(valor, defecto) {
  var numero = parseFloat(valor);
  return isNaN(numero) ? defecto : numero;
}

function evaluarEstadoPlanta(tempActual) {
  var datos = leerInvernadero();
  var badge = document.getElementById("estadoBadge");
  var mensaje = document.getElementById("estadoMensaje");
  var caja = document.getElementById("estadoPlanta");

  if (!datos || !badge || !mensaje || !caja) {
    return;
  }

  if (!sensorConectado || tempActual === null || tempActual === undefined) {
    caja.className = "estado-planta";
    badge.textContent = "SIN DATOS";
    mensaje.textContent = "No hay conexión con el servidor del profe (" + ipSinFormato() + "). Esa dirección solo funciona conectado a la red de la escuela.";
    setTextoSiExiste("estadoRango", "");
    return;
  }

  var ideal = numeroODefecto(datos.tempIdeal, 22);
  var margenAtencion = numeroODefecto(datos.margenAtencion, 3);
  var margenCritico = numeroODefecto(datos.margenCritico, 6);
  var diferencia = Math.abs(tempActual - ideal);

  setTextoSiExiste("estadoRango", "Rango ideal: " + (ideal - margenAtencion).toFixed(1) + " - " + (ideal + margenAtencion).toFixed(1) + " °C · Ahora: " + tempActual.toFixed(1) + " °C");

  if (diferencia >= margenCritico) {
    caja.className = "estado-planta estado-critico";
    badge.textContent = "CRÍTICO";
    mensaje.textContent = "¡Atención! La temperatura está " + (tempActual > ideal ? "demasiado alta" : "demasiado baja") + " para tus plantas.";
  } else if (diferencia >= margenAtencion) {
    caja.className = "estado-planta estado-atencion";
    badge.textContent = "NECESITA ATENCIÓN";
    mensaje.textContent = "La temperatura se está alejando del rango ideal.";
  } else {
    caja.className = "estado-planta estado-normal";
    badge.textContent = "NORMAL";
    mensaje.textContent = "El ambiente está dentro de las condiciones ideales para tus plantas.";
  }
}

function actualizarNotaTemperatura(temperatura) {
  var nota = document.getElementById("sensorTempNota");
  if (!nota) {
    return;
  }
  if (temperatura === null) {
    nota.className = "kpi-nota";
    nota.textContent = "";
  } else if (temperatura >= 18 && temperatura <= 26) {
    nota.className = "kpi-nota verde";
    nota.textContent = "Rango óptimo (18 - 26 °C)";
  } else {
    nota.className = "kpi-nota amarillo";
    nota.textContent = "Fuera del rango óptimo";
  }
}

function actualizarNotaLuz(luz) {
  var nota = document.getElementById("sensorLuzNota");
  if (!nota) {
    return;
  }
  if (luz === null) {
    nota.className = "kpi-nota";
    nota.textContent = "";
  } else if (luz < 50) {
    nota.className = "kpi-nota amarillo";
    nota.textContent = "Luminosidad baja";
  } else {
    nota.className = "kpi-nota verde";
    nota.textContent = "Luminosidad adecuada";
  }
}

function mostrarConexion() {
  var etiqueta = document.getElementById("sensorConexion");
  if (!etiqueta) {
    return;
  }
  if (sensorConectado) {
    etiqueta.className = "sensor-conexion sensor-conectado";
    etiqueta.textContent = "Conectado al servidor del profe";
  } else {
    etiqueta.className = "sensor-conexion sensor-desconectado";
    etiqueta.textContent = "Sin conexión con el servidor del profe";
  }
}

function recibirDatosSensor(temperatura, humedad, luz) {
  sensorConectado = true;
  ultimoSensor = {
    temperatura: temperatura,
    humedad: humedad,
    luz: luz,
    hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  };

  mostrarConexion();
  setTextoSiExiste("sensorTemp", temperatura !== null ? temperatura.toFixed(1) : "--");
  setTextoSiExiste("sensorHum", humedad !== null ? Math.round(humedad) : "--");
  setTextoSiExiste("sensorLuz", luz !== null ? Math.round(luz) : "--");
  setTextoSiExiste("sensorHora", ultimoSensor.hora);

  actualizarNotaTemperatura(temperatura);
  actualizarNotaLuz(luz);
  evaluarEstadoPlanta(temperatura);

  if (typeof actualizarClimaInvernadero === "function") {
    actualizarClimaInvernadero(ultimoClimaMostrado || {});
  }
}

function sinConexionConServidor(error) {
  var estabaConectado = sensorConectado;
  sensorConectado = false;

  if (!avisoSinConexionMostrado) {
    console.warn("[Agromatical] No se pudo conectar con el servidor del profe (" + SENSOR_CONFIG.url + "):", error);
    avisoSinConexionMostrado = true;
  }

  mostrarConexion();
  evaluarEstadoPlanta(null);

  if (!ultimoSensor) {
    setTextoSiExiste("sensorTemp", "--");
    setTextoSiExiste("sensorHum", "--");
    setTextoSiExiste("sensorLuz", "--");
  }

  if (estabaConectado && typeof actualizarClimaInvernadero === "function") {
    actualizarClimaInvernadero(ultimoClimaMostrado || {});
  }
}

function leerValor(datos, nombres) {
  for (var i = 0; i < nombres.length; i++) {
    var valor = datos[nombres[i]];
    if (valor !== undefined && valor !== null && !isNaN(parseFloat(valor))) {
      return parseFloat(valor);
    }
  }
  return null;
}

function consultarDatosInvernadero() {
  if (consultandoSensor || !leerInvernadero()) {
    return;
  }

  consultandoSensor = true;
  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, SENSOR_CONFIG.esperaMaxMs);

  fetch(SENSOR_CONFIG.url, { signal: controller.signal })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (datos) {
      clearTimeout(timeoutId);
      consultandoSensor = false;
      avisoSinConexionMostrado = false;
      recibirDatosSensor(
        leerValor(datos, ["temperatura", "temp"]),
        leerValor(datos, ["humedad", "hum"]),
        leerValor(datos, ["luz", "luminosidad"])
      );
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      consultandoSensor = false;
      sinConexionConServidor(error);
    });
}

cargarIpGuardada();
mostrarIpPlaca();
consultarDatosInvernadero();
setInterval(consultarDatosInvernadero, SENSOR_CONFIG.cadaMs);
