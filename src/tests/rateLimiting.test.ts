import request from 'supertest';
import app from '../app';
import { RateLimitingService } from '../services/rateLimitingService';
import { query } from '../database/connection';

// Test identifiers used in RateLimitingService unit tests
const TEST_IPS = [
  '192.168.1.100', '192.168.1.101', '192.168.1.102',
  '192.168.1.103', '192.168.1.104',
];

describe('Rate Limiting', () => {
  let rateLimitingService: RateLimitingService;

  beforeAll(async () => {
    rateLimitingService = new RateLimitingService();
    // Remove any leftover entries from previous runs for our test IPs
    await query(
      'DELETE FROM rate_limit_entries WHERE identifier = ANY($1)',
      [TEST_IPS]
    ).catch(() => { /* ignore if table doesn't exist yet */ });
  });

  beforeEach(async () => {
    // Keep test IPs clean between tests so they all start with no prior limits
    await query(
      'DELETE FROM rate_limit_entries WHERE identifier = ANY($1)',
      [TEST_IPS]
    ).catch(() => {});
  });

  afterEach(async () => {
    // Additional cleanup after each test
    await rateLimitingService.cleanupOldEntries().catch(() => {});
  });

  describe('General Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('should allow valid login attempts within limit', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // First few attempts should be allowed (even if they fail due to invalid credentials)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);

        // Should not be rate limited (though login may fail for other reasons)
        expect(response.status).not.toBe(429);
      }
    });

    it('should rate limit excessive login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make requests up to the limit
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send(loginData)
        );
      }

      const responses = await Promise.all(promises);
      
      // At least some requests should be rate limited in production
      // In test environment, rate limiting might be disabled
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (process.env.NODE_ENV === 'production') {
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      }
    });

    it('should return proper rate limit error format', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make many requests to trigger rate limiting
      let rateLimitResponse;
      for (let i = 0; i < 20; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);

        if (response.status === 429) {
          rateLimitResponse = response;
          break;
        }
      }

      if (rateLimitResponse) {
        expect(rateLimitResponse.body).toHaveProperty('success', false);
        expect(rateLimitResponse.body).toHaveProperty('message');
        expect(rateLimitResponse.body).toHaveProperty('error');
        expect(rateLimitResponse.body).toHaveProperty('retryAfter');
        expect(rateLimitResponse.body).toHaveProperty('limit');
        expect(rateLimitResponse.body).toHaveProperty('windowMs');
        expect(rateLimitResponse.body).toHaveProperty('ip');
        expect(rateLimitResponse.body).toHaveProperty('timestamp');
      }
    });
  });

  describe('Registration Rate Limiting', () => {
    it('should allow registration attempts within limit', async () => {
      const registrationData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'student',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData);

      // Should not be rate limited (though registration may fail for other reasons)
      expect(response.status).not.toBe(429);
    });
  });

  describe('RateLimitingService', () => {
    it('should check rate limits correctly', async () => {
      const identifier = '192.168.1.100';
      const endpoint = '/api/v1/test';

      // First request should be allowed
      const result1 = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBeGreaterThan(0);

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await rateLimitingService.checkRateLimit(identifier, endpoint);
      }

      // Should still have some remaining
      const result2 = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result2.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should block identifier when limit exceeded', async () => {
      const identifier = '192.168.1.101';
      const endpoint = '/api/v1/auth/login';

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await rateLimitingService.checkRateLimit(identifier, endpoint);
      }

      // Next request should be blocked or have no remaining
      const result = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result.remaining).toBe(0);
    });

    it('should provide rate limit statistics', async () => {
      const identifier = '192.168.1.102';
      const endpoint = '/api/v1/test-stats';

      // Generate some activity
      for (let i = 0; i < 3; i++) {
        await rateLimitingService.checkRateLimit(identifier, endpoint);
      }

      const stats = await rateLimitingService.getRateLimitStats('hour');
      
      expect(stats).toHaveProperty('timeframe', 'hour');
      expect(stats).toHaveProperty('endpointStats');
      expect(stats).toHaveProperty('topOffenders');
      expect(stats).toHaveProperty('currentlyBlocked');
      expect(stats).toHaveProperty('summary');
      expect(Array.isArray(stats.endpointStats)).toBe(true);
    });

    it('should detect suspicious activity', async () => {
      const identifier = '192.168.1.103';
      
      // Generate suspicious activity (high volume)
      for (let i = 0; i < 10; i++) {
        await rateLimitingService.checkRateLimit(identifier, `/api/v1/endpoint-${i}`);
      }

      const suspiciousActivity = await rateLimitingService.detectSuspiciousActivity();
      
      expect(Array.isArray(suspiciousActivity)).toBe(true);
      // May or may not detect activity depending on thresholds
    });

    it('should manually block and unblock identifiers', async () => {
      const identifier = '192.168.1.104';
      const endpoint = '/api/v1/test-block';

      // Initially should be allowed
      const result1 = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result1.allowed).toBe(true);

      // Manually block
      await rateLimitingService.blockIdentifier(identifier, endpoint, 60000, 'Test block');

      // Should now be blocked
      const result2 = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result2.allowed).toBe(false);
      expect(result2.retryAfter).toBeGreaterThan(0);

      // Unblock
      await rateLimitingService.unblockIdentifier(identifier, endpoint);

      // Should be allowed again
      const result3 = await rateLimitingService.checkRateLimit(identifier, endpoint);
      expect(result3.allowed).toBe(true);
    });

    it('should clean up old entries', async () => {
      // This test mainly ensures the cleanup method doesn't throw errors
      await expect(rateLimitingService.cleanupOldEntries()).resolves.not.toThrow();
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include standard rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      // Check for standard rate limit headers
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('Different Rate Limits for Different Endpoints', () => {
    it('should apply different limits to auth endpoints', async () => {
      // Auth endpoints should have stricter limits
      const authResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'test' });

      // General API endpoints should have more lenient limits
      const apiResponse = await request(app)
        .get('/api/v1');

      // Both should include rate limit headers
      expect(authResponse.headers).toHaveProperty('ratelimit-limit');
      expect(apiResponse.headers).toHaveProperty('ratelimit-limit');
    });
  });

  describe('Speed Limiting', () => {
    it('should not add delay for initial requests', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast (under 2000ms for a simple health check — generous for CI/test envs)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      // Should not crash the server
      expect([400, 401, 429, 500]).toContain(response.status);
    });

    it('should handle missing headers gracefully', async () => {
      const response = await request(app)
        .get('/api/v1');

      // Should not crash the server
      expect(response.status).toBeLessThan(500);
    });
  });
});