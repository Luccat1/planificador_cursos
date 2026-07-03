import * as XLSX from "xlsx";
import { Period, Teacher, Course, TimeBlock, CourseConflictRule, Preference } from "./types";

export function buildExcelTemplate(period: Period): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // 1. Profesores
  const teachersData = period.teachers.map(t => ({
    id: t.id,
    nombre: t.name,
    activo: t.active ? "SÍ" : "NO"
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, "Profesores");

  // 2. Cursos
  const coursesData = period.courses.map(c => ({
    id: c.id,
    nombre: c.name,
    profesores: c.teacherIds.join(", "),
    sesiones_semana: c.weeklySessions,
    claves_por_sesion: c.blocksPerSession,
    activo: c.active ? "SÍ" : "NO"
  }));
  const wsCourses = XLSX.utils.json_to_sheet(coursesData);
  XLSX.utils.book_append_sheet(wb, wsCourses, "Cursos");

  // 3. Claves horarias
  const blocksData = period.timeBlocks.map(b => ({
    id: b.id,
    clave: b.label,
    inicio: b.start,
    termino: b.end,
    activo: b.active ? "SÍ" : "NO"
  }));
  const wsBlocks = XLSX.utils.json_to_sheet(blocksData);
  XLSX.utils.book_append_sheet(wb, wsBlocks, "Claves horarias");

  // 4. Restricciones
  const rulesData = period.conflictRules.map(r => ({
    id: r.id,
    curso_a: r.courseAId,
    curso_b: r.courseBId,
    motivo: r.reason,
    activo: r.active ? "SÍ" : "NO"
  }));
  const wsRules = XLSX.utils.json_to_sheet(rulesData);
  XLSX.utils.book_append_sheet(wb, wsRules, "Restricciones");

  // 5. Preferencias
  const prefsData = period.preferences.map(p => ({
    id: p.id,
    alcance: p.scope,
    objetivo: p.targetId,
    tipo: p.kind,
    valor: p.value,
    peso: p.weight,
    activo: p.active ? "SÍ" : "NO"
  }));
  const wsPrefs = XLSX.utils.json_to_sheet(prefsData);
  XLSX.utils.book_append_sheet(wb, wsPrefs, "Preferencias");

  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return out;
}

export function parseExcelTemplate(buffer: ArrayBuffer): Period {
  const wb = XLSX.read(buffer, { type: "array" });

  const teachers: Teacher[] = [];
  const courses: Course[] = [];
  const timeBlocks: TimeBlock[] = [];
  const conflictRules: CourseConflictRule[] = [];
  const preferences: Preference[] = [];

  // Parse Profesores
  if (wb.SheetNames.includes("Profesores")) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Profesores"]);
    for (const row of data) {
      if (row.id && row.nombre) {
        teachers.push({
          id: String(row.id).trim(),
          name: String(row.nombre).trim(),
          active: parseBoolean(row.activo)
        });
      }
    }
  }

  // Parse Cursos
  if (wb.SheetNames.includes("Cursos")) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Cursos"]);
    for (const row of data) {
      if (row.id && row.nombre) {
        const teacherIds = row.profesores
          ? String(row.profesores).split(",").map(s => s.trim()).filter(Boolean)
          : [];
        courses.push({
          id: String(row.id).trim(),
          name: String(row.nombre).trim(),
          teacherIds,
          weeklySessions: parseInt(row.sesiones_semana, 10) || 1,
          blocksPerSession: parseInt(row.claves_por_sesion, 10) || 1,
          active: parseBoolean(row.activo)
        });
      }
    }
  }

  // Parse Claves horarias
  if (wb.SheetNames.includes("Claves horarias")) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Claves horarias"]);
    for (const row of data) {
      if (row.id && row.clave) {
        timeBlocks.push({
          id: String(row.id).trim(),
          label: String(row.clave).trim(),
          start: String(row.inicio || "").trim(),
          end: String(row.termino || "").trim(),
          active: parseBoolean(row.activo)
        });
      }
    }
  }

  // Parse Restricciones
  if (wb.SheetNames.includes("Restricciones")) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Restricciones"]);
    for (const row of data) {
      if (row.id && row.curso_a && row.curso_b) {
        conflictRules.push({
          id: String(row.id).trim(),
          courseAId: String(row.curso_a).trim(),
          courseBId: String(row.curso_b).trim(),
          reason: String(row.motivo || "").trim(),
          active: parseBoolean(row.activo)
        });
      }
    }
  }

  // Parse Preferencias
  if (wb.SheetNames.includes("Preferencias")) {
    const data = XLSX.utils.sheet_to_json<any>(wb.Sheets["Preferencias"]);
    for (const row of data) {
      if (row.id && row.alcance && row.tipo) {
        preferences.push({
          id: String(row.id).trim(),
          scope: String(row.alcance).trim() as any,
          targetId: String(row.objetivo || "").trim(),
          kind: String(row.tipo).trim() as any,
          value: String(row.valor || "").trim(),
          weight: parseFloat(row.peso) || 1,
          active: parseBoolean(row.activo)
        });
      }
    }
  }

  return {
    id: "imported-excel",
    name: "Importado de Excel",
    timeBlocks,
    teachers,
    courses,
    requirements: [],
    conflictRules,
    preferences
  };
}

function parseBoolean(val: any): boolean {
  if (val === undefined || val === null) return true;
  const str = String(val).toUpperCase().trim();
  return str === "SÍ" || str === "SI" || str === "TRUE" || str === "1" || str === "YES";
}
