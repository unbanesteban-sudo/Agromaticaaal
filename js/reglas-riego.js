// Lo explica: Jazmín
// Chicos, acá dejé juntas todas las reglas de la página: cuándo regar, las alertas,
// el estado de la planta y los consejos de cada planta. Si hay que cambiar un número
// (por ejemplo desde cuántos grados es "mucho calor"), se cambia solo acá.

var TIPS_POR_PLANTA = [
  { clave: "tomate", consejo: "Los tomates necesitan riego regular pero sin mojar las hojas, para evitar hongos." },
  { clave: "lechuga", consejo: "La lechuga prefiere riegos frecuentes y suaves, y sufre con el calor fuerte del mediodía." },
  { clave: "frutilla", consejo: "Las frutillas necesitan buen drenaje: regá seguido pero sin encharcar la tierra." },
  { clave: "pimiento", consejo: "Los pimientos disfrutan el calor, pero necesitan riego constante para no perder flores." },
  { clave: "zanahoria", consejo: "La zanahoria necesita tierra suelta y húmeda de forma pareja, sin encharcamientos." },
  { clave: "cebolla", consejo: "La cebolla necesita riego moderado; reducí el agua cuando el bulbo ya esté formado." },
  { clave: "papa", consejo: "La papa necesita riego constante mientras se forman los tubérculos." },
  { clave: "albahaca", consejo: "La albahaca es sensible al frío: protegela de las heladas y regala seguido en días de calor." },
  { clave: "pepino", consejo: "El pepino necesita mucha agua, sobre todo cuando empieza a dar frutos." },
  { clave: "lavanda", consejo: "La lavanda necesita poca agua: regala solo cuando la tierra esté seca." },
  { clave: "flor", consejo: "Las flores agradecen riegos moderados y buena luz, sin mojar los pétalos." }
];

function tieneValor(valor) {
  return valor !== null && valor !== undefined && !isNaN(valor);
}

function consejosParaPlantas(plantasTexto) {
  var consejos = [];
  if (!plantasTexto) {
    return consejos;
  }

  var texto = plantasTexto.toLowerCase();
  for (var i = 0; i < TIPS_POR_PLANTA.length; i++) {
    if (texto.indexOf(TIPS_POR_PLANTA[i].clave) !== -1) {
      consejos.push(TIPS_POR_PLANTA[i].consejo);
    }
  }
  return consejos;
}

// Esta es LA regla de riego. La usan el invernadero (para hoy), la página de
// Pronóstico y el Excel (para cada día de la semana).
function riegoSegunClima(temperatura, humedad, lluvia, probLluvia, minima) {
  if (!tieneValor(temperatura)) {
    return { tipo: "espera", horarios: [], mensaje: "Esperando los datos del clima para armar el horario de riego." };
  }

  if ((tieneValor(lluvia) && lluvia > 0.5) || (tieneValor(probLluvia) && probLluvia >= 60)) {
    return { tipo: "lluvia", horarios: [], mensaje: "Hay o se espera lluvia, no hace falta regar." };
  }

  if (tieneValor(humedad) && humedad >= 85) {
    return { tipo: "humedo", horarios: [], mensaje: "La humedad está muy alta (" + Math.round(humedad) + "%). Mejor no regar para que no salgan hongos." };
  }

  if (!tieneValor(minima)) {
    minima = temperatura;
  }

  if (minima <= 3) {
    return { tipo: "helada", horarios: ["10:00"], mensaje: "Hace mucho frío: un riego liviano a media mañana, y a la noche tapá las plantas." };
  }

  if (temperatura >= 30) {
    return { tipo: "calor", horarios: ["06:30", "20:30"], mensaje: "Mucho calor (" + Math.round(temperatura) + "°): regá temprano y al atardecer, así el agua no se evapora." };
  }

  if (temperatura >= 22) {
    return { tipo: "normal", horarios: ["07:00", "19:30"], mensaje: "Día cálido: dos riegos, a la mañana y al atardecer." };
  }

  return { tipo: "normal", horarios: ["08:30"], mensaje: "Día templado: con un riego a la mañana alcanza." };
}

function riegoDelDia(dia) {
  return riegoSegunClima(dia.tempMax, null, dia.precipitacion, dia.probLluvia, dia.tempMin);
}

function generarAlertas(clima) {
  var alertas = [];

  if (tieneValor(clima.temperatura) && clima.temperatura <= 3) {
    alertas.push({ tipo: "helada", texto: "Hay riesgo de helada ahora (" + Math.round(clima.temperatura) + "°). Cubrí las plantas más sensibles." });
  }

  if (clima.pronostico && clima.pronostico.length > 1) {
    var manana = clima.pronostico[1];
    if (tieneValor(manana.tempMin) && manana.tempMin <= 2) {
      alertas.push({ tipo: "helada", texto: "Mañana se espera helada (mínima de " + Math.round(manana.tempMin) + "°). Prepará una cobertura para las plantas." });
    }
  }

  if (tieneValor(clima.temperatura) && clima.temperatura >= 32) {
    alertas.push({ tipo: "ventilacion", texto: "Hace mucho calor (" + Math.round(clima.temperatura) + "°). Abrí las ventilaciones del invernadero." });
  }

  if (tieneValor(clima.humedad) && clima.humedad >= 90) {
    alertas.push({ tipo: "ventilacion", texto: "Humedad muy alta (" + Math.round(clima.humedad) + "%). Ventilá un rato para que no aparezcan hongos." });
  }

  return alertas;
}

// Esta regla es la que pidió el profe: comparamos la temperatura de adentro con
// la temperatura ideal que el usuario pone al crear su invernadero.
function estadoDeLaPlanta(temperatura, ideal, margenAtencion, margenCritico) {
  var diferencia = Math.abs(temperatura - ideal);

  if (diferencia >= margenCritico) {
    return {
      clase: "estado-critico",
      etiqueta: "CRÍTICO",
      mensaje: "¡Atención! La temperatura está " + (temperatura > ideal ? "demasiado alta" : "demasiado baja") + " para tus plantas."
    };
  }

  if (diferencia >= margenAtencion) {
    return { clase: "estado-atencion", etiqueta: "NECESITA ATENCIÓN", mensaje: "La temperatura se está alejando del rango ideal." };
  }

  return { clase: "estado-normal", etiqueta: "NORMAL", mensaje: "El ambiente está dentro de las condiciones ideales para tus plantas." };
}
