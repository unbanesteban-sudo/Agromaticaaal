var CONTACT_CONFIG = {
  endpoint: "https://httpbin.org/post" 
};

function enviarContacto() {
  var nombre = document.getElementById("contactNombre").value;
  var email = document.getElementById("contactEmail").value;
  var mensaje = document.getElementById("contactMensaje").value;
  var estado = document.getElementById("contactStatus");

  if (!nombre || !email || !mensaje) {
    estado.innerText = "Completá todos los campos.";
    return;
  }

  estado.innerText = "Enviando...";

  fetch(CONTACT_CONFIG.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: nombre, email: email, mensaje: mensaje })
  })
    .then(function (respuesta) {
      return respuesta.json();
    })
    .then(function (data) {
      console.log("[Agromatical] Respuesta del servidor:", data);
      estado.innerText = "¡Mensaje enviado! Gracias " + nombre + ".";
    })
    .catch(function (error) {
      console.error("[Agromatical] Error al enviar el contacto:", error);
      estado.innerText = "No se pudo enviar. Probá de nuevo más tarde.";
    });
}
