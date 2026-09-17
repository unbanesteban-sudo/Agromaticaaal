const WEATHER_ICON_VIEWBOX = "0 0 100 100";

const SUN_SHAPE = `
  <g fill="#f5a623">
    <circle cx="50" cy="50" r="22"/>
    <circle cx="80.0" cy="50.0" r="11"/>
    <circle cx="74.3" cy="67.6" r="11"/>
    <circle cx="59.3" cy="78.5" r="11"/>
    <circle cx="40.7" cy="78.5" r="11"/>
    <circle cx="25.7" cy="67.6" r="11"/>
    <circle cx="20.0" cy="50.0" r="11"/>
    <circle cx="25.7" cy="32.4" r="11"/>
    <circle cx="40.7" cy="21.5" r="11"/>
    <circle cx="59.3" cy="21.5" r="11"/>
    <circle cx="74.3" cy="32.4" r="11"/>
  </g>`;

const SUN_SHAPE_SMALL = `
  <g fill="#f5a623" transform="translate(2,-2) scale(0.72)">
    <circle cx="50" cy="50" r="22"/>
    <circle cx="80.0" cy="50.0" r="11"/>
    <circle cx="74.3" cy="67.6" r="11"/>
    <circle cx="59.3" cy="78.5" r="11"/>
    <circle cx="40.7" cy="78.5" r="11"/>
    <circle cx="25.7" cy="67.6" r="11"/>
    <circle cx="20.0" cy="50.0" r="11"/>
    <circle cx="25.7" cy="32.4" r="11"/>
    <circle cx="40.7" cy="21.5" r="11"/>
    <circle cx="59.3" cy="21.5" r="11"/>
    <circle cx="74.3" cy="32.4" r="11"/>
  </g>`;

const CLOUD_PATH = "M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z";

const CLOUD_SMALL = `<path d="${CLOUD_PATH}" fill="#c7ccd3" transform="translate(34,45) scale(2.3)"/>`;
const CLOUD_BIG = `<path d="${CLOUD_PATH}" fill="#aeb5bd" transform="translate(14,25) scale(3.2)"/>`;

const BOLT_PATH = "M7 2v11h3v9l7-12h-4l4-8z";
const BOLT = `<path d="${BOLT_PATH}" fill="#f5c542" transform="translate(38,46) scale(1.7)"/>`;

const RAIN_DROPS = `
  <g stroke="#4a90d9" stroke-width="4" stroke-linecap="round">
    <line x1="38" y1="82" x2="34" y2="94"/>
    <line x1="54" y1="82" x2="50" y2="94"/>
    <line x1="70" y1="82" x2="66" y2="94"/>
  </g>`;

const SNOW_DOTS = `
  <g fill="#bcd6ef">
    <circle cx="38" cy="88" r="4"/>
    <circle cx="54" cy="94" r="4"/>
    <circle cx="70" cy="88" r="4"/>
  </g>`;

const WEATHER_ICONS = {
  despejado: SUN_SHAPE,
  parcial: SUN_SHAPE_SMALL + CLOUD_SMALL,
  nublado: CLOUD_BIG,
  lluvia: CLOUD_BIG + RAIN_DROPS,
  tormenta: CLOUD_BIG + BOLT,
  nieve: CLOUD_BIG + SNOW_DOTS,
};

function getWeatherIconKey(descripcion) {
  const texto = (descripcion || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // saca tildes

  if (/tormenta|electrica/.test(texto)) return "tormenta";
  if (/lluvia|lloviz|chubasco|precipitacion/.test(texto)) return "lluvia";
  if (/nieve|nevada/.test(texto)) return "nieve";
  if (/parcial/.test(texto)) return "parcial";
  if (/despejado|soleado|claro/.test(texto)) return "despejado";
  if (/nublado|cubierto|nube/.test(texto)) return "nublado";
  return "parcial";
}

function getWeatherIconSvg(descripcion) {
  const key = getWeatherIconKey(descripcion);
  return `<svg viewBox="${WEATHER_ICON_VIEWBOX}" xmlns="http://www.w3.org/2000/svg">${WEATHER_ICONS[key]}</svg>`;
}
