# Directory Structure

## Root Layout

```
planificador_cursos/
├── src/                    # Application source
│   ├── domain/             # Business logic, types, algorithms
│   ├── components/         # React UI components
│   ├── test/               # Shared test fixtures
│   ├── App.tsx             # Root component + all state
│   ├── main.tsx            # React entry point
│   └── styles.css          # Global CSS (custom properties + utility classes)
├── docs/                   # Design specs and planning docs
│   └── superpowers/
│       ├── specs/          # Feature design documents
│       └── plans/          # Implementation plans
├── .planning/              # GSD planning artifacts (this folder)
│   └── codebase/           # Codebase map documents
├── public/                 # Static assets
├── dist/                   # Build output (gitignored)
├── node_modules/           # Dependencies (gitignored)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── eslint.config.js
```

## Source Organization

### `src/domain/` — Pure business logic, no React

| File | Role |
|------|------|
| `types.ts` | All domain interfaces and type aliases |
| `scheduler.ts` | Backtracking schedule generator + scoring |
| `validation.ts` | Hard-constraint validator (conflicts, availability) |
| `excel.ts` | xlsx import/export |
| `storage.ts` | JSON serialize/parse |
| `seeds.ts` | Default period factory for fresh starts |

### `src/components/` — React UI components

| File | Role |
|------|------|
| `ScheduleGrid.tsx` | Week timetable grid with session rendering |
| `DataTables.tsx` | Tabbed CRUD editor for all entity types (841 lines) |
| `SidePanel.tsx` | Contextual right panel for selected session |
| `ProposalPanel.tsx` | Ranked proposals list |

### `src/test/`

| File | Role |
|------|------|
| `fixtures.ts` | Shared test data factories (Period, courses, teachers) |

### Test files — co-located with source

| File | Tests |
|------|-------|
| `src/App.test.tsx` | UI smoke test |
| `src/domain/types.test.ts` | Type validation tests |
| `src/domain/scheduler.test.ts` | Scheduler algorithm tests |
| `src/domain/storage.test.ts` | JSON serialization tests |
| `src/domain/excel.test.ts` | Excel import/export tests |
| `src/domain/validation.test.ts` | Constraint validation tests |

## Key Directories

- **`src/domain/`** — Framework-agnostic business logic. Can be tested without React.
- **`src/components/`** — All UI. Depends on domain types but not on domain logic directly (except `ScheduleGrid` for display).
- **`docs/superpowers/`** — Historical specs and implementation plans from the vibecoding process.

## Naming Conventions

- **Components**: PascalCase files matching the default export (`ScheduleGrid.tsx` → `export default function ScheduleGrid`)
- **Domain files**: camelCase (`scheduler.ts`, `validation.ts`)
- **Test files**: `*.test.ts` / `*.test.tsx` co-located with the file under test
- **Types**: PascalCase interfaces (`Period`, `Teacher`, `Course`)
- **Constants**: SCREAMING_SNAKE_CASE for top-level arrays (`WEEKDAYS`)
- **CSS**: kebab-case class names via `styles.css` global stylesheet + inline styles for one-off adjustments
