import { Period, PlacedSession, ScheduleIssue, Weekday } from "./types";
import { WEEKDAY_LABELS } from "./constants";

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

  const activeBlocks = period.timeBlocks.filter(b => b.active);
  const activeBlockIds = activeBlocks.map(b => b.id);
  const activeBlocksSet = new Set(activeBlockIds);
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));
  const activeRules = period.conflictRules.filter(r => r.active);

  // Maps to track teacher bookings per (teacherId, day, blockId)
  interface TeacherBookingEntry {
    teacherId: string;
    day: Weekday;
    blockId: string;
    sessions: PlacedSession[];
  }
  const teacherBookings = new Map<string, TeacherBookingEntry>();

  // Maps to track active courses per (day, blockId)
  interface SlotCoursesEntry {
    day: Weekday;
    blockId: string;
    courses: Set<string>;
  }
  const slotCourses = new Map<string, SlotCoursesEntry>();

  // Deduplicate TEACHER_UNAVAILABLE per (teacherId, requirementId) — fix #8
  const teacherUnavailableReported = new Set<string>();

  for (const session of sessions) {
    // INVALID_BLOCK: session references missing or inactive block.
    if (!activeBlocksSet.has(session.blockId)) {
      issues.push({
        severity: "error",
        code: "INVALID_BLOCK",
        message: `La sesión del curso '${session.courseId}' usa una clave horaria inexistente o inactiva '${session.blockId}'.`,
        entityIds: [session.requirementId, session.courseId, session.blockId]
      });
      continue;
    }

    const course = coursesMap.get(session.courseId);
    const k = course ? course.blocksPerSession : 1;
    const startIndex = activeBlockIds.indexOf(session.blockId);

    // INSUFFICIENT_BLOCKS: session extends beyond active blocks of the day
    if (startIndex + k > activeBlocks.length) {
      issues.push({
        severity: "conflict",
        code: "INSUFFICIENT_BLOCKS",
        message: `El curso '${course?.name || session.courseId}' requiere ${k} bloque(s) pero comienza en '${session.blockId}', lo cual excede el límite del día.`,
        entityIds: [session.requirementId, session.courseId]
      });
    }

    // Determine all occupied block IDs for this session
    const occupiedBlockIds: string[] = [];
    for (let i = 0; i < k; i++) {
      if (startIndex + i < activeBlocks.length) {
        occupiedBlockIds.push(activeBlocks[startIndex + i].id);
      }
    }

    const teachers = session.teacherIds && session.teacherIds.length > 0
      ? session.teacherIds
      : (course ? course.teacherIds : []);

    for (const bId of occupiedBlockIds) {
      // TEACHER_DOUBLE_BOOKED: same teacher in same day and occupied block
      for (const teacherId of teachers) {
        const key = `${teacherId}_${session.day}_${bId}`;
        let booking = teacherBookings.get(key);
        if (!booking) {
          booking = { teacherId, day: session.day, blockId: bId, sessions: [] };
          teacherBookings.set(key, booking);
        }
        if (!booking.sessions.some(s => s.requirementId === session.requirementId)) {
          booking.sessions.push(session);
        }

        // TEACHER_UNAVAILABLE — one issue per (teacher, session), not per block (fix #8)
        const unavailKey = `${teacherId}_${session.requirementId}`;
        if (!teacherUnavailableReported.has(unavailKey)) {
          const teacher = period.teachers.find(t => t.id === teacherId);
          if (teacher && teacher.availability) {
            const availableBlocks = teacher.availability[session.day] || [];
            if (!availableBlocks.includes(bId)) {
              teacherUnavailableReported.add(unavailKey);
              issues.push({
                severity: "conflict",
                code: "TEACHER_UNAVAILABLE",
                message: `El profesor '${teacher.name}' no está disponible el ${WEEKDAY_LABELS[session.day] ?? session.day} en el bloque '${bId}'.`,
                entityIds: [session.requirementId, teacherId, bId]
              });
            }
          }
        }
      }

      // Track courses in slot
      const slotKey = `${session.day}_${bId}`;
      let slotEntry = slotCourses.get(slotKey);
      if (!slotEntry) {
        slotEntry = { day: session.day, blockId: bId, courses: new Set() };
        slotCourses.set(slotKey, slotEntry);
      }
      slotEntry.courses.add(session.courseId);
    }
  }

  // Check double bookings
  for (const booking of teacherBookings.values()) {
    if (booking.sessions.length > 1) {
      const { teacherId, day, blockId, sessions: bookedSessions } = booking;
      const teacher = period.teachers.find(t => t.id === teacherId);
      const teacherName = teacher ? teacher.name : teacherId;
      const courseNames = bookedSessions.map(s => {
        const c = coursesMap.get(s.courseId);
        return c ? c.name : s.courseId;
      }).join(", ");

      issues.push({
        severity: "conflict",
        code: "TEACHER_DOUBLE_BOOKED",
        message: `El profesor '${teacherName}' está duplicado el ${WEEKDAY_LABELS[day] ?? day} en el bloque '${blockId}' para los cursos: ${courseNames}.`,
        entityIds: bookedSessions.map(s => s.requirementId).concat(teacherId)
      });
    }
  }

  // COURSE_CONFLICT: active rule has both courses in same day and block.
  const courseConflictReported = new Set<string>();
  for (const rule of activeRules) {
    for (const slot of slotCourses.values()) {
      if (slot.courses.has(rule.courseAId) && slot.courses.has(rule.courseBId)) {
        const conflictKey = `${rule.id}_${slot.day}`;
        if (courseConflictReported.has(conflictKey)) continue;
        courseConflictReported.add(conflictKey);
        const { day, blockId } = slot;
        const courseAName = coursesMap.get(rule.courseAId)?.name || rule.courseAId;
        const courseBName = coursesMap.get(rule.courseBId)?.name || rule.courseBId;

        // Find relevant sessions that occupy this specific block on this day
        const relevantSessions = sessions.filter(s => {
          const course = coursesMap.get(s.courseId);
          const k = course ? course.blocksPerSession : 1;
          const sIdx = activeBlockIds.indexOf(s.blockId);
          if (sIdx === -1) return false;

          const bIdx = activeBlockIds.indexOf(blockId);
          return s.day === day && bIdx >= sIdx && bIdx < sIdx + k && (s.courseId === rule.courseAId || s.courseId === rule.courseBId);
        });

        issues.push({
          severity: "conflict",
          code: "COURSE_CONFLICT",
          message: `Conflicto entre '${courseAName}' y '${courseBName}' el ${WEEKDAY_LABELS[day] ?? day} en el bloque '${blockId}': ${rule.reason}.`,
          entityIds: [rule.id, rule.courseAId, rule.courseBId].concat(relevantSessions.map(s => s.requirementId))
        });
      }
    }
  }

  // GROUP_CONFLICT: two or more courses from the same student group share a slot.
  const activeGroups = (period.studentGroups || []).filter(g => g.active);
  const groupConflictReported = new Set<string>();
  for (const group of activeGroups) {
    for (const slot of slotCourses.values()) {
      const coursesInSlot = group.courseIds.filter(id => slot.courses.has(id));
      if (coursesInSlot.length < 2) continue;
      const { day, blockId } = slot;
      // Dedup: one issue per (group, day, sorted pair) — multi-block sessions would fire per block otherwise
      const pairKey = `${group.id}_${day}_${[...coursesInSlot].sort().join(",")}`;
      if (groupConflictReported.has(pairKey)) continue;
      groupConflictReported.add(pairKey);

      const courseNames = coursesInSlot.map(id => coursesMap.get(id)?.name || id).join(", ");
      const relevantSessions = sessions.filter(s => {
        const course = coursesMap.get(s.courseId);
        const k = course ? course.blocksPerSession : 1;
        const sIdx = activeBlockIds.indexOf(s.blockId);
        if (sIdx === -1) return false;
        const bIdx = activeBlockIds.indexOf(blockId);
        return s.day === day && bIdx >= sIdx && bIdx < sIdx + k && coursesInSlot.includes(s.courseId);
      });

      issues.push({
        severity: "conflict",
        code: "GROUP_CONFLICT",
        message: `Conflicto en grupo '${group.name}': ${courseNames} se superponen el ${WEEKDAY_LABELS[day] ?? day} en bloque '${blockId}' (comparten estudiantes).`,
        entityIds: [group.id, ...coursesInSlot, ...relevantSessions.map(s => s.requirementId)]
      });
    }
  }

  return issues;
}
