// Lo explica: Roga
// Chicos, esta es la pantalla de login. Se puede crear una cuenta con mail y contraseña,
// iniciar sesión, entrar como invitado (cuenta anónima) o pedir un mail para cambiar
// la contraseña. Todo eso lo hace Firebase; nosotros solo le pasamos los datos.

var modoLogin = "entrar";
var procesandoLogin = false;

var ERRORES_FIREBASE = {
  "auth/invalid-email": "Ese mail no es válido.",
  "auth/invalid-credential": "El mail o la contraseña son incorrectos.",
  "auth/email-already-in-use": "Ya existe una cuenta con ese mail. Probá iniciar sesión.",
  "auth/weak-password": "La contraseña tiene que tener al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Esperá un rato y probá de nuevo.",
  "auth/network-request-failed": "No hay conexión a internet."
};

function mostrarMensajeLogin(texto, tipo) {
  var mensaje = document.getElementById("loginMensaje");
  mensaje.textContent = texto;
  mensaje.className = "login-mensaje " + tipo;
}

function errorDeLogin(error) {
  procesandoLogin = false;
  document.getElementById("loginBoton").disabled = false;
  mostrarMensajeLogin(ERRORES_FIREBASE[error.code] || "Hubo un error: " + error.message, "error");
}

function cambiarModoLogin(modo) {
  modoLogin = modo;
  document.getElementById("tabEntrar").className = (modo === "entrar") ? "activo" : "";
  document.getElementById("tabCrear").className = (modo === "crear") ? "activo" : "";
  document.getElementById("campoNombre").style.display = (modo === "crear") ? "" : "none";
  document.getElementById("loginBoton").textContent = (modo === "crear") ? "Crear cuenta" : "Iniciar sesión";
  mostrarMensajeLogin("", "");
}

function irAlInicio() {
  window.location.href = "index.html";
}

function enviarLogin() {
  var nombre = document.getElementById("loginNombre").value.trim();
  var mail = document.getElementById("loginMail").value.trim();
  var clave = document.getElementById("loginClave").value;

  if (modoLogin === "crear" && !nombre) {
    mostrarMensajeLogin("Escribí tu nombre.", "error");
    return;
  }
  if (!mail || !clave) {
    mostrarMensajeLogin("Completá el mail y la contraseña.", "error");
    return;
  }

  procesandoLogin = true;
  document.getElementById("loginBoton").disabled = true;
  mostrarMensajeLogin("Un segundo...", "ok");

  if (modoLogin === "crear") {
    firebase.auth().createUserWithEmailAndPassword(mail, clave)
      .then(function (resultado) {
        return resultado.user.updateProfile({ displayName: nombre });
      })
      .then(irAlInicio)
      .catch(errorDeLogin);
  } else {
    firebase.auth().signInWithEmailAndPassword(mail, clave)
      .then(irAlInicio)
      .catch(errorDeLogin);
  }
}

function entrarComoInvitado() {
  procesandoLogin = true;
  mostrarMensajeLogin("Entrando como invitado...", "ok");
  firebase.auth().signInAnonymously()
    .then(irAlInicio)
    .catch(errorDeLogin);
}

function recuperarClave() {
  var mail = document.getElementById("loginMail").value.trim();
  if (!mail) {
    mostrarMensajeLogin("Escribí tu mail arriba y tocá de nuevo para recuperar la contraseña.", "error");
    return;
  }

  firebase.auth().sendPasswordResetEmail(mail)
    .then(function () {
      mostrarMensajeLogin("Te mandamos un mail para cambiar la contraseña.", "ok");
    })
    .catch(errorDeLogin);
}

function teclaLogin(evento) {
  if (evento.key === "Enter") {
    enviarLogin();
  }
}

// Si la persona ya había iniciado sesión antes, la mandamos directo al inicio.
if (iniciarFirebase()) {
  firebase.auth().onAuthStateChanged(function (usuario) {
    if (usuario && !procesandoLogin) {
      irAlInicio();
    }
  });
} else {
  mostrarMensajeLogin("No se pudo cargar Firebase. Revisá la conexión a internet.", "error");
}
