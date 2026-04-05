type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function now() {
  return Date.now();
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const currentTime = now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= currentTime) {
    const nextBucket = {
      count: 1,
      resetAt: currentTime + windowMs,
    };
    buckets.set(key, nextBucket);
    return {
      allowed: true,
      remaining: Math.max(0, limit - nextBucket.count),
      resetAt: nextBucket.resetAt,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}
