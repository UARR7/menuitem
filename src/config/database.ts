import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { logger } from '../utils/logger';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  connectTimeout: number;
  waitForConnections: true;
  queueLimit: number;
  enableKeepAlive: true;
  keepAliveInitialDelay: number;
}

let pool: Pool | null = null;

export const getDbConfig = (): DbConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'menu_management',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const createPool = (): Pool => {
  if (pool) return pool;
  pool = mysql.createPool(getDbConfig());
  logger.info('MySQL connection pool created');
  return pool;
};

export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call createPool() first.');
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('MySQL connection pool closed');
  }
};

export const testConnection = async (): Promise<void> => {
  const connection = await getPool().getConnection();
  await connection.ping();
  connection.release();
  logger.info('Database connection verified');
};

// Generic query helpers typed for reuse
export const query = async <T extends RowDataPacket[]>(
  sql: string,
  params?: unknown[]
): Promise<T> => {
  const [rows] = await getPool().execute<T>(sql, params);
  return rows;
};

export const execute = async (
  sql: string,
  params?: unknown[]
): Promise<ResultSetHeader> => {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
};

export const withTransaction = async <T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> => {
  const conn = await getPool().getConnection();
  await conn.beginTransaction();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
