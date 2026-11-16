# 📅 Planificador de Cursos

[![Deploy to GitHub Pages](https://github.com/Luccat1/planificador_cursos/actions/workflows/deploy.yml/badge.svg)](https://github.com/Luccat1/planificador_cursos/actions/workflows/deploy.yml)
[![Demo](https://img.shields.io/badge/Demo%20en%20Vivo-GitHub%20Pages-success?style=for-the-badge&logo=githubpages&logoColor=white)](https://luccat1.github.io/planificador_cursos/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tests-35%20passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> Aplicación web interactiva y cliente-primero (*local-first*) para la **planificación inteligente de horarios académicos universitarios**. Resuelve problemas combinatorios de asignación de bloques mediante un algoritmo de backtracking con satisfacción de restricciones y optimización de preferencias pedagógicas.

🚀 **[Abrir aplicación en vivo (GitHub Pages)](https://luccat1.github.io/planificador_cursos/)**

---

## 📋 Tabla de Contenidos

- [🎯 Propósito y Contexto](#-propósito-y-contexto)
- [✨ Características Principales](#-características-principales)
- [💡 Flujo de Trabajo Recomendado](#-flujo-de-trabajo-recomendado)
- [📊 Integración con Excel y Respaldos](#-integración-con-excel-y-respaldos)
  - [Estructura de la Plantilla Excel](#estructura-de-la-plantilla-excel)
  - [Especificación Detallada de Columnas](#especificación-detallada-de-columnas)
- [🏗️ Arquitectura y Estructura del Proyecto](#️-arquitectura-y-estructura-del-proyecto)
- [💻 Stack Tecnológico](#-stack-tecnológico)
- [🚀 Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
  - [Prerrequisitos](#prerrequisitos)
  - [Paso a Paso](#paso-a-paso)
  - [Comandos Disponibles](#comandos-disponibles)
- [🚢 Despliegue Continuo (CI/CD)](#-despliegue-continuo-cicd)
- [🤝 Contribuciones](#-contribuciones)
- [📄 Licencia y Créditos](#-licencia-y-créditos)

---

## 🎯 Propósito y Contexto

La confección manual de mallas horarias universitarias es un problema complejo que suele requerir decenas de horas de negociación y ajuste. El **Planificador de Cursos** fue concebido para coordinadores académicos y directores de carrera (especialmente en contextos de educación superior chilena, como programas PIIE y similares), ofreciendo una herramienta ágil que resuelve:

- **Disponibilidad docente fragmentada:** Profesores con ventanas horarias limitadas o días restringidos.
- **Asignaturas multi-bloque:** Cursos que exigen bloques dobles o continuos sin cortes en el día.
- **Cruces e incompatibilidades:** Materias del mismo semestre/nivel que los estudiantes deben cursar simultáneamente sin solapamientos.
- **Preferencias pedagógicas blandas:** Ponderar la concentración de clases en la mañana, evitar días específicos o espaciar sesiones durante la semana.
- **Privacidad total (*Local-First*):** Toda la información se procesa y persiste directamente en el navegador del usuario (`localStorage`). No existen bases de datos remotas ni servidores externos que almacenen datos institucionales o personales.

---

## ✨ Características Principales

- **🤖 Generador Automático con Backtracking:** Explora exhaustivamente las combinaciones viables, podando ramas inviables y puntuando cada propuesta según el cumplimiento de preferencias blandas.
- **📅 Grilla Semanal Interactiva:** Calendario semanal de lunes a viernes con visualización adaptativa lado a lado para asignaturas dictadas en paralelo sin conflicto.
- **🔒 Fijación en Caliente (*Pinning*):** Bloquea sesiones horarias ya consensuadas (🔒) para que permanezcan inamovibles en futuras ejecuciones del optimizador.
- **👥 Grupos de Alumnos (Cohortes):** Define paquetes de asignaturas pertenecientes al mismo nivel para garantizar que ningún ramo del grupo coincida a la misma hora.
- **⚖️ Inspector de Restricciones y Conflictos:** Notificaciones visuales inmediatas que clasifican problemas en errores críticos, conflictos de cruce, advertencias y sugerencias.
- **📥 Importación / Exportación Bidireccional:**
  - **Excel (`.xlsx`):** Generador de plantilla estructurada, exportación de la planificación activa e importación sin pérdida de relaciones.
  - **JSON:** Copia de respaldo íntegra y portable del periodo académico para compartir o archivar.

---

## 💡 Flujo de Trabajo Recomendado

```text
1. Carga de Datos      2. Restricciones       3. Optimización        4. Consolidación
┌──────────────┐      ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Importar     │ ───► │ Grupos,      │  ───► │ Generar      │  ───► │ Bloquear (🔒)│
│ Excel o usar │      │ Choques y    │       │ Propuestas   │       │ y Exportar   │
│ formulario   │      │ Preferencias │       │ Rankeadas    │       │ Excel / JSON │
└──────────────┘      └──────────────┘       └──────────────┘       └──────────────┘
```

1. **Cargar o Registrar Entidades:** Ingresa profesores, claves horarias y asignaturas desde la tabla integrada, o carga una planilla Excel con la plantilla provista.
2. **Definir Disponibilidad Docente:** Especifica las ventanas horarias en las que cada profesor puede dictar clases (los docentes sin registro explícito se consideran 100% disponibles).
3. **Establecer Reglas y Grupos:** Configura qué cursos no deben toparse (por nivel, cohorte o sala).
4. **Configurar Preferencias Blandas:** Asigna ponderaciones (pesos) a criterios deseables (ej. preferir bloques matutinos o espaciar sesiones en días alternos).
5. **Generar y Comparar Propuestas:** Presiona **Generar Propuesta** para calcular alternativas viables ordenadas por puntuación.
6. **Ajuste Fino y Fijación:** Haz clic en cualquier sesión para bloquearla; el algoritmo respetará esas posiciones al reoptimizar el resto de la malla.
7. **Exportar Resultados:** Descarga la versión final en Excel o guarda un archivo JSON de respaldo.

---

## 📊 Integración con Excel y Respaldos

La aplicación permite la interoperabilidad completa con hojas de cálculo y copias de seguridad:

| Acción | Formato | Propósito |
| :--- | :---: | :--- |
| **Descargar Plantilla** | `.xlsx` | Obtiene un archivo Excel formateado con ejemplos instructivos listos para rellenar. |
| **Importar Excel** | `.xlsx` | Carga masiva de profesores, disponibilidades, cursos, bloques, reglas y preferencias. |
| **Exportar Excel** | `.xlsx` | Genera una planilla con la configuración completa y la asignación horaria actual. |
| **Respaldar Periodo** | `.json` | Descarga un archivo JSON autocontenido con todo el estado del periodo. |
| **Restaurar Periodo** | `.json` | Restaura una copia previa sin pérdida de consistencia. |

### Estructura de la Plantilla Excel

La plantilla de importación cuenta con pestañas estandarizadas. Las filas de ejemplo que comienzan con el prefijo `Ej:` son ignoradas automáticamente por el importador.

```text
📁 Plantilla_Planificador.xlsx
├── 📄 Instrucciones      (Guía de uso y reglas de validación)
├── 📄 Profesores         (Identificación y estado de docentes)
├── 📄 Disponibilidad     (Ventanas horarias permitidas por profesor)
├── 📄 Cursos             (Asignaturas, docentes asignados y sesiones)
├── 📄 Claves horarias    (Definición de módulos horarios y horas)
├── 📄 Restricciones      (Reglas de incompatibilidad estricta entre cursos)
└── 📄 Preferencias       (Criterios blandos ponderables)
```

### Especificación Detallada de Columnas

#### 1. `Profesores`

- **`id`**: Identificador alfanumérico sin espacios (ej. `t-1`, `prof-gonzalez`).
- **`nombre`**: Nombre completo del docente.
- **`activo`**: `SÍ` o `NO`.

#### 2. `Disponibilidad`

*(Opcional: Si un profesor no se lista en esta hoja, se asume disponibilidad total).*

- **`profesor_id`**: ID del docente (debe coincidir con la hoja `Profesores`).
- **`dia`**: Día en español (`Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`).
- **`clave_id`**: ID de la clave horaria correspondiente (ej. `1-2`).

#### 3. `Cursos`

- **`id`**: Código identificador único del curso (ej. `c-101`, `calc-1`).
- **`nombre`**: Nombre descriptivo de la materia.
- **`profesores`**: Lista de IDs de profesores separados por coma (ej. `t-1` o `t-1, t-2`).
- **`sesiones_semana`**: Número de sesiones semanales requeridas (ej. `2`).
- **`claves_por_sesion`**: Duración en bloques consecutivos por sesión (ej. `2` para clases dobles).
- **`activo`**: `SÍ` o `NO`.

#### 4. `Claves horarias`

- **`id`**: Identificador del bloque (ej. `1-2`, `3-4`).
- **`clave`**: Etiqueta visible en la grilla (ej. `1-2`).
- **`inicio`** / **`termino`**: Horarios en formato `HH:MM` (ej. `08:15` / `09:25`).
- **`activo`**: `SÍ` o `NO`.

#### 5. `Restricciones`

- **`id`**: Identificador único de la regla (ej. `cr-1`).
- **`curso_a`** / **`curso_b`**: IDs de los cursos que **no** pueden dictarse simultáneamente.
- **`motivo`**: Razón o justificación del conflicto (ej. `Mismo nivel / laboratorio compartido`).
- **`activo`**: `SÍ` o `NO`.

#### 6. `Preferencias`

- **`id`**: Identificador de la regla de preferencia (ej. `pref-1`).
- **`alcance`**: Alcance de la regla (`period`, `course`, `teacher`).
- **`objetivo`**: ID del curso o profesor correspondiente (dejar vacío si el alcance es `period`).
- **`tipo`**: Uno de los siguientes valores admitidos:
  - `preferMorning`: Privilegia los primeros bloques de la jornada.
  - `preferDay`: Favorece un día particular de la semana.
  - `avoidDay`: Desincentiva la asignación en un día particular.
  - `spreadSessions`: Procura alternar los días de clase evitando sesiones consecutivas.
- **`valor`**: Día en minúsculas en inglés si aplica (`monday`, `tuesday`, `wednesday`, `thursday`, `friday`), o vacío.
- **`peso`**: Ponderación numérica del impacto en el puntaje de la propuesta (ej. `5`, `10`).
- **`activo`**: `SÍ` o `NO`.

---

## 🏗️ Arquitectura y Estructura del Proyecto

El proyecto está diseñado bajo una estricta separación entre la **lógica de dominio** (TypeScript puro sin dependencias de React) y la **capa de interfaz de usuario**:

```text
planificador_cursos/
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD: Pruebas automáticas y despliegue a GitHub Pages
├── src/
│   ├── domain/               # 🧠 Lógica de dominio pura (100% testeable sin DOM)
│   │   ├── types.ts          # Definiciones de tipos e interfaces de datos
│   │   ├── scheduler.ts      # Motor de backtracking y cálculo de puntajes
│   │   ├── validation.ts     # Verificación de restricciones duras e incompatibilidades
│   │   ├── storage.ts        # Adaptador de persistencia con localStorage
│   │   ├── excel.ts          # Parser, validación y serializador Excel (SheetJS)
│   │   ├── seeds.ts          # Datos demostrativos iniciales
│   │   └── constants.ts      # Etiquetas de días, claves y constantes globales
│   ├── components/           # 🎨 Componentes visuales interactivos (React 19)
│   │   ├── ScheduleGrid.tsx  # Grilla horaria interactiva con soporte multi-columna
│   │   ├── DataTables.tsx    # Tablas de administración de entidades
│   │   ├── SidePanel.tsx     # Panel lateral de inspección y fijación de sesiones
│   │   └── ProposalPanel.tsx # Visor y comparador de propuestas generadas
│   ├── App.tsx               # Orquestación de estado global y vistas principales
│   ├── main.tsx              # Punto de entrada de la aplicación
│   └── styles.css            # Hoja de estilos con variables CSS modernas
├── tests/                    # 🧪 Pruebas unitarias con Vitest (35 tests)
├── index.html                # Plantilla base SPA
├── package.json              # Manifiesto de dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript estricto
└── vite.config.ts            # Configuración de compilación y base path de Vite
```

---

## 💻 Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
| :--- | :--- | :---: | :--- |
| **Framework UI** | [React](https://react.dev/) | 19.x | Interfaz reactiva basada en componentes funcionales y hooks |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | 5.7+ | Tipado estático estricto y seguridad en tiempo de desarrollo |
| **Bundler / DevServer** | [Vite](https://vitejs.dev/) | 6.x | Servidor de desarrollo ultrarrápido y empaquetador de producción |
| **Iconografía** | [Lucide React](https://lucide.dev/) | 0.468+ | Iconos vectoriales limpios y consistentes |
| **Hojas de Cálculo** | [SheetJS (xlsx)](https://sheetjs.com/) | 0.18.5 | Procesamiento de archivos `.xlsx` en el navegador del cliente |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | 4.x / 16.x | Suite de pruebas unitarias y verificación de componentes |
| **Estilos** | CSS Moderno | - | Variables CSS nativas, layout Flexbox y CSS Grid adaptable |

---

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos

- **Node.js** v18.0.0 o superior (recomendado v20+ LTS).
- **npm** v9.0.0 o superior (incluido con Node.js).
- Navegador web moderno (Chrome, Edge, Firefox, Safari).

### Paso a Paso

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/Luccat1/planificador_cursos.git
   cd planificador_cursos
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Iniciar el entorno de desarrollo:**

   ```bash
   npm run dev
   ```

4. **Acceder a la aplicación:**
   Abre tu navegador e ingresa a `http://localhost:5173`.

### Comandos Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga en caliente (HMR). |
| `npm run build` | Compila el código TypeScript y genera el bundle optimizado en `/dist`. |
| `npm run preview` | Levanta un servidor local para previsualizar la compilación de producción. |
| `npm test` | Ejecuta la suite completa de 35 pruebas unitarias con Vitest. |
| `npm run test:watch` | Ejecuta las pruebas en modo interactivo y continuo ante cambios. |

---

## 🚢 Despliegue Continuo (CI/CD)

El repositorio cuenta con integración continua automatizada mediante **GitHub Actions** ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. Ante cada `push` o combinación a la rama `main`, el pipeline descarga el código, instala dependencias con `npm ci` y ejecuta la suite de pruebas automatizadas.
2. Si todas las pruebas pasan exitosamente, compila la aplicación para producción con `npm run build`.
3. Sube el paquete resultante a **GitHub Pages** de forma transparente y sin necesidad de ramas auxiliares huérfanas.

---

## 🤝 Contribuciones

Las contribuciones, sugerencias y reportes de errores son bienvenidos:

1. Haz un **Fork** del proyecto.
2. Crea una rama para tu feature o corrección (`git checkout -b feature/nueva-funcionalidad`).
3. Asegúrate de que las pruebas sigan pasando (`npm test`).
4. Haz commit de tus cambios con mensajes claros (`git commit -m 'feat: agregar exportación a PDF'`).
5. Sube tu rama (`git push origin feature/nueva-funcionalidad`).
6. Abre un **Pull Request**.

Si encuentras algún problema o tienes una sugerencia, por favor abre un [Issue en GitHub](https://github.com/Luccat1/planificador_cursos/issues).

---

## 📄 Licencia y Créditos

Este proyecto se distribuye bajo la **Licencia MIT**. Puedes utilizarlo, modificarlo y distribuirlo libremente para propósitos personales, académicos o comerciales. Consulta el archivo [LICENSE](LICENSE) para más detalles.

- **Autor:** Luciano Cataldo  
- **GitHub:** [@luccat1](https://github.com/luccat1)  
- **Email:** [lcataldoalvarado@gmail.com](mailto:lcataldoalvarado@gmail.com)
