# Project State: Planificador de Cursos — Refactor de Calidad y UI

**Last updated:** 2026-07-07
**Updated by:** roadmapper (new-project initialization)

---

## Project Reference

**Core value:** Un coordinador puede generar, revisar y ajustar el horario semanal de su programa sin perder su trabajo entre sesiones.

**Current focus:** Phase 1 — Day Constants

**Milestone:** Refactor de Calidad y UI (3 pillars: quality foundation, functional fixes, UI modernization)

---

## Current Position

**Current phase:** 1 — Day Constants
**Current plan:** None started
**Status:** Not started

```
Progress: [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]
           1   2   3   4   5   6   7   8
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases total | 8 |
| Phases complete | 0 |
| Requirements total | 17 |
| Requirements complete | 0 |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Pilar 1 before UI | Clean codebase reduces risk of introducing bugs during visual redesign |
| localStorage for persistence | No backend; covers 95% of use case with minimal complexity |
| Web Worker for scheduler | Eliminates UI freeze without changing the algorithm |
| xlsx → exceljs | Active MIT license, TypeScript types bundled, security-patched |
| No Tailwind migration | Existing CSS custom property system is functionally equivalent; migration would double UI scope |
| Custom toast OR sonner | Decision deferred to Phase 4 plan — either approach is acceptable |
| Manual validation helpers | Narrow surface area; consistent with existing `Error`-throw convention in domain functions |

### Critical Pitfalls (from research)

1. **ExcelJS async callers** — `buildExcelTemplate`/`parseExcelTemplate` must become `async`; every call site must `await` them or the download produces `[object Promise]`
2. **Vite worker production bundle** — must use `?worker` import syntax; verify `dist/assets/` contains a worker chunk before deploying
3. **`as any` on scope/kind fields** — invalid enum values stored verbatim cause scheduler to silently ignore all preferences
4. **Form state in DataTables decomposition** — each tab must own its own form state; do NOT lift to parent or every keystroke re-renders all tabs
5. **localStorage stale data** — always load through `parsePeriodJson`; on failure clear the key and fall back to `createDefaultPeriod`

### Open Questions

1. Toast library: custom ~60-line component vs `sonner@^1.5.0` — decide before Phase 4
2. Excel import error behavior: throw on first invalid row (option a) vs skip-and-warn (option b) — research recommends option a; confirm before Phase 2

### Architecture Notes

- All state lives in `App.tsx` — no external state library
- `scheduler.ts` must stay pure (thin worker wrapper only); Vitest/jsdom cannot run Workers
- `DataTables.tsx` is 841 lines — decompose into `src/components/data-tables/` subfolder
- Day-label maps duplicated in `validation.ts`, `excel.ts`, `SidePanel.tsx` — extract to `src/domain/constants.ts`
- `Period` type compatibility must be maintained for existing JSON exports

---

## Blockers

None.

---

## Session Continuity

**Next action:** Run `/gsd:plan-phase 1` to plan Phase 1 (Day Constants — QUAL-01)

**To resume:** Read this file + `.planning/ROADMAP.md` for full context.
