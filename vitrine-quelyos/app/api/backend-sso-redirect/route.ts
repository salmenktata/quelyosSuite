import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@quelyos/config';

const BACKEND_URL = getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const login = formData.get('login') as string;
  const password = formData.get('password') as string;
  const db = (formData.get('db') as string) || process.env.BACKEND_DB || 'quelyos';

  const backendUrl = `${BACKEND_URL}/api/auth/sso-redirect?db=${db}`;

  // Escape values for HTML safety
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `<!DOCTYPE html>
<html>
  <body>
    <form id="redirect-form" method="POST" action="${escapeHtml(backendUrl)}">
      <input type="hidden" name="login" value="${escapeHtml(login)}" />
      <input type="hidden" name="password" value="${escapeHtml(password)}" />
      <input type="hidden" name="db" value="${escapeHtml(db)}" />
    </form>
    <script>document.getElementById('redirect-form').submit();</script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
