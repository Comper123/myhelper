import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForPostgres = globalThis as unknown as { postgresPool?: Pool };

export const pool = globalForPostgres.postgresPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});

if (process.env.NODE_ENV !== "production") globalForPostgres.postgresPool = pool;

export const db = drizzle(pool, { schema });
