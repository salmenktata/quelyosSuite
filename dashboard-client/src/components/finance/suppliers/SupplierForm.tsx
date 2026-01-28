/**
 * Formulaire Création/Édition Fournisseur
 *
 * Fonctionnalités :
 * - Création et modification de fournisseurs
 * - Informations de base (nom, email, téléphone, site web)
 * - Informations bancaires (IBAN, BIC)
 * - Catégorisation et importance
 * - Conditions de paiement (délais, pénalités, remises)
 * - Notes internes et tags
 */

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice } from "@/components/common";
import { financeNotices } from "@/lib/notices";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
  iban: string;
  bic: string;
  category: string;
  importance: string;
  defaultPaymentDelay: number;
  latePaymentPenalty: number;
  earlyPaymentDiscount: number;
  notes: string;
  tags: string;
}

interface SupplierFormProps {
  initialData?: Partial<SupplierFormData>;
  supplierId?: string;
  mode: "create" | "edit";
}

export default function SupplierForm({ initialData, supplierId, mode }: SupplierFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SupplierFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    website: initialData?.website || "",
    iban: initialData?.iban || "",
    bic: initialData?.bic || "",
    category: initialData?.category || "REGULAR",
    importance: initialData?.importance || "NORMAL",
    defaultPaymentDelay: initialData?.defaultPaymentDelay || 30,
    latePaymentPenalty: initialData?.latePaymentPenalty || 0,
    earlyPaymentDiscount: initialData?.earlyPaymentDiscount || 0,
    notes: initialData?.notes || "",
    tags: initialData?.tags || "",
  });

  const handleChange = (field: keyof SupplierFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Convertir tags string en array
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        ...formData,
        tags: tagsArray,
        defaultPaymentDelay: Number(formData.defaultPaymentDelay),
        latePaymentPenalty: Number(formData.latePaymentPenalty),
        earlyPaymentDiscount: Number(formData.earlyPaymentDiscount),
      };

      const url = mode === "create"
        ? "/api/ecommerce/suppliers"
        : `/api/ecommerce/suppliers/${supplierId}`;

      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      navigate("/finance/suppliers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Fournisseurs', href: '/finance/suppliers' },
            { label: mode === 'create' ? 'Nouveau' : 'Modifier' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Nouveau fournisseur" : "Modifier le fournisseur"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {mode === "create"
                ? "Ajoutez un nouveau fournisseur à votre base"
                : "Modifiez les informations du fournisseur"}
            </p>
          </div>
        </div>

        <PageNotice config={financeNotices.suppliers} className="mb-6" />

        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informations de base</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du fournisseur <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: AWS Europe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@fournisseur.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://www.fournisseur.com"
              />
            </div>
          </div>
        </Card>

        {/* Informations bancaires */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informations bancaires</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleChange("iban", e.target.value)}
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bic">BIC/SWIFT</Label>
              <Input
                id="bic"
                value={formData.bic}
                onChange={(e) => handleChange("bic", e.target.value)}
                placeholder="BNPAFRPP"
              />
            </div>
          </div>
        </Card>

        {/* Catégorisation */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Catégorisation</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRATEGIC">Stratégique</SelectItem>
                  <SelectItem value="REGULAR">Régulier</SelectItem>
                  <SelectItem value="OCCASIONAL">Occasionnel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Fréquence de collaboration avec ce fournisseur
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance">Importance</Label>
              <Select value={formData.importance} onValueChange={(value) => handleChange("importance", value)}>
                <SelectTrigger id="importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critique</SelectItem>
                  <SelectItem value="HIGH">Haute</SelectItem>
                  <SelectItem value="NORMAL">Normale</SelectItem>
                  <SelectItem value="LOW">Basse</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Priorité de paiement pour ce fournisseur
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="IT, Cloud, Infrastructure"
              />
            </div>
          </div>
        </Card>

        {/* Conditions de paiement */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Conditions de paiement</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentDelay">Délai de paiement (jours)</Label>
              <Input
                id="defaultPaymentDelay"
                type="number"
                value={formData.defaultPaymentDelay}
                onChange={(e) => handleChange("defaultPaymentDelay", Number(e.target.value))}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Ex: 30 jours</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="latePaymentPenalty">Pénalité de retard (%/jour)</Label>
              <Input
                id="latePaymentPenalty"
                type="number"
                step="0.1"
                value={formData.latePaymentPenalty}
                onChange={(e) => handleChange("latePaymentPenalty", Number(e.target.value))}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Ex: 0.5%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="earlyPaymentDiscount">Remise anticipée (%)</Label>
              <Input
                id="earlyPaymentDiscount"
                type="number"
                step="0.1"
                value={formData.earlyPaymentDiscount}
                onChange={(e) => handleChange("earlyPaymentDiscount", Number(e.target.value))}
                min="0"
              />
              <p className="text-xs text-muted-foreground">Ex: 2%</p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Ajoutez des notes ou remarques sur ce fournisseur..."
              rows={4}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </form>
      </div>
    </Layout>
  );
}
