# Architecture

## Overview

Planificador de Cursos is a single-page React application for scheduling university courses across a weekly timetable. Users define teachers, courses, time blocks, conflict rules, and preferences; a backtracking scheduler generates ranked weekly schedule proposals. No backend or persistence — all state lives in memory and can be exported/imported via JSON or Excel files.

## Core Concepts

### Domain Model (`src/domain/types.ts`)

| Type | Description |
|------|-------------|
| `Period` | Root aggregate — contains all scheduling data for one academic period |
| `TimeBlock` | A named time slot (e.g. "Block 1: 08:00–09:30") |
| `Teacher` | A teacher with availability constraints per weekday |
| `Course` | A course with assigned teachers, weekly session count, and blocks-per-session |
| `SessionRequirement` | A slot to be filled; may be locked to a specific day/block |
| `PlacedSession` | A requirement placed on the grid (day + block + teachers assigned) |
| `CourseConflictRule` | Prevents two courses from overlapping |
| `Preference` | Soft constraint (preferMorning, avoidDay, preferDay, spreadSessions) with a weight |
| `ScheduleProposal` | A complete set of PlacedSessions with a score and issues list |

### Scheduling Algorithm (`src/domain/scheduler.ts`)

1. Collects all `SessionRequirement`s to place (respects locked sessions)
2. Runs synchronous backtracking on the UI thread — tries every (day, block) combination
3. Enforces hard constraints: no double-booking teachers, no conflicting courses, teacher availability
4. Caps exploration at 5,000 leaf nodes (silent truncation)
5. Scores each valid placement via `scoreProposal()` using active preferences
6. Returns the top-N proposals sorted by score

### Import/Export (`src/domain/excel.ts`, `src/domain/storage.ts`)

- **JSON**: `serializePeriod` / `parsePeriodJson` — full round-trip via JSON string
- **Excel**: `buildExcelTemplate` / `parseExcelTemplate` — reads/writes `.xlsx` using `xlsx` v0.18.5

## Component Architecture

```
App (root state owner)
├── Header (period name, JSON/Excel import-export buttons)
├── main.left-section
│   ├── ScheduleGrid        — week grid; renders PlacedSessions with multi-block spanning
│   ├── ProposalPanel       — list of scored proposals; select to display on grid
│   ├── Instructions panel  — static help text
│   └── DataTables          — tabbed editor: Blocks | Teachers | Courses | Conflicts | Preferences
└── SidePanel               — contextual panel: shows selected session detail or empty-slot actions
```

**State ownership**: All state lives in `App`. Child components receive data via props and emit changes via callbacks (`onChangePeriod`, `onSelectSession`, etc.). No external state library.

## Data Flow

```
User edits DataTables
    → onChangePeriod(updatedPeriod)
    → App.setPeriod()
    → ScheduleGrid re-renders with new period

User clicks "Generar propuesta"
    → generateScheduleProposals(period, 5)  [synchronous, blocks UI]
    → setProposals(results)
    → ProposalPanel shows ranked list
    → ScheduleGrid renders selectedProposal.sessions

User clicks session on grid
    → onSelectSession(session)
    → SidePanel shows session detail + lock/unlock controls
    → SidePanel calls onChangePeriod to persist state changes
```

## Key Files

| File | Purpose |
|------|---------|
| `src/domain/types.ts` | All TypeScript interfaces — single source of truth for domain model |
| `src/domain/scheduler.ts` | Backtracking scheduler + scoring engine |
| `src/domain/validation.ts` | Hard-constraint validation (conflicts, double-booking) |
| `src/domain/excel.ts` | Excel import/export via xlsx |
| `src/domain/storage.ts` | JSON serialization/deserialization |
| `src/domain/seeds.ts` | Factory for default Period with sample data |
| `src/App.tsx` | Root component — owns all state, orchestrates layout |
| `src/components/ScheduleGrid.tsx` | Week grid with multi-block session rendering |
| `src/components/DataTables.tsx` | 841-line tabbed data editor (all 5 entity types) |
| `src/components/SidePanel.tsx` | Contextual detail/action panel |
| `src/components/ProposalPanel.tsx` | Proposal selection list |
