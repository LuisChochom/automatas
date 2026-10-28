/**
 * server.js
 * Servidor Principal de la Aplicación en la Raíz del Proyecto
 * Entorno Educativo Interactivo Tipo PSeInt con Node.js y EJS
 */

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const { Lexer } = require('./core/Lexer');
const { Parser } = require('./core/Parser');
const { Interpreter } = require('./core/Interpreter');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Configuración de seguridad HTTP con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hidePoweredBy: true
}));

// 2. Limitador de peticiones (Protección contra DoS)
const ejecucionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120, // 120 peticiones por minuto por IP para uso fluido educativo
  message: { exito: false, error: 'Demasiadas solicitudes enviadas al servidor. Por favor espere unos segundos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Middlewares de parseo con límites de carga útiles
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// 4. Configuración de motor de vistas EJS y archivos estáticos
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Colección de algoritmos de ejemplo educativos
const EJEMPLOS_ALGORITMOS = {
  'precedencia': {
    titulo: 'Jerarquía y Precedencia Formal',
    descripcion: 'Demostración de asociatividad matemática de potencias, división, módulo y multiplicaciones.',
    codigo: `// Caso de Estudio: Jerarquía Formal de Operaciones
Algoritmo PrecedenciaAvanzada
    Definir a, b, c, r1, r2, r3 Como Real;
    
    a <- 2;
    b <- 3;
    c <- 4;
    
    // Nivel Potencia (asociatividad derecha: 2^(3^2) = 512)
    r1 <- a ^ b ^ 2;
    Escribir "Potencia asociada a la derecha: 2 ^ 3 ^ 2 =", r1;
    
    // Nivel Multiplicación y Suma: 2 + (3 * 4) = 14
    r2 <- a + b * c;
    Escribir "Precedencia de * sobre +: 2 + 3 * 4 =", r2;
    
    // Paréntesis forzados: (2 + 3) * 4 = 20
    r3 <- (a + b) * c;
    Escribir "Paréntesis forzados: (2 + 3) * 4 =", r3;
    
    // División asociatividad izquierda: (20 / 2) * 5 = 50
    real r4 = 20 / 2 * 5;
    Escribir "División y Multiplicación: 20 / 2 * 5 =", r4;
FinAlgoritmo`
  },

  'condicionales': {
    titulo: 'Estructura Si-Entonces-Sino',
    descripcion: 'Evaluación de condicionales con operadores lógicos y relacionales.',
    codigo: `Algoritmo EvaluadorCalificaciones
    Definir nota Como Real;
    Definir nombreEstudiante Como Texto;
    
    nombreEstudiante <- "Andrea Garcia";
    nota <- 85.5;
    
    Escribir "Estudiante:", nombreEstudiante;
    Escribir "Calificación obtenida:", nota;
    
    Si nota >= 90 Entonces
        Escribir "Resultado: Sobresaliente. ¡Felicitaciones!";
    Sino
        Si nota >= 70 y nota < 90 Entonces
            Escribir "Resultado: Aprobado satisfactoriamente.";
        Sino
            Escribir "Resultado: Requiere recuperación o tutoría.";
        FinSi
    FinSi
FinAlgoritmo`
  },

  'ciclo_para': {
    titulo: 'Ciclo Para con Paso y Factorial',
    descripcion: 'Cálculo del factorial de un número y sumatoria mediante bucle Para.',
    codigo: `Algoritmo CalculoFactorial
    Definir n, f, i Como Entero;
    n <- 6;
    f <- 1;
    
    Escribir "Calculando el factorial de:", n;
    
    Para i <- 1 Hasta n Con Paso 1 Hacer
        f <- f * i;
        Escribir "Paso", i, ": acumulado =", f;
    FinPara
    
    Escribir "----------------------------";
    Escribir "El Factorial de", n, "es:", f;
FinAlgoritmo`
  },

  'ciclo_mientras': {
    titulo: 'Ciclo Mientras y Serie Fibonacci',
    descripcion: 'Generación controlada de los primeros términos de Fibonacci.',
    codigo: `Algoritmo Fibonacci
    Definir a, b, temp, limite, contador Como Entero;
    a <- 0;
    b <- 1;
    limite <- 10;
    contador <- 0;
    
    Escribir "Primeros", limite, "términos de la Serie de Fibonacci:";
    
    Mientras contador < limite Hacer
        Escribir "Término", contador + 1, "->", a;
        temp <- a + b;
        a <- b;
        b <- temp;
        contador <- contador + 1;
    FinMientras
FinAlgoritmo`
  },

  'segun_menu': {
    titulo: 'Selección Múltiple (Según)',
    descripcion: 'Ejecución de menú de operaciones con la estructura Según / Caso / De Otro Modo.',
    codigo: `Algoritmo MenuOperaciones
    Definir opcion Como Entero;
    Definir numA, numB, resultado Como Real;
    
    numA <- 16;
    numB <- 4;
    opcion <- 2; // Cambia la opción a 1, 2, 3, 4 o 5
    
    Escribir "Operando A:", numA, " | Operando B:", numB;
    
    Segun opcion Hacer
        Caso 1:
            resultado <- numA + numB;
            Escribir "Operación Seleccionada: Suma ->", resultado;
        Caso 2:
            resultado <- numA - numB;
            Escribir "Operación Seleccionada: Resta ->", resultado;
        Caso 3:
            resultado <- numA * numB;
            Escribir "Operación Seleccionada: Multiplicación ->", resultado;
        Caso 4:
            resultado <- numA / numB;
            Escribir "Operación Seleccionada: División ->", resultado;
        De Otro Modo:
            Escribir "Opción inválida seleccionada:", opcion;
    FinSegun
FinAlgoritmo`
  },

  'funciones_matematicas': {
    titulo: 'Biblioteca Matemática Integrada',
    descripcion: 'Uso de funciones nativas: Raíz, Abs, Redon, Trunc, Sen, Cos, Azar y Pi.',
    codigo: `Algoritmo FuncionesNativas
    Definir radio, hipotenusa, numDecimal Como Real;
    
    // Cálculo con constante Pi
    radio <- 5;
    Escribir "Área del círculo de radio 5:", Pi * (radio ^ 2);
    
    // Raíz cuadrada (Teorema de Pitágoras)
    Definir cateto1, cateto2 Como Real;
    cateto1 <- 3;
    cateto2 <- 4;
    hipotenusa <- Raiz((cateto1 ^ 2) + (cateto2 ^ 2));
    Escribir "Hipotenusa para catetos 3 y 4:", hipotenusa;
    
    // Redondeo y Truncamiento
    numDecimal <- 7.846;
    Escribir "Número original:", numDecimal;
    Escribir "Redondeado (Redon):", Redon(numDecimal);
    Escribir "Parte entera (Trunc):", Trunc(numDecimal);
    
    // Valor absoluto y Aleatorio
    Escribir "Valor Absoluto de -42:", Abs(-42);
    Escribir "Número Aleatorio entre 10 y 50:", Aleatorio(10, 50);
FinAlgoritmo`
  },

  'cadenas': {
    titulo: 'Manipulación de Cadenas de Texto',
    descripcion: 'Concatenación, longitud, mayúsculas, minúsculas y subcadenas.',
    codigo: `Algoritmo ProcesamientoTexto
    Definir mensaje, remitente, titulo Como Texto;
    remitente <- "Lenguajes Formales y Automatas";
    mensaje <- "Interprete PSeInt";
    
    Escribir "Mensaje:", mensaje;
    Escribir "Longitud del mensaje:", Longitud(mensaje);
    Escribir "En Mayúsculas:", Mayusculas(mensaje);
    Escribir "En Minúsculas:", Minusculas(remitente);
    
    // Extracción de subcadena: subcadena(texto, inicio, fin)
    Definir prefijo Como Texto;
    prefijo <- Subcadena(remitente, 1, 9);
    Escribir "Subcadena (caracteres 1 al 9):", prefijo;
FinAlgoritmo`
  },

  'subprocesos': {
    titulo: 'Subprocesos y Funciones Personalizadas',
    descripcion: 'Definición de funciones con parámetros y retorno de valor.',
    codigo: `Funcion total <- CalcularDescuento(monto, porcentaje)
    Definir descuento Como Real;
    descuento <- monto * (porcentaje / 100);
    total <- monto - descuento;
FinFuncion

Algoritmo TiendaEducativa
    Definir precioBase, precioFinal Como Real;
    precioBase <- 1200;
    
    Escribir "Precio Original: $", precioBase;
    precioFinal <- CalcularDescuento(precioBase, 15);
    Escribir "Precio con 15% de descuento: $", precioFinal;
FinAlgoritmo`
  }
};

// Ruta principal de la interfaz
app.get('/', (req, res) => {
  res.render('index', {
    titulo: 'PSeInt Studio | Autómata y Compiladores',
    ejemplos: EJEMPLOS_ALGORITMOS
  });
});

// Endpoint para obtener catálogo de ejemplos
app.get('/api/ejemplos', (req, res) => {
  res.json({ exito: true, ejemplos: EJEMPLOS_ALGORITMOS });
});

// Endpoint seguro de análisis y ejecución
app.post('/api/ejecutar', ejecucionLimiter, (req, res) => {
  const { codigo, entradas } = req.body;

  if (typeof codigo !== 'string') {
    return res.status(400).json({
      exito: false,
      error: 'Formato de solicitud no válido. El código fuente debe ser una cadena.'
    });
  }

  if (codigo.trim().length === 0) {
    return res.status(400).json({
      exito: false,
      error: 'El editor está vacío. Ingrese instrucciones en pseudocódigo antes de ejecutar.'
    });
  }

  // Límite de tamaño para evitar abusos
  if (codigo.length > 50000) {
    return res.status(413).json({
      exito: false,
      error: 'El código fuente excede el límite máximo permitido (50,000 caracteres).'
    });
  }

  const lineasCodigo = codigo.split('\n');

  try {
    // ----------------------------------------------------
    // Fase 1: Autómata Finito Determinista (AFD - Lexer)
    // ----------------------------------------------------
    const lexer = new Lexer(codigo);
    const tokens = lexer.tokenize();

    // ----------------------------------------------------
    // Fase 2: Gramática Libre de Contexto y Parser (GLC)
    // ----------------------------------------------------
    const parser = new Parser(tokens, codigo);
    const ast = parser.parse();

    // ----------------------------------------------------
    // Fase 3: Análisis Semántico y Evaluación en Aislamiento
    // ----------------------------------------------------
    const interpreter = new Interpreter({
      entradas: Array.isArray(entradas) ? entradas : []
    });
    const resultado = interpreter.ejecutar(ast);

    // Preparar tokens simplificados para el inspector visual del frontend
    const tokensVisuales = tokens.slice(0, 500).map(t => ({
      tipo: t.type,
      valor: t.value !== null ? String(t.value) : 'EOF',
      linea: t.line,
      col: t.col
    }));

    res.json({
      exito: true,
      salida: resultado.salida,
      tablaSimbolos: resultado.tablaSimbolos,
      tokens: tokensVisuales,
      ast: ast,
      pasos: resultado.pasos,
      duracionMs: resultado.duracionMs
    });

  } catch (err) {
    // Extraer número de línea y columna si están presentes
    let lineaError = null;
    let colError = null;

    if (err.line) lineaError = err.line;
    if (err.col) colError = err.col;

    // Intentar deducir la línea del mensaje
    if (!lineaError) {
      const matchLinea = err.message.match(/Fila\s+(\d+)/i) || err.message.match(/fila\s+(\d+)/i);
      if (matchLinea) lineaError = parseInt(matchLinea[1], 10);
    }
    if (!colError) {
      const matchCol = err.message.match(/Columna\s+(\d+)/i) || err.message.match(/col\s+(\d+)/i);
      if (matchCol) colError = parseInt(matchCol[1], 10);
    }

    let fragmentoCodigo = '';
    if (lineaError && lineaError > 0 && lineaError <= lineasCodigo.length) {
      const lineaTexto = lineasCodigo[lineaError - 1];
      const indicador = colError && colError > 0 ? ' '.repeat(Math.max(0, colError - 1)) + '^' : '';
      fragmentoCodigo = `Línea ${lineaError}: ${lineaTexto}\n${indicador ? ' '.repeat(String(lineaError).length + 8) + indicador : ''}`;
    }

    res.status(422).json({
      exito: false,
      error: err.message,
      linea: lineaError,
      columna: colError,
      fragmento: fragmentoCodigo
    });
  }
});

// Manejador de rutas no encontradas 404
app.use((req, res) => {
  res.status(404).render('404', {
    titulo: '404 - Página no encontrada',
    mensaje: 'El recurso solicitado no existe en el servidor.'
  });
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Servidor PSeInt Automata Web activo en puerto: ${PORT}`);
  console.log(`🔗 URL local: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

module.exports = app;
