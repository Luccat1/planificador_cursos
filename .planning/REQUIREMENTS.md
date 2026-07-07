# Requirements: Planificador de Cursos — Refactor de Calidad y UI

**Defined:** 2026-07-07
**Core Value:** Un coordinador puede generar, revisar y ajustar el horario semanal sin perder su trabajo entre sesiones.

## v1 Requirements

### Pilar 1 — Calidad de Código

- [ ] **QUAL-01**: El archivo `src/domain/constants.ts` contiene la constante `WEEKDAY_LABELS` (Weekday→nombre) y `SPANISH_TO_WEEKDAY` (nombre→Weekday, con variantes acentuadas), y las referencias en `validation.ts`, `excel.ts` y `SidePanel.tsx` importan desde ahí
- [ ] **QUAL-02**: `excel.ts` no contiene ningún `as any` — todos los puntos de parseo usan `Record<string, unknown>` y las coerciones de enum usan type guards explícitos (`isPreferenceScope`, `isPreferenceKind`)
- [ ] **QUAL-03**: `parseExcelTemplate` valida todos los campos requeridos y valores de enum antes de construir objetos de dominio; un archivo malformado lanza un `Error` descriptivo en lugar de corromper el estado silenciosamente
- [ ] **QUAL-04**: `DataTables.tsx` es un shell de ~50 líneas que solo maneja `activeTab`; cada entidad tiene su propio componente en `src/components/data-tables/`: `BlocksTab.tsx`, `TeachersTab.tsx`, `CoursesTab.tsx`, `ConflictRulesTab.tsx`, `PreferencesTab.tsx`, `TeacherAvailabilityGrid.tsx`
- [ ] **QUAL-05**: La app no usa `alert()` para ningún error o confirmación — existe un componente de notificación tipo toast y todos los errores de import/export de `App.tsx` lo usan
- [ ] **QUAL-06**: Los tests de dominio cubren: todos los `PreferenceKind` en el scheduler, todos los paths de error de `parseExcelTemplate` (hoja faltante, id vacío, enum inválido, peso no numérico), y casos de backward compatibility en `parsePeriodJson`

### Pilar 2 — Deficiencias Funcionales

- [ ] **FUNC-01**: El periodo activo se guarda automáticamente en `localStorage` (key `planificador_period_v1`) con debounce de 500ms al editar; al recargar la página el estado se restaura sin intervención del usuario
- [ ] **FUNC-02**: Si el dato almacenado en localStorage no pasa `parsePeriodJson`, la app notifica al usuario "Estado guardado incompatible; se inició un periodo nuevo" y limpia la key corrupta
- [ ] **FUNC-03**: La generación de propuestas se ejecuta en un Web Worker (`src/domain/scheduler.worker.ts`) usando sintaxis `?worker` de Vite; la UI no se bloquea durante el cálculo y muestra un indicador de carga
- [ ] **FUNC-04**: Cuando el scheduler trunca la búsqueda al límite de 5,000 nodos, el usuario recibe una notificación advirtiendo que los resultados pueden ser subóptimos
- [ ] **FUNC-05**: La dependencia `xlsx` es reemplazada por `exceljs`; `buildExcelTemplate` y `parseExcelTemplate` son funciones `async`; todas las planillas Excel generadas anteriormente son legibles con la nueva implementación
- [ ] **FUNC-06**: El build de producción (`npm run build`) incluye el chunk del Web Worker en `dist/assets/` y la funcionalidad de generación opera correctamente en el deploy de GitHub Pages

### Pilar 3 — UI Moderna

- [ ] **UI-01**: La paleta de colores usa un sistema de tokens CSS light, neutral y de alto contraste (estilo Linear/Notion): fondo blanco/gris muy claro, texto casi negro, accent color único, sin gradientes ni glow
- [ ] **UI-02**: Los estilos de panel eliminan el glassmorphism (`backdrop-filter: blur`, bordes translúcidos) y usan bordes simples con sombras sutiles
- [ ] **UI-03**: El sistema tipográfico usa una escala de pesos y tamaños consistente (base 14px, jerarquía clara con peso en lugar de tamaño); los valores inline de `font-size` y `font-weight` dispersos en componentes son reemplazados por clases CSS
- [ ] **UI-04**: Existe un conjunto de variables CSS de espaciado (`--space-1` a `--space-12`) usadas consistentemente en lugar de valores hardcodeados (`1.5rem`, `0.75rem`, etc.)
- [ ] **UI-05**: La aplicación se ve y funciona correctamente en viewport de 1280px de ancho mínimo (resolución de notebook estándar)

## v2 Requirements

### Funcionales

- Múltiples periodos guardados en localStorage con lista de selección
- Undo/redo de cambios en el periodo activo
- Exportación a PDF del horario generado
- Dark mode con selector manual

### Calidad

- Tests de componentes UI con Testing Library para `ScheduleGrid` y `SidePanel`
- Configuración de coverage con umbral mínimo
- Prettier configurado y enforcement en CI

## Out of Scope

| Feature | Razón |
|---------|-------|
| Backend / base de datos | Sin infraestructura de servidor; LocalStorage es suficiente |
| Autenticación / cuentas | App local/institucional sin necesidad de cuentas de usuario |
| Exportación PDF | Fuera del alcance de este milestone |
| Dark mode | Sin requerimiento explícito; agrega complejidad visual sin valor inmediato |
| Migración a Tailwind CSS | El sistema de custom properties existente es funcionalmente equivalente; migrar duplicaría scope de UI |
| Zod para validación | Superficie de validación muy estrecha; manual helpers son suficientes y consistentes con las convenciones del proyecto |

## Traceability

*(Actualizado: 2026-07-07 — roadmap creado)*

| Requisito | Fase | Estado |
|-----------|------|--------|
| QUAL-01 | Phase 1 — Day Constants | Pending |
| QUAL-02 | Phase 2 — Excel Type Safety | Pending |
| QUAL-03 | Phase 2 — Excel Type Safety | Pending |
| QUAL-04 | Phase 3 — DataTables Decomposition | Pending |
| QUAL-05 | Phase 4 — Notifications and Test Coverage | Pending |
| QUAL-06 | Phase 4 — Notifications and Test Coverage | Pending |
| FUNC-01 | Phase 5 — Autosave | Pending |
| FUNC-02 | Phase 5 — Autosave | Pending |
| FUNC-03 | Phase 6 — Web Worker Scheduler | Pending |
| FUNC-04 | Phase 6 — Web Worker Scheduler | Pending |
| FUNC-06 | Phase 6 — Web Worker Scheduler | Pending |
| FUNC-05 | Phase 7 — ExcelJS Migration | Pending |
| UI-01 | Phase 8 — UI Modernization | Pending |
| UI-02 | Phase 8 — UI Modernization | Pending |
| UI-03 | Phase 8 — UI Modernization | Pending |
| UI-04 | Phase 8 — UI Modernization | Pending |
| UI-05 | Phase 8 — UI Modernization | Pending |
