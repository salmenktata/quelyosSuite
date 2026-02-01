import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * API Route pour collecter les Web Vitals
 * POST /api/analytics
 * Body: { name, value, rating, delta, navigationType, timestamp }
 */
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // Validation basique
    if (!metric.name || typeof metric.value !== "number") {
      return NextResponse.json(
        { error: "Invalid metric data" },
        { status: 400 }
      );
    }

    // TODO: Envoyer à votre service analytics
    // Options : Google Analytics 4, Vercel Analytics, Plausible, etc.
    // Exemple avec GA4:
    // await fetch('https://www.google-analytics.com/mp/collect?...', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     events: [{
    //       name: 'web_vitals',
    //       params: metric
    //     }]
    //   })
    // });

    // Métrique reçue et validée (logs retirés pour production)

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error) {
    // Erreur capturée silencieusement (pas de logs en production)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Support OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
