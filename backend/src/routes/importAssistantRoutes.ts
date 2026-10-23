import { Router } from 'express';
import {
  analyzeImportAssistantProgram,
  analyzeImportAssistantUniversity,
  analyzeImportAssistantUrl,
  saveImportAssistantProposals,
} from '../controllers/importAssistantController';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';

const router = Router();

router.post(
  '/analyze-university',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  analyzeImportAssistantUniversity
);

router.post(
  '/analyze-program',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  analyzeImportAssistantProgram
);

router.post(
  '/analyze',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  analyzeImportAssistantUrl
);

router.post(
  '/analyze-url',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  analyzeImportAssistantUrl
);

router.post(
  '/save',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  saveImportAssistantProposals
);

export default router;
