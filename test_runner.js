const { Lexer } = require('./core/Lexer');
const { Parser } = require('./core/Parser');
const { Interpreter } = require('./core/Interpreter');

const tests = [
  {
    name: 'Precedencia de * sobre +',
    code: 'entero a = 2 + 3 * 4; imprimir a;',
    expected: '14'
  },
  {
    name: 'Paréntesis forzado',
    code: 'entero a = (2 + 3) * 4; imprimir a;',
    expected: '20'
  },
  {
    name: 'Asociatividad de Potencia',
    code: 'real a = 2 ^ 3 ^ 2; imprimir a;',
    expected: '512'
  },
  {
    name: 'División y Multiplicación asociatividad izquierda',
    code: 'real a = 10 / 2 * 5; imprimir a;',
    expected: '25'
  },
  {
    name: 'PSeInt Algoritmo y Definir',
    code: `Algoritmo Test
Definir x Como Entero;
x <- 100;
Escribir "Total:", x;
FinAlgoritmo`,
    expected: 'Total: 100'
  },
  {
    name: 'Condicional Si-Entonces',
    code: `Definir edad Como Entero;
edad <- 18;
Si edad >= 18 Entonces
    Escribir "Mayor";
Sino
    Escribir "Menor";
FinSi`,
    expected: 'Mayor'
  },
  {
    name: 'Bucle Para con Paso',
    code: `Definir s, i Como Entero;
s <- 0;
Para i <- 1 Hasta 4 Con Paso 1 Hacer
    s <- s + i;
FinPara
Escribir s;`,
    expected: '10'
  },
  {
    name: 'Funciones Matemáticas',
    code: 'real r = Raiz(16) + Abs(-5);\nimprimir r;',
    expected: '9'
  },
  {
    name: 'Funciones de Cadena',
    code: `texto cad = "compilador";
Escribir Longitud(cad);
Escribir Mayusculas(cad);
Escribir Subcadena(cad, 1, 4);`,
    expected: '10\nCOMPILADOR\ncomp'
  },
  {
    name: 'Función de Usuario con Retorno',
    code: `Funcion r <- Duplicar(val)
    r <- val * 2;
FinFuncion

Definir num Como Entero;
num <- Duplicar(21);
Escribir num;`,
    expected: '42'
  }
];

let failed = 0;
for (const t of tests) {
  try {
    const lex = new Lexer(t.code);
    const tokens = lex.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interp = new Interpreter();
    const res = interp.ejecutar(ast);
    const out = res.salida.join('\n').trim();
    if (out === t.expected) {
      console.log('✔ PASÓ:', t.name, '->', JSON.stringify(out));
    } else {
      console.error('✖ FALLÓ:', t.name, '\n  Esperado:', JSON.stringify(t.expected), '\n  Obtenido:', JSON.stringify(out));
      failed++;
    }
  } catch (e) {
    console.error('✖ ERROR en test:', t.name, e.message);
    failed++;
  }
}

// Probar verificación estricta de tipo
try {
  const lex = new Lexer('entero a = 10.5;');
  const parser = new Parser(lex.tokenize());
  const interp = new Interpreter();
  interp.ejecutar(parser.parse());
  console.error('✖ FALLÓ test de control de tipo: debió arrojar error por decimal en entero');
  failed++;
} catch (e) {
  console.log('✔ PASÓ: Control de tipos estricto rechazó decimal en entero con mensaje:', e.message);
}

// Probar división entre cero
try {
  const lex = new Lexer('real a = 10 / 0;');
  const parser = new Parser(lex.tokenize());
  const interp = new Interpreter();
  interp.ejecutar(parser.parse());
  console.error('✖ FALLÓ test de división entre cero');
  failed++;
} catch (e) {
  console.log('✔ PASÓ: División entre cero capturada con mensaje:', e.message);
}

if (failed === 0) {
  console.log('\n=========================================');
  console.log('🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
  console.log('=========================================');
} else {
  process.exit(1);
}
