import { PoolConnection } from 'mysql2/promise';
import { withTransaction, getPool, createPool } from '../config/database';
import { logger } from '../utils/logger';

import * as m001 from './001_create_categories';
import * as m002 from './002_create_menu_items';

const MIGRATIONS: Array<{
  name: string;
  up: (conn: PoolConnection) => Promise<void>;
  down: (conn: PoolConnection) => Promise<void>;
}> = [
  { name: '001_create_categories', ...m001 },
  { name: '002_create_menu_items', ...m002 },
];

const ensureMigrationsTable = async (conn: PoolConnection): Promise<void> => {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL UNIQUE,
      applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const getApplied = async (conn: PoolConnection): Promise<Set<string>> => {
  const [rows] = await conn.execute<any[]>(`SELECT name FROM schema_migrations`);
  return new Set(rows.map((r) => r.name as string));
};

const run = async (direction: 'up' | 'rollback' = 'up'): Promise<void> => {
  createPool();
  const conn = await getPool().getConnection();

  await conn.beginTransaction();
  try {
    await ensureMigrationsTable(conn);
    const applied = await getApplied(conn);

    if (direction === 'up') {
      for (const migration of MIGRATIONS) {
        if (applied.has(migration.name)) {
          logger.info(`[migration] already applied: ${migration.name}`);
          continue;
        }
        logger.info(`[migration] applying: ${migration.name}`);
        await migration.up(conn);
        await conn.execute(`INSERT INTO schema_migrations (name) VALUES (?)`, [migration.name]);
        logger.info(`[migration] done: ${migration.name}`);
      }
    } else {
      // rollback last applied migration
      const last = [...MIGRATIONS].reverse().find((m) => applied.has(m.name));
      if (!last) {
        logger.warn('[migration] nothing to roll back');
      } else {
        logger.info(`[migration] rolling back: ${last.name}`);
        await last.down(conn);
        await conn.execute(`DELETE FROM schema_migrations WHERE name = ?`, [last.name]);
        logger.info(`[migration] rolled back: ${last.name}`);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    logger.error('[migration] failed, rolled back', err);
    process.exit(1);
  } finally {
    conn.release();
  }

  process.exit(0);
};

run(process.argv[2] === 'rollback' ? 'rollback' : 'up');
