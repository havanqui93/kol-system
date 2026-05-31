import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedis() {
  const client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 10) return null; // stop retrying after 10 attempts
      return Math.min(times * 200, 3000); // wait 200ms, 400ms, ... up to 3s
    },
    reconnectOnError(err) {
      // Reconnect on ECONNRESET or ETIMEDOUT
      return err.message.includes("ECONNRESET") || err.message.includes("ETIMEDOUT");
    },
  });

  client.on("error", (err) => {
    // Only log non-connection errors to avoid spam during startup
    if (!err.message.includes("ECONNREFUSED") && !err.message.includes("ETIMEDOUT")) {
      console.error("[Redis] error", err.message);
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
