# Research Summary

**Project:** Planificador de Cursos — Refactor de Calidad y UI
**Synthesized:** 2026-07-07
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Recommended Stack Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Excel library | Replace `xlsx` with `exceljs@4.4.0` | xlsx is dead-end (license frozen at v0.18.5, no security patches); ExcelJS is MIT-licensed, actively maintained, TypeScript types bundled |
| Web Workers | Vite `?worker` import syntax (built-in) | Zero config, TypeScript-safe, stable across Vite v2–v6; no additional dependency or plugin needed |
| Auto-save | Custom `usePeriod` hook + `useEffect` debounce | Standard React pattern; no library needed; integrates naturally with existing `parsePeriodJson` |
| Toast notifications | Custom `Toast` component (~60 lines) OR `sonner@^1.5.0` | Custom fits the "no new dependency" convention from FEATURES.md; sonner (4 KB, MIT) is the justified fallback if custom proves insufficient |
| CSS system | Keep existing CSS custom properties; update token values only | Tailwind is not installed; existing token system is architecturally equivalent to Tailwind v4 `@theme`; adding Tailwind would double the scope of the UI phase |
| Runtime validation | Manual `requireString`/`requireEnum` helpers in `excel.ts` | Validation surface is narrow (6 sheets, 3–5 fields each); manual helpers fit existing convention of `Error` throws in domain functions; no Zod dependency needed |

**Critical note on ExcelJS migration:** The entire ExcelJS API is async (`workbook.xlsx.load()`, `workbook.xlsx.writeBuffer()`). The current xlsx call sites in `App.tsx` are synchronous. `buildExcelTemplate` and `parseExcelTemplate` must become `async` functions, and all call sites must be updated to `await` them before the migration is complete. Failure to do this produces a Blob of `[object Promise]` — a silently corrupted download.

---

## Table Stakes Features (must do)

These are the Pilar 1 quality requirements that must complete before Pilar 2 or Pilar 3 work begins.

1. **Decompose `DataTables.tsx`** — 841-line file with 5 unrelated tabs, IIFE anti-pattern for the availability editor, and all form state co-located. Split into `data-tables/` subfolder with one file per entity tab plus `TeacherAvailabilityGrid.tsx` as a standalone sub-component.

2. **Eliminate all `as any` in `excel.ts`** — 8 occurrences, all in `excel.ts` (lines 75, 118, 142, 158, 176, 196, 210, 215–216). Replace with `Record<string, unknown>` at parse boundaries and explicit type guards for enum fields (`PreferenceScope`, `PreferenceKind`). The `scope`/`kind` fields specifically accept invalid values silently, causing preferences to be ignored by the scheduler without any error.

3. **Runtime validation on Excel import** — Malformed or re-saved Excel files produce `CellRichTextValue` objects instead of strings; numeric cell IDs parse as numbers; enum typos are stored verbatim. Add `requireString`/`requireEnum` helpers; validate all required fields and enum memberships before constructing domain objects.

4. **Replace `alert()` with notification component** — All import/export errors in `App.tsx` currently use blocking `alert()`. Add a toast component (custom or sonner) wired to `App.tsx` state; pass an `onNotify` callback to child components that trigger errors.

5. **Fill domain test gaps** — `excel.test.ts` has 1 test with no negative cases. `scheduler.test.ts` has gaps in preference scoring. Add: all `PreferenceKind` variants tested in scheduler; all error paths in `parseExcelTemplate` (missing sheet, empty id, invalid enum, non-numeric weight); `parsePeriodJson` backward compatibility cases.

6. **Extract day-name constant to `src/domain/constants.ts`** — `dayTranslations` duplicated in `validation.ts`, `excel.ts`, and `SidePanel.tsx`. Export both forward (`WEEKDAY_LABELS: Record<Weekday, string>`) and inverse (`SPANISH_TO_WEEKDAY`) maps; the inverse must include both accented and accent-less variants (`"miércoles"` and `"miercoles"`).

---

## Differentiators (nice to have)

- **`TeacherAvailabilityGrid` as truly standalone component** — the IIFE pattern inside teachers tab is eliminated as part of DataTables decomposition, but making the grid component independently testable with a clean props interface (`teacher`, `activeBlocks`, `onUpdateTeacher`, `onBack`) adds lasting quality.
- **Typed internal row interfaces in `excel.ts`** — define `AvailabilityRow`, `TeacherRow`, `CourseRow` interfaces to make the parse pipeline self-documenting. Pure structural change, no behavior change.
- **Scheduler truncation notification** — the backtracking algorithm silently caps at 5,000 nodes. Users never know when results are suboptimal. One toast call when the cap is hit costs ~2 lines and closes a silent UX gap.
- **`parseBoolean` tests** — this function has branching logic and is currently untested. 3–4 cases cover it fully.
- **Clean & minimal CSS redesign (Pilar 3)** — replace dark cyberpunk palette with light, neutral Linear/Notion aesthetic. Only token values in `:root` need to change (colors, radii, shadows); token names and class names stay the same. Remove `backdrop-filter: blur()` glassmorphism from `.panel`. This is visual-only with zero logic risk.

---

## Phase Build Order

Ordered by dependency and risk. Each step must be independently verified before the next begins.

### Phase 1: Foundation (Pilar 1 — Code Quality)

**Rationale:** De-risks all subsequent work. Logic refactors on a clean codebase are safer. UI refactors on untested code introduce confounded debugging.

1. `src/domain/constants.ts` — extract day-name maps. Zero risk, unblocks everything.
2. Eliminate `as any` + add runtime validation in `excel.ts` — single file, co-located changes.
3. Decompose `DataTables.tsx`:
   - Extract `TeacherAvailabilityGrid` first (most isolated, clearest interface)
   - Extract `PreferencesTab`, `BlocksTab`, `ConflictRulesTab` (no cross-tab dependencies)
   - Extract `CoursesTab`, `TeachersTab`
   - Reduce `DataTables.tsx` to tab shell (~50 lines)
4. Add toast notification component — standalone addition to `App.tsx`; no refactor required.
5. Fill domain test gaps — test the refactored code, not the old code.

### Phase 2: Functional Completeness (Pilar 2 — Critical Deficiencies)

**Rationale:** These require Pilar 1 validation to be complete (stale storage data must pass through `parsePeriodJson`; ExcelJS migration is safer after `as any` is already eliminated).

1. `usePeriod` hook — replace `useState<Period>` in App.tsx; localStorage sync via `useEffect`; version storage key as `planificador_period_v1`.
2. `useScheduler` hook + `scheduler.worker.ts` — move `generateScheduleProposals` call off the UI thread; use Vite `?worker` syntax; keep `scheduler.ts` pure (worker is thin wrapper only — Vitest jsdom cannot run Workers).
3. xlsx → ExcelJS migration — update signatures to `async`, update all call sites, update `excel.test.ts` to `async/await`, normalize cell values with `String(cell.value ?? "").trim()`, pass `Uint8Array` directly to `new Blob()`.

### Phase 3: UI Modernization (Pilar 3)

**Rationale:** Last — visual changes on a stable, tested codebase. If visual and logic changes are interleaved, regressions are hard to attribute.

1. Update CSS token values in `:root` (light palette, reduced radii, no glow shadows).
2. Remove glassmorphism from `.panel` and `.header`.
3. Add spacing token variables (`--space-1` through `--space-12`); migrate inline styles to CSS classes.
4. Typography adjustments (14px base, weight-based hierarchy).

---

## Top Pitfalls to Avoid

**1. ExcelJS async API breaking synchronous callers (CRITICAL)**
Every ExcelJS operation is async. The current xlsx call sites in App.tsx are synchronous. If call sites are not updated to `await` the new async functions, the app silently produces a Blob of `[object Promise]` as a download, and `setPeriod` receives a Promise object instead of a Period. Prevention: make `buildExcelTemplate` and `parseExcelTemplate` async first, update all call sites, run the existing round-trip test.

**2. Vite Web Worker production bundle failure (CRITICAL)**
`new Worker('./file.js')` works in dev but the worker file is absent from the production `dist/` because Vite's Rollup build does not know to chunk it. This is a production-only regression invisible in `npm run dev`. Prevention: always use `import SchedulerWorker from './scheduler.worker?worker'` (Vite `?worker` syntax); verify with `npm run build` and inspect `dist/assets/` for a worker chunk before deploying.

**3. `as any` on `scope`/`kind` fields silently ignoring preferences (HIGH)**
Lines 215–216 of `excel.ts` cast `scope` and `kind` with `as any`. A trailing space or wrong case in an Excel cell stores an invalid enum value. The scheduler silently skips all preferences with invalid kinds — the schedule generates but ignores user-defined preferences. Prevention: validate against an explicit `VALID_SCOPES` array after `.trim().toLowerCase()` and throw a descriptive error.

**4. Form state lifted to DataTables parent after decomposition (MODERATE)**
When splitting DataTables.tsx, the instinct is to lift all form state to the new parent. This causes every keystroke in the teacher name field to re-render all 5 tabs. Prevention: each tab component owns its own form state; only `period` and `onChangePeriod` are passed as props; `activeTab` stays in the DataTables shell.

**5. localStorage stale data crashing the app on version upgrade (MODERATE)**
The stored `Period` JSON may have been written by an older schema version. If a new required field is accessed on a stale object, the app crashes on load and loops — the bad data is never cleared. Prevention: load stored data through `parsePeriodJson` (already throws on malformed input); on failure, clear the key and fall back to `createDefaultPeriod`; version the key as `planificador_period_v1` to enable clean migration on future schema changes.

---

## Open Questions

These require a decision before or during execution. None block research but some block implementation.

1. **Toast library vs custom component** — FEATURES.md and ARCHITECTURE.md recommend a custom ~60-line toast; STACK.md recommends `sonner@^1.5.0`. Both work. Decision needed: is sonner an acceptable new dependency given the project convention of "no new dependency for narrow use cases"? Either choice is fine — just pick one before Pilar 1 Phase 4.

2. **Scheduler truncation behavior** — The algorithm silently caps at 5,000 nodes and returns whatever partial results exist. Is a toast warning sufficient, or should the cap be raised/configurable? This is a UX policy question, not a technical one.

3. **Excel import error behavior** — When `parseExcelTemplate` finds an invalid enum value (e.g., a bad `PreferenceScope`), should it: (a) throw and reject the entire file, or (b) skip the invalid row and surface a warning? Currently the code silently accepts invalid values. Option (a) is simpler to implement; option (b) is more user-friendly. Recommendation: option (a) for this milestone — simpler, safer, consistent with the existing convention of domain functions throwing `Error`.

4. **`parsePeriodJson` stale-data behavior** — When autosave loads a stored Period that fails validation, should the app: (a) silently start fresh, or (b) notify the user "Saved state was incompatible with the current version; a new period was started"? Option (b) is the right UX. Confirm before implementing `usePeriod`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| ExcelJS migration patterns | MEDIUM-HIGH | API well-documented; async behavior confirmed; exact v4.4.0 patch not verified via live npm |
| Vite `?worker` syntax | HIGH | Stable across Vite v2–v6; confirmed in both STACK.md and ARCHITECTURE.md |
| DataTables decomposition boundaries | HIGH | Based on direct codebase inspection of the 841-line file |
| localStorage patterns | HIGH | Standard web platform behavior; `parsePeriodJson` already handles malformed input |
| sonner React 19 compatibility | MEDIUM | Training data only; recommend `npm info sonner` verification on install |
| CSS token refactor (no Tailwind) | HIGH | Verified: Tailwind not in package.json; existing system is structurally equivalent |
| Manual validation over Zod | HIGH | Validated against CONVENTIONS.md; domain functions already use `Error` throws; surface area is narrow |

**Overall confidence: HIGH** — all key findings are grounded in direct codebase inspection, not assumptions.
