import { useState } from "react";
import { Period, Teacher, Course, TimeBlock, CourseConflictRule, Preference, PreferenceScope, PreferenceKind, Weekday } from "../domain/types";

interface DataTablesProps {
  period: Period;
  onChangePeriod: (period: Period) => void;
}

type TabType = "teachers" | "courses" | "blocks" | "rules" | "preferences";

export default function DataTables({ period, onChangePeriod }: DataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("teachers");
  const [editingAvailabilityTeacherId, setEditingAvailabilityTeacherId] = useState<string | null>(null);

  const getAvailabilitySummary = (t: Teacher) => {
    if (!t.availability) return "Completa";
    let count = 0;
    for (const day of Object.keys(t.availability)) {
      count += t.availability[day as Weekday]?.length || 0;
    }
    if (count === 0) return "Ninguna";
    return `Restringida (${count} bloque(s))`;
  };

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

  // Inline edit states
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  // Natural language preference input
  const [nlPrefText, setNlPrefText] = useState("");

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
      id: `t-${crypto.randomUUID()}`,
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
      id: `c-${crypto.randomUUID()}`,
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
      id: `b-${crypto.randomUUID()}`,
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
      // Clear BOTH lock fields together so no phantom lockedDay remains (fix #7)
      requirements: period.requirements.map(req =>
        req.lockedBlockId === id
          ? { ...req, lockedDay: undefined, lockedBlockId: undefined }
          : req
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
      id: `cr-${crypto.randomUUID()}`,
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
      id: `pref-${crypto.randomUUID()}`,
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

  const handleSaveTeacher = () => {
    if (!editingTeacher?.name.trim()) return;
    updatePeriod({ teachers: period.teachers.map(t => t.id === editingTeacher.id ? { ...editingTeacher, name: editingTeacher.name.trim() } : t) });
    setEditingTeacher(null);
  };

  const handleSaveCourse = () => {
    if (!editingCourse?.name.trim()) return;
    updatePeriod({ courses: period.courses.map(c => c.id === editingCourse.id ? { ...editingCourse, name: editingCourse.name.trim() } : c) });
    setEditingCourse(null);
  };

  const handleSaveBlock = () => {
    if (!editingBlock?.label.trim() || !editingBlock.start || !editingBlock.end) return;
    updatePeriod({ timeBlocks: period.timeBlocks.map(b => b.id === editingBlock.id ? { ...editingBlock, label: editingBlock.label.trim() } : b) });
    setEditingBlock(null);
  };

  const parseNaturalPreferences = (text: string): Preference[] => {
    const DAYS_ES: Record<string, Weekday> = {
      lunes: "monday", martes: "tuesday", "miércoles": "wednesday",
      miercoles: "wednesday", jueves: "thursday", viernes: "friday"
    };
    const parts = text.split(/[,;]|\sy\s|\so\s/i).map(s => s.trim()).filter(Boolean);
    return parts.flatMap(part => {
      const lower = part.toLowerCase();
      let scope: PreferenceScope = "period";
      let targetId = "";
      const paraMatch = lower.match(/\bpara\s+(?:el\s+(?:curso|profesor)\s+)?(.+)/);
      if (paraMatch) {
        const targetName = paraMatch[1].trim();
        const course = period.courses.find(c => c.name.toLowerCase().includes(targetName));
        const teacher = period.teachers.find(t => t.name.toLowerCase().includes(targetName));
        if (course) { scope = "course"; targetId = course.id; }
        else if (teacher) { scope = "teacher"; targetId = teacher.id; }
      }
      let detectedDay = "";
      for (const [es, en] of Object.entries(DAYS_ES)) {
        if (lower.includes(es)) { detectedDay = en; break; }
      }
      let kind: PreferenceKind | null = null;
      let value = "";
      if (/\bmañana\b|\bam\b|\bmatutino\b/.test(lower)) { kind = "preferMorning"; }
      else if (/\bevitar?\b|\bno\b|\bsin\b/.test(lower) && detectedDay) { kind = "avoidDay"; value = detectedDay; }
      else if (/\bpreferir?\b|\bprefiere\b|\bconcentra[r]?\b/.test(lower) && detectedDay) { kind = "preferDay"; value = detectedDay; }
      else if (/\bdistribuir?\b|\bdistribuye\b|\brepartir?\b|\bspread\b/.test(lower)) { kind = "spreadSessions"; }
      if (!kind) return [];
      return [{ id: `pref-${crypto.randomUUID()}`, scope, targetId, kind, value, weight: 1, active: true }];
    });
  };

  const handleParseAndAddPrefs = () => {
    const parsed = parseNaturalPreferences(nlPrefText);
    if (parsed.length === 0) { alert("No se reconocieron preferencias. Intenta con: 'concentra en mañana', 'evita viernes', 'prefiere lunes', 'distribuye sesiones'."); return; }
    updatePeriod({ preferences: [...period.preferences, ...parsed] });
    setNlPrefText("");
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
          editingAvailabilityTeacherId ? (
            (() => {
              const activeBlocks = period.timeBlocks.filter(b => b.active);
              const teacher = period.teachers.find(t => t.id === editingAvailabilityTeacherId);
              if (!teacher) return null;

              const availability = teacher.availability || {};

              const handleToggleSlot = (day: Weekday, blockId: string) => {
                const currentSlots = availability[day] || [];
                let newSlots: string[];
                if (currentSlots.includes(blockId)) {
                  newSlots = currentSlots.filter(id => id !== blockId);
                } else {
                  newSlots = [...currentSlots, blockId];
                }

                const updatedAvailability = {
                  ...availability,
                  [day]: newSlots
                };

                const updatedTeachers = period.teachers.map(t => {
                  if (t.id === teacher.id) {
                    return {
                      ...t,
                      availability: updatedAvailability
                    };
                  }
                  return t;
                });

                updatePeriod({ teachers: updatedTeachers });
              };

              const handleMarkAllAvailable = () => {
                const updatedTeachers = period.teachers.map(t => {
                  if (t.id === teacher.id) {
                    const { availability: _, ...rest } = t;
                    return rest;
                  }
                  return t;
                });
                updatePeriod({ teachers: updatedTeachers });
              };

              const handleClearAll = () => {
                const emptyAvailability: Record<string, string[]> = {
                  monday: [],
                  tuesday: [],
                  wednesday: [],
                  thursday: [],
                  friday: []
                };
                const updatedTeachers = period.teachers.map(t => {
                  if (t.id === teacher.id) {
                    return {
                      ...t,
                      availability: emptyAvailability
                    };
                  }
                  return t;
                });
                updatePeriod({ teachers: updatedTeachers });
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: "1.2rem", fontWeight: 600 }}>Configurar Disponibilidad</h3>
                      <p style={{ fontSize: "0.95rem", color: "var(--accent-color)", fontWeight: "bold" }}>
                        Docente: {teacher.name}
                      </p>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingAvailabilityTeacherId(null)}>
                      Volver
                    </button>
                  </div>

                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Marca los bloques en los que el profesor <strong>está disponible</strong>. Si no marcas ningún bloque, el sistema asumirá que tiene <strong>disponibilidad completa (por defecto)</strong>.
                  </p>

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleMarkAllAvailable}>
                      Disponibilidad Completa (Por defecto)
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" style={{ borderColor: "var(--error-color)", color: "var(--error-color)" }} onClick={handleClearAll}>
                      Limpiar Todo (No disponible)
                    </button>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table" style={{ width: "100%", tableLayout: "fixed" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "120px" }}>Bloque / Hora</th>
                          <th>Lunes</th>
                          <th>Martes</th>
                          <th>Miércoles</th>
                          <th>Jueves</th>
                          <th>Viernes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeBlocks.map(block => (
                          <tr key={block.id}>
                            <td style={{ fontWeight: 500 }}>
                              <div>{block.label}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{block.start} - {block.end}</div>
                            </td>
                            {(["monday", "tuesday", "wednesday", "thursday", "friday"] as Weekday[]).map(day => {
                              const isConfigured = teacher.availability !== undefined;
                              const isAvailable = !isConfigured || (teacher.availability?.[day] || []).includes(block.id);

                              return (
                                <td
                                  key={day}
                                  onClick={() => handleToggleSlot(day, block.id)}
                                  style={{
                                    cursor: "pointer",
                                    backgroundColor: isAvailable ? "rgba(16, 185, 129, 0.15)" : "transparent",
                                    color: isAvailable ? "var(--success-color)" : "var(--text-muted)",
                                    textAlign: "center",
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                    transition: "all var(--transition-fast)",
                                    border: "1px solid var(--border-color)",
                                    userSelect: "none"
                                  }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                                    <span>{isAvailable ? "✓ Disponible" : "No disponible"}</span>
                                    {!isConfigured && <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: "normal" }}>(Por defecto)</span>}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {activeBlocks.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                              No hay claves horarias activas configuradas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          ) : (
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
                      <th>Disponibilidad</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.teachers.map(t => (
                      <tr key={t.id}>
                        {editingTeacher !== null && editingTeacher.id === t.id ? (
                          <>
                            <td>
                              <label className="checkbox-container">
                                <input type="checkbox" checked={editingTeacher.active} onChange={() => setEditingTeacher({ ...editingTeacher, active: !editingTeacher.active })} />
                                <div className="checkbox-box"></div>
                                <span>{editingTeacher.active ? "Activo" : "Inactivo"}</span>
                              </label>
                            </td>
                            <td><input className="form-control" value={editingTeacher.name} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} /></td>
                            <td>{getAvailabilitySummary(t)}</td>
                            <td style={{ textAlign: "right" }}>
                              <button type="button" className="btn btn-primary btn-sm" style={{ marginRight: "0.5rem" }} onClick={handleSaveTeacher}>Guardar</button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingTeacher(null)}>Cancelar</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <label className="checkbox-container">
                                <input type="checkbox" checked={t.active} onChange={() => toggleTeacherActive(t.id)} />
                                <div className="checkbox-box"></div>
                                <span>{t.active ? "Activo" : "Inactivo"}</span>
                              </label>
                            </td>
                            <td>{t.name}</td>
                            <td>{getAvailabilitySummary(t)}</td>
                            <td style={{ textAlign: "right" }}>
                              <button type="button" className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }} onClick={() => setEditingTeacher({ ...t })}>Editar</button>
                              <button type="button" className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }} onClick={() => setEditingAvailabilityTeacherId(t.id)}>Disponibilidad</button>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteTeacher(t.id)}>Eliminar</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {period.teachers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                          No hay profesores registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
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
                      {editingCourse !== null && editingCourse.id === c.id ? (
                        <>
                          <td>
                            <label className="checkbox-container">
                              <input type="checkbox" checked={editingCourse.active} onChange={() => setEditingCourse({ ...editingCourse, active: !editingCourse.active })} />
                              <div className="checkbox-box"></div>
                              <span>{editingCourse.active ? "Activo" : "Inactivo"}</span>
                            </label>
                          </td>
                          <td><input className="form-control" value={editingCourse.name} onChange={e => setEditingCourse({ ...editingCourse, name: e.target.value })} /></td>
                          <td>
                            <select multiple className="form-control" style={{ height: "60px", padding: "4px" }}
                              value={editingCourse.teacherIds}
                              onChange={e => setEditingCourse({ ...editingCourse, teacherIds: Array.from(e.target.selectedOptions).map(o => o.value) })}>
                              {period.teachers.filter(t => t.active).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                              <input type="number" min={1} className="form-control" style={{ width: "55px" }} value={editingCourse.weeklySessions}
                                onChange={e => setEditingCourse({ ...editingCourse, weeklySessions: parseInt(e.target.value, 10) || 1 })} />
                              <span style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>ses. ×</span>
                              <input type="number" min={1} className="form-control" style={{ width: "55px" }} value={editingCourse.blocksPerSession}
                                onChange={e => setEditingCourse({ ...editingCourse, blocksPerSession: parseInt(e.target.value, 10) || 1 })} />
                              <span style={{ fontSize: "0.8rem" }}>cl.</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button className="btn btn-primary btn-sm" style={{ marginRight: "0.5rem" }} onClick={handleSaveCourse}>Guardar</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingCourse(null)}>Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
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
                            <button className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }} onClick={() => setEditingCourse({ ...c })}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCourse(c.id)}>Eliminar</button>
                          </td>
                        </>
                      )}
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
                      {editingBlock !== null && editingBlock.id === b.id ? (
                        <>
                          <td>
                            <label className="checkbox-container">
                              <input type="checkbox" checked={editingBlock.active} onChange={() => setEditingBlock({ ...editingBlock, active: !editingBlock.active })} />
                              <div className="checkbox-box"></div>
                              <span>{editingBlock.active ? "Activa" : "Inactiva"}</span>
                            </label>
                          </td>
                          <td><input className="form-control" value={editingBlock.label} onChange={e => setEditingBlock({ ...editingBlock, label: e.target.value })} /></td>
                          <td>
                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                              <input type="time" className="form-control" value={editingBlock.start} onChange={e => setEditingBlock({ ...editingBlock, start: e.target.value })} />
                              <span>-</span>
                              <input type="time" className="form-control" value={editingBlock.end} onChange={e => setEditingBlock({ ...editingBlock, end: e.target.value })} />
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button className="btn btn-primary btn-sm" style={{ marginRight: "0.5rem" }} onClick={handleSaveBlock}>Guardar</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingBlock(null)}>Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
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
                            <button className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem" }} onClick={() => setEditingBlock({ ...b })}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBlock(b.id)}>Eliminar</button>
                          </td>
                        </>
                      )}
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
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Agregar preferencias en lenguaje natural</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder='Ej: "concentra en mañana, evita viernes, para Español 1 prefiere lunes"'
                  value={nlPrefText}
                  onChange={e => setNlPrefText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleParseAndAddPrefs(); } }}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={handleParseAndAddPrefs}>Interpretar y Agregar</button>
            </div>
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
