/**
 * Token Refresh Lock Mechanism
 *
 * Prevents race conditions when multiple refresh requests arrive simultaneously.
 * Uses an in-memory lock to ensure only one refresh operation per user at a time.
 *
 * Race Condition Scenario Without Lock:
 * 1. Client makes two parallel refresh requests (e.g., multiple tabs)
 * 2. Both requests read the same refresh token
 * 3. Both try to rotate it simultaneously
 * 4. Second request fails because token was already marked as used
 * 5. User gets false positive token reuse detection
 *
 * With Lock:
 * 1. First request acquires lock for user
 * 2. Second request waits or returns cached result
 * 3. No false positive detections
 */

class TokenRefreshLock {
  constructor() {
    // Store locks per user ID
    this.locks = new Map();

    // Store pending refresh promises per user
    this.pendingRefreshes = new Map();

    // Lock timeout in milliseconds (5 seconds)
    this.LOCK_TIMEOUT = 5000;
  }

  /**
   * Acquire lock for a user's token refresh
   *
   * @param {number} userId - User ID
   * @returns {Promise<{acquired: boolean, release: function}>}
   */
  async acquire(userId) {
    const now = Date.now();
    const existingLock = this.locks.get(userId);

    // Check if there's an existing lock
    if (existingLock) {
      // Check if lock has expired
      if (now - existingLock.timestamp > this.LOCK_TIMEOUT) {
        // Lock expired, clear it
        console.warn(`[LOCK] Lock expired for user ${userId}, clearing`);
        this.locks.delete(userId);
        this.pendingRefreshes.delete(userId);
      } else {
        // Lock is active, cannot acquire
        return {
          acquired: false,
          waitTime: this.LOCK_TIMEOUT - (now - existingLock.timestamp)
        };
      }
    }

    // Acquire new lock
    this.locks.set(userId, {
      timestamp: now,
      lockId: Math.random().toString(36).substring(7)
    });

    // Return release function
    const release = () => {
      const currentLock = this.locks.get(userId);
      if (currentLock && currentLock.timestamp === now) {
        this.locks.delete(userId);
        this.pendingRefreshes.delete(userId);
      }
    };

    return { acquired: true, release };
  }

  /**
   * Store a pending refresh promise
   *
   * Allows subsequent requests to wait for the same refresh operation
   * instead of creating duplicate requests.
   *
   * @param {number} userId - User ID
   * @param {Promise} refreshPromise - The ongoing refresh operation
   */
  setPendingRefresh(userId, refreshPromise) {
    this.pendingRefreshes.set(userId, refreshPromise);
  }

  /**
   * Get pending refresh promise if one exists
   *
   * @param {number} userId - User ID
   * @returns {Promise|null} - Pending refresh promise or null
   */
  getPendingRefresh(userId) {
    return this.pendingRefreshes.get(userId);
  }

  /**
   * Check if a lock exists for a user
   *
   * @param {number} userId - User ID
   * @returns {boolean}
   */
  isLocked(userId) {
    const lock = this.locks.get(userId);
    if (!lock) return false;

    const now = Date.now();
    if (now - lock.timestamp > this.LOCK_TIMEOUT) {
      // Expired
      this.locks.delete(userId);
      return false;
    }

    return true;
  }

  /**
   * Force release a lock (use with caution)
   *
   * @param {number} userId - User ID
   */
  forceRelease(userId) {
    this.locks.delete(userId);
    this.pendingRefreshes.delete(userId);
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      activeLocks: this.locks.size,
      pendingRefreshes: this.pendingRefreshes.size,
      locks: Array.from(this.locks.entries()).map(([userId, lock]) => ({
        userId,
        age: Date.now() - lock.timestamp,
        lockId: lock.lockId
      }))
    };
  }

  /**
   * Cleanup expired locks (run periodically)
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, lock] of this.locks.entries()) {
      if (now - lock.timestamp > this.LOCK_TIMEOUT) {
        this.locks.delete(userId);
        this.pendingRefreshes.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[LOCK] Cleaned up ${cleaned} expired locks`);
    }

    return cleaned;
  }
}

// Singleton instance
const tokenRefreshLock = new TokenRefreshLock();

// Cleanup expired locks every 10 seconds
setInterval(() => {
  tokenRefreshLock.cleanup();
}, 10000);

module.exports = tokenRefreshLock;
