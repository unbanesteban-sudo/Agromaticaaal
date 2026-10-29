// Lo explica: Roman
// Chicos, este archivo trae el clima de AFUERA desde Open-Meteo (una API gratis, sin clave).
// Primero averigua la ciudad del usuario por su IP, y después pide el clima de ahora
// y el pronóstico de 7 días. Lo usan el Inicio, el Pronóstico y el Mapa.

var API_CONFIG = {
  climaUrl: "https://api.open-meteo.com/v1/forecast",
  ciudadesUrl: "https://geocoding-api.open-meteo.com/v1/search",
  datosDeAhora: "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,precipitation,weather_code",
  datosPorDia: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code",
  ciudadPorDefecto: "Cutral Co",
  esperaMaxMs: 6000
};

var ultimaUbicacion = null;
var ultimoClimaMostrado = null;

function setTextoSiExiste(id, texto) {
  var el = document.getElementById(id);
  if (el) {
    el.innerText = texto;
  }
}

function redondeado(valor, unidad) {
  if (valor === null || valor === undefined) {
    return "--";
  }
  return Math.round(valor) + (unidad || "");
}

// Si Open-Meteo no contesta en 6 segundos, cortamos el pedido y mostramos el error.
function pedirJSON(url) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, API_CONFIG.esperaMaxMs);

  return fetch(url, { signal: controller.signal })
    .then(function (respuesta) {
      clearTimeout(timeoutId);
      return respuesta.json();
    });
}

function buscarCoordenadas(nombreCiudad) {
  var url = API_CONFIG.ciudadesUrl + "?name=" + encodeURIComponent(nombreCiudad) + "&count=1&language=es";

  return pedirJSON(url)
    .then(function (data) {
      if (!data.results || data.results.length === 0) {
        return null;
      }
      var resultado = data.results[0];
      return { nombre: resultado.name, lat: resultado.latitude, lon: resultado.longitude };
    })
    .catch(function () {
      return null;
    });
}

// Open-Meteo no manda "soleado" o "lluvia", manda un número (código WMO). Acá lo traducimos.
function descripcionDelCodigo(codigo) {
  if (codigo === 0) {
    return "Despejado";
  }
  if (codigo === 1) {
    return "Mayormente despejado";
  }
  if (codigo === 2) {
    return "Parcialmente nublado";
  }
  if (codigo === 3 || codigo === 45 || codigo === 48) {
    return "Nublado";
  }
  if (codigo >= 51 && codigo <= 57) {
    return "Llovizna";
  }
  if (codigo >= 61 && codigo <= 67) {
    return "Lluvia";
  }
  if (codigo >= 71 && codigo <= 77) {
    return "Nieve";
  }
  if (codigo >= 80 && codigo <= 82) {
    return "Chubascos";
  }
  if (codigo >= 85 && codigo <= 86) {
    return "Nevadas";
  }
  if (codigo >= 95) {
    return "Tormenta";
  }
  return "Sin dato";
}

function nombreDelDia(fecha, numeroDeDia) {
  if (numeroDeDia === 0) {
    return "Hoy";
  }
  if (numeroDeDia === 1) {
    return "Mañana";
  }
  var dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[new Date(fecha + "T12:00:00").getDay()];
}

function fechaCorta(fecha) {
  var partes = fecha.split("-");
  return partes[2] + "/" + partes[1];
}

function pedirClima(lat, lon) {
  var url = API_CONFIG.climaUrl + "?latitude=" + lat + "&longitude=" + lon +
    "&current=" + API_CONFIG.datosDeAhora +
    "&daily=" + API_CONFIG.datosPorDia +
    "&forecast_days=7&timezone=auto";

  return pedirJSON(url).then(function (data) {
    var ahora = data.current;
    var dias = data.daily;
    var pronostico = [];

    for (var i = 0; i < dias.time.length; i++) {
      pronostico.push({
        etiqueta: nombreDelDia(dias.time[i], i),
        fecha: dias.time[i],
        fechaCorta: fechaCorta(dias.time[i]),
        tempMax: dias.temperature_2m_max[i],
        tempMin: dias.temperature_2m_min[i],
        precipitacion: dias.precipitation_sum[i],
        probLluvia: dias.precipitation_probability_max[i],
        viento: dias.wind_speed_10m_max[i],
        descripcion: descripcionDelCodigo(dias.weather_code[i])
      });
    }

    return {
      lat: lat,
      lon: lon,
      temperatura: ahora.temperature_2m,
      humedad: ahora.relative_humidity_2m,
      presion: ahora.pressure_msl,
      viento: ahora.wind_speed_10m,
      precipitacion: ahora.precipitation,
      descripcion: descripcionDelCodigo(ahora.weather_code),
      pronostico: pronostico,
      actualizado: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    };
  });
}

function mostrarClima(ciudad, clima) {
  clima.ciudad = ciudad;
  ultimoClimaMostrado = clima;

  setTextoSiExiste("weatherLocation", ciudad);
  setTextoSiExiste("weatherTemp", redondeado(clima.temperatura, "°"));
  setTextoSiExiste("weatherHumedad", redondeado(clima.humedad));
  setTextoSiExiste("weatherPresion", redondeado(clima.presion));
  setTextoSiExiste("weatherViento", redondeado(clima.viento));
  setTextoSiExiste("weatherLluvia", clima.precipitacion);
  setTextoSiExiste("weatherUpdated", clima.actualizado);
  setTextoSiExiste("weatherDesc", clima.descripcion);
  setTextoSiExiste("weatherEstado", "Datos actualizados");

  var icono = document.getElementById("weatherIcon");
  if (icono && typeof iconoDelClima === "function") {
    icono.innerHTML = iconoDelClima(clima.descripcion);
  }

  // Este archivo lo usan varias páginas, así que antes de avisarle al mapa,
  // al invernadero o al pronóstico me fijo que esa parte exista en la página.
  if (typeof actualizarMapa === "function") {
    actualizarMapa(clima.lat, clima.lon, ciudad, clima.temperatura);
  }
  if (typeof actualizarClimaInvernadero === "function") {
    actualizarClimaInvernadero();
  }
  if (typeof mostrarPronosticoSemana === "function") {
    mostrarPronosticoSemana(ciudad, clima.pronostico);
  }
}

function mostrarCargando(ciudad) {
  setTextoSiExiste("weatherLocation", ciudad);
  setTextoSiExiste("weatherTemp", "--");
  setTextoSiExiste("weatherHumedad", "--");
  setTextoSiExiste("weatherPresion", "--");
  setTextoSiExiste("weatherViento", "--");
  setTextoSiExiste("weatherLluvia", "--");
  setTextoSiExiste("weatherUpdated", "--");
  setTextoSiExiste("weatherDesc", "Buscando datos...");
  setTextoSiExiste("weatherEstado", "Conectando con Open-Meteo...");
}

function mostrarError(mensaje) {
  var estado = document.getElementById("weatherEstado");
  if (estado) {
    estado.innerHTML = (mensaje || "No se pudo obtener el clima. Revisá tu conexión a internet.") +
      " <button type=\"button\" class=\"retry-link\" onclick=\"reintentarClima()\">Reintentar</button>";
  }
}

function climaEnUbicacion(ciudad, lat, lon) {
  ultimaUbicacion = { ciudad: ciudad, lat: lat, lon: lon };
  mostrarCargando(ciudad);

  pedirClima(lat, lon)
    .then(function (clima) {
      mostrarClima(ciudad, clima);
    })
    .catch(function (error) {
      console.error("[Agromatical] Error al pedir el clima:", error);
      mostrarError();
    });
}

function reintentarClima() {
  if (ultimaUbicacion) {
    climaEnUbicacion(ultimaUbicacion.ciudad, ultimaUbicacion.lat, ultimaUbicacion.lon);
  } else {
    detectarCiudad();
  }
}

function climaDeCiudad(ciudad) {
  if (!ciudad) {
    ciudad = API_CONFIG.ciudadPorDefecto;
  }

  mostrarCargando(ciudad);

  buscarCoordenadas(ciudad).then(function (ubicacion) {
    if (!ubicacion) {
      mostrarError("No se encontró \"" + ciudad + "\". Probá con otro nombre.");
      return;
    }
    climaEnUbicacion(ubicacion.nombre, ubicacion.lat, ubicacion.lon);
  });
}

function buscarClima() {
  var ciudad = document.getElementById("citySearchInput").value;
  climaDeCiudad(ciudad);
}

function teclaBuscador(evento) {
  if (evento.key === "Enter") {
    buscarClima();
  }
}

// ipapi.co nos dice desde qué ciudad entra el usuario. Si falla, usamos Cutral Có.
function detectarCiudad() {
  pedirJSON("https://ipapi.co/json/")
    .then(function (datos) {
      if (!datos.latitude || !datos.longitude) {
        climaDeCiudad(API_CONFIG.ciudadPorDefecto);
        return;
      }
      var input = document.getElementById("citySearchInput");
      if (input) {
        input.placeholder = datos.city;
      }
      climaEnUbicacion(datos.city, datos.latitude, datos.longitude);
    })
    .catch(function () {
      climaDeCiudad(API_CONFIG.ciudadPorDefecto);
    });
}

detectarCiudad();
