"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitingService = void 0;
const baseService_1 = require("./baseService");
class RateLimitingService extends baseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.DEFAULT_RULES = [
            { endpoint: '/api/v1/auth/login', windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 15 * 60 * 1000 },
            { endpoint: '/api/v1/auth/register', windowMs: 60 * 60 * 1000, maxRequests: 10, blockDurationMs: 60 * 60 * 1000 },
            { endpoint: '/api/v1/auth/refresh', windowMs: 5 * 60 * 1000, maxRequests: 20 },
            { endpoint: '/api/v1/users', windowMs: 15 * 60 * 1000, maxRequests: 100 },
            { endpoint: '/api/v1/reports', windowMs: 10 * 60 * 1000, maxRequests: 10 },
        ];
    }
    async checkRateLimit(identifier, endpoint, userAgent) {
        const rule = this.getRuleForEndpoint(endpoint);
        if (!rule) {
            return { allowed: true, remaining: Infinity, resetTime: new Date() };
        }
        const now = new Date();
        const windowStart = new Date(now.getTime() - rule.windowMs);
        let entry = await this.getRateLimitEntry(identifier, endpoint, windowStart);
        if (!entry) {
            entry = await this.createRateLimitEntry(identifier, endpoint, now, rule.windowMs);
        }
        if (entry.isBlocked && entry.windowEnd > now) {
            const retryAfter = Math.ceil((entry.windowEnd.getTime() - now.getTime()) / 1000);
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.windowEnd,
                retryAfter,
            };
        }
        if (entry.windowEnd <= now) {
            entry = await this.resetRateLimitWindow(entry.id, now, rule.windowMs);
        }
        await this.incrementRequestCount(entry.id);
        entry.requestCount += 1;
        const remaining = Math.max(0, rule.maxRequests - entry.requestCount);
        const allowed = entry.requestCount <= rule.maxRequests;
        if (!allowed && rule.blockDurationMs) {
            const blockEnd = new Date(now.getTime() + rule.blockDurationMs);
            await this.blockEntry(entry.id, blockEnd);
            return {
                allowed: false,
                remaining: 0,
                resetTime: blockEnd,
                retryAfter: Math.ceil(rule.blockDurationMs / 1000),
            };
        }
        return {
            allowed,
            remaining,
            resetTime: entry.windowEnd,
        };
    }
    async getRateLimitStats(timeframe = 'hour') {
        let interval;
        switch (timeframe) {
            case 'day':
                interval = '1 day';
                break;
            case 'week':
                interval = '7 days';
                break;
            default:
                interval = '1 hour';
        }
        const stats = await this.executeQuery(`SELECT 
         endpoint,
         COUNT(*) as total_requests,
         COUNT(*) FILTER (WHERE is_blocked = true) as blocked_requests,
         COUNT(DISTINCT identifier) as unique_identifiers,
         AVG(request_count) as avg_requests_per_identifier,
         MAX(request_count) as max_requests_per_identifier
       FROM rate_limit_entries 
       WHERE window_start > NOW() - INTERVAL '${interval}'
       GROUP BY endpoint
       ORDER BY total_requests DESC`);
        const topOffenders = await this.executeQuery(`SELECT 
         identifier,
         endpoint,
         SUM(request_count) as total_requests,
         COUNT(*) FILTER (WHERE is_blocked = true) as times_blocked,
         MAX(last_request) as last_activity
       FROM rate_limit_entries 
       WHERE window_start > NOW() - INTERVAL '${interval}'
       GROUP BY identifier, endpoint
       HAVING SUM(request_count) > 100
       ORDER BY total_requests DESC
       LIMIT 20`);
        const currentlyBlocked = await this.executeQuery(`SELECT 
         identifier,
         endpoint,
         window_end as blocked_until,
         request_count
       FROM rate_limit_entries 
       WHERE is_blocked = true AND window_end > NOW()
       ORDER BY window_end DESC`);
        return {
            timeframe,
            endpointStats: stats.rows,
            topOffenders: topOffenders.rows,
            currentlyBlocked: currentlyBlocked.rows,
            summary: {
                totalEndpoints: stats.rows.length,
                totalBlocked: currentlyBlocked.rows.length,
                totalOffenders: topOffenders.rows.length,
            },
        };
    }
    async blockIdentifier(identifier, endpoint, durationMs, reason) {
        const now = new Date();
        const blockEnd = new Date(now.getTime() + durationMs);
        await this.executeQuery(`INSERT INTO rate_limit_entries (identifier, endpoint, request_count, window_start, window_end, is_blocked, last_request, block_reason)
       VALUES ($1, $2, 999999, $3, $4, true, $5, $6)
       ON CONFLICT (identifier, endpoint) 
       DO UPDATE SET 
         is_blocked = true,
         window_end = $4,
         last_request = $5,
         block_reason = $6`, [identifier, endpoint, now, blockEnd, now, reason || 'Manual block']);
        console.warn('Identifier manually blocked:', {
            identifier,
            endpoint,
            blockEnd,
            reason,
            timestamp: now.toISOString(),
        });
    }
    async unblockIdentifier(identifier, endpoint) {
        const whereClause = endpoint ? 'identifier = $1 AND endpoint = $2' : 'identifier = $1';
        const params = endpoint ? [identifier, endpoint] : [identifier];
        await this.executeQuery(`UPDATE rate_limit_entries 
       SET is_blocked = false, request_count = 0, window_start = NOW(), window_end = NOW(), last_request = NOW()
       WHERE ${whereClause}`, params);
        console.info('Identifier unblocked:', {
            identifier,
            endpoint: endpoint || 'all endpoints',
            timestamp: new Date().toISOString(),
        });
    }
    async cleanupOldEntries() {
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await this.executeQuery('DELETE FROM rate_limit_entries WHERE window_end < $1', [cutoffDate]);
        console.info('Rate limit cleanup completed:', {
            deletedEntries: result.rowCount,
            cutoffDate: cutoffDate.toISOString(),
        });
    }
    async detectSuspiciousActivity() {
        const suspiciousPatterns = [];
        const highVolumeIdentifiers = await this.executeQuery(`SELECT 
         identifier,
         SUM(request_count) as total_requests,
         COUNT(DISTINCT endpoint) as endpoints_hit,
         MAX(last_request) as last_activity
       FROM rate_limit_entries 
       WHERE window_start > NOW() - INTERVAL '1 hour'
       GROUP BY identifier
       HAVING SUM(request_count) > 500
       ORDER BY total_requests DESC`);
        if (highVolumeIdentifiers.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'HIGH_VOLUME_REQUESTS',
                description: 'Identifiers with unusually high request volumes',
                data: highVolumeIdentifiers.rows,
            });
        }
        const endpointScanners = await this.executeQuery(`SELECT 
         identifier,
         COUNT(DISTINCT endpoint) as unique_endpoints,
         SUM(request_count) as total_requests,
         MAX(last_request) as last_activity
       FROM rate_limit_entries 
       WHERE window_start > NOW() - INTERVAL '30 minutes'
       GROUP BY identifier
       HAVING COUNT(DISTINCT endpoint) > 20
       ORDER BY unique_endpoints DESC`);
        if (endpointScanners.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'ENDPOINT_SCANNING',
                description: 'Identifiers scanning multiple endpoints',
                data: endpointScanners.rows,
            });
        }
        const repeatedOffenders = await this.executeQuery(`SELECT 
         identifier,
         COUNT(*) as times_blocked,
         array_agg(DISTINCT endpoint) as blocked_endpoints,
         MAX(last_request) as last_activity
       FROM rate_limit_entries 
       WHERE is_blocked = true AND window_start > NOW() - INTERVAL '24 hours'
       GROUP BY identifier
       HAVING COUNT(*) > 3
       ORDER BY times_blocked DESC`);
        if (repeatedOffenders.rows.length > 0) {
            suspiciousPatterns.push({
                type: 'REPEATED_OFFENDERS',
                description: 'Identifiers repeatedly hitting rate limits',
                data: repeatedOffenders.rows,
            });
        }
        return suspiciousPatterns;
    }
    getRuleForEndpoint(endpoint) {
        let rule = this.DEFAULT_RULES.find(r => r.endpoint === endpoint);
        if (!rule) {
            rule = this.DEFAULT_RULES.find(r => {
                const pattern = r.endpoint.replace(/\*/g, '.*');
                return new RegExp(`^${pattern}$`).test(endpoint);
            });
        }
        if (!rule) {
            rule = { endpoint: '*', windowMs: 60 * 1000, maxRequests: 100 };
        }
        return rule;
    }
    transformEntry(row) {
        return {
            id: row.id,
            identifier: row.identifier,
            endpoint: row.endpoint,
            requestCount: row.request_count,
            windowStart: new Date(row.window_start),
            windowEnd: new Date(row.window_end),
            isBlocked: row.is_blocked,
            lastRequest: new Date(row.last_request),
        };
    }
    async getRateLimitEntry(identifier, endpoint, windowStart) {
        const result = await this.executeQuery(`SELECT id, identifier, endpoint, request_count, window_start, window_end, is_blocked, last_request
       FROM rate_limit_entries
       WHERE identifier = $1 AND endpoint = $2 AND window_end > $3
       ORDER BY window_start DESC
       LIMIT 1`, [identifier, endpoint, windowStart]);
        return result.rows.length > 0 ? this.transformEntry(result.rows[0]) : null;
    }
    async createRateLimitEntry(identifier, endpoint, now, windowMs) {
        const windowEnd = new Date(now.getTime() + windowMs);
        const result = await this.executeQuery(`INSERT INTO rate_limit_entries (identifier, endpoint, request_count, window_start, window_end, is_blocked, last_request)
       VALUES ($1, $2, 0, $3, $4, false, $5)
       ON CONFLICT (identifier, endpoint)
       DO UPDATE SET
         request_count = 0,
         window_start = EXCLUDED.window_start,
         window_end = EXCLUDED.window_end,
         is_blocked = false,
         last_request = EXCLUDED.last_request
       RETURNING id, identifier, endpoint, request_count, window_start, window_end, is_blocked, last_request`, [identifier, endpoint, now, windowEnd, now]);
        return this.transformEntry(result.rows[0]);
    }
    async resetRateLimitWindow(entryId, now, windowMs) {
        const windowEnd = new Date(now.getTime() + windowMs);
        const result = await this.executeQuery(`UPDATE rate_limit_entries
       SET request_count = 0, window_start = $2, window_end = $3, is_blocked = false, last_request = $4
       WHERE id = $1
       RETURNING id, identifier, endpoint, request_count, window_start, window_end, is_blocked, last_request`, [entryId, now, windowEnd, now]);
        return this.transformEntry(result.rows[0]);
    }
    async incrementRequestCount(entryId) {
        await this.executeQuery(`UPDATE rate_limit_entries 
       SET request_count = request_count + 1, last_request = NOW()
       WHERE id = $1`, [entryId]);
    }
    async blockEntry(entryId, blockEnd) {
        await this.executeQuery(`UPDATE rate_limit_entries 
       SET is_blocked = true, window_end = $2
       WHERE id = $1`, [entryId, blockEnd]);
    }
}
exports.RateLimitingService = RateLimitingService;
//# sourceMappingURL=rateLimitingService.js.map