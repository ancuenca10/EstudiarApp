export const ROLES = {
  USER: 'USER',
  UNIVERSITY: 'UNIVERSITY',
  ASESOR: 'ASESOR',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const FIXED_ROLES = Object.values(ROLES);

export const SUPERADMIN_MANAGED_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.ASESOR,
];
