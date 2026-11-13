import { describe, it, expect } from "vitest";
import { validatePeriod, validatePlacedSessions } from "./validation";
import {
  samplePeriod,
  periodWithCourseWithoutTeacher,
  periodWithDuplicateBlock,
  periodForDoubleBooking,
  sameTeacherSameSlotSessions,
  incompatibleCoursesSameSlotSessions
} from "../test/fixtures";

describe("Validation", () => {
  it("detects course without teacher", () => {
    const issues = validatePeriod(periodWithCourseWithoutTeacher);
    expect(issues).toContainEqual(expect.objectContaining({ code: "COURSE_WITHOUT_TEACHER" }));
  });

  it("detects duplicate time blocks", () => {
    const issues = validatePeriod(periodWithDuplicateBlock);
    expect(issues).toContainEqual(expect.objectContaining({ code: "DUPLICATE_TIME_BLOCK" }));
  });

  it("detects double booked teachers", () => {
    const issues = validatePlacedSessions(periodForDoubleBooking, sameTeacherSameSlotSessions);
    expect(issues).toContainEqual(expect.objectContaining({ code: "TEACHER_DOUBLE_BOOKED" }));
  });

  it("detects incompatible course overlaps", () => {
    const issues = validatePlacedSessions(samplePeriod, incompatibleCoursesSameSlotSessions);
    expect(issues).toContainEqual(expect.objectContaining({ code: "COURSE_CONFLICT" }));
  });

  it("detects teacher availability conflicts", () => {
    const periodWithAvailability = {
      ...samplePeriod,
      teachers: [
        {
          id: "t1",
          name: "Andres",
          active: true,
          availability: {
            monday: ["1-2"]
          }
        },
        ...samplePeriod.teachers.filter(t => t.id !== "t1")
      ]
    };

    // Case A: Placed session on Monday in block "1-2" (within availability) -> no issues
    const validSession = [
      { requirementId: "r1", courseId: "c1", day: "monday" as const, blockId: "1-2", teacherIds: ["t1"], state: "draft" as const }
    ];
    const noIssues = validatePlacedSessions(periodWithAvailability, validSession);
    expect(noIssues.filter(i => i.code === "TEACHER_UNAVAILABLE")).toHaveLength(0);

    // Case B: Placed session on Tuesday in block "1-2" (outside availability) -> should report conflict
    const invalidSession = [
      { requirementId: "r1", courseId: "c1", day: "tuesday" as const, blockId: "1-2", teacherIds: ["t1"], state: "draft" as const }
    ];
    const issues = validatePlacedSessions(periodWithAvailability, invalidSession);
    expect(issues).toContainEqual(expect.objectContaining({ code: "TEACHER_UNAVAILABLE" }));
  });

  it("reports the exact unavailable block (bId) for multi-block sessions", () => {
    // c1 is 2 blocks per session, starting at block "1-2" (so occupies "1-2" and "3-4")
    const periodWith2Blocks = {
      ...samplePeriod,
      courses: samplePeriod.courses.map(c =>
        c.id === "c1" ? { ...c, blocksPerSession: 2 } : c
      ),
      teachers: [
        {
          id: "t1",
          name: "Andres",
          active: true,
          availability: {
            monday: ["1-2"] // Available at "1-2", but NOT at "3-4"
          }
        },
        ...samplePeriod.teachers.filter(t => t.id !== "t1")
      ]
    };

    const multiBlockSession = [
      { requirementId: "r1", courseId: "c1", day: "monday" as const, blockId: "1-2", teacherIds: ["t1"], state: "draft" as const }
    ];

    const issues = validatePlacedSessions(periodWith2Blocks, multiBlockSession);
    const unavailIssue = issues.find(i => i.code === "TEACHER_UNAVAILABLE");
    expect(unavailIssue).toBeDefined();
    // The conflict must report block "3-4", NOT "1-2"
    expect(unavailIssue!.message).toContain("3-4");
    expect(unavailIssue!.message).not.toContain("1-2");
    expect(unavailIssue!.entityIds).toContain("3-4");
    expect(unavailIssue!.entityIds).not.toContain("1-2");
  });

  it("handles IDs with underscores correctly without corrupting day in error messages", () => {
    const periodWithUnderscoreIds = {
      ...samplePeriod,
      teachers: [
        { id: "t_lead_1", name: "Docente Principal", active: true }
      ],
      courses: [
        { id: "c_math_1", name: "Matematica 1", teacherIds: ["t_lead_1"], weeklySessions: 1, blocksPerSession: 1, active: true },
        { id: "c_math_2", name: "Matematica 2", teacherIds: ["t_lead_1"], weeklySessions: 1, blocksPerSession: 1, active: true }
      ]
    };

    const doubleBookedSessions = [
      { requirementId: "r_1", courseId: "c_math_1", day: "monday" as const, blockId: "1-2", teacherIds: ["t_lead_1"], state: "draft" as const },
      { requirementId: "r_2", courseId: "c_math_2", day: "monday" as const, blockId: "1-2", teacherIds: ["t_lead_1"], state: "draft" as const }
    ];

    const issues = validatePlacedSessions(periodWithUnderscoreIds, doubleBookedSessions);
    const doubleBooked = issues.find(i => i.code === "TEACHER_DOUBLE_BOOKED");
    expect(doubleBooked).toBeDefined();
    // Message should properly say "Lunes", not "lead" or "1"
    expect(doubleBooked!.message).toContain("Lunes");
    expect(doubleBooked!.message).toContain("1-2");
  });

  it("detects insufficient blocks when a multi-block session exceeds the day boundary", () => {
    const periodWithMultiBlock = {
      ...samplePeriod,
      courses: samplePeriod.courses.map(c =>
        c.id === "c1" ? { ...c, blocksPerSession: 2 } : c
      )
    };
    const activeBlocks = periodWithMultiBlock.timeBlocks.filter(b => b.active);
    const lastBlock = activeBlocks[activeBlocks.length - 1];

    const sessionAtLastBlock = [
      {
        requirementId: "r-last",
        courseId: "c1",
        day: "monday" as const,
        blockId: lastBlock.id,
        teacherIds: ["t1"],
        state: "draft" as const
      }
    ];

    const issues = validatePlacedSessions(periodWithMultiBlock, sessionAtLastBlock);
    expect(issues).toContainEqual(
      expect.objectContaining({
        code: "INSUFFICIENT_BLOCKS"
      })
    );
  });

  it("returns no issues for valid configuration", () => {
    const periodIssues = validatePeriod(samplePeriod);
    expect(periodIssues.filter(i => i.severity === "error")).toHaveLength(0);
  });

  it("reports exactly one COURSE_CONFLICT for multi-block sessions on the same day", () => {
    const period = {
      ...samplePeriod,
      courses: samplePeriod.courses.map(c =>
        c.id === "c1" || c.id === "c3" ? { ...c, blocksPerSession: 2 } : c
      )
    };
    // c1 and c3 have a conflict rule (cr1); both start at the same block → each occupies 2 blocks
    const sessions = [
      { requirementId: "r1", courseId: "c1", day: "monday" as const, blockId: "1-2", teacherIds: ["t1"], state: "draft" as const },
      { requirementId: "r5", courseId: "c3", day: "monday" as const, blockId: "1-2", teacherIds: ["t3"], state: "draft" as const }
    ];
    const issues = validatePlacedSessions(period, sessions);
    expect(issues.filter(i => i.code === "COURSE_CONFLICT")).toHaveLength(1);
  });
});
