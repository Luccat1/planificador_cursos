# Domain Pitfalls

**Domain:** React 18 + Vite + TypeScript SPA — quality refactor + UI milestone
**Researched:** 2026-07-07
**Stack:** React 19 (package.json), Vite 6, TypeScript 5.7 strict, Tailwind CSS (planned), xlsx → ExcelJS migration

---

## Critical Pitfalls

### Pitfall 1: ExcelJS async API — the entire API is Promise-based

**What goes wrong:** The current `excel.ts` uses the xlsx API synchronously: `XLSX.write(wb, { type: "array" })` returns an `ArrayBuffer` directly, and `XLSX.read(buffer, { type: "array" })` is also synchronous. ExcelJS's equivalent operations (`workbook.xlsx.writeBuffer()`, `workbook.xlsx.load(buffer)`) are both **async and return Promises**. If the developer wraps ExcelJS calls in the existing synchronous function signatures, they will return `Promise<ArrayBuffer>` instead of `ArrayBuffer`, silently breaking `buildExcelTemplate` and `parseExcelTemplate` in `App.tsx` — the callers do not `await` the result.

**Why it happens:** The xlsx library was designed for synchronous browser environments. ExcelJS was designed for Node.js-first workflows and exposes a fully async interface even for browser use.

**Consequences:**
- `buildExcelTemplate` returning a Promise (instead of an ArrayBuffer) causes `new Blob([buffer])` in `App.tsx` line 65 to produce a blob of `[object Promise]` — the downloaded file is corrupted and unopenable.
- `parseExcelTemplate` returning a Promise causes `setPeriod(parsed)` to receive a Promise object, corrupting React state immediately.
- TypeScript will catch this **only if** the callers are typed strictly. Because `App.tsx` currently inlines the result directly, the TS error may be obscured by existing `as any` patterns.
- The existing round-trip test in `excel.test.ts` will fail at the test level, giving a clear signal — but only if tests are run.

**Prevention:**
1. Change both `buildExcelTemplate` and `parseExcelTemplate` signatures to `async` functions returning `Promise<ArrayBuffer>` and `Promise<Period>` respectively.
2. Update all call sites in `App.tsx`: `handleExportExcel` and `handleImportExcel` must become async handlers (use `async/await` inside `FileReader.onload` callback or restructure to use the Blob/File API with Promises).
3. Update the round-trip test in `excel.test.ts` to `await` both functions.
4. Note: `FileReader.onload` callbacks cannot be `async` in the standard sense — restructure using `new Promise<ArrayBuffer>((resolve) => { reader.onload = e => resolve(e.target.result) })` or use `file.arrayBuffer()` (the modern File API).

**Detection:** TypeScript errors on `await`-less usage of the updated async functions. Test failure in `excel.test.ts` if tests are run after migration.

**Phase:** Pilar 2 — xlsx → ExcelJS migration.

---

### Pitfall 2: ExcelJS cell value types differ from xlsx `sheet_to_json` output

**What goes wrong:** `XLSX.utils.sheet_to_json<any>()` returns row objects where every value is a JavaScript primitive: numbers as `number`, strings as `string`, booleans coerced from cell content. ExcelJS iterates rows/cells with a typed `cell.value` property that can be a `CellRichTextValue`, `CellHyperlinkValue`, `CellFormulaValue`, `CellSharedFormulaValue`, `CellDateValue`, or `null` — not a plain string/number. Reading `row.getCell('id').value` from a numeric cell returns a `number`, but from a cell that was entered as text returns a `string`. If the exported file was opened and re-saved by a user in Excel, numeric IDs (e.g., `t-1` written as text) can be stored as numbers, causing `String(cell.value)` to produce `"1"` instead of `"t-1"`.

**Why it happens:** ExcelJS exposes raw OOXML cell types. The xlsx library normalized everything to primitives via its `sheet_to_json` utility.

**Consequences:**
- `teacherId`, `blockId`, and similar string IDs fail cross-reference lookups (e.g., `teacherAvailabilities.get(teacherId)` returns `undefined`).
- `parseBoolean(row.activo)` receives an object `{ richText: [...] }` instead of `"SÍ"`, defaulting silently to `true` for every row.
- No immediate crash — silent data corruption that only surfaces when the schedule generator finds no valid sessions.

**Prevention:**
1. When reading cells, always normalize: `String(cell.value ?? "").trim()`.
2. Guard against rich text objects: `typeof val === 'object' && val !== null && 'richText' in val ? val.richText.map(r => r.text).join('') : String(val)`.
3. Keep the existing `parseBoolean` helper and ensure it receives a string after normalization.
4. Add a Zod schema (or manual validation) to validate the parsed `Period` shape before calling `setPeriod`. This was already identified as an opportunity in `CONCERNS.md`.

**Phase:** Pilar 2 — xlsx → ExcelJS migration. Pilar 1 (validation) is a prerequisite.

---

### Pitfall 3: Vite Web Worker bundling requires explicit `?worker` import syntax

**What goes wrong:** In standard browser code, you write `new Worker('./scheduler.worker.js')`. In Vite, this syntax works in development but **breaks in production builds** because Vite does not know to bundle the worker file separately. The worker file ends up missing from the `dist/` output, and the GitHub Pages deploy silently fails to load the worker, producing `new Worker(...)` with a 404.

**Why it happens:** Vite uses Rollup for production builds. Without the `?worker` query suffix, Vite treats the worker file as an ordinary module import and does not generate a separate chunk for it. The dev server serves all files directly from disk so the failure is invisible in development.

**Consequences:**
- The scheduler silently fails on production (GitHub Pages), reverting to no results generated.
- No TypeScript error. No console error during `npm run dev`. Failure only appears post-`npm run deploy`.
- This is a **production-only regression** — extremely dangerous given the current deploy workflow.

**Prevention:**
1. Use Vite's official worker import syntax:
   ```typescript
   import SchedulerWorker from './scheduler.worker?worker';
   const worker = new SchedulerWorker();
   ```
2. The worker file must be a separate `.worker.ts` file (not inline).
3. Alternatively, use `new Worker(new URL('./scheduler.worker.ts', import.meta.url), { type: 'module' })` — this is also understood by Vite and works in production.
4. Test the production build (`npm run build && npx serve dist`) before deploying.

**Detection:** Only appears in production build. Run `npm run build` and check `dist/assets/` for a separate worker chunk file.

**Phase:** Pilar 2 — Web Worker implementation.

---

### Pitfall 4: TypeScript types for Worker message passing require manual discipline

**What goes wrong:** `Worker.postMessage(data)` accepts `any`. Without explicit typed message interfaces, the worker's input and output types are unchecked. In this project, `generateScheduleProposals` receives a `Period` object and returns `ScheduleProposal[]`. When these are passed through `postMessage`, structured cloning serializes them — but if `Period` contains any non-serializable value (e.g., a `Date` object, a `Map`, a function), the `postMessage` call throws a `DataCloneError` at runtime with no TypeScript warning.

**Why it happens:** The `Period` type in `types.ts` is a plain object with only string/number/boolean/array fields — currently safe for structured cloning. But the `ScheduleProposal[]` return type includes `PlacedSession[]` which also appears safe. The risk is future type additions (e.g., adding a `Map` for caching inside the worker) that break serialization silently.

**Consequences:**
- `DataCloneError` thrown synchronously inside `postMessage` — the scheduler call site crashes with no schedule generated.
- TypeScript does not prevent this.
- If the worker encounters an unhandled error, `worker.onerror` fires but if there is no error handler, it is silently swallowed in some environments.

**Prevention:**
1. Define explicit typed message interfaces:
   ```typescript
   // scheduler.worker.ts
   export type WorkerInput = { period: Period; maxAlternatives: number };
   export type WorkerOutput = { proposals: ScheduleProposal[] } | { error: string };
   ```
2. Only use plain-object types (no `Map`, `Set`, `Date`, functions) across the message boundary.
3. Always attach `worker.onerror` and `worker.onmessageerror` handlers.
4. In the React component, disable the "Generate" button while the worker is running; re-enable on message receipt or error.

**Phase:** Pilar 2 — Web Worker implementation.

---

### Pitfall 5: Web Worker files are not covered by Vitest's jsdom environment

**What goes wrong:** Vitest runs tests in jsdom, which does not implement the `Worker` constructor. Any test that imports a file that directly references `new Worker(...)` or `new SchedulerWorker()` will fail with `ReferenceError: Worker is not defined`. The existing `scheduler.test.ts` tests call `generateScheduleProposals` directly — but if the scheduler is refactored to only exist inside the worker file, those tests break.

**Why it happens:** jsdom does not emulate Web Workers. The Node.js test environment has no Worker implementation.

**Consequences:**
- All domain-level scheduler tests break unless the pure scheduling logic is kept separate from the worker scaffolding.
- This forces a specific architecture: the worker file should be a thin wrapper that imports the pure `generateScheduleProposals` function, not re-implement it.

**Prevention:**
1. Keep `scheduler.ts` as the pure domain function (no Worker references). Tests continue to import and test it directly.
2. Create `scheduler.worker.ts` as a thin entry point that imports from `scheduler.ts` and handles `onmessage`/`postMessage`.
3. Tests never import from `scheduler.worker.ts`.
4. If tests need to exercise the Worker boundary, mock the Worker class in the test setup.

**Phase:** Pilar 2 — Web Worker implementation. Architecture decision must be made before writing worker code.

---

## Moderate Pitfalls

### Pitfall 6: localStorage `QuotaExceededError` silently corrupts autosave

**What goes wrong:** `localStorage.setItem(key, value)` throws a synchronous `QuotaExceededError` (a `DOMException`) when storage is full (~5MB across all origins in most browsers). A serialized `Period` with many proposals cached would be modest in size, but if the autosave writes `proposals` arrays (which can contain 100 × N session objects), the JSON can grow large quickly. If the error is not caught, the React event handler crashes silently (from the user's perspective) and the next page load finds no saved state.

**Why it happens:** The browser storage quota is per-origin and shared across all apps on the same origin. GitHub Pages apps share `github.io` origin storage with all other GitHub Pages sites.

**Consequences:**
- User closes tab believing work is saved; re-opens to find an empty default period.
- No visible error (unless explicitly caught and surfaced).
- GitHub Pages deployment specifically: `username.github.io` shares origin with all other `username.github.io/*` projects, compounding the quota risk.

**Prevention:**
1. Only save the `Period` object, not `ScheduleProposal[]`. Proposals are derived data and can be regenerated.
2. Wrap `localStorage.setItem` in a try/catch and surface a notification via the planned notification component (not `alert()`).
3. Estimate size before writing: `JSON.stringify(period).length` as a rough byte count; warn if approaching 2MB.
4. Use `debounce` (e.g., 500ms) on the autosave to avoid writing on every keystroke.

**Phase:** Pilar 2 — autosave implementation.

---

### Pitfall 7: React state and localStorage diverge on stale reads at initialization

**What goes wrong:** The autosave pattern reads from localStorage in the `useState` initializer: `useState<Period>(() => loadFromLocalStorage() ?? createDefaultPeriod(...))`. If `loadFromLocalStorage()` returns a `Period` object that was saved by an older version of the code (missing a field added later, e.g., a new required field on `Course`), the app initializes with an incomplete object. Downstream code that assumes the field exists (e.g., `course.blocksPerSession` used in `scheduler.ts`) throws.

**Why it happens:** localStorage is schema-less and persists across deploys. The stored JSON may have been written by any previous version of the app.

**Consequences:**
- App crashes on load for users with old saved data — a silent data migration problem that only surfaces in production.
- The stored value is never cleared, so the crash repeats on every reload until localStorage is manually cleared.

**Prevention:**
1. Pass loaded data through the same Zod/validation schema used for JSON import (`parsePeriodJson` in `storage.ts` already exists and throws on malformed data).
2. If validation fails, log the error, clear the stale key, and fall back to `createDefaultPeriod`. Surface a notification: "Estado guardado incompatible con la versión actual — se inició un periodo nuevo."
3. Version the localStorage key: `planificador_cursos_v1_period`. When the data shape changes in a future milestone, increment the key version.

**Phase:** Pilar 2 — autosave implementation. Requires Pilar 1 (validation) to be complete first.

---

### Pitfall 8: `DataTables.tsx` decomposition breaks form state sharing

**What goes wrong:** All form state (`teacherName`, `courseName`, `prefScope`, etc.) currently lives in the single `DataTables` component. When splitting into `TeachersTab`, `CoursesTab`, etc., developers instinctively lift state to the new parent (`DataTables`) or pass it as props. But form state for a tab that is not currently visible does not need to be shared — it only needs to persist while the tab is mounted. If state is incorrectly lifted, the parent re-renders on every form keystroke across all 5 tabs.

**Why it happens:** In a monolith, all state is co-located. Splitting creates decisions about where state lives. The default instinct (lift everything) leads to unnecessary coupling.

**Consequences:**
- Performance: every character typed in the teacher name field re-renders the courses, blocks, rules, and preferences tabs (even though they are hidden).
- Prop drilling: parent passes 20+ form state setters as props to each sub-component, creating tight coupling that defeats the purpose of decomposition.
- Existing tests (if added before decomposition) that render `DataTables` and interact with form fields may break if the field now lives in a sub-component that must be activated (tab click) first.

**Prevention:**
1. Keep form state local to each tab sub-component (`TeachersTab` owns `teacherName`, etc.).
2. Only `period` and `onChangePeriod` need to be passed as props to each tab.
3. `activeTab` state stays in `DataTables` (the tab controller).
4. The `editingAvailabilityTeacherId` state crosses concerns (teacher list renders availability editor) — it belongs in `TeachersTab`, not in the parent.
5. Write tests for each sub-component in isolation before wiring them into `DataTables`.

**Phase:** Pilar 1 — `DataTables.tsx` decomposition.

---

### Pitfall 9: Tailwind CSS class specificity conflicts with existing CSS custom properties

**What goes wrong:** The current `styles.css` uses a CSS custom property system (`--accent-color`, `--bg-primary`, etc.) with semantic names. Tailwind generates utility classes with their own specificity. A common conflict pattern: a component has `className="panel"` (from `.panel` in `styles.css`) and a developer adds `className="panel bg-white"` to override the background. But `.panel` sets `background: var(--bg-card)` — the Tailwind `bg-white` class has equal specificity (one class each) and the winner depends on source order in the final bundle. In Vite's build, the order between `styles.css` and Tailwind's generated CSS is non-deterministic without explicit configuration.

**Why it happens:** Tailwind's utility classes (`.bg-white`) and handwritten semantic classes (`.panel`) both have single-class specificity. The cascade winner is determined by declaration order.

**Consequences:**
- Visual inconsistency: some components show the dark theme, others show the overriding Tailwind class.
- Hard to debug: works in dev (where HMR injects styles in a specific order) but breaks in production build.
- The glassmorphism effects (`backdrop-filter: blur(12px)`) on `.panel` cannot be expressed as a single Tailwind utility — they require Tailwind plugin configuration or a custom class.

**Prevention:**
1. Do not mix Tailwind utilities with the existing `.panel`, `.btn-*`, `.session-card`, etc. semantic classes during the refactor. Choose one approach per component.
2. Migrate the CSS custom properties to Tailwind theme tokens in `tailwind.config.js`:
   ```js
   theme: { extend: { colors: { accent: '#6366f1', 'bg-primary': '#090d16' } } }
   ```
   This allows `bg-accent`, `text-bg-primary` etc., keeping token semantics.
3. Remove `styles.css` classes as each component is fully migrated to Tailwind — do not leave orphaned classes.
4. Use Tailwind's `@layer components` directive for complex multi-property classes like `.panel` instead of raw CSS.
5. Configure `content` in `tailwind.config.js` to scan all `.tsx` files to avoid purging needed classes.

**Phase:** Pilar 3 — UI redesign.

---

## Minor Pitfalls

### Pitfall 10: ExcelJS does not produce an `ArrayBuffer` directly — use `.buffer` on the Uint8Array

**What goes wrong:** `workbook.xlsx.writeBuffer()` resolves to a `Buffer` (Node.js) or a `Uint8Array` (browser via the browser build). The call site in `App.tsx` passes it to `new Blob([buffer])` — this works correctly for `Uint8Array`. However, if the developer reads the ExcelJS docs and attempts `workbook.xlsx.writeBuffer().then(buf => buf.buffer)` to get an `ArrayBuffer`, they get the underlying `ArrayBuffer` of the Uint8Array — which may be a shared buffer if ExcelJS reuses internal buffers. Passing a shared `ArrayBuffer` to `Blob` or transferring it to a Web Worker can produce unexpected truncation.

**Prevention:** Pass the `Uint8Array` directly to `new Blob([uint8Array])`. Do not unwrap `.buffer`. Update the return type of `buildExcelTemplate` from `ArrayBuffer` to `Uint8Array` or keep `ArrayBuffer` but copy it: `uint8Array.buffer.slice(0)`.

**Phase:** Pilar 2 — xlsx → ExcelJS migration.

---

### Pitfall 11: Vite dev server HMR disconnects the Web Worker on hot reload

**What goes wrong:** During development with `vite --host 127.0.0.1`, every file save triggers HMR. If the React component that owns the Worker instance re-renders due to HMR (not a full reload), the component may create a new `Worker` instance without terminating the old one. The old worker continues running the backtracking algorithm and posts a message to an event listener that no longer exists. Multiple workers accumulate in memory across HMR cycles.

**Why it happens:** Vite HMR replaces module boundaries. If the Worker instantiation is inside a component's render path or a `useEffect` without a cleanup function, the old worker is orphaned.

**Consequences:**
- Memory leak during development (not production).
- Ghost `onmessage` callbacks firing after component replacement, causing state updates on unmounted components — React 18 dev mode may surface these as warnings.

**Prevention:**
1. Instantiate the Worker in a `useEffect` with a cleanup:
   ```typescript
   useEffect(() => {
     const worker = new SchedulerWorker();
     // ... attach handlers
     return () => worker.terminate();
   }, []);
   ```
2. Use a `useRef` to hold the worker instance so it is not recreated on every render.

**Phase:** Pilar 2 — Web Worker implementation.

---

### Pitfall 12: Day-name constant extraction can silently break the Excel import translation table

**What goes wrong:** `CONCERNS.md` correctly identifies that `monday → Lunes` mapping is duplicated across `validation.ts`, `excel.ts`, and `SidePanel.tsx`. When extracting to a shared `src/domain/constants.ts`, the Excel parser specifically needs the **inverse** map (`Lunes → monday`) and a normalization variant (`miercoles → wednesday` without accent). If the shared constant only exports the forward map, `excel.ts` will define the reverse map locally anyway — or worse, someone will derive it programmatically and miss the accent-less variant `"miercoles"` (line 111 of `excel.ts`).

**Prevention:** The shared constants file must export both:
- `DAY_LABELS: Record<Weekday, string>` — `{ monday: "Lunes", ... }`
- `SPANISH_TO_WEEKDAY: Record<string, Weekday>` — includes both accented and accent-less keys for "miércoles"/"miercoles".

**Phase:** Pilar 1 — constant extraction.

---

### Pitfall 13: `as any` casts in `excel.ts` for `scope` and `kind` fields mask enum mismatches on import

**What goes wrong:** Lines 215–216 of `excel.ts` cast `scope` and `kind` fields with `as any` when constructing `Preference` objects. If an Excel file contains a typo in these fields (e.g., `"teacher "` with trailing space, or `"prefermorning"` in lowercase), the app accepts the value and stores it. When `scheduler.ts` later compares `pref.kind === "preferMorning"`, the condition never matches, causing preferences to be silently ignored — the schedule generates without applying the preference, with no error surfaced.

**Prevention:**
1. Validate `scope` against the `PreferenceScope` union and `kind` against `PreferenceKind` after parsing.
2. Use `String(row.alcance).trim()` and check inclusion in an explicit array of valid values.
3. Reject or warn on invalid values rather than accepting them silently.
4. This is a specific case of the general "runtime validation on Excel import" opportunity identified in `CONCERNS.md`.

**Phase:** Pilar 1 — validation improvements. Prerequisite to Pilar 2 ExcelJS migration.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| xlsx → ExcelJS | Async API breaks synchronous callers in App.tsx | Update all call sites to async/await before migrating the implementation |
| xlsx → ExcelJS | Cell value type normalization | Always `String(cell.value ?? "").trim()`; guard rich text objects |
| xlsx → ExcelJS | Uint8Array vs ArrayBuffer for Blob creation | Pass Uint8Array directly; do not unwrap `.buffer` |
| Web Worker (Vite) | Production bundle missing worker file | Use `?worker` import suffix or `new URL(..., import.meta.url)` pattern |
| Web Worker (TypeScript) | Untyped postMessage | Define explicit `WorkerInput`/`WorkerOutput` interfaces |
| Web Worker (Vitest) | Worker constructor missing in jsdom | Keep pure scheduler logic in `scheduler.ts`; worker file is just a thin wrapper |
| Web Worker (HMR) | Orphaned workers accumulate in dev | useEffect cleanup with `worker.terminate()` |
| localStorage autosave | QuotaExceededError on GitHub Pages shared origin | Save only Period (not proposals); catch and surface errors |
| localStorage autosave | Stale saved data on version upgrade | Validate via existing parsePeriodJson; version the storage key |
| DataTables decomposition | Form state lifted incorrectly causing re-render cascade | Keep form state local to each tab sub-component |
| DataTables decomposition | Tests break when fields move to sub-components requiring tab activation | Write sub-component tests before wiring into DataTables |
| Tailwind CSS refactor | Specificity conflicts with existing semantic CSS classes | Migrate one component at a time; remove old CSS class simultaneously |
| Tailwind CSS refactor | Complex multi-property rules (glassmorphism) cannot map to single utility | Use `@layer components` for `.panel`, `.session-card` equivalents |
| Constant extraction | Inverse day map missing accent-less variant | Export both forward and inverse maps; include both "miércoles"/"miercoles" |
| as any removal | scope/kind enums silently accept invalid Excel values | Validate against explicit union arrays before constructing Preference objects |

---

## Sources

- `src/domain/excel.ts` — direct code analysis (lines 75, 93, 98, 215–216)
- `src/domain/scheduler.ts` — direct code analysis (backtracking, line 166 cap, synchronous execution)
- `src/App.tsx` — call site analysis for Excel and scheduler functions
- `src/components/DataTables.tsx` — monolith structure analysis (841 lines, form state co-location)
- `src/styles.css` — CSS custom properties system analysis
- `.planning/codebase/CONCERNS.md` — verified issue references
- `.planning/PROJECT.md` — constraint and requirement verification
- MDN Web Workers API documentation — Worker message passing, structured cloning, cross-origin restrictions (HIGH confidence, verified via fetch)
- ExcelJS README / API knowledge — async API differences from xlsx (MEDIUM confidence — training data, well-documented library, no live fetch available)
- Vite documentation on Web Workers — `?worker` import suffix, `import.meta.url` pattern (MEDIUM confidence — training data, Vite 5/6 stable feature)
