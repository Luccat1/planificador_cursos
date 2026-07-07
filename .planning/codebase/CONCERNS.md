# Technical Concerns

## Critical Issues

### No Persistent State
All data lives only in React memory. Closing the tab loses everything. No localStorage, no autosave, no backend. Users must re-enter data every session.

### Scheduler Blocks the Main Thread
`generateScheduleProposals` in `src/domain/scheduler.ts` runs synchronous backtracking on the UI thread. For large schedules this freezes the browser until completion.

### Silent Search Truncation
The 5,000-leaf-node cap in `scheduler.ts` (~line 166) silently stops exploring when the limit is hit, without informing the user that results may be suboptimal or incomplete.

## Technical Debt

### Excel Import Uses `as any` Casts Without Validation
`src/domain/excel.ts` (lines 75, 215–216) casts imported data with `as any` and performs no runtime validation. Malformed or unexpected Excel files can silently corrupt application state.

### `DataTables.tsx` is an 841-line Monolith
Five unrelated tabs, IIFE patterns, and all form state live in one file. Needs decomposition into focused sub-components.

### Day Translation Duplicated in Three Files
`validation.ts`, `excel.ts`, and `SidePanel.tsx` each define the same `monday → Lunes` mapping independently. Should be extracted to a shared constant.

### No Undo/Redo, No Delete Confirmations
Accidental deletes are immediate and permanent. No confirmation dialogs and no history mechanism exist.

## Performance Concerns

### `xlsx` Bundled Synchronously
The `xlsx` library is imported at module load time, increasing initial bundle size. It should be lazy-loaded since it's only needed for import/export actions.

## Maintainability

### Zero Component-Level Tests
Only one smoke test exists (`App.test.tsx`). All UI interaction logic, form validation, scheduling logic, and Excel parsing are effectively untested at the component level.

## Missing Features / Gaps

- No data persistence (localStorage, IndexedDB, or backend)
- No undo/redo history
- No delete confirmation dialogs
- No user feedback when scheduler truncates search space
- No input validation on Excel import

## Opportunities

- Move backtracking scheduler to a Web Worker to unblock the UI thread
- Extract day-name map to a shared `src/domain/constants.ts`
- Decompose `DataTables.tsx` into per-tab components
- Add runtime validation on Excel import (e.g., with `zod`)
- Implement localStorage autosave for basic persistence
- Lazy-load `xlsx` with dynamic `import()`

## Risks

### `xlsx` v0.18.5 is the Last Open-Source Version
SheetJS switched to a commercial license after v0.18.5. This version receives no security patches and has known vulnerabilities when parsing untrusted files. Malicious Excel imports are a real attack surface.

### Single Point of Failure: In-Memory State
There is no recovery path if the page crashes or is accidentally closed. All user work is lost.
