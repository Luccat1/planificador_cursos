import * as XLSX from "xlsx";
import { Period, Teacher, Course, TimeBlock, CourseConflictRule, Preference, Weekday } from "./types";

function translateDayToSpanish(day: string): string {
  const translations: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes"
  };
  return translations[day] || day;
}

function isDescriptionRow(row: any): boolean {
  if (!row) return false;
  return Object.values(row).some(
    val => typeof val === "string" && val.trim().startsWith("Ej:")
  );
}

export function buildExcelTemplate(period: Period): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // 0. Instrucciones
  const instruccionesData = [
    {
      "Hoja/Pestaña": "Instrucciones",
      "Descripción": "Hoja explicativa sobre el uso de la plantilla (puedes borrarla o mantenerla, no afecta la importación).",
      "Reglas / Tips": "-"
    },
    {
      "Hoja/Pestaña": "Profesores",
      "Descripción": "Define los docentes del periodo.",
      "Reglas / Tips": "id: ID único sin espacios (ej. t-1). nombre: Nombre del docente. activo: SÍ o NO."
    },
    {
      "Hoja/Pestaña": "Disponibilidad",
      "Descripción": "Registra los días y bloques horarios en que está disponible cada docente.",
      "Reglas / Tips": "profesor_id: debe coincidir con Profesores. dia: Lunes, Martes, Miércoles, Jueves, Viernes. clave_id: ID del bloque (ej. 1-2). Si un profesor no se menciona aquí, se asume que está 100% disponible."
    },
    {
      "Hoja/Pestaña": "Cursos",
      "Descripción": "Define las asignaturas y cursos a planificar.",
      "Reglas / Tips": "id: ID único (ej. c-1). profesores: IDs de profesores separados por coma (ej: t-1, t-2). sesiones_semana: Cantidad de clases a la semana. claves_por_sesion: duración en bloques continuos. activo: SÍ o NO."
    },
    {
      "Hoja/Pestaña": "Claves horarias",
      "Descripción": "Lista de todos los módulos horarios disponibles para la planificación.",
      "Reglas / Tips": "id: ID de la clave horaria (ej: 1-2). clave: Nombre que se muestra. inicio/termino: formato HH:MM (ej. 08:15). activo: SÍ o NO."
    },
    {
      "Hoja/Pestaña": "Restricciones",
      "Descripción": "Reglas para evitar que dos cursos específicos se programen a la misma hora.",
      "Reglas / Tips": "curso_a y curso_b: IDs de los cursos correspondientes. motivo: texto descriptivo. activo: SÍ o NO."
    },
    {
      "Hoja/Pestaña": "Preferencias",
      "Descripción": "Prioridades blandas para ordenar el horario (ej: preferir mañanas).",
      "Reglas / Tips": "alcance: period, course o teacher. tipo: preferMorning, preferDay, avoidDay, spreadSessions. peso: importancia numérica (ej: 5). activo: SÍ o NO."
    }
  ];
  const wsInstrucciones = XLSX.utils.json_to_sheet(instruccionesData);
  XLSX.utils.book_append_sheet(wb, wsInstrucciones, "Instrucciones");

  // 1. Profesores
  const teachersData = [
    {
      id: "Ej: t-1 (ID corto sin espacios)",
      nombre: "Ej: Andrés Sepúlveda",
      activo: "Ej: SÍ"
    },
    ...period.teachers.map(t => ({
      id: t.id,
      nombre: t.name,
      activo: t.active ? "SÍ" : "NO"
    }))
  ];
  const wsTeachers = XLSX.utils.json_to_sheet(teachersData);
  XLSX.utils.book_append_sheet(wb, wsTeachers, "Profesores");

  // 2. Cursos
  const coursesData = [
    {
      id: "Ej: c-1 (ID del curso, único sin espacios)",
      nombre: "Ej: Matemáticas I",
      profesores: "Ej: t-1 (IDs de profesores separados por coma)",
      sesiones_semana: "Ej: 2",
      claves_por_sesion: "Ej: 2",
      activo: "Ej: SÍ"
    },
    ...period.courses.map(c => ({
      id: c.id,
      nombre: c.name,
      profesores: c.teacherIds.join(", "),
      sesiones_semana: c.weeklySessions,
      claves_por_sesion: c.blocksPerSession,
      activo: c.active ? "SÍ" : "NO"
    }))
  ];
  const wsCourses = XLSX.utils.json_to_sheet(coursesData);
  XLSX.utils.book_append_sheet(wb, wsCourses, "Cursos");

  // 3. Claves horarias
  const blocksData = [
    {
      id: "Ej: 1-2 (ID del bloque, sin espacios)",
      clave: "Ej: 1-2 (Nombre visible)",
      inicio: "Ej: 08:15",
      termino: "Ej: 09:25",
      activo: "Ej: SÍ"
    },
    ...period.timeBlocks.map(b => ({
      id: b.id,
      clave: b.label,
      inicio: b.start,
      termino: b.end,
      activo: b.active ? "SÍ" : "NO"
    }))
  ];
  const wsBlocks = XLSX.utils.json_to_sheet(blocksData);
  XLSX.utils.book_append_sheet(wb, wsBlocks, "Claves horarias");

  // 4. Restricciones
  const rulesData = [
    {
      id: "Ej: cr-1 (ID de regla único)",
      curso_a: "Ej: c-1 (ID de un curso)",
      curso_b: "Ej: c-2 (ID del otro curso)",
      motivo: "Ej: Cursos del mismo semestre",
      activo: "Ej: SÍ"
    },
    ...period.conflictRules.map(r => ({
      id: r.id,
      curso_a: r.courseAId,
      curso_b: r.courseBId,
      motivo: r.reason,
      activo: r.active ? "SÍ" : "NO"
    }))
  ];
  const wsRules = XLSX.utils.json_to_sheet(rulesData);
  XLSX.utils.book_append_sheet(wb, wsRules, "Restricciones");

  // 5. Preferencias
  const prefsData = [
    {
      id: "Ej: p-1",
      alcance: "Ej: teacher (period, course o teacher)",
      objetivo: "Ej: t-1 (ID del curso o profesor, o vacío para period)",
      tipo: "Ej: preferMorning (preferMorning, preferDay, avoidDay, spreadSessions)",
      valor: "Ej: monday (día en inglés para preferDay/avoidDay, o vacío)",
      peso: "Ej: 5",
      activo: "Ej: SÍ"
    },
    ...period.preferences.map(p => ({
      id: p.id,
      alcance: p.scope,
      objetivo: p.targetId,
      tipo: p.kind,
      valor: p.value,
      peso: p.weight,
      activo: p.active ? "SÍ" : "NO"
    }))
  ];
  const wsPrefs = XLSX.utils.json_to_sheet(prefsData);
  XLSX.utils.book_append_sheet(wb, wsPrefs, "Preferencias");

  // 6. Disponibilidad de Docentes
  const availabilityRows: any[] = [];
  for (const t of period.teachers) {
    if (t.availability) {
      for (const day of Object.keys(t.availability) as Weekday[]) {
        const blocks = t.availability[day] || [];
        for (const blockId of blocks) {
          availabilityRows.push({
            profesor_id: t.id,
            dia: translateDayToSpanish(day),
            clave_id: blockId
          });
        }
      }
    }
  }
  const availabilityData = [
    {
      profesor_id: "Ej: t-1",
      dia: "Ej: Lunes",
      clave_id: "Ej: 1-2"
    },
    ...availabilityRows
  ];
  const wsAvailability = XLSX.utils.json_to_sheet(availabilityData);
  XLSX.utils.book_append_sheet(wb, wsAvailability, "Disponibilidad");

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

  // Parse Disponibilidad first
  const spanishToEnglishDay: Record<string, Weekday> = {
    "lunes": "monday",
    "martes": "tuesday",
    "miércoles": "wednesday",
    "miercoles": "wednesday",
    "jueves": "thursday",
    "viernes": "friday"
  };

  const teacherAvailabilities = new Map<string, { [day in Weekday]?: string[] }>();
  if (wb.SheetNames.includes("Disponibilidad")) {
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Disponibilidad"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

    for (const row of data) {
      const teacherId = String(row.profesor_id || "").trim();
      const spanishDay = String(row.dia || "").trim().toLowerCase();
      const blockId = String(row.clave_id || "").trim();

      const day = spanishToEnglishDay[spanishDay];
      if (teacherId && day && blockId) {
        if (!teacherAvailabilities.has(teacherId)) {
          teacherAvailabilities.set(teacherId, {});
        }
        const avail = teacherAvailabilities.get(teacherId)!;
        if (!avail[day]) {
          avail[day] = [];
        }
        if (!avail[day]!.includes(blockId)) {
          avail[day]!.push(blockId);
        }
      }
    }
  }

  // Parse Profesores
  if (wb.SheetNames.includes("Profesores")) {
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Profesores"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

    for (const row of data) {
      if (row.id && row.nombre) {
        const teacherId = String(row.id).trim();
        teachers.push({
          id: teacherId,
          name: String(row.nombre).trim(),
          active: parseBoolean(row.activo),
          availability: teacherAvailabilities.get(teacherId)
        });
      }
    }
  }

  // Parse Cursos
  if (wb.SheetNames.includes("Cursos")) {
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Cursos"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

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
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Claves horarias"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

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
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Restricciones"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

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
    const rawData = XLSX.utils.sheet_to_json<any>(wb.Sheets["Preferencias"]);
    const data = rawData.filter(row => !isDescriptionRow(row));

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
