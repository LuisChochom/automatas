# Intérprete Educativo de Pseudocódigo

Entorno de desarrollo y ejecución de pseudocódigo en español estructurado, orientado a la enseñanza de lógica de programación y compiladores. El sistema implementa un analizador léxico basado en autómatas finitos deterministas (AFD) y un analizador sintáctico descendente recursivo basado en gramáticas libres de contexto (GLC) con soporte para jerarquía matemática formal.

## Tecnologías y Herramientas Utilizadas

### Entorno y Servidor
- **Node.js (LTS):** Entorno de ejecución para el servidor backend y el motor de análisis sintáctico.
- **Express.js:** Framework HTTP para enrutamiento, controladores y gestión de peticiones.
- **EJS (Embedded JavaScript):** Motor de plantillas del lado del servidor para renderizado de vistas con codificación automática contra ataques XSS.

### Seguridad y Middleware
- **Helmet:** Configuración de cabeceras HTTP de seguridad (Content Security Policy, X-Content-Type-Options, Strict-Transport-Security).
- **Express Rate Limit:** Mitigación de denegación de servicio (DoS) y control de abuso de peticiones.
- **Dotenv:** Gestión centralizada de variables de entorno fuera del código fuente.

### Interfaz de Usuario
- **HTML5 Semántico y CSS3:** Diseño modular en dos paneles (editor y consola de resultados).
- **CodeMirror / Textarea Estructurado:** Captura de código fuente con soporte de numeración de líneas.

---

## Fundamentos Teóricos de Compilación

### 1. Análisis Léxico (Autómata Finito Determinista)
El flujo de caracteres del código fuente es procesado mediante un autómata finito determinista definido por la tupla:

$$M = (Q, \Sigma, \delta, q_0, F)$$

Donde:
- $Q$: Conjunto de estados (inicio, número entero, número decimal, identificador, operador, comentario).
- $\Sigma$: Alfabeto de entrada (caracteres ASCII y operadores reconocidos).
- $\delta$: Función de transición de estados por cada caracter leído.
- $q_0$: Estado inicial de lectura de token.
- $F$: Conjunto de estados de aceptación que retornan instancias de `Token` con metadatos de línea y columna.

### 2. Análisis Sintáctico (Gramática Libre de Contexto)
La estructura sintáctica y la jerarquía formal de operaciones se resuelven mediante un analizador descendente recursivo que valida la gramática $G = (V_N, V_T, P, S)$:

```text
ExpresionSuma   ::= ExpresionMult ( ("+" | "-") ExpresionMult )*
ExpresionMult   ::= ExpresionPot ( ("*" | "/" | "%") ExpresionPot )*
ExpresionPot    ::= Factor ( "^" ExpresionPot )?
Factor          ::= ("+" | "-")? Primario
Primario        ::= NUMERO | CADENA | IDENTIFICADOR | "(" ExpresionSuma ")"
```

La asociatividad por la derecha de la potencia y por la izquierda del resto de operadores binarios previene ambigüedades en el árbol de sintaxis abstracta (AST).

---

## Estructura del Proyecto

```text
.
├── src/
│   ├── app.js               # Punto de entrada de la aplicación Express
│   ├── compiler/
│   │   ├── lexer.js         # Implementación del AFD
│   │   ├── parser.js        # Analizador sintáctico descendente recursivo
│   │   └── interpreter.js   # Evaluación del AST y tabla de símbolos
│   ├── controllers/
│   │   └── codeController.js # Manejo de solicitudes de análisis y ejecución
│   └── routes/
│       └── index.routes.js  # Rutas HTTP
├── views/
│   ├── index.ejs            # Vista principal con interfaz de dos columnas
│   └── partials/            # Componentes reutilizables de EJS
├── public/
│   ├── css/                 # Hojas de estilo
│   └── js/                  # Scripts de interacción del cliente
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

---

## Requisitos Previos

- Node.js versión 18.x o 20.x LTS.
- Gestor de paquetes npm versión 9.x o superior.
- Git instalado localmente.

---

## Instalación y Configuración Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/LuisChochom/automatas.git
   cd automatas
   ```

2. Instalar dependencias del proyecto:
   ```bash
   npm install
   ```

3. Configurar variables de entorno:
   Copie el archivo base y asigne los valores correspondientes:
   ```bash
   cp .env.example .env
   ```

   Parámetros requeridos en `.env`:
   ```env
   NODE_ENV=development
   PORT=3000
   SESSION_SECRET=clave_segura_de_ejemplo
   ```

4. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   O en modo producción:
   ```bash
   npm start
   ```

5. Acceso:
   Abrir en el navegador la dirección `http://localhost:3000`.

---

## Despliegue en Servidores cPanel (CloudLinux / Phusion Passenger)

1. En el panel de control de cPanel, acceder a **Setup Node.js App**.
2. Crear una nueva aplicación:
   - **Node.js Version:** Seleccionar versión LTS (18.x o 20.x).
   - **Application Mode:** `Production`.
   - **Application Root:** Directorio donde se ubicó el proyecto (ejemplo: `/home/usuario/app`).
   - **Application Startup File:** `src/app.js` (o archivo de arranque configurado).
3. Cargar los archivos del proyecto mediante Git o el Administrador de Archivos, excluyendo la carpeta `node_modules`.
4. En la interfaz de Node.js App en cPanel, ejecutar la acción **Run NPM Install**.
5. Agregar las variables de entorno (`NODE_ENV=production`, `PORT=3000`, etc.) en la sección de configuración de la aplicación.
6. Reiniciar la aplicación desde el panel de cPanel.

---

## Scripts Disponibles

- `npm start`: Inicia el servidor en modo producción.
- `npm run dev`: Inicia el servidor con reinicio automático (`nodemon` o `--watch`).
- `npm test`: Ejecuta el conjunto de pruebas unitarias del AFD, parser e intérprete.
- `npm run audit`: Revisa vulnerabilidades en dependencias mediante `npm audit`.

---

## Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulte el archivo `LICENSE` para mayores detalles.
