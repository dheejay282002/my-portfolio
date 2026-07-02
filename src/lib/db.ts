import { Pool } from "pg";

// Use a global singleton to avoid exhausting connection pool on hot reloads
const globalForPg = globalThis as unknown as { pgPool: Pool | undefined };

export function getDb(): Pool {
  if (!globalForPg.pgPool) {
    let connectionString =
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/portfolio";

    const isLocal =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");

    connectionString = connectionString.replace(/sslmode=(prefer|require|verify-ca)/gi, "sslmode=verify-full");

    globalForPg.pgPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  return globalForPg.pgPool;
}

export async function queryAll(sql: string, params: any[] = []) {
  const db = getDb();
  const res = await db.query(sql, params);
  return res.rows;
}

export async function queryOne(sql: string, params: any[] = []) {
  const db = getDb();
  const res = await db.query(sql, params);
  return res.rows[0] || null;
}

export async function execute(sql: string, params: any[] = []) {
  const db = getDb();
  return await db.query(sql, params);
}
