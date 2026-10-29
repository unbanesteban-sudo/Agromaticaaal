function riegoDelDia(dia) {
  if ((dia.precipitacion !== null && dia.precipitacion >= 2) || (dia.probLluvia !== null && dia.probLluvia >= 60)) {
    return { regar: "No", horarios: "-", consejo: "Se espera lluvia, no hace falta regar." };
  }
  if (dia.tempMin !== null && dia.tempMin <= 2) {
    return { regar: "Sí, poco", horarios: "10:00", consejo: "Posible helada: regá poco a media mañana y cubrí las plantas a la noche." };
  }
  if (dia.tempMax !== null && dia.tempMax >= 30) {
    return { regar: "Sí", horarios: "06:30 y 20:30", consejo: "Mucho calor: regá temprano y al atardecer, y ventilá el invernadero." };
  }
  if (dia.tempMax !== null && dia.tempMax >= 22) {
    return { regar: "Sí", horarios: "07:00 y 19:30", consejo: "Día cálido: dos riegos, a la mañana y al atardecer." };
  }
  return { regar: "Sí", horarios: "08:30", consejo: "Día templado: con un riego a la mañana alcanza." };
}

function diaDeLaSemana(fecha) {
  var dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return dias[new Date(fecha + "T12:00:00").getDay()];
}

function fechaCompleta(fecha) {
  var partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function numeroORaya(valor) {
  if (valor === null || valor === undefined) {
    return "-";
  }
  return Math.round(valor);
}

function armarFilasPlanilla(datos, clima) {
  var filas = [];

  filas.push(["Planilla de riego - " + datos.nombre]);
  filas.push(["Plantas: " + (datos.plantas || "sin cargar")]);
  filas.push(["Ciudad: " + clima.ciudad + " - Hecha el " + new Date().toLocaleDateString("es-AR") + " con el pronóstico de Open-Meteo"]);
  filas.push([]);
  filas.push(["Día", "Fecha", "Clima", "Máx (°C)", "Mín (°C)", "Lluvia (mm)", "Prob. lluvia (%)", "¿Regar?", "Horarios", "Consejo", "¿Regué? (marcar)"]);

  for (var i = 0; i < clima.pronostico.length; i++) {
    var dia = clima.pronostico[i];
    var riego = riegoDelDia(dia);
    filas.push([
      diaDeLaSemana(dia.fecha),
      fechaCompleta(dia.fecha),
      dia.descripcion,
      numeroORaya(dia.tempMax),
      numeroORaya(dia.tempMin),
      (dia.precipitacion !== null && dia.precipitacion !== undefined) ? dia.precipitacion : "-",
      numeroORaya(dia.probLluvia),
      riego.regar,
      riego.horarios,
      riego.consejo,
      ""
    ]);
  }

  return filas;
}

function nombreParaArchivo(texto) {
  return texto.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function descargarCSV(filas, nombreArchivo) {
  var lineas = [];
  for (var i = 0; i < filas.length; i++) {
    var celdas = [];
    for (var j = 0; j < filas[i].length; j++) {
      celdas.push("\"" + String(filas[i][j]).replace(/"/g, "\"\"") + "\"");
    }
    lineas.push(celdas.join(";"));
  }

  var archivo = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  var enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

function descargarPlanillaRiego() {
  var datos = leerInvernadero();
  if (!datos) {
    return;
  }

  if (typeof ultimoClimaMostrado === "undefined" || !ultimoClimaMostrado || !ultimoClimaMostrado.pronostico || ultimoClimaMostrado.pronostico.length === 0) {
    alert("Todavía no cargó el pronóstico. Esperá unos segundos y probá de nuevo.");
    return;
  }

  var filas = armarFilasPlanilla(datos, ultimoClimaMostrado);
  var nombreArchivo = "riego-" + (nombreParaArchivo(datos.nombre) || "invernadero");

  if (typeof XLSX === "undefined") {
    descargarCSV(filas, nombreArchivo + ".csv");
    return;
  }

  var hoja = XLSX.utils.aoa_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 11 }, { wch: 12 }, { wch: 22 }, { wch: 9 }, { wch: 9 }, { wch: 11 },
    { wch: 15 }, { wch: 9 }, { wch: 14 }, { wch: 62 }, { wch: 17 }
  ];

  var libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Riego");
  XLSX.writeFile(libro, nombreArchivo + ".xlsx");
}
