import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  idParamSchema,
} from '../utils/validation';

const router = Router();

// GET /categories
router.get('/', categoryController.getAll.bind(categoryController));

// GET /categories/:id
router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  categoryController.getById.bind(categoryController)
);

// GET /categories/:id/items — list items under a category
router.get(
  '/:id/items',
  validate(idParamSchema, 'params'),
  categoryController.getItems.bind(categoryController)
);

// POST /categories
router.post(
  '/',
  validate(createCategorySchema),
  categoryController.create.bind(categoryController)
);

// PATCH /categories/:id
router.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.update.bind(categoryController)
);

// DELETE /categories/:id
// ?force=true → unassign linked items and delete
router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  categoryController.delete.bind(categoryController)
);

export default router;
