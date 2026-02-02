import { redirect } from 'next/navigation';

export default function FinancePricingRedirect() {
  redirect('/tarifs?module=finance');
}
