import { Request, Response, NextFunction } from 'express';
import { menuItemService } from '../services/menuItem.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemFilterDto,
  AvailabilityStatus,
} from '../types';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export class MenuItemController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // category_id=null (string from query) → treat as "uncategorized"
      const rawCategoryId = req.query.category_id as string | undefined;
      let categoryId: number | null | undefined;

      if (rawCategoryId === 'null') {
        categoryId = null;
      } else if (rawCategoryId !== undefined) {
        categoryId = parseInt(rawCategoryId, 10);
      }

      const filter: MenuItemFilterDto = {
        category_id: categoryId,
        availability: req.query.availability as AvailabilityStatus | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await menuItemService.getAll(filter);
      sendSuccess(res, result.data, 'Menu items retrieved successfully', 200, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const item = await menuItemService.getById(id);
      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateMenuItemDto = req.body;
      const item = await menuItemService.create(dto);
      sendCreated(res, item, 'Menu item created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto: UpdateMenuItemDto = req.body;
      const item = await menuItemService.update(id, dto);
      sendSuccess(res, item, 'Menu item updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await menuItemService.delete(id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /menu-items/:id/availability
   * Dedicated toggle — only changes availability, nothing else.
   */
  async toggleAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { availability } = req.body as { availability: AvailabilityStatus };
      const item = await menuItemService.toggleAvailability(id, availability);
      sendSuccess(res, item, 'Availability updated');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /menu-items/:id/category
   * Dedicated endpoint for easy category reassignment.
   * { category_id: 3 }  → assign to category 3
   * { category_id: null } → unassign (item becomes uncategorized)
   */
  async assignCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { category_id } = req.body as { category_id: number | null };
      const item = await menuItemService.assignCategory(id, category_id);
      sendSuccess(res, item, 'Category assigned successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const menuItemController = new MenuItemController();
