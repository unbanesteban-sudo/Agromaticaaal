// Lo explica: Godoy
// Chicos, esta es la página de Pronóstico. Agarra los 7 días que trae api.js y arma
// una tarjeta por día. El consejo de riego de cada día sale de reglas-riego.js.

function mostrarPronosticoSemana(ciudad, pronostico) {
  var grilla = document.getElementById("pronosticoGrid");
  if (!grilla) {
    return;
  }

  setTextoSiExiste("pronosticoCiudad", "Próximos 7 días en " + ciudad);
  grilla.innerHTML = "";

  for (var i = 0; i < pronostico.length; i++) {
    var dia = pronostico[i];
    var riego = riegoDelDia(dia);
    var horarios = riego.horarios.length > 0 ? "Regar: " + riego.horarios.join(" y ") + ". " : "";

    var tarjeta = document.createElement("div");
    tarjeta.className = (i === 0) ? "dia-card dia-card-hoy" : "dia-card";
    tarjeta.innerHTML =
      "<div class=\"dia-card-top\">" +
        "<span class=\"dia-card-nombre\">" + dia.etiqueta + "</span>" +
        "<span class=\"dia-card-fecha\">" + dia.fechaCorta + "</span>" +
      "</div>" +
      "<div class=\"dia-card-icono\">" + iconoDelClima(dia.descripcion) + "</div>" +
      "<p class=\"dia-card-desc\">" + dia.descripcion + "</p>" +
      "<p class=\"dia-card-temp\"><strong>" + redondeado(dia.tempMax, "°") + "</strong> / " + redondeado(dia.tempMin, "°") + "</p>" +
      "<ul class=\"dia-card-datos\">" +
        "<li><span>Lluvia</span><span>" + dia.precipitacion + " mm</span></li>" +
        "<li><span>Prob.</span><span>" + redondeado(dia.probLluvia, "%") + "</span></li>" +
        "<li><span>Viento</span><span>" + redondeado(dia.viento, " km/h") + "</span></li>" +
      "</ul>" +
      "<p class=\"dia-card-consejo consejo-" + riego.tipo + "\">" + horarios + riego.mensaje + "</p>";

    grilla.appendChild(tarjeta);
  }
}
