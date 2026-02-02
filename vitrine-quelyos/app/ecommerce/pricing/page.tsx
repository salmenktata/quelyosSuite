import { redirect } from 'next/navigation';

export default function EcommercePricingRedirect() {
  redirect('/tarifs?module=store');
}
