import { Router } from 'express';
import { getPublicStats } from '../controllers/publicStatsController';

const router = Router();

router.get('/stats', getPublicStats);

export default router;
