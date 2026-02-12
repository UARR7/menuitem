import { Router } from 'express';
import { menuItemController } from '../controllers/menuItem.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  toggleAvailabilitySchema,
  assignCategorySchema,
  menuItemFilterSchema,
  idParamSchema,
} from '../utils/validation';

const router = Router();

// GET /menu-items?category_id=1&availability=available&page=1&limit=20
router.get(
  '/',
  validate(menuItemFilterSchema, 'query'),
  menuItemController.getAll.bind(menuItemController)
);

// GET /menu-items/:id
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  menuItemController.getById.bind(menuItemController)
);

// POST /menu-items
router.post(
  '/',
  validate(createMenuItemSchema),
  menuItemController.create.bind(menuItemController)
);

// PATCH /menu-items/:id  (general update — name, description, price)
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateMenuItemSchema),
  menuItemController.update.bind(menuItemController)
);

// PATCH /menu-items/:id/availability  — dedicated toggle
router.patch(
  '/:id/availability',
  validate(idParamSchema, 'params'),
  validate(toggleAvailabilitySchema),
  menuItemController.toggleAvailability.bind(menuItemController)
);

// PATCH /menu-items/:id/category  — dedicated category (re)assignment
// { category_id: 3 }    → assign to category 3
// { category_id: null } → remove from category (uncategorized)
router.patch(
  '/:id/category',
  validate(idParamSchema, 'params'),
  validate(assignCategorySchema),
  menuItemController.assignCategory.bind(menuItemController)
);

// DELETE /menu-items/:id
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  menuItemController.delete.bind(menuItemController)
);

export default router;
