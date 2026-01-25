

import { useRequireAuth } from "@/lib/finance/compat/auth";
import { BillingCard } from "@/components/finance/BillingCard";

export default function BillingPage() {
  useRequireAuth();

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Paramètres</p>
        <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-3xl font-semibold text-transparent">
          Abonnement & Facturation
        </h1>
        <p className="text-sm text-indigo-100/80">
          Gérez votre abonnement, consultez vos factures et mettez à jour vos informations de paiement.
        </p>
      </div>

      <div className="relative">
        <BillingCard />
      </div>
    </div>
  );
}
