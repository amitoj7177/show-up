import { Pool, types, type PoolClient } from "pg";

// Keep dates as plain "YYYY-MM-DD" text so time zones can't shift them.
types.setTypeParser(1082, (value) => value);

let pool: Pool | undefined;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 3),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return pool;
}

export async function query<T extends object>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

// Runs several steps as one: either all of them happen, or none do.
export async function transaction<T>(steps: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await steps(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type UserRow = {
  id: string;
  token_hash: string;
  nickname: string;
  goal_text: string;
  short_goal: string | null;
  goal_type: string;
  check_in_time: string;
  why: unknown;
  status: "waiting" | "paired" | "inactive" | "left";
  avatar: string;
  gentle_mascot: boolean;
  notice: string | null;
  is_demo: boolean;
};

export type PairRow = {
  id: string;
  user_a: string;
  user_b: string;
  started_on: string;
  day_offset: number;
  is_demo: boolean;
};
