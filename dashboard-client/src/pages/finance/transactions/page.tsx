import { Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";

// Désactive le prerendering statique pour permettre la redirection dynamique
export const dynamic = "force-dynamic";

export default function TransactionsPage() {
  // Redirige vers la page des dépenses par défaut
  redirect(ROUTES.FINANCE.DASHBOARD.EXPENSES.HOME);
}
