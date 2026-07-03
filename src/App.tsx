import React, { useState } from "react";
import { createDefaultPeriod } from "./domain/seeds";
import { generateScheduleProposals } from "./domain/scheduler";
import { serializePeriod, parsePeriodJson } from "./domain/storage";
import { buildExcelTemplate, parseExcelTemplate } from "./domain/excel";
import { Period, ScheduleProposal, PlacedSession, Weekday } from "./domain/types";
import ScheduleGrid from "./components/ScheduleGrid";
import SidePanel from "./components/SidePanel";
import DataTables from "./components/DataTables";
import ProposalPanel from "./components/ProposalPanel";
import { Download, Upload, Calendar } from "lucide-react";
import "./styles.css";

export default function App() {
  const [period, setPeriod] = useState<Period>(() => createDefaultPeriod("Periodo 2026-2"));
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<ScheduleProposal | null>(null);
  
  // Selection state
  const [selectedSession, setSelectedSession] = useState<PlacedSession | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: Weekday; blockId: string } | null>(null);

  // JSON backup actions
  const handleExportJson = () => {
    try {
      const dataStr = serializePeriod(period);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `${period.id}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("Error al exportar periodo: " + (err as Error).message);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
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
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Excel actions
  const handleExportExcel = () => {
    try {
      const buffer = buildExcelTemplate(period);
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseExcelTemplate(buffer);
        // Retain original name/ID if wanted, or use imported name
        setPeriod({
          ...parsed,
          name: `Importado de Excel (${period.name})`,
          id: period.id
        });
        setProposals([]);
        setSelectedProposal(null);
        setSelectedSession(null);
        setSelectedSlot(null);
        alert("Plantilla Excel importada correctamente.");
      } catch (err) {
        alert("Error al importar plantilla Excel: " + (err as Error).message);
      }
    };
    fileReader.readAsArrayBuffer(files[0]);
  };

  // Scheduler action
  const handleGenerate = () => {
    const results = generateScheduleProposals(period, 5);
    setProposals(results);
    setSelectedProposal(results[0] || null);
    setSelectedSession(null);
    setSelectedSlot(null);
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
    
    // Clear selection if the selected entity was deleted or modified
    if (selectedSession) {
      const course = updatedPeriod.courses.find(c => c.id === selectedSession.courseId);
      if (!course || !course.active) {
        handleClearSelection();
      }
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          <Calendar size={24} style={{ color: "var(--accent-color)" }} />
          Planificador de Cursos
        </h1>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input
            type="text"
            className="form-control"
            style={{ width: "200px", fontWeight: 600 }}
            value={period.name}
            onChange={(e) => setPeriod({ ...period, name: e.target.value })}
            placeholder="Nombre del periodo"
          />

          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
              <Download size={14} /> Exportar JSON
            </button>
            <label className="btn btn-secondary btn-sm" style={{ margin: 0, cursor: "pointer" }}>
              <Upload size={14} /> Importar JSON
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: "none" }} />
            </label>
            <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>
              <Download size={14} /> Exportar Excel
            </button>
            <label className="btn btn-secondary btn-sm" style={{ margin: 0, cursor: "pointer" }}>
              <Upload size={14} /> Importar Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
            </label>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="left-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", fontWeight: 600 }}>
              Semana Tipo: {period.name}
            </h2>
            <button className="btn btn-primary" onClick={handleGenerate}>
              Generar propuesta
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
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <h3 style={{ fontFamily: "var(--font-title)" }}>Instrucciones rápidas</h3>
              <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>Registra tus <strong>Profesores</strong> y <strong>Cursos</strong> en la pestaña correspondiente de la tabla.</li>
                <li>Agrega <strong>Restricciones</strong> para evitar cruces entre cursos específicos.</li>
                <li>Registra <strong>Preferencias</strong> para priorizar mañana/tarde o días de profesores.</li>
                <li>Presiona <strong>Generar propuesta</strong> para calcular el mejor horario.</li>
                <li>Haz clic en una sesión del horario para <strong>bloquearla (🔒)</strong>; no cambiará en próximas generaciones.</li>
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
