import { PoolConnection } from 'mysql2/promise';

export const up = async (conn: PoolConnection): Promise<void> => {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100)  NOT NULL,
      description   TEXT          DEFAULT NULL,
      display_order SMALLINT      NOT NULL DEFAULT 0,
      is_active     TINYINT(1)    NOT NULL DEFAULT 1,
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT uq_category_name UNIQUE (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

export const down = async (conn: PoolConnection): Promise<void> => {
  await conn.execute(`DROP TABLE IF EXISTS categories`);
};
