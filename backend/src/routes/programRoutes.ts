import { Router } from 'express';
import {
  approveProgram,
  createProgram,
  deleteProgram,
  getAllProgramsForAdmin,
  getApprovedPrograms,
  updateProgram,
} from '../controllers/programController';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();

router.get(
  '/admin/todos',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  getAllProgramsForAdmin
);

router.get('/', getApprovedPrograms);

router.post(
  '/',
  verificarToken,
  authorizeRoles(ROLES.UNIVERSITY, ROLES.SUPERADMIN),
  createProgram
);

router.put(
  '/:id/aprobar',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  approveProgram
);

router.put(
  '/:id',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  updateProgram
);

router.delete(
  '/:id',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteProgram
);

export default router;
