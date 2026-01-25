

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { currencies } from "@/lib/finance/currencies";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import type { CreateAccountRequest } from "@/types/api";

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
      console.error("Erreur de chargement des portefeuilles", err);
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
    <div className="space-y-6 text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Comptes</p>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">Nouveau compte</h1>
            <p className="text-sm text-indigo-100/80">
              Créez un compte et associez-le aux portefeuilles concernés. Sans sélection, il sera disponible partout.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/accounts"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-indigo-50 transition hover:border-white/40"
            >
              Retour à la liste
            </Link>
          </div>
        </div>

      <form
        onSubmit={submitAccount}
        className="space-y-6 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-2xl"
      >
        {isSuperAdmin && (
          <div className="flex flex-col gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-indigo-50">
            <span className="font-semibold">Super admin</span>
            <input
              type="number"
              value={targetCompanyId}
              onChange={(e) => setTargetCompanyId(e.target.value)}
              placeholder="ID société"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-indigo-100/60"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-indigo-100" htmlFor="name">Nom du compte</label>
            <input
              id="name"
              type="text"
              placeholder="Compte courant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
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
            <label className="text-sm text-indigo-100">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Solde initial</label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Statut</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
            >
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Banque / établissement (optionnel)</label>
            <input
              type="text"
              placeholder="BNP, Société Générale..."
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Notes (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Conditions, plafond, remarques…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="space-y-1">
            <label className="text-sm text-indigo-100">Portefeuilles associés</label>
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
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer le compte"}
          </button>
          <Link
            href="/dashboard/accounts"
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
          >
            Annuler
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
