/**
 * core/Parser.js
 * Analizador Sintáctico Descendente Recursivo / Autómata de Pila
 * Cumple con la Gramática Libre de Contexto (GLC) formal extendida para PSeInt.
 */

const { TokenType } = require('./Lexer');

class Parser {
  constructor(tokens, sourceCode = '') {
    this.tokens = tokens;
    this.sourceCode = sourceCode;
    this.current = 0;
  }

  peek(offset = 0) {
    const idx = this.current + offset;
    if (idx >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // Return EOF
    }
    return this.tokens[idx];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  advance() {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type, message, suggestion = '') {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    const errText = `[Error Sintáctico] en Fila ${token.line}, Columna ${token.col}: ${message}. Se encontró '${token.value || token.type}'.`
      + (suggestion ? `\nSugerencia: ${suggestion}` : '');
    const err = new Error(errText);
    err.line = token.line;
    err.col = token.col;
    throw err;
  }

  // Entrada principal: Programa ::= (Algoritmo|Proceso)? (Sentencia)* (FinAlgoritmo|FinProceso)? EOF
  parse() {
    const sentencias = [];
    let programName = 'AlgoritmoSinTitulo';

    // Verificar si inicia con Algoritmo o Proceso
    if (this.match(TokenType.ALGORITMO_KW, TokenType.PROCESO_KW)) {
      if (this.check(TokenType.IDENTIFICADOR)) {
        programName = this.advance().value;
      }
      this.match(TokenType.PUNTO_Y_COMA);
    }

    while (!this.isAtEnd()) {
      // Ignorar delimitadores residuales
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;

      // Verificar cierre de programa
      if (this.check(TokenType.FINALGORITMO_KW) || this.check(TokenType.FINPROCESO_KW)) {
        this.advance();
        this.match(TokenType.PUNTO_Y_COMA);
        break;
      }

      sentencias.push(this.sentencia());
    }

    return {
      type: 'Programa',
      nombre: programName,
      cuerpo: sentencias
    };
  }

  // Sentencia principal
  sentencia() {
    // 1. Declaración estilo especificación: entero a = 10
    if (this.match(TokenType.ENTERO_KW, TokenType.REAL_KW, TokenType.TEXTO_KW, TokenType.LOGICO_KW)) {
      return this.declaracionEstiloDirecto();
    }

    // 2. Definición formal PSeInt: Definir a, b Como Entero
    if (this.match(TokenType.DEFINIR_KW)) {
      return this.definirPseint();
    }

    // 3. Entrada / Salida: Escribir, Imprimir, Mostrar
    if (this.match(TokenType.ESCRIBIR_KW, TokenType.IMPRIMIR_KW, TokenType.MOSTRAR_KW)) {
      return this.imprimir();
    }

    // 4. Lectura interactiva: Leer x, y
    if (this.match(TokenType.LEER_KW)) {
      return this.leer();
    }

    // 5. Condicional: Si ... Entonces ... Sino ... FinSi
    if (this.match(TokenType.SI_KW)) {
      return this.si();
    }

    // 6. Selección múltiple: Según ... Hacer ... FinSegún
    if (this.match(TokenType.SEGUN_KW)) {
      return this.segun();
    }

    // 7. Ciclo Mientras: Mientras ... Hacer ... FinMientras
    if (this.match(TokenType.MIENTRAS_KW)) {
      return this.mientras();
    }

    // 8. Ciclo Repetir: Repetir ... Hasta Que ...
    if (this.match(TokenType.REPETIR_KW)) {
      return this.repetir();
    }

    // 9. Ciclo Para: Para i <- 1 Hasta 10 Con Paso 1 Hacer ... FinPara
    if (this.match(TokenType.PARA_KW)) {
      return this.para();
    }

    // 10. Función o SubProceso
    if (this.match(TokenType.FUNCION_KW, TokenType.SUBPROCESO_KW)) {
      return this.funcion();
    }

    // 11. Retorno de función
    if (this.match(TokenType.RETORNAR_KW)) {
      const expr = this.expresion();
      this.match(TokenType.PUNTO_Y_COMA);
      return { type: 'Retorno', expresion: expr };
    }

    // 12. Asignación o llamada a función como sentencia
    if (this.check(TokenType.IDENTIFICADOR)) {
      return this.asignacionOInvocacion();
    }

    const token = this.peek();
    throw new Error(`[Error Sintáctico] en Fila ${token.line}, Columna ${token.col}: Instrucción o palabra no reconocida a partir de '${token.value || token.type}'.`);
  }

  // Declaración directa: entero a = 5
  declaracionEstiloDirecto() {
    const tipoToken = this.previous();
    const tipo = tipoToken.value ? tipoToken.value.toLowerCase() : 'entero';
    const idToken = this.consume(TokenType.IDENTIFICADOR, "Se esperaba el nombre de la variable tras el tipo", "ej. entero contador = 0");
    const nombre = idToken.value;

    let valorInicial = null;
    if (this.match(TokenType.ASIGNACION)) {
      valorInicial = this.expresion();
    }
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Declaracion',
      tipo: this.normalizarTipo(tipo),
      nombre,
      valorInicial,
      line: idToken.line,
      col: idToken.col
    };
  }

  // Definir formal PSeInt: Definir x, y, z Como Real;
  definirPseint() {
    const variables = [];
    do {
      const idToken = this.consume(TokenType.IDENTIFICADOR, "Se esperaba un nombre de variable en 'Definir'");
      variables.push({ nombre: idToken.value, line: idToken.line, col: idToken.col });
    } while (this.match(TokenType.COMA));

    this.consume(TokenType.COMO_KW, "Se esperaba la palabra reservada 'Como' tras los nombres de variable", "ej. Definir x, y Como Entero;");

    let tipo = 'entero';
    if (this.match(TokenType.ENTERO_KW, TokenType.REAL_KW, TokenType.TEXTO_KW, TokenType.LOGICO_KW)) {
      tipo = this.previous().value.toLowerCase();
    } else {
      const tok = this.peek();
      throw new Error(`[Error Sintáctico] en Fila ${tok.line}, Columna ${tok.col}: Tipo de dato no válido tras 'Como'. Use Entero, Real, Texto o Logico.`);
    }

    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'DefinirMultiple',
      variables,
      tipo: this.normalizarTipo(tipo)
    };
  }

  normalizarTipo(t) {
    const s = t.toLowerCase();
    if (s.startsWith('entero')) return 'entero';
    if (s.startsWith('real') || s.startsWith('num')) return 'real';
    if (s.startsWith('text') || s.startsWith('caden') || s.startsWith('caract')) return 'texto';
    if (s.startsWith('logic') || s.startsWith('bool')) return 'logico';
    return 'real';
  }

  // Escribir / Imprimir / Mostrar
  imprimir() {
    const expresiones = [];
    do {
      expresiones.push(this.expresion());
    } while (this.match(TokenType.COMA));

    this.match(TokenType.PUNTO_Y_COMA);
    return {
      type: 'Imprimir',
      expresiones
    };
  }

  // Leer variable [, variable2]
  leer() {
    const variables = [];
    do {
      const idToken = this.consume(TokenType.IDENTIFICADOR, "Se esperaba nombre de variable en 'Leer'");
      variables.push(idToken.value);
    } while (this.match(TokenType.COMA));

    this.match(TokenType.PUNTO_Y_COMA);
    return {
      type: 'Leer',
      variables
    };
  }

  // Asignación: id <- expr / id = expr / llamada
  asignacionOInvocacion() {
    const idToken = this.advance();
    const nombre = idToken.value;

    // Si tiene asignación '<-', '=', ':='
    if (this.match(TokenType.ASIGNACION)) {
      const valor = this.expresion();
      this.match(TokenType.PUNTO_Y_COMA);
      return {
        type: 'Asignacion',
        nombre,
        valor,
        line: idToken.line,
        col: idToken.col
      };
    }

    // Invocación a subproceso con paréntesis
    if (this.match(TokenType.PAREN_IZQ)) {
      const args = [];
      if (!this.check(TokenType.PAREN_DER)) {
        do {
          args.push(this.expresion());
        } while (this.match(TokenType.COMA));
      }
      this.consume(TokenType.PAREN_DER, "Se esperaba ')' tras los argumentos del procedimiento");
      this.match(TokenType.PUNTO_Y_COMA);
      return {
        type: 'LlamadaSentencia',
        nombre,
        argumentos: args,
        line: idToken.line,
        col: idToken.col
      };
    }

    const tok = this.peek();
    throw new Error(`[Error Sintáctico] en Fila ${tok.line}, Columna ${tok.col}: Se esperaba operador de asignación ('<-' o '=') tras '${nombre}'.`);
  }

  // Si <condicion> Entonces ... (Sino ...)? FinSi
  si() {
    const startToken = this.previous();
    const condicion = this.expresion();
    this.consume(TokenType.ENTONCES_KW, "Se esperaba 'Entonces' tras la condición de la instrucción 'Si'", "ej. Si x > 0 Entonces");
    this.match(TokenType.PUNTO_Y_COMA);

    const cuerpoEntonces = [];
    while (!this.isAtEnd() && !this.check(TokenType.SINO_KW) && !this.check(TokenType.FINSI_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;
      cuerpoEntonces.push(this.sentencia());
    }

    const cuerpoSino = [];
    if (this.match(TokenType.SINO_KW)) {
      this.match(TokenType.PUNTO_Y_COMA);
      while (!this.isAtEnd() && !this.check(TokenType.FINSI_KW)) {
        if (this.match(TokenType.PUNTO_Y_COMA)) continue;
        cuerpoSino.push(this.sentencia());
      }
    }

    this.consume(TokenType.FINSI_KW, `Se esperaba 'FinSi' para cerrar el bloque 'Si' iniciado en Fila ${startToken.line}`);
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Si',
      condicion,
      cuerpoEntonces,
      cuerpoSino
    };
  }

  // Segun <expr> Hacer Caso ... FinSegun
  segun() {
    const startToken = this.previous();
    const expresion = this.expresion();
    this.consume(TokenType.HACER_KW, "Se esperaba 'Hacer' tras la expresión de 'Según'");
    this.match(TokenType.PUNTO_Y_COMA);

    const casos = [];
    let cuerpoDeOtroModo = null;

    while (!this.isAtEnd() && !this.check(TokenType.FINSEGUN_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;

      if (this.match(TokenType.CASO_KW)) {
        const valores = [];
        do {
          valores.push(this.expresion());
        } while (this.match(TokenType.COMA));

        this.consume(TokenType.DOS_PUNTOS, "Se esperaba ':' tras los valores del caso");
        this.match(TokenType.PUNTO_Y_COMA);

        const cuerpoCaso = [];
        while (!this.isAtEnd() && !this.check(TokenType.CASO_KW) && !this.check(TokenType.DE_OTRO_MODO_KW) && !this.check(TokenType.FINSEGUN_KW)) {
          if (this.match(TokenType.PUNTO_Y_COMA)) continue;
          cuerpoCaso.push(this.sentencia());
        }
        casos.push({ valores, cuerpo: cuerpoCaso });
        continue;
      }

      if (this.match(TokenType.DE_OTRO_MODO_KW)) {
        this.consume(TokenType.DOS_PUNTOS, "Se esperaba ':' tras 'De Otro Modo'");
        this.match(TokenType.PUNTO_Y_COMA);

        cuerpoDeOtroModo = [];
        while (!this.isAtEnd() && !this.check(TokenType.FINSEGUN_KW)) {
          if (this.match(TokenType.PUNTO_Y_COMA)) continue;
          cuerpoDeOtroModo.push(this.sentencia());
        }
        break;
      }

      const tok = this.peek();
      throw new Error(`[Error Sintáctico] en Fila ${tok.line}, Columna ${tok.col}: En la estructura Según se esperaba 'Caso' o 'De Otro Modo'.`);
    }

    this.consume(TokenType.FINSEGUN_KW, `Se esperaba 'FinSegun' para cerrar el bloque 'Segun' iniciado en Fila ${startToken.line}`);
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Segun',
      expresion,
      casos,
      cuerpoDeOtroModo
    };
  }

  // Mientras <condicion> Hacer ... FinMientras
  mientras() {
    const startToken = this.previous();
    const condicion = this.expresion();
    this.consume(TokenType.HACER_KW, "Se esperaba 'Hacer' tras la condición de 'Mientras'");
    this.match(TokenType.PUNTO_Y_COMA);

    const cuerpo = [];
    while (!this.isAtEnd() && !this.check(TokenType.FINMIENTRAS_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;
      cuerpo.push(this.sentencia());
    }

    this.consume(TokenType.FINMIENTRAS_KW, `Se esperaba 'FinMientras' para cerrar el bucle iniciado en Fila ${startToken.line}`);
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Mientras',
      condicion,
      cuerpo
    };
  }

  // Repetir ... Hasta Que <condicion>
  repetir() {
    const startToken = this.previous();
    this.match(TokenType.PUNTO_Y_COMA);

    const cuerpo = [];
    while (!this.isAtEnd() && !this.check(TokenType.HASTA_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;
      cuerpo.push(this.sentencia());
    }

    this.consume(TokenType.HASTA_KW, `Se esperaba 'Hasta Que' para finalizar el bloque 'Repetir' iniciado en Fila ${startToken.line}`);
    this.match(TokenType.QUE_KW); // 'Que' es opcional en PSeInt pero común

    const condicion = this.expresion();
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Repetir',
      cuerpo,
      condicion
    };
  }

  // Para <var> <- <inicio> Hasta <fin> (Con Paso <paso>)? Hacer ... FinPara
  para() {
    const startToken = this.previous();
    const variable = this.consume(TokenType.IDENTIFICADOR, "Se esperaba la variable de control del ciclo 'Para'").value;
    this.consume(TokenType.ASIGNACION, "Se esperaba '<-' o '=' para inicializar la variable del ciclo 'Para'");
    const inicio = this.expresion();

    this.consume(TokenType.HASTA_KW, "Se esperaba 'Hasta' en la estructura del ciclo 'Para'");
    const fin = this.expresion();

    let paso = { type: 'Literal', valor: 1 };
    if (this.match(TokenType.CON_KW)) {
      this.consume(TokenType.PASO_KW, "Se esperaba 'Paso' tras 'Con' en el ciclo 'Para'");
      paso = this.expresion();
    }

    this.consume(TokenType.HACER_KW, "Se esperaba 'Hacer' antes de las instrucciones del ciclo 'Para'");
    this.match(TokenType.PUNTO_Y_COMA);

    const cuerpo = [];
    while (!this.isAtEnd() && !this.check(TokenType.FINPARA_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;
      cuerpo.push(this.sentencia());
    }

    this.consume(TokenType.FINPARA_KW, `Se esperaba 'FinPara' para cerrar el ciclo iniciado en Fila ${startToken.line}`);
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Para',
      variable,
      inicio,
      fin,
      paso,
      cuerpo
    };
  }

  // Función / SubProceso: Funcion [res <-] nombre(params) ... FinFuncion
  funcion() {
    const startToken = this.previous();
    let variableRetorno = null;
    let nombre = null;

    const primerId = this.consume(TokenType.IDENTIFICADOR, "Se esperaba el nombre de la función o variable de retorno");

    if (this.match(TokenType.ASIGNACION)) {
      variableRetorno = primerId.value;
      nombre = this.consume(TokenType.IDENTIFICADOR, "Se esperaba el nombre de la función tras '<-'").value;
    } else {
      nombre = primerId.value;
    }

    const parametros = [];
    if (this.match(TokenType.PAREN_IZQ)) {
      if (!this.check(TokenType.PAREN_DER)) {
        do {
          const paramTok = this.consume(TokenType.IDENTIFICADOR, "Se esperaba nombre de parámetro");
          parametros.push(paramTok.value);
        } while (this.match(TokenType.COMA));
      }
      this.consume(TokenType.PAREN_DER, "Se esperaba ')' tras la lista de parámetros");
    }
    this.match(TokenType.PUNTO_Y_COMA);

    const cuerpo = [];
    while (!this.isAtEnd() && !this.check(TokenType.FINFUNCION_KW) && !this.check(TokenType.FINSUBPROCESO_KW)) {
      if (this.match(TokenType.PUNTO_Y_COMA)) continue;
      cuerpo.push(this.sentencia());
    }

    if (this.check(TokenType.FINFUNCION_KW)) this.advance();
    else if (this.check(TokenType.FINSUBPROCESO_KW)) this.advance();
    else {
      throw new Error(`[Error Sintáctico] Se esperaba 'FinFuncion' o 'FinSubProceso' para cerrar '${nombre}' iniciado en Fila ${startToken.line}`);
    }
    this.match(TokenType.PUNTO_Y_COMA);

    return {
      type: 'Funcion',
      nombre,
      variableRetorno,
      parametros,
      cuerpo
    };
  }

  // ========================================================
  // JERARQUÍA FORMAL DE EXPRESIONES (GLC sin ambigüedad)
  // ========================================================

  // Nivel 6: Disyunción Lógica (O, |)
  expresion() {
    let expr = this.expresionY();

    while (this.match(TokenType.O_LOGICO)) {
      const operador = 'o';
      const derecha = this.expresionY();
      expr = { type: 'OperacionLogica', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 5: Conjunción Lógica (Y, &)
  expresionY() {
    let expr = this.expresionRelacional();

    while (this.match(TokenType.Y_LOGICO)) {
      const operador = 'y';
      const derecha = this.expresionRelacional();
      expr = { type: 'OperacionLogica', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 4: Comparación Relacional (==, =, !=, <>, <, <=, >, >=)
  expresionRelacional() {
    let expr = this.expresionSuma();

    while (this.match(
      TokenType.IGUAL_QUE,
      TokenType.DISTINTO_QUE,
      TokenType.MENOR_QUE,
      TokenType.MENOR_IGUAL,
      TokenType.MAYOR_QUE,
      TokenType.MAYOR_IGUAL,
      TokenType.ASIGNACION // En contexto de expresión, '=' actúa como comparador relacional igual
    )) {
      const opToken = this.previous();
      let operador = opToken.value;
      if (operador === '=') operador = '==';
      if (operador === '<>') operador = '!=';

      const derecha = this.expresionSuma();
      expr = { type: 'OperacionRelacional', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 3: Suma y Resta (Asociatividad izquierda)
  expresionSuma() {
    let expr = this.terminoMult();

    while (this.match(TokenType.MAS, TokenType.MENOS)) {
      const operador = this.previous().value;
      const derecha = this.terminoMult();
      expr = { type: 'OperacionBinaria', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 2: Multiplicación, División y Módulo (Asociatividad izquierda)
  terminoMult() {
    let expr = this.potencia();

    while (this.match(TokenType.POR, TokenType.DIV, TokenType.MOD, TokenType.MOD_KW)) {
      const opToken = this.previous();
      let operador = opToken.value;
      if (opToken.type === TokenType.MOD_KW) operador = '%';
      const derecha = this.potencia();
      expr = { type: 'OperacionBinaria', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 1: Potenciación (Asociatividad a la derecha)
  potencia() {
    let expr = this.unario();

    if (this.match(TokenType.POT)) {
      const operador = '^';
      const derecha = this.potencia(); // Recursión a la derecha para evaluar derecha antes
      expr = { type: 'OperacionBinaria', operador, izquierda: expr, derecha };
    }
    return expr;
  }

  // Nivel 0: Unarios (+, -, NO, ~, !)
  unario() {
    if (this.match(TokenType.MENOS)) {
      return { type: 'OperacionUnaria', operador: '-', expresion: this.unario() };
    }
    if (this.match(TokenType.MAS)) {
      return this.unario();
    }
    if (this.match(TokenType.NO_LOGICO)) {
      return { type: 'OperacionUnaria', operador: 'no', expresion: this.unario() };
    }
    return this.primario();
  }

  // Primarios: Literales, Constantes, Variables, Llamadas a Funciones y Agrupación
  primario() {
    // Número
    if (this.match(TokenType.NUMERO)) {
      const tok = this.previous();
      return { type: 'Literal', valor: tok.value, isFloat: tok.isFloat };
    }

    // Cadena
    if (this.match(TokenType.CADENA)) {
      return { type: 'Literal', valor: this.previous().value };
    }

    // Booleanos
    if (this.match(TokenType.VERDADERO_KW)) {
      return { type: 'Literal', valor: true };
    }
    if (this.match(TokenType.FALSO_KW)) {
      return { type: 'Literal', valor: false };
    }

    // Constante PI
    if (this.match(TokenType.PI_KW)) {
      return { type: 'Literal', valor: Math.PI };
    }

    // Agrupación con paréntesis
    if (this.match(TokenType.PAREN_IZQ)) {
      const expr = this.expresion();
      this.consume(TokenType.PAREN_DER, "Se esperaba ')' tras la expresión agrupada");
      return expr;
    }

    // Identificador o Llamada a Función
    if (this.match(TokenType.IDENTIFICADOR)) {
      const idToken = this.previous();
      const nombre = idToken.value;

      // Si le sigue '(', es una llamada a función matemática o personalizada
      if (this.match(TokenType.PAREN_IZQ)) {
        const args = [];
        if (!this.check(TokenType.PAREN_DER)) {
          do {
            args.push(this.expresion());
          } while (this.match(TokenType.COMA));
        }
        this.consume(TokenType.PAREN_DER, `Se esperaba ')' tras los argumentos de la función '${nombre}'`);
        return {
          type: 'LlamadaFuncion',
          nombre,
          argumentos: args,
          line: idToken.line,
          col: idToken.col
        };
      }

      return {
        type: 'Variable',
        nombre,
        line: idToken.line,
        col: idToken.col
      };
    }

    const token = this.peek();
    throw new Error(`[Error Sintáctico] en Fila ${token.line}, Columna ${token.col}: Expresión inválida o símbolo inesperado '${token.value || token.type}'.`);
  }
}

module.exports = { Parser };
