'use client';

import { useState } from 'react';
import { useToast } from '@/store/toastStore';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const toast = useToast();

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Inscription réussie ! Merci de votre confiance');
      setEmail('');
    } catch {
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    }
  };

  return (
    <form onSubmit={handleNewsletter} className="max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 transition-shadow"
            required
          />
          <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
        <button
          type="submit"
          className="bg-white text-primary px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!email}
        >
          S'inscrire
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
      <p className="mt-4 text-sm text-white/70">
        Vos donnees sont protegees. Desabonnement en un clic.
      </p>
    </form>
  );
}
