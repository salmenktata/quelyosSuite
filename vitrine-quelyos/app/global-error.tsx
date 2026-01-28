'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          :root {
            --bg: #f8fafc;
            --text: #0f172a;
            --text-muted: #475569;
            --text-subtle: #64748b;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #020617;
              --text: #f8fafc;
              --text-muted: #cbd5e1;
              --text-subtle: #94a3b8;
            }
          }
          body {
            margin: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
          }
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .content { text-align: center; }
          h1 {
            font-size: 3.75rem;
            font-weight: 700;
            margin: 0 0 1rem;
          }
          h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-muted);
            margin: 0 0 1rem;
          }
          p {
            color: var(--text-subtle);
            margin: 0 0 2rem;
          }
          button {
            padding: 0.75rem 1.5rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover { background: #1d4ed8; }
        `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="content">
            <h1>Erreur</h1>
            <h2>Une erreur s&apos;est produite</h2>
            <p>Quelque chose ne s&apos;est pas passé comme prévu.</p>
            <button onClick={reset}>Réessayer</button>
          </div>
        </div>
      </body>
    </html>
  );
}
