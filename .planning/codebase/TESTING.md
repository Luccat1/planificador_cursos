# Testing

## Test Framework

- **Test runner**: Vitest (v4.1.9)
- **DOM environment**: jsdom (configured in vitest config)
- **UI testing**: `@testing-library/react` + `@testing-library/jest-dom`
- **Assertions**: Vitest's built-in `expect` with jest-dom matchers

## Test Coverage

### What is tested

| File | Focus |
|------|-------|
| `src/domain/scheduler.test.ts` | Backtracking algorithm, constraint enforcement, scoring |
| `src/domain/validation.test.ts` | Hard-constraint validation (conflicts, availability, double-booking) |
| `src/domain/storage.test.ts` | JSON serialization round-trip |
| `src/domain/excel.test.ts` | Excel template build/parse round-trip |
| `src/domain/types.test.ts` | Type shape validation |
| `src/App.test.tsx` | UI smoke test — renders title, main button, day labels |

### What is NOT tested

- `DataTables.tsx` — no component-level tests (841-line monolith, all tabs untested)
- `ScheduleGrid.tsx` — rendering logic for multi-block sessions untested
- `SidePanel.tsx` — session lock/unlock interactions untested
- `ProposalPanel.tsx` — proposal selection untested
- Scheduler preference scoring (`preferMorning`, `avoidDay`, `spreadSessions`) — partially tested
- Excel parsing with malformed/unexpected input — no negative test cases

## Test Patterns

```typescript
import { describe, it, expect } from "vitest";

describe("generateScheduleProposals", () => {
  it("places all sessions for a simple period", () => {
    const period = createTestPeriod(); // from src/test/fixtures.ts
    const proposals = generateScheduleProposals(period, 1);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].sessions).toHaveLength(period.courses.length);
  });
});
```

- `describe`/`it`/`expect` pattern (Vitest API mirrors Jest)
- Fixtures from `src/test/fixtures.ts` provide shared test data factories
- No mocking of external dependencies observed
- UI tests use `render` + `screen` queries from `@testing-library/react`

## Test Scripts

```bash
npm test              # run all tests (vitest)
npm run test:watch    # watch mode (if configured)
```

## Gaps & Recommendations

1. **Zero component-level tests** beyond the App smoke test — `DataTables`, `ScheduleGrid`, `SidePanel` are completely untested
2. **No negative test cases** for Excel import — malformed files, missing columns, wrong data types
3. **No integration test** covering the full flow: edit period → generate proposals → select proposal
4. **No test for the 5,000-node cap** behavior in the scheduler
5. **No test for preference scoring** edge cases (weight=0, conflicting preferences)
6. Coverage tooling not configured — no `--coverage` script in `package.json`
