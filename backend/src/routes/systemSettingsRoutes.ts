import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import { getOpenAiSettings, updateOpenAiSettings } from '../controllers/systemSettingsController';

const router = Router();

router.use(verificarToken, authorizeRoles(ROLES.SUPERADMIN));

router.get('/openai', getOpenAiSettings);
router.put('/openai', updateOpenAiSettings);

export default router;
