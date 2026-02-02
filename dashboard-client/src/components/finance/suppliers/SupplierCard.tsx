import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Mail,
  Phone,
  FileText,
  CreditCard,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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

interface SupplierCardProps {
  supplier: Supplier;
  onRefresh?: () => void;
}

export default function SupplierCard({ supplier, onRefresh }: SupplierCardProps) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
      STRATEGIC: { variant: "destructive", label: "Stratégique" },
      REGULAR: { variant: "default", label: "Régulier" },
      OCCASIONAL: { variant: "secondary", label: "Occasionnel" },
    };
    const config = variants[category] || variants.REGULAR;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getImportanceBadge = (importance: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      CRITICAL: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", label: "Critique" },
      HIGH: { color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800", label: "Haute" },
      NORMAL: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800", label: "Normale" },
      LOW: { color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700", label: "Basse" },
    };
    const config = variants[importance] || variants.NORMAL;
    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${supplier.name} ?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ecommerce/suppliers/${supplier.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">{supplier.name}</h3>
            <div className="flex gap-2 mt-1">
              {getCategoryBadge(supplier.category)}
              {getImportanceBadge(supplier.importance)}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/finance/suppliers/${supplier.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/finance/suppliers/${supplier.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Suppression..." : "Supprimer"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Informations de contact */}
      <div className="space-y-2 mb-4">
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{supplier.phone}</span>
          </div>
        )}
      </div>

      {/* Délai de paiement */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Délai de paiement</div>
        <div className="font-semibold text-gray-900 dark:text-white">{supplier.defaultPaymentDelay} jours</div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Factures</div>
            <div className="font-semibold text-gray-900 dark:text-white">{supplier._count.invoices}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Paiements</div>
            <div className="font-semibold text-gray-900 dark:text-white">{supplier._count.payments}</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-4 pt-4 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/finance/suppliers/${supplier.id}`)}
        >
          Voir détails
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/finance/suppliers/${supplier.id}/invoices/new`)}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
