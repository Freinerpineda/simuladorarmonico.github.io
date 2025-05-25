let canvas = document.querySelector("#canvas");
let $pos = document.querySelector("#pos");
let $vel = document.querySelector("#vel");
let $ace = document.querySelector("#ace");
let ctx = canvas.getContext("2d");

// Entrada de masa
let $masaInput = document.querySelector("#masa");
$masaInput.value = 600;
// Entrada de constante del resorte
let $constResorte = document.querySelector("#resorte_const");
$constResorte.value = 50;
// Entrada de amortiguamiento
let $amortInput = document.querySelector("#amortiguamiento");
let $amortVal = document.querySelector("#amortiguamiento_val");
$amortVal.textContent = parseFloat($amortInput.value).toFixed(2);
let b = parseFloat($amortInput.value);

// Botón para iniciar/detener la animación
let $playBt = document.querySelector("#btnPlay");
// Botón para reiniciar
let $btnRestart = document.querySelector("#btn-restart");
// Checkbox para mostrar equilibrio
let $checkboxEquilibrio = document.querySelector("#ver_equilibrio");
let mostrarEquilibrio = $checkboxEquilibrio.checked;

// ECUACIONES
let $divEcuPos = document.querySelector("#eqPos");
let $divEcuVel = document.querySelector("#eqVelo");
let $divEcuAce = document.querySelector("#eqAce");
let $divEcuTitulo = document.querySelector("#eqTitulo");

function restaurarEcua() {
  $divEcuPos.innerHTML = "x(t) = Asen(&omega;t + &phi;) [m]";
  $divEcuVel.innerHTML = "v(t) = A&omega;cos(&omega;t + &phi;) [m/s]";
  $divEcuAce.innerHTML =
    "a(t) = -A&omega;<sup>2</sup>sen(&omega;t + &phi;) [m/s<sup>2</sup>]";
}

function actualizarEcua() {
  let m = parseFloat($masaInput.value) / 1000;
  let k = parseFloat($constResorte.value);
  b = parseFloat($amortInput.value);
  let w0 = Math.sqrt(k / m);
  let gamma = b / (2 * m);
  let A = amplitudeMeters.toFixed(3);
  let phi = phase.toFixed(3);

  // Redondeo a 2 decimales para comparar amortiguamiento crítico
  let gamma2 = Number(gamma.toFixed(2));
  let w02 = Number(w0.toFixed(2));

  if (gamma2 < w02 && b > 0) {
    // Subamortiguado
    let wd = Math.sqrt(w0 * w0 - gamma * gamma);
    $divEcuTitulo.innerHTML = "Oscilación Amortiguada (Subamortiguada)";
    $divEcuPos.innerHTML = `x(t) = ${A}·e<sup>-${gamma.toFixed(3)}·t</sup>·sen(${wd.toFixed(3)}·t + ${phi}) [m]`;
    $divEcuVel.innerHTML = `v(t) = ${A}·e<sup>-${gamma.toFixed(3)}·t</sup>·[${wd.toFixed(3)}·cos(${wd.toFixed(3)}·t + ${phi}) - ${gamma.toFixed(3)}·sen(${wd.toFixed(3)}·t + ${phi})] [m/s]`;
    $divEcuAce.innerHTML = `a(t) = ${A}·e<sup>-${gamma.toFixed(3)}·t</sup>·[ -${(wd*wd).toFixed(3)}·sen(${wd.toFixed(3)}·t + ${phi}) - 2·${gamma.toFixed(3)}·${wd.toFixed(3)}·cos(${wd.toFixed(3)}·t + ${phi}) + ${(gamma*gamma).toFixed(3)}·sen(${wd.toFixed(3)}·t + ${phi}) ] [m/s<sup>2</sup>]`;
  } else if (Math.abs(gamma2 - w02) < 0.01 && b > 0) {
    // Amortiguamiento crítico (comparación con redondeo a 2 decimales)
    $divEcuTitulo.innerHTML = "Oscilación Amortiguada (Crítica)";
    $divEcuPos.innerHTML = `x(t) = (${A} + ${A}·t)·e<sup>-${gamma.toFixed(3)}·t</sup> [m]`;
    $divEcuVel.innerHTML = `v(t) = -${A}·${gamma.toFixed(3)}·e<sup>-${gamma.toFixed(3)}·t</sup> + ${A}·e<sup>-${gamma.toFixed(3)}·t</sup> - ${A}·${gamma.toFixed(3)}·t·e<sup>-${gamma.toFixed(3)}·t</sup> [m/s]`;
    $divEcuAce.innerHTML = `a(t) = ... [m/s<sup>2</sup>]`;
  } else if (b > 0) {
    // Sobreamortiguado
    let r1 = -gamma + Math.sqrt(gamma * gamma - w0 * w0);
    let r2 = -gamma - Math.sqrt(gamma * gamma - w0 * w0);
    let C1 = (A/2).toFixed(3);
    let C2 = (A/2).toFixed(3);
    $divEcuTitulo.innerHTML = "Oscilación Amortiguada (Sobreamortiguada)";
    $divEcuPos.innerHTML = `x(t) = ${C1}·e<sup>${r1.toFixed(3)}·t</sup> + ${C2}·e<sup>${r2.toFixed(3)}·t</sup> [m]`;
    $divEcuVel.innerHTML = `v(t) = ${C1}·${r1.toFixed(3)}·e<sup>${r1.toFixed(3)}·t</sup> + ${C2}·${r2.toFixed(3)}·e<sup>${r2.toFixed(3)}·t</sup> [m/s]`;
    $divEcuAce.innerHTML = `a(t) = ${C1}·${(r1*r1).toFixed(3)}·e<sup>${r1.toFixed(3)}·t</sup> + ${C2}·${(r2*r2).toFixed(3)}·e<sup>${r2.toFixed(3)}·t</sup> [m/s<sup>2</sup>]`;
  } else {
    // No amortiguado (MAS)
    $divEcuTitulo.innerHTML = "Oscilación No Amortiguada (MAS)";
    $divEcuPos.innerHTML = `x(t) = ${A}·sen(${w0.toFixed(3)}·t + ${phi}) [m]`;
    $divEcuVel.innerHTML = `v(t) = ${A}·${w0.toFixed(3)}·cos(${w0.toFixed(3)}·t + ${phi}) [m/s]`;
    $divEcuAce.innerHTML = `a(t) = -${A}·${(w0*w0).toFixed(3)}·sen(${w0.toFixed(3)}·t + ${phi}) [m/s<sup>2</sup>]`;
  }
}

// Variables de control
let isDragging = false;
let possibleDragging = true;
let widthMasa = massToPixel(600);
let heightMasa = massToPixel(600);
let escalaPixelsPorMetro = 100; // Número de píxeles que representan 1 metro

let amplitudeMeters = 0; // Amplitud en metros (inicialmente 0)
let amplitudeMaxMeters =
  (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro; // Amplitud máxima en metros
let amplitude = amplitudeMeters * escalaPixelsPorMetro; // Amplitud en píxeles

let omega = Math.sqrt($constResorte.value / ($masaInput.value / 1000)); // Frecuencia angular
let period = ((2 * Math.PI) / omega) * 1000; // Período en milisegundos
let phase = 0; // Fase inicial
let startTime = null; // Tiempo de inicio
let elapsedTime = 0;
let timeSave = 0;

// Variables para la animación
let posx = 0; // Posición en píxeles
let posxMeters = 0; // Posición en metros
let velocity = 0; // Velocidad
let acceleration = 0; // Aceleración
let isAnimating = false; // Estado de la animación
let animationId = null; // ID de la animación para detenerla

// Variables para gráficas
let datosGrafica = {
  tiempo: [],
  posicion: [],
  velocidad: [],
  aceleracion: [],
  energiaCinetica: [],
  energiaPotencial: []
};
let chart = null;
const maxPuntos = 200; // Máximo de puntos a mostrar

// Referencias a botones y canvas de gráfica
const $btnGrafPos = document.getElementById("btnGrafPos");
const $btnGrafVel = document.getElementById("btnGrafVel");
const $btnGrafAce = document.getElementById("btnGrafAce");
const $canvasGrafica = document.getElementById("grafica");
const $graficaAviso = document.querySelector(".grafica-aviso");
let tipoGraficaActiva = null; // Nueva variable para saber qué gráfica mostrar

// Evento para el checkbox de mostrar equilibrio
$checkboxEquilibrio.addEventListener("change", function () {
  mostrarEquilibrio = this.checked;
  dibujarEscena();
});

function dibujarSuelo() {
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(0, canvas.height / 2 + heightMasa / 2 + 60, canvas.width, 10);
}

function drawSpring(x1, y1, x2, y2, coils = 10) {
  const spacing = (x2 - x1) / (coils * 2);
  const amplitude = 10;

  ctx.beginPath();
  for (let i = 0; i <= coils * 2; i++) {
    const x = x1 + i * spacing;
    const y = y1 + (i % 2 === 0 ? amplitude : -amplitude);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = "#A7A8AA";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function dibujarEquilibrio() {
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  const equilibriumX = canvas.width / 2 + 40;
  ctx.moveTo(
    equilibriumX,
    canvas.height / 2 - heightMasa / 2 + 20
  );
  ctx.lineTo(
    equilibriumX,
    canvas.height / 2 + heightMasa / 2 + 100
  );
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
}

function massToPixel(masa) {
  return Math.round(17980 / 599.8 + (70 * masa) / 599.8);
}

function dibujarRegla() {
  const reglaY = canvas.height / 2 + heightMasa / 2 + 70;
  const equilibriumX = canvas.width / 2 + 40;
  const numDivisiones = 10;
  const divisionLength = 10;
  const longDivisionLength = 15;

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.beginPath();

  ctx.moveTo(equilibriumX - numDivisiones * escalaPixelsPorMetro, reglaY);
  ctx.lineTo(equilibriumX + numDivisiones * escalaPixelsPorMetro, reglaY);
  ctx.stroke();

  for (let i = -numDivisiones; i <= numDivisiones; i++) {
    const x = equilibriumX + i * escalaPixelsPorMetro;
    ctx.beginPath();
    ctx.moveTo(x, reglaY);
    ctx.lineTo(x, reglaY + (i % 1 === 0 ? longDivisionLength : divisionLength));
    ctx.stroke();

    if (i % 1 === 0) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(i.toString(), x, reglaY + 25);
    }
  }
}

function dibujarEscena() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.fillRect(
    posx + canvas.width / 2 - widthMasa / 2 + 40,
    canvas.height / 2 - heightMasa / 2 + 60,
    widthMasa,
    heightMasa
  );

  const springStartX = 0;
  const springEndX = posx + canvas.width / 2 + 40 - widthMasa / 2;
  const springY = canvas.height / 2 + 60;
  drawSpring(springStartX, springY, springEndX, springY);

  dibujarSuelo();

  if (mostrarEquilibrio) {
    dibujarEquilibrio();
  }

  dibujarRegla();

  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  ctx.fillText(`Tiempo: ${elapsedTime.toFixed(2)} s`, canvas.width - 10, 30);

  if (isDragging) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
      `Posición: ${posxMeters.toFixed(3)} m`,
      10,
      canvas.height - 10
    );
  }
}

function metrosAPixeles(metros) {
  return metros * escalaPixelsPorMetro;
}

function pixelesAMetros(pixeles) {
  return pixeles / escalaPixelsPorMetro;
}

function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  elapsedTime = (timestamp - startTime) / 1000;

  let m = parseFloat($masaInput.value) / 1000;
  let k = parseFloat($constResorte.value);
  b = parseFloat($amortInput.value);

  let w0 = Math.sqrt(k / m);
  let gamma = b / (2 * m);

  let underdamped = gamma < w0 && b > 0;
  let pos, vel, ace;

  if (underdamped) {
    let wd = Math.sqrt(w0 * w0 - gamma * gamma);
    pos = amplitudeMeters * Math.exp(-gamma * elapsedTime) * Math.sin(wd * elapsedTime + phase);
    vel = amplitudeMeters * Math.exp(-gamma * elapsedTime) *
      (wd * Math.cos(wd * elapsedTime + phase) - gamma * Math.sin(wd * elapsedTime + phase));
    ace = amplitudeMeters * Math.exp(-gamma * elapsedTime) *
      (-wd * wd * Math.sin(wd * elapsedTime + phase) - 2 * gamma * wd * Math.cos(wd * elapsedTime + phase) + gamma * gamma * Math.sin(wd * elapsedTime + phase));
  } else if (b > 0 && gamma >= w0) {
    let r1 = -gamma + Math.sqrt(gamma * gamma - w0 * w0);
    let r2 = -gamma - Math.sqrt(gamma * gamma - w0 * w0);
    let C1 = amplitudeMeters / 2;
    let C2 = amplitudeMeters / 2;
    pos = C1 * Math.exp(r1 * elapsedTime) + C2 * Math.exp(r2 * elapsedTime);
    vel = C1 * r1 * Math.exp(r1 * elapsedTime) + C2 * r2 * Math.exp(r2 * elapsedTime);
    ace = C1 * r1 * r1 * Math.exp(r1 * elapsedTime) + C2 * r2 * r2 * Math.exp(r2 * elapsedTime);
  } else {
    pos = amplitudeMeters * Math.sin(w0 * elapsedTime + phase);
    vel = amplitudeMeters * w0 * Math.cos(w0 * elapsedTime + phase);
    ace = -amplitudeMeters * w0 * w0 * Math.sin(w0 * elapsedTime + phase);
  }

  posxMeters = pos;
  posx = metrosAPixeles(posxMeters);
  velocity = vel;
  acceleration = ace;

  // Detener simulación si la posición es 0 (redondeada a 5 cifras)
  if (Number(posxMeters.toFixed(5)) === 0) {
    isAnimating = false;
    $playBt.textContent = "Continuar";
    possibleDragging = true;
    return;
  }

  let masaKg = m;
  let energiaCinetica = 0.5 * masaKg * velocity * velocity;
  let energiaPotencial = 0.5 * k * posxMeters * posxMeters;

  if (isAnimating) {
    if (datosGrafica.tiempo.length > 500) {
      datosGrafica.tiempo.shift();
      datosGrafica.posicion.shift();
      datosGrafica.velocidad.shift();
      datosGrafica.aceleracion.shift();
      datosGrafica.energiaCinetica.shift();
      datosGrafica.energiaPotencial.shift();
    }
    datosGrafica.tiempo.push(elapsedTime.toFixed(2));
    datosGrafica.posicion.push(posxMeters);
    datosGrafica.velocidad.push(velocity);
    datosGrafica.aceleracion.push(acceleration);
    datosGrafica.energiaCinetica.push(energiaCinetica);
    datosGrafica.energiaPotencial.push(energiaPotencial);

    if (chart && tipoGraficaActiva) {
      chart.data.labels = datosGrafica.tiempo;
      if (tipoGraficaActiva === "posicion") {
        chart.data.datasets[0].data = datosGrafica.posicion;
      } else if (tipoGraficaActiva === "velocidad") {
        chart.data.datasets[0].data = datosGrafica.velocidad;
      } else if (tipoGraficaActiva === "aceleracion") {
        chart.data.datasets[0].data = datosGrafica.aceleracion;
      } else if (tipoGraficaActiva === "energiaCinetica") {
        chart.data.datasets[0].data = datosGrafica.energiaCinetica;
      } else if (tipoGraficaActiva === "energiaPotencial") {
        chart.data.datasets[0].data = datosGrafica.energiaPotencial;
      }
      chart.update();
    }
  }

  dibujarEscena();

  $pos.innerHTML = `x = ${posxMeters.toFixed(3)} m`;
  $vel.innerHTML = `v = ${velocity.toFixed(3)} m/s`;
  $ace.innerHTML = `a = ${acceleration.toFixed(3)} m/s<sup>2</sup>`;

  if (isAnimating) {
    animationId = requestAnimationFrame(animate);
  }
}

// EVENTOS

let offsetXFromMass = 0;

canvas.addEventListener("mousedown", function (event) {
  const rect = canvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  const masaX = posx + canvas.width / 2 - widthMasa / 2 + 40;
  const masaY = canvas.height / 2 - heightMasa / 2 + 60;

  if (
    offsetX >= masaX &&
    offsetX <= masaX + widthMasa &&
    offsetY >= masaY &&
    offsetY <= masaY + heightMasa &&
    possibleDragging
  ) {
    isDragging = true;
    offsetXFromMass = offsetX - masaX;
  }
});

canvas.addEventListener("mousemove", function (event) {
  if (isDragging) {
    let mouseXCurrent = event.clientX - canvas.getBoundingClientRect().left;
    let equilibriumX = canvas.width / 2 + 40 - widthMasa / 2;
    let maxAmplitudePixels = amplitudeMaxMeters * escalaPixelsPorMetro;

    posx = mouseXCurrent - equilibriumX - offsetXFromMass;

    if (posx > maxAmplitudePixels) {
      posx = maxAmplitudePixels;
    } else if (posx < -maxAmplitudePixels) {
      posx = -maxAmplitudePixels;
    }

    posxMeters = pixelesAMetros(posx);
    amplitudeMeters = Math.abs(posxMeters);

    dibujarEscena();
  }
});

canvas.addEventListener("mouseup", function () {
  if (isDragging) {
    isDragging = false;
    startTime = performance.now();
    isAnimating = true;
    possibleDragging = false;

    if (posxMeters > 0) {
      phase = Math.PI / 2;
    } else {
      phase = -Math.PI / 2;
    }

    velocity = 0;
    actualizarEcua();
    requestAnimationFrame(animate);
    $playBt.style.display = "block";
    $playBt.textContent = "Detener";
  }
});

canvas.addEventListener("touchstart", function (event) {
  event.preventDefault();

  const touch = event.changedTouches[0];
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const touchX = (touch.clientX - rect.left) * scaleX;
  const touchY = (touch.clientY - rect.top) * scaleY;

  const masaX = posx + canvas.width / 2 - widthMasa / 2 + 40;
  const masaY = canvas.height / 2 - heightMasa / 2 + 60;

  if (
    touchX >= masaX &&
    touchX <= masaX + widthMasa &&
    touchY >= masaY &&
    touchY <= masaY + heightMasa &&
    possibleDragging
  ) {
    isDragging = true;
    offsetXFromMass = touchX - masaX;
  }
});

canvas.addEventListener("touchmove", function (event) {
  if (isDragging) {
    event.preventDefault();

    const touch = event.changedTouches[0];
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let touchXCurrent = (touch.clientX - rect.left) * scaleX;
    let equilibriumX = canvas.width / 2 + 40 - widthMasa / 2;
    let maxAmplitudePixels = amplitudeMaxMeters * escalaPixelsPorMetro;

    posx = touchXCurrent - equilibriumX - offsetXFromMass;

    if (posx > maxAmplitudePixels) {
      posx = maxAmplitudePixels;
    } else if (posx < -maxAmplitudePixels) {
      posx = -maxAmplitudePixels;
    }

    posxMeters = pixelesAMetros(posx);
    amplitudeMeters = Math.abs(posxMeters);

    dibujarEscena();
  }
});

canvas.addEventListener("touchend", function () {
  if (isDragging) {
    isDragging = false;
    startTime = performance.now();
    isAnimating = true;
    possibleDragging = false;

    if (posxMeters > 0) {
      phase = Math.PI / 2;
    } else {
      phase = -Math.PI / 2;
    }

    velocity = 0;
    actualizarEcua();
    requestAnimationFrame(animate);
    $playBt.style.display = "block";
    $playBt.textContent = "Detener";
  }
});

$masaInput.addEventListener("input", function () {
  let value = parseFloat($masaInput.value);

  if (value < 0.2 || value > 600) {
    $masaInput.value = "";
  } else {
    widthMasa = massToPixel($masaInput.value);
    heightMasa = massToPixel($masaInput.value);

    let resorteValue = parseFloat($constResorte.value);
    if (resorteValue) {
      let masa = parseFloat($masaInput.value) / 1000;
      omega = Math.sqrt(resorteValue / masa);
    }

    amplitudeMaxMeters =
      (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro;

    dibujarEscena();
    $playBt.style.display = "none";
    isDragging = false;
    isAnimating = false;
    startTime = null;
    timeSave = 0;
    elapsedTime = 0;
    posx = 0;
    posxMeters = 0;
    velocity = 0;
    acceleration = 0;
    amplitudeMeters = 0;
    amplitude = 0;
    phase = 0;
    possibleDragging = true;

    $pos.innerHTML = `x = 0.000 m`;
    $vel.innerHTML = `v = 0.000 m/s`;
    $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;
  }
});

$constResorte.addEventListener("input", () => {
  let value = parseFloat($constResorte.value);

  if (value < 0.5 || value > 2500) {
    $constResorte.value = "";
  } else {
    let masa = parseFloat($masaInput.value) / 1000;
    omega = Math.sqrt(value / masa);
    period = ((2 * Math.PI) / omega) * 1000;
    $playBt.style.display = "none";
    isDragging = false;
    isAnimating = false;
    startTime = null;
    timeSave = 0;
    elapsedTime = 0;
    posx = 0;
    posxMeters = 0;
    velocity = 0;
    acceleration = 0;
    amplitudeMeters = 0;
    amplitude = 0;
    phase = 0;
    possibleDragging = true;

    $pos.innerHTML = `x = 0.000 m`;
    $vel.innerHTML = `v = 0.000 m/s`;
    $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;
  }
});

// Amortiguamiento: barra deslizante
$amortInput.addEventListener("input", function () {
  b = parseFloat($amortInput.value);
  $amortVal.textContent = b.toFixed(2) + " kg/s";
  actualizarEcua();
});

$playBt.addEventListener("click", function () {
  if (isAnimating) {
    cancelAnimationFrame(animationId);
    timeSave = elapsedTime;
    isAnimating = false;
    $playBt.textContent = "Continuar";
    possibleDragging = true;
  } else {
    isAnimating = true;
    possibleDragging = false;
    startTime = performance.now() - timeSave * 1000;
    requestAnimationFrame(animate);
    $playBt.textContent = "Detener";
  }
});

$btnRestart.addEventListener("click", () => {
  resetSimulation();
});

function resetSimulation() {
  restaurarEcua();
  $playBt.style.display = "none";
  isDragging = false;
  isAnimating = false;
  startTime = null;
  timeSave = 0;
  elapsedTime = 0;
  posx = 0;
  posxMeters = 0;
  velocity = 0;
  acceleration = 0;
  amplitudeMeters = 0;
  amplitude = 0;
  phase = 0;
  possibleDragging = true;

  $masaInput.value = 600;
  $constResorte.value = 50;
  $amortInput.value = 0;
  $amortVal.textContent = "0.00";
  $checkboxEquilibrio.checked = true;
  mostrarEquilibrio = true;

  widthMasa = massToPixel($masaInput.value);
  heightMasa = massToPixel($masaInput.value);
  amplitudeMaxMeters =
    (canvas.width / 2 - widthMasa / 2 - 42) / escalaPixelsPorMetro;

  $pos.innerHTML = `x = 0.000 m`;
  $vel.innerHTML = `v = 0.000 m/s`;
  $ace.innerHTML = `a = 0.000 m/s<sup>2</sup>`;

  datosGrafica = {
    tiempo: [],
    posicion: [],
    velocidad: [],
    aceleracion: [],
    energiaCinetica: [],
    energiaPotencial: []
  };
  if (chart) {
    chart.destroy();
    chart = null;
  }
  if ($graficaAviso) $graficaAviso.style.display = "block";

  document.querySelectorAll('.btn-grafica').forEach(btn => {
    btn.classList.remove('btn-grafica-activa');
  });

  dibujarEscena();
}

document.getElementById("btnGrafEc").addEventListener("click", () => mostrarGrafica("energiaCinetica"));
document.getElementById("btnGrafEp").addEventListener("click", () => mostrarGrafica("energiaPotencial"));

$btnGrafPos.addEventListener("click", () => mostrarGrafica("posicion"));
$btnGrafVel.addEventListener("click", () => mostrarGrafica("velocidad"));
$btnGrafAce.addEventListener("click", () => mostrarGrafica("aceleracion"));

function mostrarGrafica(tipo) {
  tipoGraficaActiva = tipo;

  document.querySelectorAll('.btn-grafica').forEach(btn => {
    btn.classList.remove('btn-grafica-activa');
  });
  if (tipo === "posicion") {
    $btnGrafPos.classList.add('btn-grafica-activa');
  } else if (tipo === "velocidad") {
    $btnGrafVel.classList.add('btn-grafica-activa');
  } else if (tipo === "aceleracion") {
    $btnGrafAce.classList.add('btn-grafica-activa');
  } else if (tipo === "energiaCinetica") {
    document.getElementById("btnGrafEc").classList.add('btn-grafica-activa');
  } else if (tipo === "energiaPotencial") {
    document.getElementById("btnGrafEp").classList.add('btn-grafica-activa');
  }

  if (chart) chart.destroy();
  crearGrafica(tipo);

  if ($graficaAviso) $graficaAviso.style.display = "none";
}

function crearGrafica(tipo) {
  let label = "";
  let data = [];
  let color = "";
  if (tipo === "posicion") {
    label = "Posición (m)";
    data = datosGrafica.posicion;
    color = "rgba(54, 162, 235, 0.7)";
  } else if (tipo === "velocidad") {
    label = "Velocidad (m/s)";
    data = datosGrafica.velocidad;
    color = "rgba(255, 206, 86, 0.7)";
  } else if (tipo === "aceleracion") {
    label = "Aceleración (m/s²)";
    data = datosGrafica.aceleracion;
    color = "rgba(255, 99, 132, 0.7)";
  } else if (tipo === "energiaCinetica") {
    label = "Energía Cinética (J)";
    data = datosGrafica.energiaCinetica;
    color = "rgba(0, 200, 83, 0.7)";
  } else if (tipo === "energiaPotencial") {
    label = "Energía Potencial (J)";
    data = datosGrafica.energiaPotencial;
    color = "rgba(255, 140, 0, 0.7)";
  }
  chart = new Chart($canvasGrafica, {
    type: "line",
    data: {
      labels: datosGrafica.tiempo,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        pointRadius: 0,
        tension: 0.2
      }]
    },
    options: {
      responsive: false,
      animation: false,
      scales: {
        x: { title: { display: true, text: "Tiempo (s)" } },
        y: { title: { display: true, text: label } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Mostrar el aviso al cargar la página y al reiniciar
if ($graficaAviso) $graficaAviso.style.display = "block";
if (chart) chart.destroy();
dibujarEscena();

let $btnCritico = document.querySelector("#btnCritico");

if ($btnCritico) {
  $btnCritico.addEventListener("click", function () {
    let m = parseFloat($masaInput.value) / 1000;
    let k = parseFloat($constResorte.value);
    // b_critico = 2 * sqrt(k * m)
    let bCritico = 2 * Math.sqrt(k * m);
    $amortInput.value = bCritico.toFixed(2);
    $amortVal.textContent = bCritico.toFixed(2) + " kg/s";
    actualizarEcua();
  });
}
