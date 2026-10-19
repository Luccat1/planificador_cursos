import { Period } from "./types";

const STORAGE_KEY = "period-v1";

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

  // Validate array contents to prevent null / corrupt elements crashing the UI
  if (
    !parsed.teachers.every(
      (t: unknown) =>
        t !== null &&
        typeof t === "object" &&
        typeof (t as Record<string, unknown>).id === "string" &&
        typeof (t as Record<string, unknown>).name === "string"
    )
  ) {
    throw new Error("La lista de profesores contiene elementos inválidos o nulos.");
  }
  if (
    !parsed.courses.every(
      (c: unknown) =>
        c !== null &&
        typeof c === "object" &&
        typeof (c as Record<string, unknown>).id === "string" &&
        typeof (c as Record<string, unknown>).name === "string"
    )
  ) {
    throw new Error("La lista de cursos contiene elementos inválidos o nulos.");
  }
  if (
    !parsed.timeBlocks.every(
      (b: unknown) =>
        b !== null &&
        typeof b === "object" &&
        typeof (b as Record<string, unknown>).id === "string"
    )
  ) {
    throw new Error("La lista de claves horarias contiene elementos inválidos o nulos.");
  }

  return parsed as Period;
}

/** Persist period to localStorage (versioned key avoids stale schema reads). */
export function savePeriodToStorage(period: Period): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializePeriod(period));
  } catch {
    // Storage quota exceeded or private-browsing restriction — fail silently.
  }
}

/** Read period from localStorage. Returns null if absent or corrupt. */
export function loadPeriodFromStorage(): Period | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parsePeriodJson(raw);
  } catch {
    // Corrupt data — remove and start fresh.
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
