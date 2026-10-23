import { Router } from 'express';
import {
  approveProgram,
  changeProgramStatus,
  createProgram,
  deleteProgram,
  getAllProgramsForAdmin,
  getApprovedProgramById,
  getApprovedPrograms,
  getProgramModerationHistory,
  updateProgram,
} from '../controllers/programController';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { logStudentActivity, optionalStudentAuth } from '../middleware/studentActivity';

const router = Router();

router.get(
  '/admin/todos',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  getAllProgramsForAdmin
);

router.get('/', getApprovedPrograms);

router.get(
  '/:id',
  optionalStudentAuth,
  logStudentActivity('view_program', (req) => req.params.id),
  getApprovedProgramById
);

router.post(
  '/',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  createProgram
);

router.patch(
  '/:id/status',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  changeProgramStatus
);

router.put(
  '/:id/aprobar',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  approveProgram
);

router.get(
  '/:id/moderation-history',
  verificarToken,
  authorizeRoles(ROLES.UNIVERSITY, ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  getProgramModerationHistory
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
  authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteProgram
);

export default router;
