# Roadmap: Planificador de Cursos — Refactor de Calidad y UI

**Project:** Planificador de Cursos — Refactor de Calidad y UI
**Created:** 2026-07-07
**Granularity:** Standard
**Coverage:** 17/17 requirements mapped

---

## Phases

- [ ] **Phase 1: Day Constants** - Extract shared weekday maps to `constants.ts`
- [ ] **Phase 2: Excel Type Safety** - Eliminate `as any` and add runtime validation in `excel.ts`
- [ ] **Phase 3: DataTables Decomposition** - Split 841-line monolith into per-entity sub-components
- [ ] **Phase 4: Notifications and Test Coverage** - Replace `alert()` with toast and fill domain test gaps
- [ ] **Phase 5: Autosave** - localStorage persistence with error handling via `usePeriod` hook
- [ ] **Phase 6: Web Worker Scheduler** - Move scheduler off UI thread and surface truncation warnings
- [ ] **Phase 7: ExcelJS Migration** - Replace `xlsx` with `exceljs` (async API, active license)
- [ ] **Phase 8: UI Modernization** - Light minimal palette, remove glassmorphism, typography and spacing tokens

---

## Phase Details

### Phase 1: Day Constants
**Goal**: A single shared source of truth for weekday labels eliminates duplication across domain and UI files
**Depends on**: Nothing
**Requirements**: QUAL-01
**Success Criteria** (what must be TRUE):
  1. `src/domain/constants.ts` exports `WEEKDAY_LABELS` and `SPANISH_TO_WEEKDAY` (with accented and unaccented variants)
  2. `validation.ts`, `excel.ts`, and `SidePanel.tsx` import from `constants.ts` with no local day-label definitions remaining
  3. All existing tests pass after the refactor
**Plans**: TBD

### Phase 2: Excel Type Safety
**Goal**: Excel import uses correct TypeScript types and validates all fields before constructing domain objects
**Depends on**: Phase 1
**Requirements**: QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. `excel.ts` compiles with no `as any` — all parse boundaries use `Record<string, unknown>` and enum fields use explicit type guards
  2. Importing a malformed Excel file (missing sheet, empty ID, invalid enum value, non-numeric weight) throws a descriptive `Error` and does not modify application state
  3. A valid round-trip (export → import) produces an identical `Period` object
**Plans**: TBD

### Phase 3: DataTables Decomposition
**Goal**: DataTables is a thin tab shell; each entity tab is an independent, maintainable component
**Depends on**: Phase 2
**Requirements**: QUAL-04
**Success Criteria** (what must be TRUE):
  1. `DataTables.tsx` is reduced to ~50 lines managing only `activeTab` state
  2. Each entity has its own file in `src/components/data-tables/`: `BlocksTab.tsx`, `TeachersTab.tsx`, `CoursesTab.tsx`, `ConflictRulesTab.tsx`, `PreferencesTab.tsx`, `TeacherAvailabilityGrid.tsx`
  3. Each tab component owns its own form state — editing one tab does not re-render the others
  4. All existing UI behaviors (add, edit, delete for each entity) work identically after decomposition
**Plans**: TBD
**UI hint**: yes

### Phase 4: Notifications and Test Coverage
**Goal**: Users see clear toast feedback on errors, and domain logic is verified against all meaningful paths
**Depends on**: Phase 3
**Requirements**: QUAL-05, QUAL-06
**Success Criteria** (what must be TRUE):
  1. No `alert()` call exists anywhere in the codebase — all import/export errors surface via a toast notification component
  2. The toast dismisses without blocking the UI and is visible without a modal overlay
  3. The test suite covers all `PreferenceKind` variants in the scheduler, all error paths in `parseExcelTemplate`, and backward-compatibility cases in `parsePeriodJson`
  4. `npm test` exits green with no skipped domain tests
**Plans**: TBD

### Phase 5: Autosave
**Goal**: The user's period survives page reloads and tab closures without any manual action
**Depends on**: Phase 4
**Requirements**: FUNC-01, FUNC-02
**Success Criteria** (what must be TRUE):
  1. Editing any data in the app causes it to be saved to localStorage within 500ms; reloading the page restores the full period without user intervention
  2. If the stored data fails `parsePeriodJson`, the user sees a toast notification explaining that the saved state was incompatible and a new period was started; the corrupted key is cleared
  3. A fresh load with no stored data starts a default period normally (no errors)
**Plans**: TBD

### Phase 6: Web Worker Scheduler
**Goal**: Generating schedule proposals does not freeze the browser, and users know when results may be incomplete
**Depends on**: Phase 5
**Requirements**: FUNC-03, FUNC-04, FUNC-06
**Success Criteria** (what must be TRUE):
  1. Clicking "Generar propuesta" shows a loading indicator; the UI remains interactive during calculation
  2. When the scheduler hits the 5,000-node cap, the user receives a toast notification that results may be suboptimal
  3. `npm run build` produces a worker chunk in `dist/assets/`; schedule generation works correctly on the GitHub Pages deploy (not just in `npm run dev`)
**Plans**: TBD

### Phase 7: ExcelJS Migration
**Goal**: Excel import and export work with an actively maintained library under a permissive license
**Depends on**: Phase 6
**Requirements**: FUNC-05
**Success Criteria** (what must be TRUE):
  1. The `xlsx` package is removed from `package.json`; `exceljs` is the sole Excel dependency
  2. `buildExcelTemplate` and `parseExcelTemplate` are `async` functions; all call sites `await` them
  3. An Excel file exported with the old `xlsx`-based implementation can be imported with the new `exceljs` implementation without data loss
  4. The `excel.test.ts` suite passes with async/await and covers the same cases as before migration
**Plans**: TBD

### Phase 8: UI Modernization
**Goal**: The app has a clean, minimal visual identity suitable for professional academic use at standard notebook resolution
**Depends on**: Phase 7
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. The color palette uses CSS tokens with white/light-gray backgrounds, near-black text, and a single accent color — no gradients, no glow effects
  2. Panels use simple borders and subtle box shadows; no `backdrop-filter: blur()` or translucent backgrounds remain in any component
  3. A spacing token scale (`--space-1` through `--space-12`) is defined in `:root` and used consistently; no hardcoded spacing values (`1.5rem`, `0.75rem`) appear inline in components
  4. The full application (grid, panels, data tables, header) is usable and visually correct at 1280px viewport width with no overflow or layout collapse
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Day Constants | 0/? | Not started | - |
| 2. Excel Type Safety | 0/? | Not started | - |
| 3. DataTables Decomposition | 0/? | Not started | - |
| 4. Notifications and Test Coverage | 0/? | Not started | - |
| 5. Autosave | 0/? | Not started | - |
| 6. Web Worker Scheduler | 0/? | Not started | - |
| 7. ExcelJS Migration | 0/? | Not started | - |
| 8. UI Modernization | 0/? | Not started | - |

---

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| QUAL-01 | Phase 1 |
| QUAL-02 | Phase 2 |
| QUAL-03 | Phase 2 |
| QUAL-04 | Phase 3 |
| QUAL-05 | Phase 4 |
| QUAL-06 | Phase 4 |
| FUNC-01 | Phase 5 |
| FUNC-02 | Phase 5 |
| FUNC-03 | Phase 6 |
| FUNC-04 | Phase 6 |
| FUNC-06 | Phase 6 |
| FUNC-05 | Phase 7 |
| UI-01 | Phase 8 |
| UI-02 | Phase 8 |
| UI-03 | Phase 8 |
| UI-04 | Phase 8 |
| UI-05 | Phase 8 |
