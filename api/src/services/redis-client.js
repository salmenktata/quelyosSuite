const { createClient } = require("redis");
const logger = require("../../logger");

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      // Redis configuration from environment or defaults
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error("Redis: Max reconnection attempts reached");
              return new Error("Max reconnection attempts reached");
            }
            // Exponential backoff: 100ms, 200ms, 400ms, 800ms, etc.
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on("error", (err) => {
        logger.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis: Connection established");
        this.isConnected = true;
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis: Reconnecting...");
      });

      this.client.on("ready", () => {
        logger.info("Redis: Client ready");
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.error("Redis: Failed to connect:", error);
      this.isConnected = false;
      // Don't throw - allow app to run without Redis
      return null;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error(`Redis: Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Redis: Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis: Error deleting key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Redis: Error deleting pattern ${pattern}:`, error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis: Disconnected");
    }
  }
}

// Singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
