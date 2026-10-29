// Lo explica: Thiago
// Chicos, el formulario no tiene un servidor propio: cuando tocan Enviar se abre el
// mail de la persona (Gmail, Outlook, etc.) con el mensaje ya escrito para nosotros.

var MAIL_DEL_EQUIPO = "agromatical@gmail.com";

function enviarContacto() {
  var nombre = document.getElementById("contactNombre").value.trim();
  var email = document.getElementById("contactEmail").value.trim();
  var mensaje = document.getElementById("contactMensaje").value.trim();
  var estado = document.getElementById("contactStatus");

  if (!nombre || !email || !mensaje) {
    estado.innerText = "Completá todos los campos.";
    return;
  }

  if (email.indexOf("@") === -1) {
    estado.innerText = "Revisá el mail, le falta el @.";
    return;
  }

  var asunto = "Consulta de " + nombre + " desde Agromatical";
  var cuerpo = mensaje + "\n\n" + nombre + " (" + email + ")";

  window.location.href = "mailto:" + MAIL_DEL_EQUIPO +
    "?subject=" + encodeURIComponent(asunto) +
    "&body=" + encodeURIComponent(cuerpo);

  estado.innerText = "Se abrió tu mail con el mensaje listo. Solo falta tocar Enviar ahí.";
}
