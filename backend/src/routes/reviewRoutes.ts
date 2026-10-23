import { Router } from 'express';
import {
  changeReviewStatus,
  createReview,
  deleteReview,
  getHomeReviews,
  getReviews,
  updateReview,
} from '../controllers/reviewController';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';

const router = Router();

router.get('/home', getHomeReviews);

router.get('/', verificarToken, getReviews);
router.post('/', verificarToken, authorizeRoles(ROLES.USER, ROLES.ADMIN, ROLES.SUPERADMIN), createReview);
router.put('/:id', verificarToken, updateReview);
router.delete('/:id', verificarToken, deleteReview);
router.patch(
  '/:id/status',
  verificarToken,
  authorizeRoles(ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  changeReviewStatus
);

export default router;
