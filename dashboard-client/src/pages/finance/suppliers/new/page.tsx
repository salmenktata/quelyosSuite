import SupplierForm from "@/components/finance/suppliers/SupplierForm";

export const metadata = {
  title: "Nouveau fournisseur - Quelyos",
  description: "Ajoutez un nouveau fournisseur",
};

export default function NewSupplierPage() {
  return <SupplierForm mode="create" />;
}
