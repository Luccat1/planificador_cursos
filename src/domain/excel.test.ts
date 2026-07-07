import { describe, it, expect } from "vitest";
import { buildExcelTemplate, parseExcelTemplate } from "./excel";
import { samplePeriod } from "../test/fixtures";

describe("Excel Storage", () => {
  it("performs round-trip build and parse", () => {
    const buffer = buildExcelTemplate(samplePeriod);
    const parsed = parseExcelTemplate(buffer);

    expect(parsed.teachers).toHaveLength(samplePeriod.teachers.length);
    expect(parsed.teachers[0].name).toBe(samplePeriod.teachers[0].name);

    expect(parsed.courses).toHaveLength(samplePeriod.courses.length);
    expect(parsed.courses[0].name).toBe(samplePeriod.courses[0].name);
    expect(parsed.courses[0].teacherIds).toEqual(samplePeriod.courses[0].teacherIds);

    expect(parsed.timeBlocks).toHaveLength(samplePeriod.timeBlocks.length);
    expect(parsed.conflictRules).toHaveLength(samplePeriod.conflictRules.length);
  });

  it("filters out description rows starting with 'Ej:'", () => {
    const buffer = buildExcelTemplate(samplePeriod);
    const parsed = parseExcelTemplate(buffer);

    const hasDescriptionRow = parsed.teachers.some(t => t.id.startsWith("Ej:") || t.name.startsWith("Ej:"));
    expect(hasDescriptionRow).toBe(false);

    const hasDescriptionCourse = parsed.courses.some(c => c.id.startsWith("Ej:") || c.name.startsWith("Ej:"));
    expect(hasDescriptionCourse).toBe(false);
  });
});
