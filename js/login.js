var modoLogin = "entrar";
var procesandoLogin = false;

function mostrarMensajeLogin(texto, tipo) {
  var mensaje = document.getElementById("loginMensaje");
  mensaje.textContent = texto;
  mensaje.className = "login-mensaje " + (tipo || "");
}

function traducirErrorFirebase(error) {
  var errores = {
    "auth/invalid-email": "Ese mail no es válido.",
    "auth/user-not-found": "No hay ninguna cuenta con ese mail.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-credential": "El mail o la contraseña son incorrectos.",
    "auth/invalid-login-credentials": "El mail o la contraseña son incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta con ese mail. Probá iniciar sesión.",
    "auth/weak-password": "La contraseña tiene que tener al menos 6 caracteres.",
    "auth/missing-password": "Escribí una contraseña.",
    "auth/too-many-requests": "Demasiados intentos. Esperá un rato y probá de nuevo.",
    "auth/network-request-failed": "No hay conexión a internet.",
    "auth/operation-not-allowed": "Este tipo de login no está activado en Firebase."
  };

  if (error && errores[error.code]) {
    return errores[error.code];
  }
  return "Hubo un error: " + (error && error.message ? error.message : "desconocido");
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

function bloquearBoton(bloqueado, texto) {
  var boton = document.getElementById("loginBoton");
  boton.disabled = bloqueado;
  boton.textContent = texto;
}

function textoDelBoton() {
  return (modoLogin === "crear") ? "Crear cuenta" : "Iniciar sesión";
}

function falloLogin(error) {
  procesandoLogin = false;
  bloquearBoton(false, textoDelBoton());
  mostrarMensajeLogin(traducirErrorFirebase(error), "error");
}

function enviarLogin() {
  var nombre = document.getElementById("loginNombre").value.trim();
  var mail = document.getElementById("loginMail").value.trim();
  var clave = document.getElementById("loginClave").value;

  if (!iniciarFirebase()) {
    mostrarMensajeLogin("Falta configurar Firebase en js/firebase-config.js.", "error");
    return;
  }

  if (modoLogin === "crear" && !nombre) {
    mostrarMensajeLogin("Escribí tu nombre.", "error");
    return;
  }

  if (!mail || !clave) {
    mostrarMensajeLogin("Completá el mail y la contraseña.", "error");
    return;
  }

  procesandoLogin = true;

  if (modoLogin === "crear") {
    bloquearBoton(true, "Creando cuenta...");
    firebase.auth().createUserWithEmailAndPassword(mail, clave)
      .then(function (credencial) {
        return credencial.user.updateProfile({ displayName: nombre });
      })
      .then(irAlInicio)
      .catch(falloLogin);
  } else {
    bloquearBoton(true, "Entrando...");
    firebase.auth().signInWithEmailAndPassword(mail, clave)
      .then(irAlInicio)
      .catch(falloLogin);
  }
}

function entrarComoInvitado() {
  if (!iniciarFirebase()) {
    mostrarMensajeLogin("Falta configurar Firebase en js/firebase-config.js.", "error");
    return;
  }

  procesandoLogin = true;
  mostrarMensajeLogin("Entrando como invitado...", "ok");
  firebase.auth().signInAnonymously()
    .then(irAlInicio)
    .catch(falloLogin);
}

function recuperarClave() {
  var mail = document.getElementById("loginMail").value.trim();

  if (!iniciarFirebase()) {
    mostrarMensajeLogin("Falta configurar Firebase en js/firebase-config.js.", "error");
    return;
  }

  if (!mail) {
    mostrarMensajeLogin("Escribí tu mail arriba y tocá de nuevo para recuperar la contraseña.", "error");
    return;
  }

  firebase.auth().sendPasswordResetEmail(mail)
    .then(function () {
      mostrarMensajeLogin("Te mandamos un mail para cambiar la contraseña.", "ok");
    })
    .catch(function (error) {
      mostrarMensajeLogin(traducirErrorFirebase(error), "error");
    });
}

function teclaLogin(evento) {
  if (evento.key === "Enter") {
    enviarLogin();
  }
}

function iniciarPaginaLogin() {
  if (!iniciarFirebase()) {
    mostrarMensajeLogin("Falta configurar Firebase en js/firebase-config.js.", "error");
    return;
  }

  firebase.auth().onAuthStateChanged(function (usuario) {
    if (usuario && !procesandoLogin) {
      irAlInicio();
    }
  });
}

iniciarPaginaLogin();
