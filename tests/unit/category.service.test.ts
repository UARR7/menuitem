import { CategoryService } from '../../src/services/category.service';
import { categoryRepository } from '../../src/repositories/category.repository';
import { menuItemRepository } from '../../src/repositories/menuItem.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../../src/utils/errors';
import { Category } from '../../src/types';

// Mock repositories
jest.mock('../../src/repositories/category.repository');
jest.mock('../../src/repositories/menuItem.repository');

const mockCategoryRepo = categoryRepository as jest.Mocked<typeof categoryRepository>;
const mockMenuItemRepo = menuItemRepository as jest.Mocked<typeof menuItemRepository>;

const mockCategory: Category = {
  id: 1,
  name: 'Appetizers',
  description: null,
  display_order: 0,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoryService();
  });

  // ─── getById ──────────────────────────────────

  describe('getById', () => {
    it('returns category when found', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(mockCategory);
      const result = await service.getById(1);
      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepo.findById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundError when category does not exist', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(null);
      await expect(service.getById(99)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── create ───────────────────────────────────

  describe('create', () => {
    it('creates category successfully', async () => {
      mockCategoryRepo.findByName.mockResolvedValueOnce(null);
      mockCategoryRepo.create.mockResolvedValueOnce(mockCategory);

      const result = await service.create({ name: 'Appetizers' });
      expect(result).toEqual(mockCategory);
    });

    it('throws ConflictError for duplicate name', async () => {
      mockCategoryRepo.findByName.mockResolvedValueOnce(mockCategory);
      await expect(service.create({ name: 'Appetizers' })).rejects.toThrow(ConflictError);
    });
  });

  // ─── delete ───────────────────────────────────

  describe('delete', () => {
    it('deletes category with no linked items', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepo.countLinkedItems.mockResolvedValueOnce(0);
      mockCategoryRepo.delete.mockResolvedValueOnce(true);

      const result = await service.delete(1);
      expect(result).toEqual({ deleted: true, unassigned_items: 0 });
    });

    it('throws BadRequestError when items are linked and force=false', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepo.countLinkedItems.mockResolvedValueOnce(3);

      await expect(service.delete(1, false)).rejects.toThrow(BadRequestError);
      expect(mockCategoryRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes and unassigns when force=true', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepo.countLinkedItems.mockResolvedValueOnce(3);
      mockCategoryRepo.delete.mockResolvedValueOnce(true);

      const result = await service.delete(1, true);
      expect(result).toEqual({ deleted: true, unassigned_items: 3 });
      expect(mockCategoryRepo.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundError for non-existent category', async () => {
      mockCategoryRepo.findById.mockResolvedValueOnce(null);
      await expect(service.delete(99)).rejects.toThrow(NotFoundError);
    });
  });
});
