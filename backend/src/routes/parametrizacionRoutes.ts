import { Router } from 'express';
import { ROLES } from '../constants/roles';
import { authorizeRoles, verificarToken } from '../middleware/auth';
import {
  createField,
  deleteField,
  listFields,
  toggleField,
  updateField,
  updateFieldOrder,
} from '../controllers/parametrizacionController';

const router = Router();

router.use(verificarToken);

router.get(
  '/fields',
  authorizeRoles(ROLES.UNIVERSITY, ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  listFields
);

router.post(
  '/fields',
  authorizeRoles(ROLES.SUPERADMIN),
  createField
);

router.patch(
  '/fields/reorder',
  authorizeRoles(ROLES.SUPERADMIN),
  async (req, res, next) => {
    try {
      const { orders } = req.body;
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ success: false, message: 'orders es requerido' });
      }

      for (const item of orders) {
        if (!item.id || typeof item.orden !== 'number') {
          return res.status(400).json({ success: false, message: 'Cada orden debe tener id y orden' });
        }
        await updateFieldOrderInternal(item.id, item.orden);
      }

      return res.json({ success: true, message: 'Campos reordenados' });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  '/:modulo',
  authorizeRoles(ROLES.UNIVERSITY, ROLES.ASESOR, ROLES.ADMIN, ROLES.SUPERADMIN),
  listFields
);

router.post(
  '/:modulo',
  authorizeRoles(ROLES.SUPERADMIN),
  createField
);

router.put(
  '/:id',
  authorizeRoles(ROLES.SUPERADMIN),
  updateField
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPERADMIN),
  deleteField
);

router.patch(
  '/:id/toggle',
  authorizeRoles(ROLES.SUPERADMIN),
  toggleField
);

router.patch(
  '/:id/order',
  authorizeRoles(ROLES.SUPERADMIN),
  updateFieldOrder
);

async function updateFieldOrderInternal(fieldId: string, orden: number) {
  const { query } = await import('../config/db');
  await query(
    'UPDATE form_fields SET orden = $2, updated_at = NOW() WHERE id = $1',
    [fieldId, orden]
  );
}

export default router;
