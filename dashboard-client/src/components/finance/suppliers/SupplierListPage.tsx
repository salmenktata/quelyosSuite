"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModularLayout } from "@/components/ModularLayout";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import SupplierCard from "./SupplierCard";

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  category: string;
  importance: string;
  defaultPaymentDelay: number;
  _count: {
    invoices: number;
    payments: number;
  };
}

export default function SupplierListPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category: "all",
    importance: "all",
    search: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    strategic: 0,
    regular: 0,
    occasional: 0,
    totalInvoices: 0,
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filters]);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.importance !== "all") params.append("importance", filters.importance);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(`/api/ecommerce/suppliers?${params}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des fournisseurs");
      }

      const data = await response.json();
      setSuppliers(data.suppliers);

      const strategic = data.suppliers.filter((s: Supplier) => s.category === "STRATEGIC").length;
      const regular = data.suppliers.filter((s: Supplier) => s.category === "REGULAR").length;
      const occasional = data.suppliers.filter((s: Supplier) => s.category === "OCCASIONAL").length;
      const totalInvoices = data.suppliers.reduce(
        (sum: number, s: Supplier) => sum + s._count.invoices,
        0
      );

      setStats({
        total: data.suppliers.length,
        strategic,
        regular,
        occasional,
        totalInvoices,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ModularLayout>
      <div className="p-8 space-y-6">
        <PageHeader
          icon={BuildingOfficeIcon}
          title="Fournisseurs"
          description="Gérez vos fournisseurs et planifiez vos paiements"
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: "Fournisseurs" },
          ]}
          actions={
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => navigate("/finance/suppliers/new")}
            >
              <PlusIcon className="h-5 w-5" />
              Nouveau fournisseur
            </Button>
          }
        />

        {/* Statistiques rapides */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total fournisseurs</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Stratégiques</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.strategic}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Réguliers</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.regular}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Factures actives</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInvoices}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un fournisseur..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Toutes les catégories</option>
              <option value="STRATEGIC">Stratégique</option>
              <option value="REGULAR">Régulier</option>
              <option value="OCCASIONAL">Occasionnel</option>
            </select>

            <select
              value={filters.importance}
              onChange={(e) => handleFilterChange("importance", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Toutes les importances</option>
              <option value="CRITICAL">Critique</option>
              <option value="HIGH">Haute</option>
              <option value="NORMAL">Normale</option>
              <option value="LOW">Basse</option>
            </select>

            <Button
              variant="outline"
              onClick={() => navigate("/finance/payment-planning")}
              className="w-full gap-2"
            >
              <CreditCardIcon className="h-4 w-4" />
              Planning paiements
            </Button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Liste des fournisseurs */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <BuildingOfficeIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun fournisseur
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {filters.search || filters.category !== "all" || filters.importance !== "all"
                ? "Aucun fournisseur ne correspond à vos filtres"
                : "Commencez par ajouter votre premier fournisseur"}
            </p>
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => navigate("/finance/suppliers/new")}
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter un fournisseur
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} onRefresh={fetchSuppliers} />
            ))}
          </div>
        )}
      </div>
    </ModularLayout>
  );
}
