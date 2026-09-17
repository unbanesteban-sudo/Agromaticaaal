const MODELO = "@cf/meta/llama-3.1-8b-instruct-fp8";

const MAX_TOKENS_RESPUESTA = 700;

export default {
  async fetch(request, env) {
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
