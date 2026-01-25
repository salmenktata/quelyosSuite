"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirection vers /cgu
export default function TermsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/cgu");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Redirection...</p>
    </div>
  );
}
