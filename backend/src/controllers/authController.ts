import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '../config/db';
import { env, getJwtSecret } from '../config/env';
import { ROLES, type Role } from '../constants/roles';
import { AppError } from '../middleware/errorHandler';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  tipo_usuario?: string | null;
  plan?: 'free' | 'basic' | 'plus';
  estado_suscripcion?: string;
  fecha_inicio_plan?: Date | null;
  fecha_fin_plan?: Date | null;
  preferencias_completadas?: boolean;
  created_at: Date;
  updated_at: Date;
};

const publicUserFields = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  tipoUsuario: user.tipo_usuario,
  plan: user.plan,
  estadoSuscripcion: user.estado_suscripcion,
  fechaInicioPlan: user.fecha_inicio_plan,
  fechaFinPlan: user.fecha_fin_plan,
  preferenciasCompletadas: user.preferencias_completadas,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const normalizeEmail = (email: unknown) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const signToken = (user: Pick<UserRow, 'id' | 'role'>) => {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(
    { id: user.id, role: user.role },
    getJwtSecret(),
    options
  );
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, username, email, password } = req.body;
    const displayName = normalizeText(name || username);
    const normalizedEmail = normalizeEmail(email);

    if (!displayName || !normalizedEmail || !password) {
      throw new AppError('name, email y password son obligatorios', 400);
    }

    if (!isValidEmail(normalizedEmail)) {
      throw new AppError('El email no tiene un formato valido', 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('La contrasena debe tener al menos 6 caracteres', 400);
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    if (existingUser.rowCount) {
      throw new AppError('El email ya existe', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, password_hash, role, created_at, updated_at`,
      [displayName, normalizedEmail, passwordHash, ROLES.USER]
    );

    const user = result.rows[0] as UserRow;
    const token = signToken(user);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: publicUserFields(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const registerStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, username, email, password } = req.body;
    const displayName = normalizeText(name || username);
    const normalizedEmail = normalizeEmail(email);

    if (!displayName || !normalizedEmail || !password) {
      throw new AppError('name, email y password son obligatorios', 400);
    }

    if (!isValidEmail(normalizedEmail)) {
      throw new AppError('El email no tiene un formato valido', 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('La contrasena debe tener al menos 6 caracteres', 400);
    }

    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );

    if (existingUser.rowCount) {
      throw new AppError('El email ya existe', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `WITH new_user AS (
         INSERT INTO users (
           name, email, password_hash, role, tipo_usuario, plan,
           estado_suscripcion, preferencias_completadas
         )
         VALUES ($1, $2, $3, $4, 'student', 'free', 'inactive', FALSE)
         RETURNING
           id, name, email, password_hash, role, tipo_usuario, plan,
           estado_suscripcion, fecha_inicio_plan, fecha_fin_plan,
           preferencias_completadas, created_at, updated_at
       )
       INSERT INTO student_profiles (user_id)
       SELECT id FROM new_user
       RETURNING
         (SELECT id FROM new_user) AS id,
         (SELECT name FROM new_user) AS name,
         (SELECT email FROM new_user) AS email,
         (SELECT password_hash FROM new_user) AS password_hash,
         (SELECT role FROM new_user) AS role,
         (SELECT tipo_usuario FROM new_user) AS tipo_usuario,
         (SELECT plan FROM new_user) AS plan,
         (SELECT estado_suscripcion FROM new_user) AS estado_suscripcion,
         (SELECT fecha_inicio_plan FROM new_user) AS fecha_inicio_plan,
         (SELECT fecha_fin_plan FROM new_user) AS fecha_fin_plan,
         (SELECT preferencias_completadas FROM new_user) AS preferencias_completadas,
         (SELECT created_at FROM new_user) AS created_at,
         (SELECT updated_at FROM new_user) AS updated_at`,
      [displayName, normalizedEmail, passwordHash, ROLES.STUDENT]
    );

    const user = result.rows[0] as UserRow;
    const token = signToken(user);

    return res.status(201).json({
      message: 'Estudiante registrado exitosamente',
      token,
      user: publicUserFields(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw new AppError('email y password son obligatorios', 400);
    }

    if (!isValidEmail(normalizedEmail)) {
      throw new AppError('El email no tiene un formato valido', 400);
    }

    if (typeof password !== 'string') {
      throw new AppError('password debe ser texto', 400);
    }

    const result = await query(
      `SELECT
         id, name, email, password_hash, role, tipo_usuario, plan,
         estado_suscripcion, fecha_inicio_plan, fecha_fin_plan,
         preferencias_completadas, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!result.rowCount) {
      throw new AppError('Credenciales invalidas', 401);
    }

    const user = result.rows[0] as UserRow;
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new AppError('Credenciales invalidas', 401);
    }

    const token = signToken(user);

    return res.json({
      token,
      user: publicUserFields(user),
    });
  } catch (error) {
    return next(error);
  }
};
