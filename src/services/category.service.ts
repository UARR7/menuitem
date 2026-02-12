import { categoryRepository } from '../repositories/category.repository';
import { menuItemRepository } from '../repositories/menuItem.repository';
import { withTransaction, getPool } from '../config/database';
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../utils/errors';

export class CategoryService {
  async getAll(): Promise<Category[]> {
    return categoryRepository.findAll();
  }

  async getById(id: number): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category', id);
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await categoryRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictError(`Category with name '${dto.name}' already exists`);
    }
    return categoryRepository.create(dto);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category', id);

    // If renaming, ensure the new name is not already taken by another category
    if (dto.name && dto.name !== category.name) {
      const conflict = await categoryRepository.findByName(dto.name);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`Category with name '${dto.name}' already exists`);
      }
    }

    const updated = await categoryRepository.update(id, dto);
    return updated!;
  }

  /**
   * Safe delete with two strategies:
   *   - If no items are mapped → hard delete
   *   - If items exist → by default, unassign items (SET NULL) then delete
   *     (DB FK is already SET NULL, but we expose a flag for clarity)
   *
   * Per problem statement: "Delete category (only if no items mapped OR handle safely)"
   */
  async delete(id: number, force = false): Promise<{ deleted: boolean; unassigned_items: number }> {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category', id);

    const linkedCount = await categoryRepository.countLinkedItems(id);

    if (linkedCount > 0 && !force) {
      throw new BadRequestError(
        `Category has ${linkedCount} linked menu item(s). ` +
        `Pass force=true to unassign items and delete, or reassign items first.`
      );
    }

    // The FK ON DELETE SET NULL handles unassignment automatically at DB level
    await categoryRepository.delete(id);

    return { deleted: true, unassigned_items: linkedCount };
  }

  async getCategoryItems(categoryId: number) {
    await this.getById(categoryId); // validate category exists
    return menuItemRepository.findByCategoryId(categoryId);
  }
}

export const categoryService = new CategoryService();
