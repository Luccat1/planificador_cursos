# Feature Landscape: Quality Refactor Patterns

**Domain:** React 18 + TypeScript quality refactor (subsequent milestone)
**Researched:** 2026-07-07
**Overall confidence:** HIGH — patterns are well-established; recommendations based on direct codebase inspection

---

## Context

This is a **quality refactor milestone**, not a feature-addition milestone. "Features" here means refactor capabilities and patterns that must be implemented. Each topic maps directly to a requirement in `.planning/PROJECT.md` (Pilar 1: Calidad).

The codebase was inspected directly. Specific line numbers and patterns below are verified against the actual source.

---

## Topic 1: Decomposing `DataTables.tsx` (841-line monolith)

### What the file actually contains

`DataTables.tsx` (confirmed 841 lines) holds:
- Tab router state (`activeTab`, `editingAvailabilityTeacherId`) — lines 12–13
- All form states for 5 entities (10 `useState` calls) — lines 26–44
- 15+ event handlers for add/delete/toggle across all entities — lines 54–204
- Full JSX render tree for all 5 tabs — lines 206–841
- An IIFE-style availability editor embedded inside the teachers tab render — lines 229–395 (renders inside `{activeTab === "teachers" && (() => { ... })()}`)

### Pattern: "Compound Component with Shared Props"

The standard React pattern for this structure is to decompose by entity. Each tab becomes its own file. The outer `DataTables.tsx` becomes a thin shell that only handles tab routing.

```
src/components/
  DataTables.tsx              (shell — tab nav only, ~30 lines)
  tabs/
    TeachersTab.tsx           (teachers list + availability editor)
    CoursesTab.tsx
    BlocksTab.tsx
    ConflictRulesTab.tsx
    PreferencesTab.tsx
```

**Why this works for this specific file:** All 5 tabs share the same `{ period, onChangePeriod }` props — there is no cross-tab state dependency. The tabs are genuinely independent. The IIFE pattern (availability editor embedded in render) should become a sub-component `TeacherAvailabilityEditor.tsx` with its own props.

**Code example — DataTables.tsx shell after decomposition:**

```tsx
interface DataTablesProps {
  period: Period;
  onChangePeriod: (period: Period) => void;
}

type TabType = "teachers" | "courses" | "blocks" | "rules" | "preferences";

export default function DataTables({ period, onChangePeriod }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("teachers");

  return (
    <div className="panel">
      <TabNav activeTab={activeTab} onChangeTab={setActiveTab} period={period} />
      <div>
        {activeTab === "teachers"   && <TeachersTab    period={period} onChangePeriod={onChangePeriod} />}
        {activeTab === "courses"    && <CoursesTab     period={period} onChangePeriod={onChangePeriod} />}
        {activeTab === "blocks"     && <BlocksTab      period={period} onChangePeriod={onChangePeriod} />}
        {activeTab === "rules"      && <ConflictRulesTab period={period} onChangePeriod={onChangePeriod} />}
        {activeTab === "preferences" && <PreferencesTab period={period} onChangePeriod={onChangePeriod} />}
      </div>
    </div>
  );
}
```

**Where local state lives after decomposition:** Each tab component owns its own form state. `TeachersTab` holds `teacherName` and `editingAvailabilityTeacherId`. `CoursesTab` holds `courseName`, `courseTeachers`, etc. This is correct because form state is genuinely local to each entity.

**The IIFE pattern** (lines 229–395, an immediately invoked function inside JSX that returns the availability editor) must become a proper component. IIFEs in JSX bypass React's component lifecycle and make the tree hard to follow.

```tsx
// Before (IIFE in JSX — avoid):
{activeTab === "teachers" && editingId ? (() => {
  const teacher = period.teachers.find(t => t.id === editingId);
  return <div>...</div>;
})() : <TeacherList />}

// After (proper sub-component):
{activeTab === "teachers" && (
  editingId
    ? <TeacherAvailabilityEditor
        teacher={period.teachers.find(t => t.id === editingId)!}
        timeBlocks={period.timeBlocks}
        onSave={(updated) => { ... }}
        onClose={() => setEditingId(null)}
      />
    : <TeacherList
        teachers={period.teachers}
        onEdit={(id) => setEditingId(id)}
        onDelete={handleDeleteTeacher}
        onToggleActive={toggleTeacherActive}
        onAdd={handleAddTeacher}
      />
)}
```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Single file with sub-sections (current) | One file to navigate | 841 lines, impossible to review or test in isolation, IIFE anti-pattern |
| One file per tab (recommended) | Each component is independently reviewable and testable; form state is colocated | More files; tab-routing state must stay in parent |
| Shared form component per entity | Further reuse if entities have similar shape | Over-abstraction for 5 distinct entities with different fields |

**Recommendation:** One file per tab. Do not over-abstract. The goal is isolation, not DRY at the cost of clarity.

---

## Topic 2: Eliminating `as any` — TypeScript Patterns for Third-Party Library Results

### Where `as any` appears in this codebase

Three sites, inspected directly:

1. `src/domain/excel.ts` line 75: `const availabilityData: any[] = [];` — array typed as `any[]`
2. `src/domain/excel.ts` line 118: `XLSX.utils.sheet_to_json<any>(...)` — generic param `any`
3. `src/domain/excel.ts` lines 142, 158, 176, 196, 210: `sheet_to_json<any>(...)` — same pattern repeated per sheet
4. `src/domain/excel.ts` lines 215–216: `String(row.alcance).trim() as any` and `String(row.tipo).trim() as any` — casting string to a union type

### Pattern A: Type the raw row, then validate

Replace `sheet_to_json<any>` with `sheet_to_json<Record<string, unknown>>`. This is what the cell value looks like before you know if it's valid. Then write a type guard or assertion function that narrows to your domain type.

```typescript
// Instead of:
const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Profesores"]);

// Use:
const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["Profesores"]);
```

`Record<string, unknown>` is accurate: the library returns an object where keys are column headers (strings) and values may be string, number, boolean, or undefined. `unknown` forces you to narrow before use, which is the entire point.

### Pattern B: Replace `as any` casts on union types with explicit validation

The current code at lines 215–216:

```typescript
scope: String(row.alcance).trim() as any,   // should be PreferenceScope
kind:  String(row.tipo).trim()   as any,    // should be PreferenceKind
```

The `as any` cast bypasses TypeScript entirely. If the Excel cell contains a typo, the app silently stores an invalid value. The correct pattern uses a type guard:

```typescript
const VALID_SCOPES = ["period", "course", "teacher"] as const;
type PreferenceScope = typeof VALID_SCOPES[number];

function isPreferenceScope(value: string): value is PreferenceScope {
  return (VALID_SCOPES as readonly string[]).includes(value);
}

// At parse site:
const rawScope = String(row.alcance ?? "").trim().toLowerCase();
if (!isPreferenceScope(rawScope)) {
  throw new Error(`Invalid preference scope: "${rawScope}"`);
}
const scope: PreferenceScope = rawScope;
```

This is pure TypeScript — no library required. The throw becomes part of runtime validation (see Topic 3).

### Pattern C: Type the internal accumulator array

Line 75: `const availabilityData: any[] = [];` can be typed as the exact shape being pushed:

```typescript
interface AvailabilityRow {
  profesor_id: string;
  dia: string;
  clave_id: string;
}
const availabilityData: AvailabilityRow[] = [];
```

### Trade-offs

| Pattern | When to use | Downside |
|---------|-------------|---------|
| `as any` | Never in strict-mode project | Defeats TypeScript entirely; masks runtime errors |
| `as SomeType` (assertion without guard) | Only when the type is provably correct from context | Still bypasses check; use sparingly |
| `Record<string, unknown>` + type guard | External data (Excel rows, JSON, API) | Requires writing guards; correct trade-off |
| Zod / Valibot schema parse | Same as above, declarative | Adds library dependency; see Topic 3 |

**Rule:** `as any` is never acceptable. `as ConcreteType` is acceptable only when TypeScript genuinely cannot infer what is already provably typed (e.g., casting a tagged union after a checked discriminant). For external data, always use `Record<string, unknown>` and explicit narrowing or schema parsing.

---

## Topic 3: Runtime Validation — Zod vs Manual for Excel Imports

### The problem in this codebase

`parseExcelTemplate` in `excel.ts` reads 6 sheets from an untrusted Excel file. Currently:
- No sheet-presence check (some sheets already guarded with `wb.SheetNames.includes(...)`, which is good)
- No cell-type checks — any string coerced with `String(row.field || "")`
- No referential integrity checks — a course may reference a teacher ID that was not in the Profesores sheet
- Invalid enum values silently stored via `as any`

A malformed or adversarially crafted Excel file can insert arbitrary strings into `scope`, `kind`, and `value` fields on `Preference`, corrupting the scoring algorithm.

### Option A: Manual validation (recommended for this project)

Write an explicit validator function that takes `Record<string, unknown>` rows and returns typed entities or throws descriptive errors.

**Pros:** Zero new dependencies. Fits the existing pattern (domain functions throw `Error` on invalid input — per CONVENTIONS.md). Errors can be as specific as needed. No build overhead.

**Cons:** Verbose. Validation logic must be maintained alongside type definitions. Easy to forget a field when types evolve.

```typescript
function parseTeacherRow(row: Record<string, unknown>, index: number): Teacher {
  const id = requireString(row, "id", index);
  const nombre = requireString(row, "nombre", index);
  return {
    id,
    name: nombre,
    active: parseBoolean(row["activo"])
  };
}

function requireString(row: Record<string, unknown>, key: string, rowIndex: number): string {
  const val = row[key];
  if (val === undefined || val === null || String(val).trim() === "") {
    throw new Error(`Row ${rowIndex}: missing required field "${key}"`);
  }
  return String(val).trim();
}
```

### Option B: Zod (not recommended for this milestone)

Zod is the de-facto standard for runtime schema validation in TypeScript. A schema for the teacher row would look like:

```typescript
import { z } from "zod";

const TeacherRowSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  activo: z.string().optional()
});

const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["Profesores"]);
const teachers = rows.map((row, i) => {
  const result = TeacherRowSchema.safeParse(row);
  if (!result.success) throw new Error(`Row ${i}: ${result.error.message}`);
  return { id: result.data.id, name: result.data.nombre, active: parseBoolean(result.data.activo) };
});
```

**Pros:** Declarative, co-located schema + type inference, better error messages, battle-tested.

**Cons for this project:**
- Adds a new dependency (~14 kB gzipped) to a project currently without validation libraries
- PROJECT.md explicitly says "Validación de runtime en importación Excel" with no mention of Zod — the intent is correctness, not a specific library
- CONVENTIONS.md shows domain functions throw `Error` — manual validation fits that pattern exactly
- The validation surface is limited: 6 sheets, ~3–5 fields each. This is not a case where Zod's scale advantage matters.

### Recommendation

**Use manual validation for this milestone.** Write a `validateExcelRow` helper family in `excel.ts` (or a co-located `excel-validation.ts`). If the project later adds user-defined schemas or API response validation at scale, adopt Zod at that point.

**What must be validated at minimum:**
- Required fields present and non-empty (id, nombre/name, etc.)
- Enum values are members of the allowed set (`PreferenceScope`, `PreferenceKind`, `Weekday`)
- Numeric fields parse to finite numbers (weight, weeklySessions, blocksPerSession)
- Boolean coercion is explicit (the current `parseBoolean` function is already correct)

---

## Topic 4: Error Notification UX — Replacing `alert()`

### Current state

`App.tsx` uses `alert()` for all import/export errors (try/catch blocks). CONVENTIONS.md confirms this. `alert()` is a browser-blocking modal, cannot be styled, interrupts all interaction, and cannot be dismissed programmatically.

### Pattern A: Lightweight inline toast (recommended — no dependency)

A toast is a self-dismissing notification that appears in a fixed overlay position. For this project, a single component of ~60 lines handles the requirement.

```tsx
// src/components/Toast.tsx
interface ToastMessage {
  id: string;
  kind: "error" | "success" | "info";
  message: string;
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div style={{ position: "fixed", bottom: "1rem", right: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", zIndex: 1000 }}>
      {messages.map(m => (
        <div key={m.id} style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: m.kind === "error" ? "#fee2e2" : "#d1fae5", maxWidth: "24rem" }}>
          <span>{m.message}</span>
          <button onClick={() => onDismiss(m.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

State lives in `App.tsx` as `const [toasts, setToasts] = useState<ToastMessage[]>([])`. A helper `notify(kind, message)` adds a toast and schedules auto-removal with `setTimeout`. This fits the existing convention: all state in `App.tsx`, children get callbacks.

### Pattern B: Status bar / banner

An inline status area below the header, always visible. Appropriate when errors are about application-wide state (e.g., "Autosave failed"). Less suitable for transient operation feedback (import success).

### Pattern C: Inline error near the triggering control

Place the error message adjacent to the button that caused it. Good for form validation errors (e.g., "Required field missing"). Not practical for file import errors that happen at application level.

### Pattern D: react-hot-toast or sonner (not recommended for this milestone)

Popular libraries for toasts. `sonner` by Emil Kowalski is minimal (~3 kB). However:
- PROJECT.md calls for "componente de notificación visual (sin `alert()`)" — a custom component satisfies this
- Adding a library for a 60-line component adds a dependency and lock-in
- Both libraries require their provider wrapping `App`, which adds setup overhead

### Recommendation

**Pattern A — custom toast component.** Implement once in `src/components/Toast.tsx`, add `toasts` state and `notify` helper to `App.tsx`, pass `onNotify` callback down to child components that trigger errors (ImportExport panel). Auto-dismiss errors after 5 seconds, successes after 2 seconds. Provide a manual dismiss button on errors.

**What the notification system must cover (from requirements):**
- Excel import errors (currently `alert()` in App.tsx)
- JSON import errors (currently `alert()` in App.tsx)
- Excel export errors
- Success confirmations for imports (currently no feedback)
- Scheduler truncation warning (new notification for the silent search cap)

---

## Topic 5: Test Coverage Standards for React Domain Logic

### Current test state (verified from files)

| File | Tests | Coverage |
|------|-------|----------|
| `validation.test.ts` | 5 tests: course without teacher, duplicate blocks, teacher double-booked, course conflict, teacher availability | Good positive cases; missing: valid period passes, edge cases on preference scores |
| `scheduler.test.ts` | Present (not inspected in full) | Per CONCERNS.md: gaps in preference scoring and negative cases |
| `storage.test.ts` | Present | Per PROJECT.md: has gaps |
| `excel.test.ts` | 1 test: round-trip build-and-parse with valid fixture | No negative cases: malformed sheets, missing required fields, invalid enum values |
| `App.test.tsx` | 1 smoke test only | — |
| Component tests | Zero | — |

### What TO test in this codebase

**Domain logic (pure TypeScript in `src/domain/`) — high priority, high value:**

These are framework-agnostic functions. Testing them does not require React or jsdom. They are fast and stable.

```
Scheduler:
- All preference types (preferMorning, preferDay, avoidDay, distributeSessions) affect score correctly
- Scheduler respects teacher availability constraints
- Scheduler returns empty when no valid assignment exists
- Truncation at 5,000 nodes returns whatever partial results exist (not a crash)

Validation:
- Valid period returns empty issues array (positive case — currently missing)
- Course without teacher flagged
- Duplicate time blocks flagged
- Teacher double-booked flagged
- Teacher availability conflict flagged (existing, but only one scenario tested)
- Inactive courses excluded from validation

Excel import (negative cases — currently all missing):
- Missing required sheet → meaningful error thrown
- Row with empty id → row skipped or error thrown
- Invalid PreferenceScope value → error thrown, not silently stored
- Invalid PreferenceKind value → error thrown, not silently stored
- Non-numeric weight field → defaults to 1 (or error, per chosen behavior)
- Empty worksheet → returns empty array, no crash

Storage:
- serializePeriod / deserializePeriod round-trip
- deserializePeriod with unknown fields (forward compatibility)
- deserializePeriod with missing fields (backward compatibility / corrupt data)
```

**What NOT to test:**

```
- Component rendering of DataTables, ScheduleGrid, SidePanel — these are layout/visual;
  test them manually or with visual regression, not unit tests
- CSS class names applied to elements — brittle, test nothing meaningful
- Tab switching behavior in DataTables — UI interaction test with Testing Library only
  if the logic is complex; here it's a single setState call
- The scheduler's exact output for a specific input — the backtracking is non-deterministic
  in ordering; test properties (no conflicts, scores in range) not exact schedules
- localStorage read/write directly — these are environment-dependent; test the
  serialization functions that feed them
```

**The correct test boundary for this project:** Domain functions (pure TS) get unit tests. React components do not get unit tests in this milestone. The project has zero component tests and zero component complexity requiring tests — the components are thin shells over domain logic. Testing the domain gives 90% of the safety at 10% of the cost.

### What "domain fully covered" means for this project

Per PROJECT.md: "Dominio completamente cubierto por tests (scheduler, validation, storage, excel) sin gaps."

Operationally this means:
- Every exported function in `src/domain/` has at least one test
- Every error path (throw statement) in domain functions has a negative case test
- Every conditional branch in `parseExcelTemplate` has a test (valid branch + invalid branch)
- `generateScheduleProposals` covers all `PreferenceKind` variants

This is achievable without component tests. The convention (test co-located with source, fixtures in `src/test/fixtures.ts`) is already established — follow it.

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Unit test all domain functions | Fast, deterministic, framework-free | Does not catch React integration bugs |
| Component tests with Testing Library | Catches integration issues, closer to user behavior | Slow setup, brittle to refactors, overkill for thin-shell components |
| E2E tests (Playwright) | Highest confidence | Way out of scope for a quality refactor milestone |

**Recommendation:** Unit test domain functions to full branch coverage. Add one smoke component test per tab component (renders without crashing). No more component testing than that for this milestone.

---

## Table Stakes (Must-Have for Quality Refactor)

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| DataTables.tsx decomposed into 5 tab components | CONCERNS.md: 841-line file is un-reviewable and un-testable | Medium | IIFE pattern must be eliminated as part of this |
| `as any` eliminated everywhere | PROJECT.md explicit requirement; strict-mode TypeScript | Low-Medium | ~8 occurrences, all in excel.ts |
| Runtime validation on Excel import | CONCERNS.md: malformed files silently corrupt state; xlsx has security vulnerabilities | Medium | Minimum: required fields + enum membership checks |
| Toast notification component replacing `alert()` | PROJECT.md explicit requirement; alert() is blocking and un-styleable | Low | ~60 lines, no dependency needed |
| Domain test coverage with no gaps | PROJECT.md explicit requirement; excel.ts has zero negative-case tests | Medium | Priority: excel negative cases, scheduler preferences |
| Day-name constant extracted to `src/domain/constants.ts` | Three files duplicate the same map; single source of truth | Low | Straightforward extraction |

## Differentiators (Raise the Quality Bar)

| Feature | Value | Complexity | Notes |
|---------|-------|------------|-------|
| `TeacherAvailabilityEditor` as standalone component | Eliminates the IIFE pattern; component is independently testable | Low | Sub-task of DataTables decomposition |
| Typed `AvailabilityRow`, `TeacherRow`, `CourseRow` interfaces in excel.ts | Makes the parse pipeline self-documenting | Low | No behavior change, purely structural |
| Scheduler truncation notification | CONCERNS.md: user never knows when results are suboptimal | Low | One toast call when 5,000-node cap is hit |
| `parseBoolean` tests | Currently untested; function has branching logic | Very Low | 3–4 test cases |

## Anti-Features (Explicitly Avoid)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Adding Zod for Excel validation | Adds dependency for a narrow use case; manual validation fits the existing convention | Write explicit `requireString` / `requireEnum` helpers in excel.ts |
| Adding react-hot-toast or sonner | Overkill for a fixed notification requirement; adds lock-in | Custom Toast component (~60 lines) |
| Component tests for all 5 tab components | Brittle, slow, tests the wrong layer for this codebase | Unit test domain functions; smoke test renders |
| Extracting a generic `useTabForm` hook | Over-abstraction; the 5 tabs have different fields and different behaviors | Keep form state colocated in each tab component |
| `React.FC` type annotation on new components | CONVENTIONS.md explicitly prohibits this | Plain function declaration with typed props |
| Context or Zustand for tab form state | All state in App.tsx is the project convention; tabs have genuinely local form state | Local useState inside each tab component |

---

## Feature Dependencies

```
Day-name constant extraction → No dependencies (can go first)
  |
  v
DataTables decomposition → Depends on: nothing blocked, but easier after constant extraction
  |
  v
as-any elimination in excel.ts → Must be done alongside runtime validation (they solve the same root problem)
  |
  v
Runtime validation on import → Depends on: as-any elimination (same code region)
  |
  v
Toast notification component → Depends on: nothing (standalone component added to App.tsx)
  |
  v
Domain test coverage → Best done last: tests validate the refactored domain code, not the old code
```

## MVP Recommendation (Pilar 1 Ordering)

1. **Extract day-name constant** — 30 minutes, zero risk, unblocks other work
2. **Eliminate `as any` + add runtime validation** — single PR touching `excel.ts` only; keep changes co-located
3. **Decompose DataTables.tsx** — highest line-count reduction; enables isolated component tests later
4. **Add Toast component** — standalone, no refactor required; add one hook in App.tsx
5. **Fill domain test gaps** — do last, targeting the refactored code

Defer: Component-level React Testing Library tests for tab components. They add cost without safety benefit for thin shell components.

---

## Sources

- Direct inspection: `src/components/DataTables.tsx` (841 lines confirmed)
- Direct inspection: `src/domain/excel.ts` (lines 75, 118, 142, 158, 176, 196, 210, 215–216)
- Direct inspection: `src/domain/excel.test.ts` (1 test, no negative cases confirmed)
- Direct inspection: `src/domain/validation.test.ts` (5 tests, positive and negative confirmed)
- `.planning/PROJECT.md` — requirements and constraints
- `.planning/codebase/CONCERNS.md` — identified technical debt
- `.planning/codebase/CONVENTIONS.md` — established patterns (no React.FC, state in App.tsx, errors throw Error)
- Confidence: HIGH for all topics — based on direct codebase inspection, not web search
