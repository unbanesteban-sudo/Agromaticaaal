# Agromatical

Sitio web de monitoreo de temperatura y humedad, hecho para la materia **Sensores, Señales y Conectividad** (Taller Integrador). Muestra el clima en tiempo real de cualquier ciudad (API pública **Open-Meteo**), un mapa interactivo con un marcador que cambia de color según la temperatura, y un asistente de IA (Cloudflare Workers AI) para dudas sobre riego y cultivos.

## Cómo verlo funcionando

No hace falta instalar nada especial, es HTML/CSS/JS puro. Dos formas de abrirlo:

**Opción 1 — doble clic:** abrí `index.html` directamente con el navegador.

**Opción 2 — con un servidor local** (recomendado, evita algunos problemas de seguridad del navegador con `file://`):

```
py -m http.server 8000
```

y después entrá a [http://localhost:8000](http://localhost:8000) en el navegador.

Sólo hace falta conexión a internet (para pedirle el clima a Open-Meteo y hablar con el asistente de IA) — ya no depende de estar en ninguna red o wifi en particular.

## Estructura del proyecto

- `index.html`, `mapa.html`, `pronostico.html`, `nosotros.html`, `contacto.html` — las páginas del sitio.
- `css/style.css` — todos los estilos.
- `js/api.js` — conexión con la API de Open-Meteo (clima actual por ciudad o por ubicación).
- `js/mapa.js` — mapa interactivo (Leaflet + OpenStreetMap) con el marcador que cambia de color según la temperatura.
- `js/asistente-ia.js` — widget flotante del asistente de IA (habla con un Worker propio de Cloudflare).
- `js/contacto.js` — formulario de contacto.
- `cloudflare-worker/` — código de referencia del Worker que conecta con Workers AI (no hace falta tocarlo para levantar el sitio).
- `NOTAS-PROYECTO.md` — notas internas del equipo con el detalle de cada cambio hecho durante el desarrollo.

## Equipo

- **Esteban Roman Carrillo Reyes** — backend: conexión con la API del clima, mapa, asistente de IA.
- **Ailin Montero** — frontend: diseño y maquetado de las páginas.

## Cómo clonarlo

```
git clone <URL-de-este-repositorio>
```

y seguir los pasos de "Cómo verlo funcionando" de más arriba.
