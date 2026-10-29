// Lo explica: Ailin
// Chicos, estos son los dibujitos del clima (sol, nubes, lluvia, etc.). Están hechos
// en SVG, que es un dibujo hecho con código, así no dependemos de imágenes.

var SOL = '<circle cx="50" cy="50" r="20" fill="#f5a623"/>' +
  '<g stroke="#f5a623" stroke-width="6" stroke-linecap="round">' +
  '<line x1="50" y1="10" x2="50" y2="20"/><line x1="50" y1="80" x2="50" y2="90"/>' +
  '<line x1="10" y1="50" x2="20" y2="50"/><line x1="80" y1="50" x2="90" y2="50"/>' +
  '<line x1="22" y1="22" x2="29" y2="29"/><line x1="71" y1="71" x2="78" y2="78"/>' +
  '<line x1="22" y1="78" x2="29" y2="71"/><line x1="71" y1="29" x2="78" y2="22"/></g>';

var SOL_CHICO = '<circle cx="36" cy="36" r="16" fill="#f5a623"/>';

var NUBE = '<g fill="#aeb5bd"><circle cx="38" cy="58" r="16"/><circle cx="58" cy="50" r="20"/>' +
  '<circle cx="74" cy="62" r="12"/><rect x="26" y="58" width="56" height="16" rx="8"/></g>';

var GOTAS = '<g stroke="#4a90d9" stroke-width="4" stroke-linecap="round">' +
  '<line x1="38" y1="82" x2="34" y2="94"/><line x1="54" y1="82" x2="50" y2="94"/><line x1="70" y1="82" x2="66" y2="94"/></g>';

var RAYO = '<polygon points="52,70 44,86 54,86 48,98 64,80 54,80 60,70" fill="#f5c542"/>';

var COPOS = '<g fill="#bcd6ef"><circle cx="38" cy="88" r="4"/><circle cx="54" cy="94" r="4"/><circle cx="70" cy="88" r="4"/></g>';

function dibujoDelClima(descripcion) {
  var texto = (descripcion || "").toLowerCase();

  if (texto.indexOf("tormenta") !== -1) {
    return NUBE + RAYO;
  }
  if (texto.indexOf("lluvia") !== -1 || texto.indexOf("llovizna") !== -1 || texto.indexOf("chubasco") !== -1) {
    return NUBE + GOTAS;
  }
  if (texto.indexOf("nieve") !== -1 || texto.indexOf("nevada") !== -1) {
    return NUBE + COPOS;
  }
  if (texto.indexOf("parcial") !== -1) {
    return SOL_CHICO + NUBE;
  }
  if (texto.indexOf("despejado") !== -1) {
    return SOL;
  }
  if (texto.indexOf("nublado") !== -1) {
    return NUBE;
  }
  return SOL_CHICO + NUBE;
}

function iconoDelClima(descripcion) {
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + dibujoDelClima(descripcion) + '</svg>';
}
