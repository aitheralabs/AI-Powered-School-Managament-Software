import { BaseService } from './baseService';
export declare class RateLimitingService extends BaseService {
    private readonly DEFAULT_RULES;
    checkRateLimit(identifier: string, endpoint: string, userAgent?: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
        retryAfter?: number;
    }>;
    getRateLimitStats(timeframe?: 'hour' | 'day' | 'week'): Promise<any>;
    blockIdentifier(identifier: string, endpoint: string, durationMs: number, reason?: string): Promise<void>;
    unblockIdentifier(identifier: string, endpoint?: string): Promise<void>;
    cleanupOldEntries(): Promise<void>;
    detectSuspiciousActivity(): Promise<any[]>;
    private getRuleForEndpoint;
    private transformEntry;
    private getRateLimitEntry;
    private createRateLimitEntry;
    private resetRateLimitWindow;
    private incrementRequestCount;
    private blockEntry;
}
//# sourceMappingURL=rateLimitingService.d.ts.map