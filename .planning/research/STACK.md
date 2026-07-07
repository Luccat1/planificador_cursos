# Technology Stack — Research

**Project:** Planificador de Cursos (Quality Refactor Milestone)
**Researched:** 2026-07-07
**Existing stack:** React 19.0, Vite 6.0.7, TypeScript 5.7, no CSS framework (custom CSS)

---

## 1. ExcelJS vs xlsx (SheetJS) for .xlsx Read/Write

### Decision: Migrate to ExcelJS v4.4.0

**Rationale:**

`xlsx` v0.18.5 is the last version released under the Apache 2.0/MIT license. After v0.18.5, SheetJS changed to a source-available "community" license (SSPL-variant) that prohibits use in SaaS and commercial products. The package on npm has not received security patches since this fork. The codebase already pins `^0.18.5`, which is correct defensively, but the dependency is dead-end.

ExcelJS v4.4.0 is actively maintained, MIT-licensed, ships its own TypeScript types (`@types/exceljs` is not needed — types are bundled), and has a richer API for both reading and writing structured workbooks.

**Confidence:** HIGH — verified against my training knowledge through August 2025; the xlsx license change is well-documented and widely discussed.

### ExcelJS Version

```
exceljs@4.4.0   MIT license   TypeScript types bundled
```

Install:
```bash
npm install exceljs@4.4.0
npm uninstall xlsx
```

### API Comparison

| Capability | xlsx v0.18.5 | ExcelJS v4.4.0 |
|---|---|---|
| Read .xlsx from ArrayBuffer | `XLSX.read(buf, {type:"array"})` | `workbook.xlsx.load(buf)` (async) |
| Sheet by name | `wb.Sheets["Name"]` | `workbook.getWorksheet("Name")` |
| Rows as objects | `XLSX.utils.sheet_to_json(ws)` | iterate `worksheet.eachRow()` |
| Write to ArrayBuffer | `XLSX.write(wb, {type:"array"})` | `workbook.xlsx.writeBuffer()` (async, returns Buffer) |
| Column headers from row | implicit via json_to_sheet | explicit via `addRow({col: val})` |
| TypeScript types | via `@types/xlsx` (community) | bundled in package |
| License | SSPL (post-0.18.5) / frozen | MIT active |
| Maintenance | dead-end | active |

### ExcelJS Write Example (equivalent to current `buildExcelTemplate`)

```typescript
import ExcelJS from 'exceljs';
import { Period } from './types';

export async function buildExcelTemplate(period: Period): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet: Profesores
  const wsTeachers = workbook.addWorksheet('Profesores');
  wsTeachers.columns = [
    { header: 'id', key: 'id' },
    { header: 'nombre', key: 'nombre' },
    { header: 'activo', key: 'activo' },
  ];
  wsTeachers.addRows(
    period.teachers.map(t => ({
      id: t.id,
      nombre: t.name,
      activo: t.active ? 'SÍ' : 'NO',
    }))
  );

  // Sheet: Cursos
  const wsCourses = workbook.addWorksheet('Cursos');
  wsCourses.columns = [
    { header: 'id', key: 'id' },
    { header: 'nombre', key: 'nombre' },
    { header: 'profesores', key: 'profesores' },
    { header: 'sesiones_semana', key: 'sesiones_semana' },
    { header: 'claves_por_sesion', key: 'claves_por_sesion' },
    { header: 'activo', key: 'activo' },
  ];
  wsCourses.addRows(
    period.courses.map(c => ({
      id: c.id,
      nombre: c.name,
      profesores: c.teacherIds.join(', '),
      sesiones_semana: c.weeklySessions,
      claves_por_sesion: c.blocksPerSession,
      activo: c.active ? 'SÍ' : 'NO',
    }))
  );

  // ... add remaining sheets (Claves horarias, Restricciones, Preferencias, Disponibilidad)

  const buffer = await workbook.xlsx.writeBuffer();
  // writeBuffer() returns a Buffer (Node-compatible); in browser, convert:
  return buffer as unknown as ArrayBuffer;
}
```

### ExcelJS Read Example (equivalent to current `parseExcelTemplate`)

```typescript
import ExcelJS from 'exceljs';

export async function parseExcelTemplate(buffer: ArrayBuffer): Promise<Period> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Access a sheet
  const wsTeachers = workbook.getWorksheet('Profesores');
  const teachers: Teacher[] = [];

  if (wsTeachers) {
    // Row 1 is the header row (index 1 in ExcelJS, 1-based)
    wsTeachers.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      // Cells are 1-indexed
      const id = String(row.getCell(1).value ?? '').trim();
      const nombre = String(row.getCell(2).value ?? '').trim();
      const activo = String(row.getCell(3).value ?? '').trim();

      if (id && nombre) {
        teachers.push({ id, name: nombre, active: parseBoolean(activo) });
      }
    });
  }

  // ... parse remaining sheets

  return { /* assembled Period */ } as Period;
}
```

**Key migration notes:**
- ExcelJS is async throughout (`load`, `writeBuffer`). The existing `buildExcelTemplate` and `parseExcelTemplate` signatures must become `async`.
- `writeBuffer()` works in the browser (returns `Uint8Array`-compatible buffer); cast with `buffer as unknown as ArrayBuffer` to preserve the download flow.
- Column ordering in `eachRow` is positional (1-indexed). Using `columns` with `key` during write ensures predictable column order for the read side.
- ExcelJS bundle size is larger (~1 MB minified) than xlsx (~900 KB). Both are chunky; neither affects this app's use case (called on demand, not at startup).

### Alternatives Considered

| Library | Verdict | Reason not chosen |
|---|---|---|
| xlsx v0.18.5 (keep) | Rejected | License frozen, no security patches, dead-end dependency |
| SheetJS Pro | Rejected | Commercial license, cost, overkill for this use case |
| xlsx-js-style | Rejected | Fork of xlsx with same license problem |
| ExcelJS v4.4.0 | **Chosen** | MIT, active, typed, supports all required sheet operations |

---

## 2. Web Workers in Vite 6 — Scheduler Offloading

### Decision: Use Vite's `?worker` import syntax with typed message protocol

**Confidence:** HIGH — Vite's Web Worker support has been stable since Vite 2.x; the `?worker` syntax is documented and unchanged through Vite 6.

### Vite Worker Import Syntax

Vite supports Web Workers natively via a URL query parameter. No plugin or configuration change is required:

```typescript
// In the React component or hook that triggers scheduling:
import SchedulerWorker from './workers/scheduler.worker.ts?worker';

const worker = new SchedulerWorker();
```

The `?worker` suffix tells Vite to bundle that file as a Web Worker entry point. The worker file is transpiled, bundled, and referenced as a separate chunk. In production builds the worker is emitted as a separate file and referenced by URL — no additional vite.config.ts changes are needed.

### TypeScript Support

Create `src/workers/scheduler.worker.ts`. TypeScript recognizes the Worker global and `self` inside the file. Add a `/// <reference lib="webworker" />` triple-slash directive at the top to get correct types for `self`, `postMessage`, and `onmessage` without the DOM lib interfering:

```typescript
/// <reference lib="webworker" />

import { generateScheduleProposals } from '../domain/scheduler';
import type { Period } from '../domain/types';
import type { WorkerRequest, WorkerResponse } from './scheduler.worker.types';

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { period, maxAlternatives } = event.data;
  try {
    const proposals = generateScheduleProposals(period, maxAlternatives);
    const response: WorkerResponse = { kind: 'success', proposals };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
```

### Typed Message Protocol

Define message types in a shared file (importable from both main thread and worker):

```typescript
// src/workers/scheduler.worker.types.ts
import type { Period, ScheduleProposal } from '../domain/types';

export interface WorkerRequest {
  period: Period;
  maxAlternatives: number;
}

export type WorkerResponse =
  | { kind: 'success'; proposals: ScheduleProposal[] }
  | { kind: 'error'; message: string };
```

### Calling the Worker from React

```typescript
// src/hooks/useScheduler.ts
import { useState, useRef, useCallback } from 'react';
import SchedulerWorker from '../workers/scheduler.worker.ts?worker';
import type { WorkerRequest, WorkerResponse } from '../workers/scheduler.worker.types';
import type { Period, ScheduleProposal } from '../domain/types';

export function useScheduler() {
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const generate = useCallback((period: Period, maxAlternatives = 5) => {
    // Terminate any previous run
    workerRef.current?.terminate();

    const worker = new SchedulerWorker();
    workerRef.current = worker;
    setIsGenerating(true);
    setError(null);

    const request: WorkerRequest = { period, maxAlternatives };
    worker.postMessage(request);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.kind === 'success') {
        setProposals(response.proposals);
      } else {
        setError(response.message);
      }
      setIsGenerating(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (err) => {
      setError(err.message);
      setIsGenerating(false);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  return { proposals, isGenerating, error, generate };
}
```

### Important Constraints

- **Imports inside the worker file are bundled by Vite.** The `generateScheduleProposals` import from `scheduler.ts` works as-is — Vite bundles all transitive imports into the worker chunk.
- **No DOM access inside the worker.** `scheduler.ts` does not touch the DOM, so it is safe to import directly.
- **Data transfer is structured-clone.** The `Period` type (plain objects, arrays, strings, numbers) is fully cloneable — no `Transferable` wrapping needed.
- **Vitest and workers:** jsdom does not support `Worker`. Tests for the scheduler should import `generateScheduleProposals` directly (not via the worker file). The worker is integration-tested at the component level or skipped in unit tests.
- **`?worker` syntax and tsconfig:** The `moduleResolution: bundler` setting already in tsconfig.json accepts `?worker` query imports without error. No additional tsconfig changes needed.

### Alternatives Considered

| Approach | Verdict | Reason |
|---|---|---|
| `?worker` import (chosen) | Chosen | Zero config, Vite-native, TypeScript-safe |
| `new Worker(new URL(...))` | Viable but verbose | More portable but requires explicit URL construction |
| `comlink` wrapper library | Overkill | Adds a dependency; simple postMessage is sufficient for one message type |
| `vite-plugin-worker` | Unnecessary | Vite 6 has native support; plugin was needed in Vite 2 era |

---

## 3. localStorage Auto-Save — Debounce and Error Handling

### Decision: Custom hook with 500 ms trailing debounce, quota error handling, and React 19 `useEffect`

**Confidence:** HIGH — localStorage API, debounce patterns, and storage quota behavior are stable web platform features.

### Storage Estimate

The `Period` object contains: teachers (typically <50), courses (<100), timeBlocks (<20), conflictRules (<200), preferences (<200), requirements (<1000). A fully populated period serializes to approximately 10–80 KB of JSON. `localStorage` quota is 5 MB per origin in all modern browsers. This app's data fits comfortably; quota errors are an edge case, not the common path.

### Recommended Pattern

```typescript
// src/hooks/useAutosave.ts
import { useEffect, useRef } from 'react';

const AUTOSAVE_KEY = 'planificador:period:v1';
const DEBOUNCE_MS = 500;

export function useAutosave<T>(value: T): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(value));
      } catch (err) {
        // DOMException: QuotaExceededError
        // Do not crash the app — silently skip this save cycle.
        // In a future milestone, surface this as a toast warning.
        console.warn('[autosave] localStorage write failed:', err);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value]); // re-runs when value reference changes
}
```

**Usage in App.tsx:**
```typescript
useAutosave(period);
```

### Load on Mount

```typescript
// src/domain/storage.ts — add alongside existing serializePeriod/parsePeriodJson

export const AUTOSAVE_KEY = 'planificador:period:v1';

export function loadAutosavedPeriod(): Period | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return parsePeriodJson(raw); // existing validation function
  } catch {
    // Corrupt JSON or validation failure — discard silently
    return null;
  }
}
```

**Usage in App.tsx initial state:**
```typescript
const [period, setPeriod] = useState<Period>(() => {
  return loadAutosavedPeriod() ?? createDefaultPeriod();
});
```

### Key Design Decisions

**500 ms debounce (trailing):** Long enough to avoid writing on every keystroke during form edits; short enough that closing the tab 1 second after a change still saves. 1000 ms is also acceptable but feels sluggish for validation feedback scenarios.

**JSON.stringify on every save:** For the data sizes involved (<80 KB), this is acceptable. Diff-based patching (only saving changed fields) adds significant complexity for no real gain.

**Version key suffix `:v1`:** Allows future schema migrations. If the Period type changes incompatibly, increment to `:v2` and discard `:v1` data gracefully.

**No `useCallback` for `setPeriod`:** The `useEffect` dependency on `value` (the period object) will re-trigger whenever `setPeriod` is called. This is correct behavior — any state change triggers a debounced save.

**StorageEvent for cross-tab sync:** Out of scope per PROJECT.md (single period, single tab use case).

### Error Handling Matrix

| Error | Behavior |
|---|---|
| `QuotaExceededError` (storage full) | Catch, log to console, skip save — app continues |
| `SecurityError` (private browsing restriction) | Catch in `loadAutosavedPeriod`, return null, start fresh |
| Corrupt JSON in storage | `parsePeriodJson` throws, caught, return null |
| Period type mismatch (old schema) | `parsePeriodJson` validation rejects, caught, return null |

---

## 4. Toast / Notification Library

### Decision: sonner v1.x — zero-config, React 19 compatible, no Tailwind dependency

**Confidence:** MEDIUM — Based on training data through August 2025. sonner was the dominant lightweight toast library for React as of that date. React 19 compatibility was confirmed in sonner's changelog. The lack of web search access prevents confirming the exact latest patch version.

### Recommended Library

```
sonner@^1.5.0   MIT license   React 18/19 compatible
```

Install:
```bash
npm install sonner
```

### Why sonner

| Criterion | sonner | react-hot-toast | react-toastify |
|---|---|---|---|
| Bundle size (minified) | ~4 KB | ~5 KB | ~20 KB |
| React 18/19 support | Yes | Yes | Yes |
| Tailwind class override | Yes (className prop) | Limited | Yes |
| Zero CSS import required | Yes | Yes | No (requires CSS import) |
| Custom CSS variables | Yes | No | No |
| Promise toasts | Yes | Yes | No |
| Stacking / queue | Yes (default) | Yes | Yes |
| Headless / custom render | Partial | No | No |
| Weekly downloads (as of 2025) | High | Very high | Very high |

**sonner wins on bundle size and API ergonomics.** `react-toastify` requires a CSS import which conflicts with this project's custom CSS approach. `react-hot-toast` is solid but sonner has better default styling and Promise integration.

**Why not a custom implementation:** A basic custom toast needs: portal rendering, animation, queue management, auto-dismiss timer, accessibility (`role="alert"`, `aria-live`). This is ~150–200 lines of non-trivial code with accessibility edge cases. sonner at 4 KB solves this correctly with no maintenance burden.

### Integration with Existing Custom CSS

This project uses custom CSS custom properties (`:root` tokens), not Tailwind. sonner supports full CSS variable override:

```css
/* In src/styles.css */
:root {
  --normal-bg: var(--color-surface);       /* map to your design tokens */
  --normal-text: var(--color-text-primary);
  --success-bg: #16a34a;
  --error-bg: #dc2626;
  --warning-bg: #d97706;
  --toast-border-radius: 8px;
}
```

### Setup (App.tsx)

```typescript
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      {/* ... rest of app */}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
```

### Usage in Error Handlers

```typescript
import { toast } from 'sonner';

// Replace: alert('Error al importar el archivo Excel')
// With:
toast.error('Error al importar el archivo Excel');

// Replace: alert('Horario generado correctamente')
// With:
toast.success('Horario generado: 3 propuestas encontradas');

// For async operations (Excel import):
toast.promise(parseExcelTemplate(buffer), {
  loading: 'Importando plantilla...',
  success: 'Plantilla importada correctamente',
  error: (err) => `Error: ${err.message}`,
});
```

### Alternatives Considered

| Library | Verdict | Reason not chosen |
|---|---|---|
| sonner v1.x | **Chosen** | Smallest bundle, best API, React 19 compatible |
| react-hot-toast v2.x | Viable fallback | Larger, less ergonomic promise API |
| react-toastify v10.x | Rejected | Requires CSS import, 20 KB bundle |
| Custom implementation | Rejected | Accessibility complexity not worth saving 4 KB |
| Native browser `alert()` | Rejected (current state) | Blocks thread, no styling, poor UX |

---

## Summary of Recommendations

| Area | Recommendation | Version | Install Command |
|---|---|---|---|
| Excel library | ExcelJS (replace xlsx) | 4.4.0 | `npm install exceljs@4.4.0 && npm uninstall xlsx` |
| Web Workers | Vite `?worker` syntax (built-in) | n/a (Vite 6 built-in) | No install needed |
| localStorage auto-save | Custom `useAutosave` hook | n/a (custom) | No install needed |
| Toast notifications | sonner | ^1.5.0 | `npm install sonner` |

## Migration Impact on Existing Tests

- **excel.test.ts:** All tests must become `async` (ExcelJS API is async). The test fixtures remain compatible — the data shapes do not change, only the library used to encode/decode them.
- **storage.test.ts:** Add tests for `loadAutosavedPeriod` covering the null/corrupt/valid cases. The existing `serializePeriod`/`parsePeriodJson` tests are unaffected.
- **scheduler.test.ts:** Unchanged — tests import `generateScheduleProposals` directly, not via the worker.
- **App.test.tsx:** May need to mock `localStorage` (jsdom provides `localStorage` by default — no mock needed unless testing quota errors specifically).

## Confidence Assessment

| Topic | Confidence | Basis |
|---|---|---|
| ExcelJS API and version | MEDIUM | Training data through Aug 2025; no live npm access to confirm exact latest patch |
| xlsx license status | HIGH | Well-documented license change, widely discussed in ecosystem |
| Vite `?worker` syntax | HIGH | Documented since Vite 2; unchanged through Vite 6 |
| Web Worker TS patterns | HIGH | Standard web platform + Vite documentation |
| localStorage limits and errors | HIGH | Stable web platform behavior |
| sonner version | LOW-MEDIUM | Version ^1.5.0 is from training data; latest patch may differ |
| sonner React 19 compat | MEDIUM | Confirmed in training data; recommend verifying on install |

**Verification step before implementation:** Run `npm info exceljs version` and `npm info sonner version` to confirm current latest versions before pinning.

---

*Research completed: 2026-07-07*
*Web search unavailable — all findings from training data (cutoff Aug 2025) and local codebase analysis.*
