/**
 * Prisma Client Singleton
 *
 * IMPORTANT: Always use this singleton instead of creating new PrismaClient instances
 * Multiple instances can cause connection pool exhaustion and deadlocks
 */

const { PrismaClient } = require('@prisma/client');

// Create singleton instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
