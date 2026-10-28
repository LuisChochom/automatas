# PSeInt Studio - Intérprete Educativo Basado en Autómatas

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21+-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![EJS](https://img.shields.io/badge/View_Engine-EJS-B4CA65?logo=javascript&logoColor=white)](https://ejs.co/)
[![Compiladores](https://img.shields.io/badge/Teoría-Autómatas_&_GLC-38BDF8)](#-fundamentos-teóricos)
[![Licencia](https://img.shields.io/badge/Licencia-MIT-10B981)](#-licencia)

> **Repositorio Oficial de GitHub:** [https://github.com/LuisChochom/automatas](https://github.com/LuisChochom/automatas)

**PSeInt Studio** es un entorno interactivo de desarrollo web (IDE) orientado a la enseñanza y ejecución de pseudocódigo en español estructurado tipo PSeInt. Está desarrollado con arquitectura modular sobre Node.js y EJS, implementando de forma rigurosa la **Teoría de Autómatas, Lenguajes Formales y Diseño de Compiladores**.

---

## Tabla de Contenidos

1. [Tecnologías y Herramientas Utilizadas](#-tecnologías-y-herramientas-utilizadas)
2. [Instrucciones para Iniciar el Proyecto](#-instrucciones-para-iniciar-el-proyecto)
3. [Fundamentos Teóricos y Arquitectura](#-fundamentos-teóricos-y-arquitectura)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Sintaxis y Operaciones Soportadas](#-sintaxis-y-operaciones-soportadas)
6. [Jerarquía y Precedencia Formal](#-jerarquía-y-precedencia-formal)
7. [Biblioteca de Funciones Nativas](#-biblioteca-de-funciones-nativas)
8. [Despliegue en Servidores y cPanel](#-despliegue-en-servidores-y-cpanel)
9. [Pruebas Automatizadas](#-pruebas-automatizadas)
10. [Licencia](#-licencia)

---

## Tecnologías y Herramientas Utilizadas

El sistema fue diseñado empleando tecnologías nativas y probadas para garantizar alta velocidad de procesamiento, seguridad y mantenibilidad:

### Backend y Entorno de Ejecución
- **[Node.js](https://nodejs.org/) (v18.0.0 o superior):** Entorno de ejecución asíncrono para JavaScript en el servidor.
- **[Express.js](https://expressjs.com/) (v4.21.2):** Servidor HTTP y enrutador para servir la interfaz web y exponer el endpoint seguro de compilación (`/api/ejecutar`).
- **[EJS](https://ejs.co/) (Embedded JavaScript Templates v3.1.10):** Motor de plantillas del lado del servidor para el renderizado dinámico de la interfaz sin frameworks pesados.
- **[Helmet](https://helmetjs.github.io/) (v8.0.0):** Middleware de endurecimiento de seguridad mediante cabeceras HTTP estrictas y Content Security Policy (CSP).
- **[Express-Rate-Limit](https://www.npmjs.com/package/express-rate-limit) (v7.5.0):** Protección perimetral contra ataques de denegación de servicio (DoS) y saturación de peticiones.

### Teoría de Compiladores e Intérprete
- **Autómata Finito Determinista (AFD):** Implementación pura de máquina de estados finitos en JavaScript (`core/Lexer.js`) para el análisis léxico y clasificación precisa de tokens por fila y columna.
- **Gramática Libre de Contexto (GLC) & Autómata de Pila:** Analizador sintáctico descendente recursivo (*Recursive Descent Parser* en `core/Parser.js`) que procesa la estructura formal de sentencias y expresiones sin ambigüedades.
- **Árbol de Sintaxis Abstracta (AST):** Representación arbórea intermedia estandarizada en formato JSON que modela la jerarquía semántica del código.
- **Evaluador Semántico Aislado (*Sandbox*):** Motor de interpretación en `core/Interpreter.js` con límite de pasos (mitigación de bucles infinitos), tabla de tipos estrictos y volcado dinámico de memoria.

### Frontend e Interfaz de Usuario
- **HTML5 Semántico:** Estructura accesible con divisiones claras tipo IDE (barra de herramientas, panel de edición, panel inspector).
- **Vanilla CSS3 Estructurado:** Sistema de diseño formal de ingeniería sin degradados ni efectos neón, implementado mediante *CSS Custom Properties* (`:root` y `[data-theme="light"]`) para soporte instantáneo de tema claro y oscuro.
- **Vanilla JavaScript (ES6+):** Lógica del cliente sin dependencias externas, incluyendo sincronización precisa de scroll con canaleta de números de línea, atajos de teclado (`F9`, `Ctrl+L`), inserción de plantillas y comunicación con la API vía `Fetch`.

### Herramientas de Despliegue y Control de Versiones
- **Git & GitHub:** Control de versiones del código fuente alojado en [https://github.com/LuisChochom/automatas](https://github.com/LuisChochom/automatas).
- **Phusion Passenger & CloudLinux:** Compatibilidad con entornos compartidos de cPanel vía `server.js` en la raíz.

---

## Instrucciones para Iniciar el Proyecto

Siga estos pasos para descargar, instalar y poner en marcha el proyecto en su máquina local:

### 1. Requisitos del Sistema
- Tener instalado **Node.js** (versión 18 o superior). Para comprobarlo ejecute:
  ```bash
  node -v
  npm -v
  ```

### 2. Clonar el Repositorio
Abra una terminal o consola de comandos y clone el proyecto:
```bash
git clone https://github.com/LuisChochom/automatas.git
cd automatas
```

### 3. Instalar Dependencias
Instale los paquetes de Node.js necesarios definidos en `package.json`:
```bash
npm install
```

### 4. Iniciar el Servidor de la Aplicación
Para arrancar el servidor en modo producción o estándar:
```bash
npm start
```
o ejecutando directamente el archivo raíz:
```bash
node server.js
```

### 5. Abrir la Aplicación en el Navegador
Una vez iniciado el servidor, verá en consola el mensaje de confirmación:
```text
=======================================================
 Servidor PSeInt Automata Web activo en puerto: 3000
 URL local: http://localhost:3000
=======================================================
```
Abra su navegador web favorito e ingrese a:
**`http://localhost:3000`**

### Atajos de Teclado Útiles en el IDE
- **`F9`** o **`Ctrl + Enter`**: Compilar y ejecutar el algoritmo escrito en el editor.
- **`Ctrl + L`**: Limpiar la consola de salida y restablecer inspectores.
- **`Tab`**: Inserta sangría de 4 espacios sin perder el foco en el editor.
- **`Esc`**: Cierra el modal de ayuda si está visible.

---

## Fundamentos Teóricos y Arquitectura

El flujo de procesamiento en el servidor opera bajo cuatro etapas estrictamente independientes:

```
[ Código Fuente en Pseudocódigo ]
             │
             ▼
[ 1. Analizador Léxico: Autómata Finito Determinista (AFD) ]
             │  Genera flujo ordenado de Tokens (Lexema, Tipo, Fila, Columna)
             ▼
[ 2. Analizador Sintáctico: Parser Descendente / GLC ]
             │  Evalúa las producciones gramaticales y resuelve precedencias
             ▼
[ 3. Analizador Semántico: Tabla de Símbolos y Control de Tipos ]
             │  Comprueba tipos compatibles (Entero, Real, Texto, Lógico)
             ▼
[ 4. Motor de Ejecución en Aislamiento (Sandbox) ]
             │  Límite de seguridad contra bucles infinitos (100,000 pasos)
             ▼
[ Consola de Resultados + Tabla de Símbolos + Tokens + AST ]
```

---

## Estructura del Proyecto

```text
automatas/
├── core/                                # Núcleo del compilador
│   ├── Lexer.js                         # Autómata Finito Determinista (AFD)
│   ├── Parser.js                        # Analizador sintáctico descendente y AST
│   └── Interpreter.js                   # Verificador semántico y entorno sandbox
├── public/                              # Recursos web estáticos
│   ├── css/
│   │   └── estilos.css                  # Estilos formales (modo oscuro y claro)
│   └── js/
│       └── cliente.js                   # Controlador del IDE del lado del cliente
├── views/                               # Vistas EJS
│   ├── 404.ejs                          # Vista para recursos inexistentes
│   └── index.ejs                        # Vista principal del IDE interactivo
├── package.json                         # Configuración y dependencias del proyecto
├── package-lock.json                    # Registro exacto de dependencias
├── server.js                            # Punto de entrada principal en la raíz
└── README.md                            # Documentación para GitHub
```

---

## Sintaxis y Operaciones Soportadas

### Declaraciones y Tipos de Datos
```pseint
// Sintaxis tradicional PSeInt:
Definir x, y, total Como Entero;
Definir promedio, tasa Como Real;
Definir nombre Como Texto;
Definir esValido Como Logico;

// Sintaxis directa:
entero edad = 20;
real precio = 12.50;
texto saludo = "Hola Mundo";
logico activo = verdadero;
```

### Asignaciones
Admite los operadores de asignación estándar:
```pseint
contador <- contador + 1; // Asignación PSeInt
total = a + b * 2;        // Asignación directa
tasa := 0.15;             // Operador Pascal
```

### Entrada y Salida
```pseint
Escribir "Total calculado:", total;
Imprimir "Promedio:", (a + b) / 2;
Mostrar "Mensaje en pantalla";
Leer entradaUsuario;
```

### Estructuras de Control
```pseint
// Condicional Si - Entonces - Sino - FinSi
Si calificacion >= 70 Entonces
    Escribir "Aprobado";
Sino
    Escribir "Reprobado";
FinSi

// Selección Múltiple Según - Caso - De Otro Modo - FinSegun
Segun opcion Hacer
    Caso 1:
        Escribir "Opción Suma";
    Caso 2, 3:
        Escribir "Opciones de Ajuste";
    De Otro Modo:
        Escribir "Opción inválida";
FinSegun

// Ciclo Mientras
Mientras contador < 5 Hacer
    Escribir "Valor:", contador;
    contador <- contador + 1;
FinMientras

// Ciclo Repetir - Hasta Que
Repetir
    x <- x - 1;
Hasta Que x <= 0;

// Ciclo Para con Paso
Para i <- 1 Hasta 10 Con Paso 2 Hacer
    Escribir "Número impar:", i;
FinPara
```

### Funciones y Subprocesos
```pseint
Funcion res <- Multiplicar(a, b)
    res <- a * b;
FinFuncion

Algoritmo Demo
    Definir producto Como Real;
    producto <- Multiplicar(6, 7);
    Escribir "El producto es:", producto; // Salida: 42
FinAlgoritmo
```

---

## Jerarquía y Precedencia Formal

| Nivel | Operadores | Descripción | Asociatividad |
| :---: | :---: | :--- | :---: |
| **1** | `( )` | Paréntesis de agrupación | Adentro hacia afuera |
| **2** | `-`, `+`, `NO`, `~`, `!` | Operadores unarios y negación lógica | Derecha |
| **3** | `^` | Potenciación matemática ($2^{3^2} = 512$) | **Derecha** |
| **4** | `*`, `/`, `%`, `MOD` | Multiplicación, división real y residuo | **Izquierda** |
| **5** | `+`, `-` | Suma aritmética o concatenación de textos | **Izquierda** |
| **6** | `==`, `=`, `<>`, `!=`, `<`, `<=`, `>`, `>=` | Comparadores relacionales | No asociativo |
| **7** | `Y`, `&`, `&&` | Conjunción lógica (AND) | **Izquierda** |
| **8** | `O`, `\|`, `\|\|` | Disyunción lógica (OR) | **Izquierda** |

---

## Biblioteca de Funciones Nativas

### Matemáticas
- `Raiz(x)` o `RC(x)`: Raíz cuadrada ($\sqrt{x}$).
- `Abs(x)`: Valor absoluto ($|x|$).
- `Redon(x)`: Redondeo al entero más próximo.
- `Trunc(x)`: Truncamiento de la parte decimal.
- `Sen(x)`, `Cos(x)`, `Tan(x)`: Trigonometría en radianes.
- `Ln(x)`: Logaritmo natural ($x > 0$).
- `Exp(x)`: Función exponencial $e^x$.
- `Azar(x)`: Número aleatorio entero en $[0, x - 1]$.
- `Aleatorio(min, max)`: Número aleatorio entero uniforme en $[min, max]$.
- `Pi`: Constante matemática $\pi \approx 3.141592653589793$.

### Cadenas de Texto
- `Longitud(cadena)`: Retorna la cantidad de caracteres.
- `Mayusculas(cadena)`: Convierte el texto a mayúsculas.
- `Minusculas(cadena)`: Convierte el texto a minúsculas.
- `Subcadena(cadena, desde, hasta)`: Retorna subcadena (indexado PSeInt desde 1).

---

## Despliegue en Servidores y cPanel

Para despliegues en servidores gestionados con CloudLinux / cPanel y Phusion Passenger:
1. Suba los archivos a la raíz de la aplicación web (excluyendo la carpeta `node_modules`).
2. En la sección **"Setup Node.js App"** de cPanel:
   - **Application root:** Directorio donde se encuentran los archivos.
   - **Application startup file:** `server.js` (ubicado en la raíz).
   - **Node.js version:** Seleccione versión 18.x o superior.
3. El archivo `server.js` detecta automáticamente el puerto configurado por Passenger a través de `process.env.PORT`.

---

## Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas unitarias que valida la jerarquía formal de operaciones, el tipado estricto y la detección de errores en tiempo de ejecución:

```bash
npm test
```

Salida esperada:
```text
✔ Precedencia de * sobre + -> "14"
✔ Paréntesis forzado -> "20"
✔ Asociatividad de Potencia -> "512"
✔ División y Multiplicación asociatividad izquierda -> "25"
✔ PSeInt Algoritmo y Definir -> "Total: 100"
✔ Condicional Si-Entonces -> "Mayor"
✔ Bucle Para con Paso -> "10"
✔ Funciones Matemáticas -> "9"
✔ Funciones de Cadena -> "10\nCOMPILADOR\ncomp"
✔ Función de Usuario con Retorno -> "42"
✔ Control de tipos estricto rechazó decimal en entero
✔ División entre cero capturada
=========================================
 TODAS LAS PRUEBAS PASARON EXITOSAMENTE (12/12)
=========================================
```

---

## Licencia

Este proyecto se distribuye bajo la Licencia **MIT**. Consulte el archivo `LICENSE` para mayores detalles.

---

**Autor y Desarrollador:** [Luis Chochom](https://github.com/LuisChochom)  
**Repositorio GitHub:** [https://github.com/LuisChochom/automatas](https://github.com/LuisChochom/automatas)
