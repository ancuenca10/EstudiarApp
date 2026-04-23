import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  createUniversity,
  updateUniversity,
  deleteUniversity,
  addProgram,
  updateProgram,
  deleteProgram
} from '../controllers/universityController';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de universidades
router.post('/universities', requireAdmin, createUniversity);
router.put('/universities/:id', requireAdmin, updateUniversity);
router.delete('/universities/:id', requireAdmin, deleteUniversity);

// Rutas de programas
router.post('/universities/:id/programs', requireAdmin, addProgram);
router.put('/universities/:id/programs/:programId', requireAdmin, updateProgram);
router.delete('/universities/:id/programs/:programId', requireAdmin, deleteProgram);

export default router;
