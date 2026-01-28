import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, webauthnResponse } = body;

    if (action === 'start-auth') {
      // Get passkey authentication options from backend
      const response = await fetch(`${ODOO_URL}/auth/passkey/start-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.error) {
        return NextResponse.json(
          { error: data.error.data?.message || 'Aucun Passkey enregistré' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, options: data.result });
    }

    if (action === 'verify') {
      // Verify passkey response with backend
      const response = await fetch(`${ODOO_URL}/web/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ webauthn_response: webauthnResponse }),
        redirect: 'manual',
      });

      // If successful, Backend returns a redirect
      if (response.status === 303 || response.status === 302) {
        const setCookie = response.headers.get('set-cookie');
        return NextResponse.json({
          success: true,
          redirect: `${ODOO_URL}/web`,
          sessionCookie: setCookie,
        });
      }

      return NextResponse.json(
        { error: 'Authentification Passkey échouée' },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    logger.error('Passkey proxy error:', error);
    return NextResponse.json(
      { error: 'Erreur de connexion au serveur' },
      { status: 500 }
    );
  }
}
