import { Router } from 'express';
import {
  createMyProgram,
  deleteMyProgram,
  getMyPrograms,
  getMyUniversity,
  updateMyProgram,
} from '../controllers/universityPanelController';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';

const router = Router();

router.use(verificarToken);
router.use(authorizeRoles(ROLES.UNIVERSITY));

router.get('/me', getMyUniversity);
router.get('/programas', getMyPrograms);
router.post('/programas', createMyProgram);
router.put('/programas/:id', updateMyProgram);
router.delete('/programas/:id', deleteMyProgram);

export default router;
