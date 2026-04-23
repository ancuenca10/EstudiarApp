import express from 'express';
import { register, login } from '../controllers/authController';
import { getProfile } from '../controllers/userController';
import { verificarToken } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verificarToken, getProfile);

export default router;
