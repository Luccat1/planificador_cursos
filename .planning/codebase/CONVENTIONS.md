# Code Conventions

## Language & Style

- **TypeScript strict mode** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- **Target**: ES2022 with ESNext modules
- **JSX**: `react-jsx` transform (no explicit React import needed)
- **Imports**: Named imports preferred; default exports for components; domain modules export named functions

## Component Patterns

All components are functional components with typed props interfaces defined inline:

```tsx
interface ScheduleGridProps {
  period: Period;
  selectedProposal: ScheduleProposal | null;
  onSelectSession: (session: PlacedSession | null) => void;
}

export default function ScheduleGrid({ period, selectedProposal, onSelectSession }: ScheduleGridProps) {
  // ...
}
```

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
