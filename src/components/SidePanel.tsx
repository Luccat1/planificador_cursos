import React, { useState } from "react";
import { Period, PlacedSession, Weekday, SessionRequirement } from "../domain/types";

interface SidePanelProps {
  period: Period;
  selectedSession: PlacedSession | null;
  selectedSlot: { day: Weekday; blockId: string } | null;
  onChangePeriod: (period: Period) => void;
  onClearSelection: () => void;
}

const DAY_LABELS: Record<Weekday, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes"
};

export default function SidePanel({
  period,
  selectedSession,
  selectedSlot,
  onChangePeriod,
  onClearSelection
}: SidePanelProps) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const coursesMap = new Map(period.courses.map(c => [c.id, c]));

  // Check if current selected session is locked in requirements
  const isCurrentlyLocked = selectedSession
    ? period.requirements.some(
        r => r.id === selectedSession.requirementId && r.lockedDay && r.lockedBlockId
      )
    : false;

  const handleLockSession = () => {
    if (!selectedSession) return;
    const updatedReqs = [...period.requirements];
    const reqIdx = updatedReqs.findIndex(r => r.id === selectedSession.requirementId);

    if (reqIdx >= 0) {
      updatedReqs[reqIdx] = {
        ...updatedReqs[reqIdx],
        lockedDay: selectedSession.day,
        lockedBlockId: selectedSession.blockId
      };
    } else {
      updatedReqs.push({
        id: selectedSession.requirementId,
        courseId: selectedSession.courseId,
        lockedDay: selectedSession.day,
        lockedBlockId: selectedSession.blockId
      });
    }

    onChangePeriod({ ...period, requirements: updatedReqs });
  };

  const handleUnlockSession = () => {
    if (!selectedSession) return;
    const updatedReqs = period.requirements.map(r => {
      if (r.id === selectedSession.requirementId) {
        return {
          ...r,
          lockedDay: undefined,
          lockedBlockId: undefined
        };
      }
      return r;
    });

    onChangePeriod({ ...period, requirements: updatedReqs });
  };

  // Place a course manually in an empty slot
  const handlePlaceCourseManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedCourseId) return;

    // Create a new requirement locked to this day and block
    const newReq: SessionRequirement = {
      id: `req-${selectedCourseId}-${Date.now()}`,
      courseId: selectedCourseId,
      lockedDay: selectedSlot.day,
      lockedBlockId: selectedSlot.blockId
    };

    onChangePeriod({
      ...period,
      requirements: [...period.requirements, newReq]
    });
    setSelectedCourseId("");
    onClearSelection();
  };

  return (
    <div className="right-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontFamily: "var(--font-title)" }}>Panel de Edición</h3>
        {(selectedSession || selectedSlot) && (
          <button className="btn btn-outline btn-sm" onClick={onClearSelection}>Desseleccionar</button>
        )}
      </div>

      {selectedSession ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="panel">
          <div>
            <h4 style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {coursesMap.get(selectedSession.courseId)?.name || selectedSession.courseId}
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              ID Sesión: {selectedSession.requirementId}
            </p>
          </div>

          <div style={{ fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div>
              <strong style={{ color: "var(--text-muted)" }}>Profesores:</strong>{" "}
              {selectedSession.teacherIds.map(tId => period.teachers.find(t => t.id === tId)?.name || tId).join(", ")}
            </div>
            <div>
              <strong style={{ color: "var(--text-muted)" }}>Día:</strong> {DAY_LABELS[selectedSession.day]}
            </div>
            <div>
              <strong style={{ color: "var(--text-muted)" }}>Bloque:</strong> {selectedSession.blockId}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", display: "flex", gap: "0.5rem" }}>
            {isCurrentlyLocked ? (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleUnlockSession}>
                🔓 Desbloquear Sesión
              </button>
            ) : (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleLockSession}>
                🔒 Bloquear Sesión
              </button>
            )}
          </div>
        </div>
      ) : selectedSlot ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="panel">
          <div>
            <h4 style={{ fontWeight: 600 }}>Celda Seleccionada</h4>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              {DAY_LABELS[selectedSlot.day]} - Bloque {selectedSlot.blockId}
            </p>
          </div>

          <form onSubmit={handlePlaceCourseManually} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>Ubicar Curso en esta Celda</label>
              <select
                className="form-control"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                <option value="">Selecciona un curso...</option>
                {period.courses.filter(c => c.active).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!selectedCourseId}>
              Confirmar Ubicación 🔒
            </button>
          </form>
        </div>
      ) : (
        <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
          Selecciona una sesión en la grilla para bloquear su posición, o haz clic en una celda vacía para ubicar un curso manualmente.
        </div>
      )}
    </div>
  );
}
