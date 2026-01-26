/**
 * Image Proxy API Route
 * Proxies images from backend to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function GET(request: NextRequest) {
  try {
    // Get the image URL from query params
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // Check if it's a valid backend image URL
    const isBackendUrl = url.includes('/web/image') ||
                         url.includes('localhost:8069') ||
                         url.startsWith(BACKEND_URL);

    if (!isBackendUrl) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Build full URL if relative
    let fullUrl: string;
    if (url.startsWith('http')) {
      fullUrl = url;
    } else if (url.startsWith('/')) {
      fullUrl = `${BACKEND_URL}${url}`;
    } else {
      fullUrl = `${BACKEND_URL}/${url}`;
    }

    // Fetch the image from backend
    const response = await fetch(fullUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    logger.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
