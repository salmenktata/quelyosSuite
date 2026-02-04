/**
 * Zones de Livraison - Gestion zones géographiques et tarifs
 *
 * Fonctionnalités :
 * - Définition zones géographiques (pays, régions)
 * - Tarifs différenciés par zone
 * - Délais de livraison estimés par zone
 * - Seuil livraison gratuite par zone
 * - Restrictions produits par zone
 */

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { MapPin, Save, Loader2, Gift, Info, Truck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ShippingZone {
  code: string;
  label: string;
  price: number;
  governorates: string[];
}

interface ShippingZonesResponse {
  success: boolean;
  zones: ShippingZone[];
  free_threshold: number;
  error?: string;
}

async function fetchShippingZones(): Promise<ShippingZonesResponse> {
  const response = await api.post<ShippingZonesResponse>("/api/admin/shipping/zones");
  return response.data;
}

async function updateShippingZones(data: {
  zones: Record<string, number>;
  free_threshold: number;
}): Promise<{ success: boolean; error?: string }> {
  const response = await api.post<{ success: boolean; error?: string }>(
    "/api/admin/shipping/zones/update",
    data
  );
  return response.data;
}

export default function ShippingZonesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: fetchShippingZones,
  });

  const [zonePrices, setZonePrices] = useState<Record<string, number>>({
    "grand-tunis": 7,
    nord: 9,
    centre: 9,
    sud: 12,
  });
  const [freeThreshold, setFreeThreshold] = useState(150);

  useEffect(() => {
    if (data?.success && data.zones) {
      const prices: Record<string, number> = {};
      for (const zone of data.zones) {
        prices[zone.code] = zone.price;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZonePrices(prices);
      setFreeThreshold(data.free_threshold);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateShippingZones,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Zones de livraison mises à jour");
        queryClient.invalidateQueries({ queryKey: ["shipping-zones"] });
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      zones: zonePrices,
      free_threshold: freeThreshold,
    });
  };

  const handlePriceChange = (zoneCode: string, value: string) => {
    const price = parseFloat(value) || 0;
    setZonePrices((prev) => ({ ...prev, [zoneCode]: price }));
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Boutique", href: "/store" },
            { label: "Paramètres", href: "/store/settings" },
            { label: "Zones de livraison", href: "/store/settings/shipping-zones" },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (error || (data && !data.success)) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Boutique", href: "/store" },
            { label: "Paramètres", href: "/store/settings" },
            { label: "Zones de livraison", href: "/store/settings/shipping-zones" },
          ]}
        />
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-red-800 dark:text-red-200">
            Erreur lors du chargement des zones. Vérifiez la configuration backend.
          </p>
        </div>
      </div>
    );
  }

  const zones = data?.zones || [];

  return (
    <>
      <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Boutique", href: "/store" },
          { label: "Paramètres", href: "/store/settings" },
          { label: "Zones de livraison", href: "/store/settings/shipping-zones" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
            <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Zones de livraison
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tarifs par gouvernorat - Tunisie
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          icon={
            updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )
          }
        >
          Enregistrer
        </Button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Ces tarifs sont appliqués automatiquement lors du checkout selon le gouvernorat sélectionné par le client.
          </p>
        </div>
      </div>

      {/* Free Shipping Threshold */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Livraison gratuite
          </h2>
        </div>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
            Seuil minimum du panier
          </label>
          <div className="relative">
            <input
              type="number"
              value={freeThreshold}
              onChange={(e) => setFreeThreshold(parseFloat(e.target.value) || 0)}
              min={0}
              step={10}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 pr-16 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
              TND
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Livraison gratuite pour les commandes dépassant ce montant. Mettre 0 pour désactiver.
          </p>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tarifs par zone
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {zones.map((zone) => (
            <div
              key={zone.code}
              className="p-6 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {zone.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {zone.governorates.join(", ")}
                </p>
              </div>
              <div className="w-full md:w-40">
                <div className="relative">
                  <input
                    type="number"
                    value={zonePrices[zone.code] ?? zone.price}
                    onChange={(e) => handlePriceChange(zone.code, e.target.value)}
                    min={0}
                    step={0.5}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-16 text-gray-900 dark:text-white text-right focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                    TND
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Aucune zone configurée. Contactez l'administrateur système.
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-6">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4">
          Aperçu tarifs client
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(zonePrices).map(([code, price]) => {
            const zone = zones.find((z) => z.code === code);
            return (
              <div
                key={code}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-800"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {zone?.label || code}
                </p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {price.toFixed(2)} TND
                </p>
              </div>
            );
          })}
        </div>
        {freeThreshold > 0 && (
          <p className="mt-4 text-sm text-indigo-800 dark:text-indigo-200">
            Livraison gratuite dès {freeThreshold.toFixed(0)} TND d'achat
          </p>
        )}
      </div>
      </div>
    </>
  );
}
