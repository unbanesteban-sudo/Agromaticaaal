# Cómo conectar el asistente de IA (Cloudflare Workers AI)

Usamos **Workers AI**, que son modelos de IA que ya vienen incluidos en Cloudflare — gratis hasta un uso diario bastante generoso, sin cuenta aparte, sin tarjeta, sin api key que cuidar.

Ya tenés el Worker `agria` creado y andando. Esta versión trae dos cambios sobre la anterior:

- El modelo viejo (`@cf/meta/llama-3.1-8b-instruct`) quedó deprecado por Cloudflare — se cambió por `@cf/meta/llama-3.1-8b-instruct-fp8`.
- Las respuestas se cortaban a la mitad porque no se pedía un límite de tokens explícito — ahora se manda `max_tokens: 700`. Si se siguen cortando, se puede subir ese número en `worker.js`.
- El asistente ahora tiene memoria de la charla (historial), así que el body que manda la página cambió de `{ system, pregunta }` a `{ system, mensajes }`, donde `mensajes` es la lista completa de la conversación hasta ahora.

## 1. Actualizar el código del Worker

1. En el dashboard de Cloudflare, entrá al Worker `agria`.
2. Click en **Edit code**.
3. Borrá todo y pegá el contenido completo del `worker.js` de esta carpeta.
4. **Save and deploy**.

## 2. Binding de Workers AI

Ya lo tenés armado (`AI → Workers AI`), no hace falta tocar nada acá salvo que lo hayas borrado por error. Si hace falta rehacerlo: panel **Bindings** → **Add a binding** → **Workers AI** → Variable name `AI` → **Add Binding** → **Deploy**.

## 3. Probar el Worker

```powershell
Invoke-RestMethod -Uri "https://agria.unbanesteban.workers.dev/" -Method Post -ContentType "application/json" -Body '{"system":"Sos un asistente util.","mensajes":[{"role":"user","content":"¿cada cuánto conviene regar tomates en verano?"}]}'
```

Si responde con un `respuesta` con texto adentro, ya está — anda. Si tira error, pegámelo tal cual. (Las letras con tilde/ñ pueden verse raras en PowerShell clásico — eso es solo cómo esa consola vieja muestra el texto, no un error real; en el navegador se ven bien.)

## 4. Probar en la página

El asistente ya no está en `nosotros.html` — ahora es un **botón flotante** abajo a la derecha en `index.html` (el ícono de globo de chat). Refresh forzado (Ctrl+F5), click en el botón para abrir el panel, escribí una pregunta y Enviar (o Enter). Podés seguir la charla — el asistente recuerda lo que se dijo antes, dentro de la misma visita a la página.

## Notas

- El modelo usado es `@cf/meta/llama-3.1-8b-instruct-fp8`. Si en algún momento no está disponible, se puede cambiar por otro de la lista en developers.cloudflare.com/workers-ai/models/ (sólo hay que cambiar una línea en `worker.js`).
- El historial de la charla vive en una variable de `js/asistente-ia.js` (`historialIA`), en memoria del navegador — se pierde si se recarga la página. No se guarda en ningún servidor ni base de datos.
- Como no depende de ninguna cuenta externa ni de saldo, esto no debería fallar por plata — el límite es un uso diario gratis bastante alto para lo que necesita un proyecto de facultad.
