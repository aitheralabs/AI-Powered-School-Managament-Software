import { Request, Response } from "express";
import { pool, getPoolMetrics } from "../database/connection";
import { asyncHandler } from "../middleware/errorHandler";
import os from "os";
import env from "../config/env";
import { readFileSync } from "fs";
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

// Basic health check - lightweight
export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
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
    } catch (error) {
      databaseStatus = "unhealthy";
    }

    // Get pool metrics
    const poolMetrics = getPoolMetrics();

    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const healthData = {
      status: databaseStatus === "healthy" ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: getAppVersion(),
      environment: env.NODE_ENV,

      // Service checks
      checks: {
        database: {
          status: databaseStatus,
          latency: `${databaseLatency}ms`,
          message:
            databaseStatus === "healthy"
              ? "Database connection successful"
              : "Database connection failed",
        },
        api: {
          status: "healthy",
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

    const statusCode = databaseStatus === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthData);
  },
);

// Readiness check - for Kubernetes/container orchestration
export const readinessCheck = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Check if database is ready
      await pool.query("SELECT 1");

      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: "Database not ready",
      });
    }
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
