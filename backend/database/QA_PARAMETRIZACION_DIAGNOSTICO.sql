-- Diagnostico de parametrizacion. No modifica datos.

BEGIN;

SELECT
  'CAMPOS DUPLICADOS' AS tipo_problema,
  modulo,
  nombre_interno,
  COUNT(*) AS cantidad,
  ARRAY_AGG(id) AS ids
FROM form_fields
GROUP BY modulo, nombre_interno
HAVING COUNT(*) > 1;

SELECT
  'VALORES UNIVERSIDAD SIN CAMPO' AS tipo_problema,
  ufv.id,
  ufv.universidad_id,
  ufv.field_id
FROM university_field_values ufv
LEFT JOIN form_fields ff ON ff.id = ufv.field_id
WHERE ff.id IS NULL;

SELECT
  'VALORES PROGRAMA SIN CAMPO' AS tipo_problema,
  pfv.id,
  pfv.programa_id,
  pfv.field_id
FROM program_field_values pfv
LEFT JOIN form_fields ff ON ff.id = pfv.field_id
WHERE ff.id IS NULL;

SELECT
  'VALORES BECA SIN CAMPO' AS tipo_problema,
  bfv.id,
  bfv.beca_id,
  bfv.field_id
FROM beca_field_values bfv
LEFT JOIN form_fields ff ON ff.id = bfv.field_id
WHERE ff.id IS NULL;

SELECT
  'CAMPOS SIN MODULO' AS tipo_problema,
  id,
  nombre_interno,
  etiqueta
FROM form_fields
WHERE modulo IS NULL OR TRIM(modulo) = '';

SELECT
  'CAMPOS SIN TIPO' AS tipo_problema,
  id,
  nombre_interno,
  etiqueta,
  modulo
FROM form_fields
WHERE tipo IS NULL OR TRIM(tipo) = '';

SELECT
  'NOMBRES INTERNOS INVALIDOS' AS tipo_problema,
  id,
  nombre_interno,
  etiqueta,
  modulo
FROM form_fields
WHERE nombre_interno <> LOWER(nombre_interno)
   OR nombre_interno LIKE '% %'
   OR nombre_interno ~ '[^a-z0-9_]';

SELECT
  'SELECT SIN OPCIONES' AS tipo_problema,
  id,
  nombre_interno,
  etiqueta,
  modulo,
  tipo
FROM form_fields
WHERE tipo IN ('select', 'multi_select')
  AND (
    opciones IS NULL
    OR jsonb_typeof(opciones) <> 'array'
    OR jsonb_array_length(opciones) = 0
  );

SELECT
  'SELECT CON OPCIONES INVALIDAS' AS tipo_problema,
  ff.id,
  ff.nombre_interno,
  ff.etiqueta,
  ff.modulo,
  ff.opciones
FROM form_fields ff
WHERE ff.tipo IN ('select', 'multi_select')
  AND ff.opciones IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(ff.opciones) AS option
    WHERE jsonb_typeof(option) <> 'object'
       OR COALESCE(option->>'label', '') = ''
       OR COALESCE(option->>'value', '') = ''
  );

SELECT
  'CAMPOS ACTIVOS SIN ORDEN' AS tipo_problema,
  id,
  nombre_interno,
  etiqueta,
  modulo,
  orden
FROM form_fields
WHERE activo = true AND orden = 0;

SELECT
  'VALOR UNIVERSIDAD CON CAMPO DE OTRO MODULO' AS tipo_problema,
  ufv.id,
  ufv.universidad_id AS entity_id,
  ufv.field_id,
  ff.modulo
FROM university_field_values ufv
INNER JOIN form_fields ff ON ff.id = ufv.field_id
WHERE ff.modulo <> 'universidad';

SELECT
  'VALOR PROGRAMA CON CAMPO DE OTRO MODULO' AS tipo_problema,
  pfv.id,
  pfv.programa_id AS entity_id,
  pfv.field_id,
  ff.modulo
FROM program_field_values pfv
INNER JOIN form_fields ff ON ff.id = pfv.field_id
WHERE ff.modulo <> 'programa';

SELECT
  'CAMPOS SELECT SEARCH/FILTER' AS tipo_problema,
  modulo,
  nombre_interno,
  searchable,
  filterable,
  opciones
FROM form_fields
WHERE tipo IN ('select', 'multi_select')
  AND (searchable = true OR filterable = true);

SELECT
  'MODULOS EXISTENTES' AS tipo_problema,
  modulo,
  COUNT(*) AS total_campos,
  COUNT(*) FILTER (WHERE activo = true) AS activos,
  COUNT(*) FILTER (WHERE requerido = true) AS requeridos
FROM form_fields
GROUP BY modulo
ORDER BY modulo;

SELECT
  'TIPOS EXISTENTES' AS tipo_problema,
  tipo,
  COUNT(*) AS total
FROM form_fields
GROUP BY tipo
ORDER BY total DESC;

SELECT
  'RESUMEN' AS tipo_problema,
  (SELECT COUNT(*) FROM form_fields) AS total_campos,
  (SELECT COUNT(*) FROM form_fields WHERE activo = true) AS campos_activos,
  (SELECT COUNT(DISTINCT modulo) FROM form_fields) AS modulos_distintos,
  (SELECT COUNT(DISTINCT tipo) FROM form_fields) AS tipos_distintos,
  (SELECT COUNT(*) FROM university_field_values) AS valores_universidad,
  (SELECT COUNT(*) FROM program_field_values) AS valores_programa,
  (SELECT COUNT(*) FROM beca_field_values) AS valores_beca;

ROLLBACK;
