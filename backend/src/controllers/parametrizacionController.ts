import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from '../middleware/errorHandler';

type FormFieldRow = {
  id: string;
  modulo: 'universidad' | 'programa' | 'beca';
  nombre_interno: string;
  etiqueta: string;
  tipo: FieldType;
  requerido: boolean;
  activo: boolean;
  orden: number;
  placeholder: string | null;
  opciones: unknown;
  ayuda: string | null;
  validation_rules: unknown;
  default_value: string | null;
  visible_in_card: boolean;
  visible_in_detail: boolean;
  searchable: boolean;
  filterable: boolean;
  editable_by_university: boolean;
  editable_by_admin: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date | null;
};

export type FieldModule = 'universidad' | 'programa' | 'beca';
export type FieldType = 
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

const VALID_MODULES: FieldModule[] = ['universidad', 'programa', 'beca'];
const VALID_TYPES: FieldType[] = [
  'text', 'textarea', 'number', 'select', 'multi_select', 
  'checkbox', 'date', 'url', 'email', 'phone', 'currency', 'percentage'
];

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeModule = (value: unknown): FieldModule | null => {
  const text = normalizeText(value).toLowerCase();
  if (text === 'universidades' || text === 'universidad') return 'universidad';
  if (text === 'programas' || text === 'programa') return 'programa';
  if (text === 'becas' || text === 'beca') return 'beca';
  return null;
};

const normalizeInternalName = (value: unknown) => {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
};

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
};

const normalizeOptions = (value: unknown, tipo: string) => {
  if (tipo !== 'select' && tipo !== 'multi_select') return null;

  if (Array.isArray(value)) {
    // Soportar tanto array de strings como array de objetos {label, value}
    return value.map((item) => {
      if (typeof item === 'string') {
        return { label: item.trim(), value: item.trim().toLowerCase().replace(/\s+/g, '_') };
      }
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const label = String(obj.label || '').trim();
        const optionValue = String(obj.value || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_:-]/g, '');
        return { label, value: optionValue };
      }
      return null;
    }).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => {
      const trimmed = item.trim();
      return { label: trimmed, value: trimmed.toLowerCase().replace(/\s+/g, '_') };
    }).filter(Boolean);
  }

  return [];
};

const normalizeValidationRules = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
};

const mapField = (field: FormFieldRow) => ({
  id: field.id,
  modulo: field.modulo,
  nombreInterno: field.nombre_interno,
  nombre_interno: field.nombre_interno,
  etiqueta: field.etiqueta,
  tipo: field.tipo,
  requerido: field.requerido,
  activo: field.activo,
  orden: field.orden,
  placeholder: field.placeholder,
  opciones: field.opciones,
  ayuda: field.ayuda,
  validationRules: field.validation_rules,
  defaultValue: field.default_value,
  visibleInCard: field.visible_in_card,
  visibleInDetail: field.visible_in_detail,
  searchable: field.searchable,
  filterable: field.filterable,
  editableByUniversity: field.editable_by_university,
  editableByAdmin: field.editable_by_admin,
  createdBy: field.created_by,
  updatedBy: field.updated_by,
  createdAt: field.created_at,
  updatedAt: field.updated_at,
});

const validateType = (value: unknown) => {
  const tipo = normalizeText(value).toLowerCase();
  if (!VALID_TYPES.includes(tipo as (typeof VALID_TYPES)[number])) {
    throw new AppError('tipo no es valido', 400);
  }
  return tipo as FieldType;
};

const validateModule = (value: unknown) => {
  const modulo = normalizeModule(value);
  if (!modulo || !VALID_MODULES.includes(modulo)) {
    throw new AppError('modulo debe ser universidad, programa o beca', 400);
  }
  return modulo;
};

const getRequestModule = (req: Request) => validateModule(req.params.modulo || req.query.module || req.body.modulo);

const validateOptionsPayload = (opciones: ReturnType<typeof normalizeOptions>, tipo: FieldType) => {
  if (tipo !== 'select' && tipo !== 'multi_select') return null;
  if (!Array.isArray(opciones) || opciones.length === 0) {
    throw new AppError('opciones es obligatorio para campos select/multi_select', 400);
  }

  const cleanedOptions = opciones.filter(
    (option): option is { label: string; value: string } =>
      Boolean(option && option.label && option.value)
  );

  if (cleanedOptions.length !== opciones.length || cleanedOptions.length === 0) {
    throw new AppError('Cada opcion debe tener label y value', 400);
  }

  const values = new Set(cleanedOptions.map((option) => option.value));
  if (values.size !== cleanedOptions.length) {
    throw new AppError('Las opciones no pueden tener valores duplicados', 400);
  }

  return cleanedOptions;
};

const validateValidationRulesPayload = (rules: Record<string, unknown> | null) => {
  if (!rules) return null;

  for (const key of ['minLength', 'maxLength', 'min', 'max']) {
    if (rules[key] !== undefined && typeof rules[key] !== 'number') {
      throw new AppError(`${key} debe ser numerico`, 400);
    }
  }

  if (typeof rules.pattern === 'string' && rules.pattern) {
    try {
      new RegExp(rules.pattern);
    } catch {
      throw new AppError('pattern debe ser una expresion regular valida', 400);
    }
  }

  return rules;
};

export const listFields = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modulo = getRequestModule(req);
    const result = await query(
      `SELECT *
       FROM form_fields
       WHERE modulo = $1
       ORDER BY orden ASC, created_at ASC`,
      [modulo]
    );

    const fields = result.rows.map((row) => mapField(row as FormFieldRow));

    return res.json({
      success: true,
      data: fields,
      fields,
    });
  } catch (error) {
    return next(error);
  }
};

export const createField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modulo = getRequestModule(req);
    const etiqueta = normalizeText(req.body.etiqueta);
    const nombreInterno = normalizeInternalName(req.body.nombreInterno || req.body.nombre_interno);
    const tipo = validateType(req.body.tipo);
    const requerido = normalizeBoolean(req.body.requerido, false);
    const activo = normalizeBoolean(req.body.activo, true);
    const orden = Number.isInteger(Number(req.body.orden)) ? Number(req.body.orden) : 0;
    const placeholder = normalizeText(req.body.placeholder) || null;
    const ayuda = normalizeText(req.body.ayuda) || null;
    const opciones = validateOptionsPayload(normalizeOptions(req.body.opciones, tipo), tipo);
    const validationRules = validateValidationRulesPayload(
      normalizeValidationRules(req.body.validationRules || req.body.validation_rules)
    );
    const defaultValue = normalizeText(req.body.defaultValue) || null;
    const visibleInCard = normalizeBoolean(req.body.visibleInCard, false);
    const visibleInDetail = normalizeBoolean(req.body.visibleInDetail, true);
    const searchable = normalizeBoolean(req.body.searchable, false);
    const filterable = normalizeBoolean(req.body.filterable, false);
    const editableByUniversity = normalizeBoolean(req.body.editableByUniversity, true);
    const editableByAdmin = normalizeBoolean(req.body.editableByAdmin, true);

    if (!etiqueta) throw new AppError('etiqueta es obligatoria', 400);
    if (!nombreInterno) throw new AppError('nombre_interno es obligatorio', 400);
    // Validar que el nombre interno sea único por módulo
    const existing = await query(
      'SELECT id FROM form_fields WHERE modulo = $1 AND nombre_interno = $2',
      [modulo, nombreInterno]
    );
    if ((existing.rowCount ?? 0) > 0) {
      throw new AppError(`Ya existe un campo con nombre interno "${nombreInterno}" en el módulo ${modulo}`, 400);
    }

    const result = await query(
      `INSERT INTO form_fields (
         modulo, nombre_interno, etiqueta, tipo, requerido, activo, orden, 
         placeholder, opciones, ayuda, validation_rules, default_value,
         visible_in_card, visible_in_detail, searchable, filterable,
         editable_by_university, editable_by_admin, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::jsonb, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        modulo,
        nombreInterno,
        etiqueta,
        tipo,
        requerido,
        activo,
        orden,
        placeholder,
        opciones ? JSON.stringify(opciones) : null,
        ayuda,
        validationRules ? JSON.stringify(validationRules) : null,
        defaultValue,
        visibleInCard,
        visibleInDetail,
        searchable,
        filterable,
        editableByUniversity,
        editableByAdmin,
        req.user?.id || null,
      ]
    );

    const field = mapField(result.rows[0] as FormFieldRow);

    return res.status(201).json({
      success: true,
      message: 'Campo creado',
      data: field,
      field,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await query('SELECT * FROM form_fields WHERE id = $1', [req.params.id]);
    if (current.rowCount === 0) throw new AppError('Campo no encontrado', 404);

    const currentField = current.rows[0] as FormFieldRow;
    const tipo = req.body.tipo !== undefined ? validateType(req.body.tipo) : currentField.tipo;
    const etiqueta = req.body.etiqueta !== undefined ? normalizeText(req.body.etiqueta) : currentField.etiqueta;
    const nombreInterno = req.body.nombreInterno !== undefined || req.body.nombre_interno !== undefined
      ? normalizeInternalName(req.body.nombreInterno || req.body.nombre_interno)
      : currentField.nombre_interno;
    const requerido = req.body.requerido !== undefined
      ? normalizeBoolean(req.body.requerido, currentField.requerido)
      : currentField.requerido;
    const activo = req.body.activo !== undefined
      ? normalizeBoolean(req.body.activo, currentField.activo)
      : currentField.activo;
    const orden = req.body.orden !== undefined && Number.isInteger(Number(req.body.orden))
      ? Number(req.body.orden)
      : currentField.orden;
    const placeholder = req.body.placeholder !== undefined
      ? normalizeText(req.body.placeholder) || null
      : currentField.placeholder;
    const ayuda = req.body.ayuda !== undefined
      ? normalizeText(req.body.ayuda) || null
      : currentField.ayuda;
    const opciones = req.body.opciones !== undefined
      ? validateOptionsPayload(normalizeOptions(req.body.opciones, tipo), tipo)
      : currentField.opciones;
    const validationRules = req.body.validationRules !== undefined
      ? validateValidationRulesPayload(normalizeValidationRules(req.body.validationRules))
      : currentField.validation_rules;
    const defaultValue = req.body.defaultValue !== undefined
      ? normalizeText(req.body.defaultValue) || null
      : currentField.default_value;
    const visibleInCard = req.body.visibleInCard !== undefined
      ? normalizeBoolean(req.body.visibleInCard, currentField.visible_in_card)
      : currentField.visible_in_card;
    const visibleInDetail = req.body.visibleInDetail !== undefined
      ? normalizeBoolean(req.body.visibleInDetail, currentField.visible_in_detail)
      : currentField.visible_in_detail;
    const searchable = req.body.searchable !== undefined
      ? normalizeBoolean(req.body.searchable, currentField.searchable)
      : currentField.searchable;
    const filterable = req.body.filterable !== undefined
      ? normalizeBoolean(req.body.filterable, currentField.filterable)
      : currentField.filterable;
    const editableByUniversity = req.body.editableByUniversity !== undefined
      ? normalizeBoolean(req.body.editableByUniversity, currentField.editable_by_university)
      : currentField.editable_by_university;
    const editableByAdmin = req.body.editableByAdmin !== undefined
      ? normalizeBoolean(req.body.editableByAdmin, currentField.editable_by_admin)
      : currentField.editable_by_admin;

    if (!etiqueta) throw new AppError('etiqueta es obligatoria', 400);
    if (!nombreInterno) throw new AppError('nombre_interno es obligatorio', 400);
    // Validar que el nombre interno sea único por módulo (excluyendo el registro actual)
    const existing = await query(
      'SELECT id FROM form_fields WHERE modulo = $1 AND nombre_interno = $2 AND id != $3',
      [currentField.modulo, nombreInterno, req.params.id]
    );
    if ((existing.rowCount ?? 0) > 0) {
      throw new AppError(`Ya existe un campo con nombre interno "${nombreInterno}" en el módulo ${currentField.modulo}`, 400);
    }

    const result = await query(
      `UPDATE form_fields
       SET
         nombre_interno = $2,
         etiqueta = $3,
         tipo = $4,
         requerido = $5,
         activo = $6,
         orden = $7,
         placeholder = $8,
         opciones = $9::jsonb,
         ayuda = $10,
         validation_rules = $11::jsonb,
         default_value = $12,
         visible_in_card = $13,
         visible_in_detail = $14,
         searchable = $15,
         filterable = $16,
         editable_by_university = $17,
         editable_by_admin = $18,
         updated_by = $19,
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        nombreInterno,
        etiqueta,
        tipo,
        requerido,
        activo,
        orden,
        placeholder,
        opciones ? JSON.stringify(opciones) : null,
        ayuda,
        validationRules ? JSON.stringify(validationRules) : null,
        defaultValue,
        visibleInCard,
        visibleInDetail,
        searchable,
        filterable,
        editableByUniversity,
        editableByAdmin,
        req.user?.id || null,
      ]
    );

    const field = mapField(result.rows[0] as FormFieldRow);

    return res.json({
      success: true,
      message: 'Campo actualizado',
      data: field,
      field,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar si hay valores asociados al campo
    const fieldId = req.params.id;
    
    const universityValues = await query(
      'SELECT COUNT(*) as count FROM university_field_values WHERE field_id = $1',
      [fieldId]
    );
    const programValues = await query(
      'SELECT COUNT(*) as count FROM program_field_values WHERE field_id = $1',
      [fieldId]
    );
    let becaValuesCount = 0;
    try {
      const becaValues = await query(
        'SELECT COUNT(*) as count FROM beca_field_values WHERE field_id = $1',
        [fieldId]
      );
      becaValuesCount = parseInt(becaValues.rows[0]?.count || '0', 10);
    } catch {
      becaValuesCount = 0;
    }
    
    const totalValues = 
      parseInt(universityValues.rows[0]?.count || '0', 10) + 
      parseInt(programValues.rows[0]?.count || '0', 10) +
      becaValuesCount;
    
    if (totalValues > 0) {
      // Soft-delete: desactivar en lugar de eliminar
      const result = await query(
        `UPDATE form_fields
         SET activo = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [fieldId]
      );
      
      if (result.rowCount === 0) throw new AppError('Campo no encontrado', 404);
      
      const field = mapField(result.rows[0] as FormFieldRow);
      
      return res.json({
        success: true,
        message: 'Campo desactivado (tiene valores asociados)',
        data: field,
        field,
        softDeleted: true,
      });
    }
    
    // Hard-delete solo si no hay valores asociados
    const result = await query('DELETE FROM form_fields WHERE id = $1 RETURNING id', [fieldId]);
    if (result.rowCount === 0) throw new AppError('Campo no encontrado', 404);

    return res.json({
      success: true,
      message: 'Campo eliminado',
    });
  } catch (error) {
    return next(error);
  }
};

export const toggleField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `UPDATE form_fields
       SET activo = NOT activo, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rowCount === 0) throw new AppError('Campo no encontrado', 404);

    const field = mapField(result.rows[0] as FormFieldRow);

    return res.json({
      success: true,
      message: field.activo ? 'Campo activado' : 'Campo desactivado',
      data: field,
      field,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateFieldOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orden = Number(req.body.orden);
    if (!Number.isInteger(orden)) {
      throw new AppError('orden debe ser un numero entero', 400);
    }

    const result = await query(
      `UPDATE form_fields
       SET orden = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, orden]
    );

    if (result.rowCount === 0) throw new AppError('Campo no encontrado', 404);

    const field = mapField(result.rows[0] as FormFieldRow);

    return res.json({
      success: true,
      message: 'Orden actualizado',
      data: field,
      field,
    });
  } catch (error) {
    return next(error);
  }
};
