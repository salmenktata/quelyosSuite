'use client';

import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import Link from 'next/link';

export default function TermsPage() {
  const { config } = useSiteConfig();
  const { brand, returns, shipping, currency } = config;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Conditions Generales de Vente</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Les regles qui regissent nos relations commerciales
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <p className="text-gray-600 mb-8">
            Derniere mise a jour: Janvier 2025
          </p>

          {/* Article 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 1 - Objet</h2>
            <p className="text-gray-600">
              Les presentes conditions generales de vente (CGV) regissent les relations contractuelles
              entre {brand.name} et tout client (ci-apres &quot;le Client&quot;) effectuant un achat sur notre site.
              Toute commande implique l&apos;acceptation sans reserve de ces CGV.
            </p>
          </section>

          {/* Article 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 2 - Produits</h2>
            <p className="text-gray-600 mb-4">
              Les produits proposes a la vente sont ceux figurant sur notre site au moment de la consultation.
              Les photographies et descriptions des produits sont fournies a titre indicatif.
            </p>
            <p className="text-gray-600">
              Nous nous efforcons de presenter les produits avec la plus grande precision possible,
              mais des differences mineures peuvent exister entre les photos et les produits reels.
            </p>
          </section>

          {/* Article 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 3 - Prix</h2>
            <p className="text-gray-600 mb-4">
              Les prix affiches sont exprimes en {currency.code} ({currency.symbol}) et incluent toutes
              les taxes applicables (TTC). Les frais de livraison ne sont pas inclus et sont calcules
              lors de la validation de la commande.
            </p>
            <p className="text-gray-600">
              {brand.name} se reserve le droit de modifier ses prix a tout moment.
              Les produits seront factures sur la base des prix en vigueur au moment de la validation de la commande.
            </p>
          </section>

          {/* Article 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 4 - Commande</h2>
            <p className="text-gray-600 mb-4">
              Pour passer commande, le Client doit:
            </p>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Selectionner les produits souhaites et les ajouter au panier</li>
              <li>Verifier le contenu du panier et valider</li>
              <li>Renseigner ou confirmer ses informations de livraison</li>
              <li>Choisir le mode de livraison</li>
              <li>Choisir le mode de paiement et proceder au reglement</li>
            </ol>
            <p className="text-gray-600">
              La validation de la commande constitue une acceptation irrevocable des presentes CGV.
              Un email de confirmation sera envoye au Client.
            </p>
          </section>

          {/* Article 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 5 - Paiement</h2>
            <p className="text-gray-600 mb-4">
              Le paiement peut etre effectue par:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Carte bancaire (Visa, Mastercard)</li>
              <li>PayPal</li>
              <li>Paiement a la livraison (selon disponibilite)</li>
            </ul>
            <p className="text-gray-600">
              Les paiements par carte sont securises par cryptage SSL. Les informations bancaires
              ne sont jamais stockees sur nos serveurs.
            </p>
          </section>

          {/* Article 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 6 - Livraison</h2>
            <p className="text-gray-600 mb-4">
              Les delais de livraison sont:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li><strong>Livraison standard:</strong> {shipping.standardDaysMin}-{shipping.standardDaysMax} jours ouvrables</li>
              <li><strong>Livraison express:</strong> {shipping.expressDaysMin}-{shipping.expressDaysMax} jours ouvrables</li>
            </ul>
            <p className="text-gray-600 mb-4">
              La livraison est gratuite pour toute commande superieure a {shipping.freeThreshold} {currency.symbol}.
            </p>
            <p className="text-gray-600">
              {brand.name} ne pourra etre tenu responsable des retards de livraison dus a des
              evenements hors de son controle (greves, intemperies, etc.).
            </p>
          </section>

          {/* Article 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 7 - Droit de retractation et retours</h2>
            <p className="text-gray-600 mb-4">
              Conformement a la legislation en vigueur, le Client dispose d&apos;un delai de{' '}
              <strong>{returns.windowDays} jours</strong> a compter de la reception de sa commande
              pour exercer son droit de retractation sans avoir a justifier de motifs.
            </p>
            <p className="text-gray-600 mb-4">
              Pour etre accepte, le retour doit respecter les conditions suivantes:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mb-4">
              <li>Produit non utilise, dans son etat d&apos;origine</li>
              <li>Emballage d&apos;origine intact</li>
              <li>Tous les accessoires inclus</li>
            </ul>
            <p className="text-gray-600">
              Le remboursement sera effectue dans un delai de {returns.refundDaysMin} a {returns.refundDaysMax} jours
              ouvrables apres reception et verification du produit retourne.
            </p>
          </section>

          {/* Article 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 8 - Garantie</h2>
            <p className="text-gray-600 mb-4">
              Tous nos produits beneficient de:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Garantie legale de conformite:</strong> le produit doit etre conforme a sa description</li>
              <li><strong>Garantie des vices caches:</strong> couvre les defauts non apparents</li>
              <li><strong>Garantie commerciale:</strong> {returns.warrantyYears} an(s) contre les defauts de fabrication</li>
            </ul>
          </section>

          {/* Article 9 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 9 - Responsabilite</h2>
            <p className="text-gray-600 mb-4">
              {brand.name} ne saurait etre tenu responsable de l&apos;inexecution du contrat en cas de:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Rupture de stock ou indisponibilite du produit</li>
              <li>Force majeure</li>
              <li>Fait imprevisible et insurmontable d&apos;un tiers</li>
              <li>Faute du Client</li>
            </ul>
          </section>

          {/* Article 10 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 10 - Propriete intellectuelle</h2>
            <p className="text-gray-600">
              L&apos;ensemble des elements du site (textes, images, logos, etc.) est protege par le droit
              de la propriete intellectuelle. Toute reproduction, meme partielle, est interdite
              sans autorisation prealable.
            </p>
          </section>

          {/* Article 11 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 11 - Donnees personnelles</h2>
            <p className="text-gray-600">
              Les donnees personnelles collectees sont traitees conformement a notre{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Politique de Confidentialite
              </Link>
              . Le Client dispose d&apos;un droit d&apos;acces, de rectification et de suppression de ses donnees.
            </p>
          </section>

          {/* Article 12 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Article 12 - Litiges</h2>
            <p className="text-gray-600 mb-4">
              En cas de litige, le Client peut recourir a une mediation conventionnelle ou a tout
              autre mode alternatif de reglement des differends.
            </p>
            <p className="text-gray-600">
              Les presentes CGV sont soumises au droit tunisien. Tout litige sera de la competence
              exclusive des tribunaux tunisiens.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-600 mb-4">
              Pour toute question concernant ces conditions generales:
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
