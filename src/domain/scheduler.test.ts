import { describe, it, expect } from "vitest";
import { scoreProposal } from "./scheduler";
import { generateScheduleProposals } from "./scheduler";
import { samplePeriod } from "../test/fixtures";
import { Period, PlacedSession, Preference } from "./types";
import { DEFAULT_TIME_BLOCKS } from "./seeds";

// ── Minimal fixture ────────────────────────────────────────────────────────────
// Two sessions on different blocks so we have something to score.
const twoSessionPeriod: Period = {
  id: "score-test",
  name: "Score Test",
  timeBlocks: [...DEFAULT_TIME_BLOCKS],
  teachers: [{ id: "t1", name: "Ana", active: true }],
  courses: [
    {
      id: "c1",
      name: "Curso A",
      teacherIds: ["t1"],
      weeklySessions: 2,
      blocksPerSession: 1,
      active: true,
    },
  ],
  requirements: [],
  conflictRules: [],
  preferences: [],
};

const morningSession: PlacedSession = {
  requirementId: "r1",
  courseId: "c1",
  day: "monday",
  blockId: "1-2", // starts at 08:15 → hour 8 < 12 → morning
  teacherIds: ["t1"],
  state: "draft",
};

const afternoonSession: PlacedSession = {
  requirementId: "r2",
  courseId: "c1",
  day: "tuesday",
  blockId: "9-10", // starts at 14:30 → hour 14 ≥ 12 → afternoon
  teacherIds: ["t1"],
  state: "draft",
};

function withPref(pref: Omit<Preference, "id">): Period {
  return {
    ...twoSessionPeriod,
    preferences: [{ id: "p1", ...pref }],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("scoreProposal", () => {
  it("preferMorning — awards weight per morning session", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "preferMorning",
      value: "",
      weight: 10,
      active: true,
    });

    // One morning session → score = 100 (base) + 10 (morning) = 110
    const { score, issues } = scoreProposal(period, [morningSession]);
    expect(score).toBe(110);
    expect(issues).toHaveLength(0);
  });

  it("preferMorning — does NOT award afternoon sessions", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "preferMorning",
      value: "",
      weight: 10,
      active: true,
    });

    // One afternoon session → score = 100 (base) + 0 = 100
    const { score } = scoreProposal(period, [afternoonSession]);
    expect(score).toBe(100);
  });

  it("preferDay — awards weight for sessions on the preferred day", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "preferDay",
      value: "monday",
      weight: 5,
      active: true,
    });

    // Monday session → score = 100 + 5 = 105; Tuesday session → 100
    const { score: monday } = scoreProposal(period, [morningSession]);
    const { score: tuesday } = scoreProposal(period, [afternoonSession]);
    expect(monday).toBe(105);
    expect(tuesday).toBe(100);
  });

  it("avoidDay — deducts weight and emits a warning issue", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "avoidDay",
      value: "monday",
      weight: 7,
      active: true,
    });

    // Monday session is penalised → 100 - 7 = 93
    const { score, issues } = scoreProposal(period, [morningSession]);
    expect(score).toBe(93);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("AVOID_DAY_VIOLATED");
  });

  it("avoidDay — does NOT penalise sessions on other days", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "avoidDay",
      value: "monday",
      weight: 7,
      active: true,
    });

    // Tuesday session is not penalised → score = 100
    const { score, issues } = scoreProposal(period, [afternoonSession]);
    expect(score).toBe(100);
    expect(issues).toHaveLength(0);
  });

  it("spreadSessions — awards weight when sessions are on different days", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "spreadSessions",
      value: "",
      weight: 8,
      active: true,
    });

    // Two sessions on different days → 100 + 8 = 108
    const { score, issues } = scoreProposal(period, [morningSession, afternoonSession]);
    expect(score).toBe(108);
    expect(issues).toHaveLength(0);
  });

  it("spreadSessions — emits suggestion when sessions share a day", () => {
    const period = withPref({
      scope: "period",
      targetId: "",
      kind: "spreadSessions",
      value: "",
      weight: 8,
      active: true,
    });

    const mondaySession2: PlacedSession = {
      ...afternoonSession,
      day: "monday",
      requirementId: "r2-mon",
    };

    // Both sessions on monday → no bonus, one suggestion
    const { score, issues } = scoreProposal(period, [morningSession, mondaySession2]);
    expect(score).toBe(100);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe("SPREAD_SESSIONS_VIOLATED");
  });
});

describe("Scheduler", () => {
  it("generates schedule proposals with alternatives", () => {
    const proposals = generateScheduleProposals(samplePeriod, 3);

    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.length).toBeLessThanOrEqual(3);

    const best = proposals[0];
    const conflicts = best.issues.filter(
      (issue) => issue.severity === "conflict" || issue.severity === "error"
    );
    expect(conflicts).toHaveLength(0);

    if (proposals.length > 1) {
      expect(proposals[0].score).toBeGreaterThanOrEqual(proposals[1].score);
    }
  });

  it("handles locked requirements and places them correctly", () => {
    const periodWithLocks = {
      ...samplePeriod,
      requirements: samplePeriod.requirements.map((req) => {
        if (req.courseId === "c3") {
          return { ...req, lockedDay: "monday" as const, lockedBlockId: "1-2" };
        }
        return req;
      }),
    };

    const proposals = generateScheduleProposals(periodWithLocks, 1);
    expect(proposals).toHaveLength(1);

    const best = proposals[0];
    const placedC3 = best.sessions.find((s) => s.courseId === "c3");
    expect(placedC3).toBeDefined();
    expect(placedC3!.day).toBe("monday");
    expect(placedC3!.blockId).toBe("1-2");
  });

  it("returns invalid-period proposal if period itself is invalid", () => {
    const invalidPeriod = {
      ...samplePeriod,
      courses: [
        {
          id: "c1",
          name: "Espanol 1",
          teacherIds: [],
          weeklySessions: 2,
          blocksPerSession: 1,
          active: true,
        },
      ],
    };
    const proposals = generateScheduleProposals(invalidPeriod, 1);
    expect(proposals).toHaveLength(1);
    expect(proposals[0].id).toBe("invalid-period");
    expect(proposals[0].score).toBe(-Infinity);
  });

  it("locked-session conflicts return score -Infinity (not -1000)", () => {
    // Force a locked conflict by locking the same slot for two courses that share a teacher
    const conflictedPeriod: Period = {
      id: "test-lock-conflict",
      name: "Lock Conflict",
      timeBlocks: [...DEFAULT_TIME_BLOCKS],
      teachers: [{ id: "t1", name: "Ana", active: true }],
      courses: [
        { id: "c1", name: "A", teacherIds: ["t1"], weeklySessions: 1, blocksPerSession: 1, active: true },
        { id: "c2", name: "B", teacherIds: ["t1"], weeklySessions: 1, blocksPerSession: 1, active: true },
      ],
      requirements: [
        { id: "r1", courseId: "c1", lockedDay: "monday", lockedBlockId: "1-2" },
        { id: "r2", courseId: "c2", lockedDay: "monday", lockedBlockId: "1-2" },
      ],
      conflictRules: [],
      preferences: [],
    };
    const proposals = generateScheduleProposals(conflictedPeriod, 1);
    expect(proposals[0].score).toBe(-Infinity);
  });
});
