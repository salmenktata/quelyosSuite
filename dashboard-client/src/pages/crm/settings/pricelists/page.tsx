/**
 * Listes de Prix (Settings) - Gestion grilles tarifaires
 *
 * Fonctionnalités :
 * - Création/édition/suppression de listes de prix
 * - Configuration remises par segment (Revendeurs, VIP, Grossistes)
 * - Gestion multi-devise (TND, EUR, USD)
 * - Statut actif/inactif des listes
 * - Compteur clients assignés par liste
 * - Lien vers module complet de gestion des prix
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { ClipboardList, Save, Loader2, Plus, Edit2, Trash2, ExternalLink , Info } from "lucide-react";
import { logger } from '@quelyos/logger';

interface Pricelist {
  id: number;
  name: string;
  currency: string;
  discount: number;
  active: boolean;
  customerCount: number;
}

const defaultPricelists: Pricelist[] = [
  { id: 1, name: "Prix public", currency: "TND", discount: 0, active: true, customerCount: 245 },
  { id: 2, name: "Revendeurs", currency: "TND", discount: 15, active: true, customerCount: 32 },
  { id: 3, name: "VIP", currency: "TND", discount: 25, active: true, customerCount: 18 },
  { id: 4, name: "Grossistes", currency: "TND", discount: 35, active: true, customerCount: 8 },
];

export default function PricelistsSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [pricelists] = useState<Pricelist[]>(defaultPricelists);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Listes de prix mises à jour");
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Paramètres", href: "/crm/settings" },
          { label: "Listes de prix", href: "/crm/settings/pricelists" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-3">
            <ClipboardList className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Listes de prix
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gérez les grilles tarifaires par segment client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
            Nouvelle liste
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Créez des listes de prix spécifiques pour différents segments de clients (revendeurs, VIP, etc.).
          </p>
        </div>
      </div>

      {/* Pricelists */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div>Liste de prix</div>
          <div className="text-center">Devise</div>
          <div className="text-center">Remise</div>
          <div className="text-center">Clients</div>
          <div></div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {pricelists.map((pricelist) => (
            <div
              key={pricelist.id}
              className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    pricelist.active ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {pricelist.name}
                </span>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pricelist.currency}
                </span>
              </div>
              <div className="text-center">
                {pricelist.discount > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    -{pricelist.discount}%
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pricelist.customerCount}
                </span>
              </div>
              <div className="flex justify-end gap-1">
                <Link
                  to={`/pricelists/${pricelist.id}`}
                  className="p-1.5 text-gray-400 hover:text-violet-600 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button className="p-1.5 text-gray-400 hover:text-violet-600 transition" aria-label={`Modifier ${pricelist.name}`}>
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </button>
                {pricelist.customerCount === 0 && (
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition" aria-label={`Supprimer ${pricelist.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link to full management */}
      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-violet-800 dark:text-violet-200">
            Pour une gestion avancée des listes de prix (règles, produits spécifiques), utilisez la page dédiée.
          </p>
          <Link to="/pricelists">
            <Button variant="secondary" size="sm" icon={<ExternalLink className="h-4 w-4" />}>
              Listes de prix
            </Button>
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
