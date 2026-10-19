import React, { useState, useEffect, useRef } from "react";
import { createDefaultPeriod, createDemoPeriod } from "./domain/seeds";
import { generateScheduleProposals } from "./domain/scheduler";
import {
  serializePeriod,
  parsePeriodJson,
  savePeriodToStorage,
  loadPeriodFromStorage,
} from "./domain/storage";
import { buildExcelTemplate, parseExcelTemplate } from "./domain/excel";
import { validatePeriod } from "./domain/validation";
import { Period, ScheduleProposal, PlacedSession, Weekday } from "./domain/types";
import ScheduleGrid from "./components/ScheduleGrid";
import SidePanel from "./components/SidePanel";
import DataTables from "./components/DataTables";
import ProposalPanel from "./components/ProposalPanel";
import { Download, Upload, Calendar } from "lucide-react";
import "./styles.css";

export default function App() {
  const [period, setPeriod] = useState<Period>(
    () => loadPeriodFromStorage() ?? createDefaultPeriod("Periodo 2026-2")
  );
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ScheduleProposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Selection state
  const [selectedSession, setSelectedSession] = useState<PlacedSession | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: Weekday; blockId: string } | null>(null);

  // Refs for file inputs so we can reset value after import (fix #3)
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage whenever period changes (fix #1)
  useEffect(() => {
    savePeriodToStorage(period);
  }, [period]);

  // JSON backup actions
  const handleExportJson = () => {
    try {
      const dataStr = serializePeriod(period);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${period.id}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("Error al exportar periodo: " + (err as Error).message);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    // Capture input ref before async so we can reset value (fix #3)
    const inputEl = jsonInputRef.current;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = parsePeriodJson(result);
        setPeriod(parsed);
        setProposals([]);
        setSelectedProposal(null);
        setSelectedSession(null);
        setSelectedSlot(null);
        alert(`Periodo '${parsed.name}' cargado exitosamente.`);
      } catch (err) {
        alert("Error al cargar archivo JSON: " + (err as Error).message);
      } finally {
        if (inputEl) inputEl.value = ""; // reset so same file can be re-imported (fix #3)
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Excel actions
  const handleExportExcel = () => {
    try {
      const buffer = buildExcelTemplate(period);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `plantilla_${period.id}.xlsx`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al exportar plantilla Excel: " + (err as Error).message);
    }
  };

  const handleDownloadDemoExcel = () => {
    try {
      const demoPeriod = createDemoPeriod();
      const buffer = buildExcelTemplate(demoPeriod);
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `plantilla_ejemplo.xlsx`;
      link.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error al descargar plantilla de ejemplo: " + (err as Error).message);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    // Capture input ref before async so we can reset value (fix #3)
    const inputEl = excelInputRef.current;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseExcelTemplate(buffer);

        // Validate imported period before applying
        const issues = validatePeriod(parsed);
        const errors = issues.filter((issue) => issue.severity === "error");

        if (errors.length > 0) {
          const errorMsg = errors
            .map((e, idx) => `${idx + 1}. [Código: ${e.code}] ${e.message}`)
            .join("\n");
          alert(
            `No se pudo cargar la plantilla Excel debido a errores críticos de validación:\n\n${errorMsg}`
          );
          return;
        }

        const warnings = issues.filter(
          (issue) => issue.severity === "warning" || issue.severity === "conflict"
        );

        setPeriod({
          ...parsed,
          name: `Importado de Excel (${period.name})`,
          id: period.id,
        });
        setProposals([]);
        setSelectedProposal(null);
        setSelectedSession(null);
        setSelectedSlot(null);

        if (warnings.length > 0) {
          const warningMsg = warnings.map((w, idx) => `${idx + 1}. ${w.message}`).join("\n");
          alert(`Plantilla Excel importada con advertencias:\n\n${warningMsg}`);
        } else {
          alert("Plantilla Excel importada correctamente sin errores.");
        }
      } catch (err) {
        alert("Error al importar plantilla Excel: " + (err as Error).message);
      } finally {
        if (inputEl) inputEl.value = ""; // reset so same file can be re-imported (fix #3)
      }
    };
    fileReader.readAsArrayBuffer(files[0]);
  };

  // Scheduler action — wrapped in try/catch for stack overflows (fix #4)
  const handleGenerate = () => {
    setIsGenerating(true);
    // Defer to next tick so the spinner renders before synchronous work starts
    setTimeout(() => {
      try {
        const results = generateScheduleProposals(period, 5);
        setProposals(results);
        setSelectedProposal(results[0] || null);
        setSelectedSession(null);
        setSelectedSlot(null);
      } catch (err) {
        if (err instanceof RangeError) {
          alert(
            "Error: la búsqueda agotó el stack (demasiadas restricciones). Reduce el número de cursos o bloques e intenta de nuevo."
          );
        } else {
          alert("Error al generar propuesta: " + (err as Error).message);
        }
      } finally {
        setIsGenerating(false);
      }
    }, 0);
  };

  const handleSelectSession = (session: PlacedSession | null) => {
    setSelectedSession(session);
    setSelectedSlot(null);
  };

  const handleSelectSlot = (day: Weekday, blockId: string) => {
    setSelectedSlot({ day, blockId });
    setSelectedSession(null);
  };

  const handleClearSelection = () => {
    setSelectedSession(null);
    setSelectedSlot(null);
  };

  const handleChangePeriod = (updatedPeriod: Period) => {
    setPeriod(updatedPeriod);

    // Clear stale proposals whenever the period changes (fix #2)
    setProposals([]);
    setSelectedProposal(null);

    // Clear selection if the selected entity was deleted or modified
    if (selectedSession) {
      const course = updatedPeriod.courses.find((c) => c.id === selectedSession.courseId);
      if (!course || !course.active) {
        handleClearSelection();
      }
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <Calendar size={18} className="header-logo-icon" />
          Planificador de Cursos
        </h1>

        <div className="header-center">
          <input
            type="text"
            className="period-name-input"
            value={period.name}
            onChange={(e) => setPeriod({ ...period, name: e.target.value })}
            placeholder="Nombre del periodo"
            aria-label="Nombre del periodo"
          />
        </div>

        <div className="header-actions">
          <div className="action-group">
            <button className="btn btn-ghost btn-sm" onClick={handleExportJson} title="Exportar JSON">
              <Download size={13} /> JSON
            </button>
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }} title="Importar JSON">
              <Upload size={13} /> JSON
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div className="action-divider" role="separator" />

          <div className="action-group">
            <button className="btn btn-ghost btn-sm" onClick={handleDownloadDemoExcel} title="Descargar plantilla Excel de ejemplo">
              <Download size={13} /> Plantilla
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleExportExcel} title="Exportar Excel">
              <Download size={13} /> Excel
            </button>
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }} title="Importar Excel">
              <Upload size={13} /> Excel
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="left-section">
          <div className="section-header">
            <h2 className="section-title">Semana Tipo: {period.name}</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Generando…" : "Generar propuesta"}
            </button>
          </div>

          <ScheduleGrid
            period={period}
            selectedProposal={selectedProposal}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
            onSelectSlot={handleSelectSlot}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <ProposalPanel
              proposals={proposals}
              selectedProposal={selectedProposal}
              onSelectProposal={(p) => {
                setSelectedProposal(p);
                handleClearSelection();
              }}
            />
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontFamily: "var(--font-title)", fontSize: "0.9375rem", fontWeight: 600 }}>Instrucciones rápidas</h3>
              <ul
                style={{
                  paddingLeft: "1.1rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  lineHeight: 1.5,
                }}
              >
                <li>
                  Registra tus <strong>Profesores</strong> y <strong>Cursos</strong> en la pestaña
                  correspondiente de la tabla.
                </li>
                <li>
                  Agrega <strong>Restricciones</strong> para evitar cruces entre cursos específicos.
                </li>
                <li>
                  Registra <strong>Preferencias</strong> para priorizar mañana/tarde o días de
                  profesores.
                </li>
                <li>
                  Presiona <strong>Generar propuesta</strong> para calcular el mejor horario.
                </li>
                <li>
                  Haz clic en una sesión del horario para <strong>bloquearla (🔒)</strong>; no
                  cambiará en próximas generaciones.
                </li>
                <li>
                  Usa <strong>Exportar Excel</strong> para descargar una plantilla con el formato
                  correcto, edítala (puedes definir disponibilidades en la hoja{" "}
                  <em>Disponibilidad</em>) e impórtala de vuelta con{" "}
                  <strong>Importar Excel</strong>.
                </li>
              </ul>
            </div>
          </div>

          <DataTables period={period} onChangePeriod={handleChangePeriod} />
        </div>

        <SidePanel
          period={period}
          selectedSession={selectedSession}
          selectedSlot={selectedSlot}
          onChangePeriod={handleChangePeriod}
          onClearSelection={handleClearSelection}
        />
      </main>
    </div>
  );
}
