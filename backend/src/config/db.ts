import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const isProduction = env.NODE_ENV === 'production';
const isLocalhost = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');
const requiresSSL = !isLocalhost && (env.DATABASE_URL.includes('supabase.com') || env.DATABASE_URL.includes('sslmode=require') || isProduction);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 10000
});

pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
  logger.error('Unexpected idle PostgreSQL client error', err);
});

// Helper for parameterized queries
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

// Transaction execution helper
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error rolling back transaction:', rollbackErr);
      logger.error('Error rolling back transaction', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

// Quick health check helper
export async function checkDbConnection(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}
