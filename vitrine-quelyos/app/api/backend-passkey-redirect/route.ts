import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8069';

export async function GET() {
  return NextResponse.redirect(`${BACKEND_URL}/auth/passkey-page?redirect=/web`);
}
