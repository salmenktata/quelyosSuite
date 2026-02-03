import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@quelyos/config';

const BACKEND_URL = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Login et mot de passe requis' }, { status: 400 });
    }

    // Utiliser l'endpoint JWT au lieu de /web/session/authenticate
    const response = await fetch(`${BACKEND_URL}/api/auth/sso-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { error: data.error || 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Return JWT token info for dashboard handoff
    return NextResponse.json({
      success: true,
      uid: data.user?.id,
      name: data.user?.name || login,
      username: data.user?.login || login,
      access_token: data.access_token,
      expires_in: data.expires_in || 900,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur backend' },
      { status: 500 }
    );
  }
}
