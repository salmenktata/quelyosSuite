/**
 * Image Proxy API Route
 * Proxies images from backend to avoid CORS issues
 * URLs are base64-encoded to anonymize backend patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

// Decode base64 URL (anonymized)
function decodeImageUrl(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    // Fallback: not base64, return as-is (legacy support)
    return encoded;
  }
}

// Check if string is base64
function isBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the image URL from query params (may be base64-encoded)
    const rawUrl = request.nextUrl.searchParams.get('url');
    const encodedParam = request.nextUrl.searchParams.get('id'); // New: encoded ID

    if (!rawUrl && !encodedParam) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }

    // Decode URL: prefer 'id' (base64) over 'url' (legacy)
    let url: string;
    if (encodedParam) {
      url = decodeImageUrl(encodedParam);
    } else if (rawUrl && isBase64(rawUrl)) {
      url = decodeImageUrl(rawUrl);
    } else {
      url = rawUrl!;
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
  } catch (_error: unknown) {
    logger.error('Image proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
