'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-950">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-6xl font-bold text-white mb-4">Erreur</h1>
            <h2 className="text-2xl font-semibold text-slate-300 mb-4">
              Une erreur s&apos;est produite
            </h2>
            <p className="text-slate-400 mb-8">
              Quelque chose ne s&apos;est pas passé comme prévu.
            </p>
            <button
              onClick={reset}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
