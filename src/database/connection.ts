import { Pool, PoolClient } from "pg";
import { AsyncLocalStorage } from "async_hooks";
import env from "../config/env";
import logger from "../utils/logger";

// AsyncLocalStorage for request-scoped tenant context (RLS activation)
export const tenantContext = new AsyncLocalStorage<{ schoolId?: string }>();

// Database configuration with optimized pooling
const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  // Connection Pool Optimization (Phase 3.1.3)
  max: 25, // Maximum number of clients (increased for production load)
  min: 5, // Minimum pool size to maintain (keep connections warm)
  idleTimeoutMillis: 60000, // Close idle clients after 60 seconds (increased from 30s)
  connectionTimeoutMillis: 10000, // Wait up to 10s for connection (increased for stability)

  // Query Timeout
  query_timeout: 30000, // 30 second timeout for queries (prevent hung queries)
  statement_timeout: 30000, // 30 second statement timeout

  // Connection Settings
  allowExitOnIdle: false, // Keep pool alive even when idle

  // Application Name (for monitoring)
  application_name: "school_management_system",
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Pool error handling — log but do NOT exit; the pool will reconnect automatically.
pool.on("error", (err: Error) => {
  logger.error("Unexpected error on idle database client", { error: err.message });
});

// Pool events — development only to avoid log noise in production
pool.on("connect", (_client) => {
  if (env.NODE_ENV === "development") {
    logger.debug("New client connected to database pool");
  }
});

pool.on("remove", (_client) => {
  if (env.NODE_ENV === "development") {
    logger.debug("Client removed from pool");
  }
});

// Database connection test
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    if (env.NODE_ENV !== "test") {
      logger.info("Database connected successfully");
    }
    return true;
  } catch (error) {
    if (env.NODE_ENV !== "test") {
      logger.error("Database connection failed", { error: (error as Error).message });
    }
    return false;
  }
};

// Execute query with connection from pool
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const ctx = tenantContext.getStore();
    if (ctx?.schoolId) {
      const client = await pool.connect();
      try {
        await client.query("SET app.current_school_id = $1", [ctx.schoolId]);
        const res = await client.query(text, params);
        if (env.NODE_ENV === "development") {
          console.log("📊 Executed query", {
            text,
            duration: Date.now() - start,
            rows: res.rowCount,
          });
        }
        return res;
      } finally {
        client.release();
      }
    }
    const res = await pool.query(text, params);
    if (env.NODE_ENV === "development") {
      console.log("📊 Executed query", {
        text,
        duration: Date.now() - start,
        rows: res.rowCount,
      });
    }
    return res;
  } catch (error) {
    if (env.NODE_ENV !== "test") {
      console.error("❌ Query error:", (error as Error).message);
    }
    throw error;
  }
};

// Get client from pool for transactions (with optional tenant context)
export const getClient = async (schoolId?: string): Promise<PoolClient> => {
  const client = await pool.connect();
  if (schoolId) {
    await client.query("SET app.current_school_id = $1", [schoolId]);
  }
  return client;
};

// Get pool metrics for monitoring
export const getPoolMetrics = () => {
  return {
    totalCount: pool.totalCount, // Total number of clients in pool
    idleCount: pool.idleCount, // Number of idle clients
    waitingCount: pool.waitingCount, // Number of queued requests waiting for a client
    maxPoolSize: dbConfig.max,
    minPoolSize: dbConfig.min,
    utilization:
      pool.totalCount > 0
        ? (
            ((pool.totalCount - pool.idleCount) / pool.totalCount) *
            100
          ).toFixed(2) + "%"
        : "0%",
  };
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  await pool.end();
  if (env.NODE_ENV !== "test") {
    logger.info("Database pool closed");
  }
};

export default pool;
