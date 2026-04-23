import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/db';
import {
  FIXED_ROLES,
  ROLES,
  SUPERADMIN_MANAGED_ROLES,
  type Role,
} from '../constants/roles';

type UserRow = {
  id: string;
  name: string;
  email: string;
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

const createUserWithRole = async (
  req: Request,
  res: Response,
  role: Role
) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'name, email y password son obligatorios',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'La contrasena debe tener al menos 8 caracteres',
    });
  }

  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email.toLowerCase()]
  );

  if (existingUser.rowCount) {
    return res.status(409).json({ error: 'El email ya existe' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email.toLowerCase(), passwordHash, role, req.user?.id]
  );

  return res.status(201).json({
    message: `${role} creado exitosamente`,
    user: publicUserFields(result.rows[0] as UserRow),
  });
};

const normalizeEmail = (email: unknown) => {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

const normalizeText = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : '';
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    return await createUserWithRole(req, res, ROLES.ADMIN);
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ error: 'Error al crear admin' });
  }
};

export const createAsesor = async (req: Request, res: Response) => {
  try {
    return await createUserWithRole(req, res, ROLES.ASESOR);
  } catch (error) {
    console.error('Error creating asesor:', error);
    return res.status(500).json({ error: 'Error al crear asesor' });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: Role };

    if (!role || !FIXED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    if (role === ROLES.SUPERADMIN) {
      return res.status(403).json({
        error: 'No se puede asignar SUPERADMIN desde este endpoint',
      });
    }

    if (!SUPERADMIN_MANAGED_ROLES.includes(role) && role !== ROLES.USER && role !== ROLES.UNIVERSITY) {
      return res.status(400).json({ error: 'Rol no permitido' });
    }

    const result = await query(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at, updated_at`,
      [role, id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Rol actualizado exitosamente',
      user: publicUserFields(result.rows[0] as UserRow),
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    return res.status(500).json({ error: 'Error al cambiar rol' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = normalizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role as Role | undefined;

    if (!name || !email) {
      return res.status(400).json({ error: 'name y email son obligatorios' });
    }

    if (role && (!FIXED_ROLES.includes(role) || role === ROLES.SUPERADMIN)) {
      return res.status(400).json({ error: 'Rol invalido' });
    }

    if (password && password.length < 8) {
      return res.status(400).json({
        error: 'La contrasena debe tener al menos 8 caracteres',
      });
    }

    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1 AND id <> $2 LIMIT 1',
      [email, id]
    );

    if (existingEmail.rowCount) {
      return res.status(409).json({ error: 'El email ya existe' });
    }

    const currentUser = await query('SELECT role FROM users WHERE id = $1 LIMIT 1', [id]);

    if (!currentUser.rowCount) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nextRole = role || (currentUser.rows[0].role as Role);

    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      const result = await query(
        `UPDATE users
         SET name = $1, email = $2, role = $3, password_hash = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, nextRole, passwordHash, id]
      );

      return res.json({
        message: 'Usuario actualizado exitosamente',
        user: publicUserFields(result.rows[0] as UserRow),
      });
    }

    const result = await query(
      `UPDATE users
       SET name = $1, email = $2, role = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, nextRole, id]
    );

    return res.json({
      message: 'Usuario actualizado exitosamente',
      user: publicUserFields(result.rows[0] as UserRow),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const result = await query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id, name, email, role, created_at, updated_at`,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Usuario eliminado exitosamente',
      user: publicUserFields(result.rows[0] as UserRow),
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

export const listUsers = async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    return res.json({
      users: result.rows.map((user) => publicUserFields(user as UserRow)),
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [req.user?.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ user: publicUserFields(result.rows[0] as UserRow) });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
