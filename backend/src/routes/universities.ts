import { Router } from 'express';
import { 
  getUniversities,
  getUniversityById,
  createUniversity, 
  updateUniversity, 
  deleteUniversity, 
  addProgram, 
  updateProgram, 
  deleteProgram 
} from '../controllers/universityController';

const router = Router();

// Rutas para universidades
router.get('/', getUniversities);                    // Obtener todas las universidades
router.get('/:id', getUniversityById);              // Obtener universidad por ID
router.post('/', createUniversity);                 // Crear nueva universidad
router.put('/:id', updateUniversity);               // Actualizar universidad
router.delete('/:id', deleteUniversity);            // Eliminar universidad

// Rutas para programas dentro de universidades
router.post('/:id/programs', addProgram);           // Agregar programa a universidad
router.put('/:id/programs/:programId', updateProgram); // Actualizar programa
router.delete('/:id/programs/:programId', deleteProgram); // Eliminar programa

export default router;