import { Weekday } from "./types";

/** Single source of truth for weekday → Spanish label */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
};

/** Single source of truth for Spanish → Weekday (handles accented and plain variants) */
export const SPANISH_TO_WEEKDAY: Record<string, Weekday> = {
  lunes: "monday",
  martes: "tuesday",
  miércoles: "wednesday",
  miercoles: "wednesday",
  jueves: "thursday",
  viernes: "friday",
};

export const VALID_PREFERENCE_SCOPES = ["period", "course", "teacher"] as const;
export const VALID_PREFERENCE_KINDS = [
  "preferMorning",
  "preferDay",
  "avoidDay",
  "spreadSessions",
] as const;
