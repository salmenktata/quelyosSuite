'use client';

import { useState } from 'react';
import type { ThemeContextValue } from '../../../../engine/types';
import { Mail, Phone, MapPin } from 'lucide-react';

interface FormAndInfoProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function FormAndInfo({ config, className = '', theme }: FormAndInfoProps) {
  const title = (config?.title as string) || 'Contactez-Nous';
  const subtitle = (config?.subtitle as string) || 'Notre équipe est à votre écoute';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // TODO: Appel API backend
      // await fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) });

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section className={`py-16 md:py-24 bg-white dark:bg-gray-900 ${className}`}>
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white"
            style={{ fontFamily: `var(--theme-font-headings)` }}
          >
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Nos Coordonnées
            </h3>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Mail size={24} style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Email</h4>
                  <a
                    href="mailto:contact@example.com"
                    className="text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    contact@example.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <Phone size={24} style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Téléphone</h4>
                  <a
                    href="tel:+21612345678"
                    className="text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    +216 12 345 678
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <MapPin size={24} style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Adresse</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Avenue Habib Bourguiba<br />
                    Tunis 1000, Tunisie
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                Horaires d&apos;ouverture
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Lun - Ven : 9h00 - 18h00<br />
                Sam : 10h00 - 14h00<br />
                Dim : Fermé
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Envoyez-nous un Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 resize-none"
                  style={{ '--tw-ring-color': theme.colors.primary } as React.CSSProperties}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-8 py-4 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#ffffff',
                }}
              >
                {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>

              {status === 'success' && (
                <p className="text-center text-green-600 dark:text-green-400 font-semibold">
                  ✓ Message envoyé avec succès !
                </p>
              )}
              {status === 'error' && (
                <p className="text-center text-red-600 dark:text-red-400 font-semibold">
                  ✗ Une erreur est survenue. Veuillez réessayer.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
