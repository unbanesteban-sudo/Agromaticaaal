// Lo explica: Ailin
// Chicos, esto lo usan todas las páginas: abre y cierra el menú en el celular
// (el botón de las tres rayitas) y pone el año actual en el pie de página.

function toggleMenu() {
  var nav = document.getElementById("mainNav");
  nav.classList.toggle("open");
}

var anioFooter = document.getElementById("footerYear");
if (anioFooter) {
  anioFooter.innerText = new Date().getFullYear();
}
