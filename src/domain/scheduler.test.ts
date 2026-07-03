import { describe, it, expect } from "vitest";
import { generateScheduleProposals } from "./scheduler";
import { samplePeriod } from "../test/fixtures";

describe("Scheduler", () => {
  it("generates schedule proposals with alternatives", () => {
    const proposals = generateScheduleProposals(samplePeriod, 3);
    
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.length).toBeLessThanOrEqual(3);

    const best = proposals[0];
    const conflicts = best.issues.filter(issue => issue.severity === "conflict" || issue.severity === "error");
    expect(conflicts).toHaveLength(0);

    if (proposals.length > 1) {
      expect(proposals[0].score).toBeGreaterThanOrEqual(proposals[1].score);
    }
  });

  it("handles locked requirements and places them correctly", () => {
    const periodWithLocks = {
      ...samplePeriod,
      requirements: samplePeriod.requirements.map(req => {
        if (req.courseId === "c3") {
          return { ...req, lockedDay: "monday" as const, lockedBlockId: "1-2" };
        }
        return req;
      })
    };

    const proposals = generateScheduleProposals(periodWithLocks, 1);
    expect(proposals).toHaveLength(1);
    
    const best = proposals[0];
    const placedC3 = best.sessions.find(s => s.courseId === "c3");
    expect(placedC3).toBeDefined();
    expect(placedC3!.day).toBe("monday");
    expect(placedC3!.blockId).toBe("1-2");
  });

  it("returns invalid-period proposal if period itself is invalid", () => {
    const invalidPeriod = {
      ...samplePeriod,
      courses: [
        { id: "c1", name: "Espanol 1", teacherIds: [], weeklySessions: 2, blocksPerSession: 1, active: true }
      ]
    };
    const proposals = generateScheduleProposals(invalidPeriod, 1);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].id).toBe("invalid-period");
    expect(proposals[0].score).toBe(-Infinity);
  });
});
