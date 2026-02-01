import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api-base";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Loader2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from '@quelyos/logger';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  strategy: string;
  maxDailyAmount: number | null;
  targetCashReserve: number | null;
  totalAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliedAt: string | null;
  createdAt: string;
  _count?: {
    invoices: number;
  };
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    supplier: {
      name: string;
    };
  }>;
}

const STRATEGIES = {
  BY_DUE_DATE: "Par date d'échéance",
  BY_IMPORTANCE: "Par importance",
  MINIMIZE_PENALTIES: "Minimiser les pénalités",
  MAXIMIZE_DISCOUNTS: "Maximiser les remises",
  OPTIMIZE_CASH_FLOW: "Optimiser la trésorerie",
};

export default function ScenariosPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire création
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    strategy: "BY_DUE_DATE",
    maxDailyAmount: "",
    targetCashReserve: "10000",
    invoices: [] as string[],
  });

  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetchScenarios();
    fetchAvailableInvoices();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<{ scenarios: Scenario[] }>("/api/ecommerce/payment-planning/scenarios", { method: "GET", credentials: "include" });
      setScenarios(data.scenarios || []);
    } catch (error) {
      logger.error("Erreur lors du chargement des scénarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableInvoices = async () => {
    try {
      const data = await fetchApi<{ invoices: Record<string, unknown>[] }>("/api/finance/supplier-invoices/upcoming?days=90", { method: "GET", credentials: "include" });
      setAvailableInvoices(data.invoices || []);
    } catch (error) {
      logger.error("Erreur lors du chargement des factures:", error);
    }
  };

  const handleCreateScenario = async () => {
    if (!formData.name || formData.invoices.length === 0) {
      setError("Le nom et au moins une facture sont requis");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await fetchApi("/api/ecommerce/payment-planning/scenarios", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          strategy: formData.strategy,
          maxDailyAmount: formData.maxDailyAmount ? parseFloat(formData.maxDailyAmount) : null,
          targetCashReserve: parseFloat(formData.targetCashReserve),
          invoices: formData.invoices,
        }),
      });

      await fetchScenarios();
      setShowCreateDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateScenario = async (scenarioId: string) => {
    try {
      await fetchApi(`/api/ecommerce/payment-planning/scenarios/${scenarioId}/activate`, {
        method: "PUT",
        credentials: "include",
      });

      await fetchScenarios();
    } catch (error) {
      logger.error("Erreur lors de l'activation:", error);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce scénario ?")) {
      return;
    }

    try {
      await fetchApi(`/api/ecommerce/payment-planning/scenarios/${scenarioId}`, {
        method: "DELETE",
        credentials: "include",
      });

      await fetchScenarios();
      if (selectedScenario?.id === scenarioId) {
        setSelectedScenario(null);
      }
    } catch (error) {
      logger.error("Erreur lors de la suppression:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      strategy: "BY_DUE_DATE",
      maxDailyAmount: "",
      targetCashReserve: "10000",
      invoices: [],
    });
    setError(null);
  };

  const toggleInvoiceSelection = (invoiceId: string) => {
    setFormData((prev) => ({
      ...prev,
      invoices: prev.invoices.includes(invoiceId)
        ? prev.invoices.filter((id) => id !== invoiceId)
        : [...prev.invoices, invoiceId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Scénarios de paiement</h3>
              <p className="text-sm text-muted-foreground">
                Créez et comparez différentes stratégies de paiement
              </p>
            </div>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouveau scénario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un scénario de paiement</DialogTitle>
                <DialogDescription>
                  Configurez un nouveau scénario de planification des paiements
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du scénario *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Plan Q1 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez l'objectif de ce scénario..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Stratégie */}
                <div className="space-y-2">
                  <Label htmlFor="strategy">Stratégie d'optimisation</Label>
                  <Select
                    value={formData.strategy}
                    onValueChange={(value) => setFormData({ ...formData, strategy: value })}
                  >
                    <SelectTrigger id="strategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STRATEGIES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Paramètres */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxDailyAmount">Montant max journalier (€)</Label>
                    <Input
                      id="maxDailyAmount"
                      type="number"
                      placeholder="Optionnel"
                      value={formData.maxDailyAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDailyAmount: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetCashReserve">Réserve de trésorerie (€)</Label>
                    <Input
                      id="targetCashReserve"
                      type="number"
                      value={formData.targetCashReserve}
                      onChange={(e) =>
                        setFormData({ ...formData, targetCashReserve: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Sélection factures */}
                <div className="space-y-2">
                  <Label>Factures à inclure * ({formData.invoices.length} sélectionnées)</Label>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {availableInvoices.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        Aucune facture disponible
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {availableInvoices.map((invoice) => (
                          <label
                            key={invoice.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.invoices.includes(invoice.id)}
                              onChange={() => toggleInvoiceSelection(invoice.id)}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.supplier.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {invoice.invoiceNumber} • Échéance:{" "}
                                {format(new Date(invoice.dueDate), "d MMM yyyy", { locale: fr })}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.amount.toFixed(2)} €</div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div role="alert" className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateScenario} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer le scénario"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Liste des scénarios */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Chargement des scénarios...</p>
        </div>
      ) : scenarios.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4">Aucun scénario</h3>
          <p className="text-muted-foreground mt-2">
            Créez votre premier scénario de planification des paiements
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className={`p-4 cursor-pointer transition ${
                selectedScenario?.id === scenario.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{scenario.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scenario.description || "Pas de description"}
                  </p>
                </div>
                {scenario.isActive && (
                  <Badge variant="default" className="ml-2">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {STRATEGIES[scenario.strategy as keyof typeof STRATEGIES]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {scenario._count?.invoices || 0} factures
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {format(new Date(scenario.startDate), "d MMM", { locale: fr })} →{" "}
                    {format(new Date(scenario.endDate), "d MMM yyyy", { locale: fr })}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">{scenario.totalAmount.toFixed(2)} €</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!scenario.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateScenario(scenario.id);
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Activer
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteScenario(scenario.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Détails du scénario sélectionné */}
      {selectedScenario && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détails du scénario</h3>

          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <Label>Stratégie</Label>
              <p className="text-sm text-gray-900 dark:text-white">
                {STRATEGIES[selectedScenario.strategy as keyof typeof STRATEGIES]}
              </p>
            </div>

            <div>
              <Label>Période</Label>
              <p className="text-sm text-gray-900 dark:text-white">
                {format(new Date(selectedScenario.startDate), "d MMM yyyy", { locale: fr })} -{" "}
                {format(new Date(selectedScenario.endDate), "d MMM yyyy", { locale: fr })}
              </p>
            </div>

            {selectedScenario.maxDailyAmount && (
              <div>
                <Label>Limite journalière</Label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedScenario.maxDailyAmount.toFixed(2)} €</p>
              </div>
            )}

            {selectedScenario.targetCashReserve && (
              <div>
                <Label>Réserve de trésorerie</Label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedScenario.targetCashReserve.toFixed(2)} €</p>
              </div>
            )}
          </div>

          {selectedScenario.invoices && selectedScenario.invoices.length > 0 && (
            <div>
              <Label className="mb-2 block">Factures incluses ({selectedScenario.invoices.length})</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedScenario.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{invoice.invoiceNumber}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{invoice.amount.toFixed(2)} €</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
