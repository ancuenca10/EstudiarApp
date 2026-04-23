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
  created_at: Date;
  updated_at: Date;
};

const publicUserFields = (user: UserRow) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
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
      `SELECT id, name, email, password_hash, role, created_at, updated_at
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
