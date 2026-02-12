import { createPool, withTransaction, closePool } from '../config/database';
import { PoolConnection } from 'mysql2/promise';
import { logger } from '../utils/logger';

const seedCategories = async (conn: PoolConnection): Promise<number[]> => {
  const categories = [
    { name: 'Appetizers', description: 'Starters and small bites', display_order: 1 },
    { name: 'Main Courses', description: 'Main dishes', display_order: 2 },
    { name: 'Desserts', description: 'Sweet treats', display_order: 3 },
    { name: 'Beverages', description: 'Drinks', display_order: 4 },
  ];

  const ids: number[] = [];
  for (const cat of categories) {
    const [result] = await conn.execute<any>(
      `INSERT IGNORE INTO categories (name, description, display_order) VALUES (?, ?, ?)`,
      [cat.name, cat.description, cat.display_order]
    );
    if (result.insertId) ids.push(result.insertId);
  }
  return ids;
};

const seedMenuItems = async (conn: PoolConnection): Promise<void> => {
  const [[appetizer]] = await conn.execute<any[]>(`SELECT id FROM categories WHERE name = 'Appetizers'`);
  const [[main]] = await conn.execute<any[]>(`SELECT id FROM categories WHERE name = 'Main Courses'`);
  const [[dessert]] = await conn.execute<any[]>(`SELECT id FROM categories WHERE name = 'Desserts'`);

  const items = [
    { name: 'Garlic Breadsticks', description: 'Crispy breadsticks with garlic butter', price: 200.00, category_id: appetizer?.id, availability: 'available' },
    { name: 'Bruschetta', description: 'Toasted bread with tomatoes', price: 150.00, category_id: appetizer?.id, availability: 'available' },
    { name: 'Chicken Wings (6 Pcs)', description: 'Spicy buffalo wings', price: 250.00, category_id: appetizer?.id, availability: 'unavailable' },
    { name: 'Margherita Pizza', description: 'Classic margherita', price: 250.00, category_id: main?.id, availability: 'available' },
    { name: 'Paneer Tikka Masala', description: 'Creamy paneer curry', price: 220.00, category_id: main?.id, availability: 'available' },
    { name: 'Veggie Burger', description: 'Spicy veggie burger with fries', price: 230.00, category_id: main?.id, availability: 'available' },
    { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with ice cream', price: 180.00, category_id: dessert?.id, availability: 'available' },
  ];

  for (const item of items) {
    await conn.execute(
      `INSERT IGNORE INTO menu_items (name, description, price, category_id, availability)
       VALUES (?, ?, ?, ?, ?)`,
      [item.name, item.description, item.price, item.category_id ?? null, item.availability]
    );
  }
};

const run = async (): Promise<void> => {
  createPool();
  try {
    await withTransaction(async (conn) => {
      logger.info('[seed] Seeding categories...');
      await seedCategories(conn);
      logger.info('[seed] Seeding menu items...');
      await seedMenuItems(conn);
      logger.info('[seed] Done.');
    });
  } catch (err) {
    logger.error('[seed] Failed', err);
    process.exit(1);
  } finally {
    await closePool();
  }
  process.exit(0);
};

run();
