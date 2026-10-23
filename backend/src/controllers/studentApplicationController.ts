import { NextFunction, Request, Response } from 'express';
import type { DatabaseError } from 'pg';
import { query } from '../config/db';
import { ROLES } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';

type ApplicationStatus =
  | 'iniciado'
  | 'investigando'
  | 'preparando_documentos'
  | 'aplicado'
  | 'en_revision'
  | 'admitido'
  | 'rechazado'
  | 'cancelado';

const validStatuses: ApplicationStatus[] = [
  'iniciado',
  'investigando',
  'preparando_documentos',
  'aplicado',
  'en_revision',
  'admitido',
  'rechazado',
  'cancelado',
];

const baseRequirements = [
  {
    nombre: 'Documento identidad',
    descripcion: 'Cedula, tarjeta de identidad o documento equivalente vigente.',
  },
  {
    nombre: 'Diploma',
    descripcion: 'Diploma o acta de grado del ultimo nivel academico cursado.',
  },
  {
    nombre: 'Certificado notas',
    descripcion: 'Certificados de calificaciones solicitados por la universidad.',
  },
  {
    nombre: 'Resultado pruebas',
    descripcion: 'Resultados de pruebas Saber, admision u otros examenes requeridos.',
  },
  {
    nombre: 'Formulario inscripcion',
    descripcion: 'Formulario institucional diligenciado y listo para envio.',
  },
];

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const getStudentUser = async (userId?: string) => {
  if (!userId) {
    throw new AppError('Usuario no autenticado', 401);
  }

  const result = await query(
    `SELECT id, role, tipo_usuario, plan
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (!result.rowCount) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const user = result.rows[0] as { id: string; role: string; tipo_usuario: string | null; plan: string };
  if (user.role !== ROLES.STUDENT && user.role !== ROLES.USER && user.tipo_usuario !== 'student') {
    throw new AppError('Este modulo es exclusivo para estudiantes', 403);
  }

  return user;
};

const applicationSelect = `
  sa.*,
  p.nombre AS program_nombre,
  p.descripcion AS program_descripcion,
  p.precio AS program_precio,
  p.modalidad AS program_modalidad,
  p.duracion AS program_duracion,
  u.nombre AS university_nombre,
  u.ciudad AS university_ciudad,
  u.descripcion AS university_descripcion,
  advisor.name AS asesor_nombre,
  COALESCE(req_stats.total, 0)::int AS requirements_total,
  COALESCE(req_stats.completed, 0)::int AS requirements_completed
`;

const applicationJoins = `
  INNER JOIN programas p ON p.id = sa.program_id
  INNER JOIN universidades u ON u.id = sa.university_id
  LEFT JOIN users advisor ON advisor.id = sa.asesor_asignado
  LEFT JOIN (
    SELECT
      application_id,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE completado = TRUE)::int AS completed
    FROM application_requirements
    GROUP BY application_id
  ) req_stats ON req_stats.application_id = sa.id
`;

const publicRequirement = (row: Record<string, unknown>) => ({
  id: row.id,
  applicationId: row.application_id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  obligatorio: row.obligatorio,
  completado: row.completado,
  archivoUrl: row.archivo_url,
  createdAt: row.created_at,
});

const publicTimelineItem = (row: Record<string, unknown>) => ({
  id: row.id,
  applicationId: row.application_id,
  estado: row.estado,
  comentario: row.comentario,
  createdAt: row.created_at,
});

const publicApplication = (row: Record<string, unknown>) => {
  const total = Number(row.requirements_total || 0);
  const completed = Number(row.requirements_completed || 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    id: row.id,
    userId: row.user_id,
    universityId: row.university_id,
    programId: row.program_id,
    estado: row.estado,
    notas: row.notas,
    asesorAsignado: row.asesor_asignado,
    asesorNombre: row.asesor_nombre,
    fechaInicio: row.fecha_inicio,
    fechaActualizacion: row.fecha_actualizacion,
    fechaLimite: row.fecha_limite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progress,
    requirementsTotal: total,
    requirementsCompleted: completed,
    missingRequirements: Math.max(total - completed, 0),
    program: {
      id: row.program_id,
      nombre: row.program_nombre,
      descripcion: row.program_descripcion,
      precio: row.program_precio === null ? null : Number(row.program_precio || 0),
      modalidad: row.program_modalidad,
      duracion: row.program_duracion,
    },
    university: {
      id: row.university_id,
      nombre: row.university_nombre,
      ciudad: row.university_ciudad,
      descripcion: row.university_descripcion,
    },
  };
};

const getApplicationForUser = async (applicationId: string, userId: string) => {
  const result = await query(
    `SELECT ${applicationSelect}
     FROM student_applications sa
     ${applicationJoins}
     WHERE sa.id = $1 AND sa.user_id = $2
     LIMIT 1`,
    [applicationId, userId]
  );

  if (!result.rowCount) {
    throw new AppError('Proceso de inscripcion no encontrado', 404);
  }

  return result.rows[0];
};

const handleApplicationDbError = (error: unknown) => {
  const dbError = error as DatabaseError;
  if (dbError?.code === '23505') {
    return new AppError('Ya tienes un proceso activo para este programa', 409, {
      code: 'ACTIVE_APPLICATION_EXISTS',
    });
  }
  if (dbError?.code === '23503') {
    return new AppError('El programa o universidad no existe', 404);
  }
  return error;
};

export const createStudentApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    const programId = normalizeText(req.body.programId || req.body.program_id);
    const notes = normalizeText(req.body.notas || req.body.notes) || null;
    const fechaLimite = normalizeText(req.body.fechaLimite || req.body.fecha_limite) || null;

    if (!programId) {
      throw new AppError('programId es obligatorio', 400);
    }

    const programResult = await query(
      `SELECT p.id, p.universidad_id
       FROM programas p
       INNER JOIN universidades u ON u.id = p.universidad_id
       WHERE p.id = $1
       LIMIT 1`,
      [programId]
    );

    if (!programResult.rowCount) {
      throw new AppError('Programa no encontrado', 404);
    }

    const applicationResult = await query(
      `INSERT INTO student_applications (
         user_id, university_id, program_id, estado, notas, fecha_limite
       )
       VALUES ($1, $2, $3, 'iniciado', $4, $5)
       RETURNING id`,
      [user.id, programResult.rows[0].universidad_id, programId, notes, fechaLimite]
    );

    const applicationId = applicationResult.rows[0].id;

    await Promise.all([
      query(
        `INSERT INTO application_requirements (application_id, nombre, descripcion, obligatorio)
         SELECT $1, item->>'nombre', item->>'descripcion', TRUE
         FROM jsonb_array_elements($2::jsonb) AS item`,
        [applicationId, JSON.stringify(baseRequirements)]
      ),
      query(
        `INSERT INTO application_timeline (application_id, estado, comentario)
         VALUES ($1, 'iniciado', 'Proceso de inscripcion iniciado')`,
        [applicationId]
      ),
    ]);

    const application = await getApplicationForUser(applicationId, user.id);

    return res.status(201).json({
      application: publicApplication(application),
    });
  } catch (error) {
    return next(handleApplicationDbError(error));
  }
};

export const getStudentApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    const result = await query(
      `SELECT ${applicationSelect}
       FROM student_applications sa
       ${applicationJoins}
       WHERE sa.user_id = $1
       ORDER BY sa.updated_at DESC, sa.created_at DESC`,
      [user.id]
    );

    return res.json({
      applications: result.rows.map(publicApplication),
    });
  } catch (error) {
    return next(error);
  }
};

export const getStudentApplicationDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    const application = await getApplicationForUser(req.params.id, user.id);
    const [requirements, timeline] = await Promise.all([
      query(
        `SELECT *
         FROM application_requirements
         WHERE application_id = $1
         ORDER BY obligatorio DESC, created_at ASC`,
        [req.params.id]
      ),
      query(
        `SELECT *
         FROM application_timeline
         WHERE application_id = $1
         ORDER BY created_at ASC`,
        [req.params.id]
      ),
    ]);

    return res.json({
      application: publicApplication(application),
      requirements: requirements.rows.map(publicRequirement),
      timeline: timeline.rows.map(publicTimelineItem),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateStudentApplicationStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    const estado = normalizeText(req.body.estado || req.body.status) as ApplicationStatus;
    const comentario = normalizeText(req.body.comentario || req.body.comment) || `Estado actualizado a ${estado}`;

    if (!validStatuses.includes(estado)) {
      throw new AppError('estado invalido', 400);
    }

    await getApplicationForUser(req.params.id, user.id);

    await query(
      `UPDATE student_applications
       SET estado = $1,
           fecha_actualizacion = NOW(),
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [estado, req.params.id, user.id]
    );

    await query(
      `INSERT INTO application_timeline (application_id, estado, comentario)
       VALUES ($1, $2, $3)`,
      [req.params.id, estado, comentario]
    );

    const application = await getApplicationForUser(req.params.id, user.id);

    return res.json({
      application: publicApplication(application),
    });
  } catch (error) {
    return next(error);
  }
};

export const addApplicationRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    const nombre = normalizeText(req.body.nombre || req.body.name);
    const descripcion = normalizeText(req.body.descripcion || req.body.description) || null;
    const obligatorio = req.body.obligatorio === undefined ? true : Boolean(req.body.obligatorio);

    if (!nombre) {
      throw new AppError('nombre es obligatorio', 400);
    }

    await getApplicationForUser(req.params.id, user.id);

    const result = await query(
      `INSERT INTO application_requirements (
         application_id, nombre, descripcion, obligatorio
       )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.id, nombre, descripcion, obligatorio]
    );

    await query(
      `UPDATE student_applications
       SET updated_at = NOW(), fecha_actualizacion = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    return res.status(201).json({
      requirement: publicRequirement(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateApplicationRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    await getApplicationForUser(req.params.id, user.id);

    const current = await query(
      `SELECT *
       FROM application_requirements
       WHERE id = $1 AND application_id = $2
       LIMIT 1`,
      [req.params.reqId, req.params.id]
    );

    if (!current.rowCount) {
      throw new AppError('Requisito no encontrado', 404);
    }

    const row = current.rows[0];
    const completado = req.body.completado === undefined ? row.completado : Boolean(req.body.completado);
    const archivoUrl = req.body.archivoUrl !== undefined || req.body.archivo_url !== undefined
      ? normalizeText(req.body.archivoUrl || req.body.archivo_url) || null
      : row.archivo_url;
    const nombre = req.body.nombre !== undefined ? normalizeText(req.body.nombre) : row.nombre;
    const descripcion = req.body.descripcion !== undefined ? normalizeText(req.body.descripcion) || null : row.descripcion;
    const obligatorio = req.body.obligatorio === undefined ? row.obligatorio : Boolean(req.body.obligatorio);

    if (!nombre) {
      throw new AppError('nombre es obligatorio', 400);
    }

    const result = await query(
      `UPDATE application_requirements
       SET nombre = $1,
           descripcion = $2,
           obligatorio = $3,
           completado = $4,
           archivo_url = $5
       WHERE id = $6 AND application_id = $7
       RETURNING *`,
      [nombre, descripcion, obligatorio, completado, archivoUrl, req.params.reqId, req.params.id]
    );

    await query(
      `UPDATE student_applications
       SET updated_at = NOW(), fecha_actualizacion = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    return res.json({
      requirement: publicRequirement(result.rows[0]),
    });
  } catch (error) {
    return next(error);
  }
};

export const getApplicationTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getStudentUser(req.user?.id);
    await getApplicationForUser(req.params.id, user.id);

    const result = await query(
      `SELECT *
       FROM application_timeline
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    return res.json({
      timeline: result.rows.map(publicTimelineItem),
    });
  } catch (error) {
    return next(error);
  }
};
