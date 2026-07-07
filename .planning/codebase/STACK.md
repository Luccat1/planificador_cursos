# Technology Stack

**Analysis Date:** 2026-07-07

## Runtime & Language

**Primary:**
- TypeScript 5.7 — all application and domain code under `src/`
- Target: ES2022, strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`)
- JSX transform: `react-jsx` (no explicit React import needed in components)

**Module system:**
- ESM (`"type": "module"` in `package.json`)
- Module resolution: `bundler` mode (Vite-aware, allows `.tsx` import extensions)

## Runtime

**Environment:**
- Browser (client-side only, no server runtime)
- No Node.js runtime in production — pure static SPA

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0 — UI rendering (`src/main.tsx`, `src/App.tsx`, `src/components/`)
- React DOM 19.0 — DOM mounting via `ReactDOM.createRoot`

**Testing:**
- Vitest 4.1.9 — test runner configured in `vite.config.ts` with `globals: true` and jsdom environment
- @testing-library/react 16.1.0 — component testing utilities
- @testing-library/jest-dom 6.6.3 — custom DOM matchers
- jsdom 25.0.1 — browser environment emulation for tests

**Build/Dev:**
- Vite 6.0.7 — dev server and production bundler (`vite.config.ts`)
- @vitejs/plugin-react 4.3.4 — React fast refresh and JSX transform

## UI Layer

**Component library:** None (custom components only)

**Icons:** lucide-react 0.468.0 — used in `src/App.tsx` (`Download`, `Upload`, `Calendar` icons)

**Styling:** Custom CSS via `src/styles.css`
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

**Scripts:**
```bash
npm run dev      # Vite dev server bound to 127.0.0.1
npm run build    # tsc type-check then vite build → dist/
npm run test     # vitest run (single pass)
npm run test:watch  # vitest (watch mode)
```

**Build config:** `vite.config.ts`
- React plugin enabled
- `allowedHosts: ['.loca.lt']` — permits localtunnel-style remote access during dev
- Test environment: jsdom with globals enabled

**TypeScript config:** `tsconfig.json` (app) + `tsconfig.node.json` (vite config only)
- `resolveJsonModule: true` — JSON imports allowed
- `noEmit: true` — TS only type-checks; Vite handles transpilation

**Output:** `dist/` directory (committed but typically excluded from editor via `.vscode/settings.json`)

---

*Stack analysis: 2026-07-07*
