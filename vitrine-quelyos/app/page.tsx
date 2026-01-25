"use client";

import dynamic from "next/dynamic";

// Charger tout le contenu côté client pour éviter hydration mismatch lucide-react
const HomePageContent = dynamic(() => import("./components/HomePageContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
      <div className="animate-pulse text-white">Chargement...</div>
    </div>
  ),
});

export default function HomePage() {
  return <HomePageContent />;
}
