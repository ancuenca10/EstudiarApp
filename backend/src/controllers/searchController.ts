import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';
import { getDynamicFieldSelect, mapDynamicFields } from '../utils/dynamicFields';

type SearchType = 'universidad' | 'programa' | 'all';

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeSearchType = (value: unknown): SearchType => {
  const text = normalizeText(value).toLowerCase();
  if (['universidad', 'universidades', 'university'].includes(text)) return 'universidad';
  if (['programa', 'programas', 'program'].includes(text)) return 'programa';
  return 'all';
};

const normalizePositiveInteger = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
};

const buildLike = (value: string) => `%${value.replace(/[%_]/g, '\\$&')}%`;

const mapUniversity = (row: any) => ({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  ciudad: row.ciudad,
  estado: row.estado,
  programasCount: Number(row.programas_count || 0),
  programas: Array.isArray(row.programas)
    ? row.programas.map((program: any) => ({
        ...program,
        precio:
          program?.precio !== undefined && program?.precio !== null ? Number(program.precio) : 0,
        dynamicFields: mapDynamicFields(program?.dynamicFields),
      }))
    : [],
  dynamicFields: mapDynamicFields(row.dynamic_fields),
  creadoEn: row.creado_en,
  actualizadoEn: row.actualizado_en,
});

const mapProgram = (row: any) => ({
  id: row.id,
  nombre: row.nombre,
  descripcion: row.descripcion,
  precio: Number(row.precio),
  modalidad: row.modalidad,
  duracion: row.duracion,
  universidadId: row.universidad_id,
  universidadNombre: row.universidad_nombre,
  universidadCiudad: row.universidad_ciudad,
  estado: row.estado,
  dynamicFields: mapDynamicFields(row.dynamic_fields),
  fechaAprobacion: row.fecha_aprobacion,
  creadoEn: row.creado_en,
  actualizadoEn: row.actualizado_en,
});

const getSearchParams = (req: Request) => {
  const q = normalizeText(req.query.q || req.query.searchTerm);
  const ciudad = normalizeText(req.query.ciudad || req.query.city);
  const modalidad = normalizeText(req.query.modalidad || req.query.modality || req.query.modalities);
  const tipo = normalizeSearchType(req.query.tipo || req.query.type);
  const limit = normalizePositiveInteger(req.query.limit, 24, 100);
  const offset = normalizePositiveInteger(req.query.offset, 0, 10000);

  return { q, ciudad, modalidad, tipo, limit, offset };
};

const searchUniversities = async (params: ReturnType<typeof getSearchParams>) => {
  const values: unknown[] = [];
  const where = [`u.estado = 'aprobado'`];
  const universityDynamicFieldsSelect = getDynamicFieldSelect('universidad', 'u');
  const programDynamicFieldsSelect = getDynamicFieldSelect('programa', 'p');

  if (params.q) {
    values.push(buildLike(params.q));
    const idx = values.length;
    where.push(`(
      u.nombre ILIKE $${idx}
      OR u.descripcion ILIKE $${idx}
      OR u.ciudad ILIKE $${idx}
      OR EXISTS (
        SELECT 1
        FROM university_field_values ufv
        INNER JOIN form_fields uff ON uff.id = ufv.field_id
        WHERE ufv.universidad_id = u.id
          AND uff.activo = true
          AND COALESCE((to_jsonb(uff)->>'searchable')::boolean, false) = true
          AND COALESCE(ufv.valor, to_jsonb(ufv)->>'value_json') ILIKE $${idx}
      )
      OR EXISTS (
        SELECT 1
        FROM programas p
        WHERE p.universidad_id = u.id
          AND p.estado = 'aprobado'
          AND (
            p.nombre ILIKE $${idx}
            OR p.descripcion ILIKE $${idx}
            OR p.modalidad ILIKE $${idx}
            OR p.duracion ILIKE $${idx}
            OR EXISTS (
              SELECT 1
              FROM program_field_values pfv
              INNER JOIN form_fields pff ON pff.id = pfv.field_id
              WHERE pfv.programa_id = p.id
                AND pff.activo = true
                AND COALESCE((to_jsonb(pff)->>'searchable')::boolean, false) = true
                AND COALESCE(pfv.valor, to_jsonb(pfv)->>'value_json') ILIKE $${idx}
            )
          )
      )
    )`);
  }

  if (params.ciudad) {
    values.push(buildLike(params.ciudad));
    where.push(`u.ciudad ILIKE $${values.length}`);
  }

  values.push(params.limit, params.offset);
  const limitIndex = values.length - 1;
  const offsetIndex = values.length;

  const result = await query(
    `SELECT
       u.id,
       u.nombre,
       u.descripcion,
       u.ciudad,
       u.estado,
       u.creado_en,
       u.actualizado_en,
       ${universityDynamicFieldsSelect} AS dynamic_fields,
       COUNT(p.id) FILTER (WHERE p.estado = 'aprobado') AS programas_count,
       COALESCE(
         json_agg(
           json_build_object(
             'id', p.id,
             'nombre', p.nombre,
             'descripcion', p.descripcion,
             'precio', p.precio,
             'modalidad', p.modalidad,
             'duracion', p.duracion,
             'estado', p.estado,
             'dynamicFields', ${programDynamicFieldsSelect}
           )
           ORDER BY p.nombre
         ) FILTER (WHERE p.id IS NOT NULL AND p.estado = 'aprobado'),
         '[]'::json
       ) AS programas
     FROM universidades u
     LEFT JOIN programas p ON p.universidad_id = u.id
     WHERE ${where.join(' AND ')}
     GROUP BY u.id
     ORDER BY u.nombre ASC
     LIMIT $${limitIndex}
     OFFSET $${offsetIndex}`,
    values
  );

  return result.rows.map(mapUniversity);
};

const searchPrograms = async (params: ReturnType<typeof getSearchParams>) => {
  const values: unknown[] = [];
  const where = [`p.estado = 'aprobado'`, `u.estado = 'aprobado'`];
  const programDynamicFieldsSelect = getDynamicFieldSelect('programa', 'p');

  if (params.q) {
    values.push(buildLike(params.q));
    const idx = values.length;
    where.push(`(
      p.nombre ILIKE $${idx}
      OR p.descripcion ILIKE $${idx}
      OR p.modalidad ILIKE $${idx}
      OR p.duracion ILIKE $${idx}
      OR u.nombre ILIKE $${idx}
      OR u.descripcion ILIKE $${idx}
      OR u.ciudad ILIKE $${idx}
      OR EXISTS (
        SELECT 1
        FROM program_field_values pfv
        INNER JOIN form_fields pff ON pff.id = pfv.field_id
        WHERE pfv.programa_id = p.id
          AND pff.activo = true
          AND COALESCE((to_jsonb(pff)->>'searchable')::boolean, false) = true
          AND COALESCE(pfv.valor, to_jsonb(pfv)->>'value_json') ILIKE $${idx}
      )
      OR EXISTS (
        SELECT 1
        FROM university_field_values ufv
        INNER JOIN form_fields uff ON uff.id = ufv.field_id
        WHERE ufv.universidad_id = u.id
          AND uff.activo = true
          AND COALESCE((to_jsonb(uff)->>'searchable')::boolean, false) = true
          AND COALESCE(ufv.valor, to_jsonb(ufv)->>'value_json') ILIKE $${idx}
      )
    )`);
  }

  if (params.ciudad) {
    values.push(buildLike(params.ciudad));
    where.push(`u.ciudad ILIKE $${values.length}`);
  }

  if (params.modalidad) {
    values.push(buildLike(params.modalidad));
    where.push(`p.modalidad ILIKE $${values.length}`);
  }

  values.push(params.limit, params.offset);
  const limitIndex = values.length - 1;
  const offsetIndex = values.length;

  const result = await query(
    `SELECT
       p.id,
       p.nombre,
       p.descripcion,
       p.precio,
       p.modalidad,
       p.duracion,
       p.universidad_id,
       p.estado,
       p.fecha_aprobacion,
       p.creado_en,
       p.actualizado_en,
       ${programDynamicFieldsSelect} AS dynamic_fields,
       u.nombre AS universidad_nombre,
       u.ciudad AS universidad_ciudad
     FROM programas p
     INNER JOIN universidades u ON u.id = p.universidad_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.fecha_aprobacion DESC NULLS LAST, p.nombre ASC
     LIMIT $${limitIndex}
     OFFSET $${offsetIndex}`,
    values
  );

  return result.rows.map(mapProgram);
};

export const searchController = {
  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = getSearchParams(req);
      const [universities, programs] = await Promise.all([
        params.tipo === 'programa' ? Promise.resolve([]) : searchUniversities(params),
        params.tipo === 'universidad' ? Promise.resolve([]) : searchPrograms(params),
      ]);

      return res.json({
        success: true,
        data: { universities, programs },
        meta: {
          q: params.q,
          ciudad: params.ciudad,
          modalidad: params.modalidad,
          tipo: params.tipo,
          limit: params.limit,
          offset: params.offset,
          totalUniversities: universities.length,
          totalPrograms: programs.length,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  advancedSearch: async (req: Request, res: Response, next: NextFunction) => {
    return searchController.search(req, res, next);
  },

  quickSearch: async (req: Request, res: Response, next: NextFunction) => {
    if (!normalizeText(req.query.q)) {
      return next(new AppError('Termino de busqueda requerido', 400));
    }

    return searchController.search(req, res, next);
  },

  getCities: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await query(
        `SELECT DISTINCT ciudad
         FROM universidades
         WHERE estado = 'aprobado'
         ORDER BY ciudad ASC`
      );

      return res.json({
        success: true,
        data: result.rows.map((row) => row.ciudad),
      });
    } catch (error) {
      return next(error);
    }
  },

  getFilterStats: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [cities, modalities, dynamicFilters] = await Promise.all([
        query(
          `SELECT ciudad, COUNT(*)::int AS count
           FROM universidades
           WHERE estado = 'aprobado'
           GROUP BY ciudad
           ORDER BY ciudad ASC`
        ),
        query(
          `SELECT modalidad, COUNT(*)::int AS count
           FROM programas
           WHERE estado = 'aprobado'
           GROUP BY modalidad
           ORDER BY modalidad ASC`
        ),
        query(
          `SELECT modulo, id, nombre_interno, etiqueta, tipo, opciones
           FROM form_fields
           WHERE activo = true AND COALESCE((to_jsonb(form_fields)->>'filterable')::boolean, false) = true
           ORDER BY modulo ASC, orden ASC, etiqueta ASC`
        ),
      ]);

      return res.json({
        success: true,
        data: {
          cities: cities.rows,
          modalities: modalities.rows,
          dynamicFilters: dynamicFilters.rows,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
};
