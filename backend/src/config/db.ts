import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';
const requiresSSL = env.DATABASE_URL.includes('supabase.com') || env.DATABASE_URL.includes('sslmode=require') || isProduction;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Helper for parameterized queries
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

// Quick health check helper
export async function checkDbConnection(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
