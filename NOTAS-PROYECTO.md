# Notas del proyecto — Agromatical

Este archivo es solo para el equipo (no se linkea desde ninguna página). Resume en qué quedó todo y qué falta.

## ⚠️ Cambio de profesor y de API (lo más reciente — lee esto primero)

El profesor Pablo Bruna renunció; el profesor nuevo pidió dejar de usar la API propia del sensor (`http://10.10.10.3:3000/...`, sólo Cutral Có, sólo funcionaba en la wifi del cole) y pasar a **Open-Meteo** (open-meteo.com), una API pública y gratuita de clima, sin api key ni cuenta.

Esto cambió bastante el backend, para bien:
- Ya **no hace falta estar conectado a la wifi del cole** — Open-Meteo funciona desde cualquier internet.
- Ya **no estamos limitados a Cutral Có** — Open-Meteo tiene datos reales para cualquier ciudad del mundo, así que el buscador (`buscarClima()`) ahora funciona de verdad para cualquier ciudad, no sólo muestra guiones.
- Ya no hace falta esperar a que el profe habilite `humedad`, `presion`, `viento` de a uno — Open-Meteo los da todos juntos, ya están los cuatro activos (temperatura, humedad, presión, viento).

Cómo quedó `js/api.js`:
- Usa dos endpoints de Open-Meteo: **Geocoding** (`geocodificarCiudad()`, convierte un nombre de ciudad en latitud/longitud) y **Forecast** (`fetchClimaPorCoordenadas()`, da el clima actual para esa latitud/longitud).
- `detectarCiudadPorIP()` sigue usando ipapi.co para saber en qué ciudad está el visitante, pero ahora usa directamente la latitud/longitud que da ese mismo servicio (no hace falta geocodificar de nuevo).
- `mostrarClimaSegunCiudad(ciudad)` ahora geocodifica cualquier ciudad escrita y muestra su clima real; si no encuentra la ciudad, muestra un mensaje de error claro (con botón para reintentar), en vez del viejo "no hay sensor para esta ciudad".
- Sigue teniendo timeout (6 segundos) y botón "Reintentar" — mismo comportamiento robusto de antes, ahora aplicado a Open-Meteo.
- `API_CONFIG.campos` es donde se pide la lista de datos a Open-Meteo (`temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m`) — se puede sumar cualquier otro campo de la lista en open-meteo.com/en/docs con una sola línea.
- Open-Meteo no da "visibilidad" en el bloque `current`, así que esa tarjeta queda en "--" (no rompe nada, sólo no hay ese dato).

Cómo quedó `js/mapa.js`:
- El círculo del mapa ya no queda fijo en Cutral Có: `actualizarUbicacionMapa(lat, lon, nombre)` lo mueve a la ubicación que se esté mostrando (la detectada por IP, o la buscada a mano), y `actualizarColorClimaMapa(temperatura)` sigue cambiando el color según la temperatura real (azul frío, verde templado, rojo calor, gris sin datos). Ambas funciones las llama `js/api.js` automáticamente.
- La variable se llama `UBICACION_INICIAL` ahora (antes `SENSOR_UBICACION`), porque ya no representa un sensor fijo sino sólo el punto de partida antes de tener el primer dato real.

Se actualizaron los textos de `index.html`, `mapa.html`, `nosotros.html`, `contacto.html` y `pronostico.html` que decían "sensor" o "API de la cátedra" para que digan "Open-Meteo" en vez de referirse al sensor físico viejo.

**Pendiente de probar:** no se pudo probar en vivo contra Open-Meteo desde este entorno (por una restricción de red del lado de acá, no del código). Hay que probarlo en tu compu con internet normal — no hace falta wifi especial, cualquier conexión sirve.

## Qué se arregló antes (con la API vieja del sensor propio)

- **Bug crítico en `js/api.js`**: había un carácter `S` suelto después de una función (`}S`), lo que rompía TODO el script con un error de sintaxis. Por eso no aparecían los datos, aunque estuvieras conectado a la Wi-Fi correcta. Ya está arreglado.
- **`js/api.js` reescrito** para que funcione con la API real de la cátedra (`http://10.10.10.3:3000/api/...`), que tiene un endpoint separado por cada dato (temperatura, humedad, etc.) en vez de un solo endpoint con parámetro de ciudad. Ahora hay un mapa `ENDPOINTS` donde se puede sumar `humedad`, `presion`, `viento` con una sola línea cada uno, apenas el profe los pase.
- **Detección de ciudad por IP** (`detectarCiudadPorIP` en `js/api.js`): al abrir la página, pide la ubicación aproximada del visitante (método GET a un servicio externo gratuito) y la pone como sugerencia en el buscador. Si la ciudad detectada (o buscada a mano) es Cutral Có, muestra los datos reales del sensor; si es cualquier otra ciudad, muestra guiones (`--`) y un mensaje aclarando que ahí todavía no hay sensor. Esto demuestra el uso de GET aunque la API real sólo cubra una ciudad.
- **Formulario de contacto real** (`contacto.html` + `js/contacto.js`): manda los datos por POST a `https://httpbin.org/post` (un servicio público que devuelve de eco lo que se le manda, útil para probar sin backend propio todavía). Hay que reemplazar `CONTACT_CONFIG.endpoint` por la URL de Firebase el día que esté listo el backend.
- Se limpiaron los textos de prueba/notas internas que habían quedado en `index.html` (chistes, menciones a "pablo", frases sueltas).

- **Timeout + botón "Reintentar"** en `js/api.js`: si la API no responde en 6 segundos (por ejemplo porque no estamos en la wifi del cole), corta el pedido solo y muestra un mensaje de error con un botón para reintentar sin recargar la página. Antes se podía quedar "cargando" para siempre, o peor, decir "Datos actualizados" aunque no hubiera llegado ningún dato real — los dos casos ya están arreglados.
- **Asistente de IA conectado** (`js/asistente-ia.js` + widget flotante en `index.html` + Worker `agria` en Cloudflare): ver sección de abajo.
- **Mapa con Leaflet + OpenStreetMap** (gratis, sin api key), centrado en Cutral Có, tanto en `index.html` (chico) como en `mapa.html` (grande). Reemplaza los placeholders ("Acá va el mapa...").
- **Marcador con color según la temperatura real**: el círculo del sensor en el mapa no es fijo — cambia de color solo según el último dato que llega de `js/api.js` (`actualizarColorSensorMapa`, en `js/mapa.js`). Azul si hace frío (menos de `TEMP_LIMITE_FRIO`, 10° por defecto), rojo si hace calor (más de `TEMP_LIMITE_CALOR`, 28° por defecto), verde si está templado, y gris mientras no hay datos. Los límites son editables en `js/mapa.js`. Funciona igual en `index.html` y en `mapa.html` (ambos cargan `js/api.js` + `js/mapa.js`).
- **`js/api.js` hecho a prueba de páginas sin tarjeta del clima**: como `mapa.html` no tiene los elementos de la tarjeta (`weatherTemp`, etc.), se agregó `setTextoSiExiste()` para que esas funciones no rompan si un elemento no existe en la página — así el mismo `js/api.js` sirve para actualizar sólo el color del mapa en `mapa.html`, sin necesitar la tarjeta completa.
- (Se probó un widget satelital de nubes/lluvia embebido de Windy.com en `mapa.html`, pero se volvió a cambiar por el mapa del sensor con color — si en algún momento se quiere volver a esa vista, quedó documentado en el historial de este archivo.)

## Lo más urgente para mostrar

1. Abrir `index.html` con doble clic (no hace falta servidor ni wifi especial — cualquier internet sirve, ya no se depende de la red del cole).
2. Si no aparece la temperatura, probar la URL de Open-Meteo directamente en una pestaña del navegador, por ejemplo: `https://api.open-meteo.com/v1/forecast?latitude=-38.9333&longitude=-69.2167&current=temperature_2m`. Si ahí tampoco responde, el problema es de internet, no de la página.
3. Asistente de IA: ya está conectado (ver abajo). Probarlo en el botón flotante de `index.html`.

## Asistente de IA (Cloudflare Workers AI)

Se probó primero con la API de Venice, pero pedía saldo cargado (no era realmente gratis para usar, sólo para sacar la key). Se cambió a **Workers AI**, los modelos de IA que vienen incluidos en Cloudflare — gratis con un límite diario generoso, sin cuenta aparte, sin tarjeta, sin api key que cuidar.

Armado en el proyecto:
- `index.html`: widget flotante (botón abajo a la derecha, se abre/cierra) — ya **no** está en `nosotros.html`.
- `js/asistente-ia.js`: arma el pedido, guarda el historial de la charla (`historialIA`, en memoria — se pierde al recargar), conecta el widget, y ya apunta a `https://agria.unbanesteban.workers.dev/`.
- `cloudflare-worker/worker.js`: el código del Worker — llama a Workers AI con el binding `AI`, manda el historial completo como contexto y pide hasta 700 tokens de respuesta (para que no se corte a la mitad).
- `cloudflare-worker/README.md`: paso a paso y notas de los últimos cambios.

**Fix: la IA "inventaba" la temperatura.** Como un modelo de lenguaje no tiene acceso a datos del clima en tiempo real por sí solo, si le preguntabas "¿qué temperatura hace en Cutral Có?" contestaba un número inventado, distinto al que mostraba la página — daba la sensación de que "contradecía" a la página. Se arregló armando el system prompt de forma dinámica (`construirSystemPrompt()` en `js/asistente-ia.js`), sumándole el dato real que `js/api.js` va guardando en `ultimoClimaMostrado` cada vez que se actualiza el clima. Así la IA usa el número real de la página en vez de calcular uno propio, y si todavía no hay ningún dato cargado, lo aclara en vez de inventar. No hizo falta tocar `worker.js` (el Worker sólo reenvía el `system` que le manda la página).

**Segunda vuelta del mismo fix (el modelo seguía sin usar el dato real).** Después de este primer arreglo, la IA a veces seguía contestando "no tengo acceso a la información actualizada" aunque el dato real estuviera en el system prompt — el modelo que usamos (`llama-3.1-8b-instruct-fp8`) es chico y a veces "no le presta atención" a un dato que quedó lejos, al principio de todo un mensaje largo, y responde con su reflejo entrenado de negar acceso a tiempo real. Se reforzó con `datoRealComoTexto()` (nueva función en `js/asistente-ia.js`): además de ir en el system prompt, el mismo dato se pega directamente al lado de la pregunta del usuario, sólo en el mensaje que se manda a la API — el `historialIA` que se guarda y se muestra en el chat queda limpio, sin ese texto repetido en cada burbuja. Esto pasa en `enviarMensajeIA()`, armando una copia (`mensajesParaAPI`) del historial para el pedido, en vez de mandar `historialIA` directamente. Tampoco hizo falta tocar `worker.js` para este segundo ajuste (es 100% del lado de la página).

**Estado: probado y funcionando** (Worker `agria` respondiendo con el binding `AI` de Workers AI, confirmado con el comando de PowerShell de `cloudflare-worker/README.md`).

El modelo usado es `@cf/meta/llama-3.1-8b-instruct-fp8` (el original, sin `-fp8`, quedó deprecado por Cloudflare el 30/05/2026 — se cambió esa línea en `worker.js`).

Dos problemas que reportó Esteban y ya se arreglaron:
- Las respuestas se cortaban a la mitad → se agregó `max_tokens: 700` en el pedido a Workers AI (worker.js).
- No se guardaba el historial de la charla (cada pregunta era "nueva" para la IA) → ahora `js/asistente-ia.js` guarda los mensajes en `historialIA` y se los manda todos al Worker en cada pregunta, así el asistente tiene contexto de lo hablado antes (dentro de la misma visita a la página; se pierde si se recarga).

**Importante:** el `worker.js` de esta carpeta es sólo de referencia — para que el cambio tenga efecto hay que volver a pegarlo en el editor de Cloudflare (Worker `agria` → Edit code → pegar → Save and deploy). Ver `cloudflare-worker/README.md`.

El binding viejo de Secrets Store (`VENICE_API_KEY`) y la cuenta de Venice ya no se usan — se pueden dejar así, no molestan, pero tampoco hacen nada.

## Pendiente / a decidir

- Probar en vivo contra Open-Meteo (ver arriba) apenas se pueda, para confirmar que las URLs y los nombres de campo están bien.
- Si el profesor nuevo pide mostrar más datos de Open-Meteo (por ejemplo `weather_code` para un ícono más preciso, o `apparent_temperature`), sólo hay que sumarlos a `API_CONFIG.campos` en `js/api.js` y leerlos en `fetchClimaPorCoordenadas()`.
- Pronóstico extendido (`pronostico.html`) sigue siendo un placeholder — Open-Meteo tiene un parámetro `daily` que da varios días de pronóstico, quedaría fácil de armar cuando haya tiempo.
- Firebase: hosting y dominio propio (`.com` o `.farm` por Spaceship) — ya no hace falta para el asistente de IA, sólo para el hosting del sitio.
- `js/weather-icons.js`, `components/header.html` y `components/footer.html` quedaron sin usar de una versión anterior del diseño — se pueden borrar cuando quieran, no los toqué por las dudas.
