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

  it("returns no issues for valid configuration", () => {
    const periodIssues = validatePeriod(samplePeriod);
    expect(periodIssues.filter(i => i.severity === "error")).toHaveLength(0);
  });
});
