import { TimeBlock, Period } from "./types";

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { id: "1-2", label: "1-2", start: "08:15", end: "09:25", active: true },
  { id: "3-4", label: "3-4", start: "09:35", end: "10:45", active: true },
  { id: "5-6", label: "5-6", start: "11:00", end: "12:10", active: true },
  { id: "7-8", label: "7-8", start: "12:20", end: "13:30", active: true },
  { id: "9-10", label: "9-10", start: "14:30", end: "15:40", active: true },
  { id: "11-12", label: "11-12", start: "15:50", end: "17:00", active: true },
  { id: "13-14", label: "13-14", start: "17:10", end: "18:20", active: true },
];

export function createDefaultPeriod(name: string): Period {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name: name,
    timeBlocks: [...DEFAULT_TIME_BLOCKS],
    teachers: [],
    courses: [],
    requirements: [],
    conflictRules: [],
    preferences: [],
  };
}

export function createDemoPeriod(): Period {
  return {
    id: "periodo-demo",
    name: "Periodo Demostrativo (Ejemplo)",
    timeBlocks: [...DEFAULT_TIME_BLOCKS],
    teachers: [
      {
        id: "t-1",
        name: "Andres Sepulveda",
        active: true,
        availability: {
          monday: ["1-2", "3-4"],
          wednesday: ["1-2", "3-4"]
        }
      },
      {
        id: "t-2",
        name: "Marta Gomez",
        active: true,
        availability: {
          tuesday: ["1-2", "3-4", "5-6"],
          thursday: ["1-2", "3-4", "5-6"]
        }
      }
    ],
    courses: [
      {
        id: "c-1",
        name: "Matematicas I",
        teacherIds: ["t-1"],
        weeklySessions: 2,
        blocksPerSession: 2,
        active: true
      },
      {
        id: "c-2",
        name: "Fisica I",
        teacherIds: ["t-2"],
        weeklySessions: 1,
        blocksPerSession: 2,
        active: true
      }
    ],
    requirements: [],
    conflictRules: [
      {
        id: "cr-1",
        courseAId: "c-1",
        courseBId: "c-2",
        reason: "Cursos del mismo semestre",
        active: true
      }
    ],
    preferences: [
      {
        id: "p-1",
        scope: "teacher",
        targetId: "t-1",
        kind: "preferMorning",
        value: "",
        weight: 5,
        active: true
      }
    ]
  };
}

