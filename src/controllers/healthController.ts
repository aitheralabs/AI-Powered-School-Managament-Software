import { Request, Response } from "express";
import { pool, getPoolMetrics } from "../database/connection";
import { asyncHandler } from "../middleware/errorHandler";
import { cacheService } from "../services/cacheService";
import os from "os";
import env from "../config/env";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let _appVersion = '';
function getAppVersion(): string {
  if (!_appVersion) {
    try {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
      _appVersion = pkg.version || '1.0.0';
    } catch {
      _appVersion = '1.0.0';
    }
  }
  return _appVersion;
}

/** Git commit SHA — written by CI into dist/VERSION at build time (optional) */
function getGitSha(): string {
  try {
    const versionFile = join(process.cwd(), 'dist', 'VERSION');
    if (existsSync(versionFile)) return readFileSync(versionFile, 'utf8').trim();
  } catch {}
  return process.env.GIT_COMMIT_SHA || process.env.GITHUB_SHA?.slice(0, 8) || 'unknown';
}

/** Check Redis connectivity with a PING */
async function checkRedis(): Promise<{ status: string; latencyMs: number; message: string }> {
  if (!env.REDIS_ENABLED) {
    return { status: 'disabled', latencyMs: 0, message: 'Redis is disabled (REDIS_ENABLED=false)' };
  }
  const start = Date.now();
  try {
    const stats = await cacheService.getStats();
    const latencyMs = Date.now() - start;
    if (stats.connected) {
      return { status: 'healthy', latencyMs, message: 'Redis connection successful' };
    }
    return { status: 'unhealthy', latencyMs, message: 'Redis not connected' };
  } catch {
    return { status: 'unhealthy', latencyMs: Date.now() - start, message: 'Redis ping failed' };
  }
}

// Basic health check — lightweight, no DB call, used by load balancer / nginx
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({
    success:     true,
    status:      'ok',
    message:     'Server is running',
    timestamp:   new Date().toISOString(),
    uptime:      Math.floor(process.uptime()),
    version:     getAppVersion(),
    commit:      getGitSha(),
    environment: env.NODE_ENV,
  });
});

// Detailed health check with database connectivity
export const healthCheckDetailed = asyncHandler(
  async (req: Request, res: Response) => {
    const startTime = Date.now();

    // Database health check
    let databaseStatus = "unhealthy";
    let databaseLatency = 0;
    try {
      const dbStart = Date.now();
      await pool.query("SELECT 1");
      databaseLatency = Date.now() - dbStart;
      databaseStatus = "healthy";
    } catch {
      databaseStatus = "unhealthy";
    }

    // Redis health check
    const redisCheck = await checkRedis();

    // Get pool metrics
    const poolMetrics = getPoolMetrics();

    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const overallStatus = databaseStatus === "healthy" ? "healthy" : "degraded";

    const healthData = {
      status:      overallStatus,
      timestamp:   new Date().toISOString(),
      version:     getAppVersion(),
      commit:      getGitSha(),
      environment: env.NODE_ENV,

      // Service checks
      checks: {
        database: {
          status:  databaseStatus,
          latency: `${databaseLatency}ms`,
          message: databaseStatus === "healthy"
            ? "Database connection successful"
            : "Database connection failed",
        },
        redis: {
          status:  redisCheck.status,
          latency: `${redisCheck.latencyMs}ms`,
          message: redisCheck.message,
        },
        api: {
          status:  "healthy",
          message: "API service is running",
        },
      },

      // Database pool metrics
      database_pool: poolMetrics,

      // System metrics
      system: {
        uptime: `${Math.floor(process.uptime())}s`,
        memory: {
          total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: `${((usedMemory / totalMemory) * 100).toFixed(2)}%`,
        },
        process: {
          memoryUsage: {
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`,
          },
          cpuUsage: process.cpuUsage(),
        },
        platform: os.platform(),
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg(),
      },

      // Response time
      responseTime: `${Date.now() - startTime}ms`,
    };

    const statusCode = overallStatus === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthData);
  },
);

// Readiness check — for container orchestrators (Docker HEALTHCHECK, K8s readinessProbe)
// Returns 200 only when ALL critical dependencies are reachable.
export const readinessCheck = asyncHandler(
  async (_req: Request, res: Response) => {
    const checks: Record<string, { ok: boolean; message: string }> = {};

    // Database
    try {
      await pool.query("SELECT 1");
      checks.database = { ok: true, message: 'ok' };
    } catch (err: any) {
      checks.database = { ok: false, message: err.message };
    }

    // Redis (only if enabled)
    if (env.REDIS_ENABLED) {
      const redis = await checkRedis();
      checks.redis = { ok: redis.status === 'healthy', message: redis.message };
    }

    const allOk = Object.values(checks).every(c => c.ok);
    res.status(allOk ? 200 : 503).json({
      status:    allOk ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  },
);

// Liveness check - for Kubernetes/container orchestration
export const livenessCheck = asyncHandler(async (req: Request, res: Response) => {
  // Simple check to see if the process is alive
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Database statistics for monitoring
export const databaseStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get table sizes
      const tableSizes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `);

      // Get index usage
      const indexUsage = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    `);

      // Get active connections
      const connections = await pool.query(
        `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = $1
    `,
        [env.DB_NAME],
      );

      // Get cache hit ratio
      const cacheHitRatio = await pool.query(`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
      FROM pg_statio_user_tables
    `);

      res.json({
        status: "success",
        data: {
          tableSizes: tableSizes.rows,
          topIndexes: indexUsage.rows,
          connections: connections.rows[0],
          cacheHitRatio: cacheHitRatio.rows[0],
          poolMetrics: getPoolMetrics(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: "Failed to retrieve database statistics",
        error: error.message,
      });
    }
  },
);
