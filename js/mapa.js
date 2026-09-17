// ---------------------------------------------------------------
// Mapa interactivo con Leaflet
// ---------------------------------------------------------------
// Leaflet es una librería de mapas gratuita y de código abierto, no
// pide api key ni cuenta. Usa como base los mapas de OpenStreetMap
// (también gratis). Se usa en el mapa chico de index.html y en el
// mapa grande de mapa.html.
//
// El marcador ya no queda fijo en un solo lugar: js/api.js lo mueve
// a la ubicación que se está mostrando (la detectada por IP, o la
// que se busque a mano) y le cambia el color según la temperatura
// real que llega de Open-Meteo.

// Ubicación inicial, antes de que llegue el primer dato real
// (Cutral Có, Neuquén).
var UBICACION_INICIAL = {
  lat: -38.9333,
  lng: -69.2167,
  nombre: "Cutral Có"
};

// A partir de qué temperatura se considera "frío" o "caluroso".
// Ajustable según la zona.
var TEMP_LIMITE_FRIO = 10;
var TEMP_LIMITE_CALOR = 28;

var mapaLeaflet = null;
var marcadorClimaMapa = null;
var nombreUbicacionActual = UBICACION_INICIAL.nombre;
var etiquetaTemperaturaActual = "Esperando datos...";

// Devuelve { color, etiqueta } según la temperatura. Si no hay dato
// todavía (null/undefined), devuelve un gris neutro.
function estiloSegunTemperatura(temperatura) {
  if (temperatura === null || temperatura === undefined || isNaN(temperatura)) {
    return { color: "#9e9e9e", etiqueta: "Esperando datos..." };
  }
  if (temperatura < TEMP_LIMITE_FRIO) {
    return { color: "#1971c2", etiqueta: "Frío (" + Math.round(temperatura) + "°)" };
  }
  if (temperatura > TEMP_LIMITE_CALOR) {
    return { color: "#e03131", etiqueta: "Caluroso (" + Math.round(temperatura) + "°)" };
  }
  return { color: "#2f9e44", etiqueta: "Templado (" + Math.round(temperatura) + "°)" };
}

function contenidoPopupMapa() {
  return "<strong>" + nombreUbicacionActual + "</strong><br>" + etiquetaTemperaturaActual;
}

// Crea el mapa dentro del div con el id indicado, centrado en la
// ubicación inicial, con un círculo de color. "zoom" es opcional
// (más alto = más acercado).
function iniciarMapa(idDiv, zoom) {
  var contenedor = document.getElementById(idDiv);
  if (!contenedor || typeof L === "undefined") {
    console.warn("[Agromatical] No se pudo iniciar el mapa (falta el div o la librería Leaflet).");
    return null;
  }

  mapaLeaflet = L.map(idDiv).setView([UBICACION_INICIAL.lat, UBICACION_INICIAL.lng], zoom || 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; colaboradores de OpenStreetMap",
    maxZoom: 19
  }).addTo(mapaLeaflet);

  var estiloInicial = estiloSegunTemperatura(null);
  etiquetaTemperaturaActual = estiloInicial.etiqueta;

  marcadorClimaMapa = L.circleMarker([UBICACION_INICIAL.lat, UBICACION_INICIAL.lng], {
    radius: 12,
    color: estiloInicial.color,
    fillColor: estiloInicial.color,
    fillOpacity: 0.85,
    weight: 2
  })
    .addTo(mapaLeaflet)
    .bindPopup(contenidoPopupMapa())
    .openPopup();

  return mapaLeaflet;
}

// Mueve el marcador (y centra el mapa) en la ubicación que se está
// mostrando. La llama js/api.js con la latitud/longitud que le da
// Open-Meteo.
function actualizarUbicacionMapa(lat, lon, nombre) {
  if (!marcadorClimaMapa || !mapaLeaflet || lat === undefined || lon === undefined) {
    return;
  }

  nombreUbicacionActual = nombre || nombreUbicacionActual;
  marcadorClimaMapa.setLatLng([lat, lon]);
  mapaLeaflet.setView([lat, lon], mapaLeaflet.getZoom());
  marcadorClimaMapa.setPopupContent(contenidoPopupMapa());
}

// Cambia el color (y el texto del popup) del marcador según la
// temperatura recibida. La llama js/api.js cada vez que llega un
// dato nuevo (o "null" cuando no hay dato).
function actualizarColorClimaMapa(temperatura) {
  if (!marcadorClimaMapa) {
    return;
  }

  var estilo = estiloSegunTemperatura(temperatura);
  etiquetaTemperaturaActual = estilo.etiqueta;

  marcadorClimaMapa.setStyle({
    color: estilo.color,
    fillColor: estilo.color
  });

  marcadorClimaMapa.setPopupContent(contenidoPopupMapa());
}
