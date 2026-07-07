<!-- GSD:project-start source:PROJECT.md -->
## Project

**Planificador de Cursos — Refactor de Calidad y UI**

Aplicación web SPA en React para planificar horarios universitarios semanales. Permite definir profesores, cursos, bloques horarios, reglas de conflicto y preferencias; un algoritmo de backtracking genera propuestas de horario rankeadas. Orientada a coordinadores académicos en contexto universitario chileno.

Este milestone es un refactor completo en tres pilares ordenados: calidad de código, corrección de deficiencias funcionales críticas, y modernización de la UI.

**Core Value:** Un coordinador puede generar, revisar y ajustar el horario semanal de su programa sin perder su trabajo entre sesiones.

### Constraints

- **Tech stack**: React 18 + Vite + TypeScript — no cambiar el framework base
- **Sin backend**: Toda persistencia debe ser client-side (localStorage)
- **Sin breaking changes de API pública**: La estructura del tipo `Period` debe mantenerse compatible con JSON exportados existentes
- **Compatibilidad**: La migración de xlsx a exceljs debe mantener compatibilidad con plantillas Excel existentes
- **Deploy**: GitHub Pages (SPA estática) — nada que requiera servidor
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Runtime & Language
- TypeScript 5.7 — all application and domain code under `src/`
- Target: ES2022, strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`)
- JSX transform: `react-jsx` (no explicit React import needed in components)
- ESM (`"type": "module"` in `package.json`)
- Module resolution: `bundler` mode (Vite-aware, allows `.tsx` import extensions)
## Runtime
- Browser (client-side only, no server runtime)
- No Node.js runtime in production — pure static SPA
- npm
- Lockfile: `package-lock.json` present
## Frameworks
- React 19.0 — UI rendering (`src/main.tsx`, `src/App.tsx`, `src/components/`)
- React DOM 19.0 — DOM mounting via `ReactDOM.createRoot`
- Vitest 4.1.9 — test runner configured in `vite.config.ts` with `globals: true` and jsdom environment
- @testing-library/react 16.1.0 — component testing utilities
- @testing-library/jest-dom 6.6.3 — custom DOM matchers
- jsdom 25.0.1 — browser environment emulation for tests
- Vite 6.0.7 — dev server and production bundler (`vite.config.ts`)
- @vitejs/plugin-react 4.3.4 — React fast refresh and JSX transform
## UI Layer
- CSS custom properties (design tokens in `:root`)
- Google Fonts loaded via `@import url('https://fonts.googleapis.com/css2?family=Inter...')` — Inter (body) and Outfit (titles)
- Dark theme: "Cyberpunk Dark / Premium Slate" palette
- No CSS framework (no Tailwind, no Bootstrap)
- No CSS modules or CSS-in-JS
## State Management
- React `useState` only — local component state in `src/App.tsx`
- No global state library (no Redux, Zustand, Context API for global state)
- All application state flows from `App.tsx` down as props
- No persistence to `localStorage` or `sessionStorage` detected
## Key Dependencies
| Package | Version | Role |
|---|---|---|
| `react` | ^19.0.0 | UI framework |
| `react-dom` | ^19.0.0 | DOM rendering |
| `typescript` | ^5.7.2 | Language/type checking |
| `vite` | ^6.0.7 | Dev server and bundler |
| `@vitejs/plugin-react` | ^4.3.4 | Vite React plugin |
| `lucide-react` | ^0.468.0 | Icon components |
| `xlsx` | ^0.18.5 | Excel file parsing and generation |
| `vitest` | ^4.1.9 | Test runner (devDep) |
| `@testing-library/react` | ^16.1.0 | Component test utilities (devDep) |
| `@testing-library/jest-dom` | ^6.6.3 | DOM assertion matchers (devDep) |
| `jsdom` | ^25.0.1 | Browser emulation for tests (devDep) |
## Build & Tooling
- React plugin enabled
- `allowedHosts: ['.loca.lt']` — permits localtunnel-style remote access during dev
- Test environment: jsdom with globals enabled
- `resolveJsonModule: true` — JSON imports allowed
- `noEmit: true` — TS only type-checks; Vite handles transpilation
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Language & Style
- **TypeScript strict mode** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- **Target**: ES2022 with ESNext modules
- **JSX**: `react-jsx` transform (no explicit React import needed)
- **Imports**: Named imports preferred; default exports for components; domain modules export named functions
## Component Patterns
- **No class components**
- **No React.FC** — plain function declarations with destructured typed props
- Callbacks passed as props named with `on` prefix (`onChangePeriod`, `onSelectSession`)
## State Patterns
- All state lives in `App.tsx` via `useState`
- State initialization uses lazy initializer: `useState<Period>(() => createDefaultPeriod(...))`
- Child components are stateless — they receive data and emit changes via props
- State updates are immutable: spread patterns (`{ ...period, name: e.target.value }`)
- No external state library (no Zustand, Redux, Context)
## Naming Conventions
| Pattern | Convention |
|---------|------------|
| Components | PascalCase (`ScheduleGrid`, `DataTables`) |
| Domain functions | camelCase (`generateScheduleProposals`, `validatePeriod`) |
| Types/interfaces | PascalCase (`Period`, `PlacedSession`) |
| Type aliases | PascalCase (`Weekday`, `SessionState`) |
| Constants (top-level arrays) | SCREAMING_SNAKE_CASE (`WEEKDAYS`) |
| Event handlers | `handle` prefix (`handleGenerate`, `handleExportJson`) |
| Props callbacks | `on` prefix (`onChangePeriod`, `onSelectSession`) |
| CSS classes | kebab-case (`app-container`, `btn-primary`) |
## File Structure Conventions
- Domain logic is framework-agnostic in `src/domain/` (pure TypeScript, no React)
- UI components live in `src/components/`
- Tests are co-located: `foo.ts` → `foo.test.ts` in the same directory
- Shared test fixtures centralized in `src/test/fixtures.ts`
## Code Quality Tools
### ESLint (`eslint.config.js`)
- Uses `@eslint/js` + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- Enforces hooks rules and React Fast Refresh compatibility
### TypeScript
- Strict mode with all extra checks enabled (see `tsconfig.json`)
- `moduleResolution: "bundler"` for Vite compatibility
### No Prettier configured
- Code formatting is not enforced by a formatter tool
## Error Handling
- User-facing errors use `alert()` calls in `App.tsx` (try/catch around import/export operations)
- Domain functions throw `Error` on invalid input
- No centralized error boundary component
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Overview
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
### Import/Export (`src/domain/excel.ts`, `src/domain/storage.ts`)
- **JSON**: `serializePeriod` / `parsePeriodJson` — full round-trip via JSON string
- **Excel**: `buildExcelTemplate` / `parseExcelTemplate` — reads/writes `.xlsx` using `xlsx` v0.18.5
## Component Architecture
```
```
## Data Flow
```
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
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
