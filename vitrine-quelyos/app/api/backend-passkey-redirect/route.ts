import { NextResponse } from 'next/server';
import { getBackendUrl } from '@quelyos/config';

const BACKEND_URL = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

export async function GET() {
  return NextResponse.redirect(`${BACKEND_URL}/auth/passkey-page?redirect=/web`);
}
