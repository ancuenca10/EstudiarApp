import { Router } from 'express';
import { searchController } from '../controllers/searchController';

const router = Router();

// Búsqueda avanzada
router.get('/advanced', searchController.advancedSearch);

// Búsqueda rápida
router.get('/quick', searchController.quickSearch);

// Obtener datos para filtros
router.get('/cities', searchController.getCities);
router.get('/filter-stats', searchController.getFilterStats);

export default router;