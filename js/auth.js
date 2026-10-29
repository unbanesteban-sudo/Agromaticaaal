function firebaseEstaConfigurado() {
  return typeof firebase !== "undefined" &&
    typeof firebaseConfig !== "undefined" &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "PEGAR_ACA";
}

function iniciarFirebase() {
  if (!firebaseEstaConfigurado()) {
    return false;
  }
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  return true;
}

function nombreDelUsuario(usuario) {
  if (usuario.isAnonymous) {
    return "Invitado";
  }
  if (usuario.displayName) {
    return usuario.displayName;
  }
  return usuario.email.split("@")[0];
}

function cuandoCargueLaPagina(funcion) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", funcion);
  } else {
    funcion();
  }
}

function mostrarUsuario(usuario) {
  var caja = document.getElementById("userBox");
  if (!caja) {
    return;
  }

  var nombre = nombreDelUsuario(usuario);
  caja.innerHTML = "";

  var avatar = document.createElement("span");
  avatar.className = "user-avatar";
  avatar.textContent = nombre.charAt(0).toUpperCase();

  var texto = document.createElement("span");
  texto.className = "user-nombre";
  texto.textContent = nombre;

  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "user-salir";
  boton.textContent = "Salir";
  boton.setAttribute("onclick", "cerrarSesion()");

  caja.appendChild(avatar);
  caja.appendChild(texto);
  caja.appendChild(boton);
}

function cerrarSesion() {
  firebase.auth().signOut().then(function () {
    window.location.href = "login.html";
  });
}

function protegerPagina() {
  if (!iniciarFirebase()) {
    console.warn("[Agromatical] Firebase no está configurado, la página se muestra sin login.");
    return;
  }

  document.documentElement.classList.add("esperando-login");

  firebase.auth().onAuthStateChanged(function (usuario) {
    if (!usuario) {
      window.location.href = "login.html";
      return;
    }

    document.documentElement.classList.remove("esperando-login");
    cuandoCargueLaPagina(function () {
      mostrarUsuario(usuario);
    });
  });
}

if (window.location.pathname.indexOf("login.html") === -1) {
  protegerPagina();
}
