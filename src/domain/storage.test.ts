import { describe, it, expect } from "vitest";
import { serializePeriod, parsePeriodJson } from "./storage";
import { samplePeriod } from "../test/fixtures";

describe("JSON Storage", () => {
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
});
