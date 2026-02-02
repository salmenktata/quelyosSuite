'use client';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f9fafb',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#1f2937' }}>
            Une erreur est survenue
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Nous sommes désolés pour ce désagrément.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
