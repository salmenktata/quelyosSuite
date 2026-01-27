/**
 * Health Check Endpoint - Dashboard Client
 * GET /api/health
 */

import { getHealthStatus } from '@/lib/health';

export async function GET() {
  try {
    const health = getHealthStatus();

    return new Response(JSON.stringify(health), {
      status: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 503 : 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
