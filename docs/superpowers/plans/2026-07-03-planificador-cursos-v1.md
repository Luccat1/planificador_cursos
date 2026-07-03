# Planificador Cursos V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app that plans weekly course schedules, validates hard conflicts, scores preferences, imports/exports period data, and produces a recommended schedule plus alternatives.

**Architecture:** Use a React + TypeScript + Vite frontend with a pure TypeScript scheduling core. Keep domain models, validation, scheduling, persistence, import/export, and UI components in separate modules so V2 rooms and V3 database/users can be added without rewriting the core.

**Tech Stack:** Node.js, Vite, React, TypeScript, Vitest, Testing Library, SheetJS `xlsx`, browser file APIs.

## Global Constraints

- Work in `C:\Users\Usuario\Documents\code\planificador_cursos`.
- Use a week-type schedule from Monday to Friday.
- Time blocks are editable data, not fixed in code beyond initial seed values.
- A course can have one or many weekly sessions.
- A course can have one or many assigned teachers.
- All assigned teachers are blocked for every session of that course.
- Hard rules must never be silently broken.
- Preferences affect scoring and warnings, but do not invalidate schedules.
- Rooms are out of V1 scope, but data models must leave room for V2.
- Periods are saved as structured JSON files in V1.
- The app must allow manual editing and Excel template import.
- Make frequent commits after independently testable tasks.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `vite.config.ts`: Vite and Vitest configuration.
- `tsconfig.json`, `tsconfig.node.json`: TypeScript configuration.
- `index.html`: Vite entry HTML.
- `src/main.tsx`: React app bootstrap.
- `src/App.tsx`: top-level app composition.
- `src/domain/types.ts`: period, course, teacher, time block, session, rule, preference, proposal types.
- `src/domain/seeds.ts`: default time blocks and sample period factory.
- `src/domain/validation.ts`: period validation and conflict validation.
- `src/domain/scheduler.ts`: schedule generator, scoring, and alternatives.
- `src/domain/storage.ts`: JSON import/export helpers.
- `src/domain/excel.ts`: Excel template export and import helpers.
- `src/components/ScheduleGrid.tsx`: weekly grid.
- `src/components/SidePanel.tsx`: contextual editing panel.
- `src/components/DataTables.tsx`: editable course, teacher, block, restriction, and preference tables.
- `src/components/ProposalPanel.tsx`: recommended proposal, alternatives, warnings.
- `src/styles.css`: app layout and visual styling.
- `src/test/fixtures.ts`: reusable test data.
- `src/domain/*.test.ts`: unit tests for validation, scheduler, storage, and Excel.
- `src/components/*.test.tsx`: focused UI smoke tests.

---

### Task 1: Scaffold The App And Baseline Domain Types

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/domain/types.ts`
- Create: `src/domain/seeds.ts`
- Create: `src/styles.css`
- Test: `src/domain/types.test.ts`

**Interfaces:**
- Produces: `Period`, `Teacher`, `Course`, `TimeBlock`, `SessionRequirement`, `PlacedSession`, `CourseConflictRule`, `Preference`, `ScheduleProposal`.
- Produces: `createDefaultPeriod(name: string): Period`.

- [ ] **Step 1: Create project dependencies**

Use this `package.json`:

```json
{
  "name": "planificador-cursos",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.7",
    "typescript": "^5.7.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Add Vite, TypeScript, and app entry files**

Create standard Vite React files with `src/main.tsx` rendering `<App />`, `index.html` containing `<div id="root"></div>`, and `vite.config.ts` enabling React plus Vitest `jsdom`.

- [ ] **Step 3: Define domain types**

Implement `src/domain/types.ts` with these exported types:

```ts
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
export type SessionState = "draft" | "confirmed" | "locked";
export type PreferenceScope = "period" | "course" | "teacher";
export type PreferenceKind = "preferMorning" | "avoidDay" | "preferDay" | "spreadSessions";

export interface TimeBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  active: boolean;
}

export interface Course {
  id: string;
  name: string;
  teacherIds: string[];
  weeklySessions: number;
  blocksPerSession: number;
  active: boolean;
}

export interface SessionRequirement {
  id: string;
  courseId: string;
  lockedDay?: Weekday;
  lockedBlockId?: string;
}

export interface PlacedSession {
  requirementId: string;
  courseId: string;
  day: Weekday;
  blockId: string;
  teacherIds: string[];
  state: SessionState;
}

export interface CourseConflictRule {
  id: string;
  courseAId: string;
  courseBId: string;
  reason: string;
  active: boolean;
}

export interface Preference {
  id: string;
  scope: PreferenceScope;
  targetId: string;
  kind: PreferenceKind;
  value: string;
  weight: number;
  active: boolean;
}

export interface Period {
  id: string;
  name: string;
  startsOn?: string;
  endsOn?: string;
  timeBlocks: TimeBlock[];
  teachers: Teacher[];
  courses: Course[];
  requirements: SessionRequirement[];
  conflictRules: CourseConflictRule[];
  preferences: Preference[];
}

export interface ScheduleIssue {
  severity: "error" | "conflict" | "warning" | "suggestion";
  code: string;
  message: string;
  entityIds: string[];
}

export interface ScheduleProposal {
  id: string;
  label: string;
  sessions: PlacedSession[];
  score: number;
  issues: ScheduleIssue[];
}
```

- [ ] **Step 4: Add default seed data**

Implement `createDefaultPeriod(name: string): Period` in `src/domain/seeds.ts` with the seven initial time blocks from the approved design.

- [ ] **Step 5: Write and run baseline type test**

Create `src/domain/types.test.ts` asserting `createDefaultPeriod("2026-2")` creates 7 blocks and weekdays are not stored as dates.

Run: `npm test -- src/domain/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tsconfig.node.json index.html src
git commit -m "feat: scaffold planner app domain"
```

---

### Task 2: Validation And Hard Conflict Detection

**Files:**
- Create: `src/domain/validation.ts`
- Create: `src/test/fixtures.ts`
- Test: `src/domain/validation.test.ts`

**Interfaces:**
- Consumes: `Period`, `PlacedSession`, `ScheduleIssue`.
- Produces: `validatePeriod(period: Period): ScheduleIssue[]`.
- Produces: `validatePlacedSessions(period: Period, sessions: PlacedSession[]): ScheduleIssue[]`.

- [ ] **Step 1: Write failing validation tests**

Cover:

```ts
expect(validatePeriod(periodWithCourseWithoutTeacher)).toContainEqual(expect.objectContaining({ code: "COURSE_WITHOUT_TEACHER" }));
expect(validatePeriod(periodWithDuplicateBlock)).toContainEqual(expect.objectContaining({ code: "DUPLICATE_TIME_BLOCK" }));
expect(validatePlacedSessions(period, sameTeacherSameSlot)).toContainEqual(expect.objectContaining({ code: "TEACHER_DOUBLE_BOOKED" }));
expect(validatePlacedSessions(period, incompatibleCoursesSameSlot)).toContainEqual(expect.objectContaining({ code: "COURSE_CONFLICT" }));
```

Run: `npm test -- src/domain/validation.test.ts`
Expected: FAIL because functions do not exist.

- [ ] **Step 2: Implement validation**

Implement:

```ts
export function validatePeriod(period: Period): ScheduleIssue[] { ... }
export function validatePlacedSessions(period: Period, sessions: PlacedSession[]): ScheduleIssue[] { ... }
```

Rules:

- `COURSE_WITHOUT_TEACHER`: active course has empty `teacherIds`.
- `COURSE_WITHOUT_SESSIONS`: active course has `weeklySessions < 1`.
- `DUPLICATE_TIME_BLOCK`: repeated active block label or id.
- `UNKNOWN_TEACHER`: course references missing teacher.
- `UNKNOWN_COURSE_IN_RULE`: conflict rule references missing course.
- `TEACHER_DOUBLE_BOOKED`: same teacher in same day and block.
- `COURSE_CONFLICT`: active rule has both courses in same day and block.
- `INVALID_BLOCK`: session references missing or inactive block.

- [ ] **Step 3: Run tests**

Run: `npm test -- src/domain/validation.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain/validation.ts src/domain/validation.test.ts src/test/fixtures.ts
git commit -m "feat: validate planning conflicts"
```

---

### Task 3: Scheduling Engine With Scored Alternatives

**Files:**
- Create: `src/domain/scheduler.ts`
- Test: `src/domain/scheduler.test.ts`

**Interfaces:**
- Consumes: `Period`, `ScheduleProposal`, `validatePeriod`, `validatePlacedSessions`.
- Produces: `generateScheduleProposals(period: Period, maxAlternatives?: number): ScheduleProposal[]`.

- [ ] **Step 1: Write failing scheduler tests**

Cover:

```ts
expect(generateScheduleProposals(spanishCultureFixture, 3)).toHaveLength(3);
expect(best.sessions).toEqual(expect.arrayContaining([expect.objectContaining({ state: "locked" })]));
expect(best.issues.find(issue => issue.severity === "conflict")).toBeUndefined();
expect(best.score).toBeGreaterThanOrEqual(alternatives[1].score);
```

Also test that `Espanol 1` and `Espanol 2` may overlap, while each cannot overlap with `Cultura Chilena`.

Run: `npm test -- src/domain/scheduler.test.ts`
Expected: FAIL because scheduler does not exist.

- [ ] **Step 2: Implement generation**

Implement a deterministic backtracking scheduler:

```ts
export function generateScheduleProposals(period: Period, maxAlternatives = 5): ScheduleProposal[] {
  const periodIssues = validatePeriod(period);
  if (periodIssues.some((issue) => issue.severity === "error")) {
    return [{ id: "invalid-period", label: "Periodo invalido", sessions: [], score: -Infinity, issues: periodIssues }];
  }
  // Expand requirements from courses, place locked requirements first,
  // recursively assign remaining requirements to active Monday-Friday blocks,
  // reject hard conflicts, score valid proposals, sort descending.
}
```

Scoring:

- `preferMorning`: +weight when block starts before `12:00`.
- `avoidDay`: -weight when session uses that weekday.
- `preferDay`: +weight when session uses that weekday.
- `spreadSessions`: +weight when a course uses different days.

- [ ] **Step 3: Run tests**

Run: `npm test -- src/domain/scheduler.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain/scheduler.ts src/domain/scheduler.test.ts src/test/fixtures.ts
git commit -m "feat: generate scored schedule proposals"
```

---

### Task 4: JSON Persistence And Excel Template Flow

**Files:**
- Create: `src/domain/storage.ts`
- Create: `src/domain/excel.ts`
- Test: `src/domain/storage.test.ts`
- Test: `src/domain/excel.test.ts`

**Interfaces:**
- Produces: `serializePeriod(period: Period): string`.
- Produces: `parsePeriodJson(json: string): Period`.
- Produces: `buildExcelTemplate(period: Period): ArrayBuffer`.
- Produces: `parseExcelTemplate(buffer: ArrayBuffer): Period`.

- [ ] **Step 1: Write failing persistence tests**

Test JSON round-trip preserves courses, teachers, blocks, restrictions, and preferences.

Run: `npm test -- src/domain/storage.test.ts`
Expected: FAIL because functions do not exist.

- [ ] **Step 2: Implement JSON helpers**

Use `JSON.stringify(period, null, 2)` and parse with shape checks for required arrays.

- [ ] **Step 3: Write failing Excel tests**

Test workbook sheets:

- `Profesores`
- `Cursos`
- `Claves horarias`
- `Restricciones`
- `Preferencias`

Run: `npm test -- src/domain/excel.test.ts`
Expected: FAIL because functions do not exist.

- [ ] **Step 4: Implement Excel helpers**

Use SheetJS `xlsx` to create/read the sheets. Use stable column names in Spanish:

- Profesores: `id`, `nombre`, `activo`
- Cursos: `id`, `nombre`, `profesores`, `sesiones_semana`, `claves_por_sesion`, `activo`
- Claves horarias: `id`, `clave`, `inicio`, `termino`, `activo`
- Restricciones: `id`, `curso_a`, `curso_b`, `motivo`, `activo`
- Preferencias: `id`, `alcance`, `objetivo`, `tipo`, `valor`, `peso`, `activo`

- [ ] **Step 5: Run tests**

Run: `npm test -- src/domain/storage.test.ts src/domain/excel.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/storage.ts src/domain/excel.ts src/domain/storage.test.ts src/domain/excel.test.ts
git commit -m "feat: add period import export helpers"
```

---

### Task 5: Main Planner Interface

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/ScheduleGrid.tsx`
- Create: `src/components/SidePanel.tsx`
- Create: `src/components/DataTables.tsx`
- Create: `src/components/ProposalPanel.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `Period`, `ScheduleProposal`, `generateScheduleProposals`, storage and Excel helpers.
- Produces: interactive V1 UI with grid, panel, tables, import/export, and proposal generation.

- [ ] **Step 1: Write UI smoke test**

Test:

```ts
render(<App />);
expect(screen.getByText("Planificador de cursos")).toBeInTheDocument();
expect(screen.getByText("Generar propuesta")).toBeInTheDocument();
expect(screen.getByText("Lunes")).toBeInTheDocument();
```

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because UI is not implemented.

- [ ] **Step 2: Implement layout**

`App.tsx` holds period state, active tab, selected item, proposals, and file actions.

Visual layout:

- Top bar with period name and import/export buttons.
- Main area with schedule grid.
- Right panel with selected course/proposal details.
- Bottom or tabbed data tables for courses, teachers, blocks, restrictions, preferences.

- [ ] **Step 3: Implement editable tables**

Allow adding/editing/deleting:

- teachers;
- courses;
- time blocks;
- course conflict rules;
- preferences.

Keep edits immutable with `setPeriod`.

- [ ] **Step 4: Implement proposal actions**

Clicking `Generar propuesta` calls `generateScheduleProposals(period)`, shows the best proposal in the grid, and lists alternatives in `ProposalPanel`.

- [ ] **Step 5: Implement import/export buttons**

Buttons:

- `Descargar plantilla`
- `Importar plantilla`
- `Exportar periodo`
- `Abrir periodo`

Use browser file APIs and helpers from Task 4.

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests PASS and build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/components src/styles.css
git commit -m "feat: build planner interface"
```

---

### Task 6: Final Verification, Documentation, And Demo Data

**Files:**
- Create: `README.md`
- Create: `docs/examples/periodo-demo.json`
- Modify: `src/domain/seeds.ts`
- Test: all existing tests.

**Interfaces:**
- Produces: user-facing run instructions and a demo period covering the approved examples.

- [ ] **Step 1: Add README**

Include:

```md
# Planificador de Cursos

Aplicacion web local para planificar periodos de clases con cursos, profesores, claves horarias, restricciones y propuestas automaticas.

## Uso local

npm install
npm run dev

## Verificacion

npm test
npm run build
```

- [ ] **Step 2: Add demo period**

Create `docs/examples/periodo-demo.json` with:

- `Espanol 1`
- `Espanol 2`
- `Cultura Chilena`
- `Variedades dialectales del espanol`
- teachers `Andres`, `Sebastian`, `Ricardo`
- conflict rules where Cultura conflicts with both Spanish courses, but Spanish 1 and Spanish 2 do not conflict with each other.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run build
git status --short
```

Expected:

- tests pass;
- production build succeeds;
- only intended files are modified before the final commit.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/examples src/domain/seeds.ts
git commit -m "docs: add usage guide and demo period"
```

---

## Self-Review

- Spec coverage: V1 week-type planning, editable blocks, multi-session courses, multi-teacher blocking, direct course restrictions, preferences, manual locks, recommended proposal, alternatives, JSON backup, Excel import/export, and V2/V3 growth points are covered.
- Known deferred scope: room assignment, users/roles, real calendar holidays, institutional integrations, and multiuser history remain intentionally out of V1.
- Placeholder scan: no task contains unresolved placeholder language; each task has exact files, exported interfaces, tests, commands, and commit messages.
- Type consistency: all tasks use the domain types exported from `src/domain/types.ts`; validation and scheduler consume the same `ScheduleIssue` and `ScheduleProposal` interfaces.
