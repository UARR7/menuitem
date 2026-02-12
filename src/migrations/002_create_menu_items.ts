import { PoolConnection } from 'mysql2/promise';

export const up = async (conn: PoolConnection): Promise<void> => {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(150)  NOT NULL,
      description   TEXT          DEFAULT NULL,

      -- Price stored as DECIMAL to avoid floating-point issues
      price         DECIMAL(10,2) NOT NULL,

      -- Enum-like column; application enforces valid values
      availability  ENUM('available','unavailable') NOT NULL DEFAULT 'available',

      -- LOOSE COUPLING: category_id is nullable.
      -- An item can exist without a category.
      -- ON DELETE SET NULL ensures items survive category deletion.
      -- Category can be reassigned freely via PATCH /menu-items/:id/category
      category_id   INT UNSIGNED  DEFAULT NULL,

      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT fk_menu_items_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

      INDEX idx_category_id   (category_id),
      INDEX idx_availability  (availability),
      INDEX idx_category_avail (category_id, availability)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

export const down = async (conn: PoolConnection): Promise<void> => {
  await conn.execute(`DROP TABLE IF EXISTS menu_items`);
};
