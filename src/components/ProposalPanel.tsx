import { ScheduleProposal } from "../domain/types";

interface ProposalPanelProps {
  proposals: ScheduleProposal[];
  selectedProposal: ScheduleProposal | null;
  onSelectProposal: (proposal: ScheduleProposal) => void;
}

export default function ProposalPanel({
  proposals,
  selectedProposal,
  onSelectProposal
}: ProposalPanelProps) {
  if (proposals.length === 0) {
    return (
      <div className="panel">
        <h3 style={{ fontFamily: "var(--font-title)", marginBottom: "1rem" }}>Propuestas de Horario</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Presiona "Generar propuesta" para buscar horarios viables y optimizar según tus preferencias.
        </p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontFamily: "var(--font-title)" }}>Propuestas de Horario</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {proposals.map(proposal => {
          const isSelected = selectedProposal?.id === proposal.id;
          const errors = proposal.issues.filter(i => i.severity === "error" || i.severity === "conflict");
          const warnings = proposal.issues.filter(i => i.severity === "warning");
          const suggestions = proposal.issues.filter(i => i.severity === "suggestion");

          return (
            <div
              key={proposal.id}
              onClick={() => onSelectProposal(proposal)}
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                backgroundColor: isSelected ? "var(--bg-tertiary)" : "rgba(255, 255, 255, 0.02)",
                border: isSelected ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all var(--transition-fast)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{proposal.label}</span>
                <span style={{
                  fontSize: "0.75rem",
                  color: proposal.score === -Infinity ? "var(--error-color)" : "var(--success-color)",
                  fontWeight: "bold"
                }}>
                  Puntaje: {proposal.score === -Infinity ? "-Inf" : proposal.score}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                {errors.length > 0 && <span style={{ color: "#f87171" }}>❌ {errors.length} Conflictos</span>}
                {warnings.length > 0 && <span style={{ color: "#fcd34d" }}>⚠️ {warnings.length} Advertencias</span>}
                {suggestions.length > 0 && <span style={{ color: "#67e8f9" }}>💡 {suggestions.length} Sugerencias</span>}
                {errors.length === 0 && warnings.length === 0 && suggestions.length === 0 && (
                  <span style={{ color: "var(--success-color)" }}>✓ Horario Perfecto</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProposal && (
        <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Alertas de {selectedProposal.label}
          </h4>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {selectedProposal.issues.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>No hay alertas o sugerencias para esta propuesta.</p>
            ) : (
              selectedProposal.issues.map((issue, idx) => (
                <div key={idx} className={`issue-item issue-${issue.severity}`}>
                  <span>{issue.severity === "error" || issue.severity === "conflict" ? "❌" : issue.severity === "warning" ? "⚠️" : "💡"}</span>
                  <div>{issue.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
