function consejoDelDia(dia) {
  if ((dia.precipitacion !== null && dia.precipitacion >= 2) || (dia.probLluvia !== null && dia.probLluvia >= 60)) {
    return { tipo: "lluvia", texto: "Se espera lluvia, no hace falta regar." };
  }
  if (dia.tempMin !== null && dia.tempMin <= 2) {
    return { tipo: "helada", texto: "Posible helada: cubrí las plantas y regá a media mañana." };
  }
  if (dia.tempMax !== null && dia.tempMax >= 30) {
    return { tipo: "calor", texto: "Mucho calor: regá temprano y al atardecer, y ventilá." };
  }
  if (dia.viento !== null && dia.viento >= 40) {
    return { tipo: "viento", texto: "Viento fuerte: cerrá bien el invernadero." };
  }
  return { tipo: "normal", texto: "Buen día, con un riego a la mañana alcanza." };
}

function textoNumero(valor, unidad) {
  if (valor === null || valor === undefined) {
    return "--";
  }
  return Math.round(valor) + unidad;
}

function renderizarPronosticoExtendido(ciudad, pronostico) {
  var grilla = document.getElementById("pronosticoGrid");
  if (!grilla) {
    return;
  }

  setTextoSiExiste("pronosticoCiudad", "Próximos 7 días en " + ciudad);
  grilla.innerHTML = "";

  if (!pronostico || pronostico.length === 0) {
    grilla.innerHTML = "<p class=\"pronostico-vacio\">No se pudo cargar el pronóstico.</p>";
    return;
  }

  for (var i = 0; i < pronostico.length; i++) {
    var dia = pronostico[i];
    var consejo = consejoDelDia(dia);
    var icono = (typeof getWeatherIconSvg === "function") ? getWeatherIconSvg(dia.descripcion) : "";

    var tarjeta = document.createElement("div");
    tarjeta.className = "dia-card" + (i === 0 ? " dia-card-hoy" : "");
    tarjeta.innerHTML =
      "<div class=\"dia-card-top\">" +
        "<span class=\"dia-card-nombre\">" + dia.etiqueta + "</span>" +
        "<span class=\"dia-card-fecha\">" + dia.fechaCorta + "</span>" +
      "</div>" +
      "<div class=\"dia-card-icono\">" + icono + "</div>" +
      "<p class=\"dia-card-desc\">" + dia.descripcion + "</p>" +
      "<p class=\"dia-card-temp\"><strong>" + textoNumero(dia.tempMax, "°") + "</strong> / " + textoNumero(dia.tempMin, "°") + "</p>" +
      "<ul class=\"dia-card-datos\">" +
        "<li><span>Lluvia</span><span>" + (dia.precipitacion !== null ? dia.precipitacion + " mm" : "--") + "</span></li>" +
        "<li><span>Prob.</span><span>" + textoNumero(dia.probLluvia, "%") + "</span></li>" +
        "<li><span>Viento</span><span>" + textoNumero(dia.viento, " km/h") + "</span></li>" +
      "</ul>" +
      "<p class=\"dia-card-consejo consejo-" + consejo.tipo + "\">" + consejo.texto + "</p>";

    grilla.appendChild(tarjeta);
  }
}
