/* Proyecto B UIS - Simulador integrado B1/B2/B3 */
(() => {
  "use strict";

  const NOMBRES = {
    B1: "Producción submarina",
    B2: "Planta de proceso en tierra",
    B3: "Servicios y estructuras"
  };

  const ARCHIVOS = [
    "equipos", "corrientes", "escenario",
    "mecanismos", "parametros", "interfaces", "alertas"
  ];

  const datos = {};
  const $ = id => document.getElementById(id);

  const esc = valor =>
    String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const vacio = v =>
    v === null || v === undefined || String(v).trim() === "";

  function estilos() {
    const style = document.createElement("style");

    style.textContent = `
      .sim-integrado {
        border:1px solid #dce5eb;
        background:white;
        padding:22px;
        border-radius:16px;
        margin:24px 0;
        box-shadow:0 6px 22px #173b4e0a;
      }

      .sim-integrado h2 {
        margin:0 0 7px;
        font-size:24px;
        color:#173349;
      }

      .sim-integrado h3 {
        font-size:17px;
        margin:0 0 12px;
      }

      .sim-sub {
        color:#4d6575;
        margin:0 0 15px;
      }

      .sim-resumen {
        display:grid;
        grid-template-columns:repeat(4,1fr);
        gap:10px;
        margin:16px 0 20px;
      }

      .sim-mini {
        background:#ecf3f8;
        padding:13px;
        border-radius:10px;
      }

      .sim-mini strong {
        font-size:24px;
        display:block;
        color:#163b55;
      }

      .sim-mini span {
        display:block;
        font-size:12px;
        color:#486275;
      }

      .sim-grid {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:15px;
      }

      .sim-campo {
        min-width:0;
        display:block;
        font-size:13px;
        font-weight:650;
      }

      .sim-campo input,
      .sim-campo select {
        margin-top:5px;
      }

      .sim-integrado .sim-actions {
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin:18px 0;
      }

      .sim-integrado button {
        background:#125478;
        color:white;
        border:0;
        border-radius:8px;
        padding:11px 16px;
        font-weight:650;
        cursor:pointer;
      }

      .sim-integrado button.secondary {
        background:#edf3f6;
        color:#174d68;
        border:1px solid #cad8df;
      }

      .sim-result {
        border-radius:12px;
        padding:18px;
        background:#edf5fa;
        border:1px solid #d4e5ef;
        margin-top:14px;
        overflow-wrap:anywhere;
      }

      .sim-result.warn {
        background:#fff9e9;
        border-color:#f3ddb0;
      }

      .sim-result strong {
        color:#173c57;
      }

      .sim-result ul {
        padding-left:21px;
        margin:9px 0;
      }

      .sim-result li {
        margin:5px 0;
      }

      .sim-legal {
        font-size:12px;
        color:#6b4c10;
        background:#fff3d5;
        padding:11px 13px;
        border-left:4px solid #ecb444;
        border-radius:5px;
        margin:17px 0 7px;
      }

      .sim-divider {
        border:0;
        border-top:1px solid #dee6ed;
        margin:19px 0;
      }

      .sim-note {
        font-size:12px;
        color:#5f7281;
        margin:8px 0;
      }

      .sim-resumen-issues {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }

      .sim-issue {
        background:#f8fafc;
        border:1px solid #e1e8eb;
        border-radius:8px;
        padding:11px;
      }

      .sim-issue b {
        display:block;
        font-size:13px;
        margin-bottom:3px;
      }

      .sim-issue p {
        font-size:12px;
        margin:0;
        line-height:1.5;
      }

      @media(max-width:760px) {
        .sim-grid {grid-template-columns:1fr 1fr}
        .sim-resumen {grid-template-columns:1fr 1fr}
        .sim-resumen-issues {grid-template-columns:1fr}
      }

      @media(max-width:460px) {
        .sim-grid {grid-template-columns:1fr}
      }
    `;

    document.head.appendChild(style);
  }

  function construirPantalla() {
    const main = document.querySelector("main");
    const inventario = document.querySelector(".controls");

    if (!main || !inventario) return;

    const h1 = document.querySelector("header h1");

    if (h1) {
      h1.textContent =
        "Proyecto B · Selección de materiales B1, B2 y B3";
    }

    const panel = document.createElement("section");

    panel.id = "sim-integrado";
    panel.className = "sim-integrado";

    panel.innerHTML = `
      <h2>Simulador integrado de los tres sistemas</h2>

      <p class="sim-sub">
        Elige el grupo y un componente, introduce sus condiciones
        de servicio y consulta los cálculos y verificaciones preliminares.
      </p>

      <div class="sim-resumen" id="sim-contadores"></div>

      <div class="sim-grid">

        <label class="sim-campo">
          Sistema
          <select id="sim-grupo">
            <option value="TODOS">General · B1 + B2 + B3</option>
            <option value="B1">B1 · Producción submarina</option>
            <option value="B2">B2 · Planta de gas</option>
            <option value="B3">B3 · Servicios y estructuras</option>
          </select>
        </label>

        <label class="sim-campo">
          Buscar componente
          <input id="sim-buscar"
            placeholder="Ej. absorbedor, tubing, tanque, 316L">
        </label>

        <label class="sim-campo">
          Componente / material
          <select id="sim-equipo">
            <option value="">Selecciona un equipo...</option>
          </select>
        </label>

      </div>

      <div id="sim-ficha" class="sim-result">
        Selecciona cualquier componente de B1, B2 o B3.
      </div>

      <hr class="sim-divider">

      <h3>Condiciones de operación que deseas evaluar</h3>

      <p class="sim-note">
        No se asignan automáticamente los datos del cabezal a todos
        los equipos. Completa los datos reales del equipo.
      </p>

      <div class="sim-grid">

        <label class="sim-campo">
          Tipo de servicio
          <select id="sim-servicio">
            <option value="desconocido">Por confirmar</option>
            <option value="gas_humedo">Gas húmedo / multifásico</option>
            <option value="gas_seco">Gas tratado o seco</option>
            <option value="agua">Agua de proceso / formación</option>
            <option value="mar_clorada">Agua de mar clorada</option>
            <option value="amina">Circuito de aminas</option>
            <option value="teg">Circuito de TEG</option>
            <option value="condensado">Condensado</option>
            <option value="mar_externo">Ambiente marino externo</option>
            <option value="otro">Otro servicio</option>
          </select>
        </label>

        <label class="sim-campo">
          Presión total (bar, absoluta)
          <input id="sim-presion" type="number" min="0" step="any">
        </label>

        <label class="sim-campo">
          Temperatura de operación (°C)
          <input id="sim-temperatura" type="number" step="any">
        </label>

        <label class="sim-campo">
          H₂S en fase gas (% molar)
          <input id="sim-h2s" type="number" min="0" max="100" step="any">
        </label>

        <label class="sim-campo">
          CO₂ en fase gas (% molar)
          <input id="sim-co2" type="number" min="0" max="100" step="any">
        </label>

        <label class="sim-campo">
          Cloruros en agua (mg/L)
          <input id="sim-cloruros" type="number" min="0" step="any">
        </label>

        <label class="sim-campo">
          pH del agua
          <input id="sim-ph" type="number" min="0" max="14" step="any">
        </label>

        <label class="sim-campo">
          ¿Hay agua libre o fase acuosa?
          <select id="sim-agua">
            <option value="pendiente">Por confirmar</option>
            <option value="si">Sí</option>
            <option value="no">No se ha observado</option>
          </select>
        </label>

        <label class="sim-campo">
          Corriente documentada (B2 o B3)
          <select id="sim-corriente">
            <option value="">Consultar corriente...</option>
          </select>
        </label>

      </div>

      <div id="sim-corriente-info" class="sim-note"></div>

      <div class="sim-actions">
        <button type="button" id="sim-evaluar">
          Calcular y revisar mecanismos
        </button>

        <button type="button" class="secondary" id="sim-ejemplo">
          Cargar ejemplo de cabezal B1
        </button>

        <button type="button" class="secondary" id="sim-limpiar">
          Limpiar condiciones
        </button>
      </div>

      <div id="sim-resultado" class="sim-result warn">
        Ingresa condiciones y pulsa Calcular.
      </div>

      <p class="sim-legal">
        Evaluación académica preliminar. No establece idoneidad,
        vida útil, velocidad de corrosión ni cumplimiento normativo.
      </p>

      <hr class="sim-divider">

      <h3>Integración B1 ↔ B2 ↔ B3: decisiones pendientes</h3>

      <div id="sim-interfaces" class="sim-resumen-issues"></div>
    `;

    main.insertBefore(panel, inventario);
    estilos();
  }

  function opcionesEquipos() {
    const filtro =
      ($("sim-buscar").value || "").trim().toLowerCase();

    const g = $("sim-grupo").value;
    const select = $("sim-equipo");
    const previo = select.value;

    const filas = datos.equipos.filter(r =>
      (g === "TODOS" || r.grupo === g) &&
      (!filtro ||
        [r.id, r.equipo, r.pieza, r.material, r.norma]
          .join(" ")
          .toLowerCase()
          .includes(filtro))
    );

    select.replaceChildren(
      new Option(`Selecciona un componente (${filas.length})...`, "")
    );

    filas.forEach(r =>
      select.add(
        new Option(
          `${r.id} · ${r.equipo} · ${r.pieza}`,
          r.id
        )
      )
    );

    if (filas.some(r => r.id === previo)) {
      select.value = previo;
    }

    mostrarFicha();
  }

  function mostrarFicha() {
    const r = datos.equipos.find(
      x => x.id === $("sim-equipo").value
    );

    const ficha = $("sim-ficha");

    if (!r) {
      ficha.textContent =
        "Selecciona un componente para consultar el material del informe.";
      return;
    }

    const props = [
      ["Componente", `${r.id} · ${r.equipo}`],
      ["Pieza", r.pieza],
      ["Material documentado", r.material],
      ["Normas citadas", r.norma],
      ["Estado", r.estado],
      ["Dimensiones", r.dimensiones],
      ["Cantidad", r.cantidad],
      ["Origen", r.fuente]
    ];

    ficha.innerHTML =
      props
        .filter(([,v]) => !vacio(v))
        .map(([k,v]) =>
          `<p><strong>${esc(k)}:</strong> ${esc(v)}</p>`
        )
        .join("") +
      `<p class="sim-note">
        Material de inventario: falta verificar su aceptación
        para condiciones reales de este componente.
      </p>`;
  }

  function opcionesCorrientes() {
    const g = $("sim-grupo").value;
    const s = $("sim-corriente");

    s.replaceChildren(
      new Option("Consultar corriente...", "")
    );

    datos.corrientes
      .filter(r => g === "TODOS" || r.grupo === g)
      .forEach(r =>
        s.add(new Option(`${r.id} · ${r.nombre}`, r.id))
      );

    $("sim-corriente-info").textContent =
      g === "B1"
        ? "Para B1 consulta también la base de diseño y el informe original."
        : "";
  }

  function verCorriente() {
    const r = datos.corrientes.find(
      x => x.id === $("sim-corriente").value
    );

    $("sim-corriente-info").textContent = r
      ? `${r.id} · ${r.nombre}. Fase: ${r.fase}.
         Condiciones documentadas: ${r.condiciones}.
         Fuente: ${r.fuente}. Revisa los datos pendientes.`
      : "";
  }

  function leerNumero(id, nombre, min, max, avisos) {
    const texto = $(id).value.trim();

    if (texto === "") return null;

    const x = Number(texto);

    if (!Number.isFinite(x) || x < min || x > max) {
      avisos.push(
        `${nombre}: introduce un valor válido (${min} a ${max}).`
      );
      return NaN;
    }

    return x;
  }

  function listaHtml(items) {
    return items.length
      ? `<ul>${items.map(v => `<li>${esc(v)}</li>`).join("")}</ul>`
      : "<p>No se han identificado mecanismos con los datos disponibles.</p>";
  }
    function evaluar() {
    const errores = [];
    const P = leerNumero("sim-presion", "Presión", 0, 100000, errores);
    const T = leerNumero("sim-temperatura", "Temperatura", -273.15, 2000, errores);
    const H = leerNumero("sim-h2s", "H₂S", 0, 100, errores);
    const C = leerNumero("sim-co2", "CO₂", 0, 100, errores);
    const Cl = leerNumero("sim-cloruros", "Cloruros", 0, 1000000, errores);
    const ph = leerNumero("sim-ph", "pH", 0, 14, errores);

    const agua = $("sim-agua").value;
    const servicio = $("sim-servicio").value;
    const equipo = datos.equipos.find(x => x.id === $("sim-equipo").value);
    const grupoActivo = equipo?.grupo ?? $("sim-grupo").value;
    const resultado = $("sim-resultado");

    if (H !== null && C !== null && H + C > 100) {
      errores.push("La suma de H₂S y CO₂ supera el 100 % molar.");
    }

    if (errores.length) {
      resultado.innerHTML = `<strong>Corrige los datos:</strong>${listaHtml(errores)}`;
      return;
    }

    const parciales = [];

    if (P !== null && H !== null) {
      parciales.push(
        `Presión parcial H₂S: ${(P * H / 100).toFixed(3)} bar`
      );
    }

    if (P !== null && C !== null) {
      parciales.push(
        `Presión parcial CO₂: ${(P * C / 100).toFixed(3)} bar`
      );
    }

    if (!parciales.length) {
      parciales.push("Faltan presión y composición molar para calcular.");
    }

    const verif = [];
    const pendientes = [];

    const acuoso =
      agua === "si" ||
      ["agua", "mar_clorada", "amina", "teg"].includes(servicio);

    if (agua === "pendiente") {
      pendientes.push("Confirmar presencia de agua y posible condensación.");
    }

    if (agua === "no") {
      pendientes.push("Verificar que no exista condensación durante transitorios.");
    }

    if (servicio === "desconocido") {
      pendientes.push("Definir el fluido y el servicio del equipo.");
    }

    if (P === null) pendientes.push("Falta presión absoluta del equipo.");
    if (T === null) pendientes.push("Falta temperatura de operación.");

    if (acuoso) {
      if (H !== null && H > 0) {
        verif.push("H₂S húmedo: evaluar SSC y HIC según ISO 15156.");
      }

      if (C !== null && C > 0) {
        verif.push("CO₂ húmedo: evaluar corrosión interna.");
      }

      if (Cl !== null && Cl > 0) {
        verif.push("Cloruros: evaluar picadura y corrosión en rendijas.");
      }

      if (ph !== null && ph < 7) {
        verif.push("Medio ácido: evaluar corrosión acuosa.");
      }
    }

    if (servicio === "mar_clorada") {
      verif.push("Evaluar corrosión por agua de mar y cloro residual.");
      pendientes.push("Determinar concentración de cloro y velocidad del fluido.");
    }

    if (servicio === "mar_externo") {
      verif.push("Evaluar recubrimientos y protección catódica.");
    }

    if (servicio === "amina") {
      verif.push("Evaluar corrosión y agrietamiento en el circuito de aminas.");
      pendientes.push("Confirmar tipo de amina, concentración y contaminantes.");
    }

    if (servicio === "teg") {
      verif.push("Evaluar compatibilidad con glicol y temperatura.");
      pendientes.push("Confirmar concentración de TEG y contenido de agua.");
    }

    if (T !== null) {
      verif.push(
        `Verificar compatibilidad del material a ${T} °C.`
      );
    }

    if (equipo) {
      const mat = (equipo.material || "").toLowerCase();

      if (/sa-516|a106|api 5l|acero al carbono|a105|a350|4130|4140|gr 70/.test(mat)) {
        if (H !== null && H > 0) {
          verif.push("Acero al carbono: verificar requisitos de servicio agrio, dureza, soldaduras y HIC/SSC.");
        }

        if (acuoso) {
          pendientes.push("Determinar tasa de corrosión y sobreespesor.");
        }
      }

      if (/316|304|dúplex|duplex|superdúplex|superduplex/.test(mat) &&
          Cl !== null && Cl > 0 && acuoso) {
        verif.push("Acero inoxidable: evaluar picadura, rendijas y SCC por cloruros.");
      }

      if (/alloy|monel|n0[0-9]{4}|cra|inconel|níquel|niquel/.test(mat) &&
          H !== null && H > 0) {
        verif.push("CRA: verificar compatibilidad con ISO 15156-3 cuando aplique.");
      }

      if (/hnbr|peek|ptfe|elast|polímer|polimer|caucho/.test(mat)) {
        verif.push("Material no metálico: evaluar compatibilidad química, presión y temperatura.");
      }

      if (/cemento|hormigón|hormigon|concreto/.test(mat)) {
        verif.push("Material cementicio: evaluar degradación química y función de barrera.");
      }

      pendientes.push("Verificar presión y temperatura de diseño.");
      pendientes.push("Validar propiedades, fabricación, tratamiento y pruebas del material.");
    } else {
      pendientes.push("Seleccionar un componente para relacionar los resultados con un material.");
    }

    if (grupoActivo === "B1") {
      pendientes.push("Verificar condiciones submarinas, presión diferencial y protección externa.");
    }

    if (grupoActivo === "B2") {
      pendientes.push("Verificar condiciones reales de cada corriente de la planta.");
    }

    if (grupoActivo === "B3") {
      pendientes.push("Verificar el medio específico de cada servicio auxiliar.");
    }

    if (grupoActivo === "TODOS") {
      pendientes.push("Cada componente necesita sus propias condiciones de operación.");
    }

    const unico = arr => [...new Set(arr)];

    const ficha = equipo
      ? `<p><strong>Componente:</strong> ${esc(equipo.id)} · ${esc(equipo.equipo)} · ${esc(equipo.pieza)}</p>
         <p><strong>Material candidato:</strong> ${esc(equipo.material)}</p>`
      : "";

    resultado.innerHTML = `
      <h3>Resultados preliminares</h3>

      ${ficha}

      <p><strong>Presiones parciales:</strong></p>
      ${listaHtml(parciales)}

      <p><strong>Mecanismos que deben evaluarse:</strong></p>
      ${listaHtml(unico(verif))}

      <p><strong>Información pendiente:</strong></p>
      ${listaHtml(unico(pendientes))}

      <p><strong>Estado:</strong>
      REQUIERE VERIFICACIÓN TÉCNICA.
      No se aprueba ni se descarta automáticamente el material.</p>
    `;
  }

  function contadores() {
    const all = datos.equipos.length;

    $("sim-contadores").innerHTML = ["B1", "B2", "B3", "TODOS"]
      .map(g => {
        const n = g === "TODOS"
          ? all
          : datos.equipos.filter(r => r.grupo === g).length;

        return `
          <div class="sim-mini">
            <strong>${n}</strong>
            <span>${g === "TODOS" ? "Total de componentes" : g + " · " + NOMBRES[g]}</span>
          </div>
        `;
      }).join("");
  }

  function interfaces() {
    $("sim-interfaces").innerHTML = datos.alertas.map(a => `
      <div class="sim-issue">
        <b>${esc(a.id)} · ${esc(a.tema)}</b>
        <p>${esc(a.detalle)}</p>
      </div>
    `).join("");
  }

  function pares(row) {
    const omit = ["grupo", "id", "equipo", "nombre", "fuente"];

    return Object.entries(row)
      .filter(([k, v]) => !omit.includes(k) && !vacio(v))
      .map(([k, v]) => `
        <p>
          <strong>${esc(k.replaceAll("_", " "))}:</strong>
          ${esc(Array.isArray(v) ? v.join(" · ") : v)}
        </p>
      `).join("");
  }

  function mostrarInventario() {
    const modo = $("vista").value;
    const filas = datos[modo] || [];
    const g = $("grupo").value;
    const buscar = $("buscar").value.toLowerCase().trim();

    const filtro = filas.filter(r =>
      (g === "TODOS" || r.grupo === g) &&
      (!buscar || JSON.stringify(r).toLowerCase().includes(buscar))
    );

    $("conteo").textContent = `${filtro.length} registros`;

    $("titulo").textContent = {
      equipos: "Componentes y materiales",
      corrientes: "Corrientes de proceso",
      escenario: "Condiciones generales de referencia",
      mecanismos: "Mecanismos de daño",
      parametros: "Parámetros documentados",
      interfaces: "Interfaces entre grupos",
      alertas: "Datos pendientes y diferencias"
    }[modo] || "Resultados";

    $("resultados").innerHTML = filtro.slice(0, 250).map(r => `
      <article class="item">
        <span class="chip">${esc(r.grupo || "GENERAL")} ${esc(r.id || "")}</span>
        <h3>${esc(r.equipo || r.nombre || r.referencia || r.parametro || r.interfaz || r.tema || "Registro")}</h3>
        ${pares(r)}
        <small>Fuente: ${esc(r.fuente || "Comparación entre informes")}</small>
      </article>
    `).join("") || '<div class="item">No hay registros para esta búsqueda.</div>';

    if (filtro.length > 250) {
      $("resultados").insertAdjacentHTML(
        "beforeend",
        "<p>Solo se muestran los primeros 250 registros.</p>"
      );
    }
  }

  function grupoActualizado(origen) {
    const grupo = $(origen).value;
    const destino = origen === "sim-grupo" ? "grupo" : "sim-grupo";

    $(destino).value = grupo;

    opcionesEquipos();
    opcionesCorrientes();
    mostrarInventario();
  }

  function limpiar() {
    for (const id of [
      "sim-presion", "sim-temperatura", "sim-h2s",
      "sim-co2", "sim-cloruros", "sim-ph"
    ]) {
      $(id).value = "";
    }

    $("sim-agua").value = "pendiente";
    $("sim-servicio").value = "desconocido";

    $("sim-resultado").textContent =
      "Campos limpios. Introduce las condiciones del equipo y calcula.";
  }

  function ejemplo() {
    $("sim-presion").value = "320";
    $("sim-temperatura").value = "95";
    $("sim-h2s").value = "1.4";
    $("sim-co2").value = "1.8";
    $("sim-cloruros").value = "28000";
    $("sim-ph").value = "3.9";
    $("sim-agua").value = "pendiente";
    $("sim-servicio").value = "gas_humedo";

    $("sim-resultado").innerHTML =
      "<strong>Ejemplo cargado:</strong> condiciones de referencia del cabezal B1. No deben asignarse automáticamente a B2 o B3.";
  }

  async function iniciar() {
    construirPantalla();

    try {
      await Promise.all(
        ARCHIVOS.map(async nombre => {
          const resp = await fetch(`datos/${nombre}.json`);

          if (!resp.ok) {
            throw new Error(`No se encontró datos/${nombre}.json`);
          }

          datos[nombre] = await resp.json();

          if (!Array.isArray(datos[nombre])) {
            throw new Error(`Formato incorrecto de ${nombre}.json`);
          }
        })
      );

      contadores();
      interfaces();
      opcionesEquipos();
      opcionesCorrientes();
      mostrarInventario();

      $("sim-grupo").addEventListener(
        "change",
        () => grupoActualizado("sim-grupo")
      );

      $("grupo").addEventListener(
        "change",
        () => grupoActualizado("grupo")
      );

      $("sim-buscar").addEventListener("input", opcionesEquipos);
      $("sim-equipo").addEventListener("change", mostrarFicha);
      $("sim-corriente").addEventListener("change", verCorriente);

      $("sim-evaluar").addEventListener("click", evaluar);
      $("sim-limpiar").addEventListener("click", limpiar);
      $("sim-ejemplo").addEventListener("click", ejemplo);

      for (const id of ["buscar", "vista"]) {
        $(id).addEventListener("input", mostrarInventario);
      }

    } catch (error) {
      $("sim-contadores").textContent =
        "Error al cargar datos: " + error.message;

      $("resultados").textContent =
        "Verifica que el servidor Java esté abierto y que la carpeta datos esté completa.";

      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

})();
/* =====================================================
   SIMULADOR VISUAL INTEGRADO B1 + B2 + B3
   DIAGRAMA 2D, FLUIDOS, EQUIPOS Y EVALUACIÓN DE RIESGOS
===================================================== */

(() => {
    "use strict";

    if (document.getElementById("pv-integrado")) return;

    const panel = document.createElement("section");
    panel.id = "pv-integrado";

    const estilos = document.createElement("style");

    estilos.textContent = `
    #pv-integrado {
        font-family: Inter, system-ui, Arial, sans-serif;
        max-width: 1450px;
        margin: 30px auto;
        padding: 25px;
        color: #17374a;
        background: #f1f5f9;
        border-radius: 20px;
        box-sizing: border-box;
    }

    #pv-integrado * { box-sizing: border-box; }

    #pv-integrado h2 { font-size: 25px; }
    #pv-integrado h3 { font-size: 17px; }

    #pv-integrado .pv-card {
        background: white;
        border: 1px solid #d7e2e8;
        border-radius: 15px;
        padding: 20px;
        margin: 16px 0;
    }

    #pv-integrado .pv-sub {
        color: #587184;
        margin: 0 0 14px;
        font-size: 13px;
    }

    #pv-integrado .pv-menu {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 15px 0;
    }

    #pv-integrado button {
        border: 1px solid #c8d9df;
        background: white;
        color: #194258;
        border-radius: 9px;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 650;
    }

    #pv-integrado button:hover { background: #e1f1f5; }

    #pv-integrado button.primary {
        background: #173f5f;
        color: white;
    }

    #pv-integrado input,
    #pv-integrado select {
        width: 100%;
        padding: 12px;
        border: 1px solid #c8d9df;
        border-radius: 8px;
        margin: 7px 0 14px;
        font-size: 14px;
    }

    #pv-integrado .pv-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 15px;
    }

    #pv-integrado .pv-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
    }

    #pv-integrado .pv-stat {
        background: #e8f2f7;
        padding: 15px;
        border-radius: 12px;
    }

    #pv-integrado .pv-stat strong {
        display: block;
        font-size: 23px;
    }

    #pv-integrado .pv-diagram {
        overflow-x: auto;
        background: #f8fbfd;
        border-radius: 12px;
        border: 1px solid #d7e2e8;
        padding: 10px;
    }

    #pv-integrado .pv-diagram svg {
        width: 100%;
        min-width: 750px;
        height: auto;
        display: block;
    }

    #pv-integrado .pv-node { cursor: pointer; }

    #pv-integrado .pv-node rect {
        fill: #ffffff;
        stroke: #52748b;
        stroke-width: 2;
        rx: 10;
        transition: .2s;
    }

    #pv-integrado .pv-node:hover rect,
    #pv-integrado .pv-node.selected rect {
        fill: #d9edf8;
        stroke: #0875b5;
        stroke-width: 4;
    }

    #pv-integrado .pv-node text {
        fill: #17374a;
        font-size: 13px;
        text-anchor: middle;
        pointer-events: none;
    }

    #pv-integrado .pv-flow {
        fill: none;
        stroke-width: 5;
        stroke-linecap: round;
        stroke-dasharray: 12 9;
    }

    #pv-integrado .pv-gas { stroke: #159b85; }
    #pv-integrado .pv-oil { stroke: #dc9630; }
    #pv-integrado .pv-water { stroke: #2994d0; }
    #pv-integrado .pv-control {
        stroke: #8999a7;
        stroke-width: 2;
        stroke-dasharray: 5 6;
        fill: none;
    }

    #pv-integrado.pv-running .pv-flow {
        animation: pvFlow 1s linear infinite;
    }

    @keyframes pvFlow {
        to { stroke-dashoffset: -42; }
    }

    #pv-integrado .pv-node.pv-risk rect {
        stroke: #d83b3b;
        stroke-width: 5;
        animation: pvWarning 1s infinite alternate;
    }

    @keyframes pvWarning {
        from { fill: #fff; }
        to { fill: #ffe0dc; }
    }

    #pv-integrado .pv-info {
        background: #eaf3f8;
        padding: 17px;
        border-radius: 10px;
        min-height: 115px;
    }

    #pv-integrado .pv-result {
        padding: 18px;
        border-radius: 12px;
        background: #fff4d9;
        border-left: 5px solid #e6a52c;
        line-height: 1.7;
    }

    #pv-integrado .pv-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        font-size: 13px;
        margin-top: 15px;
    }

    #pv-integrado .pv-dot {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 6px;
    }

    @media(max-width:750px) {
        #pv-integrado .pv-grid,
        #pv-integrado .pv-stats {
            grid-template-columns: 1fr;
        }
    }
    `;

    document.head.appendChild(estilos);

    panel.innerHTML = `
        <div class="pv-card" style="
            background:#15364d;
            color:white;
            padding:28px;
        ">
            <div style="font-size:12px;letter-spacing:2px">
                UIS · INGENIERÍA · SELECCIÓN DE MATERIALES
            </div>

            <h2 style="font-size:29px;color:white">
                Simulador integral de producción y procesamiento
            </h2>

            <p>
                Integración de los sistemas B1, B2 y B3.
                Diagrama de proceso, equipos, materiales y condiciones
                de operación.
            </p>

            <div class="pv-stats">
                <div class="pv-stat">
                    <strong>77</strong>
                    B1 · Producción submarina
                </div>
                <div class="pv-stat">
                    <strong>86</strong>
                    B2 · Planta de proceso
                </div>
                <div class="pv-stat">
                    <strong>46</strong>
                    B3 · Servicios y estructuras
                </div>
            </div>
        </div>

        <div class="pv-card">
            <h3>1. Diagrama general del proceso</h3>

            <p class="pv-sub">
                Selecciona cualquier equipo del dibujo para consultar
                su función y localizar sus componentes en el catálogo.
            </p>

            <div class="pv-menu">
                <button class="primary" id="pv-start">
                    ▶ Iniciar proceso
                </button>

                <button id="pv-pause">
                    ⏸ Pausar
                </button>

                <button id="pv-step">
                    Avanzar etapa →
                </button>

                <button id="pv-reset">
                    Reiniciar
                </button>
            </div>

            <div class="pv-diagram">
                <svg viewBox="0 0 1200 600"
                     xmlns="http://www.w3.org/2000/svg">

                    <defs>
                        <marker id="pv-arrow-gas"
                            markerWidth="9" markerHeight="9"
                            refX="7" refY="3"
                            orient="auto">
                            <path d="M0,0 L0,6 L8,3 Z"
                                  fill="#159b85"/>
                        </marker>

                        <marker id="pv-arrow-oil"
                            markerWidth="9" markerHeight="9"
                            refX="7" refY="3"
                            orient="auto">
                            <path d="M0,0 L0,6 L8,3 Z"
                                  fill="#dc9630"/>
                        </marker>

                        <marker id="pv-arrow-water"
                            markerWidth="9" markerHeight="9"
                            refX="7" refY="3"
                            orient="auto">
                            <path d="M0,0 L0,6 L8,3 Z"
                                  fill="#2994d0"/>
                        </marker>
                    </defs>

                    <!-- B1 -->

                    <text x="35" y="35"
                          font-size="19"
                          font-weight="bold"
                          fill="#17374a">
                        B1 · PRODUCCIÓN SUBMARINA
                    </text>

                    <g class="pv-node" data-node="pozo">
                        <rect x="30" y="90" width="145" height="85"/>
                        <text x="102" y="125">
                            <tspan x="102">POZO</tspan>
                            <tspan x="102" dy="20">SUBMARINO</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="arbol">
                        <rect x="220" y="90" width="145" height="85"/>
                        <text x="292" y="125">
                            <tspan x="292">ÁRBOL DE</tspan>
                            <tspan x="292" dy="20">NAVIDAD</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="manifold">
                        <rect x="410" y="90" width="145" height="85"/>
                        <text x="482" y="125">
                            <tspan x="482">MANIFOLD</tspan>
                            <tspan x="482" dy="20">SUBMARINO</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="riser">
                        <rect x="600" y="90" width="145" height="85"/>
                        <text x="672" y="125">
                            <tspan x="672">RISER</tspan>
                            <tspan x="672" dy="20">LÍNEA DE SUBIDA</tspan>
                        </text>
                    </g>

                    <!-- B2 -->

                    <text x="790" y="35"
                          font-size="19"
                          font-weight="bold"
                          fill="#17374a">
                        B2 · PROCESAMIENTO
                    </text>

                    <g class="pv-node" data-node="separador">
                        <rect x="790" y="90" width="165" height="95"/>
                        <text x="872" y="125">
                            <tspan x="872">SEPARADOR</tspan>
                            <tspan x="872" dy="20">TRIFÁSICO</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="gas">
                        <rect x="1020" y="65" width="155" height="85"/>
                        <text x="1097" y="100">
                            <tspan x="1097">TRATAMIENTO</tspan>
                            <tspan x="1097" dy="20">DE GAS</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="compresor">
                        <rect x="1020" y="190" width="155" height="85"/>
                        <text x="1097" y="225">
                            <tspan x="1097">COMPRESOR</tspan>
                            <tspan x="1097" dy="20">DE GAS</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="condensado">
                        <rect x="790" y="270" width="165" height="85"/>
                        <text x="872" y="305">
                            <tspan x="872">ESTABILIZACIÓN</tspan>
                            <tspan x="872" dy="20">DE CONDENSADO</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="agua">
                        <rect x="550" y="270" width="175" height="85"/>
                        <text x="637" y="305">
                            <tspan x="637">TRATAMIENTO</tspan>
                            <tspan x="637" dy="20">DE AGUA</tspan>
                        </text>
                    </g>

                    <!-- B3 -->

                    <text x="35" y="415"
                          font-size="19"
                          font-weight="bold"
                          fill="#17374a">
                        B3 · SERVICIOS Y SEGURIDAD
                    </text>

                    <g class="pv-node" data-node="control">
                        <rect x="40" y="450" width="170" height="85"/>
                        <text x="125" y="485">
                            <tspan x="125">CONTROL E</tspan>
                            <tspan x="125" dy="20">INSTRUMENTACIÓN</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="esd">
                        <rect x="290" y="450" width="155" height="85"/>
                        <text x="367" y="485">
                            <tspan x="367">SISTEMA ESD</tspan>
                            <tspan x="367" dy="20">SEGURIDAD</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="tea">
                        <rect x="550" y="450" width="175" height="85"/>
                        <text x="637" y="485">
                            <tspan x="637">SISTEMA</tspan>
                            <tspan x="637" dy="20">DE TEA</tspan>
                        </text>
                    </g>

                    <g class="pv-node" data-node="utilidades">
                        <rect x="850" y="450" width="175" height="85"/>
                        <text x="937" y="485">
                            <tspan x="937">SERVICIOS</tspan>
                            <tspan x="937" dy="20">AUXILIARES</tspan>
                        </text>
                    </g>

                    <!-- FLUJOS -->

                    <path id="pv-path1"
                        class="pv-flow pv-oil"
                        d="M175 132 H220 H410 H600 H790"
                        marker-end="url(#pv-arrow-oil)"/>

                    <path id="pv-path2"
                        class="pv-flow pv-gas"
                        d="M955 110 H1020"
                        marker-end="url(#pv-arrow-gas)"/>

                    <path class="pv-flow pv-gas"
                        d="M1097 150 V190"
                        marker-end="url(#pv-arrow-gas)"/>

                    <path class="pv-flow pv-oil"
                        d="M872 185 V270"
                        marker-end="url(#pv-arrow-oil)"/>

                    <path class="pv-flow pv-water"
                        d="M790 160 H740 V310 H725"
                        marker-end="url(#pv-arrow-water)"/>

                    <!-- CONTROL -->

                    <path class="pv-control"
                        d="M210 490 H290"/>

                    <path class="pv-control"
                        d="M367 450 V390 H872 V355"/>

                    <path class="pv-control"
                        d="M637 450 V355"/>

                    <path class="pv-control"
                        d="M937 450 V355 H1097 V275"/>

                    <text x="1000" y="320"
                          font-size="12"
                          fill="#159b85">
                        GAS TRATADO
                    </text>

                    <text x="960" y="390"
                          font-size="12"
                          fill="#dc9630">
                        CONDENSADO
                    </text>

                    <text x="480" y="250"
                          font-size="12"
                          fill="#2994d0">
                        AGUA PRODUCIDA
                    </text>

                    <text x="35" y="575"
                          font-size="12"
                          fill="#587184">
                        Diagrama conceptual. Las conexiones y rutas
                        deben contrastarse con los diagramas originales
                        de cada sistema.
                    </text>

                </svg>
            </div>

            <div class="pv-legend">
                <span><i class="pv-dot" style="background:#159b85"></i>Gas</span>
                <span><i class="pv-dot" style="background:#dc9630"></i>Hidrocarburos líquidos</span>
                <span><i class="pv-dot" style="background:#2994d0"></i>Agua</span>
                <span><i class="pv-dot" style="background:#8999a7"></i>Control</span>
            </div>
        </div>

        <div class="pv-card">
            <h3>2. Información del equipo seleccionado</h3>

            <div class="pv-info" id="pv-equipment-info">
                Selecciona un equipo del diagrama para conocer
                su función y consultar sus componentes.
            </div>

            <div class="pv-menu">
                <button class="primary" id="pv-search">
                    Buscar componentes en el catálogo
                </button>
            </div>
        </div>

        <div class="pv-card">
            <h3>3. Evaluación de condiciones de operación</h3>

            <p class="pv-sub">
                Introduce las condiciones del equipo que deseas evaluar.
                No se deben asumir valores que no estén documentados.
            </p>

            <div class="pv-grid">

                <label>
                    Presión absoluta (bar)
                    <input id="pv-pressure" type="number" min="0"
                           step="any" placeholder="Presión">
                </label>

                <label>
                    Temperatura (°C)
                    <input id="pv-temperature" type="number"
                           step="any" placeholder="Temperatura">
                </label>

                <label>
                    H₂S (% molar)
                    <input id="pv-h2s" type="number" min="0"
                           max="100" step="any">
                </label>

                <label>
                    CO₂ (% molar)
                    <input id="pv-co2" type="number" min="0"
                           max="100" step="any">
                </label>

                <label>
                    Cloruros (mg/L)
                    <input id="pv-chlorides" type="number"
                           min="0" step="any">
                </label>

                <label>
                    pH del agua
                    <input id="pv-ph" type="number"
                           min="0" max="14" step="any">
                </label>

            </div>

            <label>
                ¿Existe agua libre o fase acuosa?
                <select id="pv-water">
                    <option value="unknown">Por confirmar</option>
                    <option value="yes">Sí</option>
                    <option value="no">No</option>
                </select>
            </label>

            <div class="pv-menu">
                <button class="primary" id="pv-evaluate">
                    Evaluar condiciones
                </button>

                <button id="pv-clear">
                    Limpiar datos
                </button>
            </div>

            <div id="pv-evaluation" class="pv-result"
                 aria-live="polite">
                Introduce las condiciones y presiona
                Evaluar condiciones.
            </div>
        </div>

        <div class="pv-card">
            <h3>4. Información de la simulación</h3>
            <div id="pv-stage-info" class="pv-info">
                El proceso está detenido. Presiona Iniciar proceso
                para visualizar el movimiento de los fluidos.
            </div>
        </div>
    `;

    document.body.prepend(panel);

    const equipos = {
        pozo: {
            nombre: "Pozo submarino",
            grupo: "B1",
            descripcion: "Produce los fluidos del yacimiento y los conduce hacia el sistema submarino.",
            busqueda: "pozo submarino"
        },
        arbol: {
            nombre: "Árbol de Navidad",
            grupo: "B1",
            descripcion: "Controla el flujo del pozo mediante válvulas y conexiones.",
            busqueda: "árbol de navidad"
        },
        manifold: {
            nombre: "Manifold submarino",
            grupo: "B1",
            descripcion: "Recoge y distribuye los fluidos provenientes de varios pozos.",
            busqueda: "manifold"
        },
        riser: {
            nombre: "Riser",
            grupo: "B1",
            descripcion: "Transporta los fluidos desde el sistema submarino hasta las instalaciones de superficie.",
            busqueda: "riser"
        },
        separador: {
            nombre: "Separador trifásico",
            grupo: "B2",
            descripcion: "Separa las fases gaseosa, líquida de hidrocarburos y acuosa.",
            busqueda: "separador"
        },
        gas: {
            nombre: "Tratamiento de gas",
            grupo: "B2",
            descripcion: "Permite acondicionar el gas para cumplir las especificaciones del proceso.",
            busqueda: "tratamiento de gas"
        },
        compresor: {
            nombre: "Compresor de gas",
            grupo: "B2",
            descripcion: "Eleva la presión del gas para su transporte o procesamiento posterior.",
            busqueda: "compresor"
        },
        condensado: {
            nombre: "Estabilización de condensado",
            grupo: "B2",
            descripcion: "Acondiciona el condensado para su almacenamiento o entrega.",
            busqueda: "condensado"
        },
        agua: {
            nombre: "Tratamiento de agua",
            grupo: "B2",
            descripcion: "Acondiciona el agua producida antes de su disposición o tratamiento posterior.",
            busqueda: "agua"
        },
        control: {
            nombre: "Control e instrumentación",
            grupo: "B3",
            descripcion: "Supervisa variables de proceso mediante instrumentos y sistemas de control.",
            busqueda: "instrumentación"
        },
        esd: {
            nombre: "Sistema ESD",
            grupo: "B3",
            descripcion: "Permite ejecutar paradas de emergencia y aislar secciones del proceso.",
            busqueda: "ESD"
        },
        tea: {
            nombre: "Sistema de TEA",
            grupo: "B3",
            descripcion: "Sistema destinado a la disposición controlada de gases mediante combustión.",
            busqueda: "tea"
        },
        utilidades: {
            nombre: "Servicios auxiliares",
            grupo: "B3",
            descripcion: "Incluyen servicios de apoyo necesarios para la operación de la instalación.",
            busqueda: "servicios auxiliares"
        }
    };

    let equipoSeleccionado = null;
    let etapa = 0;

    const etapas = [
        ["pozo", "Producción submarina: los fluidos salen del yacimiento."],
        ["arbol", "Control del pozo: el árbol de Navidad regula la producción."],
        ["manifold", "Recolección: el manifold reúne los fluidos."],
        ["riser", "Transporte: los fluidos ascienden por la línea de producción."],
        ["separador", "Separación: se distribuyen las fases gaseosa, líquida y acuosa."],
        ["gas", "Tratamiento: el gas pasa por su sistema de acondicionamiento."],
        ["compresor", "Compresión: se acondiciona la presión del gas."],
        ["condensado", "Condensado: se realiza su estabilización."],
        ["agua", "Agua producida: se dirige al tratamiento correspondiente."]
    ];

    function seleccionarEquipo(id) {
        const equipo = equipos[id];

        if (!equipo) return;

        equipoSeleccionado = equipo;

        panel.querySelectorAll(".pv-node").forEach(n => {
            n.classList.toggle("selected",
                n.dataset.node === id);
        });

        panel.querySelector("#pv-equipment-info").innerHTML = `
            <strong>${equipo.nombre}</strong>
            <p>Sistema: ${equipo.grupo}</p>
            <p>${equipo.descripcion}</p>
            <p>Consulta de catálogo: ${equipo.busqueda}</p>
        `;

        panel.querySelector("#pv-stage-info").textContent =
            equipo.descripcion;
    }

    panel.querySelectorAll(".pv-node").forEach(n => {
        n.addEventListener("click", () => {
            seleccionarEquipo(n.dataset.node);
        });
    });

    panel.querySelector("#pv-start").addEventListener("click", () => {
        panel.classList.add("pv-running");

        panel.querySelector("#pv-stage-info").textContent =
            "Simulación visual en ejecución. Los flujos representan rutas conceptuales del proceso.";
    });

    panel.querySelector("#pv-pause").addEventListener("click", () => {
        panel.classList.remove("pv-running");

        panel.querySelector("#pv-stage-info").textContent =
            "Simulación pausada.";
    });

    panel.querySelector("#pv-step").addEventListener("click", () => {
        const actual = etapas[etapa];

        seleccionarEquipo(actual[0]);

        panel.querySelector("#pv-stage-info").textContent =
            "ETAPA " + (etapa + 1) + " DE " + etapas.length +
            ": " + actual[1];

        etapa = (etapa + 1) % etapas.length;
    });

    panel.querySelector("#pv-reset").addEventListener("click", () => {
        panel.classList.remove("pv-running");

        etapa = 0;
        equipoSeleccionado = null;

        panel.querySelectorAll(".pv-node").forEach(n => {
            n.classList.remove("selected", "pv-risk");
        });

        panel.querySelector("#pv-equipment-info").textContent =
            "Selecciona un equipo del diagrama.";

        panel.querySelector("#pv-stage-info").textContent =
            "Simulación reiniciada.";
    });

    panel.querySelector("#pv-search").addEventListener("click", () => {
        if (!equipoSeleccionado) {
            alert("Primero selecciona un equipo del diagrama.");
            return;
        }

        const campo = Array.from(
            document.querySelectorAll("input")
        ).find(el =>
            /buscar componente|a106.*316l|absorbedor/i.test(
                el.placeholder || ""
            )
        );

        if (campo) {
            campo.value = equipoSeleccionado.busqueda;

            campo.dispatchEvent(
                new Event("input", { bubbles: true })
            );

            campo.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            campo.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        } else {
            alert(
                "No se encontró el buscador original del catálogo."
            );
        }
    });

    function numero(id) {
        const valor = panel.querySelector("#" + id).value.trim();

        if (valor === "") return null;

        const n = Number(valor);

        return Number.isFinite(n) ? n : NaN;
    }

    panel.querySelector("#pv-evaluate").addEventListener("click", () => {

        const P = numero("pv-pressure");
        const T = numero("pv-temperature");
        const H = numero("pv-h2s");
        const C = numero("pv-co2");
        const Cl = numero("pv-chlorides");
        const ph = numero("pv-ph");

        const agua = panel.querySelector("#pv-water").value;

        const errores = [];

        const validar = (valor, nombre, minimo, maximo) => {
            if (valor !== null &&
                (!Number.isFinite(valor) ||
                 valor < minimo ||
                 valor > maximo)) {
                errores.push(nombre + ": valor fuera del rango permitido.");
            }
        };

        validar(P, "Presión", 0, Infinity);
        validar(T, "Temperatura", -273.15, Infinity);
        validar(H, "H₂S", 0, 100);
        validar(C, "CO₂", 0, 100);
        validar(Cl, "Cloruros", 0, Infinity);
        validar(ph, "pH", 0, 14);

        if (errores.length) {
            panel.querySelector("#pv-evaluation").textContent =
                errores.join(" ");
            return;
        }

        panel.querySelectorAll(".pv-node").forEach(n => {
            n.classList.remove("pv-risk");
        });

        const riesgos = [];
        const objetivos = new Set();

        let pH2S = null;
        let pCO2 = null;

        if (P !== null && H !== null) {
            pH2S = P * H / 100;
        }

        if (P !== null && C !== null) {
            pCO2 = P * C / 100;
        }

        if (agua === "yes" && H !== null && H > 0) {
            riesgos.push(
                "H₂S en presencia de agua: evaluar SSC y HIC conforme a ISO 15156, considerando presión parcial, pH, dureza y condiciones del material."
            );

            objetivos.add("riser");
            objetivos.add("separador");
        }

        if (agua === "yes" && C !== null && C > 0) {
            riesgos.push(
                "CO₂ en presencia de agua: evaluar corrosión interna por CO₂ y las condiciones de operación."
            );

            objetivos.add("separador");
            objetivos.add("riser");
        }

        if (agua === "yes" && Cl !== null && Cl > 0) {
            riesgos.push(
                "Cloruros en fase acuosa: revisar riesgo de picadura y corrosión en rendijas según material, concentración y temperatura."
            );

            objetivos.add("separador");
            objetivos.add("agua");
        }

        if (ph !== null && ph < 7) {
            riesgos.push(
                "pH ácido: revisar corrosión acuosa y compatibilidad del material."
            );

            objetivos.add("riser");
        }

        if (T !== null) {
            riesgos.push(
                "Temperatura registrada: verificar el límite de servicio y la resistencia del material seleccionado."
            );
        }

        if (agua === "unknown") {
            riesgos.push(
                "Presencia de agua sin confirmar: verificar condensación y fase acuosa."
            );
        }

        if (P !== null && H !== null) {
            riesgos.push(
                "Presión parcial calculada de H₂S: " +
                pH2S.toFixed(3) + " bar."
            );
        }

        if (P !== null && C !== null) {
            riesgos.push(
                "Presión parcial calculada de CO₂: " +
                pCO2.toFixed(3) + " bar."
            );
        }

        objetivos.forEach(id => {
            const nodo = panel.querySelector(
                '[data-node="' + id + '"]'
            );

            if (nodo) nodo.classList.add("pv-risk");
        });

        const resultado = panel.querySelector("#pv-evaluation");

        resultado.innerHTML = `
            <strong>RESULTADOS DE EVALUACIÓN PRELIMINAR</strong>

            <p>
                <strong>Estado:</strong>
                REQUIERE VERIFICACIÓN TÉCNICA.
            </p>

            <strong>Mecanismos y verificaciones:</strong>

            <ul>
                ${riesgos.length
                    ? riesgos.map(r => "<li>" + r + "</li>").join("")
                    : "<li>No se identificaron mecanismos con los datos suministrados.</li>"
                }
            </ul>

            <p>
                <strong>Material:</strong>
                No se declara apto ni no apto automáticamente.
                Se debe contrastar con la norma aplicable,
                el grado, tratamiento, límites de servicio
                y requisitos de diseño.
            </p>

            <p>
                Los equipos marcados en rojo representan zonas
                donde deben revisarse los mecanismos identificados.
            </p>
        `;

    });

    panel.querySelector("#pv-clear").addEventListener("click", () => {
        panel.querySelectorAll("input").forEach(i => {
            i.value = "";
        });

        panel.querySelector("#pv-water").value = "unknown";

        panel.querySelectorAll(".pv-node").forEach(n => {
            n.classList.remove("pv-risk");
        });

        panel.querySelector("#pv-evaluation").textContent =
            "Condiciones limpiadas. Introduce nuevos valores.";
    });

})();

/* VISTA COMPLETA DEL PROYECTO B1 + B2 + B3
   PEGAR DESPUES DEL ULTIMO })(); DE app.js
   NO BORRAR EL CODIGO ANTERIOR.
*/
(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  }[c]));

  const grupos = {
    B1: {
      nombre: "Producción submarina y conducción a tierra",
      frontera: "Desde la formación productora hasta la válvula de llegada de la línea de conducción en el límite de la planta."
    },
    B2: {
      nombre: "Planta de proceso de gas en tierra",
      frontera: "Desde la válvula de llegada hasta los puntos de entrega de gas de especificación y condensado estabilizado."
    },
    B3: {
      nombre: "Servicios, utilidades y estructura",
      frontera: "Sistemas auxiliares y estructura de la plataforma y de la planta, incluida la zona de salpicadura."
    }
  };

  let inventario = [];
  let cargado = false;
  let cargando = false;
  let seleccionado = null;

  function agregarEstilos() {
    if ($("fi-estilos")) return;

    const style = document.createElement("style");
    style.id = "fi-estilos";

    style.textContent = `
      #fi-completo {
        margin-top:18px;
        padding:18px;
        border:1px solid #d8e4ea;
        border-radius:16px;
        background:#fff;
        color:#17374a;
        box-shadow:0 7px 22px #173b4e0b;
        font-family:system-ui,Segoe UI,Arial,sans-serif;
      }

      #fi-completo * { box-sizing:border-box; }

      .fi-cabecera {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:16px;
        flex-wrap:wrap;
      }

      .fi-etiqueta {
        font-size:11px;
        letter-spacing:1.2px;
        color:#0b7184;
        font-weight:750;
      }

      .fi-cabecera h2 {
        font-size:22px;
        margin:5px 0;
        color:#17374a;
      }

      .fi-cabecera p {
        font-size:13px;
        color:#587184;
        margin:0;
        max-width:760px;
        line-height:1.5;
      }

      #fi-toggle {
        border:0;
        border-radius:9px;
        padding:12px 16px;
        background:#0b677a;
        color:#fff;
        font-weight:700;
        cursor:pointer;
      }

      #fi-toggle:hover { background:#084f60; }

      #fi-contenido { margin-top:18px; }

      #fi-contenido[hidden] {
        display:none!important;
      }

      .fi-herramientas {
        display:grid;
        grid-template-columns:minmax(220px,1fr) 230px;
        gap:10px;
        margin:14px 0;
      }

      .fi-herramientas input,
      .fi-herramientas select {
        width:100%;
        min-width:0;
        padding:11px 12px;
        border:1px solid #cbdbe2;
        border-radius:8px;
        background:#fff;
        color:#17374a;
        font:inherit;
      }

      .fi-controles {
        grid-column:1/-1;
        display:flex;
        gap:8px;
        flex-wrap:wrap;
      }

      .fi-controles button {
        border:1px solid #bfd1da;
        border-radius:8px;
        padding:8px 11px;
        background:#edf4f7;
        color:#174b6b;
        font-weight:700;
        cursor:pointer;
      }

      .fi-resumen {
        display:grid;
        grid-template-columns:repeat(5,minmax(0,1fr));
        gap:9px;
        margin:12px 0;
      }

      .fi-kpi {
        padding:12px;
        border-radius:10px;
        background:#edf4f8;
      }

      .fi-kpi strong {
        display:block;
        font-size:22px;
        color:#174b6b;
      }

      .fi-kpi span {
        font-size:11px;
        color:#587184;
      }

      .fi-aviso {
        padding:11px 13px;
        margin:12px 0;
        background:#fff6e4;
        border-left:4px solid #d69b32;
        border-radius:7px;
        font-size:12px;
        line-height:1.5;
        color:#614b20;
      }

      .fi-flujo {
        display:grid;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        gap:13px;
        align-items:start;
      }

      .fi-sistema {
        border:1px solid #cddde5;
        border-radius:13px;
        padding:13px;
        min-width:0;
        background:#f8fbfd;
      }

      .fi-sistema[data-grupo="B1"] {
        border-top:5px solid #2588bf;
      }

      .fi-sistema[data-grupo="B2"] {
        border-top:5px solid #27977b;
      }

      .fi-sistema[data-grupo="B3"] {
        border-top:5px solid #9277bd;
        grid-column:1/-1;
        background:#faf8fd;
      }

      .fi-sistema-cab {
        display:flex;
        justify-content:space-between;
        gap:8px;
        align-items:flex-start;
        margin-bottom:10px;
      }

      .fi-sistema-cab small {
        font-size:10px;
        letter-spacing:1px;
        font-weight:800;
        color:#617988;
      }

      .fi-sistema-cab h3 {
        font-size:16px;
        margin:4px 0;
        color:#17374a;
      }

      .fi-sistema-cab p {
        font-size:11px;
        line-height:1.45;
        color:#617988;
        margin:0;
      }

      .fi-total {
        white-space:nowrap;
        background:#e8f0f4;
        border-radius:20px;
        padding:5px 8px;
        font-size:11px;
        font-weight:750;
        color:#31566a;
      }

      .fi-equipos {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .fi-equipo {
        border:1px solid #d9e4e9;
        border-radius:9px;
        background:#fff;
        overflow:hidden;
        min-width:0;
      }

      .fi-equipo summary {
        cursor:pointer;
        list-style:none;
        padding:10px 11px;
        display:flex;
        justify-content:space-between;
        gap:8px;
        align-items:center;
        font-size:12px;
        font-weight:750;
        color:#23475a;
      }

      .fi-equipo summary::-webkit-details-marker {
        display:none;
      }

      .fi-equipo summary:after {
        content:"+";
        font-size:16px;
        color:#0b7184;
      }

      .fi-equipo[open] summary:after {
        content:"−";
      }

      .fi-equipo summary small {
        display:block;
        color:#718794;
        font-size:10px;
        font-weight:500;
        margin-top:3px;
      }

      .fi-piezas {
        padding:0 8px 8px;
        display:flex;
        flex-direction:column;
        gap:5px;
      }

      .fi-pieza {
        width:100%;
        text-align:left;
        border:1px solid #e1e9ed;
        border-radius:7px;
        background:#fbfdfe;
        padding:7px 8px;
        cursor:pointer;
        color:#23475a;
        display:grid;
        grid-template-columns:auto minmax(0,1fr);
        gap:3px 7px;
        align-items:start;
      }

      .fi-pieza:hover,
      .fi-pieza.fi-seleccionada {
        border-color:#0b8290;
        background:#eaf6f6;
      }

      .fi-id {
        font-size:10px;
        font-weight:800;
        color:#0b7184;
        white-space:nowrap;
      }

      .fi-pieza-nombre {
        font-size:11px;
        line-height:1.35;
        overflow-wrap:anywhere;
      }

      .fi-material {
        grid-column:2;
        font-size:10px;
        color:#728692;
        line-height:1.3;
        overflow-wrap:anywhere;
      }

      .fi-sin-datos {
        padding:12px;
        border:1px dashed #cbdbe2;
        border-radius:8px;
        color:#718794;
        font-size:12px;
        background:#fff;
      }

      .fi-fronteras {
        display:flex;
        gap:9px;
        flex-wrap:wrap;
        margin:12px 0;
      }

      .fi-frontera {
        flex:1 1 240px;
        padding:10px 12px;
        border-radius:9px;
        background:#edf5f8;
        font-size:11px;
        line-height:1.45;
        color:#496777;
      }

      .fi-frontera strong {
        display:block;
        color:#174b6b;
        margin-bottom:3px;
      }

      .fi-frontera.fi-b3 {
        background:#f3eff9;
      }

      .fi-ficha {
        margin-top:14px;
        padding:15px;
        border:1px solid #d8e4ea;
        border-radius:12px;
        background:#fff;
      }

      .fi-ficha h3 {
        font-size:16px;
        margin-bottom:8px;
      }

      .fi-ficha-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:8px;
      }

      .fi-dato {
        padding:8px 9px;
        background:#f7fafb;
        border-radius:7px;
        min-width:0;
      }

      .fi-dato b {
        display:block;
        font-size:10px;
        text-transform:uppercase;
        letter-spacing:.4px;
        color:#6b808c;
        margin-bottom:3px;
      }

      .fi-dato span {
        font-size:12px;
        line-height:1.4;
        overflow-wrap:anywhere;
        color:#17374a;
      }

      .fi-ficha-acciones {
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin-top:11px;
      }

      .fi-ficha-acciones button {
        border:1px solid #bfd1da;
        border-radius:8px;
        padding:9px 12px;
        background:#edf4f7;
        color:#174b6b;
        font-weight:700;
        cursor:pointer;
      }

      .fi-ficha-acciones button:first-child {
        background:#0b677a;
        color:#fff;
        border-color:#0b677a;
      }

      .fi-pie {
        font-size:11px;
        line-height:1.5;
        color:#71838e;
        margin:12px 0 0;
      }

      @media(max-width:760px) {
        .fi-flujo { grid-template-columns:1fr; }
        .fi-sistema[data-grupo="B3"] { grid-column:auto; }
        .fi-resumen { grid-template-columns:repeat(2,minmax(0,1fr)); }
        .fi-herramientas { grid-template-columns:1fr; }
        .fi-equipos { grid-template-columns:1fr; }
        .fi-ficha-grid { grid-template-columns:1fr; }
      }
    `;

    document.head.appendChild(style);
  }

  function montar() {
    const destino = $("pv-panel") || $("sim-integrado");

    if (!destino || $("fi-completo")) return;

    const panel = document.createElement("section");
    panel.id = "fi-completo";

    panel.innerHTML = `
      <div class="fi-cabecera">
        <div>
          <div class="fi-etiqueta">
            VISTA COMPLEMENTARIA · INVENTARIO TOTAL
          </div>

          <h2>Esquema integral del proyecto B1 + B2 + B3</h2>

          <p>
            Consulta la estructura completa del proyecto y despliega
            cada equipo para ver todas las piezas registradas en los informes.
          </p>
        </div>

        <button type="button" id="fi-toggle" aria-expanded="false">
          Abrir esquema completo del proyecto
        </button>
      </div>

      <div id="fi-contenido" hidden>

        <div class="fi-herramientas">

          <input id="fi-buscar"
            type="search"
            placeholder="Buscar ID, equipo, pieza, material o norma..." />

          <select id="fi-filtro">
            <option value="TODOS">Mostrar B1 + B2 + B3</option>
            <option value="B1">Solo B1 · Producción submarina</option>
            <option value="B2">Solo B2 · Planta de proceso</option>
            <option value="B3">Solo B3 · Servicios y estructura</option>
          </select>

          <div class="fi-controles">
            <button type="button" id="fi-expandir">
              Desplegar todos los equipos
            </button>

            <button type="button" id="fi-contraer">
              Contraer todos los equipos
            </button>
          </div>

        </div>

        <div class="fi-resumen" id="fi-resumen">
          <div class="fi-sin-datos">Cargando inventario...</div>
        </div>

        <div class="fi-fronteras">

          <div class="fi-frontera">
            <strong>B1 → B2 · Frontera del proceso</strong>
            La línea de conducción llega a la válvula de llegada
            en el límite de la planta en tierra.
          </div>

          <div class="fi-frontera fi-b3">
            <strong>B3 · Sistemas de apoyo</strong>
            Servicios, utilidades y estructura.
            No representa una corriente única de hidrocarburos.
          </div>

        </div>

        <div class="fi-flujo" id="fi-flujo"></div>

        <div class="fi-ficha" id="fi-ficha">
          <h3>Ficha del componente</h3>
          <p class="fi-pie">
            Selecciona cualquier pieza del esquema para consultar
            sus datos documentados.
          </p>
        </div>

        <p class="fi-pie">
          Este esquema organiza el inventario real por bloque, equipo y pieza.
          No es un PFD ni un P&ID y no inventa conexiones entre componentes.
          Para definir tuberías, válvulas y rutas exactas se debe consultar
          el diagrama de ingeniería correspondiente.
        </p>

      </div>
    `;

    destino.appendChild(panel);
    agregarEstilos();

    $("fi-toggle").addEventListener("click", alternar);
    $("fi-buscar").addEventListener("input", dibujarInventario);
    $("fi-filtro").addEventListener("change", dibujarInventario);
    $("fi-flujo").addEventListener("click", eventoPieza);
    $("fi-ficha").addEventListener("click", eventoFicha);

    $("fi-expandir").addEventListener("click", () => {
      document.querySelectorAll("#fi-flujo details.fi-equipo")
        .forEach(d => d.open = true);
    });

    $("fi-contraer").addEventListener("click", () => {
      document.querySelectorAll("#fi-flujo details.fi-equipo")
        .forEach(d => d.open = false);
    });
  }

  async function alternar() {
    const contenido = $("fi-contenido");
    const boton = $("fi-toggle");

    const abrir = contenido.hidden;
    contenido.hidden = !abrir;

    boton.setAttribute("aria-expanded", String(abrir));

    boton.textContent = abrir
      ? "Ocultar esquema completo"
      : "Abrir esquema completo del proyecto";

    if (abrir && !cargado) {
      await cargarInventario();
    }

    if (abrir) {
      $("fi-completo").scrollIntoView({
        behavior:"smooth",
        block:"start"
      });
    }
  }

  async function cargarInventario() {
    if (cargando) return;

    cargando = true;

    $("fi-resumen").innerHTML =
      '<div class="fi-sin-datos">Cargando los componentes de B1, B2 y B3...</div>';

    try {
      const respuesta = await fetch("datos/equipos.json", {
        cache:"no-store"
      });

      if (!respuesta.ok) {
        throw new Error(
          "No se encontró datos/equipos.json. Verifica que el servidor esté abierto desde la carpeta del proyecto."
        );
      }

      const filas = await respuesta.json();

      if (!Array.isArray(filas)) {
        throw new Error(
          "El archivo equipos.json no contiene una lista de componentes."
        );
      }

      inventario = filas;
      cargado = true;

      dibujarInventario();

    } catch (error) {

      $("fi-resumen").innerHTML =
        `<div class="fi-sin-datos">${esc(error.message)}</div>`;

      console.error("Esquema integral:", error);

    } finally {
      cargando = false;
    }
  }

  function coincide(fila, consulta) {
    if (!consulta) return true;

    const campos = [
      fila.id,
      fila.grupo,
      fila.sector,
      fila.equipo,
      fila.subconjunto,
      fila.pieza,
      fila.material,
      fila.dimensiones,
      fila.cantidad,
      fila.norma,
      fila.estado,
      fila.fuente
    ];

    return campos.join(" ").toLowerCase().includes(consulta);
  }

  function dibujarInventario() {
    if (!cargado) return;

    const consulta = $("fi-buscar").value.trim().toLowerCase();
    const filtro = $("fi-filtro").value;

    const visibles = inventario.filter(f =>
      (filtro === "TODOS" || f.grupo === filtro) &&
      coincide(f, consulta)
    );

    const totales = ["B1", "B2", "B3"].map(g =>
      inventario.filter(f => f.grupo === g).length
    );

    $("fi-resumen").innerHTML = `
      <div class="fi-kpi">
        <strong>${inventario.length}</strong>
        <span>Total de registros del inventario</span>
      </div>

      <div class="fi-kpi">
        <strong>${totales[0]}</strong>
        <span>B1 · Producción submarina</span>
      </div>

      <div class="fi-kpi">
        <strong>${totales[1]}</strong>
        <span>B2 · Planta de proceso</span>
      </div>

      <div class="fi-kpi">
        <strong>${totales[2]}</strong>
        <span>B3 · Servicios y estructura</span>
      </div>

      <div class="fi-kpi">
        <strong>${visibles.length}</strong>
        <span>Coincidencias con el filtro actual</span>
      </div>
    `;

    const mostrar = filtro === "TODOS"
      ? ["B1", "B2", "B3"]
      : [filtro];

    $("fi-flujo").innerHTML = mostrar.map(g =>
      dibujarGrupo(
        g,
        visibles.filter(f => f.grupo === g),
        consulta
      )
    ).join("");

    if (!visibles.length) {
      $("fi-flujo").innerHTML =
        '<div class="fi-sin-datos">No hay componentes que coincidan con esa búsqueda.</div>';
    }
  }

  function dibujarGrupo(grupo, filas, consulta) {
    const meta = grupos[grupo];
    const conjuntos = new Map();

    filas.forEach(f => {
      const nombre = String(
        f.equipo || f.subconjunto || f.pieza || "Equipo sin clasificar"
      );

      const sector =
        f.sector === undefined || f.sector === null || f.sector === ""
          ? ""
          : `Sector ${f.sector}`;

      const clave = `${sector}¦${nombre}`;

      if (!conjuntos.has(clave)) {
        conjuntos.set(clave, {
          nombre,
          sector,
          filas:[]
        });
      }

      conjuntos.get(clave).filas.push(f);
    });

    const equiposHtml = [...conjuntos.values()]
      .sort((a,b) => a.nombre.localeCompare(b.nombre,"es"))
      .map(c => {
        const piezas = c.filas.slice().sort((a,b) =>
          String(a.id || "").localeCompare(String(b.id || ""),"es")
        );

        return `
          <details class="fi-equipo" ${consulta ? "open" : ""}>

            <summary>
              <span>
                ${esc(c.nombre)}
                ${c.sector ? `<small>${esc(c.sector)}</small>` : ""}
              </span>

              <small>${piezas.length} piezas</small>
            </summary>

            <div class="fi-piezas">

              ${piezas.map(p => `
                <button type="button"
                  class="fi-pieza"
                  data-fi-id="${esc(p.id)}">

                  <span class="fi-id">
                    ${esc(p.id || "Sin ID")}
                  </span>

                  <span class="fi-pieza-nombre">
                    ${esc(p.pieza || p.subconjunto || "Pieza sin nombre")}
                  </span>

                  <small class="fi-material">
                    ${esc(p.material || "Material sin dato")}
                  </small>

                </button>
              `).join("")}

            </div>
          </details>
        `;
      }).join("");

    return `
      <section class="fi-sistema" data-grupo="${grupo}">

        <div class="fi-sistema-cab">
          <div>
            <small>${grupo}</small>
            <h3>${esc(meta.nombre)}</h3>
            <p>${esc(meta.frontera)}</p>
          </div>

          <span class="fi-total">
            ${filas.length} piezas
          </span>
        </div>

        <div class="fi-equipos">
          ${equiposHtml ||
            '<div class="fi-sin-datos">Sin coincidencias para este bloque.</div>'}
        </div>

      </section>
    `;
  }

  function eventoPieza(evento) {
    const boton = evento.target.closest("button[data-fi-id]");

    if (!boton) return;

    const fila = inventario.find(f =>
      String(f.id) === boton.dataset.fiId
    );

    if (!fila) return;

    seleccionado = fila;

    document.querySelectorAll(".fi-pieza").forEach(b =>
      b.classList.toggle("fi-seleccionada", b === boton)
    );

    mostrarFicha(fila);
  }

  function mostrarFicha(f) {
    const campos = [
      ["Grupo", f.grupo],
      ["ID", f.id],
      ["Equipo", f.equipo],
      ["Subconjunto", f.subconjunto],
      ["Pieza", f.pieza],
      ["Material documentado", f.material],
      ["Dimensiones", f.dimensiones],
      ["Cantidad", f.cantidad],
      ["Norma de consulta", f.norma],
      ["Estado", f.estado],
      ["Fuente", f.fuente]
    ].filter(([,valor]) =>
      valor !== undefined &&
      valor !== null &&
      String(valor).trim() !== ""
    );

    $("fi-ficha").innerHTML = `
      <h3>${esc(f.id)} · ${esc(f.equipo || "Componente")}</h3>

      <div class="fi-ficha-grid">
        ${campos.map(([nombre,valor]) => `
          <div class="fi-dato">
            <b>${esc(nombre)}</b>
            <span>${esc(valor)}</span>
          </div>
        `).join("")}
      </div>

      <div class="fi-aviso">
        El material mostrado es el que figura en el inventario.
        Su aptitud debe verificarse con las condiciones reales
        de servicio y los requisitos de diseño.
      </div>

      <div class="fi-ficha-acciones">
        <button type="button" id="fi-abrir-ficha">
          Abrir ficha en el simulador principal
        </button>
      </div>
    `;
  }

  function eventoFicha(evento) {
    if (!evento.target.closest("#fi-abrir-ficha") || !seleccionado) {
      return;
    }

    const grupo = $("sim-grupo");
    const equipo = $("sim-equipo");

    if (grupo) {
      grupo.value = seleccionado.grupo;
      grupo.dispatchEvent(
        new Event("change", {bubbles:true})
      );
    }

    if (equipo) {
      equipo.value = seleccionado.id;
      equipo.dispatchEvent(
        new Event("change", {bubbles:true})
      );
    }

    const ficha = $("sim-ficha");

    if (ficha) {
      ficha.scrollIntoView({
        behavior:"smooth",
        block:"center"
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar);
  } else {
    montar();
  }

})();

/* =====================================================
   SIMULACION ANIMADA 2D - PROYECTO B1 + B2 + B3
   Fabian Rivera - Desarrollo Costa Afuera
   Bloque independiente: pegar al final de app.js
===================================================== */

(() => {
  "use strict";

  function iniciarSimulacion2D() {

    if (document.getElementById("sim2d-root")) return;

    const css = `
      #sim2d-root * { box-sizing: border-box; }

      #sim2d-root .sim2d-launcher {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 99990;
        background: #087b9d;
        color: white;
        border: 0;
        border-radius: 12px;
        padding: 15px 22px;
        font-weight: 750;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 5px 20px #102f4540;
      }

      #sim2d-root .sim2d-modal[hidden] {
        display: none !important;
      }

      #sim2d-root .sim2d-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: #081c2ddd;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 15px;
      }

      #sim2d-root .sim2d-window {
        width: 100%;
        max-width: 1500px;
        max-height: 94vh;
        background: #f5f8fb;
        border-radius: 17px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 15px 60px #0005;
      }

      #sim2d-root .sim2d-header {
        background: #12334c;
        color: white;
        padding: 18px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
      }

      #sim2d-root .sim2d-header h2 {
        margin: 0;
        font-size: 21px;
      }

      #sim2d-root .sim2d-header p {
        margin: 5px 0 0;
        font-size: 12px;
        color: #c5d8e6;
      }

      #sim2d-root .sim2d-close {
        background: #ffffff20;
        border: 1px solid #ffffff50;
        color: white;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
      }

      #sim2d-root .sim2d-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        padding: 14px 20px;
        background: white;
        border-bottom: 1px solid #dce5ed;
      }

      #sim2d-root .sim2d-toolbar button {
        border: 0;
        border-radius: 8px;
        padding: 11px 17px;
        font-weight: 700;
        cursor: pointer;
      }

      #sim2d-root .sim2d-start {
        background: #087b9d;
        color: white;
      }

      #sim2d-root .sim2d-reset {
        background: #e8edf2;
        color: #17374a;
      }

      #sim2d-root .sim2d-scroll {
        overflow: auto;
        padding: 15px;
      }

      #sim2d-root .sim2d-svg {
        display: block;
        width: 100%;
        min-width: 1100px;
        height: auto;
        background: #edf4f8;
        border: 1px solid #d2e0e9;
        border-radius: 12px;
      }

      #sim2d-root .sim2d-node {
        cursor: pointer;
        outline: none;
      }

      #sim2d-root .sim2d-node .sim2d-body {
        fill: white;
        stroke: #50748c;
        stroke-width: 3;
        transition: fill .2s, stroke .2s;
      }

      #sim2d-root .sim2d-node:hover .sim2d-body,
      #sim2d-root .sim2d-node.active .sim2d-body {
        fill: #d9f0fa;
        stroke: #0784b5;
        stroke-width: 5;
      }

      #sim2d-root .sim2d-node.active {
        filter: drop-shadow(0 0 8px #0784b580);
      }

      #sim2d-root .sim2d-node text {
        font-family: Arial, sans-serif;
        fill: #17374a;
        text-anchor: middle;
        pointer-events: none;
      }

      #sim2d-root .sim2d-flow {
        fill: none;
        stroke-width: 7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #sim2d-root .sim2d-mixed { stroke: #d68c28; }
      #sim2d-root .sim2d-gas { stroke: #0c9c85; }
      #sim2d-root .sim2d-cond { stroke: #e59b2d; }
      #sim2d-root .sim2d-water { stroke: #238bc9; }

      #sim2d-root .sim2d-support {
        fill: none;
        stroke: #8299aa;
        stroke-width: 3;
        stroke-dasharray: 8 8;
      }

      #sim2d-root .sim2d-svg.is-running .sim2d-flow {
        stroke-dasharray: 13 11;
        animation: sim2d-move 1s linear infinite;
      }

      @keyframes sim2d-move {
        to { stroke-dashoffset: -48; }
      }

      #sim2d-root .sim2d-info {
        margin: 0 15px 15px;
        padding: 17px 20px;
        background: white;
        border: 1px solid #d5e2eb;
        border-left: 5px solid #087b9d;
        border-radius: 10px;
      }

      #sim2d-root .sim2d-info h3 {
        margin: 0 0 7px;
        color: #12334c;
      }

      #sim2d-root .sim2d-info p {
        margin: 5px 0;
        color: #465c6b;
        line-height: 1.5;
      }

      #sim2d-root .sim2d-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        padding: 10px 20px;
        font-size: 12px;
        color: #425a6b;
        background: white;
      }

      #sim2d-root .sim2d-dot {
        display: inline-block;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        margin-right: 5px;
      }

      #sim2d-root .sim2d-note {
        padding: 10px 20px;
        font-size: 11px;
        color: #657988;
      }

      @media(max-width:700px) {
        #sim2d-root .sim2d-header h2 { font-size: 16px; }
        #sim2d-root .sim2d-launcher {
          right: 10px;
          bottom: 10px;
        }
      }
    `;

    const style = document.createElement("style");
    style.id = "sim2d-styles";
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.id = "sim2d-root";

    root.innerHTML = `
      <button class="sim2d-launcher" id="sim2d-open">
        Ver simulación animada 2D
      </button>

      <div class="sim2d-modal" id="sim2d-modal" hidden>
        <div class="sim2d-window">

          <div class="sim2d-header">
            <div>
              <h2>Simulación de producción de gas costa afuera</h2>
              <p>UIS · Selección de materiales · Sistemas B1 + B2 + B3</p>
            </div>
            <button class="sim2d-close" id="sim2d-close">
              Cerrar ✕
            </button>
          </div>

          <div class="sim2d-toolbar">
            <button class="sim2d-start" id="sim2d-start">
              Iniciar recorrido
            </button>
            <button class="sim2d-reset" id="sim2d-reset">
              Reiniciar
            </button>
          </div>

          <div class="sim2d-scroll">

            <svg id="sim2d-svg"
                 class="sim2d-svg"
                 viewBox="0 0 1600 760"
                 role="img"
                 aria-label="Diagrama animado del proceso de producción y tratamiento de gas">

              <defs>
                <marker id="sim2d-arrow-mix"
                  markerWidth="10" markerHeight="10"
                  refX="8" refY="5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 Z" fill="#d68c28"/>
                </marker>

                <marker id="sim2d-arrow-gas"
                  markerWidth="10" markerHeight="10"
                  refX="8" refY="5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 Z" fill="#0c9c85"/>
                </marker>

                <marker id="sim2d-arrow-cond"
                  markerWidth="10" markerHeight="10"
                  refX="8" refY="5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 Z" fill="#e59b2d"/>
                </marker>

                <marker id="sim2d-arrow-water"
                  markerWidth="10" markerHeight="10"
                  refX="8" refY="5" orient="auto">
                  <path d="M0 0 L10 5 L0 10 Z" fill="#238bc9"/>
                </marker>
              </defs>

              <rect width="1600" height="760" fill="#edf4f8"/>

              <text x="35" y="38" font-size="23"
                font-weight="bold" fill="#12334c">
                B1 · PRODUCCIÓN SUBMARINA
              </text>

              <text x="815" y="38" font-size="23"
                font-weight="bold" fill="#12334c">
                B2 · PROCESAMIENTO
              </text>

              <text x="35" y="555" font-size="23"
                font-weight="bold" fill="#12334c">
                B3 · SERVICIOS Y SEGURIDAD
              </text>

              <!-- RUTAS DE FLUIDO -->

              <path class="sim2d-flow sim2d-mixed"
                d="M200 275 H230"
                marker-end="url(#sim2d-arrow-mix)"/>

              <path class="sim2d-flow sim2d-mixed"
                d="M390 275 H420"
                marker-end="url(#sim2d-arrow-mix)"/>

              <path class="sim2d-flow sim2d-mixed"
                d="M580 275 H610"
                marker-end="url(#sim2d-arrow-mix)"/>

              <path class="sim2d-flow sim2d-mixed"
                d="M770 275 H810"
                marker-end="url(#sim2d-arrow-mix)"/>

              <path class="sim2d-flow sim2d-gas"
                d="M1010 235 C1040 235 1040 130 1080 130"
                marker-end="url(#sim2d-arrow-gas)"/>

              <path class="sim2d-flow sim2d-gas"
                d="M1250 130 H1320"
                marker-end="url(#sim2d-arrow-gas)"/>

              <path class="sim2d-flow sim2d-gas"
                d="M1510 130 H1560"
                marker-end="url(#sim2d-arrow-gas)"/>

              <path class="sim2d-flow sim2d-cond"
                d="M910 360 V405 H1175 V440"
                marker-end="url(#sim2d-arrow-cond)"/>

              <path class="sim2d-flow sim2d-water"
                d="M850 345 C790 380 790 430 850 475"
                marker-end="url(#sim2d-arrow-water)"/>

              <!-- CONEXIONES DE CONTROL B3 -->

              <path class="sim2d-support"
                d="M525 590 V510 H690 V350"/>

              <path class="sim2d-support"
                d="M275 590 V490 H500 V350"/>

              <path class="sim2d-support"
                d="M775 590 V500 H950 V360"/>

              <path class="sim2d-support"
                d="M1025 590 V520 H1175 V440"/>

              <!-- B1: POZO -->

              <g class="sim2d-node" data-id="pozo"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="40" y="205" width="160" height="145" rx="13"/>

                <path d="M105 230 V310 M135 230 V310"
                  stroke="#50748c" stroke-width="7" fill="none"/>

                <path d="M90 310 H150 M90 320 H150"
                  stroke="#50748c" stroke-width="4"/>

                <path d="M55 330 Q75 315 95 330 T135 330 T185 330"
                  stroke="#238bc9" stroke-width="3" fill="none"/>

                <text x="120" y="375" font-size="15"
                  font-weight="bold">POZO SUBMARINO</text>
              </g>

              <!-- ARBOL DE NAVIDAD -->

              <g class="sim2d-node" data-id="arbol"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="230" y="205" width="160" height="145" rx="13"/>

                <path d="M310 240 V320 M270 260 H350"
                  stroke="#50748c" stroke-width="7" fill="none"/>

                <path d="M270 260 L290 245 L290 275 Z"
                  fill="#0c9c85"/>

                <path d="M350 260 L330 245 L330 275 Z"
                  fill="#0c9c85"/>

                <circle cx="310" cy="240" r="10"
                  fill="#d68c28" stroke="#50748c" stroke-width="3"/>

                <text x="310" y="375" font-size="15"
                  font-weight="bold">ÁRBOL DE NAVIDAD</text>
              </g>

              <!-- MANIFOLD -->

              <g class="sim2d-node" data-id="manifold"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="420" y="205" width="160" height="145" rx="13"/>

                <path d="M450 260 H550 M475 260 V235 M500 260 V235 M525 260 V235"
                  stroke="#50748c" stroke-width="7" fill="none"/>

                <circle cx="475" cy="235" r="7" fill="#d68c28"/>
                <circle cx="500" cy="235" r="7" fill="#d68c28"/>
                <circle cx="525" cy="235" r="7" fill="#d68c28"/>

                <text x="500" y="375" font-size="15"
                  font-weight="bold">MANIFOLD</text>
              </g>

              <!-- RISER -->

              <g class="sim2d-node" data-id="riser"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="610" y="205" width="160" height="145" rx="13"/>

                <path d="M680 320 V230 Q680 215 695 215 H720"
                  stroke="#50748c" stroke-width="9" fill="none"/>

                <path d="M660 330 Q680 318 700 330 T740 330"
                  stroke="#238bc9" stroke-width="3" fill="none"/>

                <text x="690" y="375" font-size="15"
                  font-weight="bold">RISER</text>
              </g>

              <!-- SEPARADOR -->

              <g class="sim2d-node" data-id="separador"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="810" y="195" width="200" height="165" rx="13"/>

                <rect x="835" y="235" width="150" height="70"
                  rx="34" fill="#e6edf3"
                  stroke="#50748c" stroke-width="4"/>

                <path d="M840 270 H980"
                  stroke="#238bc9" stroke-width="4"/>

                <path d="M840 280 Q860 267 880 280 T920 280 T960 280"
                  stroke="#238bc9" stroke-width="3" fill="none"/>

                <circle cx="870" cy="250" r="5" fill="#0c9c85"/>
                <circle cx="910" cy="245" r="7" fill="#0c9c85"/>
                <circle cx="945" cy="255" r="4" fill="#0c9c85"/>

                <text x="910" y="385" font-size="16"
                  font-weight="bold">SEPARADOR TRIFÁSICO</text>
              </g>

              <!-- TRATAMIENTO DE GAS -->

              <g class="sim2d-node" data-id="gas"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="1080" y="65" width="170" height="130" rx="13"/>

                <rect x="1140" y="85" width="50" height="80"
                  rx="17" fill="#e1f0ee"
                  stroke="#50748c" stroke-width="4"/>

                <path d="M1145 105 H1185 M1145 125 H1185 M1145 145 H1185"
                  stroke="#0c9c85" stroke-width="3"/>

                <text x="1165" y="220" font-size="15"
                  font-weight="bold">TRATAMIENTO DE GAS</text>
              </g>

              <!-- COMPRESOR -->

              <g class="sim2d-node" data-id="compresor"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="1320" y="65" width="190" height="130" rx="13"/>

                <circle cx="1415" cy="125" r="35"
                  fill="#e6edf3" stroke="#50748c" stroke-width="5"/>

                <path d="M1415 100 L1425 125 L1415 150 L1405 125 Z"
                  fill="#0c9c85"/>

                <text x="1415" y="220" font-size="15"
                  font-weight="bold">COMPRESOR</text>
              </g>

              <!-- ESTABILIZACION DE CONDENSADO -->

              <g class="sim2d-node" data-id="condensado"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="1080" y="310" width="190" height="130" rx="13"/>

                <rect x="1140" y="325" width="65" height="90"
                  rx="20" fill="#f8ebd7"
                  stroke="#50748c" stroke-width="4"/>

                <path d="M1145 350 H1200 M1145 375 H1200"
                  stroke="#d68c28" stroke-width="4"/>

                <text x="1175" y="465" font-size="15"
                  font-weight="bold">ESTABILIZACIÓN</text>
                <text x="1175" y="483" font-size="13"
                  text-anchor="middle" fill="#17374a">DE CONDENSADO</text>
              </g>

              <!-- TRATAMIENTO DE AGUA -->

              <g class="sim2d-node" data-id="agua"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="810" y="460" width="200" height="130" rx="13"/>

                <rect x="860" y="480" width="100" height="65"
                  rx="12" fill="#dceefa"
                  stroke="#50748c" stroke-width="4"/>

                <path d="M865 510 Q880 495 895 510 T925 510 T955 510"
                  stroke="#238bc9" stroke-width="4" fill="none"/>

                <text x="910" y="565" font-size="15"
                  font-weight="bold">TRATAMIENTO DE AGUA</text>
              </g>

              <!-- B3: CONTROL -->

              <g class="sim2d-node" data-id="control"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="180" y="590" width="190" height="110" rx="12"/>

                <rect x="240" y="610" width="70" height="45"
                  rx="5" fill="#e6edf3"
                  stroke="#50748c" stroke-width="3"/>

                <circle cx="260" cy="630" r="7" fill="#0c9c85"/>
                <circle cx="285" cy="630" r="7" fill="#d68c28"/>

                <text x="275" y="675" font-size="14"
                  font-weight="bold">CONTROL E</text>
                <text x="275" y="692" font-size="14">INSTRUMENTACIÓN</text>
              </g>

              <!-- ESD -->

              <g class="sim2d-node" data-id="esd"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="430" y="590" width="190" height="110" rx="12"/>

                <circle cx="525" cy="630" r="23"
                  fill="#fbe4e4" stroke="#c94c4c" stroke-width="4"/>

                <path d="M510 615 L540 645 M540 615 L510 645"
                  stroke="#c94c4c" stroke-width="5"/>

                <text x="525" y="675" font-size="14"
                  font-weight="bold">SISTEMA ESD</text>
                <text x="525" y="692" font-size="13">SEGURIDAD</text>
              </g>

              <!-- TEA -->

              <g class="sim2d-node" data-id="tea"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="680" y="590" width="190" height="110" rx="12"/>

                <path d="M765 615 L765 655 M750 655 H780"
                  stroke="#50748c" stroke-width="6" fill="none"/>

                <path d="M765 615 Q745 600 765 585 Q785 600 765 615"
                  fill="#e59b2d"/>

                <text x="775" y="675" font-size="14"
                  font-weight="bold">SISTEMA DE TEA</text>
              </g>

              <!-- SERVICIOS AUXILIARES -->

              <g class="sim2d-node" data-id="auxiliares"
                 tabindex="0" role="button">
                <rect class="sim2d-body"
                  x="930" y="590" width="190" height="110" rx="12"/>

                <circle cx="1025" cy="630" r="23"
                  fill="#e6edf3" stroke="#50748c" stroke-width="4"/>

                <circle cx="1025" cy="630" r="8"
                  fill="#0c9c85"/>

                <text x="1025" y="675" font-size="14"
                  font-weight="bold">SERVICIOS</text>
                <text x="1025" y="692" font-size="14">AUXILIARES</text>
              </g>

              <!-- ETIQUETAS DE SALIDA -->

              <text x="1530" y="105" font-size="14"
                fill="#0c9c85" text-anchor="end">GAS TRATADO</text>

              <text x="1310" y="425" font-size="14"
                fill="#d68c28">CONDENSADO</text>

              <text x="1015" y="535" font-size="14"
                fill="#238bc9">AGUA PRODUCIDA</text>

            </svg>

          </div>

          <div class="sim2d-legend">
            <span><i class="sim2d-dot" style="background:#d68c28"></i>Fluido de producción</span>
            <span><i class="sim2d-dot" style="background:#0c9c85"></i>Gas</span>
            <span><i class="sim2d-dot" style="background:#e59b2d"></i>Condensado</span>
            <span><i class="sim2d-dot" style="background:#238bc9"></i>Agua</span>
            <span>⋯ Conexiones de control y seguridad</span>
          </div>

          <div class="sim2d-info">
            <h3 id="sim2d-title">Selecciona un equipo del diagrama</h3>
            <p id="sim2d-description">
              Pulsa sobre cualquier equipo para conocer su función y sus componentes.
            </p>
            <p id="sim2d-meta">
              Sistemas B1 + B2 + B3
            </p>
          </div>

          <div class="sim2d-note">
            Esquema conceptual con fines académicos. Las rutas y conexiones
            deben contrastarse con los diagramas de proceso y tuberías e
            instrumentación (PFD y P&ID) del proyecto.
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(root);

    const $ = id => document.getElementById(id);

    const modal = $("sim2d-modal");
    const svg = $("sim2d-svg");
    const start = $("sim2d-start");
    const infoTitle = $("sim2d-title");
    const infoText = $("sim2d-description");
    const infoMeta = $("sim2d-meta");

    const equipos = {
      pozo: {
        nombre: "Pozo submarino",
        grupo: "B1 · Producción submarina",
        detalle: "Sistema de extracción del yacimiento.",
        descripcion: "Permite producir los fluidos del yacimiento y conducirlos hacia las instalaciones submarinas. Se deben revisar las condiciones de presión, temperatura, corrosión interna y externa e integridad del sistema de completación."
      },

      arbol: {
        nombre: "Árbol de Navidad submarino",
        grupo: "B1 · Producción submarina",
        detalle: "Control y aislamiento del pozo.",
        descripcion: "Conjunto de válvulas y conexiones que controla la producción, permite aislar el pozo y regular el flujo. Incluye válvulas maestras, laterales y conexiones."
      },

      manifold: {
        nombre: "Manifold submarino",
        grupo: "B1 · Producción submarina",
        detalle: "Distribución y recolección de fluidos.",
        descripcion: "Recibe y distribuye los fluidos provenientes de los pozos. Está formado por colectores, tuberías, válvulas, bridas y conexiones. Debe soportar las condiciones de presión, temperatura y servicio corrosivo."
      },

      riser: {
        nombre: "Riser o línea de subida",
        grupo: "B1 · Producción submarina",
        detalle: "Conexión entre el sistema submarino y la plataforma.",
        descripcion: "Transporta los fluidos desde el fondo marino hasta las instalaciones de superficie. Se deben evaluar presión interna, presión externa, fatiga, cargas mecánicas y corrosión."
      },

      separador: {
        nombre: "Separador trifásico",
        grupo: "B2 · Procesamiento",
        detalle: "Separación de gas, condensado y agua.",
        descripcion: "Separa las fases aprovechando sus diferencias de densidad y las condiciones de operación del recipiente. Sus elementos pueden incluir cuerpo, fondos, boquillas, internos, soportes y conexiones."
      },

      gas: {
        nombre: "Tratamiento de gas",
        grupo: "B2 · Procesamiento",
        detalle: "Acondicionamiento del gas producido.",
        descripcion: "Representa la etapa de tratamiento del gas para cumplir las condiciones de calidad requeridas. Según el diseño, puede incluir remoción de gases ácidos, deshidratación y otros procesos. Debe verificarse la tecnología real instalada."
      },

      compresor: {
        nombre: "Compresor de gas",
        grupo: "B2 · Procesamiento",
        detalle: "Aumento de presión del gas.",
        descripcion: "Eleva la presión del gas para su transporte o entrega. Se deben revisar carcasa, componentes internos, sellos, conexiones, vibraciones, temperatura y condiciones de operación."
      },

      condensado: {
        nombre: "Estabilización de condensado",
        grupo: "B2 · Procesamiento",
        detalle: "Acondicionamiento de la fase líquida de hidrocarburos.",
        descripcion: "Reduce los componentes más volátiles del condensado para cumplir las especificaciones de almacenamiento y transporte. Incluye recipientes, tuberías, válvulas y equipos auxiliares."
      },

      agua: {
        nombre: "Tratamiento de agua producida",
        grupo: "B2 · Procesamiento",
        detalle: "Acondicionamiento del agua separada.",
        descripcion: "Trata el agua producida para cumplir los requisitos de disposición, descarga o reinyección, según el diseño. Se deben evaluar corrosión, sólidos, hidrocarburos y compatibilidad de materiales."
      },

      control: {
        nombre: "Control e instrumentación",
        grupo: "B3 · Servicios y seguridad",
        detalle: "Supervisión y control de variables.",
        descripcion: "Incluye transmisores, sensores, analizadores, válvulas de control y sistemas de supervisión. Permite vigilar variables como presión, temperatura, caudal y composición."
      },

      esd: {
        nombre: "Sistema ESD de seguridad",
        grupo: "B3 · Servicios y seguridad",
        detalle: "Parada de emergencia.",
        descripcion: "Detecta condiciones peligrosas y ejecuta acciones de aislamiento o parada para proteger las instalaciones. Incluye sensores, lógica de control y válvulas de cierre de emergencia."
      },

      tea: {
        nombre: "Sistema de TEA",
        grupo: "B3 · Servicios y seguridad",
        detalle: "Manejo de gases de alivio.",
        descripcion: "Recibe gases provenientes de sistemas de alivio y los conduce hacia la tea para su disposición controlada mediante combustión, según el diseño. Puede incluir KO drum, cabezal de alivio, válvulas, chimenea y piloto."
      },

      auxiliares: {
        nombre: "Servicios auxiliares",
        grupo: "B3 · Servicios y seguridad",
        detalle: "Sistemas de apoyo a la instalación.",
        descripcion: "Agrupa servicios necesarios para la operación, como suministro eléctrico, aire de instrumentos, inyección química, drenajes y otros sistemas definidos en el proyecto."
      }
    };

    const nodos = [...svg.querySelectorAll(".sim2d-node")];

    function seleccionar(id) {
      const equipo = equipos[id];
      if (!equipo) return;

      infoTitle.textContent = equipo.nombre;
      infoText.textContent = equipo.descripcion;
      infoMeta.textContent =
        equipo.grupo + " · " + equipo.detalle;

      nodos.forEach(n => {
        n.classList.toggle("active", n.dataset.id === id);
      });
    }

    nodos.forEach(nodo => {
      nodo.addEventListener("click", () => {
        seleccionar(nodo.dataset.id);
      });

      nodo.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          seleccionar(nodo.dataset.id);
        }
      });
    });

    $("sim2d-open").addEventListener("click", () => {
      modal.hidden = false;
    });

    function cerrar() {
      detenerRecorrido();
      modal.hidden = true;
    }

    $("sim2d-close").addEventListener("click", cerrar);

    modal.addEventListener("click", e => {
      if (e.target === modal) cerrar();
    });

    const recorrido = [
      "pozo",
      "arbol",
      "manifold",
      "riser",
      "separador",
      "gas",
      "compresor",
      "condensado",
      "agua",
      "control",
      "esd",
      "tea",
      "auxiliares"
    ];

    let intervalo = null;
    let posicion = 0;

    function avanzarRecorrido() {
      seleccionar(recorrido[posicion]);
      posicion = (posicion + 1) % recorrido.length;
    }

    function detenerRecorrido() {
      if (intervalo !== null) {
        clearInterval(intervalo);
        intervalo = null;
      }

      svg.classList.remove("is-running");
      start.textContent = "Continuar recorrido";
    }

    start.addEventListener("click", () => {
      if (intervalo !== null) {
        detenerRecorrido();
        return;
      }

      svg.classList.add("is-running");
      start.textContent = "Pausar recorrido";

      avanzarRecorrido();
      intervalo = setInterval(avanzarRecorrido, 1700);
    });

    $("sim2d-reset").addEventListener("click", () => {
      detenerRecorrido();
      posicion = 0;
      svg.classList.remove("is-running");
      start.textContent = "Iniciar recorrido";

      nodos.forEach(n => n.classList.remove("active"));

      infoTitle.textContent = "Selecciona un equipo del diagrama";
      infoText.textContent =
        "Pulsa sobre cualquier equipo para conocer su función y sus componentes.";
      infoMeta.textContent = "Sistemas B1 + B2 + B3";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarSimulacion2D,
      { once: true }
    );
  } else {
    iniciarSimulacion2D();
  }

})();
