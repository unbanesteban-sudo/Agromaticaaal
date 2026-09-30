var API_CONFIG = {
  forecastUrl: "https://api.open-meteo.com/v1/forecast",
  geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
  campos: "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,precipitation,weather_code",
  ciudadPorDefecto: "Cutral Co",
  timeoutMs: 6000
};

var ultimaUbicacion = null;

var ultimoClimaMostrado = null;

function setTextoSiExiste(id, texto) {
  var el = document.getElementById(id);
  if (el) {
    el.innerText = texto;
  }
}

function fetchConTimeout(url) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function () {
    controller.abort();
  }, API_CONFIG.timeoutMs);

  return fetch(url, { signal: controller.signal })
    .then(function (respuesta) {
      clearTimeout(timeoutId);
      return respuesta.json();
    })
    .catch(function (error) {
      clearTimeout(timeoutId);
      throw error;
    });
}

function geocodificarCiudad(nombreCiudad) {
  var url = API_CONFIG.geocodingUrl + "?name=" + encodeURIComponent(nombreCiudad) + "&count=1&language=es";

  return fetchConTimeout(url)
    .then(function (data) {
      if (!data.results || data.results.length === 0) {
        return null;
      }
      var resultado = data.results[0];
      return { nombre: resultado.name, lat: resultado.latitude, lon: resultado.longitude };
    })
    .catch(function (error) {
      console.error("[Agromatical] Error buscando la ciudad:", error);
      return null;
    });
}

function descripcionWeatherCode(codigo) {
  var descripciones = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nublado con niebla",
    48: "Nublado con niebla",
    51: "Llovizna",
    53: "Llovizna",
    55: "Llovizna",
    56: "Llovizna helada",
    57: "Llovizna helada",
    61: "Lluvia",
    63: "Lluvia",
    65: "Lluvia",
    66: "Lluvia helada",
    67: "Lluvia helada",
    71: "Nieve",
    73: "Nieve",
    75: "Nieve",
    77: "Nieve granulada",
    80: "Chubascos",
    81: "Chubascos",
    82: "Chubascos fuertes",
    85: "Nevadas",
    86: "Nevadas fuertes",
    95: "Tormenta eléctrica",
    96: "Tormenta con granizo",
    99: "Tormenta con granizo"
  };

  if (descripciones[codigo] !== undefined) {
    return descripciones[codigo];
  }
  return "Sin dato";
}

function fetchClimaPorCoordenadas(lat, lon) {
  var url = API_CONFIG.forecastUrl + "?latitude=" + lat + "&longitude=" + lon +
    "&current=" + API_CONFIG.campos +
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code" +
    "&timezone=auto";

  return fetchConTimeout(url).then(function (data) {
    var actual = data.current || {};
    var diario = data.daily || {};
    var etiquetas = ["Hoy", "Mañana", "Pasado"];
    var pronostico = [];

    if (diario.time) {
      for (var i = 0; i < diario.time.length && i < 3; i++) {
        var codigoDia = diario.weather_code ? diario.weather_code[i] : null;
        pronostico.push({
          etiqueta: etiquetas[i] || diario.time[i],
          fecha: diario.time[i],
          tempMax: diario.temperature_2m_max ? diario.temperature_2m_max[i] : null,
          tempMin: diario.temperature_2m_min ? diario.temperature_2m_min[i] : null,
          precipitacion: diario.precipitation_sum ? diario.precipitation_sum[i] : null,
          codigo: codigoDia,
          descripcion: descripcionWeatherCode(codigoDia)
        });
      }
    }

    return {
      lat: lat,
      lon: lon,
      temperatura: actual.temperature_2m,
      humedad: actual.relative_humidity_2m,
      presion: actual.pressure_msl,
      viento: actual.wind_speed_10m,
      precipitacion: actual.precipitation,
      codigoClima: actual.weather_code,
      descripcion: descripcionWeatherCode(actual.weather_code),
      pronostico: pronostico,
      actualizado: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    };
  });
}

function renderClima(ciudad, clima) {
  ultimoClimaMostrado = {
    ciudad: ciudad,
    temperatura: clima.temperatura,
    humedad: clima.humedad,
    presion: clima.presion,
    viento: clima.viento,
    precipitacion: clima.precipitacion,
    codigoClima: clima.codigoClima,
    descripcion: clima.descripcion,
    pronostico: clima.pronostico,
    actualizado: clima.actualizado
  };

  setTextoSiExiste("weatherLocation", ciudad);
  setTextoSiExiste("weatherTemp", (clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) + "°" : "--");
  setTextoSiExiste("weatherHumedad", (clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : "--");
  setTextoSiExiste("weatherPresion", (clima.presion !== null && clima.presion !== undefined) ? Math.round(clima.presion) : "--");
  setTextoSiExiste("weatherViento", (clima.viento !== null && clima.viento !== undefined) ? Math.round(clima.viento) : "--");
  setTextoSiExiste("weatherVisibilidad", "--");
  setTextoSiExiste("weatherUpdated", clima.actualizado);
  setTextoSiExiste("weatherDesc", "Datos de Open-Meteo");
  setTextoSiExiste("weatherEstado", "Datos actualizados");

  if (typeof actualizarUbicacionMapa === "function") {
    actualizarUbicacionMapa(clima.lat, clima.lon, ciudad);
  }
  if (typeof actualizarColorClimaMapa === "function") {
    actualizarColorClimaMapa(clima.temperatura);
  }
  if (typeof actualizarClimaInvernadero === "function") {
    actualizarClimaInvernadero(clima);
  }
}

function mostrarEstadoCargando(ciudad) {
  setTextoSiExiste("weatherLocation", ciudad);
  setTextoSiExiste("weatherTemp", "--");
  setTextoSiExiste("weatherHumedad", "--");
  setTextoSiExiste("weatherPresion", "--");
  setTextoSiExiste("weatherViento", "--");
  setTextoSiExiste("weatherVisibilidad", "--");
  setTextoSiExiste("weatherUpdated", "--");
  setTextoSiExiste("weatherDesc", "Buscando datos...");
  setTextoSiExiste("weatherEstado", "Conectando con Open-Meteo...");
}

function mostrarEstadoError(mensaje) {
  var estado = document.getElementById("weatherEstado");
  if (estado) {
    estado.innerHTML = (mensaje || "No se pudo obtener el clima. Revisá tu conexión a internet.") +
      " <button type=\"button\" class=\"retry-link\" onclick=\"reintentarClima()\">Reintentar</button>";
  }

  if (typeof actualizarColorClimaMapa === "function") {
    actualizarColorClimaMapa(null);
  }
}

function mostrarClimaEnUbicacion(ciudad, lat, lon) {
  ultimaUbicacion = { ciudad: ciudad, lat: lat, lon: lon };
  mostrarEstadoCargando(ciudad);

  fetchClimaPorCoordenadas(lat, lon)
    .then(function (clima) {
      if (clima.temperatura === null || clima.temperatura === undefined) {
        mostrarEstadoError();
      } else {
        renderClima(ciudad, clima);
      }
    })
    .catch(function (error) {
      console.error("[Agromatical] Error al pedir el clima:", error);
      mostrarEstadoError();
    });
}

function reintentarClima() {
  if (ultimaUbicacion) {
    mostrarClimaEnUbicacion(ultimaUbicacion.ciudad, ultimaUbicacion.lat, ultimaUbicacion.lon);
  } else {
    detectarCiudadPorIP();
  }
}

function mostrarClimaSegunCiudad(ciudad) {
  if (!ciudad) {
    ciudad = API_CONFIG.ciudadPorDefecto;
  }

  mostrarEstadoCargando(ciudad);

  geocodificarCiudad(ciudad).then(function (ubicacion) {
    if (!ubicacion) {
      mostrarEstadoError("No se encontró \"" + ciudad + "\". Probá con otro nombre.");
      return;
    }
    mostrarClimaEnUbicacion(ubicacion.nombre, ubicacion.lat, ubicacion.lon);
  });
}

function buscarClima() {
  var ciudad = document.getElementById("citySearchInput").value;
  mostrarClimaSegunCiudad(ciudad);
}

function detectarCiudadPorIP() {
  fetchConTimeout("https://ipapi.co/json/")
    .then(function (datos) {
      var ciudad = datos.city || API_CONFIG.ciudadPorDefecto;
      var input = document.getElementById("citySearchInput");
      if (input) {
        input.placeholder = ciudad;
      }

      if (datos.latitude && datos.longitude) {
        mostrarClimaEnUbicacion(ciudad, datos.latitude, datos.longitude);
      } else {
        mostrarClimaSegunCiudad(API_CONFIG.ciudadPorDefecto);
      }
    })
    .catch(function (error) {
      console.error("[Agromatical] No se pudo detectar la ciudad por IP:", error);
      mostrarClimaSegunCiudad(API_CONFIG.ciudadPorDefecto);
    });
}

detectarCiudadPorIP();
