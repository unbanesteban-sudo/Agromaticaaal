// Lo explica: Godoy
// Chicos, el mapa lo hacemos con Leaflet (una librería gratis) y los dibujos de calles
// salen de OpenStreetMap. Ponemos un círculo en la ciudad que cambia de color
// según la temperatura: azul si hace frío, verde si está templado y rojo si hace calor.

var UBICACION_INICIAL = { lat: -38.9333, lon: -69.2167, nombre: "Cutral Có" };
var LIMITE_FRIO = 10;
var LIMITE_CALOR = 28;

var mapa = null;
var circuloClima = null;

function colorSegunTemperatura(temperatura) {
  if (temperatura === null || temperatura === undefined) {
    return { color: "#9e9e9e", texto: "Esperando datos..." };
  }
  if (temperatura < LIMITE_FRIO) {
    return { color: "#1971c2", texto: "Frío (" + Math.round(temperatura) + "°)" };
  }
  if (temperatura > LIMITE_CALOR) {
    return { color: "#e03131", texto: "Caluroso (" + Math.round(temperatura) + "°)" };
  }
  return { color: "#2f9e44", texto: "Templado (" + Math.round(temperatura) + "°)" };
}

function iniciarMapa(idDiv, zoom) {
  if (!document.getElementById(idDiv) || typeof L === "undefined") {
    return;
  }

  mapa = L.map(idDiv).setView([UBICACION_INICIAL.lat, UBICACION_INICIAL.lon], zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; colaboradores de OpenStreetMap",
    maxZoom: 19
  }).addTo(mapa);

  var estilo = colorSegunTemperatura(null);
  circuloClima = L.circleMarker([UBICACION_INICIAL.lat, UBICACION_INICIAL.lon], {
    radius: 12,
    color: estilo.color,
    fillColor: estilo.color,
    fillOpacity: 0.85
  }).addTo(mapa);

  circuloClima.bindPopup("<strong>" + UBICACION_INICIAL.nombre + "</strong><br>" + estilo.texto).openPopup();
}

function actualizarMapa(lat, lon, nombre, temperatura) {
  if (!mapa || !circuloClima) {
    return;
  }

  var estilo = colorSegunTemperatura(temperatura);
  circuloClima.setLatLng([lat, lon]);
  circuloClima.setStyle({ color: estilo.color, fillColor: estilo.color });
  circuloClima.setPopupContent("<strong>" + nombre + "</strong><br>" + estilo.texto);
  mapa.setView([lat, lon], mapa.getZoom());
}
