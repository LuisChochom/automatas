/**
 * core/Interpreter.js
 * Motor de Evaluación Semántica y Ejecución en Aislamiento
 * Incluye verificación de tipos estricta, biblioteca estándar matemática,
 * prevención de bucles infinitos y generación de la Tabla de Símbolos.
 */

class Interpreter {
  constructor(opciones = {}) {
    this.variables = new Map();
    this.tipos = new Map();
    this.funciones = new Map();
    this.salida = [];
    this.entradas = opciones.entradas || [];
    this.entradaIdx = 0;
    this.maxPasos = opciones.maxPasos || 100000;
    this.pasosEjecutados = 0;
    this.pilaLlamadas = 0;
    this.maxPila = 150;
  }

  ejecutar(ast) {
    const inicio = Date.now();
    this.pasosEjecutados = 0;

    // Primer pase: Registrar funciones y subprocesos
    if (ast && ast.cuerpo) {
      for (const nodo of ast.cuerpo) {
        if (nodo.type === 'Funcion') {
          const fnNombre = nodo.nombre.toLowerCase();
          this.funciones.set(fnNombre, nodo);
        }
      }

      // Segundo pase: Ejecutar sentencias secuenciales
      for (const nodo of ast.cuerpo) {
        if (nodo.type !== 'Funcion') {
          this.visitar(nodo);
        }
      }
    }

    const fin = Date.now();

    // Generar volcado estructurado de la tabla de símbolos para la interfaz
    const tablaSimbolos = [];
    for (const [nombre, valor] of this.variables.entries()) {
      const tipo = this.tipos.get(nombre) || typeof valor;
      let valorFormateado = valor;
      if (typeof valor === 'boolean') {
        valorFormateado = valor ? 'VERDADERO' : 'FALSO';
      }
      tablaSimbolos.push({
        variable: nombre,
        tipo: tipo.toUpperCase(),
        valor: valorFormateado
      });
    }

    return {
      salida: this.salida,
      tablaSimbolos,
      pasos: this.pasosEjecutados,
      duracionMs: fin - inicio
    };
  }

  verificarPaso() {
    this.pasosEjecutados++;
    if (this.pasosEjecutados > this.maxPasos) {
      throw new Error(`[Error de Ejecución] Límite de seguridad excedido (${this.maxPasos} pasos). Posible bucle infinito detectado.`);
    }
  }

  visitar(nodo, entornoLocal = null) {
    this.verificarPaso();

    switch (nodo.type) {
      case 'Declaracion':
        return this.visitarDeclaracion(nodo, entornoLocal);
      case 'DefinirMultiple':
        return this.visitarDefinirMultiple(nodo, entornoLocal);
      case 'Asignacion':
        return this.visitarAsignacion(nodo, entornoLocal);
      case 'Imprimir':
        return this.visitarImprimir(nodo, entornoLocal);
      case 'Leer':
        return this.visitarLeer(nodo, entornoLocal);
      case 'Si':
        return this.visitarSi(nodo, entornoLocal);
      case 'Segun':
        return this.visitarSegun(nodo, entornoLocal);
      case 'Mientras':
        return this.visitarMientras(nodo, entornoLocal);
      case 'Repetir':
        return this.visitarRepetir(nodo, entornoLocal);
      case 'Para':
        return this.visitarPara(nodo, entornoLocal);
      case 'LlamadaSentencia':
        return this.evaluarLlamadaFuncion(nodo, entornoLocal);
      case 'Retorno':
        return { esRetorno: true, valor: this.evaluarExpresion(nodo.expresion, entornoLocal) };
      default:
        throw new Error(`[Error de Ejecución] Nodo de árbol sintáctico no implementado: '${nodo.type}'.`);
    }
  }

  visitarDeclaracion(nodo, entornoLocal) {
    const mapaVars = entornoLocal || this.variables;
    const mapaTipos = entornoLocal ? entornoLocal.tipos : this.tipos;

    if (mapaVars.has(nodo.nombre)) {
      throw new Error(`[Error Semántico] en Fila ${nodo.line || '?'}: La variable '${nodo.nombre}' ya fue declarada previamente en este ámbito.`);
    }

    let valorInicial = null;
    if (nodo.valorInicial !== null) {
      valorInicial = this.evaluarExpresion(nodo.valorInicial, entornoLocal);
      this.validarTipo(nodo.tipo, valorInicial, nodo.nombre, nodo.line);
    } else {
      // Valores por defecto formales
      if (nodo.tipo === 'entero' || nodo.tipo === 'real') valorInicial = 0;
      else if (nodo.tipo === 'texto') valorInicial = '';
      else if (nodo.tipo === 'logico') valorInicial = false;
    }

    mapaTipos.set(nodo.nombre, nodo.tipo);
    mapaVars.set(nodo.nombre, valorInicial);
  }

  visitarDefinirMultiple(nodo, entornoLocal) {
    const mapaVars = entornoLocal || this.variables;
    const mapaTipos = entornoLocal ? entornoLocal.tipos : this.tipos;

    for (const v of nodo.variables) {
      if (mapaVars.has(v.nombre)) {
        throw new Error(`[Error Semántico] en Fila ${v.line}: La variable '${v.nombre}' ya fue definida previamente.`);
      }

      let valorDefecto = 0;
      if (nodo.tipo === 'texto') valorDefecto = '';
      if (nodo.tipo === 'logico') valorDefecto = false;

      mapaTipos.set(v.nombre, nodo.tipo);
      mapaVars.set(v.nombre, valorDefecto);
    }
  }

  visitarAsignacion(nodo, entornoLocal) {
    const valor = this.evaluarExpresion(nodo.valor, entornoLocal);
    const mapaVars = entornoLocal && entornoLocal.has(nodo.nombre) ? entornoLocal : this.variables;
    const mapaTipos = entornoLocal && entornoLocal.tipos && entornoLocal.tipos.has(nodo.nombre)
      ? entornoLocal.tipos
      : this.tipos;

    if (!mapaVars.has(nodo.nombre)) {
      // Si no existe, se auto-declara en modo permisivo PSeInt o se registra su tipo
      let tipoInferido = 'real';
      if (typeof valor === 'string') tipoInferido = 'texto';
      else if (typeof valor === 'boolean') tipoInferido = 'logico';
      else if (Number.isInteger(valor)) tipoInferido = 'entero';

      mapaTipos.set(nodo.nombre, tipoInferido);
      mapaVars.set(nodo.nombre, valor);
      return;
    }

    const tipoEsperado = mapaTipos.get(nodo.nombre);
    if (tipoEsperado) {
      this.validarTipo(tipoEsperado, valor, nodo.nombre, nodo.line);
    }

    mapaVars.set(nodo.nombre, valor);
  }

  visitarImprimir(nodo, entornoLocal) {
    const salidas = [];
    for (const expr of nodo.expresiones) {
      const res = this.evaluarExpresion(expr, entornoLocal);
      if (typeof res === 'boolean') {
        salidas.push(res ? 'VERDADERO' : 'FALSO');
      } else {
        salidas.push(String(res));
      }
    }
    this.salida.push(salidas.join(' '));
  }

  visitarLeer(nodo, entornoLocal) {
    const mapaVars = entornoLocal || this.variables;
    const mapaTipos = entornoLocal ? entornoLocal.tipos : this.tipos;

    for (const varName of nodo.variables) {
      let valorLeido;
      if (this.entradaIdx < this.entradas.length) {
        valorLeido = this.entradas[this.entradaIdx++];
      } else {
        // Valor predeterminado educativo si no se ingresaron más datos
        valorLeido = 0;
      }

      // Convertir según tipo definido
      const tipo = mapaTipos.get(varName) || 'texto';
      if (tipo === 'entero') {
        const num = parseInt(valorLeido, 10);
        mapaVars.set(varName, isNaN(num) ? 0 : num);
      } else if (tipo === 'real') {
        const num = parseFloat(valorLeido);
        mapaVars.set(varName, isNaN(num) ? 0.0 : num);
      } else if (tipo === 'logico') {
        const str = String(valorLeido).toLowerCase().trim();
        mapaVars.set(varName, str === 'verdadero' || str === 'true' || str === '1');
      } else {
        mapaVars.set(varName, String(valorLeido));
      }
    }
  }

  visitarSi(nodo, entornoLocal) {
    const cond = this.evaluarExpresion(nodo.condicion, entornoLocal);
    if (typeof cond !== 'boolean') {
      throw new Error(`[Error Semántico] La condición del bloque 'Si' debe ser un valor lógico (VERDADERO o FALSO), pero se obtuvo '${typeof cond}'.`);
    }

    if (cond === true) {
      for (const sent of nodo.cuerpoEntonces) {
        const res = this.visitar(sent, entornoLocal);
        if (res && res.esRetorno) return res;
      }
    } else {
      for (const sent of nodo.cuerpoSino) {
        const res = this.visitar(sent, entornoLocal);
        if (res && res.esRetorno) return res;
      }
    }
  }

  visitarSegun(nodo, entornoLocal) {
    const valEval = this.evaluarExpresion(nodo.expresion, entornoLocal);
    let casoEncontrado = false;

    for (const caso of nodo.casos) {
      let coincide = false;
      for (const exprValor of caso.valores) {
        const valorCaso = this.evaluarExpresion(exprValor, entornoLocal);
        if (valorCaso === valEval) {
          coincide = true;
          break;
        }
      }

      if (coincide) {
        casoEncontrado = true;
        for (const sent of caso.cuerpo) {
          const res = this.visitar(sent, entornoLocal);
          if (res && res.esRetorno) return res;
        }
        break; // Romper según en PSeInt por defecto
      }
    }

    if (!casoEncontrado && nodo.cuerpoDeOtroModo) {
      for (const sent of nodo.cuerpoDeOtroModo) {
        const res = this.visitar(sent, entornoLocal);
        if (res && res.esRetorno) return res;
      }
    }
  }

  visitarMientras(nodo, entornoLocal) {
    while (true) {
      const cond = this.evaluarExpresion(nodo.condicion, entornoLocal);
      if (typeof cond !== 'boolean') {
        throw new Error(`[Error Semántico] La condición del ciclo 'Mientras' debe ser un valor lógico (VERDADERO o FALSO).`);
      }
      if (!cond) break;

      for (const sent of nodo.cuerpo) {
        const res = this.visitar(sent, entornoLocal);
        if (res && res.esRetorno) return res;
      }
    }
  }

  visitarRepetir(nodo, entornoLocal) {
    do {
      for (const sent of nodo.cuerpo) {
        const res = this.visitar(sent, entornoLocal);
        if (res && res.esRetorno) return res;
      }
      const cond = this.evaluarExpresion(nodo.condicion, entornoLocal);
      if (typeof cond !== 'boolean') {
        throw new Error(`[Error Semántico] La condición del ciclo 'Repetir ... Hasta Que' debe ser un valor lógico.`);
      }
      if (cond === true) break;
    } while (true);
  }

  visitarPara(nodo, entornoLocal) {
    const inicio = this.evaluarExpresion(nodo.inicio, entornoLocal);
    const fin = this.evaluarExpresion(nodo.fin, entornoLocal);
    const paso = this.evaluarExpresion(nodo.paso, entornoLocal);

    if (typeof inicio !== 'number' || typeof fin !== 'number' || typeof paso !== 'number') {
      throw new Error(`[Error Semántico] Los límites y el paso del ciclo 'Para' deben ser valores numéricos.`);
    }

    if (paso === 0) {
      throw new Error(`[Error Semántico] El incremento (Con Paso) en el ciclo 'Para' no puede ser 0.`);
    }

    const mapaVars = entornoLocal || this.variables;
    mapaVars.set(nodo.variable, inicio);

    if (paso > 0) {
      for (let i = inicio; i <= fin; i += paso) {
        mapaVars.set(nodo.variable, i);
        for (const sent of nodo.cuerpo) {
          const res = this.visitar(sent, entornoLocal);
          if (res && res.esRetorno) return res;
        }
      }
    } else {
      for (let i = inicio; i >= fin; i += paso) {
        mapaVars.set(nodo.variable, i);
        for (const sent of nodo.cuerpo) {
          const res = this.visitar(sent, entornoLocal);
          if (res && res.esRetorno) return res;
        }
      }
    }
  }

  validarTipo(tipoEsperado, valor, nombreVar, linea = '') {
    const prefijo = linea ? `en Fila ${linea}: ` : '';
    if (tipoEsperado === 'entero') {
      if (typeof valor !== 'number' || !Number.isInteger(valor)) {
        throw new Error(`[Error de Tipo] ${prefijo}Asignación incompatible para '${nombreVar}'. Se esperaba entero pero se recibió: ${JSON.stringify(valor)}.`);
      }
    } else if (tipoEsperado === 'real') {
      if (typeof valor !== 'number' || isNaN(valor)) {
        throw new Error(`[Error de Tipo] ${prefijo}Asignación incompatible para '${nombreVar}'. Se esperaba número real pero se recibió: ${JSON.stringify(valor)}.`);
      }
    } else if (tipoEsperado === 'texto') {
      if (typeof valor !== 'string') {
        throw new Error(`[Error de Tipo] ${prefijo}Asignación incompatible para '${nombreVar}'. Se esperaba texto pero se recibió: ${JSON.stringify(valor)}.`);
      }
    } else if (tipoEsperado === 'logico') {
      if (typeof valor !== 'boolean') {
        throw new Error(`[Error de Tipo] ${prefijo}Asignación incompatible para '${nombreVar}'. Se esperaba valor lógico (VERDADERO o FALSO) pero se recibió: ${JSON.stringify(valor)}.`);
      }
    }
  }

  // ========================================================
  // EVALUADOR DE EXPRESIONES Y MATEMÁTICAS
  // ========================================================

  evaluarExpresion(nodo, entornoLocal = null) {
    if (!nodo) return null;

    switch (nodo.type) {
      case 'Literal':
        return nodo.valor;

      case 'Variable': {
        const nombre = nodo.nombre;
        if (entornoLocal && entornoLocal.has(nombre)) {
          return entornoLocal.get(nombre);
        }
        if (this.variables.has(nombre)) {
          return this.variables.get(nombre);
        }
        throw new Error(`[Error Semántico] en Fila ${nodo.line || '?'}: La variable '${nombre}' no está definida.`);
      }

      case 'OperacionUnaria': {
        const val = this.evaluarExpresion(nodo.expresion, entornoLocal);
        if (nodo.operador === '-') {
          if (typeof val !== 'number') {
            throw new Error(`[Error de Operación] El operador unario '-' requiere un operando numérico.`);
          }
          return -val;
        }
        if (nodo.operador === 'no') {
          if (typeof val !== 'boolean') {
            throw new Error(`[Error de Operación] El operador 'NO' requiere un operando lógico (booleano).`);
          }
          return !val;
        }
        return val;
      }

      case 'OperacionLogica': {
        const izq = this.evaluarExpresion(nodo.izquierda, entornoLocal);
        const der = this.evaluarExpresion(nodo.derecha, entornoLocal);
        if (typeof izq !== 'boolean' || typeof der !== 'boolean') {
          throw new Error(`[Error de Operación] El operador lógico '${nodo.operador}' solo es aplicable entre valores lógicos.`);
        }
        return nodo.operador === 'y' ? (izq && der) : (izq || der);
      }

      case 'OperacionRelacional': {
        const izq = this.evaluarExpresion(nodo.izquierda, entornoLocal);
        const der = this.evaluarExpresion(nodo.derecha, entornoLocal);

        switch (nodo.operador) {
          case '==': return izq === der;
          case '!=': return izq !== der;
          case '<': return izq < der;
          case '<=': return izq <= der;
          case '>': return izq > der;
          case '>=': return izq >= der;
          default:
            throw new Error(`[Error de Operación] Operador relacional desconocido: '${nodo.operador}'.`);
        }
      }

      case 'OperacionBinaria': {
        const izq = this.evaluarExpresion(nodo.izquierda, entornoLocal);
        const der = this.evaluarExpresion(nodo.derecha, entornoLocal);

        // Operador suma: permite concatenación si alguno es texto
        if (nodo.operador === '+') {
          if (typeof izq === 'string' || typeof der === 'string') {
            return String(izq) + String(der);
          }
          if (typeof izq === 'number' && typeof der === 'number') {
            return izq + der;
          }
          throw new Error(`[Error de Operación] Operador '+' no aplicable a los tipos '${typeof izq}' y '${typeof der}'.`);
        }

        if (typeof izq !== 'number' || typeof der !== 'number') {
          throw new Error(`[Error Aritmético] El operador '${nodo.operador}' requiere ambos operandos numéricos. Se encontró '${typeof izq}' y '${typeof der}'.`);
        }

        switch (nodo.operador) {
          case '-': return izq - der;
          case '*': return izq * der;
          case '/':
            if (der === 0) {
              throw new Error(`[Error Aritmético] División entre cero.`);
            }
            return izq / der;
          case '%':
            if (der === 0) {
              throw new Error(`[Error Aritmético] Módulo entre cero.`);
            }
            return izq % der;
          case '^':
            return Math.pow(izq, der);
          default:
            throw new Error(`[Error Aritmético] Operador aritmético no reconocido '${nodo.operador}'.`);
        }
      }

      case 'LlamadaFuncion':
        return this.evaluarLlamadaFuncion(nodo, entornoLocal);

      default:
        throw new Error(`[Error de Ejecución] Tipo de expresión no reconocido: '${nodo.type}'.`);
    }
  }

  // Evaluación de funciones nativas (Matemáticas y Cadenas) y funciones de usuario
  evaluarLlamadaFuncion(nodo, entornoLocal) {
    const fnName = nodo.nombre.toLowerCase();
    const args = nodo.argumentos.map(arg => this.evaluarExpresion(arg, entornoLocal));

    // Funciones Matemáticas Nativas de PSeInt
    if (fnName === 'rc' || fnName === 'raiz') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Raiz' requiere exactamente 1 argumento.`);
      if (typeof args[0] !== 'number') throw new Error(`[Error Función] El argumento de 'Raiz' debe ser numérico.`);
      if (args[0] < 0) throw new Error(`[Error Aritmético] No es posible calcular la raíz cuadrada de un número negativo (${args[0]}).`);
      return Math.sqrt(args[0]);
    }

    if (fnName === 'abs') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Abs' requiere 1 argumento.`);
      return Math.abs(args[0]);
    }

    if (fnName === 'redon' || fnName === 'redondear') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Redon' requiere 1 argumento.`);
      return Math.round(args[0]);
    }

    if (fnName === 'trunc' || fnName === 'truncar') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Trunc' requiere 1 argumento.`);
      return Math.trunc(args[0]);
    }

    if (fnName === 'sen') return Math.sin(args[0]);
    if (fnName === 'cos') return Math.cos(args[0]);
    if (fnName === 'tan') return Math.tan(args[0]);

    if (fnName === 'ln') {
      if (args[0] <= 0) throw new Error(`[Error Aritmético] 'Ln' no definido para valores menores o iguales a cero.`);
      return Math.log(args[0]);
    }

    if (fnName === 'exp') return Math.exp(args[0]);

    if (fnName === 'azar') {
      // azar(x) genera un entero entre 0 y x-1
      const max = Math.floor(args[0]);
      if (max <= 0) return 0;
      return Math.floor(Math.random() * max);
    }

    if (fnName === 'aleatorio') {
      // aleatorio(min, max)
      const min = Math.ceil(args[0] || 0);
      const max = Math.floor(args[1] || 100);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Funciones de Manipulación de Cadenas
    if (fnName === 'longitud') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Longitud' requiere 1 argumento.`);
      return String(args[0]).length;
    }

    if (fnName === 'mayusculas') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Mayusculas' requiere 1 argumento.`);
      return String(args[0]).toUpperCase();
    }

    if (fnName === 'minusculas') {
      if (args.length !== 1) throw new Error(`[Error Función] 'Minusculas' requiere 1 argumento.`);
      return String(args[0]).toLowerCase();
    }

    if (fnName === 'subcadena') {
      // PSeInt subcadena(cadena, desde, hasta) - Indexado desde 1 inclusivo
      const texto = String(args[0]);
      const desde = Math.max(1, parseInt(args[1], 10)) - 1;
      const hasta = parseInt(args[2], 10);
      return texto.substring(desde, hasta);
    }

    // Funciones definidas por el usuario
    if (this.funciones.has(fnName)) {
      this.pilaLlamadas++;
      if (this.pilaLlamadas > this.maxPila) {
        throw new Error(`[Error de Ejecución] Desbordamiento de pila en llamada a función '${nodo.nombre}'.`);
      }

      const defFuncion = this.funciones.get(fnName);
      if (defFuncion.parametros.length !== args.length) {
        throw new Error(`[Error Función] '${nodo.nombre}' esperaba ${defFuncion.parametros.length} argumentos pero recibió ${args.length}.`);
      }

      // Ámbito local
      const ambitoLocal = new Map();
      ambitoLocal.tipos = new Map();

      for (let i = 0; i < defFuncion.parametros.length; i++) {
        const pName = defFuncion.parametros[i];
        ambitoLocal.set(pName, args[i]);
      }

      if (defFuncion.variableRetorno) {
        ambitoLocal.set(defFuncion.variableRetorno, 0);
      }

      let resultadoFinal = null;
      for (const sent of defFuncion.cuerpo) {
        const r = this.visitar(sent, ambitoLocal);
        if (r && r.esRetorno) {
          resultadoFinal = r.valor;
          break;
        }
      }

      if (defFuncion.variableRetorno) {
        resultadoFinal = ambitoLocal.get(defFuncion.variableRetorno);
      }

      this.pilaLlamadas--;
      return resultadoFinal;
    }

    throw new Error(`[Error Semántico] en Fila ${nodo.line || '?'}: La función o procedimiento '${nodo.nombre}' no está definida.`);
  }
}

module.exports = { Interpreter };
