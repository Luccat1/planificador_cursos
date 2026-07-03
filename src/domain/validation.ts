import { Period, PlacedSession, ScheduleIssue } from "./types";

export function validatePeriod(period: Period): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];

  // 1. DUPLICATE_TIME_BLOCK: repeated active block label or id.
  const activeBlocks = period.timeBlocks.filter(b => b.active);
  const blockIds = new Set<string>();
  const blockLabels = new Set<string>();

  for (const block of activeBlocks) {
    if (blockIds.has(block.id) || blockLabels.has(block.label)) {
      issues.push({
        severity: "error",
        code: "DUPLICATE_TIME_BLOCK",
        message: `Clave horaria duplicada: id '${block.id}' o etiqueta '${block.label}'`,
        entityIds: [block.id]
      });
    }
    blockIds.add(block.id);
    blockLabels.add(block.label);
  }

  // Teachers lookup map
  const activeTeachers = new Map(period.teachers.filter(t => t.active).map(t => [t.id, t]));

  // Courses validation
  const activeCourses = period.courses.filter(c => c.active);
  for (const course of activeCourses) {
    // COURSE_WITHOUT_TEACHER: active course has empty teacherIds.
    if (!course.teacherIds || course.teacherIds.length === 0) {
      issues.push({
        severity: "error",
        code: "COURSE_WITHOUT_TEACHER",
        message: `El curso '${course.name}' no tiene profesores asignados.`,
        entityIds: [course.id]
      });
    } else {
      // UNKNOWN_TEACHER: course references missing or inactive teacher.
      for (const tId of course.teacherIds) {
        if (!activeTeachers.has(tId)) {
          issues.push({
            severity: "error",
            code: "UNKNOWN_TEACHER",
            message: `El curso '${course.name}' referencia al profesor inexistente o inactivo '${tId}'.`,
            entityIds: [course.id, tId]
          });
        }
      }
    }

    // COURSE_WITHOUT_SESSIONS: active course has weeklySessions < 1.
    if (course.weeklySessions < 1) {
      issues.push({
        severity: "error",
        code: "COURSE_WITHOUT_SESSIONS",
        message: `El curso '${course.name}' requiere al menos 1 sesión semanal.`,
        entityIds: [course.id]
      });
    }
  }

  // Conflict rules validation
  const activeRules = period.conflictRules.filter(r => r.active);
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));

  for (const rule of activeRules) {
    const courseA = coursesMap.get(rule.courseAId);
    const courseB = coursesMap.get(rule.courseBId);

    if (!courseA || !courseA.active || !courseB || !courseB.active) {
      issues.push({
        severity: "error",
        code: "UNKNOWN_COURSE_IN_RULE",
        message: `La regla de conflicto '${rule.reason}' referencia a un curso inexistente o inactivo.`,
        entityIds: [rule.id, rule.courseAId, rule.courseBId]
      });
    }
  }

  return issues;
}

export function validatePlacedSessions(period: Period, sessions: PlacedSession[]): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];

  const activeBlocks = new Set(period.timeBlocks.filter(b => b.active).map(b => b.id));
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));
  const activeRules = period.conflictRules.filter(r => r.active);

  // Maps to track: (teacherId + "_" + day + "_" + blockId) => [sessions]
  const teacherBookings = new Map<string, PlacedSession[]>();

  // Maps to track: (day + "_" + blockId) => Set of active courses in that slot
  const slotCourses = new Map<string, Set<string>>();

  for (const session of sessions) {
    // INVALID_BLOCK: session references missing or inactive block.
    if (!activeBlocks.has(session.blockId)) {
      issues.push({
        severity: "error",
        code: "INVALID_BLOCK",
        message: `La sesión del curso '${session.courseId}' usa una clave horaria inexistente o inactiva '${session.blockId}'.`,
        entityIds: [session.requirementId, session.courseId, session.blockId]
      });
    }

    // Load teacherIds for this session (either from session itself or fallback to course teachers)
    const course = coursesMap.get(session.courseId);
    const teachers = session.teacherIds && session.teacherIds.length > 0
      ? session.teacherIds
      : (course ? course.teacherIds : []);

    // TEACHER_DOUBLE_BOOKED: same teacher in same day and block.
    for (const teacherId of teachers) {
      const key = `${teacherId}_${session.day}_${session.blockId}`;
      if (!teacherBookings.has(key)) {
        teacherBookings.set(key, []);
      }
      teacherBookings.get(key)!.push(session);
    }

    // Track courses in slot
    const slotKey = `${session.day}_${session.blockId}`;
    if (!slotCourses.has(slotKey)) {
      slotCourses.set(slotKey, new Set());
    }
    slotCourses.get(slotKey)!.add(session.courseId);
  }

  // Check double bookings
  for (const [key, bookedSessions] of teacherBookings.entries()) {
    if (bookedSessions.length > 1) {
      const parts = key.split("_");
      const teacherId = parts[0];
      const day = parts[1];
      const blockId = parts[2];

      const teacher = period.teachers.find(t => t.id === teacherId);
      const teacherName = teacher ? teacher.name : teacherId;
      const courseNames = bookedSessions.map(s => {
        const c = coursesMap.get(s.courseId);
        return c ? c.name : s.courseId;
      }).join(", ");

      issues.push({
        severity: "conflict",
        code: "TEACHER_DOUBLE_BOOKED",
        message: `El profesor '${teacherName}' está duplicado el ${translateDay(day)} en el bloque '${blockId}' para los cursos: ${courseNames}.`,
        entityIds: bookedSessions.map(s => s.requirementId).concat(teacherId)
      });
    }
  }

  // COURSE_CONFLICT: active rule has both courses in same day and block.
  for (const rule of activeRules) {
    for (const [slotKey, coursesInSlot] of slotCourses.entries()) {
      if (coursesInSlot.has(rule.courseAId) && coursesInSlot.has(rule.courseBId)) {
        const parts = slotKey.split("_");
        const day = parts[0];
        const blockId = parts[1];

        const courseAName = coursesMap.get(rule.courseAId)?.name || rule.courseAId;
        const courseBName = coursesMap.get(rule.courseBId)?.name || rule.courseBId;

        // Find relevant sessions to associate with this issue
        const relevantSessions = sessions.filter(s =>
          s.day === day && s.blockId === blockId && (s.courseId === rule.courseAId || s.courseId === rule.courseBId)
        );

        issues.push({
          severity: "conflict",
          code: "COURSE_CONFLICT",
          message: `Conflicto entre '${courseAName}' y '${courseBName}' el ${translateDay(day)} en el bloque '${blockId}': ${rule.reason}.`,
          entityIds: [rule.id, rule.courseAId, rule.courseBId].concat(relevantSessions.map(s => s.requirementId))
        });
      }
    }
  }

  return issues;
}

function translateDay(day: string): string {
  const translations: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes"
  };
  return translations[day] || day;
}
