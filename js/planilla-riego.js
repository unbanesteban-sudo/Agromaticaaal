// Lo explica: Godoy
// Chicos, esto arma el Excel con el plan de riego de la semana. Usamos la librería
// SheetJS (XLSX), que convierte una lista de filas en un archivo .xlsx de verdad.
// Cada fila es un día del pronóstico, y lo de "regar o no" sale de reglas-riego.js.

function fechaCompleta(fecha) {
  var partes = fecha.split("-");
  return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function armarFilasPlanilla(datos, clima) {
  var filas = [
    ["Planilla de riego - " + datos.nombre],
    ["Plantas: " + (datos.plantas || "sin cargar")],
    ["Ciudad: " + clima.ciudad + " - Hecha el " + new Date().toLocaleDateString("es-AR")],
    [],
    ["Día", "Fecha", "Clima", "Máx (°C)", "Mín (°C)", "Lluvia (mm)", "¿Regar?", "Horarios", "Consejo", "¿Regué? (marcar)"]
  ];

  for (var i = 0; i < clima.pronostico.length; i++) {
    var dia = clima.pronostico[i];
    var riego = riegoDelDia(dia);
    filas.push([
      dia.etiqueta,
      fechaCompleta(dia.fecha),
      dia.descripcion,
      Math.round(dia.tempMax),
      Math.round(dia.tempMin),
      dia.precipitacion,
      riego.horarios.length > 0 ? "Sí" : "No",
      riego.horarios.length > 0 ? riego.horarios.join(" y ") : "-",
      riego.mensaje,
      ""
    ]);
  }

  return filas;
}

function descargarPlanillaRiego() {
  var datos = leerInvernadero();

  if (!ultimoClimaMostrado) {
    alert("Todavía no cargó el pronóstico. Esperá unos segundos y probá de nuevo.");
    return;
  }
  if (typeof XLSX === "undefined") {
    alert("No cargó la librería de Excel. Revisá la conexión a internet.");
    return;
  }

  var hoja = XLSX.utils.aoa_to_sheet(armarFilasPlanilla(datos, ultimoClimaMostrado));
  hoja["!cols"] = [
    { wch: 11 }, { wch: 12 }, { wch: 22 }, { wch: 9 }, { wch: 9 },
    { wch: 11 }, { wch: 9 }, { wch: 14 }, { wch: 70 }, { wch: 17 }
  ];

  var libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Riego");
  XLSX.writeFile(libro, "planilla-de-riego.xlsx");
}
