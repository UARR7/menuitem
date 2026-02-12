import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../types';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export class CategoryController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.getAll();
      sendSuccess(res, categories, 'Categories retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await categoryService.getById(id);
      sendSuccess(res, category);
    } catch (err) {
      next(err);
    }
  }

  async getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const items = await categoryService.getCategoryItems(id);
      sendSuccess(res, items, 'Category items retrieved');
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateCategoryDto = req.body;
      const category = await categoryService.create(dto);
      sendCreated(res, category, 'Category created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const dto: UpdateCategoryDto = req.body;
      const category = await categoryService.update(id, dto);
      sendSuccess(res, category, 'Category updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const force = req.query.force === 'true';
      const result = await categoryService.delete(id, force);
      sendSuccess(res, result, 'Category deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
