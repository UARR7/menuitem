import Joi from 'joi';
import { AvailabilityStatus } from '../types';

// ─── Categories ───────────────────────────────

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  display_order: Joi.number().integer().min(0).max(9999).optional(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  display_order: Joi.number().integer().min(0).max(9999).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);  // at least one field required

// ─── Menu Items ───────────────────────────────

export const createMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  price: Joi.number().precision(2).positive().required(),
  availability: Joi.string()
    .valid(...Object.values(AvailabilityStatus))
    .optional(),
  category_id: Joi.number().integer().positive().allow(null).optional(),
});

export const updateMenuItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  description: Joi.string().trim().max(1000).allow('', null).optional(),
  price: Joi.number().precision(2).positive().optional(),
  availability: Joi.string()
    .valid(...Object.values(AvailabilityStatus))
    .optional(),
  category_id: Joi.number().integer().positive().allow(null).optional(),
}).min(1);

export const toggleAvailabilitySchema = Joi.object({
  availability: Joi.string()
    .valid(...Object.values(AvailabilityStatus))
    .required(),
});

export const assignCategorySchema = Joi.object({
  category_id: Joi.number().integer().positive().allow(null).required(),
});

// ─── Query Filters ────────────────────────────

export const menuItemFilterSchema = Joi.object({
  category_id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.valid('null'))
    .optional(),
  availability: Joi.string()
    .valid(...Object.values(AvailabilityStatus))
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
