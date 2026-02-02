"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Loader2, Download, Play, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PaymentPlanChart from "./PaymentPlanChart";
import { logger } from '@quelyos/logger';
import { fetchApi } from "@/lib/api-base";
import { tokenService } from "@/lib/tokenService";

interface OptimizationResult {
  plan: PaymentPlanItem[];
  metrics: {
    totalInvoices: number;
    scheduledInvoices: number;
    insufficientFunds: number;
    totalAmount: number;
    totalPenalties: number;
    totalDiscounts: number;
    totalCost: number;
    netSavings: number;
    paymentsOnTime: number;
    paymentsLate: number;
    onTimeRate: number;
    averagePaymentDelay: string;
  };
  availableCash: number;
  targetCashReserve: number;
  strategy: string;
  forecastingUsed?: string;
}

interface PaymentPlanItem {
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  penalty?: number;
  discount?: number;
  totalCost?: number;
  daysLate?: number;
  daysEarly?: number;
  dueDate: string;
  scheduledDate: string | null;
  score: number;
  status: string;
  reason: string;
}

const STRATEGIES = [
  {
    value: "BY_DUE_DATE",
    label: "Par date d'échéance",
    description: "Priorité aux factures les plus proches de leur échéance",
    icon: "📅",
  },
  {
    value: "BY_IMPORTANCE",
    label: "Par importance",
    description: "Priorité aux fournisseurs critiques et stratégiques",
    icon: "⭐",
  },
  {
    value: "MINIMIZE_PENALTIES",
    label: "Minimiser les pénalités",
    description: "Éviter les pénalités de retard en priorité",
    icon: "⚠️",
  },
  {
    value: "MAXIMIZE_DISCOUNTS",
    label: "Maximiser les remises",
    description: "Profiter des remises de paiement anticipé",
    icon: "💰",
  },
  {
    value: "OPTIMIZE_CASH_FLOW",
    label: "Optimiser la trésorerie",
    description: "Équilibre optimal entre tous les facteurs",
    icon: "🎯",
  },
];

export default function OptimizationPanel() {
  const [strategy, setStrategy] = useState("BY_DUE_DATE");
  const [maxDailyAmount, setMaxDailyAmount] = useState("");
  const [targetCashReserve, setTargetCashReserve] = useState("10000");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<{ id: number; name: string; balance: number; currency: string }[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [_executionResult, setExecutionResult] = useState<unknown>(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchApi<OptimizationResult>("/api/ecommerce/payment-planning/optimize", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          strategy,
          maxDailyAmount: maxDailyAmount ? parseFloat(maxDailyAmount) : undefined,
          targetCashReserve: parseFloat(targetCashReserve),
        }),
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!result) return;

    try {
      const token = tokenService.getAccessToken();
      const response = await fetch("/api/ecommerce/payment-planning/export-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          plan: result.plan,
          metrics: result.metrics,
          strategy: result.strategy,
          availableCash: result.availableCash,
          targetCashReserve: result.targetCashReserve,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'export Excel");
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plan-paiement-${new Date().getTime()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export");
    }
  };

  // Charger les comptes disponibles
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await fetchApi<{ accounts: { id: number; name: string; balance: number; currency: string }[] }>("/api/ecommerce/accounts", { method: "GET", credentials: "include" });
        setAccounts(data.accounts || []);
        if (data.accounts && data.accounts.length > 0) {
          setSelectedAccountId(data.accounts[0].id.toString());
        }
      } catch (err) {
        logger.error("Error loading accounts:", err);
      }
    };
    loadAccounts();
  }, []);

  const handleExportPdf = async () => {
    if (!result) return;

    try {
      const token = tokenService.getAccessToken();
      const response = await fetch("/api/ecommerce/payment-planning/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({
          plan: result.plan,
          metrics: result.metrics,
          strategy: result.strategy,
          availableCash: result.availableCash,
          targetCashReserve: result.targetCashReserve,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'export PDF");
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plan-paiement-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export PDF");
    }
  };

  const handleExecutePayments = async () => {
    if (!result || !selectedAccountId) {
      alert("Veuillez sélectionner un compte");
      return;
    }

    if (!confirm(`Voulez-vous vraiment exécuter ${result.metrics.scheduledInvoices} paiements ?`)) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Préparer les paiements (seulement ceux qui sont SCHEDULED)
      const scheduledPayments = result.plan
        .filter((p) => p.status === "SCHEDULED" && p.scheduledDate)
        .map((p) => ({
          invoiceId: p.invoiceId,
          accountId: parseInt(selectedAccountId),
          paymentDate: p.scheduledDate,
          paymentMethod: "VIREMENT",
        }));

      const data = await fetchApi<{ successful: number; failed: number }>("/api/ecommerce/payment-planning/execute-batch", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ payments: scheduledPayments }),
      });

      setExecutionResult(data);
      alert(`Succès: ${data.successful} paiements exécutés, ${data.failed} échecs`);

      // Recharger l'optimisation pour voir les nouveaux statuts
      handleOptimize();
    } catch (_err: unknown) {
      logger.error("Error executing payments:", err);
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedStrategy = STRATEGIES.find((s) => s.value === strategy);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Optimisation des paiements</h3>
            <p className="text-sm text-muted-foreground">
              Générez un plan de paiement optimisé selon vos contraintes
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Stratégie */}
          <div className="space-y-2">
            <Label htmlFor="strategy">Stratégie d'optimisation</Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger id="strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map((strat) => (
                  <SelectItem key={strat.value} value={strat.value}>
                    {strat.icon} {strat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStrategy && (
              <p className="text-xs text-muted-foreground">{selectedStrategy.description}</p>
            )}
          </div>

          {/* Montant max journalier */}
          <div className="space-y-2">
            <Label htmlFor="maxDailyAmount">Montant maximum journalier (€)</Label>
            <Input
              id="maxDailyAmount"
              type="number"
              placeholder="Pas de limite"
              value={maxDailyAmount}
              onChange={(e) => setMaxDailyAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Limite de paiements par jour (optionnel)
            </p>
          </div>

          {/* Réserve de trésorerie */}
          <div className="space-y-2">
            <Label htmlFor="targetCashReserve">Réserve de trésorerie cible (€)</Label>
            <Input
              id="targetCashReserve"
              type="number"
              value={targetCashReserve}
              onChange={(e) => setTargetCashReserve(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Montant minimum à conserver sur les comptes
            </p>
          </div>

          {/* Bouton optimiser */}
          <div className="flex items-end">
            <Button onClick={handleOptimize} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimisation en cours...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Optimiser le plan
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </Card>

      {/* Résultats */}
      {result && (
        <>
          {/* Actions */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {result.forecastingUsed === "prophet" && (
                    <p className="text-sm text-blue-600 dark:!text-blue-400">
                      ✨ Ce plan utilise le forecasting ML (Prophet) pour optimiser les dates de
                      paiement
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportPdf} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
              </div>

              {/* Exécution des paiements */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Label htmlFor="account-select">Compte pour les paiements</Label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger id="account-select">
                      <SelectValue placeholder="Sélectionner un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} - {account.balance.toFixed(2)} {account.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6">
                  <Button
                    onClick={handleExecutePayments}
                    disabled={isExecuting || !selectedAccountId || result.metrics.scheduledInvoices === 0}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exécution...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Exécuter {result.metrics.scheduledInvoices} paiement(s)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Métriques principales */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Factures planifiées</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.metrics.scheduledInvoices}/{result.metrics.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {result.metrics.insufficientFunds > 0 && (
                  <span className="text-red-600">
                    {result.metrics.insufficientFunds} sans fonds
                  </span>
                )}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Montant factures</span>
                <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.metrics.totalAmount.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cash dispo: {result.availableCash.toFixed(2)} €
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taux de ponctualité</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.metrics.onTimeRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {result.metrics.paymentsOnTime} à temps, {result.metrics.paymentsLate} en retard
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Délai moyen</span>
                <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.metrics.averagePaymentDelay} jours
              </div>
              <p className="text-xs text-muted-foreground mt-1">Par rapport à l'échéance</p>
            </Card>
          </div>

          {/* Métriques financières */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pénalités de retard</span>
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {result.metrics.totalPenalties > 0 && "+"}
                {result.metrics.totalPenalties.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Coût des paiements en retard
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Remises obtenues</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {result.metrics.totalDiscounts > 0 && "-"}
                {result.metrics.totalDiscounts.toFixed(2)} €
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Économies sur paiements anticipés
              </p>
            </Card>

            <Card className={`p-4 ${result.metrics.netSavings > 0 ? "border-green-500" : result.metrics.netSavings < 0 ? "border-red-500" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Coût total</span>
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.metrics.totalCost.toFixed(2)} €
              </div>
              <p className={`text-xs mt-1 ${result.metrics.netSavings > 0 ? "text-green-600" : result.metrics.netSavings < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {result.metrics.netSavings > 0 ? "Économie" : result.metrics.netSavings < 0 ? "Surcoût" : "Neutre"}: {Math.abs(result.metrics.netSavings).toFixed(2)} €
              </p>
            </Card>
          </div>

          {result.forecastingUsed === "prophet" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-100">
              ✨ Ce plan utilise le forecasting ML (Prophet) pour optimiser les dates de paiement selon le cash flow prévu
            </div>
          )}

          {/* Visualisation graphique */}
          {result.plan.filter((p) => p.status === "SCHEDULED").length > 0 && (
            <PaymentPlanChart
              plan={result.plan}
              availableCash={result.availableCash}
              targetCashReserve={result.targetCashReserve}
            />
          )}

          {/* Plan détaillé */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan de paiement détaillé</h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.plan.map((item) => (
                <div
                  key={item.invoiceId}
                  className={`p-4 border rounded-lg ${
                    item.status === "INSUFFICIENT_FUNDS"
                      ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{item.supplierName}</span>
                        <Badge
                          variant={
                            item.status === "INSUFFICIENT_FUNDS" ? "destructive" : "default"
                          }
                        >
                          {item.status === "SCHEDULED" ? "Planifié" : "Fonds insuffisants"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {item.invoiceNumber} • {item.amount.toFixed(2)} €
                        {item.penalty && item.penalty > 0 && (
                          <span className="text-red-600 ml-2">
                            +{item.penalty.toFixed(2)}€ pénalité
                          </span>
                        )}
                        {item.discount && item.discount > 0 && (
                          <span className="text-green-600 ml-2">
                            -{item.discount.toFixed(2)}€ remise
                          </span>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Échéance: </span>
                        <span className="text-gray-900 dark:text-white">{format(new Date(item.dueDate), "d MMM yyyy", { locale: fr })}</span>
                        {item.scheduledDate && (
                          <>
                            <span className="text-muted-foreground"> → Paiement: </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {format(new Date(item.scheduledDate), "d MMM yyyy", {
                                locale: fr,
                              })}
                            </span>
                            {item.daysLate && item.daysLate > 0 && (
                              <span className="text-red-600 text-xs ml-2">
                                ({item.daysLate}j de retard)
                              </span>
                            )}
                            {item.daysEarly && item.daysEarly > 0 && (
                              <span className="text-green-600 text-xs ml-2">
                                ({item.daysEarly}j en avance)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{item.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Score</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{item.score.toFixed(0)}</div>
                      {item.totalCost && item.totalCost !== item.amount && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Total: {item.totalCost.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {result.plan.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Aucune facture à planifier
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
