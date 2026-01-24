'use client';

import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import Link from 'next/link';

export default function PrivacyPage() {
  const { config } = useSiteConfig();
  const { brand } = config;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Politique de Confidentialite</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            La protection de vos donnees est notre priorite
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-gray-600 mb-8">
            Derniere mise a jour: Janvier 2025
          </p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Chez {brand.name}, nous accordons une grande importance a la protection de vos donnees
              personnelles. Cette politique de confidentialite explique comment nous collectons,
              utilisons et protegeons vos informations lorsque vous utilisez notre site web.
            </p>
          </section>

          {/* Donnees collectees */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Donnees que nous collectons</h2>
            <p className="text-gray-600 mb-4">Nous pouvons collecter les types de donnees suivants:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Informations d&apos;identification:</strong> nom, prenom, adresse email, numero de telephone</li>
              <li><strong>Informations de livraison:</strong> adresse postale complete</li>
              <li><strong>Informations de paiement:</strong> traitees de maniere securisee par nos partenaires de paiement</li>
              <li><strong>Donnees de navigation:</strong> pages visitees, produits consultes, preferences</li>
              <li><strong>Donnees techniques:</strong> adresse IP, type de navigateur, systeme d&apos;exploitation</li>
            </ul>
          </section>

          {/* Utilisation des donnees */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Utilisation de vos donnees</h2>
            <p className="text-gray-600 mb-4">Vos donnees sont utilisees pour:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Traiter et livrer vos commandes</li>
              <li>Gerer votre compte client</li>
              <li>Vous envoyer des confirmations et mises a jour de commande</li>
              <li>Repondre a vos demandes de service client</li>
              <li>Ameliorer notre site et nos services</li>
              <li>Vous envoyer des offres promotionnelles (avec votre consentement)</li>
              <li>Prevenir la fraude et securiser nos services</li>
            </ul>
          </section>

          {/* Partage des donnees */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Partage de vos donnees</h2>
            <p className="text-gray-600 mb-4">
              Nous ne vendons jamais vos donnees personnelles. Nous pouvons les partager avec:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Partenaires de livraison:</strong> pour acheminer vos commandes</li>
              <li><strong>Prestataires de paiement:</strong> pour traiter vos transactions de maniere securisee</li>
              <li><strong>Services d&apos;analyse:</strong> pour ameliorer notre site (donnees anonymisees)</li>
              <li><strong>Autorites legales:</strong> si requis par la loi</li>
            </ul>
          </section>

          {/* Securite */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Securite des donnees</h2>
            <p className="text-gray-600 mb-4">
              Nous mettons en oeuvre des mesures de securite techniques et organisationnelles pour
              proteger vos donnees:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Cryptage SSL pour toutes les communications</li>
              <li>Stockage securise des donnees</li>
              <li>Acces restreint aux donnees personnelles</li>
              <li>Mises a jour regulieres de securite</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <p className="text-gray-600 mb-4">
              Notre site utilise des cookies pour:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Cookies essentiels:</strong> necessaires au fonctionnement du site (panier, session)</li>
              <li><strong>Cookies de performance:</strong> pour analyser l&apos;utilisation du site</li>
              <li><strong>Cookies de personnalisation:</strong> pour memoriser vos preferences</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Vous pouvez gerer vos preferences de cookies dans les parametres de votre navigateur.
            </p>
          </section>

          {/* Vos droits */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Vos droits</h2>
            <p className="text-gray-600 mb-4">
              Conformement a la legislation en vigueur, vous disposez des droits suivants:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Droit d&apos;acces:</strong> obtenir une copie de vos donnees</li>
              <li><strong>Droit de rectification:</strong> corriger vos donnees inexactes</li>
              <li><strong>Droit de suppression:</strong> demander l&apos;effacement de vos donnees</li>
              <li><strong>Droit d&apos;opposition:</strong> vous opposer au traitement de vos donnees</li>
              <li><strong>Droit a la portabilite:</strong> recevoir vos donnees dans un format structure</li>
              <li><strong>Droit de retrait du consentement:</strong> retirer votre consentement a tout moment</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Pour exercer ces droits, contactez-nous a{' '}
              <a href={`mailto:${brand.email}`} className="text-primary hover:underline">
                {brand.email}
              </a>
            </p>
          </section>

          {/* Conservation */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Conservation des donnees</h2>
            <p className="text-gray-600">
              Nous conservons vos donnees personnelles aussi longtemps que necessaire pour les finalites
              decrites dans cette politique, sauf obligation legale de conservation plus longue.
              Les donnees de commande sont conservees conformement aux obligations comptables et fiscales.
            </p>
          </section>

          {/* Modifications */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Modifications</h2>
            <p className="text-gray-600">
              Nous pouvons mettre a jour cette politique de confidentialite. Les modifications seront
              publiees sur cette page avec une nouvelle date de mise a jour. Nous vous encourageons
              a consulter regulierement cette page.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant cette politique de confidentialite ou vos donnees personnelles:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`mailto:${brand.email}`}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {brand.email}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Formulaire de contact
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
