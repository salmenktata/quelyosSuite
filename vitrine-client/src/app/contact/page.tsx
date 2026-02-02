'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/store/toastStore';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { backendClient } from '@/lib/backend/client';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const SUBJECT_OPTIONS = [
  { value: '', label: 'Selectionnez un sujet' },
  { value: 'Question generale', label: 'Question generale' },
  { value: 'Question sur une commande', label: 'Question sur une commande' },
  { value: 'Question sur un produit', label: 'Question sur un produit' },
  { value: 'Retour ou echange', label: 'Retour ou echange' },
  { value: 'Partenariat', label: 'Partenariat' },
  { value: 'Autre', label: 'Autre' },
];

export default function ContactPage() {
  const { config } = useSiteConfig();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await backendClient.submitContactForm({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        subject: data.subject,
        message: data.message.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        toast.success(response.message || 'Votre message a ete envoye avec succes!');
        reset();
      } else {
        toast.error(response.error || 'Une erreur est survenue. Veuillez reessayer.');
      }
    } catch (error: unknown) {
      logger.error('Contact form error:', error);
      toast.error('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage apres soumission reussie
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Message envoye!</h1>
            <p className="text-gray-600 mb-8">
              Merci de nous avoir contactes. Notre equipe vous repondra dans les plus brefs delais.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full px-6 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
              >
                Envoyer un autre message
              </button>
              <Link
                href="/"
                className="block w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors text-center"
              >
                Retour a l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tete */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une question? Une suggestion? N&apos;hesitez pas a nous ecrire.
            Notre equipe est la pour vous aider.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Nos coordonnees</h2>

              {/* Email */}
              {config.brand?.email && (
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <a
                      href={`mailto:${config.brand.email}`}
                      className="text-primary hover:underline"
                    >
                      {config.brand.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Telephone */}
              {config.brand?.phone && (
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Telephone</h3>
                    <a
                      href={`tel:${config.brand.phone}`}
                      className="text-primary hover:underline"
                    >
                      {config.brand.phoneFormatted || config.brand.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {config.brand?.whatsapp && (
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                    <a
                      href={`https://wa.me/${config.brand.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      Discuter sur WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Horaires */}
              {config.customerService && (
                <div className="flex items-start gap-4 pt-6 border-t">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horaires</h3>
                    <p className="text-gray-600">
                      {config.customerService.days || 'Lundi au vendredi'}<br />
                      {config.customerService.hoursStart || 9}h - {config.customerService.hoursEnd || 18}h
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Nom et Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', {
                        required: 'Le nom est requis',
                        minLength: { value: 2, message: 'Le nom doit contenir au moins 2 caracteres' },
                        maxLength: { value: 100, message: 'Le nom ne doit pas depasser 100 caracteres' },
                      })}
                      type="text"
                      placeholder="Votre nom"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all ${
                        errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('email', {
                        required: 'L\'email est requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Adresse email invalide',
                        },
                      })}
                      type="email"
                      placeholder="votre@email.com"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all ${
                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Telephone et Sujet */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Telephone <span className="text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      {...register('phone', {
                        pattern: {
                          value: /^[+]?[\d\s-]{8,20}$/,
                          message: 'Numero de telephone invalide',
                        },
                      })}
                      type="tel"
                      placeholder="+216 XX XXX XXX"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all ${
                        errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('subject', {
                        required: 'Veuillez selectionner un sujet',
                      })}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all ${
                        errors.subject ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    >
                      {SUBJECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('message', {
                      required: 'Le message est requis',
                      minLength: { value: 10, message: 'Le message doit contenir au moins 10 caracteres' },
                      maxLength: { value: 5000, message: 'Le message ne doit pas depasser 5000 caracteres' },
                    })}
                    rows={6}
                    placeholder="Decrivez votre demande en detail..."
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all resize-none ${
                      errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                    }`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                {/* Bouton d&apos;envoi */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Envoyer le message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
