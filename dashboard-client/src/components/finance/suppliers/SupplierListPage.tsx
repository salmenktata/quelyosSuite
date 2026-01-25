"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search, Building2, FileText, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [filters, setFilters] = useState({
    category: "all",
    importance: "all",
    search: "",
  });

  // Stats
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

      const response = await fetch(`/api/v1/finance/suppliers?${params}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des fournisseurs");
      }

      const data = await response.json();
      setSuppliers(data.suppliers);

      // Calculer les stats
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
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Fournisseurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos fournisseurs et planifiez vos paiements
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/suppliers/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total fournisseurs</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Building2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Stratégiques</div>
              <div className="text-2xl font-bold">{stats.strategic}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Réguliers</div>
              <div className="text-2xl font-bold">{stats.regular}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Factures actives</div>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              <SelectItem value="STRATEGIC">Stratégique</SelectItem>
              <SelectItem value="REGULAR">Régulier</SelectItem>
              <SelectItem value="OCCASIONAL">Occasionnel</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.importance}
            onValueChange={(value) => handleFilterChange("importance", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les importances</SelectItem>
              <SelectItem value="CRITICAL">Critique</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="NORMAL">Normale</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/payment-planning")}
            className="w-full"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Planning paiements
          </Button>
        </div>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Liste des fournisseurs */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun fournisseur</h3>
          <p className="text-muted-foreground mb-4">
            {filters.search || filters.category !== "all" || filters.importance !== "all"
              ? "Aucun fournisseur ne correspond à vos filtres"
              : "Commencez par ajouter votre premier fournisseur"}
          </p>
          <Button onClick={() => router.push("/dashboard/suppliers/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un fournisseur
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onRefresh={fetchSuppliers} />
          ))}
        </div>
      )}
    </div>
  );
}
