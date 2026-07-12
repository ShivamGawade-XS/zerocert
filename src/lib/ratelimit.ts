import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Graceful fallback helper when Redis credentials are not provided (e.g. local dev / testing)
class MockRatelimit {
  async limit() {
    return {
      success: true,
      limit: 1000,
      remaining: 1000,
      reset: Date.now() + 1000,
    };
  }
}

let redisClient: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (e) {
    console.warn('Failed to initialize Redis client for rate limiting:', e);
  }
}

// 5 requests per hour per IP (for register/login)
export const authLimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'zc_auth_limit',
    })
  : new MockRatelimit();

// 3 claims per hour per IP per event
export const claimLimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: 'zc_claim_limit',
    })
  : new MockRatelimit();

// 100 emails per hour per org
export const emailLimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(100, '1 h'),
      analytics: true,
      prefix: 'zc_email_limit',
    })
  : new MockRatelimit();
