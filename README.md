# Planificador de Cursos

Aplicación web SPA para planificar horarios universitarios semanales. Permite definir profesores, cursos, bloques horarios, reglas de conflicto y preferencias; un algoritmo de backtracking genera propuestas de horario rankeadas.

Orientada a coordinadores académicos en contexto universitario chileno (PIIE y similares).

## Uso rápido

1. Registra **Profesores** y define su disponibilidad horaria.
2. Registra **Cursos** con sus profesores, sesiones semanales y duración en bloques.
3. Agrega **Restricciones** para evitar cruces entre cursos específicos.
4. Configura **Grupos** de alumnos para evitar solapamientos entre ramos del mismo nivel.
5. Agrega **Preferencias** blandas (preferir mañana, evitar viernes, etc.).
6. Presiona **Generar propuesta** para obtener el mejor horario.
7. Haz clic en una sesión para **bloquearla**; permanecerá fija en la siguiente generación.

## Importar / Exportar

| Acción | Formato | Descripción |
|--------|---------|-------------|
| Respaldar | JSON | Copia completa del periodo (profesores, cursos, bloqueos, etc.) |
| Restaurar | JSON | Carga una copia de respaldo |
| Ejemplo | Excel | Descarga una plantilla con datos de demostración |
| Exportar | Excel | Exporta el periodo actual como planilla Excel editable |
| Importar | Excel | Importa profesores, cursos, bloques, restricciones y preferencias desde Excel |

La hoja **Disponibilidad** del Excel permite definir los bloques disponibles por docente. Si un profesor no aparece en esa hoja se asume disponibilidad completa.

## Desarrollo

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (Vite)
npm run build    # build de producción → dist/
npm test         # ejecutar tests (Vitest)
npm run deploy   # build + deploy a GitHub Pages
```

## Stack

- **React 19** + **TypeScript 5** + **Vite 6**
- Persistencia: `localStorage` (client-side, sin backend)
- Excel: `xlsx` v0.18.5
- Tests: Vitest + @testing-library/react

## Arquitectura

```
src/
├── App.tsx                  # Estado global, orquestación de layout
├── domain/
│   ├── types.ts             # Interfaces del modelo de dominio
│   ├── scheduler.ts         # Algoritmo de backtracking + scoring
│   ├── validation.ts        # Validación de restricciones duras
│   ├── storage.ts           # Serialización JSON ↔ localStorage
│   ├── excel.ts             # Importación / exportación Excel
│   ├── seeds.ts             # Periodos de demostración y por defecto
│   └── constants.ts         # Días, etiquetas, constantes de dominio
└── components/
    ├── ScheduleGrid.tsx     # Grilla semanal con columnas multi-bloque
    ├── DataTables.tsx       # Editor tabular de todas las entidades
    ├── SidePanel.tsx        # Panel de edición contextual (bloquear/ubicar)
    └── ProposalPanel.tsx    # Lista de propuestas generadas
```

El dominio (`src/domain/`) es puro TypeScript sin dependencias de React, y está cubierto por tests unitarios.
