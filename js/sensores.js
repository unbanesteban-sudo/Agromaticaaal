// Lo explica: Roman
// Chicos, esta es la conexión con el servidor del profe (la Raspberry del taller).
// Cada 3 segundos le pedimos la temperatura, la humedad y la luz de ADENTRO del
// invernadero. Es una IP de la red local (192.168.4.1), así que solo anda estando
// conectados a la red de la escuela. Si no responde, mostramos "Sin conexión".

var SERVIDOR_PROFE = {
  url: "http://192.168.4.1/",
  cadaMs: 3000,
  esperaMaxMs: 2500
};

var datosDelProfe = null;
var conectadoAlProfe = false;
var esperandoRespuesta = false;

function hayConexionConElProfe() {
  return conectadoAlProfe && datosDelProfe !== null;
}

function cambiarIpPlaca() {
  var ipActual = SERVIDOR_PROFE.url.replace("http://", "").replace("/", "");
  var nueva = prompt("Escribí la IP del servidor del profe:", ipActual);
  if (!nueva) {
    return;
  }
  SERVIDOR_PROFE.url = "http://" + nueva.trim() + "/";
  localStorage.setItem("agromaticalIpProfe", SERVIDOR_PROFE.url);
  setTextoSiExiste("sensorIp", nueva.trim());
  consultarServidorDelProfe();
}

function mostrarEstadoPlanta() {
  var datos = leerInvernadero();
  var caja = document.getElementById("estadoPlanta");

  if (!hayConexionConElProfe() || !datos) {
    caja.className = "estado-planta";
    setTextoSiExiste("estadoBadge", "SIN DATOS");
    setTextoSiExiste("estadoMensaje", "No hay conexión con el servidor del profe. Solo funciona conectado a la red de la escuela.");
    setTextoSiExiste("estadoRango", "");
    return;
  }

  var temperatura = datosDelProfe.temperatura;
  var estado = estadoDeLaPlanta(temperatura, datos.tempIdeal, datos.margenAtencion, datos.margenCritico);

  caja.className = "estado-planta " + estado.clase;
  setTextoSiExiste("estadoBadge", estado.etiqueta);
  setTextoSiExiste("estadoMensaje", estado.mensaje);
  setTextoSiExiste("estadoRango", "Rango ideal: " + (datos.tempIdeal - datos.margenAtencion) + " a " + (datos.tempIdeal + datos.margenAtencion) + " °C · Ahora: " + temperatura.toFixed(1) + " °C");
}

// Los dos avisos que pidió el profe: temperatura entre 18 y 26 °C, y luz menor a 50.
function mostrarNotas(temperatura, luz) {
  var notaTemp = document.getElementById("sensorTempNota");
  var notaLuz = document.getElementById("sensorLuzNota");

  if (temperatura >= 18 && temperatura <= 26) {
    notaTemp.className = "kpi-nota verde";
    notaTemp.textContent = "Rango óptimo (18 - 26 °C)";
  } else {
    notaTemp.className = "kpi-nota amarillo";
    notaTemp.textContent = "Fuera del rango óptimo";
  }

  if (luz < 50) {
    notaLuz.className = "kpi-nota amarillo";
    notaLuz.textContent = "Luminosidad baja";
  } else {
    notaLuz.className = "kpi-nota verde";
    notaLuz.textContent = "Luminosidad adecuada";
  }
}

function mostrarConexion() {
  var etiqueta = document.getElementById("sensorConexion");
  if (conectadoAlProfe) {
    etiqueta.className = "sensor-conexion sensor-conectado";
    etiqueta.textContent = "Conectado al servidor del profe";
  } else {
    etiqueta.className = "sensor-conexion sensor-desconectado";
    etiqueta.textContent = "Sin conexión con el servidor del profe";
  }
}

function llegaronDatos(datos) {
  conectadoAlProfe = true;

  // No sabemos si el profe manda "temperatura" o "temp", así que aceptamos los dos nombres.
  datosDelProfe = {
    temperatura: parseFloat(datos.temperatura !== undefined ? datos.temperatura : datos.temp),
    humedad: parseFloat(datos.humedad !== undefined ? datos.humedad : datos.hum),
    luz: parseFloat(datos.luz !== undefined ? datos.luz : datos.luminosidad)
  };

  setTextoSiExiste("sensorTemp", datosDelProfe.temperatura.toFixed(1));
  setTextoSiExiste("sensorHum", Math.round(datosDelProfe.humedad));
  setTextoSiExiste("sensorLuz", Math.round(datosDelProfe.luz));
  setTextoSiExiste("sensorHora", new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));

  mostrarConexion();
  mostrarNotas(datosDelProfe.temperatura, datosDelProfe.luz);
  mostrarEstadoPlanta();
  actualizarClimaInvernadero();
}

function sinConexion() {
  var estabaConectado = conectadoAlProfe;
  conectadoAlProfe = false;
  mostrarConexion();
  mostrarEstadoPlanta();

  if (estabaConectado) {
    actualizarClimaInvernadero();
  }
}

function consultarServidorDelProfe() {
  if (esperandoRespuesta || !leerInvernadero()) {
    return;
  }

  esperandoRespuesta = true;
  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, SERVIDOR_PROFE.esperaMaxMs);

  fetch(SERVIDOR_PROFE.url, { signal: controller.signal })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (datos) {
      clearTimeout(timeoutId);
      esperandoRespuesta = false;
      llegaronDatos(datos);
    })
    .catch(function () {
      clearTimeout(timeoutId);
      esperandoRespuesta = false;
      sinConexion();
    });
}

function iniciarServidorDelProfe() {
  var ipGuardada = localStorage.getItem("agromaticalIpProfe");
  if (ipGuardada) {
    SERVIDOR_PROFE.url = ipGuardada;
  }
  setTextoSiExiste("sensorIp", SERVIDOR_PROFE.url.replace("http://", "").replace("/", ""));

  consultarServidorDelProfe();
  setInterval(consultarServidorDelProfe, SERVIDOR_PROFE.cadaMs);
}
