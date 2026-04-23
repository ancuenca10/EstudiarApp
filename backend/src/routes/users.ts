import { Router } from 'express';
import {
  changeUserRole,
  createAdmin,
  createAsesor,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/userController';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();

router.use(verificarToken);

router.get('/', authorizeRoles(ROLES.SUPERADMIN), listUsers);
router.post('/admins', authorizeRoles(ROLES.SUPERADMIN), createAdmin);
router.post('/asesores', authorizeRoles(ROLES.SUPERADMIN), createAsesor);
router.patch('/:id', authorizeRoles(ROLES.SUPERADMIN), updateUser);
router.patch('/:id/role', authorizeRoles(ROLES.SUPERADMIN), changeUserRole);
router.delete('/:id', authorizeRoles(ROLES.SUPERADMIN), deleteUser);

export default router;
