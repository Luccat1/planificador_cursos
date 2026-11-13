import { describe, it, expect, beforeEach } from "vitest";
import { serializePeriod, parsePeriodJson, savePeriodToStorage, loadPeriodFromStorage } from "./storage";
import { samplePeriod } from "../test/fixtures";

describe("JSON Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("performs correct round-trip serialization and deserialization", () => {
    const jsonStr = serializePeriod(samplePeriod);
    const parsed = parsePeriodJson(jsonStr);

    expect(parsed.id).toBe(samplePeriod.id);
    expect(parsed.name).toBe(samplePeriod.name);
    expect(parsed.teachers).toHaveLength(samplePeriod.teachers.length);
    expect(parsed.courses).toHaveLength(samplePeriod.courses.length);
    expect(parsed.timeBlocks).toHaveLength(samplePeriod.timeBlocks.length);
    expect(parsed.conflictRules).toHaveLength(samplePeriod.conflictRules.length);
  });

  it("throws error for malformed or incomplete period JSON", () => {
    expect(() => parsePeriodJson("{}")).toThrow();
    expect(() => parsePeriodJson("invalid-json")).toThrow();
  });

  it("throws error when course teacherIds is null or not an array", () => {
    const invalidPeriodData = {
      ...samplePeriod,
      courses: [
        { id: "c1", name: "Curso 1", teacherIds: null, weeklySessions: 1, blocksPerSession: 1, active: true }
      ]
    };
    expect(() => parsePeriodJson(JSON.stringify(invalidPeriodData))).toThrow(
      "La lista de cursos contiene elementos inválidos o nulos."
    );
  });

  it("saves valid period to storage and loads it back", () => {
    savePeriodToStorage(samplePeriod);
    const loaded = loadPeriodFromStorage();
    expect(loaded).toEqual(samplePeriod);
  });

  it("clears storage and returns null if stored period is corrupt", () => {
    localStorage.setItem("period-v1", "corrupt-json-{foo");
    const loaded = loadPeriodFromStorage();
    expect(loaded).toBeNull();
    // Verify that the corrupt entry was purged
    expect(localStorage.getItem("period-v1")).toBeNull();
  });

  it("returns null if storage is empty", () => {
    expect(loadPeriodFromStorage()).toBeNull();
  });
});
