import { Period, PlacedSession, ScheduleProposal, ScheduleIssue, Weekday, SessionRequirement } from "./types";
import { validatePeriod, validatePlacedSessions } from "./validation";

function getRequirementsToPlace(period: Period): SessionRequirement[] {
  const activeCourses = period.courses.filter(c => c.active);
  const result: SessionRequirement[] = [];

  for (const course of activeCourses) {
    const existing = period.requirements.filter(r => r.courseId === course.id);
    for (let i = 0; i < course.weeklySessions; i++) {
      if (i < existing.length) {
        result.push(existing[i]);
      } else {
        result.push({
          id: `${course.id}-req-${i + 1}`,
          courseId: course.id
        });
      }
    }
  }
  return result;
}

export function scoreProposal(period: Period, sessions: PlacedSession[]): { score: number; issues: ScheduleIssue[] } {
  let score = 100; // Base score
  const issues: ScheduleIssue[] = [];

  const coursesMap = new Map(period.courses.map(c => [c.id, c]));
  const activePreferences = period.preferences.filter(p => p.active);

  // Group sessions by course
  const sessionsByCourse = new Map<string, PlacedSession[]>();
  for (const s of sessions) {
    if (!sessionsByCourse.has(s.courseId)) {
      sessionsByCourse.set(s.courseId, []);
    }
    sessionsByCourse.get(s.courseId)!.push(s);
  }

  // Calculate score and warnings per preference
  for (const pref of activePreferences) {
    const weight = pref.weight;

    if (pref.kind === "preferMorning") {
      const targets = sessions.filter(s => {
        if (pref.scope === "course" && s.courseId !== pref.targetId) return false;
        if (pref.scope === "teacher" && !s.teacherIds.includes(pref.targetId)) return false;
        
        const block = period.timeBlocks.find(b => b.id === s.blockId);
        if (!block) return false;
        const [hourStr] = block.start.split(":");
        const hour = parseInt(hourStr, 10);
        return hour < 12;
      });

      score += targets.length * weight;
    }

    else if (pref.kind === "preferDay") {
      const preferredDay = pref.value as Weekday;
      const targets = sessions.filter(s => {
        if (s.day !== preferredDay) return false;
        if (pref.scope === "course" && s.courseId !== pref.targetId) return false;
        if (pref.scope === "teacher" && !s.teacherIds.includes(pref.targetId)) return false;
        return true;
      });

      score += targets.length * weight;
    }

    else if (pref.kind === "avoidDay") {
      const avoidedDay = pref.value as Weekday;
      const targets = sessions.filter(s => {
        if (s.day !== avoidedDay) return false;
        if (pref.scope === "course" && s.courseId !== pref.targetId) return false;
        if (pref.scope === "teacher" && !s.teacherIds.includes(pref.targetId)) return false;
        return true;
      });

      score -= targets.length * weight;

      if (targets.length > 0) {
        issues.push({
          severity: "warning",
          code: "AVOID_DAY_VIOLATED",
          message: `Preferencia de evitar el día '${pref.value}' no se cumplió para ${pref.scope === "course" ? "el curso" : "el profesor"} '${pref.targetId}'.`,
          entityIds: [pref.id, pref.targetId]
        });
      }
    }

    else if (pref.kind === "spreadSessions") {
      const coursesToCheck = pref.scope === "course"
        ? [pref.targetId]
        : period.courses.filter(c => c.active).map(c => c.id);

      for (const courseId of coursesToCheck) {
        const courseSessions = sessionsByCourse.get(courseId) || [];
        if (courseSessions.length > 1) {
          const uniqueDays = new Set(courseSessions.map(s => s.day));
          if (uniqueDays.size === courseSessions.length) {
            score += weight;
          } else {
            issues.push({
              severity: "suggestion",
              code: "SPREAD_SESSIONS_VIOLATED",
              message: `Las sesiones del curso '${coursesMap.get(courseId)?.name || courseId}' no están distribuidas en días diferentes.`,
              entityIds: [pref.id, courseId]
            });
          }
        }
      }
    }
  }

  return { score, issues };
}

export function generateScheduleProposals(period: Period, maxAlternatives = 5): ScheduleProposal[] {
  const periodIssues = validatePeriod(period);
  if (periodIssues.some((issue) => issue.severity === "error")) {
    return [{ id: "invalid-period", label: "Periodo inválido", sessions: [], score: -Infinity, issues: periodIssues }];
  }

  const activeBlocks = period.timeBlocks.filter(b => b.active);
  if (activeBlocks.length === 0) {
    return [{
      id: "no-blocks",
      label: "Sin claves horarias",
      sessions: [],
      score: -Infinity,
      issues: [{ severity: "error", code: "NO_ACTIVE_BLOCKS", message: "No hay claves horarias activas en el periodo.", entityIds: [] }]
    }];
  }

  const WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const requirements = getRequirementsToPlace(period);

  const lockedReqs = requirements.filter(r => r.lockedDay && r.lockedBlockId);
  const openReqs = requirements.filter(r => !r.lockedDay || !r.lockedBlockId);

  const initialSessions: PlacedSession[] = [];
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));

  for (const r of lockedReqs) {
    const course = coursesMap.get(r.courseId);
    if (course) {
      initialSessions.push({
        requirementId: r.id,
        courseId: r.courseId,
        day: r.lockedDay!,
        blockId: r.lockedBlockId!,
        teacherIds: course.teacherIds,
        state: "locked"
      });
    }
  }

  const initialIssues = validatePlacedSessions(period, initialSessions);
  if (initialIssues.some(issue => issue.severity === "conflict" || issue.severity === "error")) {
    return [{ id: "no-solution", label: "Sin solución (conflictos en bloqueos manuales)", sessions: initialSessions, score: -1000, issues: initialIssues }];
  }

  const proposals: ScheduleProposal[] = [];
  let leafNodesCount = 0;
  const maxLeafNodes = 5000; // Safeguard to prevent slow execution

  function backtrack(index: number, currentSessions: PlacedSession[]) {
    if (leafNodesCount >= maxLeafNodes || proposals.length >= 100) {
      return;
    }

    if (index === openReqs.length) {
      leafNodesCount++;
      const { score, issues } = scoreProposal(period, currentSessions);
      const validationIssues = validatePlacedSessions(period, currentSessions);
      const allIssues = [...validationIssues, ...issues];

      proposals.push({
        id: `proposal-temp-${proposals.length}`,
        label: `Propuesta ${proposals.length + 1}`,
        sessions: [...currentSessions],
        score,
        issues: allIssues
      });
      return;
    }

    const req = openReqs[index];
    const course = coursesMap.get(req.courseId);
    if (!course) {
      // Skip invalid course requirement
      backtrack(index + 1, currentSessions);
      return;
    }

    for (const day of WEEKDAYS) {
      for (const block of activeBlocks) {
        const newSession: PlacedSession = {
          requirementId: req.id,
          courseId: req.courseId,
          day,
          blockId: block.id,
          teacherIds: course.teacherIds,
          state: "draft"
        };

        const nextSessions = [...currentSessions, newSession];
        const issues = validatePlacedSessions(period, nextSessions);
        
        if (!issues.some(issue => issue.severity === "conflict" || issue.severity === "error")) {
          backtrack(index + 1, nextSessions);
        }
      }
    }
  }

  backtrack(0, initialSessions);

  if (proposals.length === 0) {
    return [{
      id: "no-solution",
      label: "Sin solución viable",
      sessions: initialSessions,
      score: -Infinity,
      issues: [
        {
          severity: "error",
          code: "NO_VIABLE_SCHEDULE",
          message: "No se encontró ningún horario que cumpla con todas las restricciones duras. Pruebe desactivando alguna restricción o profesor.",
          entityIds: []
        }
      ]
    }];
  }

  // Sort descending by score
  proposals.sort((a, b) => b.score - a.score);

  // Return the best and alternative proposals
  const finalProposals = proposals.slice(0, maxAlternatives).map((p, idx) => {
    return {
      ...p,
      id: `proposal-${idx + 1}`,
      label: idx === 0 ? "Propuesta Recomendada" : `Alternativa ${idx}`
    };
  });

  return finalProposals;
}
