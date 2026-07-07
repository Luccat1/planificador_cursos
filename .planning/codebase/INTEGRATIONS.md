# External Integrations

**Analysis Date:** 2026-07-07

## APIs & External Services

**Google Fonts:**
- Loaded via CSS `@import` in `src/styles.css` at build/runtime
- URL: `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap`
- No API key required; purely a CDN import
- Fonts: Inter (body text) and Outfit (headings/titles)

**No other external APIs or third-party services are used.**

## Storage & Data

**In-memory only:**
- All application state lives in React `useState` in `src/App.tsx`
- No database, no IndexedDB, no `localStorage`, no `sessionStorage`

**File-based import/export (user-initiated):**
- JSON export: serialized via `src/domain/storage.ts` (`serializePeriod`) — downloads a `.json` file using a `data:` URI
- JSON import: read via `FileReader.readAsText` in `src/App.tsx` (`handleImportJson`)
- Excel export: built via `xlsx` library in `src/domain/excel.ts` (`buildExcelTemplate`) — downloads a `.xlsx` file via `Blob` + `URL.createObjectURL`
- Excel import: read via `FileReader.readAsArrayBuffer` in `src/App.tsx` (`handleImportExcel`), parsed by `xlsx` in `src/domain/excel.ts` (`parseExcelTemplate`)

**Example data:**
- `docs/examples/periodo-demo.json` — sample period JSON for demonstration

## Authentication

None. This is a fully client-side, offline-capable application. No login, no sessions, no tokens.

## Deployment

**Current output:**
- Static files built to `dist/` via `npm run build`
- `dist/` contains `index.html` + `assets/` (hashed JS and CSS bundles)

**Hosting:**
- No deployment script is defined in `package.json` (no `gh-pages` or similar)
- `dist/` is committed to the repository — can be served directly from any static host

**Vite dev server:**
- Bound to `127.0.0.1` in dev (`npm run dev` uses `--host 127.0.0.1`)
- `allowedHosts: ['.loca.lt']` in `vite.config.ts` — configured to allow localtunnel proxying for remote access during development

**CI/CD:**
- None detected. No GitHub Actions, no Netlify config, no Vercel config.

## Environment Variables

- No `.env` files present in the project
- No `import.meta.env` references detected in source files
- No environment-specific configuration required at build or runtime

---

*Integration audit: 2026-07-07*
