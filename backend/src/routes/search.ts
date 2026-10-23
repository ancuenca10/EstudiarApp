import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { logStudentActivity, optionalStudentAuth } from '../middleware/studentActivity';

const router = Router();

const searchMetadata = (req: any) => ({
  q: req.query.q || req.query.searchTerm || '',
  ciudad: req.query.ciudad || req.query.city || '',
  modalidad: req.query.modalidad || req.query.modality || req.query.modalities || '',
  tipo: req.query.tipo || req.query.type || 'all',
});

router.get('/', optionalStudentAuth, logStudentActivity('search', undefined, searchMetadata), searchController.search);

// Búsqueda avanzada
router.get('/advanced', optionalStudentAuth, logStudentActivity('search', undefined, searchMetadata), searchController.advancedSearch);

// Búsqueda rápida
router.get('/quick', optionalStudentAuth, logStudentActivity('search', undefined, searchMetadata), searchController.quickSearch);

// Obtener datos para filtros
router.get('/cities', searchController.getCities);
router.get('/filter-stats', searchController.getFilterStats);

export default router;
