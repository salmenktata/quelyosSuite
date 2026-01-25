const bcrypt = require('bcryptjs');

/**
 * Dummy bcrypt hash to prevent timing attacks
 * Performs a bcrypt operation even when user doesn't exist
 * to keep response times constant
 */
async function dummyBcryptHash() {
  // Use a pre-computed hash to compare against
  const dummyHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const dummyPassword = 'dummy_password_for_timing';
  await bcrypt.compare(dummyPassword, dummyHash);
}

/**
 * Add constant time delay to responses
 * Helps prevent timing-based enumeration attacks
 * @param {number} minDelay - Minimum delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @param {number} startTime - Request start time from Date.now()
 */
async function constantTimeDelay(minDelay = 100, maxDelay = 200, startTime = Date.now()) {
  const elapsed = Date.now() - startTime;
  const targetDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  const remainingDelay = Math.max(0, targetDelay - elapsed);

  if (remainingDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, remainingDelay));
  }
}

module.exports = {
  dummyBcryptHash,
  constantTimeDelay
};
