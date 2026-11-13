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

  it("performs round-trip build and parse preserving teacher availability", () => {
    const periodWithAvailability = {
      ...samplePeriod,
      teachers: [
        {
          id: "t1",
          name: "Andres",
          active: true,
          availability: {
            monday: ["1-2", "3-4"],
            friday: ["5-6"]
          }
        },
        ...samplePeriod.teachers.slice(1)
      ]
    };

    const buffer = buildExcelTemplate(periodWithAvailability);
    const parsed = parseExcelTemplate(buffer);

    const teacher = parsed.teachers.find(t => t.id === "t1");
    expect(teacher).toBeDefined();
    expect(teacher?.availability?.monday).toEqual(["1-2", "3-4"]);
    expect(teacher?.availability?.friday).toEqual(["5-6"]);
  });
});
