import { RowDataPacket } from 'mysql2/promise';
import { query, execute } from '../config/database';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../types';

interface CategoryRow extends Category, RowDataPacket {}

export class CategoryRepository {
  async findAll(): Promise<Category[]> {
    return query<CategoryRow[]>(
      `SELECT * FROM categories ORDER BY display_order ASC, name ASC`
    );
  }

  async findById(id: number): Promise<Category | null> {
    const rows = await query<CategoryRow[]>(
      `SELECT * FROM categories WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findByName(name: string): Promise<Category | null> {
    const rows = await query<CategoryRow[]>(
      `SELECT * FROM categories WHERE name = ? LIMIT 1`,
      [name]
    );
    return rows[0] ?? null;
  }

  async findActiveById(id: number): Promise<Category | null> {
    const rows = await query<CategoryRow[]>(
      `SELECT * FROM categories WHERE id = ? AND is_active = 1 LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const result = await execute(
      `INSERT INTO categories (name, description, display_order)
       VALUES (?, ?, ?)`,
      [dto.name, dto.description ?? null, dto.display_order ?? 0]
    );
    const created = await this.findById(result.insertId);
    return created!;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined)          { fields.push('name = ?');          values.push(dto.name); }
    if (dto.description !== undefined)   { fields.push('description = ?');   values.push(dto.description); }
    if (dto.display_order !== undefined) { fields.push('display_order = ?'); values.push(dto.display_order); }
    if (dto.is_active !== undefined)     { fields.push('is_active = ?');     values.push(dto.is_active ? 1 : 0); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute(`DELETE FROM categories WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  /** Count items still mapped to this category */
  async countLinkedItems(categoryId: number): Promise<number> {
    const rows = await query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM menu_items WHERE category_id = ?`,
      [categoryId]
    );
    return rows[0].total;
  }
}

export const categoryRepository = new CategoryRepository();
