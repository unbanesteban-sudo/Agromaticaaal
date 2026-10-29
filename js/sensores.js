var SENSOR_CONFIG = {
  url: "http://192.168.4.1/",
  cadaMs: 3000,
  esperaMaxMs: 2500,
  maxPuntos: 9
};

var IP_PLACA_KEY = "agromaticalIpPlaca";

var ultimoSensor = null;
var consultandoSensor = false;
var avisoSimulacionMostrado = false;

var graficoTemperatura = null;
var graficoHumedad = null;
var graficoLuminosidad = null;

function cargarIpGuardada() {
  try {
    var guardada = localStorage.getItem(IP_PLACA_KEY);
    if (guardada) {
      SENSOR_CONFIG.url = guardada;
    }
  } catch (error) {
    return;
  }
}

function cambiarIpPlaca() {
  var actual = SENSOR_CONFIG.url.replace("http://", "").replace("/", "");
  var nueva = prompt("Escribí la IP que muestra la pantallita OLED de la placa:", actual);
  if (!nueva) {
    return;
  }

  nueva = nueva.trim().replace("http://", "").replace(/\/+$/, "");
  SENSOR_CONFIG.url = "http://" + nueva + "/";
  try {
    localStorage.setItem(IP_PLACA_KEY, SENSOR_CONFIG.url);
  } catch (error) {
    console.warn("[Agromatical] No se pudo guardar la IP de la placa.");
  }
  mostrarIpPlaca();
  consultarDatosInvernadero();
}

function mostrarIpPlaca() {
  setTextoSiExiste("sensorIp", SENSOR_CONFIG.url.replace("http://", "").replace("/", ""));
}

function crearGrafico(idCanvas, colorLinea, colorRelleno) {
  var canvas = document.getElementById(idCanvas);
  if (!canvas || typeof Chart === "undefined") {
    return null;
  }

  return new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: colorLinea,
        backgroundColor: colorRelleno,
        borderWidth: 2,
        pointRadius: 2,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          grid: { color: "rgba(31, 42, 28, 0.06)" },
          ticks: { color: "#5f6b5a", font: { size: 10 }, maxTicksLimit: 4 }
        }
      }
    }
  });
}

function inicializarGraficos() {
  if (typeof Chart === "undefined") {
    console.warn("[Agromatical] No cargó Chart.js, se muestran los datos sin gráficos.");
    return;
  }
  if (!graficoTemperatura) {
    graficoTemperatura = crearGrafico("graficoTemperatura", "#e8590c", "rgba(232, 89, 12, 0.12)");
  }
  if (!graficoHumedad) {
    graficoHumedad = crearGrafico("graficoHumedad", "#2b8fbf", "rgba(43, 143, 191, 0.12)");
  }
  if (!graficoLuminosidad) {
    graficoLuminosidad = crearGrafico("graficoLuminosidad", "#7cc142", "rgba(124, 193, 66, 0.15)");
  }
}

function agregarDatoGrafico(grafico, etiqueta, valor) {
  if (!grafico || valor === null) {
    return;
  }
  if (grafico.data.labels.length >= SENSOR_CONFIG.maxPuntos) {
    grafico.data.labels.shift();
    grafico.data.datasets[0].data.shift();
  }
  grafico.data.labels.push(etiqueta);
  grafico.data.datasets[0].data.push(valor);
  grafico.update();
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

  if (!datos || !badge || !mensaje || !caja || tempActual === null) {
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
  if (temperatura >= 18 && temperatura <= 26) {
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
  if (luz < 50) {
    nota.className = "kpi-nota amarillo";
    nota.textContent = "Luminosidad baja";
  } else {
    nota.className = "kpi-nota verde";
    nota.textContent = "Luminosidad adecuada";
  }
}

function mostrarConexion(simulado) {
  var etiqueta = document.getElementById("sensorConexion");
  if (!etiqueta) {
    return;
  }
  if (simulado) {
    etiqueta.className = "sensor-conexion sensor-simulado";
    etiqueta.textContent = "Simulación: no se encontró la placa";
  } else {
    etiqueta.className = "sensor-conexion sensor-conectado";
    etiqueta.textContent = "Conectado a la placa";
  }
}

function recibirDatosSensor(temperatura, humedad, luz, simulado) {
  var hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  ultimoSensor = {
    temperatura: temperatura,
    humedad: humedad,
    luz: luz,
    simulado: simulado,
    hora: hora
  };

  mostrarConexion(simulado);
  setTextoSiExiste("sensorTemp", temperatura !== null ? temperatura.toFixed(1) : "--");
  setTextoSiExiste("sensorHum", humedad !== null ? Math.round(humedad) : "--");
  setTextoSiExiste("sensorLuz", luz !== null ? Math.round(luz) : "--");
  setTextoSiExiste("sensorHora", hora);

  if (temperatura !== null) {
    actualizarNotaTemperatura(temperatura);
    evaluarEstadoPlanta(temperatura);
  }
  if (luz !== null) {
    actualizarNotaLuz(luz);
  }

  inicializarGraficos();
  agregarDatoGrafico(graficoTemperatura, hora, temperatura);
  agregarDatoGrafico(graficoHumedad, hora, humedad);
  agregarDatoGrafico(graficoLuminosidad, hora, luz);

  if (!simulado && typeof actualizarClimaInvernadero === "function") {
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

function usarSimulacion(error) {
  if (!avisoSimulacionMostrado) {
    console.warn("[Agromatical] No se pudo conectar con la placa ESP32 (" + SENSOR_CONFIG.url + "), se usan datos simulados:", error);
    avisoSimulacionMostrado = true;
  }
  recibirDatosSensor(20 + Math.random() * 8, 50 + Math.random() * 15, 40 + Math.random() * 20, true);
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
      avisoSimulacionMostrado = false;
      recibirDatosSensor(
        leerValor(datos, ["temperatura", "temp"]),
        leerValor(datos, ["humedad", "hum"]),
        leerValor(datos, ["luz", "luminosidad"]),
        false
      );
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      consultandoSensor = false;
      usarSimulacion(error);
    });
}

cargarIpGuardada();
mostrarIpPlaca();
consultarDatosInvernadero();
setInterval(consultarDatosInvernadero, SENSOR_CONFIG.cadaMs);
