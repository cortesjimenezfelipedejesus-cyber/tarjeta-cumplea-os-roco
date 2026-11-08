// ====== PERSONALIZA AQUÍ ======
// Cada elemento es un renglón del mensaje (máx. ~24 letras por renglón).
// Una línea vacía "" deja un espacio en blanco.
// Caben 8 renglones en el papel.
const LINEAS = [
  "¡Feliz cumpleaños!",
  "Para: Rocio",
  "",
  "Que este nuevo año te",
  "traiga mucha alegría,",
  "sueños cumplidos y",
  "momentos muy bonitos.",
  "En compañia de tu familia.",
];
const CANTIDAD_ESTRELLAS = 140;

// ⏱️ AQUÍ ESTÁ EL CONTROL DE TIEMPO: 
// Cambia este número (en segundos) para adelantar o retrasar el inicio de la canción.
const SEGUNDO_INICIO_MUSICA = 7; 
// ==============================

// ---------- Estrellas parpadeantes ----------
const cielo = document.getElementById("estrellas");
for (let i = 0; i < CANTIDAD_ESTRELLAS; i++) {
  const e = document.createElement("span");
  e.className = "estrella";
  const tam = Math.random() * 2.5 + 1;
  e.style.width = e.style.height = tam + "px";
  e.style.left = Math.random() * 100 + "%";
  e.style.top = Math.random() * 100 + "%";
  e.style.setProperty("--dur", (Math.random() * 3 + 2) + "s");
  e.style.setProperty("--delay", (Math.random() * 4) + "s");
  cielo.appendChild(e);
}

// ---------- Mensaje: se crean los renglones (ocultos) ----------
const tarjeta = document.getElementById("tarjeta");
const contenedor = document.getElementById("mensaje");
const pluma = document.getElementById("pluma");
const pista = document.getElementById("pista");

const renglones = LINEAS.map((texto) => {
  const p = document.createElement("span");
  p.className = "linea";
  p.textContent = texto === "" ? "\u00A0" : texto;
  contenedor.appendChild(p);
  return p;
});

// ---------- Posiciones de la pluma ----------
// Todas las medidas salen del ancho de la tarjeta, así funciona en cualquier pantalla.
function reposo() {
  const W = tarjeta.clientWidth;
  return { x: W * 0.715, y: W * 1.155 };   // punta dentro del tintero
}

function colocar(x, y, giro) {
  pluma.style.transform = `translate(${x}px, ${y}px) rotate(${giro}deg)`;
}

colocar(reposo().x, reposo().y, 0);
window.addEventListener("resize", () => {
  if (!escribiendo) colocar(reposo().x, reposo().y, 0);
});

// ---------- Animación de escritura ----------
let escribiendo = false;

const suave = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
const mezcla = (a, b, u) => a + (b - a) * u;

function revelar(el, fraccion) {
  el.style.clipPath = `inset(-25% ${(1 - fraccion) * 100}% -25% 0)`;
}

function escribir() {
  if (escribiendo) return;
  escribiendo = true;
  pluma.classList.add("escribiendo");
  pista.classList.add("oculta");

  // Si la persona prefiere menos movimiento, se muestra todo de una vez
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renglones.forEach((r) => revelar(r, 1));
    return;
  }

  const cajaTarjeta = tarjeta.getBoundingClientRect();
  let pos = { ...reposo(), giro: 0 };
  const GIRO_ESCRIBIR = 16;

  // Se arma la lista de pasos: ir al renglón -> escribirlo -> siguiente...
  const pasos = [];
  renglones.forEach((r, i) => {
    if (!LINEAS[i].trim()) return;                       // renglón vacío: se salta
    const caja = r.getBoundingClientRect();
    const g = {
      x: caja.left - cajaTarjeta.left,
      y: caja.top - cajaTarjeta.top + caja.height * 0.66,   // sobre la línea de escritura
      w: caja.width,
    };
    pasos.push({ tipo: "ir", de: pos, a: { x: g.x - 2, y: g.y, giro: GIRO_ESCRIBIR }, dur: 520 });
    pasos.push({ tipo: "escribir", el: r, g, letras: LINEAS[i].length,
                 dur: Math.max(900, LINEAS[i].length * 55) });
    pos = { x: g.x + g.w, y: g.y, giro: GIRO_ESCRIBIR };
  });
  pasos.push({ tipo: "ir", de: pos, a: { ...reposo(), giro: 0 }, dur: 1000 });

  let indice = 0;
  let inicio = performance.now();

  function cuadro(ahora) {
    const paso = pasos[indice];
    const u = Math.min((ahora - inicio) / paso.dur, 1);

    if (paso.tipo === "ir") {
      const k = suave(u);
      const arco = Math.sin(Math.PI * k) * 26;           // la pluma se levanta un poco al viajar
      colocar(
        mezcla(paso.de.x, paso.a.x, k),
        mezcla(paso.de.y, paso.a.y, k) - arco,
        mezcla(paso.de.giro, paso.a.giro, k)
      );
    } else {
      revelar(paso.el, u);
      const fase = u * paso.letras;
      colocar(
        paso.g.x + u * paso.g.w,
        paso.g.y + Math.sin(fase * 1.6) * 2.4,           // vaivén de escritura
        GIRO_ESCRIBIR + Math.sin(fase * 1.1) * 3
      );
    }

    if (u >= 1) {
      if (paso.tipo === "escribir") revelar(paso.el, 1);
      indice++;
      inicio = ahora;
      if (indice >= pasos.length) return;                // terminó: la pluma queda en el tintero
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
}

pluma.addEventListener("click", escribir);
pluma.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    escribir();
  }
});

// ---------- Música sin botón ----------
// Se intenta reproducir al abrir la página. 
// Si el navegador la bloquea (política de autoplay), sonará en el primer clic o toque en la pantalla.
const musica = document.getElementById("musica");

function iniciarMusica() {
  musica.currentTime = SEGUNDO_INICIO_MUSICA; // 👈 Aquí se salta al segundo indicado antes de reproducir
  musica.play().then(() => {
    // Si se reproduce con éxito, eliminamos los escuchas para que no se intente una y otra vez
    document.removeEventListener("click", iniciarMusica);
    document.removeEventListener("touchstart", iniciarMusica);
    document.removeEventListener("keydown", iniciarMusica);
  }).catch(() => { /* Espera a la primera interacción del usuario si el navegador lo bloquea */ });
}

// Intentar reproducir al cargar la página automáticamente
iniciarMusica();

// Respaldos: si el navegador bloquea el inicio automático, se activará con el primer clic, toque o tecla
document.addEventListener("click", iniciarMusica);
document.addEventListener("touchstart", iniciarMusica);
document.addEventListener("keydown", iniciarMusica);

// Si una imagen no existe, se oculta en lugar de mostrar un icono roto
document.querySelectorAll(".deco").forEach((img) => {
  img.addEventListener("error", () => { img.style.display = "none"; });
});