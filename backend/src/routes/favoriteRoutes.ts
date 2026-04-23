import { Router } from 'express';
import {
  createFavorite,
  deleteFavorite,
  getFavorites,
} from '../controllers/favoriteController';
import { verificarToken } from '../middleware/auth';

const router = Router();

router.use(verificarToken);

router.post('/', createFavorite);
router.get('/', getFavorites);
router.delete('/:id', deleteFavorite);

export default router;
