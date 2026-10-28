/**
 * public/js/cliente.js
 * Lógica del Entorno de Desarrollo Web Interactivo PSeInt Studio
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM principales
  const editor = document.getElementById('editor');
  const lineNumbers = document.getElementById('lineNumbers');
  const cursorPos = document.getElementById('cursorPos');
  const consola = document.getElementById('consola');
  const consoleMetrics = document.getElementById('consoleMetrics');

  // Botones y selectores
  const btnEjecutar = document.getElementById('btnEjecutar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnCopiarCodigo = document.getElementById('btnCopiarCodigo');
  const btnAyuda = document.getElementById('btnAyuda');
  const btnTema = document.getElementById('btnTema');
  const iconoTema = document.getElementById('iconoTema');
  const textoTema = document.getElementById('textoTema');
  const btnCerrarModal = document.getElementById('btnCerrarModal');
  const modalAyuda = document.getElementById('modalAyuda');

  const selectEjemplos = document.getElementById('selectEjemplos');
  const selectPlantilla = document.getElementById('selectPlantilla');
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');

  // Pestañas e inspectores
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tablaSimbolosBody = document.getElementById('tablaSimbolosBody');
  const tablaTokensBody = document.getElementById('tablaTokensBody');
  const astOutput = document.getElementById('astOutput');

  // Plantillas de código predefinidas
  const PLANTILLAS = {
    plantilla_si: `Si condicion Entonces\n    // Instrucciones si es verdadero\nSino\n    // Instrucciones si es falso\nFinSi\n`,
    plantilla_segun: `Segun variable Hacer\n    Caso 1:\n        // Caso 1\n    Caso 2:\n        // Caso 2\n    De Otro Modo:\n        // Caso por defecto\nFinSegun\n`,
    plantilla_mientras: `Mientras condicion Hacer\n    // Instrucciones repetitivas\n    contador <- contador + 1;\nFinMientras\n`,
    plantilla_para: `Para i <- 1 Hasta 10 Con Paso 1 Hacer\n    Escribir "Valor:", i;\nFinPara\n`,
    plantilla_repetir: `Repetir\n    // Se ejecuta al menos una vez\nHasta Que condicion;\n`,
    plantilla_definir: `Definir a, b Como Entero;\nDefinir total Como Real;\nDefinir nombre Como Texto;\nDefinir esValido Como Logico;\n`,
    plantilla_funcion: `Funcion res <- MiFuncion(param1, param2)\n    res <- param1 + param2;\nFinFuncion\n`
  };

  // ========================================================
  // SINCRONIZACIÓN DEL NÚMERO DE LÍNEAS DEL EDITOR
  // ========================================================
  function actualizarLineas() {
    const totalLineas = editor.value.split('\n').length;
    let numeros = '';
    for (let i = 1; i <= totalLineas; i++) {
      numeros += i + '\n';
    }
    lineNumbers.textContent = numeros;
  }

  function sincronizarScroll() {
    lineNumbers.scrollTop = editor.scrollTop;
  }

  function actualizarPosicionCursor() {
    const selStart = editor.selectionStart;
    const textoHastaCursor = editor.value.substring(0, selStart);
    const lineas = textoHastaCursor.split('\n');
    const lineaActual = lineas.length;
    const colActual = lineas[lineas.length - 1].length + 1;
    cursorPos.textContent = `Ln ${lineaActual}, Col ${colActual}`;
  }

  editor.addEventListener('input', () => {
    actualizarLineas();
    actualizarPosicionCursor();
  });

  editor.addEventListener('scroll', sincronizarScroll);
  editor.addEventListener('click', actualizarPosicionCursor);
  editor.addEventListener('keyup', actualizarPosicionCursor);

  // Manejo de tecla TAB en el editor
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const espacios = '    ';

      editor.value = editor.value.substring(0, start) + espacios + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
      actualizarLineas();
      actualizarPosicionCursor();
    }

    // Atajo F9 o Ctrl+Enter para ejecutar
    if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
      e.preventDefault();
      ejecutarCodigo();
    }

    // Atajo Ctrl+L para limpiar
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      limpiarConsola();
    }
  });

  // ========================================================
  // GESTIÓN DE PESTAÑAS DEL INSPECTOR
  // ========================================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      activarPestaña(targetId);
    });
  });

  function activarPestaña(tabId) {
    tabButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });
  }

  // ========================================================
  // ESTADO VISUAL DE COMPILACIÓN (STATUS PILL)
  // ========================================================
  function setEstado(tipo, texto) {
    statusPill.className = `status-pill status-${tipo}`;
    statusText.textContent = texto;
  }

  // ========================================================
  // LIMPIEZA DE CONSOLA E INSPECTORES
  // ========================================================
  function limpiarConsola() {
    consola.innerHTML = `
      <div class="console-welcome">
        <span class="prompt-symbol">▶</span>
        <span>Consola limpia. Presione <strong>Ejecutar (F9)</strong> para compilar.</span>
      </div>
    `;
    consoleMetrics.innerHTML = `<span>Tiempo: --</span><span>Instrucciones: --</span>`;
    tablaSimbolosBody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay variables registradas.</td></tr>`;
    tablaTokensBody.innerHTML = `<tr><td colspan="5" class="empty-state">No se ha generado el análisis léxico aún.</td></tr>`;
    astOutput.textContent = '// Árbol de Sintaxis Abstracta limpio.';
    setEstado('ready', 'Listo');
  }

  btnLimpiar.addEventListener('click', limpiarConsola);

  // Copiar código
  btnCopiarCodigo.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      const originalText = cursorPos.textContent;
      cursorPos.textContent = '¡Código copiado!';
      setTimeout(() => {
        cursorPos.textContent = originalText;
      }, 1800);
    } catch (err) {
      alert('No se pudo copiar el código al portapapeles.');
    }
  });

  // ========================================================
  // CARGA DE EJEMPLOS Y PLANTILLAS
  // ========================================================
  selectEjemplos.addEventListener('change', async () => {
    const key = selectEjemplos.value;
    if (!key) return;

    try {
      const resp = await fetch('/api/ejemplos');
      const data = await resp.json();
      if (data.exito && data.ejemplos && data.ejemplos[key]) {
        editor.value = data.ejemplos[key].codigo;
        actualizarLineas();
        actualizarPosicionCursor();
        setEstado('ready', `Ejemplo: ${data.ejemplos[key].titulo}`);
      }
    } catch (err) {
      console.error('Error al cargar ejemplo:', err);
    }
  });

  selectPlantilla.addEventListener('change', () => {
    const key = selectPlantilla.value;
    if (!key || !PLANTILLAS[key]) return;

    const textoPlantilla = PLANTILLAS[key];
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value = editor.value.substring(0, start) + textoPlantilla + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + textoPlantilla.length;
    actualizarLineas();
    actualizarPosicionCursor();
    editor.focus();
    selectPlantilla.selectedIndex = 0;
  });

  // ========================================================
  // MODAL DE AYUDA
  // ========================================================
  btnAyuda.addEventListener('click', () => {
    modalAyuda.classList.remove('hidden');
  });

  btnCerrarModal.addEventListener('click', () => {
    modalAyuda.classList.add('hidden');
  });

  modalAyuda.addEventListener('click', (e) => {
    if (e.target === modalAyuda) {
      modalAyuda.classList.add('hidden');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalAyuda.classList.contains('hidden')) {
      modalAyuda.classList.add('hidden');
    }
  });

  // ========================================================
  // EJECUCIÓN Y COMPILACIÓN (API)
  // ========================================================
  async function ejecutarCodigo() {
    const codigo = editor.value;

    if (!codigo.trim()) {
      consola.innerHTML = `
        <div class="console-line-error">
          <strong>[Aviso]</strong> El editor está vacío. Ingrese instrucciones antes de ejecutar.
        </div>
      `;
      activarPestaña('tabConsola');
      setEstado('error', 'Editor vacío');
      return;
    }

    setEstado('running', 'Compilando...');
    consola.innerHTML = `
      <div class="console-welcome">
        <span class="prompt-symbol">⏳</span>
        <span>Ejecutando autómata y evaluando pseudocódigo...</span>
      </div>
    `;

    try {
      const resp = await fetch('/api/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      });

      const datos = await resp.json();

      if (!resp.ok || !datos.exito) {
        // Formatear error con alta precisión
        let htmlError = `
          <div class="console-line-error">
            <strong>${datos.error || 'Error en tiempo de ejecución.'}</strong>
          </div>
        `;

        if (datos.fragmento) {
          htmlError += `<div class="console-code-snippet">${datos.fragmento}</div>`;
        }

        consola.innerHTML = htmlError;
        activarPestaña('tabConsola');

        const etiquetaError = datos.linea ? `Error en Fila ${datos.linea}` : 'Error detectado';
        setEstado('error', etiquetaError);
        return;
      }

      // Éxito: renderizar salida
      let htmlSalida = '';
      if (datos.salida.length === 0) {
        htmlSalida = `
          <div class="console-line-system">
            > El programa finalizó con éxito sin emitir salidas por pantalla.
          </div>
        `;
      } else {
        datos.salida.forEach(linea => {
          htmlSalida += `<div class="console-line-out">&gt; ${escapeHtml(linea)}</div>`;
        });
        htmlSalida += `
          <div class="console-line-system">
            --- Ejecución finalizada correctamente ---
          </div>
        `;
      }

      consola.innerHTML = htmlSalida;
      consoleMetrics.innerHTML = `
        <span>⏱️ Tiempo: ${datos.duracionMs} ms</span>
        <span>⚡ Pasos: ${datos.pasos}</span>
      `;

      // 1. Llenar Tabla de Símbolos
      renderizarTablaSimbolos(datos.tablaSimbolos);

      // 2. Llenar Tokens AFD
      renderizarTokensAfd(datos.tokens);

      // 3. Llenar Árbol AST
      astOutput.textContent = JSON.stringify(datos.ast, null, 2);

      setEstado('success', `Éxito (${datos.duracionMs}ms)`);

    } catch (err) {
      consola.innerHTML = `
        <div class="console-line-error">
          <strong>[Error de Conexión]</strong> No se pudo conectar con el servidor Node.js.
        </div>
      `;
      setEstado('error', 'Fallo de Red');
    }
  }

  btnEjecutar.addEventListener('click', ejecutarCodigo);

  // Renderizadores de inspectores
  function renderizarTablaSimbolos(simbolos) {
    if (!simbolos || simbolos.length === 0) {
      tablaSimbolosBody.innerHTML = `<tr><td colspan="3" class="empty-state">No se definieron variables durante la ejecución.</td></tr>`;
      return;
    }

    let rows = '';
    simbolos.forEach(s => {
      rows += `
        <tr>
          <td><strong>${escapeHtml(s.variable)}</strong></td>
          <td><span class="badge-type">${escapeHtml(s.tipo)}</span></td>
          <td>${escapeHtml(String(s.valor))}</td>
        </tr>
      `;
    });
    tablaSimbolosBody.innerHTML = rows;
  }

  function renderizarTokensAfd(tokens) {
    if (!tokens || tokens.length === 0) {
      tablaTokensBody.innerHTML = `<tr><td colspan="5" class="empty-state">No hay tokens disponibles.</td></tr>`;
      return;
    }

    let rows = '';
    tokens.forEach((t, i) => {
      rows += `
        <tr>
          <td>${i + 1}</td>
          <td><code>${escapeHtml(t.valor)}</code></td>
          <td><span class="badge-type">${escapeHtml(t.tipo)}</span></td>
          <td>${t.linea}</td>
          <td>${t.col}</td>
        </tr>
      `;
    });
    tablaTokensBody.innerHTML = rows;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========================================================
  // CONTROL DE TEMA (CLARO / OSCURO)
  // ========================================================
  function aplicarTema(tema) {
    if (tema === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (iconoTema) iconoTema.textContent = '🌙';
      if (textoTema) textoTema.textContent = 'Oscuro';
      localStorage.setItem('pseint_theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (iconoTema) iconoTema.textContent = '☀️';
      if (textoTema) textoTema.textContent = 'Claro';
      localStorage.setItem('pseint_theme', 'dark');
    }
  }

  const temaGuardado = localStorage.getItem('pseint_theme') || 'dark';
  aplicarTema(temaGuardado);

  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const temaActual = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      aplicarTema(temaActual === 'light' ? 'dark' : 'light');
    });
  }

  // Inicialización
  actualizarLineas();
  actualizarPosicionCursor();
});
