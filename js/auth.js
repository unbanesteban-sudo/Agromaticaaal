// Lo explica: Roga
// Chicos, esto protege las páginas: si alguien entra sin haber iniciado sesión,
// lo mandamos a login.html. Si ya entró, arriba a la derecha mostramos su nombre
// y el botón Salir. Las cuentas las maneja Firebase (de Google).
// Si no hay internet (por ejemplo en la red del profe) Firebase no carga, y en ese
// caso dejamos ver la página igual para que no quede trabada.

function iniciarFirebase() {
  if (typeof firebase === "undefined") {
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
  return usuario.displayName || usuario.email.split("@")[0];
}

function mostrarUsuario(usuario) {
  var nombre = nombreDelUsuario(usuario);
  var caja = document.getElementById("userBox");

  caja.innerHTML =
    "<span class=\"user-avatar\"></span>" +
    "<span class=\"user-nombre\"></span>" +
    "<button type=\"button\" class=\"user-salir\" onclick=\"cerrarSesion()\">Salir</button>";

  caja.querySelector(".user-avatar").textContent = nombre.charAt(0).toUpperCase();
  caja.querySelector(".user-nombre").textContent = nombre;
}

function cerrarSesion() {
  firebase.auth().signOut().then(function () {
    window.location.href = "login.html";
  });
}

function protegerPagina() {
  if (!iniciarFirebase()) {
    return;
  }

  document.documentElement.classList.add("esperando-login");

  firebase.auth().onAuthStateChanged(function (usuario) {
    if (!usuario) {
      window.location.href = "login.html";
      return;
    }
    document.documentElement.classList.remove("esperando-login");

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        mostrarUsuario(usuario);
      });
    } else {
      mostrarUsuario(usuario);
    }
  });
}
