var API_CONFIG = {
  forecastUrl: "https://api.open-meteo.com/v1/forecast",
  geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
  campos: "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m",
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

// Pide el clima actual a Open-Meteo para una latitud/longitud.
function fetchClimaPorCoordenadas(lat, lon) {
  var url = API_CONFIG.forecastUrl + "?latitude=" + lat + "&longitude=" + lon + "&current=" + API_CONFIG.campos;

  return fetchConTimeout(url).then(function (data) {
    var actual = data.current || {};
    return {
      lat: lat,
      lon: lon,
      temperatura: actual.temperature_2m,
      humedad: actual.relative_humidity_2m,
      presion: actual.pressure_msl,
      viento: actual.wind_speed_10m,
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
    actualizado: clima.actualizado
  };

  setTextoSiExiste("weatherLocation", ciudad);
  setTextoSiExiste("weatherTemp", (clima.temperatura !== null && clima.temperatura !== undefined) ? Math.round(clima.temperatura) + "°" : "--");
  setTextoSiExiste("weatherHumedad", (clima.humedad !== null && clima.humedad !== undefined) ? Math.round(clima.humedad) : "--");
  setTextoSiExiste("weatherPresion", (clima.presion !== null && clima.presion !== undefined) ? Math.round(clima.presion) : "--");
  setTextoSiExiste("weatherViento", (clima.viento !== null && clima.viento !== undefined) ? Math.round(clima.viento) : "--");
  // Open-Meteo no incluye visibilidad en el bloque "current".
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

// Pide y muestra el clima para una ubicación ya resuelta (con
// latitud/longitud). La usan tanto la detección por IP como la
// búsqueda manual, una vez que ya se sabe dónde buscar.
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

// Reintenta sin recargar la página entera (útil si se cortó la
// conexión un instante). Repite la última ubicación mostrada.
function reintentarClima() {
  if (ultimaUbicacion) {
    mostrarClimaEnUbicacion(ultimaUbicacion.ciudad, ultimaUbicacion.lat, ultimaUbicacion.lon);
  } else {
    detectarCiudadPorIP();
  }
}

// Busca la ciudad escrita en el buscador (método GET a la API de
// Geocoding de Open-Meteo) y, si existe, muestra su clima real.
// Como Open-Meteo tiene datos para cualquier ciudad, ya no hace
// falta limitarse a Cutral Có.
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

// Detecta la ciudad del usuario por IP (GET a un servicio externo,
// gratis y sin api key) para mostrar de entrada el clima de donde
// está. ipapi.co ya da latitud/longitud, así que no hace falta
// geocodificar de nuevo. Si falla (sin internet, bloqueado, etc.)
// cae en Cutral Có.
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
