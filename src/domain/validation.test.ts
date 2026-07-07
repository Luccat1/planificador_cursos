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

  it("returns no issues for valid configuration", () => {
    const periodIssues = validatePeriod(samplePeriod);
    expect(periodIssues.filter(i => i.severity === "error")).toHaveLength(0);
  });
});
