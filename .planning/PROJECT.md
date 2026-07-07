# Planificador de Cursos — Refactor de Calidad y UI

## What This Is

Aplicación web SPA en React para planificar horarios universitarios semanales. Permite definir profesores, cursos, bloques horarios, reglas de conflicto y preferencias; un algoritmo de backtracking genera propuestas de horario rankeadas. Orientada a coordinadores académicos en contexto universitario chileno.

Este milestone es un refactor completo en tres pilares ordenados: calidad de código, corrección de deficiencias funcionales críticas, y modernización de la UI.

## Core Value

Un coordinador puede generar, revisar y ajustar el horario semanal de su programa sin perder su trabajo entre sesiones.

## Requirements

### Validated

<!-- Capacidades existentes confirmadas en el codebase -->

- ✓ Usuario puede definir bloques horarios (nombre, hora inicio/fin, activo/inactivo) — existing
- ✓ Usuario puede registrar profesores con disponibilidad por día — existing
- ✓ Usuario puede registrar cursos con cantidad de sesiones semanales y bloques por sesión — existing
- ✓ Usuario puede definir reglas de conflicto entre cursos — existing
- ✓ Usuario puede definir preferencias de horario (mañana/tarde, día preferido/evitado, sesiones distribuidas) — existing
- ✓ Sistema genera hasta N propuestas de horario rankeadas por score — existing
- ✓ Usuario puede bloquear sesiones específicas para que no cambien en próximas generaciones — existing
- ✓ Usuario puede exportar/importar el periodo completo en JSON — existing
- ✓ Usuario puede exportar/importar datos via plantilla Excel — existing
- ✓ Grilla semanal visualiza sesiones con soporte multi-bloque (sesiones que ocupan 2+ bloques) — existing

### Active

<!-- Pilar 1: Calidad -->
- [ ] Dominio completamente cubierto por tests (scheduler, validation, storage, excel) sin gaps
- [ ] Sin usos de `as any` en el codebase — tipos TypeScript correctos en todo el código
- [ ] `DataTables.tsx` descompuesto en sub-componentes por entidad (bloques, profesores, cursos, conflictos, preferencias)
- [ ] Constante de días de la semana (day→label map) extraída a un archivo compartido, sin duplicación
- [ ] Feedback de errores mediante componente de notificación visual (sin `alert()`)

<!-- Pilar 2: Deficiencias funcionales -->
- [ ] Autosave automático a localStorage — el periodo se preserva al recargar/cerrar la pestaña
- [ ] Scheduler ejecutado en Web Worker — la UI no se congela durante la generación de propuestas
- [ ] Dependencia `xlsx` reemplazada por `exceljs` (licencia activa, parches de seguridad)
- [ ] Validación de runtime en importación Excel — archivos malformados no corrompen el estado

<!-- Pilar 3: UI -->
- [ ] Rediseño visual completo: estilo clean & minimal (Linear/Notion) — tipografía clara, espaciado generoso, paleta neutral
- [ ] Sistema de diseño coherente: tokens CSS para colores, espaciado, tipografía — sin valores hardcodeados dispersos

### Out of Scope

- Backend / base de datos — sin presupuesto/infraestructura para servidor; localStorage es suficiente para el caso de uso
- Múltiples periodos guardados simultáneamente — el autosave básico cubre la necesidad sin complejidad adicional
- Undo/redo — requiere arquitectura de historial significativa; diferido al próximo milestone
- OAuth / autenticación — app local/institucional sin necesidad de cuentas
- Export a PDF — fuera del alcance de este milestone
- Dark mode — agregar complejidad visual sin requerimiento explícito del usuario

## Context

**Stack actual:** React 18, Vite, TypeScript (strict), Tailwind CSS, Lucide React, xlsx v0.18.5
**Entorno:** Windows 11 / Git Bash, deploy via `npm run deploy` a GitHub Pages
**Testing actual:** Vitest + jsdom + @testing-library/react; 1 smoke test en App.test.tsx; tests de dominio existen pero con gaps en preferencias y casos negativos
**Codebase map:** `.planning/codebase/` — 7 documentos de análisis disponibles

**Problemas identificados en análisis:**
- `DataTables.tsx`: 841 líneas, 5 pestañas no relacionadas en un solo archivo
- `as any` en `excel.ts` líneas 75, 215-216 sin validación de runtime
- Mapeo día→nombre repetido en `validation.ts`, `excel.ts` y `SidePanel.tsx`
- `alert()` para todos los errores de importación/exportación
- Scheduler corre síncronamente bloqueando el UI thread
- `xlsx` v0.18.5: última versión open-source, sin parches de seguridad conocidos

## Constraints

- **Tech stack**: React 18 + Vite + TypeScript — no cambiar el framework base
- **Sin backend**: Toda persistencia debe ser client-side (localStorage)
- **Sin breaking changes de API pública**: La estructura del tipo `Period` debe mantenerse compatible con JSON exportados existentes
- **Compatibilidad**: La migración de xlsx a exceljs debe mantener compatibilidad con plantillas Excel existentes
- **Deploy**: GitHub Pages (SPA estática) — nada que requiera servidor

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| localStorage para persistencia | Sin backend, cobertura del 95% del caso de uso, implementación simple | — Pending |
| Web Worker para scheduler | Elimina el bloqueo de UI sin cambiar el algoritmo | — Pending |
| Migrar xlsx → exceljs | Licencia activa MIT, mantenimiento activo, API de mayor nivel | — Pending |
| Pilar 1 (calidad) antes que UI | Base de código sólida reduce riesgo de introducir bugs durante el rediseño | — Pending |
| Clean & minimal para UI | Adecuado para contexto académico/profesional; reduce distracciones visuales | — Pending |

## Evolution

Este documento evoluciona en cada transición de fase y milestone.

**Después de cada fase:**
1. ¿Requisitos invalidados? → Mover a Out of Scope con razón
2. ¿Requisitos validados? → Mover a Validated con referencia a la fase
3. ¿Nuevos requisitos emergentes? → Agregar a Active
4. ¿Decisiones a registrar? → Agregar a Key Decisions
5. ¿"What This Is" sigue preciso? → Actualizar si derivó

**Después de cada milestone:**
1. Revisión completa de todas las secciones
2. Check de Core Value — ¿sigue siendo la prioridad correcta?
3. Auditar Out of Scope — ¿las razones siguen vigentes?

---
*Last updated: 2026-07-07 after initialization*
