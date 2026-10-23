import type { PoolClient, QueryResultRow } from 'pg';
import { AppError } from '../middleware/errorHandler';

export type DynamicFieldModule = 'universidad' | 'programa' | 'beca';
export type DynamicFieldEditContext = 'admin' | 'university';

export type DynamicFieldInput = {
  fieldId: string;
  value: unknown;
};

type FormFieldRow = {
  id: string;
  modulo: DynamicFieldModule;
  nombre_interno: string;
  etiqueta: string;
  tipo:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'multi_select'
    | 'checkbox'
    | 'date'
    | 'url'
    | 'email'
    | 'phone'
    | 'currency'
    | 'percentage';
  requerido: boolean;
  activo: boolean;
  orden: number;
  opciones: Array<{ label: string; value: string }> | null;
  validation_rules: Record<string, unknown> | null;
  default_value: string | null;
  visible_in_card: boolean;
  visible_in_detail: boolean;
  searchable: boolean;
  filterable: boolean;
  editable_by_university: boolean;
  editable_by_admin: boolean;
};

export type DynamicFieldValue = {
  fieldId: string;
  nombreInterno: string;
  etiqueta: string;
  tipo: FormFieldRow['tipo'];
  value: string | string[] | boolean | null;
  orden: number;
  visibleInCard: boolean;
  visibleInDetail: boolean;
  searchable: boolean;
  filterable: boolean;
};

const normalizeValue = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (value instanceof Date) return value.toISOString();

  const text = String(value).trim();
  return text === '' ? null : text;
};

const normalizeOptions = (value: unknown): Array<{ label: string; value: string }> => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const label = item.trim();
        return label ? { label, value: label.toLowerCase().replace(/\s+/g, '_') } : null;
      }

      if (item && typeof item === 'object') {
        const option = item as Record<string, unknown>;
        const label = String(option.label || '').trim();
        const rawValue = String(option.value || '').trim();
        return label && rawValue ? { label, value: rawValue } : null;
      }

      return null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
};

const isEmptyValue = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'string') return value.trim() === '';
  return false;
};

const parseNumber = (value: unknown, label: string) => {
  const normalized = normalizeValue(value);
  const numericValue = normalized === null ? Number.NaN : Number(normalized);
  if (!Number.isFinite(numericValue)) {
    throw new AppError(`El campo dinamico "${label}" debe ser numerico`, 400);
  }
  return numericValue;
};

const validateDynamicValue = (field: FormFieldRow, value: unknown) => {
  const rules = field.validation_rules || {};
  const options = normalizeOptions(field.opciones);

  if (field.requerido && isEmptyValue(value)) {
    throw new AppError(`El campo dinamico "${field.etiqueta}" es obligatorio`, 400);
  }

  if (isEmptyValue(value)) {
    return { value: null, valueJson: null as unknown };
  }

  if (field.tipo === 'checkbox') {
    if (typeof value === 'boolean') {
      return { value: value ? 'true' : 'false', valueJson: null as unknown };
    }
    if (value === 'true' || value === 'false') {
      return { value: value, valueJson: null as unknown };
    }
    throw new AppError(`El campo dinamico "${field.etiqueta}" debe ser verdadero o falso`, 400);
  }

  if (field.tipo === 'multi_select') {
    const selectedValues = Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : String(value).split(',').map((item) => item.trim()).filter(Boolean);
    const allowedValues = new Set(options.map((option) => option.value));
    const invalidValue = selectedValues.find((item) => !allowedValues.has(item));

    if (invalidValue) {
      throw new AppError(`"${invalidValue}" no es una opcion valida para "${field.etiqueta}"`, 400);
    }

    return { value: null, valueJson: selectedValues };
  }

  const normalizedValue = normalizeValue(value);
  if (normalizedValue === null) return { value: null, valueJson: null as unknown };

  if (field.tipo === 'select') {
    const allowedValues = new Set(options.map((option) => option.value));
    if (!allowedValues.has(normalizedValue)) {
      throw new AppError(`"${normalizedValue}" no es una opcion valida para "${field.etiqueta}"`, 400);
    }
  }

  if (['number', 'currency', 'percentage'].includes(field.tipo)) {
    const numericValue = parseNumber(normalizedValue, field.etiqueta);
    const min = typeof rules.min === 'number' ? rules.min : field.tipo === 'currency' ? 0 : undefined;
    const max = typeof rules.max === 'number' ? rules.max : field.tipo === 'percentage' ? 100 : undefined;

    if (field.tipo === 'percentage' && numericValue < 0) {
      throw new AppError(`El campo dinamico "${field.etiqueta}" debe estar entre 0 y 100`, 400);
    }
    if (min !== undefined && numericValue < min) {
      throw new AppError(`El campo dinamico "${field.etiqueta}" debe ser mayor o igual a ${min}`, 400);
    }
    if (max !== undefined && numericValue > max) {
      throw new AppError(`El campo dinamico "${field.etiqueta}" debe ser menor o igual a ${max}`, 400);
    }
  }

  const minLength = typeof rules.minLength === 'number' ? rules.minLength : undefined;
  const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : undefined;
  if (minLength !== undefined && normalizedValue.length < minLength) {
    throw new AppError(`El campo dinamico "${field.etiqueta}" debe tener al menos ${minLength} caracteres`, 400);
  }
  if (maxLength !== undefined && normalizedValue.length > maxLength) {
    throw new AppError(`El campo dinamico "${field.etiqueta}" debe tener maximo ${maxLength} caracteres`, 400);
  }

  if (field.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
    throw new AppError(`El campo dinamico "${field.etiqueta}" debe ser un email valido`, 400);
  }
  if (field.tipo === 'url') {
    try {
      new URL(normalizedValue);
    } catch {
      throw new AppError(`El campo dinamico "${field.etiqueta}" debe ser una URL valida`, 400);
    }
  }

  if (typeof rules.pattern === 'string' && rules.pattern) {
    const pattern = new RegExp(rules.pattern);
    if (!pattern.test(normalizedValue)) {
      throw new AppError(
        typeof rules.message === 'string' && rules.message
          ? rules.message
          : `El campo dinamico "${field.etiqueta}" tiene un formato invalido`,
        400
      );
    }
  }

  return { value: normalizedValue, valueJson: null as unknown };
};

export const parseDynamicFields = (value: unknown): DynamicFieldInput[] | undefined => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new AppError('dynamicFields debe ser un arreglo', 400);
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new AppError('Cada elemento de dynamicFields debe ser un objeto', 400);
    }

    const { fieldId, value: fieldValue } = item as Record<string, unknown>;
    const normalizedFieldId = typeof fieldId === 'string' ? fieldId.trim() : '';

    if (!normalizedFieldId) {
      throw new AppError('Cada dynamicField debe incluir fieldId', 400);
    }

    return {
      fieldId: normalizedFieldId,
      value: fieldValue,
    };
  });
};

export const syncDynamicFieldValues = async (
  client: PoolClient,
  module: DynamicFieldModule,
  entityId: string,
  dynamicFields: DynamicFieldInput[],
  editContext: DynamicFieldEditContext = 'admin',
) => {
  const tableName =
    module === 'universidad'
      ? 'university_field_values'
      : module === 'programa'
        ? 'program_field_values'
        : 'beca_field_values';
  const entityColumn =
    module === 'universidad' ? 'universidad_id' : module === 'programa' ? 'programa_id' : 'beca_id';

  const fieldIds = [...new Set(dynamicFields.map((item) => item.fieldId))];
  const valueJsonColumnResult = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_name = $1 AND column_name = 'value_json'
     ) AS exists`,
    [tableName]
  );
  const hasValueJsonColumn = Boolean(valueJsonColumnResult.rows[0]?.exists);
  const fieldsResult = await client.query<FormFieldRow>(
    `SELECT
       id,
       modulo,
       nombre_interno,
       etiqueta,
       tipo,
       requerido,
       activo,
       orden,
       opciones,
       COALESCE(to_jsonb(form_fields)->'validation_rules', '{}'::jsonb) AS validation_rules,
       to_jsonb(form_fields)->>'default_value' AS default_value,
       COALESCE((to_jsonb(form_fields)->>'visible_in_card')::boolean, false) AS visible_in_card,
       COALESCE((to_jsonb(form_fields)->>'visible_in_detail')::boolean, true) AS visible_in_detail,
       COALESCE((to_jsonb(form_fields)->>'searchable')::boolean, false) AS searchable,
       COALESCE((to_jsonb(form_fields)->>'filterable')::boolean, false) AS filterable,
       COALESCE((to_jsonb(form_fields)->>'editable_by_university')::boolean, true) AS editable_by_university,
       COALESCE((to_jsonb(form_fields)->>'editable_by_admin')::boolean, true) AS editable_by_admin
     FROM form_fields
     WHERE modulo = $1 AND activo = true AND id = ANY($2::uuid[])`,
    [module, fieldIds]
  );

  if (fieldsResult.rows.length !== fieldIds.length) {
    throw new AppError(`Hay campos dinamicos invalidos para el modulo ${module}`, 400);
  }

  const requiredFieldsResult = await client.query<FormFieldRow>(
    `SELECT
       id,
       modulo,
       nombre_interno,
       etiqueta,
       tipo,
       requerido,
       activo,
       orden,
       opciones,
       COALESCE(to_jsonb(form_fields)->'validation_rules', '{}'::jsonb) AS validation_rules,
       to_jsonb(form_fields)->>'default_value' AS default_value,
       COALESCE((to_jsonb(form_fields)->>'visible_in_card')::boolean, false) AS visible_in_card,
       COALESCE((to_jsonb(form_fields)->>'visible_in_detail')::boolean, true) AS visible_in_detail,
       COALESCE((to_jsonb(form_fields)->>'searchable')::boolean, false) AS searchable,
       COALESCE((to_jsonb(form_fields)->>'filterable')::boolean, false) AS filterable,
       COALESCE((to_jsonb(form_fields)->>'editable_by_university')::boolean, true) AS editable_by_university,
       COALESCE((to_jsonb(form_fields)->>'editable_by_admin')::boolean, true) AS editable_by_admin
     FROM form_fields
     WHERE modulo = $1 AND activo = true AND requerido = true`,
    [module]
  );

  const fieldMap = new Map(fieldsResult.rows.map((field) => [field.id, field]));
  const valuesToPersist = new Map<string, { value: string | null; valueJson: unknown }>();

  for (const item of dynamicFields) {
    const field = fieldMap.get(item.fieldId);
    if (!field) {
      throw new AppError(`Campo dinamico invalido: ${item.fieldId}`, 400);
    }

    if (editContext === 'university' && !field.editable_by_university) {
      throw new AppError(`No tienes permisos para modificar "${field.etiqueta}"`, 403);
    }
    if (editContext === 'admin' && !field.editable_by_admin) {
      throw new AppError(`El campo dinamico "${field.etiqueta}" no es editable por administradores`, 403);
    }

    valuesToPersist.set(field.id, validateDynamicValue(field, item.value));
  }

  const requiredMissing = requiredFieldsResult.rows.filter((field) => {
    if (!field.requerido || valuesToPersist.has(field.id)) return false;
    if (editContext === 'university' && !field.editable_by_university) return false;
    if (editContext === 'admin' && !field.editable_by_admin) return false;
    return true;
  });

  if (requiredMissing.length > 0) {
    throw new AppError(
      `Faltan campos dinamicos obligatorios: ${requiredMissing
        .map((field) => field.etiqueta)
        .join(', ')}`,
      400
    );
  }

  await client.query(
    `DELETE FROM ${tableName}
     WHERE ${entityColumn} = $1
       AND NOT (field_id = ANY($2::uuid[]))`,
    [entityId, fieldIds]
  );

  for (const [fieldId, fieldValue] of valuesToPersist.entries()) {
    if (hasValueJsonColumn) {
      await client.query(
        `INSERT INTO ${tableName} (${entityColumn}, field_id, valor, value_json)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (${entityColumn}, field_id)
         DO UPDATE SET valor = EXCLUDED.valor, value_json = EXCLUDED.value_json, updated_at = NOW()`,
        [
          entityId,
          fieldId,
          fieldValue.value,
          fieldValue.valueJson === null || fieldValue.valueJson === undefined
            ? null
            : JSON.stringify(fieldValue.valueJson),
        ]
      );
    } else {
      await client.query(
        `INSERT INTO ${tableName} (${entityColumn}, field_id, valor)
         VALUES ($1, $2, $3)
         ON CONFLICT (${entityColumn}, field_id)
         DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW()`,
        [
          entityId,
          fieldId,
          Array.isArray(fieldValue.valueJson) ? fieldValue.valueJson.join(',') : fieldValue.value,
        ]
      );
    }
  }
};

export const getDynamicFieldSelect = (
  module: DynamicFieldModule,
  entityAlias: string,
  entityIdColumn?: string,
) => {
  const valuesTable =
    module === 'universidad'
      ? 'university_field_values'
      : module === 'programa'
        ? 'program_field_values'
        : 'beca_field_values';
  const valuesEntityColumn =
    module === 'universidad' ? 'universidad_id' : module === 'programa' ? 'programa_id' : 'beca_id';
  const effectiveEntityColumn = entityIdColumn || 'id';

  return `COALESCE((
    SELECT json_agg(
      json_build_object(
        'fieldId', ff.id,
        'nombreInterno', ff.nombre_interno,
        'etiqueta', ff.etiqueta,
        'tipo', ff.tipo,
        'value', COALESCE(to_jsonb(fv)->'value_json', to_jsonb(fv.valor)),
        'orden', ff.orden,
        'visibleInCard', COALESCE((to_jsonb(ff)->>'visible_in_card')::boolean, false),
        'visibleInDetail', COALESCE((to_jsonb(ff)->>'visible_in_detail')::boolean, true),
        'searchable', COALESCE((to_jsonb(ff)->>'searchable')::boolean, false),
        'filterable', COALESCE((to_jsonb(ff)->>'filterable')::boolean, false)
      )
      ORDER BY ff.orden ASC, ff.created_at ASC
    )
    FROM ${valuesTable} fv
    INNER JOIN form_fields ff ON ff.id = fv.field_id
    WHERE fv.${valuesEntityColumn} = ${entityAlias}.${effectiveEntityColumn}
  ), '[]'::json)`;
};

export const mapDynamicFields = (value: unknown): DynamicFieldValue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is QueryResultRow => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      fieldId: String(item.fieldId || item.field_id || ''),
      nombreInterno: String(item.nombreInterno || item.nombre_interno || ''),
      etiqueta: String(item.etiqueta || ''),
      tipo: String(item.tipo || 'text') as DynamicFieldValue['tipo'],
      value: item.value === null || item.value === undefined ? null : item.value,
      orden: Number(item.orden || 0),
      visibleInCard: Boolean(item.visibleInCard ?? item.visible_in_card ?? false),
      visibleInDetail: Boolean(item.visibleInDetail ?? item.visible_in_detail ?? true),
      searchable: Boolean(item.searchable ?? false),
      filterable: Boolean(item.filterable ?? false),
    }))
    .filter((item) => item.fieldId && item.nombreInterno && item.etiqueta);
};
