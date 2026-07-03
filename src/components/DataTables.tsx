import { useState } from "react";
import { Period, Teacher, Course, TimeBlock, CourseConflictRule, Preference, PreferenceScope, PreferenceKind } from "../domain/types";

interface DataTablesProps {
  period: Period;
  onChangePeriod: (period: Period) => void;
}

type TabType = "teachers" | "courses" | "blocks" | "rules" | "preferences";

export default function DataTables({ period, onChangePeriod }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("teachers");

  // Form states
  const [teacherName, setTeacherName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseTeachers, setCourseTeachers] = useState<string[]>([]);
  const [courseSessions, setCourseSessions] = useState(1);
  const [courseBlocks, setCourseBlocks] = useState(1);

  const [blockLabel, setBlockLabel] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");

  const [ruleCourseA, setRuleCourseA] = useState("");
  const [ruleCourseB, setRuleCourseB] = useState("");
  const [ruleReason, setRuleReason] = useState("");

  const [prefScope, setPrefScope] = useState<PreferenceScope>("period");
  const [prefTarget, setPrefTarget] = useState("");
  const [prefKind, setPrefKind] = useState<PreferenceKind>("preferMorning");
  const [prefValue, setPrefValue] = useState("");
  const [prefWeight, setPrefWeight] = useState(1);

  // Helper to update parts of the period
  const updatePeriod = (updates: Partial<Period>) => {
    onChangePeriod({
      ...period,
      ...updates
    });
  };

  // Add/Delete Teachers
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;
    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      name: teacherName.trim(),
      active: true
    };
    updatePeriod({ teachers: [...period.teachers, newTeacher] });
    setTeacherName("");
  };

  const handleDeleteTeacher = (id: string) => {
    updatePeriod({
      teachers: period.teachers.filter(t => t.id !== id),
      // Clean course assignments
      courses: period.courses.map(c => ({
        ...c,
        teacherIds: c.teacherIds.filter(tId => tId !== id)
      }))
    });
  };

  const toggleTeacherActive = (id: string) => {
    updatePeriod({
      teachers: period.teachers.map(t => t.id === id ? { ...t, active: !t.active } : t)
    });
  };

  // Add/Delete Courses
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    const newCourse: Course = {
      id: `c-${Date.now()}`,
      name: courseName.trim(),
      teacherIds: courseTeachers,
      weeklySessions: courseSessions,
      blocksPerSession: courseBlocks,
      active: true
    };
    updatePeriod({ courses: [...period.courses, newCourse] });
    setCourseName("");
    setCourseTeachers([]);
    setCourseSessions(1);
    setCourseBlocks(1);
  };

  const handleDeleteCourse = (id: string) => {
    updatePeriod({
      courses: period.courses.filter(c => c.id !== id),
      // Clean conflict rules and requirements
      conflictRules: period.conflictRules.filter(r => r.courseAId !== id && r.courseBId !== id),
      requirements: period.requirements.filter(req => req.courseId !== id)
    });
  };

  const toggleCourseActive = (id: string) => {
    updatePeriod({
      courses: period.courses.map(c => c.id === id ? { ...c, active: !c.active } : c)
    });
  };

  // Add/Delete Time Blocks
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockLabel.trim() || !blockStart || !blockEnd) return;
    const newBlock: TimeBlock = {
      id: `b-${blockLabel.toLowerCase().replace(/\s+/g, "-")}`,
      label: blockLabel.trim(),
      start: blockStart,
      end: blockEnd,
      active: true
    };
    updatePeriod({ timeBlocks: [...period.timeBlocks, newBlock] });
    setBlockLabel("");
    setBlockStart("");
    setBlockEnd("");
  };

  const handleDeleteBlock = (id: string) => {
    updatePeriod({
      timeBlocks: period.timeBlocks.filter(b => b.id !== id),
      // Clean locks in requirements
      requirements: period.requirements.map(req =>
        req.lockedBlockId === id ? { ...req, lockedBlockId: undefined } : req
      )
    });
  };

  const toggleBlockActive = (id: string) => {
    updatePeriod({
      timeBlocks: period.timeBlocks.map(b => b.id === id ? { ...b, active: !b.active } : b)
    });
  };

  // Add/Delete Conflict Rules
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCourseA || !ruleCourseB || ruleCourseA === ruleCourseB) return;
    const newRule: CourseConflictRule = {
      id: `cr-${Date.now()}`,
      courseAId: ruleCourseA,
      courseBId: ruleCourseB,
      reason: ruleReason.trim() || "Cruce no permitido",
      active: true
    };
    updatePeriod({ conflictRules: [...period.conflictRules, newRule] });
    setRuleCourseA("");
    setRuleCourseB("");
    setRuleReason("");
  };

  const handleDeleteRule = (id: string) => {
    updatePeriod({ conflictRules: period.conflictRules.filter(r => r.id !== id) });
  };

  const toggleRuleActive = (id: string) => {
    updatePeriod({
      conflictRules: period.conflictRules.map(r => r.id === id ? { ...r, active: !r.active } : r)
    });
  };

  // Add/Delete Preferences
  const handleAddPref = (e: React.FormEvent) => {
    e.preventDefault();
    const newPref: Preference = {
      id: `pref-${Date.now()}`,
      scope: prefScope,
      targetId: prefScope === "period" ? "" : prefTarget,
      kind: prefKind,
      value: prefValue,
      weight: prefWeight,
      active: true
    };
    updatePeriod({ preferences: [...period.preferences, newPref] });
    setPrefTarget("");
    setPrefValue("");
    setPrefWeight(1);
  };

  const handleDeletePref = (id: string) => {
    updatePeriod({ preferences: period.preferences.filter(p => p.id !== id) });
  };

  const togglePrefActive = (id: string) => {
    updatePeriod({
      preferences: period.preferences.map(p => p.id === id ? { ...p, active: !p.active } : p)
    });
  };

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === "teachers" ? "active" : ""}`} onClick={() => setActiveTab("teachers")}>
          Profesores ({period.teachers.length})
        </button>
        <button className={`tab-btn ${activeTab === "courses" ? "active" : ""}`} onClick={() => setActiveTab("courses")}>
          Cursos ({period.courses.length})
        </button>
        <button className={`tab-btn ${activeTab === "blocks" ? "active" : ""}`} onClick={() => setActiveTab("blocks")}>
          Claves Horarias ({period.timeBlocks.length})
        </button>
        <button className={`tab-btn ${activeTab === "rules" ? "active" : ""}`} onClick={() => setActiveTab("rules")}>
          Restricciones ({period.conflictRules.length})
        </button>
        <button className={`tab-btn ${activeTab === "preferences" ? "active" : ""}`} onClick={() => setActiveTab("preferences")}>
          Preferencias ({period.preferences.length})
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: "300px" }}>
        {activeTab === "teachers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <form onSubmit={handleAddTeacher} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Nombre del Profesor</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Andrés Sepúlveda"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Nombre</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {period.teachers.map(t => (
                    <tr key={t.id}>
                      <td>
                        <label className="checkbox-container">
                          <input type="checkbox" checked={t.active} onChange={() => toggleTeacherActive(t.id)} />
                          <div className="checkbox-box"></div>
                          <span>{t.active ? "Activo" : "Inactivo"}</span>
                        </label>
                      </td>
                      <td>{t.name}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTeacher(t.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {period.teachers.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay profesores registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <form onSubmit={handleAddCourse} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 100px auto", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nombre del Curso</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Español 1"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Profesores</label>
                <select
                  multiple
                  className="form-control"
                  style={{ height: "38px", padding: "4px" }}
                  value={courseTeachers}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions).map(o => o.value);
                    setCourseTeachers(options);
                  }}
                >
                  {period.teachers.filter(t => t.active).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Sesiones/Sem.</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={courseSessions}
                  onChange={e => setCourseSessions(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Claves/Sesión</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={courseBlocks}
                  onChange={e => setCourseBlocks(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Curso</th>
                    <th>Profesores asignados</th>
                    <th>Sesiones/Sem.</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {period.courses.map(c => (
                    <tr key={c.id}>
                      <td>
                        <label className="checkbox-container">
                          <input type="checkbox" checked={c.active} onChange={() => toggleCourseActive(c.id)} />
                          <div className="checkbox-box"></div>
                          <span>{c.active ? "Activo" : "Inactivo"}</span>
                        </label>
                      </td>
                      <td>{c.name}</td>
                      <td>
                        {c.teacherIds.map(tId => {
                          const t = period.teachers.find(teacher => teacher.id === tId);
                          return t ? t.name : tId;
                        }).join(", ")}
                      </td>
                      <td>{c.weeklySessions} sesiones ({c.blocksPerSession} clave(s) c/u)</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(c.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {period.courses.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay cursos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "blocks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <form onSubmit={handleAddBlock} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Identificador/Etiqueta</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 1-2"
                  value={blockLabel}
                  onChange={e => setBlockLabel(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width: "150px", marginBottom: 0 }}>
                <label>Hora de Inicio</label>
                <input
                  type="time"
                  className="form-control"
                  value={blockStart}
                  onChange={e => setBlockStart(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width: "150px", marginBottom: 0 }}>
                <label>Hora de Término</label>
                <input
                  type="time"
                  className="form-control"
                  value={blockEnd}
                  onChange={e => setBlockEnd(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Identificador</th>
                    <th>Hora</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {period.timeBlocks.map(b => (
                    <tr key={b.id}>
                      <td>
                        <label className="checkbox-container">
                          <input type="checkbox" checked={b.active} onChange={() => toggleBlockActive(b.id)} />
                          <div className="checkbox-box"></div>
                          <span>{b.active ? "Activa" : "Inactiva"}</span>
                        </label>
                      </td>
                      <td>{b.label}</td>
                      <td>{b.start} - {b.end}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBlock(b.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <form onSubmit={handleAddRule} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Curso A</label>
                <select className="form-control" value={ruleCourseA} onChange={e => setRuleCourseA(e.target.value)}>
                  <option value="">Selecciona Curso A...</option>
                  {period.courses.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Curso B</label>
                <select className="form-control" value={ruleCourseB} onChange={e => setRuleCourseB(e.target.value)}>
                  <option value="">Selecciona Curso B...</option>
                  {period.courses.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Motivo del Conflicto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Cursos del mismo nivel o mención"
                  value={ruleReason}
                  onChange={e => setRuleReason(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Curso A</th>
                    <th>Curso B</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {period.conflictRules.map(r => {
                    const cA = period.courses.find(course => course.id === r.courseAId);
                    const cB = period.courses.find(course => course.id === r.courseBId);
                    return (
                      <tr key={r.id}>
                        <td>
                          <label className="checkbox-container">
                            <input type="checkbox" checked={r.active} onChange={() => toggleRuleActive(r.id)} />
                            <div className="checkbox-box"></div>
                            <span>{r.active ? "Activa" : "Inactiva"}</span>
                          </label>
                        </td>
                        <td>{cA ? cA.name : r.courseAId}</td>
                        <td>{cB ? cB.name : r.courseBId}</td>
                        <td>{r.reason}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRule(r.id)}>Eliminar</button>
                        </td>
                      </tr>
                    );
                  })}
                  {period.conflictRules.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay restricciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <form onSubmit={handleAddPref} style={{ display: "grid", gridTemplateColumns: "120px 150px 180px 150px 80px auto", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Alcance</label>
                <select className="form-control" value={prefScope} onChange={e => {
                  setPrefScope(e.target.value as PreferenceScope);
                  setPrefTarget("");
                }}>
                  <option value="period">Periodo</option>
                  <option value="course">Curso</option>
                  <option value="teacher">Profesor</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Objetivo</label>
                <select
                  className="form-control"
                  disabled={prefScope === "period"}
                  value={prefTarget}
                  onChange={e => setPrefTarget(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {prefScope === "course" && period.courses.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {prefScope === "teacher" && period.teachers.filter(t => t.active).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tipo de Preferencia</label>
                <select className="form-control" value={prefKind} onChange={e => setPrefKind(e.target.value as PreferenceKind)}>
                  <option value="preferMorning">Preferir Mañana (antes 12:00)</option>
                  <option value="preferDay">Preferir Día Específico</option>
                  <option value="avoidDay">Evitar Día Específico</option>
                  <option value="spreadSessions">Distribuir Sesiones (spread)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Valor (Ej. Día)</label>
                <select
                  className="form-control"
                  disabled={prefKind !== "preferDay" && prefKind !== "avoidDay"}
                  value={prefValue}
                  onChange={e => setPrefValue(e.target.value)}
                >
                  <option value="">Selecciona Día...</option>
                  <option value="monday">Lunes</option>
                  <option value="tuesday">Martes</option>
                  <option value="wednesday">Miércoles</option>
                  <option value="thursday">Jueves</option>
                  <option value="friday">Viernes</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Peso</label>
                <input
                  type="number"
                  min={1}
                  className="form-control"
                  value={prefWeight}
                  onChange={e => setPrefWeight(parseFloat(e.target.value) || 1)}
                />
              </div>

              <button type="submit" className="btn btn-primary">Agregar</button>
            </form>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Alcance</th>
                    <th>Objetivo</th>
                    <th>Preferencia</th>
                    <th>Valor</th>
                    <th>Peso</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {period.preferences.map(p => {
                    let targetName = "Todo el periodo";
                    if (p.scope === "course") {
                      targetName = period.courses.find(c => c.id === p.targetId)?.name || p.targetId;
                    } else if (p.scope === "teacher") {
                      targetName = period.teachers.find(t => t.id === p.targetId)?.name || p.targetId;
                    }

                    const kindLabel = {
                      preferMorning: "Preferir Mañana",
                      preferDay: "Preferir Día",
                      avoidDay: "Evitar Día",
                      spreadSessions: "Distribuir Sesiones"
                    }[p.kind];

                    const dayTranslations: Record<string, string> = {
                      monday: "Lunes",
                      tuesday: "Martes",
                      wednesday: "Miércoles",
                      thursday: "Jueves",
                      friday: "Viernes"
                    };
                    const valueLabel = dayTranslations[p.value] || p.value || "-";

                    return (
                      <tr key={p.id}>
                        <td>
                          <label className="checkbox-container">
                            <input type="checkbox" checked={p.active} onChange={() => togglePrefActive(p.id)} />
                            <div className="checkbox-box"></div>
                            <span>{p.active ? "Activa" : "Inactiva"}</span>
                          </label>
                        </td>
                        <td>{p.scope === "period" ? "Periodo" : p.scope === "course" ? "Curso" : "Profesor"}</td>
                        <td>{targetName}</td>
                        <td>{kindLabel}</td>
                        <td>{valueLabel}</td>
                        <td>{p.weight}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeletePref(p.id)}>Eliminar</button>
                        </td>
                      </tr>
                    );
                  })}
                  {period.preferences.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No hay preferencias registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
