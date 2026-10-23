import { Router } from 'express';
import {
  changeAdminBecaStatus,
  createAdminBeca,
  createMyBeca,
  deleteAdminBeca,
  deleteMyBeca,
  getAdminBecas,
  getBecaModerationHistory,
  getMyBecas,
  getPublicBecaById,
  getPublicBecas,
  updateAdminBeca,
  updateMyBeca,
} from '../controllers/becaController';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';

const router = Router();

router.get('/admin/all', verificarToken, authorizeRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR), getAdminBecas);
router.post('/admin', verificarToken, authorizeRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR), createAdminBeca);
router.put('/admin/:id', verificarToken, authorizeRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR), updateAdminBeca);
router.patch('/admin/:id/status', verificarToken, authorizeRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR), changeAdminBecaStatus);
router.delete('/admin/:id', verificarToken, authorizeRoles(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.ASESOR), deleteAdminBeca);

router.get('/university/mis-becas', verificarToken, authorizeRoles(ROLES.UNIVERSITY), getMyBecas);
router.post('/university', verificarToken, authorizeRoles(ROLES.UNIVERSITY), createMyBeca);
router.put('/university/:id', verificarToken, authorizeRoles(ROLES.UNIVERSITY), updateMyBeca);
router.delete('/university/:id', verificarToken, authorizeRoles(ROLES.UNIVERSITY), deleteMyBeca);

router.get(
  '/:id/moderation-history',
  verificarToken,
  authorizeRoles(ROLES.UNIVERSITY, ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  getBecaModerationHistory
);

router.get('/', getPublicBecas);
router.get('/:id', getPublicBecaById);

export default router;
