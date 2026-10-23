import { NextFunction, Request, Response } from 'express';
import { query } from '../config/db';
import { AppError } from './errorHandler';
import {
  comparePlans,
  getUpgradeMessage,
  getUserPlanLimits,
  type StudentFeature,
  type StudentPlan,
} from '../services/studentService';

export const checkPlanAccess = (feature: StudentFeature) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const result = await query('SELECT plan FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
      if (!result.rowCount) {
        throw new AppError('Usuario no encontrado', 404);
      }

      const limits = getUserPlanLimits(result.rows[0].plan);

      if (feature === 'advisor_access' && !limits.advisorAccess) {
        throw new AppError('Mejora a plan BASIC para acceder a asesorias', 402);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requirePlan = (requiredPlan: StudentPlan) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const result = await query('SELECT plan FROM users WHERE id = $1 LIMIT 1', [req.user.id]);
      if (!result.rowCount) {
        throw new AppError('Usuario no encontrado', 404);
      }

      const userPlan = result.rows[0].plan as string;
      if (comparePlans(userPlan, requiredPlan) < 0) {
        throw new AppError(
          requiredPlan === 'plus'
            ? getUpgradeMessage({ plan: userPlan }, 'plus_insights')
            : getUpgradeMessage({ plan: userPlan }, 'activity_history'),
          402,
          {
            code: 'PLAN_UPGRADE_REQUIRED',
            currentPlan: userPlan,
            requiredPlan,
            recommendedPlan: requiredPlan,
          }
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export { comparePlans };
