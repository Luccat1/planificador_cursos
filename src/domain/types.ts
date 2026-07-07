export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
export type SessionState = "draft" | "confirmed" | "locked";
export type PreferenceScope = "period" | "course" | "teacher";
export type PreferenceKind = "preferMorning" | "avoidDay" | "preferDay" | "spreadSessions";

export interface TimeBlock {
  id: string;
  label: string;
  start: string;
  end: string;
  active: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  active: boolean;
  availability?: { [day in Weekday]?: string[] };
}

export interface Course {
  id: string;
  name: string;
  teacherIds: string[];
  weeklySessions: number;
  blocksPerSession: number;
  active: boolean;
}

export interface SessionRequirement {
  id: string;
  courseId: string;
  lockedDay?: Weekday;
  lockedBlockId?: string;
}

export interface PlacedSession {
  requirementId: string;
  courseId: string;
  day: Weekday;
  blockId: string;
  teacherIds: string[];
  state: SessionState;
}

export interface CourseConflictRule {
  id: string;
  courseAId: string;
  courseBId: string;
  reason: string;
  active: boolean;
}

export interface Preference {
  id: string;
  scope: PreferenceScope;
  targetId: string;
  kind: PreferenceKind;
  value: string;
  weight: number;
  active: boolean;
}

export interface Period {
  id: string;
  name: string;
  startsOn?: string;
  endsOn?: string;
  timeBlocks: TimeBlock[];
  teachers: Teacher[];
  courses: Course[];
  requirements: SessionRequirement[];
  conflictRules: CourseConflictRule[];
  preferences: Preference[];
}

export interface ScheduleIssue {
  severity: "error" | "conflict" | "warning" | "suggestion";
  code: string;
  message: string;
  entityIds: string[];
}

export interface ScheduleProposal {
  id: string;
  label: string;
  sessions: PlacedSession[];
  score: number;
  issues: ScheduleIssue[];
}
