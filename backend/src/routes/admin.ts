import express from 'express';
import { createUniversity, deleteUniversity } from '../controllers/universityController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.post('/universities', requireAdmin, createUniversity);
router.delete('/universities/:id', requireAdmin, deleteUniversity);

export default router;
