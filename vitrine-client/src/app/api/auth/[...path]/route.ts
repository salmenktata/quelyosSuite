/**
 * API Route Proxy pour l'authentification backend
 * Gère tous les endpoints /api/auth/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/auth/${pathString}`;

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: body,
        id: Date.now(),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    // Si la réponse contient un session_id, créer un cookie
    const result = data.result || data;
    const nextResponse = NextResponse.json(result);

    if (result.session_id) {
      nextResponse.cookies.set('_auth_token', result.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      });
    }

    return nextResponse;

  } catch (_error) {
    logger.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/auth/${pathString}`;

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Date.now(),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.result || data);

  } catch (_error) {
    logger.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
