// =================================================================
// Proxy para el asistente de IA de Climaxer / Agromatical
// =================================================================
// Usa Workers AI (los modelos de IA que ya vienen incluidos en
// Cloudflare, gratis hasta cierto uso diario, sin cuenta aparte ni
// tarjeta). La página le pregunta a este Worker, y el Worker le
// pregunta al modelo usando el binding "AI" que se configura en el
// dashboard (Bindings > Add > Workers AI).
//
// Instrucciones completas: ver README.md en esta misma carpeta.
// =================================================================

// Modelo a usar. Si en algún momento no está disponible, se puede
// cambiar por otro de la lista en developers.cloudflare.com/workers-ai/models/
// (el anterior, @cf/meta/llama-3.1-8b-instruct, quedó deprecado el 30/05/2026)
const MODELO = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Cuántos tokens como máximo puede tener la respuesta. Si las
// respuestas se siguen cortando a la mitad, se puede subir este
// número (las respuestas más largas tardan un poco más en llegar).
const MAX_TOKENS_RESPUESTA = 700;

export default {
  async fetch(request, env) {
    // El navegador manda un pedido OPTIONS antes del POST real
    // ("preflight" de CORS) — hay que contestarlo bien o el
    // navegador bloquea el pedido real.
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: encabezadosCORS() });
    }

    if (request.method !== "POST") {
      return respuestaJSON({ error: "Método no permitido, usar POST" }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return respuestaJSON({ error: "El body tiene que ser JSON válido" }, 400);
    }

    const system = body.system || "Sos un asistente útil.";

    // "mensajes" es el historial de la charla hasta ahora: una lista
    // de { role: "user" | "assistant", content: "..." }. Se manda
    // completo en cada pedido para que el modelo tenga contexto de
    // lo que se preguntó/respondió antes (Workers AI no guarda
    // memoria de conversación por su cuenta).
    const mensajes = Array.isArray(body.mensajes) ? body.mensajes : null;

    if (!mensajes || mensajes.length === 0) {
      return respuestaJSON({ error: "Falta 'mensajes' (array) en el body" }, 400);
    }

    if (!env.AI) {
      return respuestaJSON({ error: "Falta agregar el binding de Workers AI (Bindings > Add a binding > Workers AI, Variable name: AI)" }, 500);
    }

    let respuestaIA;
    try {
      respuestaIA = await env.AI.run(MODELO, {
        messages: [{ role: "system", content: system }].concat(mensajes),
        max_tokens: MAX_TOKENS_RESPUESTA
      });
    } catch (error) {
      return respuestaJSON({ error: "Error al consultar Workers AI: " + error.message }, 502);
    }

    // Según el modelo, Workers AI devuelve el texto en distintos
    // lugares del objeto de respuesta — probamos los dos formatos
    // más comunes.
    var textoRespuesta = "No se pudo obtener una respuesta.";
    if (respuestaIA && typeof respuestaIA.response === "string") {
      textoRespuesta = respuestaIA.response;
    } else if (
      respuestaIA &&
      respuestaIA.choices &&
      respuestaIA.choices[0] &&
      respuestaIA.choices[0].message
    ) {
      textoRespuesta = respuestaIA.choices[0].message.content;
    }

    return respuestaJSON({ respuesta: textoRespuesta });
  }
};

function encabezadosCORS() {
  return {
    // "*" alcanza para este proyecto (sitio público de solo lectura,
    // sin login ni datos sensibles).
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function respuestaJSON(objeto, status) {
  return new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, encabezadosCORS())
  });
}
