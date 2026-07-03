import { describe, it, expect } from "vitest";
import { createDefaultPeriod } from "./seeds";

describe("Types and seeds", () => {
  it("creates a default period with 7 active time blocks", () => {
    const period = createDefaultPeriod("2026-2");
    expect(period.name).toBe("2026-2");
    expect(period.timeBlocks).toHaveLength(7);
    expect(period.timeBlocks[0].active).toBe(true);
    expect(period.timeBlocks[0].id).toBe("1-2");
  });
});
