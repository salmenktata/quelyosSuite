

import React, { useEffect, useState, useCallback } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { ROUTES } from "@/lib/finance/compat/routes";
import { GlassCard, GlassPanel, GlassListItem } from "@/components/ui/glass";
import { Button, Input } from "@/lib/finance/compat/ui";
import { Switch } from "@/components/ui/Switch";
import { ChevronLeft, Plus, Edit2, Trash2, CreditCard, Banknote, FileText, ArrowLeftRight, Landmark, Receipt, Briefcase, AlertCircle, MoreHorizontal, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { FlowType } from "@/types/paymentFlow";

// Types de flux avec labels et icônes
const FLOW_TYPE_CONFIG: Record<FlowType, { label: string; icon: React.ReactNode; description: string }> = {
  CASH: {
    label: "Espèces",
    icon: <Banknote className="h-5 w-5" />,
    description: "Paiements en espèces",
  },
  CARD: {
    label: "Carte bancaire",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Cartes de crédit et débit",
  },
  CHECK: {
    label: "Chèque",
    icon: <FileText className="h-5 w-5" />,
    description: "Paiements par chèque",
  },
  TRANSFER: {
    label: "Virement",
    icon: <ArrowLeftRight className="h-5 w-5" />,
    description: "Virements bancaires",
  },
  DIRECT_DEBIT: {
    label: "Prélèvement",
    icon: <Landmark className="h-5 w-5" />,
    description: "Prélèvements automatiques",
  },
  BILL_OF_EXCHANGE: {
    label: "Lettre de change",
    icon: <Receipt className="h-5 w-5" />,
    description: "Traites et lettres de change",
  },
  PROMISSORY_NOTE: {
    label: "Billet à ordre",
    icon: <Briefcase className="h-5 w-5" />,
    description: "Billets à ordre commerciaux",
  },
  BANK_CHARGE: {
    label: "Frais bancaires",
    icon: <AlertCircle className="h-5 w-5" />,
    description: "Agios, commissions, frais",
  },
  OTHER: {
    label: "Autre",
    icon: <MoreHorizontal className="h-5 w-5" />,
    description: "Autres types de flux",
  },
};

interface FlowTypeSettings {
  type: FlowType;
  enabled: boolean;
  customName?: string;
}

interface CustomFlowType {
  id: string;
  name: string;
  enabled: boolean;
}

export default function FluxSettingsPage() {
  useRequireAuth();
  
  // État des types de flux par défaut (activés/désactivés pour l'entreprise)
  const [flowTypeSettings, setFlowTypeSettings] = useState<FlowTypeSettings[]>([]);
  const [customFlowTypes, setCustomFlowTypes] = useState<CustomFlowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pour ajouter un type personnalisé
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState("");
  
  // Pour la suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Charger les paramètres
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      // Initialiser avec tous les types activés par défaut
      const defaultSettings: FlowTypeSettings[] = (Object.keys(FLOW_TYPE_CONFIG) as FlowType[]).map((type) => ({
        type,
        enabled: true,
        customName: undefined,
      }));
      
      // TODO: Charger les vrais paramètres depuis l'API /company/flow-settings
      // Pour l'instant, on utilise les paramètres par défaut
      setFlowTypeSettings(defaultSettings);
      setCustomFlowTypes([]);
    } catch (e) {
      console.error("Erreur chargement paramètres flux:", e);
      setError("Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Basculer l'activation d'un type
  const toggleFlowType = (type: FlowType) => {
    setFlowTypeSettings((prev) =>
      prev.map((s) => (s.type === type ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Ajouter un type personnalisé
  const addCustomType = () => {
    if (!newCustomName.trim()) return;
    
    const newCustom: CustomFlowType = {
      id: `custom-${Date.now()}`,
      name: newCustomName.trim(),
      enabled: true,
    };
    
    setCustomFlowTypes((prev) => [...prev, newCustom]);
    setNewCustomName("");
    setShowAddCustom(false);
    setSuccess("Type personnalisé ajouté");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Supprimer un type personnalisé
  const handleDeleteCustom = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCustom = () => {
    if (!deleteTarget) return;
    setCustomFlowTypes((prev) => prev.filter((c) => c.id !== deleteTarget));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setSuccess("Type personnalisé supprimé");
    setTimeout(() => setSuccess(null), 3000);
  };

  // Basculer un type personnalisé
  const toggleCustomType = (id: string) => {
    setCustomFlowTypes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    try {
      // TODO: Appeler l'API pour sauvegarder
      // await api("/company/flow-settings", {
      //   method: "PUT",
      //   body: JSON.stringify({ flowTypeSettings, customFlowTypes }),
      // });
      
      setSuccess("Paramètres sauvegardés avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#1e293b] to-[#0f172a] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#18181b] via-[#1e293b] to-[#0f172a] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={ROUTES.FINANCE.DASHBOARD.SETTINGS}>
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Flux de paiement</h1>
            <p className="text-white/60 text-sm">
              Configurez les types de flux disponibles pour vos comptes
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Types de flux par défaut */}
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Types de flux par défaut</h2>
          <p className="text-white/60 text-sm mb-6">
            Activez ou désactivez les types de flux disponibles lors de la création de flux sur vos comptes.
          </p>
          
          <div className="space-y-3">
            {flowTypeSettings.map((setting) => {
              const config = FLOW_TYPE_CONFIG[setting.type];
              return (
                <GlassListItem
                  key={setting.type}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${setting.enabled ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10 text-white/40'}`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className={`font-medium ${setting.enabled ? 'text-white' : 'text-white/50'}`}>
                        {config.label}
                      </p>
                      <p className={`text-sm ${setting.enabled ? 'text-white/60' : 'text-white/30'}`}>
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onChange={() => toggleFlowType(setting.type)}
                  />
                </GlassListItem>
              );
            })}
          </div>
        </GlassCard>

        {/* Types personnalisés */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Types personnalisés</h2>
              <p className="text-white/60 text-sm">
                Créez vos propres types de flux pour des besoins spécifiques.
              </p>
            </div>
            {!showAddCustom && (
              <Button
                onClick={() => setShowAddCustom(true)}
                variant="outline"
                size="sm"
                className="border-sky-500/50 text-sky-400 hover:bg-sky-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAddCustom && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <label htmlFor="customName" className="text-white/80 text-sm block mb-2">
                Nom du type personnalisé
              </label>
              <div className="flex gap-2">
                <Input
                  id="customName"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="Ex: PayPal, Crypto, Mobile Money..."
                  className="flex-1 bg-white/10 border-white/20 text-white"
                  onKeyDown={(e) => e.key === "Enter" && addCustomType()}
                />
                <Button
                  onClick={addCustomType}
                  disabled={!newCustomName.trim()}
                  size="icon"
                  className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setShowAddCustom(false);
                    setNewCustomName("");
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Liste des types personnalisés */}
          {customFlowTypes.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <MoreHorizontal className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Aucun type personnalisé</p>
              <p className="text-sm">Cliquez sur &quot;Ajouter&quot; pour créer un nouveau type</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customFlowTypes.map((custom) => (
                <GlassListItem
                  key={custom.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${custom.enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-white/40'}`}>
                      <MoreHorizontal className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-medium ${custom.enabled ? 'text-white' : 'text-white/50'}`}>
                        {custom.name}
                      </p>
                      <p className={`text-sm ${custom.enabled ? 'text-white/60' : 'text-white/30'}`}>
                        Type personnalisé
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={custom.enabled}
                      onChange={() => toggleCustomType(custom.id)}
                    />
                    <Button
                      onClick={() => handleDeleteCustom(custom.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400/60 hover:text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassListItem>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Info */}
        <GlassPanel className="p-4 border-sky-500/30 bg-sky-500/10">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/80">
              <p className="font-medium text-sky-300 mb-1">Comment ça fonctionne ?</p>
              <p>
                Ces paramètres définissent les types de flux disponibles lors de la création 
                d&apos;un nouveau flux sur un compte. Les flux déjà créés ne sont pas affectés 
                par ces changements.
              </p>
            </div>
          </div>
        </GlassPanel>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link to={ROUTES.FINANCE.DASHBOARD.SETTINGS}>
            <Button variant="ghost" className="text-white/70 hover:text-white">
              Annuler
            </Button>
          </Link>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Supprimer le type personnalisé</h3>
            </div>
            <p className="text-white/70 mb-6">
              Êtes-vous sûr de vouloir supprimer ce type personnalisé ? Les flux existants utilisant ce type ne seront pas affectés.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="text-white/70 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDeleteCustom}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
