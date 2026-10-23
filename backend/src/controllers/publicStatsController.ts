import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';

const mapTopUniversity = (row: Record<string, unknown>) => ({
  id: row.id,
  nombre: row.nombre,
  ciudad: row.ciudad,
  ratingPromedio:
    row.rating_promedio !== null && row.rating_promedio !== undefined
      ? Number(row.rating_promedio)
      : null,
  resenasCount: Number(row.resenas_count || 0),
  programasCount: Number(row.programas_count || 0),
});

export const getPublicStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [summary, topUniversities] = await Promise.all([
      query(
        `SELECT
           COUNT(u.id)::int AS universidades_total,
           COUNT(DISTINCT NULLIF(lower(trim(u.ciudad)), ''))::int AS ciudades_total,
           (
             SELECT COUNT(*)::int
             FROM reviews r
             WHERE r.estado = 'aprobada'
           ) AS resenas_total
         FROM universidades u
         WHERE u.estado = 'aprobado'`
      ),
      query(
        `WITH review_stats AS (
           SELECT
             referencia_id AS universidad_id,
             ROUND(AVG(rating)::numeric, 1) AS rating_promedio,
             COUNT(*)::int AS resenas_count
           FROM reviews
           WHERE estado = 'aprobada' AND tipo = 'universidad'
           GROUP BY referencia_id
         ),
         program_stats AS (
           SELECT
             universidad_id,
             COUNT(*)::int AS programas_count
           FROM programas
           WHERE estado = 'aprobado'
           GROUP BY universidad_id
         )
         SELECT
           u.id,
           u.nombre,
           u.ciudad,
           rs.rating_promedio,
           COALESCE(rs.resenas_count, 0)::int AS resenas_count,
           COALESCE(ps.programas_count, 0)::int AS programas_count
         FROM universidades u
         LEFT JOIN review_stats rs ON rs.universidad_id = u.id
         LEFT JOIN program_stats ps ON ps.universidad_id = u.id
         WHERE u.estado = 'aprobado'
           AND (COALESCE(rs.resenas_count, 0) > 0 OR COALESCE(ps.programas_count, 0) > 0)
         ORDER BY
           CASE WHEN COALESCE(rs.resenas_count, 0) > 0 THEN 0 ELSE 1 END,
           rs.rating_promedio DESC NULLS LAST,
           COALESCE(rs.resenas_count, 0) DESC,
           COALESCE(ps.programas_count, 0) DESC,
           u.nombre ASC
         LIMIT 5`
      ),
    ]);

    const summaryRow = summary.rows[0] || {};
    const data = {
      universidadesTotal: Number(summaryRow.universidades_total || 0),
      ciudadesTotal: Number(summaryRow.ciudades_total || 0),
      publicasTotal: null,
      privadasTotal: null,
      resenasTotal: Number(summaryRow.resenas_total || 0),
      topUniversidades: topUniversities.rows.map(mapTopUniversity),
    };

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};
