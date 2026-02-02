import { redirect } from 'next/navigation';

export default function EcommerceSignupRedirect() {
  redirect('/register?module=store');
}
