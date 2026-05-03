"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseStats = exports.livenessCheck = exports.readinessCheck = exports.healthCheckDetailed = exports.healthCheck = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const os_1 = __importDefault(require("os"));
const env_1 = __importDefault(require("../config/env"));
const fs_1 = require("fs");
const path_1 = require("path");
let _appVersion = '';
function getAppVersion() {
    if (!_appVersion) {
        try {
            const pkg = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(process.cwd(), 'package.json'), 'utf8'));
            _appVersion = pkg.version || '1.0.0';
        }
        catch {
            _appVersion = '1.0.0';
        }
    }
    return _appVersion;
}
exports.healthCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env_1.default.NODE_ENV,
    });
});
exports.healthCheckDetailed = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const startTime = Date.now();
    let databaseStatus = "unhealthy";
    let databaseLatency = 0;
    try {
        const dbStart = Date.now();
        await connection_1.pool.query("SELECT 1");
        databaseLatency = Date.now() - dbStart;
        databaseStatus = "healthy";
    }
    catch (error) {
        databaseStatus = "unhealthy";
    }
    const poolMetrics = (0, connection_1.getPoolMetrics)();
    const totalMemory = os_1.default.totalmem();
    const freeMemory = os_1.default.freemem();
    const usedMemory = totalMemory - freeMemory;
    const healthData = {
        status: databaseStatus === "healthy" ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: getAppVersion(),
        environment: env_1.default.NODE_ENV,
        checks: {
            database: {
                status: databaseStatus,
                latency: `${databaseLatency}ms`,
                message: databaseStatus === "healthy"
                    ? "Database connection successful"
                    : "Database connection failed",
            },
            api: {
                status: "healthy",
                message: "API service is running",
            },
        },
        database_pool: poolMetrics,
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
            platform: os_1.default.platform(),
            cpuCount: os_1.default.cpus().length,
            loadAverage: os_1.default.loadavg(),
        },
        responseTime: `${Date.now() - startTime}ms`,
    };
    const statusCode = databaseStatus === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthData);
});
exports.readinessCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        await connection_1.pool.query("SELECT 1");
        res.status(200).json({
            status: "ready",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(503).json({
            status: "not ready",
            timestamp: new Date().toISOString(),
            error: "Database not ready",
        });
    }
});
exports.livenessCheck = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
exports.databaseStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const tableSizes = await connection_1.pool.query(`
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
        const indexUsage = await connection_1.pool.query(`
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
        const connections = await connection_1.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = $1
    `, [env_1.default.DB_NAME]);
        const cacheHitRatio = await connection_1.pool.query(`
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
                poolMetrics: (0, connection_1.getPoolMetrics)(),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to retrieve database statistics",
            error: error.message,
        });
    }
});
//# sourceMappingURL=healthController.js.map