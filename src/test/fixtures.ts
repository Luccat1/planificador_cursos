import { Period, PlacedSession } from "../domain/types";
import { DEFAULT_TIME_BLOCKS } from "../domain/seeds";

export const samplePeriod: Period = {
  id: "2026-2",
  name: "2026-2",
  timeBlocks: [...DEFAULT_TIME_BLOCKS],
  teachers: [
    { id: "t1", name: "Andres", active: true },
    { id: "t2", name: "Sebastian", active: true },
    { id: "t3", name: "Ricardo", active: true }
  ],
  courses: [
    { id: "c1", name: "Espanol 1", teacherIds: ["t1"], weeklySessions: 2, blocksPerSession: 1, active: true },
    { id: "c2", name: "Espanol 2", teacherIds: ["t2"], weeklySessions: 2, blocksPerSession: 1, active: true },
    { id: "c3", name: "Cultura Chilena", teacherIds: ["t3"], weeklySessions: 1, blocksPerSession: 1, active: true }
  ],
  requirements: [
    { id: "r1", courseId: "c1" },
    { id: "r2", courseId: "c1" },
    { id: "r3", courseId: "c2" },
    { id: "r4", courseId: "c2" },
    { id: "r5", courseId: "c3" }
  ],
  conflictRules: [
    { id: "cr1", courseAId: "c1", courseBId: "c3", reason: "Cruce no permitido", active: true },
    { id: "cr2", courseAId: "c2", courseBId: "c3", reason: "Cruce no permitido", active: true }
  ],
  preferences: []
};

// Fixture: Course without teacher
export const periodWithCourseWithoutTeacher: Period = {
  ...samplePeriod,
  courses: [
    { id: "c1", name: "Espanol 1", teacherIds: [], weeklySessions: 2, blocksPerSession: 1, active: true }
  ]
};

// Fixture: Duplicate time block
export const periodWithDuplicateBlock: Period = {
  ...samplePeriod,
  timeBlocks: [
    { id: "1-2", label: "1-2", start: "08:15", end: "09:25", active: true },
    { id: "1-2", label: "Otro", start: "09:30", end: "10:40", active: true }
  ]
};

// PlacedSession scenarios:
export const periodForDoubleBooking: Period = {
  ...samplePeriod,
  courses: [
    ...samplePeriod.courses,
    { id: "c4", name: "Variedades", teacherIds: ["t1"], weeklySessions: 1, blocksPerSession: 1, active: true }
  ],
  requirements: [
    ...samplePeriod.requirements,
    { id: "r6", courseId: "c4" }
  ]
};

export const sameTeacherSameSlotSessions: PlacedSession[] = [
  { requirementId: "r1", courseId: "c1", day: "monday", blockId: "1-2", teacherIds: ["t1"], state: "draft" },
  { requirementId: "r6", courseId: "c4", day: "monday", blockId: "1-2", teacherIds: ["t1"], state: "draft" }
];

export const incompatibleCoursesSameSlotSessions: PlacedSession[] = [
  { requirementId: "r1", courseId: "c1", day: "monday", blockId: "1-2", teacherIds: ["t1"], state: "draft" },
  { requirementId: "r5", courseId: "c3", day: "monday", blockId: "1-2", teacherIds: ["t3"], state: "draft" }
];
