import Link from "next/link";

import Footer from "@/app/components/Footer";
export const metadata = {
  title: "Mentions légales — Quelyos Marketing",
  description: "Mentions légales de Quelyos Marketing",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="px-4 py-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <Link href="/marketing/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white">Quelyos Marketing</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Mentions légales</h1>
          
          <div className="prose prose-invert prose-emerald max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">1. Éditeur du site</h2>
              <div className="p-4 rounded-lg bg-gray-900/50 border border-white/5 text-gray-300">
                <p><strong>Quelyos</strong></p>
                <p>Société par actions simplifiée (SAS)</p>
                <p>Capital social : [À définir]</p>
                <p>Siège social : Paris, France</p>
                <p>RCS : [À définir]</p>
                <p>SIRET : [À définir]</p>
                <p>N° TVA intracommunautaire : [À définir]</p>
                <p className="mt-4">
                  <strong>Directeur de la publication :</strong> Salmen KTATA
                </p>
                <p>
                  <strong>Contact :</strong>{" "}
                  <a href="mailto:contact@quelyos.com" className="text-emerald-400 hover:underline">
                    contact@quelyos.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">2. Hébergement</h2>
              <div className="p-4 rounded-lg bg-gray-900/50 border border-white/5 text-gray-300">
                <p><strong>Contabo GmbH</strong></p>
                <p>Aschauer Straße 32a</p>
                <p>81549 München, Allemagne</p>
                <p>
                  Site web :{" "}
                  <a href="https://contabo.com" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                    https://contabo.com
                  </a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">3. Propriété intellectuelle</h2>
              <p className="text-gray-300 mb-4">
                L&apos;ensemble du contenu de ce site (textes, images, graphiques, logo, icônes, etc.) 
                est la propriété exclusive de Quelyos, sauf mention contraire explicite.
              </p>
              <p className="text-gray-300">
                Toute reproduction, distribution, modification, adaptation, retransmission ou publication, 
                même partielle, de ces éléments est strictement interdite sans l&apos;accord exprès 
                par écrit de Quelyos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">4. Données personnelles</h2>
              <p className="text-gray-300 mb-4">
                Les informations recueillies sur ce site sont traitées conformément au Règlement Général 
                sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p className="text-gray-300">
                Pour plus d&apos;informations, consultez notre{" "}
                <Link href="/marketing/confidentialite" className="text-emerald-400 hover:underline">
                  politique de confidentialité
                </Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">5. Cookies</h2>
              <p className="text-gray-300">
                Ce site utilise des cookies pour améliorer l&apos;expérience utilisateur et analyser le trafic. 
                En continuant à naviguer sur ce site, vous acceptez leur utilisation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">6. Limitation de responsabilité</h2>
              <p className="text-gray-300 mb-4">
                Quelyos s&apos;efforce de fournir des informations aussi précises que possible. 
                Toutefois, elle ne pourra être tenue responsable des omissions, inexactitudes 
                ou carences dans la mise à jour.
              </p>
              <p className="text-gray-300">
                Les liens hypertextes présents sur ce site peuvent renvoyer vers d&apos;autres sites. 
                Quelyos décline toute responsabilité quant au contenu de ces sites externes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Droit applicable</h2>
              <p className="text-gray-300">
                Les présentes mentions légales sont régies par le droit français. 
                En cas de litige, les tribunaux français seront seuls compétents.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-gray-500 text-sm">
              Dernière mise à jour : Décembre 2025
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}