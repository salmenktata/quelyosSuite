/**
 * Nouveau Compte Bancaire - Formulaire d'ajout compte
 *
 * Fonctionnalités :
 * - Création compte bancaire avec nom, type (banque/cash/épargne) et devise
 * - Configuration solde initial et informations établissement
 * - Association optionnelle à un ou plusieurs portefeuilles
 * - Multi-devise avec liste complète des devises internationales
 * - Gestion statut actif/inactif pour archivage comptes
 * - Notes personnalisées pour conditions et remarques
 */
import { useEffect, useState, useCallback } from "react";
import { ROUTES } from "@/lib/finance/compat/routes";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { currencies } from "@/lib/finance/currencies";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import type { CreateAccountRequest } from "@/types/api";
import { logger } from '@quelyos/logger';
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'

// Types alignés avec la page comptes
type AccountType =
  | "banque"
  | "cash"
  | "cheques"
  | "traites"
  | "carte"
  | "epargne"
  | "investissement"
  | "pret";

type Portfolio = {
  id: number;
  name: string;
};

type AccountStatus = "ACTIVE" | "INACTIVE";

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "banque", label: "Banque" },
  { value: "cash", label: "Cash" },
  { value: "cheques", label: "Chèques" },
  { value: "traites", label: "Traites" },
  { value: "carte", label: "Carte (débit/crédit)" },
  { value: "epargne", label: "Épargne" },
  { value: "investissement", label: "Investissement" },
  { value: "pret", label: "Prêt / Crédit" },
];

export default function NewAccountPage() {
  const { user } = useRequireAuth();
  const role = (user as { role?: string } | null)?.role ?? "USER";
  const isSuperAdmin = role === "SUPERADMIN";
  const { currency: globalCurrency } = useCurrency();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("banque");
  const [currency, setCurrency] = useState(globalCurrency);
  const [balance, setBalance] = useState<number | "">("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<AccountStatus>("ACTIVE");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolios, setSelectedPortfolios] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState("");

  const withCompanyParam = useCallback(
    (path: string) => {
      if (!isSuperAdmin) return path;
      const cid = Number(targetCompanyId);
      if (!targetCompanyId.trim() || !Number.isFinite(cid)) return path;
      return path.includes("?") ? `${path}&companyId=${cid}` : `${path}?companyId=${cid}`;
    },
    [isSuperAdmin, targetCompanyId]
  );

  const fetchPortfolios = useCallback(async () => {
    try {
      const data = await api(withCompanyParam("/portfolios"));
      setPortfolios(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("Erreur de chargement des portefeuilles", err);
    }
  }, [withCompanyParam]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  async function submitAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = {
        name,
        type,
        currency,
        balance,
        institution,
        notes,
        status,
        portfolioIds: selectedPortfolios,
      };

      await api(withCompanyParam("/accounts"), {
        method: "POST",
        body: body as CreateAccountRequest,
      });

      navigate(ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de créer le compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Comptes', href: '/finance/accounts' },
            { label: 'Nouveau' },
          ]}
        />

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Comptes
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nouveau compte
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Créez un compte et associez-le aux portefeuilles concernés. Sans sélection, il sera disponible partout.
          </p>
        </div>

      <form
        onSubmit={submitAccount}
        className="space-y-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-6 shadow-lg"
      >
        {isSuperAdmin && (
          <div className="flex flex-col gap-1 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-3 py-2 text-xs text-gray-700 dark:text-indigo-50">
            <span className="font-semibold">Super admin</span>
            <input
              type="number"
              value={targetCompanyId}
              onChange={(e) => setTargetCompanyId(e.target.value)}
              placeholder="ID société"
              className="w-full rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-indigo-100/60"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="name">Nom du compte</label>
            <input
              id="name"
              type="text"
              placeholder="Compte courant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Solde initial</label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Banque / établissement (optionnel)</label>
            <input
              type="text"
              placeholder="BNP, Société Générale..."
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Conditions, plafond, remarques…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-3 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Portefeuilles associés</label>
            <p className="text-xs text-indigo-100/70">
              Sans sélection, le compte sera disponible dans tous les portefeuilles.
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
            {portfolios.length === 0 ? (
              <p className="text-xs text-indigo-100/60">Aucun portefeuille disponible</p>
            ) : (
              portfolios.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`portfolio-${p.id}`}
                    checked={selectedPortfolios.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPortfolios([...selectedPortfolios, p.id]);
                      } else {
                        setSelectedPortfolios(selectedPortfolios.filter((id) => id !== p.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500"
                  />
                  <label htmlFor={`portfolio-${p.id}`} className="text-sm text-indigo-100">
                    {p.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création..." : "Créer le compte"}
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME)}
            className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
        </div>
      </form>
      </div>
    </Layout>
  );
}
