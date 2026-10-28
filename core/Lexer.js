/**
 * core/Lexer.js
 * Analizador Léxico basado en un Autómata Finito Determinista (AFD)
 * Soporta vocabulario extendido de PSeInt y la especificación técnica.
 */

const TokenType = {
  // Estructura de programa
  ALGORITMO_KW: 'ALGORITMO_KW',
  FINALGORITMO_KW: 'FINALGORITMO_KW',
  PROCESO_KW: 'PROCESO_KW',
  FINPROCESO_KW: 'FINPROCESO_KW',
  
  // Declaraciones y Tipos
  DEFINIR_KW: 'DEFINIR_KW',
  COMO_KW: 'COMO_KW',
  ENTERO_KW: 'ENTERO_KW',
  REAL_KW: 'REAL_KW',
  TEXTO_KW: 'TEXTO_KW',
  LOGICO_KW: 'LOGICO_KW',
  
  // Entrada / Salida
  IMPRIMIR_KW: 'IMPRIMIR_KW',
  ESCRIBIR_KW: 'ESCRIBIR_KW',
  MOSTRAR_KW: 'MOSTRAR_KW',
  LEER_KW: 'LEER_KW',
  
  // Condicionales
  SI_KW: 'SI_KW',
  ENTONCES_KW: 'ENTONCES_KW',
  SINO_KW: 'SINO_KW',
  FINSI_KW: 'FINSI_KW',
  
  // Selección múltiple (Según)
  SEGUN_KW: 'SEGUN_KW',
  CASO_KW: 'CASO_KW',
  DE_OTRO_MODO_KW: 'DE_OTRO_MODO_KW',
  FINSEGUN_KW: 'FINSEGUN_KW',
  
  // Bucles
  MIENTRAS_KW: 'MIENTRAS_KW',
  HACER_KW: 'HACER_KW',
  FINMIENTRAS_KW: 'FINMIENTRAS_KW',
  REPETIR_KW: 'REPETIR_KW',
  HASTA_KW: 'HASTA_KW',
  QUE_KW: 'QUE_KW',
  PARA_KW: 'PARA_KW',
  CON_KW: 'CON_KW',
  PASO_KW: 'PASO_KW',
  FINPARA_KW: 'FINPARA_KW',

  // Funciones / Subprocesos
  FUNCION_KW: 'FUNCION_KW',
  FINFUNCION_KW: 'FINFUNCION_KW',
  SUBPROCESO_KW: 'SUBPROCESO_KW',
  FINSUBPROCESO_KW: 'FINSUBPROCESO_KW',
  RETORNAR_KW: 'RETORNAR_KW',

  // Operadores lógicos en palabras clave
  Y_LOGICO: 'Y_LOGICO',
  O_LOGICO: 'O_LOGICO',
  NO_LOGICO: 'NO_LOGICO',
  MOD_KW: 'MOD_KW',

  // Literales y constantes
  VERDADERO_KW: 'VERDADERO_KW',
  FALSO_KW: 'FALSO_KW',
  PI_KW: 'PI_KW',

  // Tokens léxicos base
  IDENTIFICADOR: 'IDENTIFICADOR',
  NUMERO: 'NUMERO',
  CADENA: 'CADENA',

  // Asignación
  ASIGNACION: '<-', // Soporta '<-', ':=', '='
  
  // Operadores aritméticos
  MAS: '+',
  MENOS: '-',
  POR: '*',
  DIV: '/',
  MOD: '%',
  POT: '^',

  // Operadores relacionales
  IGUAL_QUE: '==',
  DISTINTO_QUE: '!=',
  MENOR_QUE: '<',
  MENOR_IGUAL: '<=',
  MAYOR_QUE: '>',
  MAYOR_IGUAL: '>=',

  // Delimitadores
  PAREN_IZQ: '(',
  PAREN_DER: ')',
  CORCHETE_IZQ: '[',
  CORCHETE_DER: ']',
  COMA: ',',
  PUNTO_Y_COMA: ';',
  DOS_PUNTOS: ':',
  
  // Control de flujo
  FIN_LINEA: ';',
  EOF: 'EOF'
};

const PALABRAS_CLAVE = {
  // Estructura
  'algoritmo': TokenType.ALGORITMO_KW,
  'finalgoritmo': TokenType.FINALGORITMO_KW,
  'proceso': TokenType.PROCESO_KW,
  'finproceso': TokenType.FINPROCESO_KW,

  // Definición
  'definir': TokenType.DEFINIR_KW,
  'como': TokenType.COMO_KW,
  'entero': TokenType.ENTERO_KW,
  'enteros': TokenType.ENTERO_KW,
  'real': TokenType.REAL_KW,
  'reales': TokenType.REAL_KW,
  'numero': TokenType.REAL_KW,
  'numerico': TokenType.REAL_KW,
  'texto': TokenType.TEXTO_KW,
  'cadena': TokenType.TEXTO_KW,
  'caracter': TokenType.TEXTO_KW,
  'logico': TokenType.LOGICO_KW,
  'booleano': TokenType.LOGICO_KW,

  // Entrada / Salida
  'imprimir': TokenType.IMPRIMIR_KW,
  'escribir': TokenType.ESCRIBIR_KW,
  'mostrar': TokenType.MOSTRAR_KW,
  'leer': TokenType.LEER_KW,

  // Condicional
  'si': TokenType.SI_KW,
  'entonces': TokenType.ENTONCES_KW,
  'sino': TokenType.SINO_KW,
  'finsi': TokenType.FINSI_KW,

  // Switch / Según
  'segun': TokenType.SEGUN_KW,
  'caso': TokenType.CASO_KW,
  'deotromodo': TokenType.DE_OTRO_MODO_KW,
  'finsegun': TokenType.FINSEGUN_KW,

  // Bucles
  'mientras': TokenType.MIENTRAS_KW,
  'hacer': TokenType.HACER_KW,
  'finmientras': TokenType.FINMIENTRAS_KW,
  'repetir': TokenType.REPETIR_KW,
  'hasta': TokenType.HASTA_KW,
  'que': TokenType.QUE_KW,
  'para': TokenType.PARA_KW,
  'con': TokenType.CON_KW,
  'paso': TokenType.PASO_KW,
  'finpara': TokenType.FINPARA_KW,

  // Funciones
  'funcion': TokenType.FUNCION_KW,
  'finfuncion': TokenType.FINFUNCION_KW,
  'subproceso': TokenType.SUBPROCESO_KW,
  'finsubproceso': TokenType.FINSUBPROCESO_KW,
  'subalgoritmo': TokenType.SUBPROCESO_KW,
  'finsubalgoritmo': TokenType.FINSUBPROCESO_KW,
  'retornar': TokenType.RETORNAR_KW,
  'devolver': TokenType.RETORNAR_KW,

  // Operadores en palabras
  'mod': TokenType.MOD_KW,
  'y': TokenType.Y_LOGICO,
  'o': TokenType.O_LOGICO,
  'no': TokenType.NO_LOGICO,

  // Constantes
  'verdadero': TokenType.VERDADERO_KW,
  'falso': TokenType.FALSO_KW,
  'true': TokenType.VERDADERO_KW,
  'false': TokenType.FALSO_KW,
  'pi': TokenType.PI_KW
};

class Lexer {
  constructor(input) {
    this.input = input || '';
    this.pos = 0;
    this.line = 1;
    this.col = 1;
  }

  peek(offset = 0) {
    const target = this.pos + offset;
    return target < this.input.length ? this.input[target] : null;
  }

  advance() {
    const ch = this.peek();
    this.pos++;
    if (ch === '\n') {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return ch;
  }

  match(expected) {
    if (this.peek() === expected) {
      this.advance();
      return true;
    }
    return false;
  }

  // Tokenización completa basada en Autómata Finito Determinista (AFD)
  tokenize() {
    const tokens = [];

    while (this.pos < this.input.length) {
      const ch = this.peek();

      // Ignorar espacios en blanco y tabulaciones
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\v') {
        this.advance();
        continue;
      }

      // Saltos de línea generan separador lógico opcional si es necesario
      if (ch === '\n') {
        this.advance();
        continue;
      }

      // Comentarios de una línea '//' o bloque '/*'
      if (ch === '/') {
        if (this.peek(1) === '/') {
          // Comentario de una línea
          while (this.peek() !== null && this.peek() !== '\n') {
            this.advance();
          }
          continue;
        } else if (this.peek(1) === '*') {
          // Comentario multilínea
          const startLine = this.line;
          const startCol = this.col;
          this.advance(); // Consumir '/'
          this.advance(); // Consumir '*'
          let closed = false;
          while (this.pos < this.input.length) {
            if (this.peek() === '*' && this.peek(1) === '/') {
              this.advance();
              this.advance();
              closed = true;
              break;
            }
            this.advance();
          }
          if (!closed) {
            throw new Error(`[Error Léxico] Comentario multilínea sin cerrar en Fila ${startLine}, Columna ${startCol}.`);
          }
          continue;
        }
      }

      const startCol = this.col;
      const startLine = this.line;

      // Estado q_num: Reconocimiento numérico entero y real con soporte decimal
      if (/[0-9]/.test(ch)) {
        let buffer = '';
        let isDecimal = false;

        while (this.peek() !== null && (/[0-9]/.test(this.peek()) || this.peek() === '.')) {
          if (this.peek() === '.') {
            // Si el siguiente carácter tras el punto no es número, puede ser operador
            if (!/[0-9]/.test(this.peek(1))) {
              break;
            }
            if (isDecimal) {
              throw new Error(`[Error Léxico] Formato numérico inválido con múltiples puntos decimales en Fila ${startLine}, Columna ${this.col}.`);
            }
            isDecimal = true;
          }
          buffer += this.advance();
        }

        tokens.push({
          type: TokenType.NUMERO,
          value: parseFloat(buffer),
          raw: buffer,
          isFloat: isDecimal,
          line: startLine,
          col: startCol
        });
        continue;
      }

      // Estado q_cadena: Cadenas con comillas dobles o simples
      if (ch === '"' || ch === "'") {
        const quote = this.advance();
        let buffer = '';

        while (this.peek() !== null && this.peek() !== quote) {
          if (this.peek() === '\n') {
            throw new Error(`[Error Léxico] Cadena de texto sin cerrar en Fila ${startLine}, Columna ${startCol}.`);
          }
          if (this.peek() === '\\') {
            this.advance();
            const nextCh = this.advance();
            if (nextCh === 'n') buffer += '\n';
            else if (nextCh === 't') buffer += '\t';
            else if (nextCh === '\\') buffer += '\\';
            else if (nextCh === quote) buffer += quote;
            else buffer += nextCh;
          } else {
            buffer += this.advance();
          }
        }

        if (this.peek() === null) {
          throw new Error(`[Error Léxico] Fin de archivo inesperado buscando comilla de cierre '${quote}' iniciada en Fila ${startLine}, Columna ${startCol}.`);
        }

        this.advance(); // Consumir comilla de cierre
        tokens.push({
          type: TokenType.CADENA,
          value: buffer,
          raw: `${quote}${buffer}${quote}`,
          line: startLine,
          col: startCol
        });
        continue;
      }

      // Estado q_id: Identificadores y palabras clave
      if (/[a-zA-Z_áéíóúÁÉÍÓÚñÑ]/.test(ch)) {
        let buffer = '';

        while (this.peek() !== null && /[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/.test(this.peek())) {
          buffer += this.advance();
        }

        // Caso especial: frase "de otro modo"
        let lower = buffer.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remover tildes para uniformidad

        if (lower === 'de') {
          // Explorar si viene 'otro modo'
          const savedPos = this.pos;
          const savedLine = this.line;
          const savedCol = this.col;
          
          let lookAhead = '';
          while (this.peek() === ' ' || this.peek() === '\t') this.advance();
          while (this.peek() !== null && /[a-zA-Z_]/.test(this.peek())) lookAhead += this.advance();
          
          if (lookAhead.toLowerCase() === 'otro') {
            while (this.peek() === ' ' || this.peek() === '\t') this.advance();
            let lookAhead2 = '';
            while (this.peek() !== null && /[a-zA-Z_]/.test(this.peek())) lookAhead2 += this.advance();
            if (lookAhead2.toLowerCase() === 'modo') {
              tokens.push({
                type: TokenType.DE_OTRO_MODO_KW,
                value: 'de otro modo',
                line: startLine,
                col: startCol
              });
              continue;
            }
          }
          // Si no coincidió, restaurar posición
          this.pos = savedPos;
          this.line = savedLine;
          this.col = savedCol;
        }

        if (lower === 'hasta' && this.peek() !== null) {
          // Verificar si es 'hasta que'
          const savedPos = this.pos;
          const savedLine = this.line;
          const savedCol = this.col;
          while (this.peek() === ' ' || this.peek() === '\t') this.advance();
          let lookAhead = '';
          while (this.peek() !== null && /[a-zA-Z_]/.test(this.peek())) lookAhead += this.advance();
          if (lookAhead.toLowerCase() === 'que') {
            tokens.push({ type: TokenType.HASTA_KW, value: 'hasta', line: startLine, col: startCol });
            tokens.push({ type: TokenType.QUE_KW, value: 'que', line: startLine, col: this.col - 3 });
            continue;
          }
          this.pos = savedPos;
          this.line = savedLine;
          this.col = savedCol;
        }

        const tokenType = PALABRAS_CLAVE[lower] || TokenType.IDENTIFICADOR;

        tokens.push({
          type: tokenType,
          value: buffer,
          normalized: lower,
          line: startLine,
          col: startCol
        });
        continue;
      }

      // Operadores de asignación y relacionales compuestos
      if (ch === '<') {
        this.advance();
        if (this.match('-')) {
          tokens.push({ type: TokenType.ASIGNACION, value: '<-', line: startLine, col: startCol });
          continue;
        }
        if (this.match('=')) {
          tokens.push({ type: TokenType.MENOR_IGUAL, value: '<=', line: startLine, col: startCol });
          continue;
        }
        if (this.match('>')) {
          tokens.push({ type: TokenType.DISTINTO_QUE, value: '<>', line: startLine, col: startCol });
          continue;
        }
        tokens.push({ type: TokenType.MENOR_QUE, value: '<', line: startLine, col: startCol });
        continue;
      }

      if (ch === '>') {
        this.advance();
        if (this.match('=')) {
          tokens.push({ type: TokenType.MAYOR_IGUAL, value: '>=', line: startLine, col: startCol });
          continue;
        }
        tokens.push({ type: TokenType.MAYOR_QUE, value: '>', line: startLine, col: startCol });
        continue;
      }

      if (ch === ':') {
        this.advance();
        if (this.match('=')) {
          tokens.push({ type: TokenType.ASIGNACION, value: ':=', line: startLine, col: startCol });
          continue;
        }
        tokens.push({ type: TokenType.DOS_PUNTOS, value: ':', line: startLine, col: startCol });
        continue;
      }

      if (ch === '=') {
        this.advance();
        if (this.match('=')) {
          tokens.push({ type: TokenType.IGUAL_QUE, value: '==', line: startLine, col: startCol });
          continue;
        }
        // En PSeInt '=' se usa tanto para asignación como para comparación según el contexto sintáctico
        tokens.push({ type: TokenType.ASIGNACION, value: '=', line: startLine, col: startCol });
        continue;
      }

      if (ch === '!') {
        this.advance();
        if (this.match('=')) {
          tokens.push({ type: TokenType.DISTINTO_QUE, value: '!=', line: startLine, col: startCol });
          continue;
        }
        tokens.push({ type: TokenType.NO_LOGICO, value: '!', line: startLine, col: startCol });
        continue;
      }

      if (ch === '~') {
        this.advance();
        tokens.push({ type: TokenType.NO_LOGICO, value: '~', line: startLine, col: startCol });
        continue;
      }

      if (ch === '&') {
        this.advance();
        this.match('&'); // Si es '&&', consumirlo también
        tokens.push({ type: TokenType.Y_LOGICO, value: '&', line: startLine, col: startCol });
        continue;
      }

      if (ch === '|') {
        this.advance();
        this.match('|'); // Si es '||', consumirlo también
        tokens.push({ type: TokenType.O_LOGICO, value: '|', line: startLine, col: startCol });
        continue;
      }

      // Operadores de un carácter y delimitadores
      this.advance();
      switch (ch) {
        case '+':
          tokens.push({ type: TokenType.MAS, value: '+', line: startLine, col: startCol });
          break;
        case '-':
          tokens.push({ type: TokenType.MENOS, value: '-', line: startLine, col: startCol });
          break;
        case '*':
          tokens.push({ type: TokenType.POR, value: '*', line: startLine, col: startCol });
          break;
        case '/':
          tokens.push({ type: TokenType.DIV, value: '/', line: startLine, col: startCol });
          break;
        case '%':
          tokens.push({ type: TokenType.MOD, value: '%', line: startLine, col: startCol });
          break;
        case '^':
          tokens.push({ type: TokenType.POT, value: '^', line: startLine, col: startCol });
          break;
        case '(':
          tokens.push({ type: TokenType.PAREN_IZQ, value: '(', line: startLine, col: startCol });
          break;
        case ')':
          tokens.push({ type: TokenType.PAREN_DER, value: ')', line: startLine, col: startCol });
          break;
        case '[':
          tokens.push({ type: TokenType.CORCHETE_IZQ, value: '[', line: startLine, col: startCol });
          break;
        case ']':
          tokens.push({ type: TokenType.CORCHETE_DER, value: ']', line: startLine, col: startCol });
          break;
        case ',':
          tokens.push({ type: TokenType.COMA, value: ',', line: startLine, col: startCol });
          break;
        case ';':
          tokens.push({ type: TokenType.PUNTO_Y_COMA, value: ';', line: startLine, col: startCol });
          break;
        default:
          throw new Error(`[Error Léxico] Carácter desconocido o no permitido '${ch}' en Fila ${startLine}, Columna ${startCol}.`);
      }
    }

    tokens.push({ type: TokenType.EOF, value: null, line: this.line, col: this.col });
    return tokens;
  }
}

module.exports = { Lexer, TokenType, PALABRAS_CLAVE };
