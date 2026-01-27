/**
 * Health Check Endpoint - Vitrine Quelyos
 * GET /api/health
 */

import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}

const startTime = Date.now();

export async function GET() {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'vitrine-quelyos',
      version: process.env.npm_package_version || '0.1.0',
      uptime,
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
