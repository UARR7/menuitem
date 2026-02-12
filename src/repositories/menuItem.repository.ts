import { RowDataPacket } from 'mysql2/promise';
import { query, execute } from '../config/database';
import {
  MenuItem,
  MenuItemWithCategory,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemFilterDto,
  AvailabilityStatus,
} from '../types';

interface MenuItemRow extends MenuItemWithCategory, RowDataPacket {}
interface CountRow extends RowDataPacket { total: number }

export class MenuItemRepository {
  async findAll(filter: MenuItemFilterDto = {}): Promise<{ items: MenuItemWithCategory[]; total: number }> {
    const { category_id, availability, page = 1, limit = 20 } = filter;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (category_id !== undefined) {
      if (category_id === null) {
        conditions.push('mi.category_id IS NULL');
      } else {
        conditions.push('mi.category_id = ?');
        params.push(category_id);
      }
    }
    if (availability) {
      conditions.push('mi.availability = ?');
      params.push(availability);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQuery = `
      FROM menu_items mi
      LEFT JOIN categories c ON c.id = mi.category_id
      ${where}
    `;

    const [countRows, itemRows] = await Promise.all([
      query<CountRow[]>(`SELECT COUNT(*) AS total ${baseQuery}`, params),
      query<MenuItemRow[]>(
        `SELECT mi.*, c.name AS category_name ${baseQuery}
         ORDER BY mi.name ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
    ]);

    return { items: itemRows, total: countRows[0].total };
  }

  async findById(id: number): Promise<MenuItemWithCategory | null> {
    const rows = await query<MenuItemRow[]>(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi
       LEFT JOIN categories c ON c.id = mi.category_id
       WHERE mi.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateMenuItemDto): Promise<MenuItemWithCategory> {
    const result = await execute(
      `INSERT INTO menu_items (name, description, price, availability, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        dto.name,
        dto.description ?? null,
        dto.price,
        dto.availability ?? AvailabilityStatus.AVAILABLE,
        dto.category_id ?? null,
      ]
    );
    return (await this.findById(result.insertId))!;
  }

  async update(id: number, dto: UpdateMenuItemDto): Promise<MenuItemWithCategory | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined)         { fields.push('name = ?');         values.push(dto.name); }
    if (dto.description !== undefined)  { fields.push('description = ?');  values.push(dto.description); }
    if (dto.price !== undefined)        { fields.push('price = ?');        values.push(dto.price); }
    if (dto.availability !== undefined) { fields.push('availability = ?'); values.push(dto.availability); }

    // category_id can be null (unassign) or a number — explicit undefined check
    if ('category_id' in dto) {
      fields.push('category_id = ?');
      values.push(dto.category_id ?? null);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async updateAvailability(id: number, availability: AvailabilityStatus): Promise<MenuItemWithCategory | null> {
    await execute(`UPDATE menu_items SET availability = ? WHERE id = ?`, [availability, id]);
    return this.findById(id);
  }

  /**
   * Dedicated method for category (re)assignment.
   * category_id = null → unassign from all categories
   * This is the key decoupling method from the problem statement.
   */
  async assignCategory(id: number, categoryId: number | null): Promise<MenuItemWithCategory | null> {
    await execute(`UPDATE menu_items SET category_id = ? WHERE id = ?`, [categoryId, id]);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute(`DELETE FROM menu_items WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async findByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return query<(MenuItem & RowDataPacket)[]>(
      `SELECT * FROM menu_items WHERE category_id = ? ORDER BY name ASC`,
      [categoryId]
    );
  }
}

export const menuItemRepository = new MenuItemRepository();
