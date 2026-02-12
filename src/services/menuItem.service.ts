import { menuItemRepository } from '../repositories/menuItem.repository';
import { categoryRepository } from '../repositories/category.repository';
import {
  MenuItemWithCategory,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemFilterDto,
  AvailabilityStatus,
  PaginatedResult,
} from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class MenuItemService {
  async getAll(filter: MenuItemFilterDto): Promise<PaginatedResult<MenuItemWithCategory>> {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));

    const { items, total } = await menuItemRepository.findAll({ ...filter, page, limit });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number): Promise<MenuItemWithCategory> {
    const item = await menuItemRepository.findById(id);
    if (!item) throw new NotFoundError('Menu item', id);
    return item;
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItemWithCategory> {
    // If category_id provided, validate it exists and is active
    if (dto.category_id != null) {
      await this.validateCategoryExists(dto.category_id);
    }
    return menuItemRepository.create(dto);
  }

  async update(id: number, dto: UpdateMenuItemDto): Promise<MenuItemWithCategory> {
    const existing = await menuItemRepository.findById(id);
    if (!existing) throw new NotFoundError('Menu item', id);

    // Validate new category if being changed
    if ('category_id' in dto && dto.category_id != null) {
      await this.validateCategoryExists(dto.category_id);
    }

    const updated = await menuItemRepository.update(id, dto);
    return updated!;
  }

  async delete(id: number): Promise<void> {
    const existing = await menuItemRepository.findById(id);
    if (!existing) throw new NotFoundError('Menu item', id);
    await menuItemRepository.delete(id);
  }

  /**
   * Toggle availability — dedicated endpoint per problem statement.
   * Only flips the availability field, nothing else.
   */
  async toggleAvailability(id: number, availability: AvailabilityStatus): Promise<MenuItemWithCategory> {
    const existing = await menuItemRepository.findById(id);
    if (!existing) throw new NotFoundError('Menu item', id);

    const updated = await menuItemRepository.updateAvailability(id, availability);
    return updated!;
  }

  /**
   * Assign or unassign category — dedicated endpoint for easy category switching.
   * Decoupled from the main update so it can be called independently.
   * category_id = null → removes item from any category (makes it "uncategorized")
   */
  async assignCategory(
    itemId: number,
    categoryId: number | null
  ): Promise<MenuItemWithCategory> {
    const existing = await menuItemRepository.findById(itemId);
    if (!existing) throw new NotFoundError('Menu item', itemId);

    if (categoryId !== null) {
      await this.validateCategoryExists(categoryId);
    }

    const updated = await menuItemRepository.assignCategory(itemId, categoryId);
    return updated!;
  }

  private async validateCategoryExists(categoryId: number): Promise<void> {
    const category = await categoryRepository.findActiveById(categoryId);
    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }
  }
}

export const menuItemService = new MenuItemService();
