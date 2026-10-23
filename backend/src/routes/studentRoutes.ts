import express from 'express';
import {
  createStudentComparison,
  createStudentActivity,
  createStudentFavorite,
  deleteStudentComparison,
  deleteStudentFavorite,
  getStudentAlerts,
  getStudentComparisons,
  getStudentFavorites,
  getStudentInsights,
  getStudentPlan,
  getStudentProfile,
  getStudentRecommendations,
  updateStudentProfile,
  upgradeStudentPlan,
} from '../controllers/studentController';
import {
  addApplicationRequirement,
  createStudentApplication,
  getApplicationTimeline,
  getStudentApplicationDetail,
  getStudentApplications,
  updateApplicationRequirement,
  updateStudentApplicationStatus,
} from '../controllers/studentApplicationController';
import { verificarToken } from '../middleware/auth';
import { requirePlan } from '../middleware/planAccess';

const router = express.Router();

router.use(verificarToken);

router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.get('/preferences', getStudentProfile);
router.put('/preferences', updateStudentProfile);

router.get('/favorites', getStudentFavorites);
router.post('/favorites', createStudentFavorite);
router.delete('/favorites/:id', deleteStudentFavorite);

router.get('/comparisons', getStudentComparisons);
router.post('/comparisons', createStudentComparison);
router.delete('/comparisons/:id', deleteStudentComparison);

router.get('/recommendations', getStudentRecommendations);
router.get('/alerts', getStudentAlerts);
router.get('/insights', getStudentInsights);
router.post('/activity', createStudentActivity);

router.get('/plan', getStudentPlan);
router.post('/upgrade-plan', upgradeStudentPlan);

router.get('/applications', requirePlan('plus'), getStudentApplications);
router.post('/applications', requirePlan('plus'), createStudentApplication);
router.get('/applications/:id', requirePlan('plus'), getStudentApplicationDetail);
router.put('/applications/:id/status', requirePlan('plus'), updateStudentApplicationStatus);
router.post('/applications/:id/requirements', requirePlan('plus'), addApplicationRequirement);
router.put('/applications/:id/requirements/:reqId', requirePlan('plus'), updateApplicationRequirement);
router.get('/applications/:id/timeline', requirePlan('plus'), getApplicationTimeline);

export default router;
