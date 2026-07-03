# Diseno V1: Planificador de Periodos de Clases

Fecha: 2026-07-03

## Objetivo

Crear una aplicacion web local/simple para planificar periodos de clases de la Direccion General de Asuntos Internacionales. La aplicacion debe permitir organizar cursos, profesores y claves horarias en una semana tipo, detectar conflictos y proponer horarios que cumplan reglas duras y preferencias configurables.

La V1 debe ser util para coordinacion operativa inmediata y, al mismo tiempo, dejar el modelo preparado para evolucionar despues hacia una version con salas, base de datos, usuarios y permisos.

## Alcance De V1

Incluye:

- Semana tipo de lunes a viernes.
- Periodos academicos configurables.
- Claves horarias editables.
- Cursos con una o varias sesiones semanales.
- Cursos con uno o varios profesores asignados.
- Profesores bloqueados en todas las sesiones de los cursos donde participan.
- Restricciones directas entre cursos especificos.
- Preferencias flexibles por curso, profesor o periodo.
- Bloqueos manuales de sesiones en dia y clave.
- Generador de propuesta recomendada y alternativas.
- Carga manual desde la interfaz.
- Importacion desde plantilla Excel entregada por la aplicacion.
- Exportacion del horario final y respaldo del periodo.
- Modelo preparado para agregar salas en V2.
- Modelo preparado para migrar a base de datos y usuarios en V3.

Queda fuera de V1:

- Gestion real de salas.
- Usuarios, roles y permisos.
- Calendario real con feriados que modifiquen automaticamente el horario.
- Integracion con sistemas institucionales.
- Historial avanzado multiusuario.

## Arquitectura

La V1 sera una aplicacion web local/simple. La pantalla principal sera una grilla semanal con un panel lateral de edicion. La aplicacion no dependera inicialmente de una base de datos institucional.

Cada periodo academico se guardara como un archivo estructurado, preferentemente JSON. Este archivo sera el respaldo principal del periodo y permitira abrir, duplicar o compartir planificaciones.

La aplicacion tambien debera soportar importacion desde una plantilla Excel. La plantilla tendra hojas definidas para profesores, cursos, claves horarias, restricciones y preferencias. La importacion validara datos incompletos, referencias inexistentes y duplicados.

## Modelo De Datos

### Periodo

Representa una planificacion especifica, por ejemplo `2026-2`, `Programa enero 2027` o `Intercambio invierno`.

Campos principales:

- Nombre del periodo.
- Fechas referenciales de inicio y termino.
- Claves horarias activas.
- Profesores activos.
- Cursos activos.
- Restricciones.
- Preferencias.
- Sesiones bloqueadas manualmente.
- Propuestas generadas.

Las fechas son informativas en V1. La logica de horario trabaja sobre una semana tipo.

### Clave Horaria

Representa un bloque horario reutilizable.

Campos principales:

- Codigo, por ejemplo `1-2`, `3-4`, `5-6`.
- Hora de inicio.
- Hora de termino.
- Estado activo/inactivo.

La app cargara claves iniciales como:

| Clave | Inicio | Termino |
| --- | --- | --- |
| 1-2 | 08:15 | 09:25 |
| 3-4 | 09:35 | 10:45 |
| 5-6 | 11:00 | 12:10 |
| 7-8 | 12:20 | 13:30 |
| 9-10 | 14:30 | 15:40 |
| 11-12 | 15:50 | 17:00 |
| 13-14 | 17:10 | 18:20 |

Estas claves no estaran fijas en el codigo: se podran editar, agregar, desactivar o eliminar segun el periodo.

### Profesor

Representa a una persona que puede dictar cursos.

Campos principales:

- Nombre.
- Estado activo/inactivo por periodo.
- Disponibilidad o restricciones, si se configuran.
- Preferencias, si se configuran.

Regla dura: un profesor no puede estar asignado a dos sesiones en el mismo dia y clave.

### Curso

Representa una asignatura ofrecida en el periodo.

Campos principales:

- Nombre.
- Profesores asignados.
- Cantidad de sesiones semanales requeridas.
- Duracion de cada sesion expresada en claves.
- Restricciones especificas.
- Preferencias especificas.

Un curso puede tener uno o varios profesores. Si un curso tiene varios profesores, todos quedan bloqueados en todas las sesiones de ese curso durante el periodo.

### Sesion

Representa una ocurrencia semanal de un curso.

Campos principales:

- Curso.
- Dia de la semana.
- Clave horaria.
- Profesores bloqueados.
- Estado: propuesta, confirmada o bloqueada manualmente.

Un curso puede tener varias sesiones por semana.

### Restriccion

Una restriccion dura indica algo que la aplicacion no puede permitir.

Ejemplos:

- Profesor duplicado en el mismo dia y clave.
- Curso A no puede cruzarse con Curso B.
- Una sesion bloqueada manualmente no puede moverse.
- No se pueden usar claves inexistentes o inactivas.

Las restricciones entre cursos son directas, no necesariamente grupales. Por ejemplo, `Espanol 1` puede cruzarse con `Espanol 2`, pero ambos pueden ser incompatibles con `Cultura Chilena`.

### Preferencia

Una preferencia expresa una condicion deseable pero flexible.

Ejemplos:

- Preferir que un curso sea en la manana.
- Evitar viernes.
- Preferir distribuir sesiones en dias no consecutivos.
- Preferir ciertos dias o claves para un profesor.
- Preferir dejar tardes para otros cursos.

Las preferencias no bloquean por si solas una propuesta, pero afectan su puntaje y deben explicarse si no se cumplen.

## Motor De Planificacion

El motor debe generar una propuesta recomendada y alternativas.

Flujo:

1. Leer cursos, profesores, claves, restricciones, preferencias y bloqueos manuales del periodo.
2. Validar datos base antes de generar.
3. Colocar primero las sesiones bloqueadas manualmente.
4. Generar combinaciones posibles para las sesiones restantes.
5. Descartar combinaciones que rompan reglas duras.
6. Puntuar combinaciones validas segun preferencias.
7. Ordenar resultados por puntaje y calidad.
8. Presentar la propuesta recomendada y alternativas.
9. Explicar conflictos, advertencias y preferencias incumplidas.

Las reglas duras nunca se rompen silenciosamente. Si no existe una solucion que cumpla todas las reglas duras, la app debe explicar que el periodo no es planificable con la configuracion actual y mostrar las causas principales.

## Interfaz

La interfaz usara un flujo mixto:

- Grilla semanal central.
- Panel lateral contextual.
- Tablas editables para datos maestros.

### Grilla Semanal

La grilla mostrara:

- Columnas de lunes a viernes.
- Filas por clave horaria.
- Cursos ubicados en sus sesiones.
- Indicadores de bloqueo manual.
- Alertas visuales de conflicto o advertencia.

### Panel Lateral

El panel cambiara segun lo seleccionado:

- Curso seleccionado.
- Profesor seleccionado.
- Clave horaria seleccionada.
- Restriccion seleccionada.
- Propuesta generada.

Desde este panel se podran editar datos, bloquear sesiones, revisar alertas y comparar alternativas.

### Vistas De Datos

La app tendra tablas editables para:

- Profesores.
- Cursos.
- Claves horarias.
- Restricciones entre cursos.
- Preferencias.

### Importacion Y Exportacion

La app permitira:

- Descargar una plantilla Excel.
- Importar la plantilla completada.
- Validar errores de la plantilla antes de aplicar cambios.
- Exportar el horario final a Excel.
- Exportar una version imprimible o PDF.
- Exportar el archivo JSON del periodo como respaldo.

## Manejo De Errores

La app debe distinguir entre:

- Errores bloqueantes: impiden generar una propuesta.
- Conflictos duros: invalidan una propuesta.
- Advertencias: indican preferencias incumplidas o datos a revisar.
- Sugerencias: recomiendan ajustes para mejorar el resultado.

Ejemplos de errores bloqueantes:

- Curso sin profesor.
- Curso sin cantidad de sesiones.
- Clave horaria duplicada.
- Profesor mencionado en un curso pero inexistente.
- Restriccion que apunta a un curso inexistente.

Ejemplos de conflictos duros:

- Un profesor aparece en dos sesiones simultaneas.
- Dos cursos incompatibles estan en el mismo dia y clave.
- Una sesion bloqueada manualmente entra en conflicto con otra regla dura.

## Pruebas Y Verificacion

La V1 debe probar como minimo:

- Edicion de claves horarias.
- Creacion de cursos con varias sesiones.
- Cursos con varios profesores.
- Deteccion de profesor duplicado.
- Deteccion de cursos incompatibles.
- Respeto de bloqueos manuales.
- Generacion de propuesta recomendada.
- Generacion de alternativas.
- Importacion valida desde plantilla Excel.
- Rechazo o advertencia ante plantilla con errores.
- Exportacion del horario final.
- Apertura de un periodo guardado como archivo estructurado.

Casos de prueba esenciales:

- `Espanol 1` y `Espanol 2` pueden cruzarse.
- `Cultura Chilena` no puede cruzarse con `Espanol 1`.
- `Cultura Chilena` no puede cruzarse con `Espanol 2`.
- Un curso con Andres, Sebastian y Ricardo bloquea a los tres profesores en cada sesion.
- Una sesion bloqueada manualmente no se mueve durante la generacion.

## Evolucion Posterior

### V2: Salas

Agregar:

- Salas primarias.
- Salas alternativas.
- Capacidad.
- Preferencias por curso.
- Conflictos por sala ocupada.

### V3: Sistema Institucional

Agregar:

- Base de datos.
- Usuarios.
- Roles y permisos.
- Historial de cambios.
- Colaboracion multiusuario.
- Integraciones institucionales si son necesarias.

