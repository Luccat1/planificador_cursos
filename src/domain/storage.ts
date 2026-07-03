import { Period } from "./types";

export function serializePeriod(period: Period): string {
  return JSON.stringify(period, null, 2);
}

export function parsePeriodJson(jsonStr: string): Period {
  const parsed = JSON.parse(jsonStr);
  
  if (!parsed || typeof parsed !== "object") {
    throw new Error("El JSON no es un objeto válido.");
  }
  if (!parsed.id || !parsed.name) {
    throw new Error("El periodo debe contener id y nombre.");
  }
  if (!Array.isArray(parsed.timeBlocks)) {
    throw new Error("Falta la lista de claves horarias (timeBlocks).");
  }
  if (!Array.isArray(parsed.teachers)) {
    throw new Error("Falta la lista de profesores (teachers).");
  }
  if (!Array.isArray(parsed.courses)) {
    throw new Error("Falta la lista de cursos (courses).");
  }
  if (!Array.isArray(parsed.requirements)) {
    throw new Error("Falta la lista de requerimientos (requirements).");
  }
  if (!Array.isArray(parsed.conflictRules)) {
    throw new Error("Falta la lista de reglas de conflicto (conflictRules).");
  }
  if (!Array.isArray(parsed.preferences)) {
    throw new Error("Falta la lista de preferencias (preferences).");
  }

  return parsed as Period;
}
