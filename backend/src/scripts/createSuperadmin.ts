import bcrypt from 'bcrypt';
import { pool, query } from '../config/db';

const normalizeEmail = (email?: string) => email?.trim().toLowerCase() || '';

const main = async () => {
  const name = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin';
  const email = normalizeEmail(process.env.SUPERADMIN_EMAIL);
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Debes definir SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD antes de ejecutar el script'
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('SUPERADMIN_EMAIL no tiene un formato valido');
  }

  if (password.length < 8) {
    throw new Error('SUPERADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'SUPERADMIN')
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = 'SUPERADMIN',
       updated_at = NOW()
     RETURNING id, name, email, role`,
    [name, email, passwordHash]
  );

  const user = result.rows[0];

  console.log('SUPERADMIN listo:');
  console.log(`id: ${user.id}`);
  console.log(`name: ${user.name}`);
  console.log(`email: ${user.email}`);
  console.log(`role: ${user.role}`);
};

main()
  .catch((error) => {
    const aggregateErrors = (error as { errors?: unknown[] })?.errors;

    if (Array.isArray(aggregateErrors)) {
      console.error('No se pudo conectar a PostgreSQL.');
      console.error('Verifica que PostgreSQL este iniciado y que DATABASE_URL apunte al host/puerto correctos.');
      aggregateErrors.forEach((item: unknown, index: number) => {
        const message = item instanceof Error ? item.message : String(item);
        console.error(`Error ${index + 1}: ${message}`);
      });
    } else {
      console.error(error instanceof Error ? error.message : error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
