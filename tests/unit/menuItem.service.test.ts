import { MenuItemService } from '../../src/services/menuItem.service';
import { menuItemRepository } from '../../src/repositories/menuItem.repository';
import { categoryRepository } from '../../src/repositories/category.repository';
import { NotFoundError } from '../../src/utils/errors';
import { AvailabilityStatus, MenuItemWithCategory, Category } from '../../src/types';

jest.mock('../../src/repositories/menuItem.repository');
jest.mock('../../src/repositories/category.repository');

const mockMenuItemRepo = menuItemRepository as jest.Mocked<typeof menuItemRepository>;
const mockCategoryRepo = categoryRepository as jest.Mocked<typeof categoryRepository>;

const mockCategory: Category = {
  id: 2,
  name: 'Main Courses',
  description: null,
  display_order: 1,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockItem: MenuItemWithCategory = {
  id: 10,
  name: 'Veggie Burger',
  description: 'Spicy veggie burger with fries',
  price: 230.00,
  availability: AvailabilityStatus.AVAILABLE,
  category_id: 1,
  category_name: 'Appetizers',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('MenuItemService', () => {
  let service: MenuItemService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MenuItemService();
  });

  // ─── toggleAvailability ───────────────────────

  describe('toggleAvailability', () => {
    it('marks item unavailable', async () => {
      const unavailableItem = { ...mockItem, availability: AvailabilityStatus.UNAVAILABLE };
      mockMenuItemRepo.findById.mockResolvedValueOnce(mockItem);
      mockMenuItemRepo.updateAvailability.mockResolvedValueOnce(unavailableItem);

      const result = await service.toggleAvailability(10, AvailabilityStatus.UNAVAILABLE);
      expect(result.availability).toBe(AvailabilityStatus.UNAVAILABLE);
      expect(mockMenuItemRepo.updateAvailability).toHaveBeenCalledWith(10, AvailabilityStatus.UNAVAILABLE);
    });

    it('throws NotFoundError when item missing', async () => {
      mockMenuItemRepo.findById.mockResolvedValueOnce(null);
      await expect(service.toggleAvailability(99, AvailabilityStatus.UNAVAILABLE)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── assignCategory ───────────────────────────

  describe('assignCategory', () => {
    it('assigns item to a new category', async () => {
      const reassignedItem = { ...mockItem, category_id: 2, category_name: 'Main Courses' };
      mockMenuItemRepo.findById.mockResolvedValueOnce(mockItem);
      mockCategoryRepo.findActiveById.mockResolvedValueOnce(mockCategory);
      mockMenuItemRepo.assignCategory.mockResolvedValueOnce(reassignedItem);

      const result = await service.assignCategory(10, 2);
      expect(result.category_id).toBe(2);
      expect(mockMenuItemRepo.assignCategory).toHaveBeenCalledWith(10, 2);
    });

    it('unassigns item (category_id = null)', async () => {
      const unassigned = { ...mockItem, category_id: null, category_name: null };
      mockMenuItemRepo.findById.mockResolvedValueOnce(mockItem);
      mockMenuItemRepo.assignCategory.mockResolvedValueOnce(unassigned);

      const result = await service.assignCategory(10, null);
      expect(result.category_id).toBeNull();
      // Should NOT validate category when null
      expect(mockCategoryRepo.findActiveById).not.toHaveBeenCalled();
    });

    it('throws NotFoundError for missing category', async () => {
      mockMenuItemRepo.findById.mockResolvedValueOnce(mockItem);
      mockCategoryRepo.findActiveById.mockResolvedValueOnce(null);
      await expect(service.assignCategory(10, 99)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError for missing item', async () => {
      mockMenuItemRepo.findById.mockResolvedValueOnce(null);
      await expect(service.assignCategory(99, 2)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── create ───────────────────────────────────

  describe('create', () => {
    it('creates item without category', async () => {
      mockMenuItemRepo.create.mockResolvedValueOnce({ ...mockItem, category_id: null });
      const result = await service.create({ name: 'New Item', price: 100 });
      expect(result).toBeDefined();
      expect(mockCategoryRepo.findActiveById).not.toHaveBeenCalled();
    });

    it('validates category when category_id provided', async () => {
      mockCategoryRepo.findActiveById.mockResolvedValueOnce(mockCategory);
      mockMenuItemRepo.create.mockResolvedValueOnce(mockItem);

      await service.create({ name: 'New Item', price: 100, category_id: 2 });
      expect(mockCategoryRepo.findActiveById).toHaveBeenCalledWith(2);
    });
  });
});
