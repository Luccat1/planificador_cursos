import { Period, PlacedSession, Weekday, ScheduleProposal } from "../domain/types";

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

export default function ScheduleGrid({
  period,
  selectedProposal,
  selectedSession,
  onSelectSession,
  onSelectSlot
}: ScheduleGridProps) {
  const activeBlocks = period.timeBlocks.filter(b => b.active);
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));
  const sessions = selectedProposal ? selectedProposal.sessions : [];

  return (
    <div className="panel grid-container">
      <table className="grid-table">
        <thead>
          <tr>
            <th className="time-col">Hora</th>
            {WEEKDAYS.map(d => (
              <th key={d.key}>{d.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeBlocks.map(block => (
            <tr key={block.id}>
              <td className="time-col">
                <span className="time-label">{block.label}</span>
                <span className="time-range">{block.start} - {block.end}</span>
              </td>
              {WEEKDAYS.map(day => {
                const slotSessions = sessions.filter(
                  s => s.day === day.key && s.blockId === block.id
                );

                return (
                  <td
                    key={day.key}
                    onClick={() => {
                      if (slotSessions.length === 0) {
                        onSelectSlot(day.key, block.id);
                      }
                    }}
                    style={{ cursor: slotSessions.length === 0 ? "pointer" : "default" }}
                  >
                    {slotSessions.map(session => {
                      const course = coursesMap.get(session.courseId);
                      const isSelected = selectedSession?.requirementId === session.requirementId;
                      const isLocked = session.state === "locked";

                      return (
                        <div
                          key={session.requirementId}
                          className={`session-card ${isLocked ? "state-locked" : ""} ${isSelected ? "selected" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSession(session);
                          }}
                          style={{
                            borderWidth: isSelected ? "2px" : "1px",
                            boxShadow: isSelected ? "var(--shadow-glow)" : "none"
                          }}
                        >
                          <div className="session-title">
                            {course?.name || session.courseId}
                          </div>
                          <div className="session-teachers">
                            {session.teacherIds.map(tId => {
                              const t = period.teachers.find(teacher => teacher.id === tId);
                              return t ? t.name : tId;
                            }).join(", ")}
                          </div>
                          <div className="session-status">
                            {isLocked ? "🔒 Bloqueado" : "⚡ Propuesta"}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
