import { describe, it, expect } from "vitest";
import { runSchedulerAsync } from "./schedulerRunner";
import { createDemoPeriod } from "./seeds";

describe("runSchedulerAsync", () => {
  it("resolves proposals asynchronously without blocking", async () => {
    const period = createDemoPeriod();
    const proposals = await runSchedulerAsync(period, 3);
    expect(proposals).toBeDefined();
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals[0].sessions.length).toBeGreaterThan(0);
  });
});

