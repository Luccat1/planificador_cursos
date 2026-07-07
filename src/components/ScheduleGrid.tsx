import { Period, PlacedSession, Weekday, ScheduleProposal, Course } from "../domain/types";

interface ScheduleGridProps {
  period: Period;
  selectedProposal: ScheduleProposal | null;
  selectedSession: PlacedSession | null;
  onSelectSession: (session: PlacedSession | null) => void;
  onSelectSlot: (day: Weekday, blockId: string) => void;
}

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" }
];

interface LayoutInfo {
  session: PlacedSession;
  left: number;
  width: number;
  topIndex: number;
  heightBlocks: number;
}

function computeDayLayout(
  daySessions: PlacedSession[],
  activeBlockIds: string[],
  coursesMap: Map<string, Course>
): LayoutInfo[] {
  const items = daySessions.map(s => {
    const course = coursesMap.get(s.courseId);
    const k = course ? course.blocksPerSession : 1;
    const idx = activeBlockIds.indexOf(s.blockId);
    return {
      session: s,
      start: idx !== -1 ? idx : 0,
      end: idx !== -1 ? idx + k - 1 : 0,
      k
    };
  });

  items.sort((a, b) => a.start - b.start || b.k - a.k);

  const columns: typeof items[] = [];

  for (const item of items) {
    let placed = false;
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const hasOverlap = columns[colIdx].some(
        other => item.start <= other.end && item.end >= other.start
      );
      if (!hasOverlap) {
        columns[colIdx].push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([item]);
    }
  }

  const result: LayoutInfo[] = [];
  const totalCols = columns.length || 1;

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const item of columns[colIdx]) {
      result.push({
        session: item.session,
        left: (colIdx / totalCols) * 100,
        width: (1 / totalCols) * 100,
        topIndex: item.start,
        heightBlocks: item.k
      });
    }
  }

  return result;
}

export default function ScheduleGrid({
  period,
  selectedProposal,
  selectedSession,
  onSelectSession,
  onSelectSlot
}: ScheduleGridProps) {
  const activeBlocks = period.timeBlocks.filter(b => b.active);
  const activeBlockIds = activeBlocks.map(b => b.id);
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));
  const sessions = selectedProposal ? selectedProposal.sessions : [];

  const sessionsByDay: Record<Weekday, PlacedSession[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  };

  for (const s of sessions) {
    if (sessionsByDay[s.day]) {
      sessionsByDay[s.day].push(s);
    }
  }

  return (
    <div className="panel grid-container" style={{ display: "flex", flexDirection: "row", overflowX: "auto", padding: "1rem" }}>
      {/* Row Headers */}
      <div style={{ width: "120px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header Spacer */}
        <div style={{
          height: "45px",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          fontWeight: 600,
          color: "var(--text-secondary)",
          fontSize: "0.875rem"
        }}>
          Hora
        </div>
        {activeBlocks.map(block => (
          <div key={block.id} style={{
            height: "90px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: "0.5rem"
          }}>
            <span className="time-label" style={{ fontWeight: 500 }}>{block.label}</span>
            <span className="time-range">{block.start} - {block.end}</span>
          </div>
        ))}
      </div>

      {/* Days Columns */}
      {WEEKDAYS.map(day => {
        const daySessions = sessionsByDay[day.key];
        const layoutSessions = computeDayLayout(daySessions, activeBlockIds, coursesMap);

        return (
          <div key={day.key} style={{
            flex: 1,
            minWidth: "200px",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid var(--border-color)",
            position: "relative",
            flexShrink: 0
          }}>
            {/* Day Header */}
            <div style={{
              height: "45px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              backgroundColor: "rgba(15, 23, 42, 0.4)"
            }}>
              {day.label}
            </div>

            {/* Background Grid Cells and Absolute overlay */}
            <div style={{ position: "relative", height: `${activeBlocks.length * 90}px` }}>
              {activeBlocks.map(block => {
                // Find if there is any session starting in this specific block
                const hasSessionStartingHere = daySessions.some(s => s.blockId === block.id);
                return (
                  <div
                    key={block.id}
                    onClick={() => {
                      if (!hasSessionStartingHere) {
                        onSelectSlot(day.key, block.id);
                      }
                    }}
                    style={{
                      height: "90px",
                      borderBottom: "1px solid var(--border-color)",
                      cursor: hasSessionStartingHere ? "default" : "pointer"
                    }}
                  />
                );
              })}

              {/* Placed Sessions Layer */}
              {layoutSessions.map(({ session, left, width, topIndex, heightBlocks }) => {
                const course = coursesMap.get(session.courseId);
                const isSelected = selectedSession?.requirementId === session.requirementId;
                const isLocked = session.state === "locked";

                const topPosition = topIndex * 90;
                const heightPosition = heightBlocks * 90;

                return (
                  <div
                    key={session.requirementId}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSession(session);
                    }}
                    className="session-card-wrapper"
                    style={{
                      position: "absolute",
                      top: `${topPosition}px`,
                      height: `${heightPosition}px`,
                      left: `${left}%`,
                      width: `${width}%`,
                      padding: "4px",
                      zIndex: isSelected ? 10 : 5,
                      boxSizing: "border-box"
                    }}
                  >
                    <div
                      className={`session-card ${isLocked ? "state-locked" : ""} ${isSelected ? "selected" : ""}`}
                      style={{
                        height: "100%",
                        borderWidth: isSelected ? "2px" : "1px",
                        boxShadow: isSelected ? "var(--shadow-glow)" : "none",
                        overflow: "hidden"
                      }}
                    >
                      <div className="session-title" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {course?.name || session.courseId}
                      </div>
                      <div className="session-teachers" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                        {session.teacherIds.map(tId => {
                          const t = period.teachers.find(teacher => teacher.id === tId);
                          return t ? t.name : tId;
                        }).join(", ")}
                      </div>
                      <div className="session-status" style={{ alignSelf: "flex-end", marginTop: "auto", fontSize: "0.65rem" }}>
                        {isLocked ? "🔒 Bloqueado" : "⚡ Propuesta"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
