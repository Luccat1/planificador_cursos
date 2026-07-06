# 📅 Planificador de Cursos

¡Bienvenido al **Planificador de Cursos**! Esta es una aplicación web de uso local diseñada para planificar horarios semanales de asignaturas de forma sencilla y visual. Permite gestionar profesores, cursos (incluso con sesiones de múltiples bloques de duración), configurar reglas de incompatibilidad entre cursos, establecer preferencias y generar propuestas de horarios automáticas optimizadas que resuelven los conflictos de agenda.

---

## 📢 Transparencia y Declaración de Contexto (Vibecoded Project)

Este es un proyecto desarrollado bajo la modalidad **Vibecoded** (creado y modificado con asistencia directa de Inteligencia Artificial).

* **Sobre el autor:** Este programa es mantenido por **Luciano Cataldo** (no soy programador profesional ni pretendo parecerlo).
* **Propósito:** Desarrollar soluciones sencillas de forma ágil para uso local e interno de nuestro equipo de trabajo. Usamos GitHub simplemente como un repositorio para respaldar el código y colaborar internamente.
* **Licencia de uso:** Licencia MIT (puedes ver más abajo o en el archivo [LICENSE](file:///c:/Users/Usuario/Documents/code/planificador_cursos/LICENSE)).

---

## ✨ Funcionalidades Principales

* **Grilla Semanal Interactiva:** Muestra el horario generado de lunes a viernes, ordenado por bloques horarios configurables.
* **Soporte de Múltiples Bloques:** Permite que un curso dure 1, 2 o más bloques consecutivos de clase, impidiendo traslapes y calculando el espacio necesario.
* **Visualización Inteligente Lado a Lado:** Si programas dos clases a la misma hora que no entran en conflicto (por ejemplo, tienen diferentes profesores y salas libres), la aplicación las mostrará una al lado de la otra de forma limpia.
* **Motor de Planificación Automática:** Utiliza un algoritmo inteligente (backtracking) para explorar todas las combinaciones posibles de horarios, descartar las que tienen conflictos de profesores o materias incompatibles, y ordenar las mejores opciones basándose en tus preferencias (ej. preferir mañanas, evitar ciertos días o distribuir clases en días distintos).
* **Bloqueos Manuales (Locks):** Puedes hacer clic en cualquier curso del calendario y **bloquear su horario (🔒)**. La aplicación respetará tu decisión y no moverá ese curso al generar nuevas propuestas de horario automáticas.
* **Respaldos en JSON:** Guarda y carga todo tu trabajo en un único archivo de respaldo (`.json`).
* **Plantilla de Excel:** Exporta o importa todos tus datos maestros (profesores, cursos, bloques, reglas y preferencias) directamente desde una hoja de cálculo en español compatible con Excel.

---

## 🚀 Guía de Inicio (Para personas que no entienden de programación)

Sigue estos sencillos pasos para hacer funcionar la aplicación en tu computadora local:

### Paso 1: Instalar Node.js

Para que este programa funcione, necesitas una herramienta base llamada **Node.js**.

1. Ve a la página oficial de descargas: [https://nodejs.org](https://nodejs.org).
2. Descarga la versión recomendada para la mayoría de los usuarios (normalmente indicada como **LTS**).
3. Abre el archivo descargado y sigue las instrucciones de instalación en pantalla (siguiente, siguiente, finalizar).

### Paso 2: Descargar el Código

Si no usas Git o la consola de comandos de GitHub:

1. Haz clic en el botón verde **"Code"** en la parte superior de esta página de GitHub.
2. Selecciona la opción **"Download ZIP"** (Descargar archivo comprimido).
3. Descomprime el archivo `.zip` en la carpeta de tu computadora donde desees guardar el proyecto (por ejemplo, en tus Documentos).

### Paso 3: Instalar Dependencias y Arrancar la Aplicación

1. Abre la terminal o consola de tu sistema operativo:
   * **En Windows:** Presiona la tecla `Windows`, escribe `cmd` o `PowerShell` y presiona Enter.
2. Navega hasta la carpeta del proyecto. Por ejemplo, si lo guardaste en tu carpeta de Documentos, escribe the following command en la terminal y presiona Enter:

   ```bash
   cd Documents/planificador_cursos
   ```

3. Instala los paquetes necesarios del programa escribiendo lo siguiente y presionando Enter:

   ```bash
   npm install
   ```

   *(Este paso descargará automáticamente los componentes visuales e internos de la aplicación y solo necesitas hacerlo la primera vez)*.

4. Inicia la aplicación escribiendo este comando y presionando Enter:

   ```bash
   npm run dev
   ```

5. En la consola verás un mensaje con un enlace similar a `http://localhost:5173`. Abre tu navegador web favorito (Chrome, Edge, Firefox, Safari) e ingresa a esa dirección para empezar a planificar.

---

## 🛠️ Comandos de Desarrollo (Para uso técnico)

Si deseas realizar modificaciones en el código o verificar la integridad del proyecto, puedes usar los siguientes comandos en la consola:

* **Ejecutar Pruebas Unitarias:**

  ```bash
  npm test
  ```

  *(Corre las 13 pruebas automatizadas de lógica de validación, scheduler, exportador de Excel e importador JSON)*.

* **Compilar para Producción:**

  ```bash
  npm run build
  ```

  *(Crea un paquete de archivos HTML, CSS y JS optimizado en la carpeta `/dist`)*.

---

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Puedes usarlo, modificarlo y distribuirlo libremente para fines comerciales y privados, siempre que mantengas los créditos correspondientes.

* **Titular de la licencia:** Luciano Cataldo  
* **Contacto:** <lcataldoalvarado@gmail.com>  
* **GitHub:** [@luccat1](https://github.com/luccat1)
