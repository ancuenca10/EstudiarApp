import { Router } from 'express';
import {
  createUniversity,
  deleteUniversity,
  getUniversities,
  getUniversityById,
  updateUniversity,
} from '../controllers/universityController';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import { ROLES } from '../constants/roles';
import { logStudentActivity, optionalStudentAuth } from '../middleware/studentActivity';

const router = Router();

router.get('/', getUniversities);

router.get(
  '/:id',
  optionalStudentAuth,
  logStudentActivity('view_university', (req) => req.params.id),
  getUniversityById
);

router.post(
  '/',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  createUniversity
);

router.put(
  '/:id',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  updateUniversity
);

router.delete(
  '/:id',
  verificarToken,
  authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteUniversity
);

export default router;
