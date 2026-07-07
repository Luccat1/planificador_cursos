# 📅 Planificador de Cursos

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Una aplicación web interactiva y local para la **planificación inteligente de horarios académicos**. Optimiza la distribución de bloques horarios resolviendo conflictos de disponibilidad docente, colisiones de asignaturas y preferencias pedagógicas a través de un algoritmo avanzado de backtracking.

---

## 📋 Tabla de Contenidos

- [✨ Características Principales](#-características-principales)
- [🚀 Inicio Rápido](#-inicio-rápido)
  - [Prerrequisitos](#prerrequisitos)
  - [Instalación y Uso](#instalación-y-uso)
- [💡 Flujo de Trabajo Recomendado](#-flujo-de-trabajo-recomendado)
- [📊 Manual del Formato Excel de Importación](#-manual-del-formato-excel-de-importación)
  - [Tabla Resumen de Hojas](#tabla-resumen-de-hojas)
  - [Especificación de Columnas](#especificación-de-columnas)
- [🛠️ Comandos de Desarrollo](#️-comandos-de-desarrollo)
- [📢 Declaración de Contexto (Vibecoded)](#-declaración-de-contexto-vibecoded)
- [📄 Licencia](#-licencia)

---

## ✨ Características Principales

*   **⚡ Grilla Semanal Interactiva:** Calendario semanal de lunes a viernes segmentado por módulos horarios flexibles y editables.
*   **🧩 Soporte para Clases Multi-Bloque:** Configuración de asignaturas con duraciones variables (bloques simples, dobles o más) garantizando la continuidad en la agenda.
*   **⚖️ Visualización Paralela Adaptable:** Distribución automática lado a lado para clases simultáneas sin conflicto (ej. distintos profesores y salas libres), maximizando la legibilidad.
*   **🤖 Algoritmo de Resolución Automática (Backtracking):** Generador inteligente que explora miles de combinaciones para proponer los mejores horarios, respetando restricciones estrictas y priorizando preferencias.
*   **🔒 Bloqueos Manuales en Caliente:** Permite fijar (🔒) cualquier curso propuesto en la grilla para que permanezca inamovible en futuras optimizaciones del algoritmo.
*   **📥 Respaldos Seguros:** Exportación e importación completa del estado de la aplicación mediante archivos JSON y hojas de cálculo compatibles con Excel.

---

## 🚀 Inicio Rápido

Sigue estos sencillos pasos para levantar la aplicación en tu entorno local.

### Prerrequisitos

Debes tener instalado **Node.js** en tu equipo:
1. Descarga la versión recomendada (LTS) desde [nodejs.org](https://nodejs.org/).
2. Instálala en tu sistema operativo siguiendo el asistente predeterminado.

### Instalación y Uso

1. **Descarga el código fuente:**
   * Haz clic en el botón verde **"Code"** en la parte superior derecha de esta página y selecciona **"Download ZIP"**.
   * Extrae el contenido en el directorio de tu elección.

2. **Instala las dependencias necesarias:**
   Abre una terminal o consola (Cmd/PowerShell en Windows, Terminal en macOS/Linux), navega a la carpeta del proyecto y ejecuta:
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   Ejecuta el siguiente comando para levantar la aplicación localmente:
   ```bash
   npm run dev
   ```

4. **Accede a la app:**
   Abre tu navegador de preferencia e ingresa a `http://localhost:5173`.

---

## 💡 Flujo de Trabajo Recomendado

1.  **Carga tus Datos:** Ingresa la lista de profesores y cursos desde las tablas en pantalla o usa una plantilla de Excel.
2.  **Define la Disponibilidad:** Configura los días y bloques horarios disponibles de cada profesor desde el editor interactivo o mediante Excel.
3.  **Establece Reglas:** Configura qué cursos no pueden coincidir a la misma hora (ej. materias del mismo nivel).
4.  **Ajusta Preferencias:** Define prioridades blandas (ej. preferir bloques matutinos, evitar días específicos de docentes).
5.  **Genera Propuestas:** Haz clic en **Generar Propuesta** para calcular múltiples alternativas viables.
6.  **Fija y Bloquea:** Bloquea las asignaturas que ya estén en su horario definitivo y vuelve a generar para reacomodar el resto.

---

## 📊 Manual del Formato Excel de Importación

Para facilitar la carga masiva de datos, puedes descargar una plantilla estructurada usando el botón **"Descargar Plantilla"** de la aplicación. El archivo Excel resultante cuenta con las siguientes pestañas. Cada pestaña incluye una fila explicativa con datos de ejemplo (con el prefijo `Ej: `) que el sistema descarta automáticamente al importar:

### Tabla Resumen de Hojas

| Pestaña | Descripción | Columnas Requeridas |
| :--- | :--- | :--- |
| **Profesores** | Registro de docentes del periodo | `id`, `nombre`, `activo` |
| **Disponibilidad** | Ventanas horarias del docente (opcional) | `profesor_id`, `dia`, `clave_id` |
| **Cursos** | Listado de asignaturas a planificar | `id`, `nombre`, `profesores`, `sesiones_semana`, `claves_por_sesion`, `activo` |
| **Claves horarias** | Definición de los bloques horarios de clase | `id`, `clave`, `inicio`, `termino`, `activo` |
| **Restricciones** | Incompatibilidades estrictas de cruce | `id`, `curso_a`, `curso_b`, `motivo`, `activo` |
| **Preferencias** | Prioridades blandas para la distribución | `id`, `alcance`, `objetivo`, `tipo`, `valor`, `peso`, `activo` |

### Especificación de Columnas

#### 1. Profesores
*   **`id`**: Identificador único sin espacios (ej: `t-1`).
*   **`nombre`**: Nombre completo del docente.
*   **`activo`**: `SÍ` o `NO`.

#### 2. Disponibilidad
*Si un docente no se registra en esta pestaña, el planificador considerará que está 100% disponible.*
*   **`profesor_id`**: ID del docente (debe coincidir con la hoja *Profesores*).
*   **`dia`**: Nombre del día en español (ej: `Lunes`, `Martes`, `Miércoles`, `Jueves`, `Viernes`).
*   **`clave_id`**: ID de la clave horaria de ese día (debe coincidir con la hoja *Claves horarias*, ej: `1-2`).

#### 3. Cursos
*   **`id`**: ID único de la materia sin espacios (ej: `c-101`).
*   **`nombre`**: Nombre legible de la materia.
*   **`profesores`**: Lista de IDs de profesores asignados separados por coma (ej: `t-1` o `t-1, t-2`).
*   **`sesiones_semana`**: Veces que se dicta la clase en la semana (ej: `2`).
*   **`claves_por_sesion`**: Cuántos bloques consecutivos dura la sesión (ej: `2` para clases dobles).
*   **`activo`**: `SÍ` o `NO`.

#### 4. Claves horarias
*   **`id`**: Código identificador del bloque (ej: `1-2`).
*   **`clave`**: Etiqueta visible en el horario (ej: `1-2`).
*   **`inicio`** / **`termino`**: Horas en formato 24 horas (ej: `08:15` / `09:25`).
*   **`activo`**: `SÍ` o `NO`.

#### 5. Restricciones
*   **`id`**: Código de la regla (ej: `cr-1`).
*   **`curso_a`** / **`curso_b`**: IDs de las asignaturas que no deben coincidir en el mismo bloque.
*   **`motivo`**: Razón del choque o incompatibilidad.
*   **`activo`**: `SÍ` o `NO`.

#### 6. Preferencias
*   **`id`**: Identificador único.
*   **`alcance`**: Rango de la preferencia (`period`, `course`, `teacher`).
*   **`objetivo`**: ID del curso o del profesor afectado (dejar vacío si el alcance es `period`).
*   **`tipo`**: Uno de los siguientes valores exactos:
    *   `preferMorning`: Priorizar las primeras horas del día.
    *   `preferDay`: Preferir un día de la semana.
    *   `avoidDay`: Evitar un día de la semana.
    *   `spreadSessions`: Distribuir las clases en días separados.
*   **`valor`**: Si elegiste `preferDay` o `avoidDay`, escribe el día en inglés y minúscula (`monday`, `tuesday`, `wednesday`, `thursday`, `friday`).
*   **`peso`**: Importancia o peso numérico de la preferencia (ej: `5`).
*   **`activo`**: `SÍ` o `NO`.

---

## 🛠️ Comandos de Desarrollo

Si deseas realizar modificaciones en el código o verificar la integridad del proyecto, puedes usar los siguientes comandos en la consola:

*   **Ejecutar Pruebas Unitarias:**
    ```bash
    npm test
    ```
    *(Corre las 14 pruebas automatizadas de lógica de validación, scheduler, exportador de Excel e importador JSON)*.

*   **Compilar para Producción:**
    ```bash
    npm run build
    ```
    *(Crea un paquete de archivos HTML, CSS y JS optimizado en la carpeta `/dist`)*.

---

## 📢 Declaración de Contexto (Vibecoded)

Este es un proyecto desarrollado bajo la modalidad **Vibecoded** (creado y modificado con asistencia directa de Inteligencia Artificial).

*   **Sobre el autor:** Este programa es mantenido por **Luciano Cataldo** (no soy programador profesional ni pretendo parecerlo).
*   **Propósito:** Desarrollar soluciones sencillas de forma ágil para uso local e interno de nuestro equipo de trabajo. Usamos GitHub simplemente como un repositorio para respaldar el código y colaborar internamente.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Puedes usarlo, modificarlo y distribuirlo libremente para fines comerciales y privados, siempre que mantengas los créditos correspondientes.

*   **Titular de la licencia:** Luciano Cataldo  
*   **Contacto:** <lcataldoalvarado@gmail.com>  
*   **GitHub:** [@luccat1](https://github.com/luccat1)
