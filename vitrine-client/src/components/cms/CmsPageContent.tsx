'use client';

import React from 'react';
import Link from 'next/link';
import { BlockRenderer } from './BlockRenderer';
import type { CmsPage, CmsBlock } from '@/types/cms';
import { sanitizeHtml } from '@/lib/utils/sanitize';

interface CmsPageContentProps {
  page: CmsPage;
}

/**
 * Rendu du contenu d&apos;une page CMS selon son template
 */
export const CmsPageContent: React.FC<CmsPageContentProps> = ({ page }) => {
  const renderBreadcrumbs = () => {
    if (!page.show_breadcrumb || !page.breadcrumbs?.length) return null;

    return (
      <nav className="mb-6" aria-label="Fil d'Ariane">
        <ol className="flex items-center gap-2 text-sm text-gray-600">
          {page.breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-gray-400">/</span>}
              {index === page.breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.name}</span>
              ) : (
                <Link href={crumb.url} className="hover:text-primary">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderBlocks = (blocks: CmsBlock[] | undefined) => {
    if (!blocks?.length) return null;
    return blocks.map((block) => (
      <BlockRenderer key={block.id} block={block} className="mb-6" />
    ));
  };

  const renderTitle = () => {
    if (!page.show_title) return null;
    return (
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
        {page.name}
      </h1>
    );
  };

  const renderContent = () => {
    if (!page.content) return null;
    return (
      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
      />
    );
  };

  const renderChildPages = () => {
    if (!page.children?.length) return null;
    return (
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pages associées</h2>
        <ul className="space-y-2">
          {page.children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/pages/${child.slug}`}
                className="text-primary hover:underline"
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Détection automatique du template basé sur le slug si template est "standard"
  const getEffectiveTemplate = (): string => {
    // Si un template spécifique est défini (pas "standard"), l&apos;utiliser
    if (page.template && page.template !== 'standard') {
      return page.template;
    }

    // Sinon, détecter le template basé sur le slug
    const slug = page.slug?.toLowerCase() || '';

    // Contact
    if (slug.includes('contact')) return 'contact';

    // FAQ
    if (slug.includes('faq') || slug.includes('questions')) return 'faq';

    // About
    if (slug.includes('about') || slug.includes('propos') || slug.includes('qui-sommes')) return 'about';

    // Shipping / Livraison
    if (slug.includes('shipping') || slug.includes('livraison') || slug.includes('delivery')) return 'shipping';

    // Returns / Retours
    if (slug.includes('return') || slug.includes('retour') || slug.includes('remboursement') || slug.includes('refund')) return 'returns';

    // Legal pages
    if (slug.includes('cgv') || slug.includes('cgu') || slug.includes('terms') ||
        slug.includes('conditions') || slug.includes('privacy') || slug.includes('confidential') ||
        slug.includes('mentions') || slug.includes('legal')) return 'legal';

    // Default
    return page.template || 'standard';
  };

  const effectiveTemplate = getEffectiveTemplate();

  // Rendu selon le template
  switch (effectiveTemplate) {
    case 'landing':
      return <LandingTemplate page={page} />;

    case 'contact':
      return <ContactTemplate page={page} />;

    case 'faq':
      return <FaqTemplate page={page} />;

    case 'about':
    case 'a-propos':
    case 'qui-sommes-nous':
      return <AboutTemplate page={page} />;

    case 'shipping':
    case 'livraison':
    case 'delivery':
      return <ShippingTemplate page={page} />;

    case 'returns':
    case 'retours':
    case 'remboursement':
      return <ReturnsTemplate page={page} />;

    case 'legal':
    case 'cgv':
    case 'cgu':
    case 'privacy':
    case 'confidentialite':
    case 'mentions-legales':
    case 'terms':
      return <LegalTemplate page={page} />;

    case 'sidebar_left':
      return (
        <SidebarTemplate
          page={page}
          sidebarPosition="left"
          renderBreadcrumbs={renderBreadcrumbs}
          renderTitle={renderTitle}
          renderContent={renderContent}
          renderBlocks={renderBlocks}
          renderChildPages={renderChildPages}
        />
      );

    case 'sidebar_right':
      return (
        <SidebarTemplate
          page={page}
          sidebarPosition="right"
          renderBreadcrumbs={renderBreadcrumbs}
          renderTitle={renderTitle}
          renderContent={renderContent}
          renderBlocks={renderBlocks}
          renderChildPages={renderChildPages}
        />
      );

    case 'full_width':
      return (
        <div>
          {/* Blocs avant contenu */}
          {renderBlocks(page.blocks?.before_content)}

          {/* Header de page */}
          {page.header_image_url && (
            <div
              className="h-64 bg-cover bg-center flex items-center justify-center"
              style={{ backgroundImage: `url(${page.header_image_url})` }}
            >
              <div className="bg-black/50 w-full h-full flex items-center justify-center">
                {page.show_title && (
                  <h1 className="text-4xl font-bold text-white">{page.name}</h1>
                )}
              </div>
            </div>
          )}

          {/* Blocs header */}
          {renderBlocks(page.blocks?.header)}

          {/* Contenu sans container */}
          <div className="py-8">
            {!page.header_image_url && renderTitle()}
            {renderContent()}
          </div>

          {/* Blocs contenu */}
          {renderBlocks(page.blocks?.content)}

          {/* Blocs footer */}
          {renderBlocks(page.blocks?.footer)}

          {/* Blocs après contenu */}
          {renderBlocks(page.blocks?.after_content)}
        </div>
      );

    case 'standard':
    default:
      return (
        <div className="container mx-auto px-4 py-8">
          {/* Blocs avant contenu */}
          {renderBlocks(page.blocks?.before_content)}

          {renderBreadcrumbs()}

          {/* Blocs header */}
          {renderBlocks(page.blocks?.header)}

          {renderTitle()}
          {renderContent()}

          {/* Blocs contenu */}
          {renderBlocks(page.blocks?.content)}

          {renderChildPages()}

          {/* Blocs footer */}
          {renderBlocks(page.blocks?.footer)}

          {/* Blocs après contenu */}
          {renderBlocks(page.blocks?.after_content)}
        </div>
      );
  }
};

// Template Landing Page
const LandingTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  const renderBlocks = (blocks: CmsBlock[] | undefined) => {
    if (!blocks?.length) return null;
    return blocks.map((block) => (
      <BlockRenderer key={block.id} block={block} className="mb-8" />
    ));
  };

  return (
    <div>
      {/* Hero section avec image header */}
      {page.header_image_url && (
        <section
          className="min-h-[500px] bg-cover bg-center flex items-center"
          style={{ backgroundImage: `url(${page.header_image_url})` }}
        >
          <div className="w-full h-full bg-black/40">
            <div className="container mx-auto px-4 py-24 text-center text-white">
              {page.show_title && (
                <h1 className="text-5xl font-bold mb-6">{page.name}</h1>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Blocs header */}
      {renderBlocks(page.blocks?.header)}

      {/* Blocs avant contenu */}
      {renderBlocks(page.blocks?.before_content)}

      {/* Contenu principal */}
      {page.content && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div
              className="prose prose-lg max-w-4xl mx-auto text-center prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </div>
        </section>
      )}

      {/* Blocs contenu */}
      <div className="container mx-auto px-4">
        {renderBlocks(page.blocks?.content)}
      </div>

      {/* Blocs footer */}
      {renderBlocks(page.blocks?.footer)}

      {/* Blocs après contenu */}
      {renderBlocks(page.blocks?.after_content)}
    </div>
  );
};

// Template Contact - Design professionnel moderne
const ContactTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Notre équipe est à votre disposition pour répondre à toutes vos questions.
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte Email */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <a href="mailto:contact@quelyos.com" className="text-primary hover:text-primary-dark transition-colors">
                    contact@quelyos.com
                  </a>
                </div>
              </div>
            </div>

            {/* Carte Téléphone */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Téléphone</h3>
                  <a href="tel:+21600000000" className="text-primary hover:text-primary-dark transition-colors">
                    +216 00 000 000
                  </a>
                </div>
              </div>
            </div>

            {/* Carte Adresse */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                  <p className="text-gray-600">
                    123 Rue du Commerce<br />
                    75001 Paris, France
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Horaires */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Horaires d&apos;ouverture</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Lundi - Vendredi : 9h00 - 18h00</p>
                    <p>Samedi : 10h00 - 16h00</p>
                    <p className="text-red-500">Dimanche : Fermé</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu additionnel depuis le CMS */}
            {page.content && (
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
              />
            )}

            {/* Blocs contenu */}
            {page.blocks?.content?.map((block) => (
              <BlockRenderer key={block.id} block={block} className="mb-6" />
            ))}
          </div>

          {/* Formulaire de contact */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};

// Formulaire de contact - Design professionnel
const ContactForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/backend/ecommerce/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Envoyez-nous un message</h2>
        <p className="text-gray-600">Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.</p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">Message envoyé avec succès !</p>
            <p className="text-green-700 text-sm">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-800">Une erreur est survenue</p>
            <p className="text-red-700 text-sm">Veuillez réessayer ou nous contacter par téléphone.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Votre nom"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Adresse email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="votre@email.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
              Sujet <span className="text-red-500">*</span>
            </label>
            <select
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
            >
              <option value="">Sélectionnez un sujet</option>
              <option value="commande">Question sur une commande</option>
              <option value="produit">Information produit</option>
              <option value="livraison">Livraison et retours</option>
              <option value="partenariat">Partenariat</option>
              <option value="autre">Autre demande</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="Décrivez votre demande en détail..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Vos données sont protégées et ne seront jamais partagées.</span>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Envoi en cours...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Envoyer le message
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// Template FAQ - Design professionnel avec accordion
const FaqTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  // FAQ par défaut si pas de contenu
  const defaultFaqs = [
    { question: "Comment passer une commande ?", answer: "Parcourez notre catalogue, ajoutez les produits au panier et suivez le processus de checkout sécurisé." },
    { question: "Quels sont les délais de livraison ?", answer: "La livraison standard est de 3 à 5 jours ouvrés. La livraison express est disponible en 24-48h." },
    { question: "Comment suivre ma commande ?", answer: "Connectez-vous à votre compte et accédez à la section 'Mes commandes' pour suivre l'état de votre livraison." },
    { question: "Quelle est votre politique de retour ?", answer: "Vous disposez de 30 jours après réception pour retourner un article dans son état d&apos;origine." },
    { question: "Les paiements sont-ils sécurisés ?", answer: "Oui, tous les paiements sont cryptés et sécurisés via nos partenaires certifiés PCI-DSS." },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Trouvez rapidement les réponses à vos questions les plus fréquentes.
          </p>
        </div>
      </div>

      {/* Contenu FAQ */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Introduction */}
          {page.content && (
            <div
              className="prose prose-lg max-w-none mb-10 text-center prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          )}

          {/* Accordion FAQ */}
          <div className="space-y-4">
            {defaultFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={`w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-gray-600">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Blocs additionnels */}
          {page.blocks?.content?.map((block) => (
            <BlockRenderer key={block.id} block={block} className="mt-8" />
          ))}

          {/* CTA Contact */}
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vous n&apos;avez pas trouvé votre réponse ?</h3>
            <p className="text-gray-600 mb-6">Notre équipe est disponible pour vous aider</p>
            <Link
              href="/pages/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template À propos - Design professionnel
const AboutTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Découvrez notre histoire, nos valeurs et notre engagement envers vous.
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        {/* Contenu depuis le CMS */}
        {page.content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </div>
        )}

        {/* Valeurs de l&apos;entreprise */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Qualité</h3>
            <p className="text-gray-600">Des produits sélectionnés avec soin pour garantir votre satisfaction.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rapidité</h3>
            <p className="text-gray-600">Livraison express et service client réactif pour une expérience optimale.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Passion</h3>
            <p className="text-gray-600">Une équipe passionnée à votre service pour vous conseiller au mieux.</p>
          </div>
        </div>

        {/* Blocs additionnels */}
        {page.blocks?.content?.map((block) => (
          <BlockRenderer key={block.id} block={block} className="mb-6" />
        ))}
      </div>
    </div>
  );
};

// Template Livraison - Design professionnel
const ShippingTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Tout ce que vous devez savoir sur nos options de livraison.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-12">
        {/* Options de livraison */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Livraison Standard</h3>
            <p className="text-2xl font-bold text-primary mb-2">5,90 €</p>
            <p className="text-gray-600 mb-4">3 à 5 jours ouvrés</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Suivi en temps réel
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Livraison à domicile
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border-2 border-primary p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
              Populaire
            </div>
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Livraison Express</h3>
            <p className="text-2xl font-bold text-primary mb-2">9,90 €</p>
            <p className="text-gray-600 mb-4">24 à 48h ouvrées</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Suivi en temps réel
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Livraison prioritaire
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Notification SMS
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Retrait en Magasin</h3>
            <p className="text-2xl font-bold text-green-600 mb-2">Gratuit</p>
            <p className="text-gray-600 mb-4">Disponible sous 2h</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sans frais de livraison
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vérification sur place
              </li>
            </ul>
          </div>
        </div>

        {/* Contenu additionnel */}
        {page.content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </div>
        )}

        {/* Info livraison gratuite */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Livraison gratuite dès 150 TND</h3>
          <p className="text-white/90">Profitez de la livraison offerte sur toutes vos commandes</p>
        </div>

        {/* Blocs */}
        {page.blocks?.content?.map((block) => (
          <BlockRenderer key={block.id} block={block} className="mt-8" />
        ))}
      </div>
    </div>
  );
};

// Template Retours - Design professionnel
const ReturnsTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Simple, rapide et gratuit - Notre politique de retour vous protège.
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-12">
        {/* Bannière garantie */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Satisfait ou remboursé - 30 jours</h2>
            <p className="text-gray-600">Vous avez changé d&apos;avis ? Pas de problème ! Retournez votre article dans son emballage d&apos;origine sous 30 jours et nous vous remboursons intégralement.</p>
          </div>
        </div>

        {/* Étapes */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Comment retourner un article ?</h2>
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { step: 1, title: "Connectez-vous", desc: "Accédez à votre espace client", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
            { step: 2, title: "Demandez un retour", desc: "Sélectionnez la commande concernée", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { step: 3, title: "Emballez l'article", desc: "Dans son emballage d&apos;origine", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
            { step: 4, title: "Expédiez", desc: "Avec l'étiquette prépayée", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                {item.step}
              </div>
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 mt-2">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Contenu additionnel */}
        {page.content && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 mb-12">
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary hover:prose-a:text-primary-dark"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
            />
          </div>
        )}

        {/* Blocs */}
        {page.blocks?.content?.map((block) => (
          <BlockRenderer key={block.id} block={block} className="mt-8" />
        ))}
      </div>
    </div>
  );
};

// Template Légal (CGV, Confidentialité, Mentions légales) - Design professionnel
const LegalTemplate: React.FC<{ page: CmsPage }> = ({ page }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4">
          {page.show_breadcrumb && page.breadcrumbs?.length > 0 && (
            <nav className="mb-6" aria-label="Fil d'Ariane">
              <ol className="flex items-center gap-2 text-sm text-white/80">
                {page.breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-white/60">/</span>}
                    {index === page.breadcrumbs.length - 1 ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <Link href={crumb.url} className="hover:text-white transition-colors">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {page.show_title && (
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.name}
            </h1>
          )}
          <p className="text-white/90 text-lg max-w-2xl">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
            {page.content ? (
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
              />
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">Le contenu de cette page sera bientôt disponible.</p>
              </div>
            )}
          </div>

          {/* Blocs additionnels */}
          {page.blocks?.content?.map((block) => (
            <BlockRenderer key={block.id} block={block} className="mt-8" />
          ))}

          {/* Liens utiles */}
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <Link
              href="/pages/contact"
              className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Une question ?</p>
                <p className="text-sm text-gray-600">Contactez notre service client</p>
              </div>
            </Link>

            <Link
              href="/pages/faq"
              className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">FAQ</p>
                <p className="text-sm text-gray-600">Consultez les questions fréquentes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template avec sidebar
interface SidebarTemplateProps {
  page: CmsPage;
  sidebarPosition: 'left' | 'right';
  renderBreadcrumbs: () => React.ReactNode;
  renderTitle: () => React.ReactNode;
  renderContent: () => React.ReactNode;
  renderBlocks: (blocks: CmsBlock[] | undefined) => React.ReactNode;
  renderChildPages: () => React.ReactNode;
}

const SidebarTemplate: React.FC<SidebarTemplateProps> = ({
  page,
  sidebarPosition,
  renderBreadcrumbs,
  renderTitle,
  renderContent,
  renderBlocks,
  renderChildPages,
}) => {
  const mainContent = (
    <div className="lg:col-span-3">
      {renderTitle()}
      {renderContent()}
      {renderBlocks(page.blocks?.content)}
      {renderChildPages()}
    </div>
  );

  const sidebar = (
    <aside className="lg:col-span-1">
      {renderBlocks(page.blocks?.sidebar)}

      {/* Navigation pages enfants si présent */}
      {page.children && page.children.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-bold text-gray-900 mb-3">Dans cette section</h3>
          <ul className="space-y-2">
            {page.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/pages/${child.slug}`}
                  className="text-gray-700 hover:text-primary"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {renderBlocks(page.blocks?.before_content)}
      {renderBreadcrumbs()}
      {renderBlocks(page.blocks?.header)}

      <div className="grid lg:grid-cols-4 gap-8">
        {sidebarPosition === 'left' ? (
          <>
            {sidebar}
            {mainContent}
          </>
        ) : (
          <>
            {mainContent}
            {sidebar}
          </>
        )}
      </div>

      {renderBlocks(page.blocks?.footer)}
      {renderBlocks(page.blocks?.after_content)}
    </div>
  );
};

export default CmsPageContent;
