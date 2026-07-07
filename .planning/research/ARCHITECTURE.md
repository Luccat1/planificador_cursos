# Architecture Patterns

**Project:** Planificador de Cursos — UI Modernization + Component Decomposition
**Researched:** 2026-07-07
**Scope:** SUBSEQUENT milestone — refactoring an existing React 19 + Vite 6 app

---

## Critical Discovery: No Tailwind CSS Installed

The `package.json` contains no `tailwindcss` dependency. The project uses **pure CSS custom properties** in `src/styles.css` with hand-authored utility classes that resemble Tailwind conventions (`.btn`, `.panel`, `.form-control`, etc.).

**Implication:** All design token and "Tailwind vs CSS" questions resolve to "CSS custom properties only" — no Tailwind configuration to manage. Recommendations below are grounded in this reality.

---

## Topic 1: Clean & Minimal Design System (Linear/Notion Aesthetic)

### Current State

The existing palette is a cyberpunk/dark theme: near-black backgrounds (`#090d16`), indigo accent (`#6366f1`), glassmorphism panels with `backdrop-filter: blur()`. This is visually heavy and unsuited to an academic tool used in daylight.

The current token structure in `styles.css` `:root` block is already well-organized with semantic names (`--bg-primary`, `--text-secondary`, `--accent-color`). The token architecture is good; the values need to change.

### Target Aesthetic: Linear/Notion

**Characteristics:**
- Light surface backgrounds: near-white, not pure white (e.g. `#fafafa`, `#f5f5f5`)
- Neutral gray palette: grays carry all hierarchy, not saturated colors
- One accent color used sparingly (action buttons, active tabs, focus rings only)
- Generous whitespace: 24px/32px gap between sections, not 12px
- Typography-driven hierarchy: weight (400/500/600) and size do more work than color
- Borders are hairlines: 1px `rgba(0,0,0,0.08)` not heavy outlines
- No shadows on interactive panels — border + background color differentiation only
- Shadows reserved for floating elements (modals, dropdowns)

### Recommended Color Token Values (Light Mode)

Replace all values in `:root` within `styles.css`. Do NOT change the token names — they are already used throughout components.

```css
:root {
  /* Surfaces */
  --bg-primary:    #f8f9fa;   /* page background */
  --bg-secondary:  #ffffff;   /* card / panel background */
  --bg-tertiary:   #f1f3f5;   /* input backgrounds, table header rows */
  --bg-card:       #ffffff;   /* replaces glassmorphism card */

  /* Text */
  --text-primary:   #111827;  /* headings, body */
  --text-secondary: #6b7280;  /* labels, secondary info */
  --text-muted:     #9ca3af;  /* placeholders, disabled */

  /* Borders */
  --border-color: rgba(0, 0, 0, 0.08);
  --border-focus: #2563eb;    /* accent for focus rings */

  /* Accent (blue, not indigo — higher contrast on light) */
  --accent-color:  #2563eb;
  --accent-glow:   rgba(37, 99, 235, 0.12);
  --accent-hover:  #1d4ed8;

  /* Semantic */
  --success-color: #16a34a;
  --success-bg:    rgba(22, 163, 74, 0.08);
  --error-color:   #dc2626;
  --error-bg:      rgba(220, 38, 38, 0.08);
  --warning-color: #d97706;
  --warning-bg:    rgba(217, 119, 6, 0.08);
  --info-color:    #0284c7;

  /* Elevation — only for floating elements */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
  --shadow-glow: none; /* remove glow entirely */

  /* Geometry */
  --radius-sm: 6px;
  --radius-md: 8px;   /* reduce from 12px for cleaner look */
  --radius-lg: 12px;  /* reduce from 16px */

  /* Motion */
  --transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Typography Scale

Keep Inter for body. Drop Outfit (saves a font load) or keep for the single `h1` title. Scale:

```css
/* Apply in body rule */
font-size: 14px;    /* base — academic tools read better at 14px than 16px */
line-height: 1.6;

/* Heading sizes — using rem from 14px base */
/* h1: 1.714rem (24px) */
/* h2: 1.286rem (18px) */
/* h3: 1.143rem (16px) */
/* small/label: 0.857rem (12px) */
```

### Spacing System

The current code uses ad-hoc `gap: "1.5rem"`, `padding: "1rem"`, etc. (inline styles). The refactor should codify a 4-point base:

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
}
```

Use these in CSS classes. Inline style overrides become the exception, not the rule.

---

## Topic 2: CSS Custom Properties vs Tailwind Config for This Refactor

**Recommendation: Stay with CSS custom properties exclusively. Do not introduce Tailwind.**

**Rationale:**

1. Tailwind is not installed. Adding it would require a new dependency, PostCSS integration in Vite, and rewriting the existing class system — a large scope change that is orthogonal to the UI modernization goal.

2. The existing token system (`--bg-primary`, `--text-secondary`, etc.) already provides semantic naming. This is what Tailwind's `@theme` directive replicates in v4. The project is already following the right pattern.

3. Tailwind v4 (current as of 2026) uses `@theme` in CSS — which is structurally identical to what this project already does in `:root`. There is no architectural advantage to adding the dependency.

4. The codebase uses class-per-concern naming (`.btn`, `.btn-primary`, `.panel`, `.form-control`) — a component-class approach that does not benefit from utility-class generation.

**The only change needed is to update token values** (color palette, spacing, radii) within the existing `:root` block and remove the `backdrop-filter`/glassmorphism rules from `.panel` and `.header`. No architectural change to the CSS system is required.

**Confidence:** HIGH — verified by reading actual package.json and styles.css.

---

## Topic 3: Component Architecture for DataTables.tsx Decomposition

### Current State

`DataTables.tsx` is 841 lines containing:
- Tab navigation controller
- 5 independent entity editors (teachers, courses, blocks, conflict rules, preferences)
- An embedded sub-view (teacher availability grid) rendered conditionally inside the teachers tab
- All form state for all 5 tabs declared at the top level of a single component

### Problem

All 5 form states are declared together even when only one tab is visible. The teacher availability grid is a deeply nested IIFE inside a conditional render. There is no meaningful unit boundary.

### Recommended Decomposition

**Rule:** One file per entity editor. Each editor owns its own form state and receives only what it needs from `period`.

```
src/components/
└── data-tables/
    ├── DataTables.tsx          # Tab shell only — ~50 lines
    ├── TeachersTab.tsx         # Teacher list + add form (~180 lines)
    ├── TeacherAvailabilityGrid.tsx  # Extracted sub-view (~120 lines)
    ├── CoursesTab.tsx          # Course list + add form (~130 lines)
    ├── BlocksTab.tsx           # TimeBlock list + add form (~100 lines)
    ├── ConflictRulesTab.tsx    # Rules list + add form (~120 lines)
    └── PreferencesTab.tsx      # Preferences list + add form (~160 lines)
```

**DataTables.tsx (shell) contract:**

```typescript
// Props unchanged — external API stays identical
interface DataTablesProps {
  period: Period;
  onChangePeriod: (period: Period) => void;
}

// Owns only: which tab is active
const [activeTab, setActiveTab] = useState<TabType>("teachers");

// Renders tab buttons + conditionally mounts the active tab component
// Each tab component is lazy-mounted (not all in DOM at once)
```

**Each tab component contract:**

```typescript
// Example: TeachersTab.tsx
interface TeachersTabProps {
  period: Period;
  onChangePeriod: (period: Period) => void;
}
// Owns: teacherName form state, editingAvailabilityTeacherId state
// Does NOT own: any other entity's state
```

**TeacherAvailabilityGrid.tsx** — extracted from the current IIFE:

```typescript
interface TeacherAvailabilityGridProps {
  teacher: Teacher;
  activeBlocks: TimeBlock[];
  onUpdateTeacher: (updated: Teacher) => void;
  onBack: () => void;
}
// Owns: nothing — pure controlled component
// Receives teacher and blocks, fires updates via onUpdateTeacher
```

### Build Order for This Decomposition

Perform in this exact sequence to avoid breaking the running app:

1. Extract `TeacherAvailabilityGrid` first (it is the most isolated — no cross-tab dependencies, clearest interface).
2. Extract `PreferencesTab` (no shared state dependencies on other tabs).
3. Extract `BlocksTab` (same — isolated form state, no dependencies).
4. Extract `ConflictRulesTab` (depends on `period.courses` but receives it via props).
5. Extract `CoursesTab` (depends on `period.teachers` but receives it via props).
6. Extract `TeachersTab` last — it now just renders a list and delegates to `TeacherAvailabilityGrid`.
7. Reduce `DataTables.tsx` to tab shell.

**Why this order:** Steps 1-3 have zero risk of breakage. Steps 4-6 can be done in parallel once 1-3 are confirmed working. Never start with the `DataTables` shell until all children are extracted and tested.

### Shared Constant: Day Label Map

Currently `dayTranslations` is declared inline inside `DataTables.tsx` (line 797-803) and duplicated in `validation.ts` and `SidePanel.tsx`. Extract to:

```typescript
// src/domain/constants.ts
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday:    "Lunes",
  tuesday:   "Martes",
  wednesday: "Miércoles",
  thursday:  "Jueves",
  friday:    "Viernes",
};

export const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
```

Import this in all consumers. Create `constants.ts` before extracting tab components — every tab will need it.

---

## Topic 4: Web Worker Architecture for the Scheduler

### Current Problem

`handleGenerate` in `App.tsx` (line 107-113) calls `generateScheduleProposals(period, 5)` synchronously. This runs backtracking on the UI thread. With a complex period (many courses, many blocks), it can freeze the UI for multiple seconds.

### Architecture

**Recommended pattern: inline worker module via Vite `?worker` import.**

Vite (v3+, confirmed through v6) provides a `?worker` suffix that creates a Worker class from any module. The worker file runs in a background thread and communicates via `postMessage`.

**File structure:**

```
src/
├── workers/
│   └── scheduler.worker.ts     # Worker entry point
└── hooks/
    └── useScheduler.ts         # React hook wrapping the worker
```

**scheduler.worker.ts:**

```typescript
import { generateScheduleProposals } from "../domain/scheduler";
import { Period, ScheduleProposal } from "../domain/types";

type WorkerInput = { period: Period; maxProposals: number };
type WorkerOutput =
  | { status: "done"; proposals: ScheduleProposal[] }
  | { status: "error"; message: string };

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  try {
    const { period, maxProposals } = e.data;
    const proposals = generateScheduleProposals(period, maxProposals);
    const result: WorkerOutput = { status: "done", proposals };
    self.postMessage(result);
  } catch (err) {
    const result: WorkerOutput = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error"
    };
    self.postMessage(result);
  }
};
```

**useScheduler.ts:**

```typescript
import { useCallback, useRef, useState } from "react";
import SchedulerWorker from "../workers/scheduler.worker?worker";
import { Period, ScheduleProposal } from "../domain/types";

type SchedulerStatus = "idle" | "running" | "done" | "error";

export function useScheduler() {
  const [status, setStatus] = useState<SchedulerStatus>("idle");
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const generate = useCallback((period: Period, maxProposals = 5) => {
    // Terminate any in-flight worker before starting a new one
    workerRef.current?.terminate();

    const worker = new SchedulerWorker();
    workerRef.current = worker;

    setStatus("running");
    setError(null);

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.status === "done") {
        setProposals(data.proposals);
        setStatus("done");
      } else {
        setError(data.message);
        setStatus("error");
      }
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (err) => {
      setError(err.message);
      setStatus("error");
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({ period, maxProposals });
  }, []);

  // Cleanup on unmount
  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus("idle");
  }, []);

  return { generate, cancel, status, proposals, error };
}
```

**App.tsx integration:**

```typescript
// Replace:
const handleGenerate = () => {
  const results = generateScheduleProposals(period, 5);
  setProposals(results);
  setSelectedProposal(results[0] || null);
};

// With:
const { generate, status, proposals, error } = useScheduler();

// In JSX — button shows loading state:
<button
  className="btn btn-primary"
  onClick={() => generate(period, 5)}
  disabled={status === "running"}
>
  {status === "running" ? "Generando..." : "Generar propuesta"}
</button>
```

### Vite Worker Import — Confidence Note

The `?worker` import syntax has been part of Vite since v2.x. The pattern `import MyWorker from "./my.worker?worker"` is documented in official Vite docs and has not changed through v6. Confidence: MEDIUM (training data, consistent across 4 major versions, no official docs fetched to verify v6 specifics).

### TypeScript Support

Add a Vite worker type reference if TypeScript reports errors on `?worker` imports:

```typescript
// vite-env.d.ts (already exists or add to tsconfig includes)
/// <reference types="vite/client" />
```

### Key Constraints

- The worker serializes and deserializes `Period` via `postMessage` — structured clone. All types in `Period` must be plain serializable objects. Confirmed: `Period` in `types.ts` uses only plain objects/arrays/primitives. No `Date`, `Map`, or `Set` instances. No issue here.
- The worker imports `generateScheduleProposals` directly from `scheduler.ts`. No refactoring of the scheduler itself is needed.
- Vitest tests for the scheduler run in jsdom (not a worker environment). Worker wrapping is only tested at the `App.tsx` integration level. The scheduler's pure function tests remain unaffected.

---

## Topic 5: localStorage + React State Sync Pattern

### Recommended Pattern: usePeriod Hook

Replace direct `useState<Period>` in `App.tsx` with a custom hook that keeps localStorage in sync. No external library needed.

**src/hooks/usePeriod.ts:**

```typescript
import { useState, useEffect, useCallback } from "react";
import { Period } from "../domain/types";
import { serializePeriod, parsePeriodJson } from "../domain/storage";
import { createDefaultPeriod } from "../domain/seeds";

const STORAGE_KEY = "planificador_period_v1";

function loadFromStorage(): Period | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parsePeriodJson(raw);
  } catch {
    // Corrupted or incompatible stored data — discard silently
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveToStorage(period: Period): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializePeriod(period));
  } catch {
    // Storage quota exceeded — ignore, do not crash
  }
}

export function usePeriod(defaultName = "Periodo 2026-2") {
  const [period, setPeriodState] = useState<Period>(() => {
    return loadFromStorage() ?? createDefaultPeriod(defaultName);
  });

  // Sync to localStorage on every state change
  useEffect(() => {
    saveToStorage(period);
  }, [period]);

  const setPeriod = useCallback((updatedPeriod: Period) => {
    setPeriodState(updatedPeriod);
    // Note: useEffect handles the save — do not call saveToStorage here
    // to avoid double-write and maintain single responsibility.
  }, []);

  const resetPeriod = useCallback((name?: string) => {
    const fresh = createDefaultPeriod(name ?? defaultName);
    localStorage.removeItem(STORAGE_KEY);
    setPeriodState(fresh);
  }, [defaultName]);

  return { period, setPeriod, resetPeriod };
}
```

**App.tsx integration:**

```typescript
// Replace:
const [period, setPeriod] = useState<Period>(() => createDefaultPeriod("Periodo 2026-2"));

// With:
const { period, setPeriod } = usePeriod();
```

The `onChangePeriod` callback, all child component props, and the import/export handlers remain unchanged. Only the state initialization changes.

### Conflict Handling

**Scenario:** User opens two browser tabs with the app. Tab A modifies the period. Tab B still has the old period in memory. When Tab B saves, it overwrites Tab A's changes silently.

**Assessment for this project:** This conflict scenario is explicitly out of scope per `PROJECT.md` ("Sin backend", "localStorage es suficiente"). The academic coordinator use case is single-user, single-tab. No cross-tab conflict detection is warranted for this milestone.

**What to handle (within scope):**
- Corrupted stored data: handled — `loadFromStorage` catches parse errors and discards.
- Storage quota exceeded: handled — `saveToStorage` catches and ignores.
- Incompatible schema (future migration): handled by `STORAGE_KEY` versioning suffix (`_v1`). When a breaking schema change occurs, bump to `_v2`, and old `_v1` data is ignored rather than throwing.

**What NOT to handle:**
- `storage` event listener for cross-tab sync — out of scope.
- Debouncing saves — `Period` objects are small (tens of KB at most). Synchronous saves per keypress are fine. If profiling shows otherwise, add a 300ms debounce to `useEffect` later.

### Import Overwrites Storage Correctly

The existing JSON/Excel import handlers call `setPeriod(parsed)` which will trigger the `useEffect` and immediately overwrite localStorage. This is the correct behavior — an imported period replaces the autosaved one. No special handling needed.

---

## Recommended Architecture: Post-Refactor Component Tree

```
App
├── [state] usePeriod()          → period, setPeriod
├── [state] useScheduler()       → generate, status, proposals
├── [state] selectedProposal     → useState
├── [state] selectedSession      → useState
├── [state] selectedSlot         → useState
│
├── Header
│   ├── PeriodNameInput
│   └── ImportExportActions      (extracted from inline handler cluster)
│
└── main
    ├── .left-section
    │   ├── ScheduleGrid
    │   ├── ProposalPanel
    │   ├── InstructionsPanel    (extracted from inline JSX in App)
    │   └── DataTables           (shell, delegates to tab components)
    │       ├── TeachersTab
    │       │   └── TeacherAvailabilityGrid
    │       ├── CoursesTab
    │       ├── BlocksTab
    │       ├── ConflictRulesTab
    │       └── PreferencesTab
    └── SidePanel
```

New files introduced by this milestone:
- `src/hooks/usePeriod.ts`
- `src/hooks/useScheduler.ts`
- `src/workers/scheduler.worker.ts`
- `src/domain/constants.ts`
- `src/components/data-tables/DataTables.tsx` (shell)
- `src/components/data-tables/TeachersTab.tsx`
- `src/components/data-tables/TeacherAvailabilityGrid.tsx`
- `src/components/data-tables/CoursesTab.tsx`
- `src/components/data-tables/BlocksTab.tsx`
- `src/components/data-tables/ConflictRulesTab.tsx`
- `src/components/data-tables/PreferencesTab.tsx`

---

## Build Order (Across the Full Milestone)

This order minimizes risk — each step is independently verifiable before the next begins.

| Step | Change | Why This First |
|------|--------|---------------|
| 1 | Extract `src/domain/constants.ts` | Zero risk; no component changes; unblocks everything else |
| 2 | `usePeriod` hook + autosave | Isolated change to App.tsx state init; no UI change; testable immediately |
| 3 | `useScheduler` hook + worker | Isolated to App.tsx `handleGenerate`; one function replaced |
| 4 | Extract `TeacherAvailabilityGrid` | Most isolated sub-component; clearest props contract |
| 5 | Extract tab components (BlocksTab, ConflictRulesTab, PreferencesTab) | No cross-dependencies; safe to batch |
| 6 | Extract CoursesTab + TeachersTab | Depend on the above being done first |
| 7 | Reduce DataTables.tsx to shell | Final step — only possible after all tabs are extracted |
| 8 | CSS token values update + remove glassmorphism | Last step — visual; no logic risk |

Do NOT do step 8 first. The dark theme is usable. Doing logic refactors on top of a visual refactor introduces confounded debugging.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Form State in Parent

**What:** Keeping all tab form states (teacherName, courseName, etc.) in `DataTables.tsx` after extracting tabs.
**Why bad:** Prevents tree-shaking, causes unnecessary re-renders on sibling tab state changes, defeats the purpose of decomposition.
**Instead:** Each tab owns its own form state. `DataTables` owns only `activeTab`.

### Anti-Pattern 2: Worker Re-Creation on Every Render

**What:** Creating `new SchedulerWorker()` inside `useCallback` without a ref, causing a new Worker instance per render.
**Why bad:** Worker initialization is expensive. Multiple workers may run simultaneously.
**Instead:** Use `useRef` to track the live worker instance. Terminate before creating a new one (as shown in `useScheduler.ts` above).

### Anti-Pattern 3: Tailwind Introduction Mid-Refactor

**What:** Deciding to add Tailwind CSS alongside the visual refresh.
**Why bad:** Doubles the scope of the UI phase. Requires PostCSS config, removing existing class definitions, and rewriting 841 lines of JSX class names. No net gain — the existing CSS token system is structurally equivalent to Tailwind v4's `@theme`.
**Instead:** Update token values only. Keep class names. The refactor is a palette/spacing change, not a CSS architecture change.

### Anti-Pattern 4: Saving Period State in Worker Callback

**What:** Calling `saveToStorage` directly inside `worker.onmessage`.
**Why bad:** localStorage is a side effect; it belongs in `usePeriod`, not in the scheduler hook. Cross-concern contamination.
**Instead:** Only `usePeriod` writes to localStorage. `useScheduler` is stateless with respect to persistence.

### Anti-Pattern 5: Replacing alert() with Browser confirm()

**What:** Swapping `alert()` for `window.confirm()` or `console.error()`.
**Why bad:** Doesn't solve the UX problem. Notifications should be inline, non-blocking, and auto-dismissing.
**Instead:** Build a simple toast component that reads from a notification queue. A `useNotification` hook that provides `notify({ type: 'success'|'error', message })` and renders a fixed-position `<div>` is sufficient. This is ~60 lines total and completely eliminates `alert()` calls in `App.tsx`.

---

## Scalability Considerations

This is a single-user local tool. Scalability concerns are limited to data size:

| Concern | At 10 courses | At 50 courses | At 200 courses |
|---------|---------------|---------------|----------------|
| Scheduler runtime | <100ms | 1-5s (OK in worker) | May hit 5,000-node cap silently |
| localStorage size | ~5KB | ~25KB | ~100KB — well within 5MB quota |
| ScheduleGrid render | Trivial | Trivial | Still OK (fixed 5-day grid) |
| DataTables render | Trivial | Fast | Acceptable — virtual scroll unnecessary |

The Web Worker eliminates the only real scalability concern for this use case.

---

## Confidence Assessment

| Topic | Confidence | Basis |
|-------|------------|-------|
| CSS token values (light palette) | HIGH | Direct reading of current styles.css + Linear/Notion aesthetic is well-established |
| No Tailwind needed | HIGH | Verified: Tailwind not in package.json; existing CSS system is equivalent |
| DataTables decomposition | HIGH | Read full 841-line file; component boundaries are clear from existing conditional structure |
| Web Worker pattern (Vite ?worker) | MEDIUM | Training data; `?worker` syntax stable across Vite v2-v6; official docs fetch blocked |
| usePeriod localStorage hook | HIGH | Standard React pattern; `parsePeriodJson` already handles malformed input |
| Build order | HIGH | Based on dependency analysis of actual code, not assumption |

---

## Sources

- `src/styles.css` — existing token system (direct read)
- `src/components/DataTables.tsx` — decomposition target (direct read, 841 lines)
- `src/App.tsx` — integration points for hooks (direct read)
- `src/domain/storage.ts` — confirms `parsePeriodJson` error handling (direct read)
- `package.json` — confirms React 19, Vite 6, no Tailwind (direct read)
- Tailwind CSS v4 upgrade docs — `@theme` CSS-first token approach (WebFetch, HIGH confidence)
- MDN Web Workers API — postMessage/onmessage pattern (WebFetch, HIGH confidence)
