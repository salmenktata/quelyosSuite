import Link from "next/link";

import Footer from "@/app/components/Footer";
export const metadata = {
  title: "Politique de confidentialité — Quelyos Marketing",
  description: "Politique de confidentialité et protection des données de Quelyos Marketing",
};

export default function ConfidentialitePage() {
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
          <h1 className="text-3xl font-bold text-white mb-8">Politique de confidentialité</h1>
          
          <div className="prose prose-invert prose-emerald max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300">
                Quelyos (&quot;nous&quot;, &quot;notre&quot;) s&apos;engage à protéger la vie privée des utilisateurs 
                de notre plateforme de marketing social media. Cette politique de confidentialité 
                décrit comment nous collectons, utilisons et protégeons vos données personnelles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Données collectées</h2>
              <p className="text-gray-300 mb-4">Nous collectons les types de données suivants :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse email</li>
                <li><strong>Données d&apos;entreprise :</strong> nom de l&apos;entreprise, secteur d&apos;activité</li>
                <li><strong>Données de connexion :</strong> adresse IP, navigateur, appareil</li>
                <li><strong>Données des réseaux sociaux :</strong> tokens d&apos;accès Facebook/Instagram (via OAuth)</li>
                <li><strong>Données de paiement :</strong> traitées par Stripe (nous ne stockons pas vos informations bancaires)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Utilisation des données</h2>
              <p className="text-gray-300 mb-4">Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Fournir et améliorer nos services de marketing automatisé</li>
                <li>Gérer votre compte et vos abonnements</li>
                <li>Communiquer avec vous (support, mises à jour)</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Analyser l&apos;utilisation de notre plateforme (statistiques agrégées)</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Intégration Meta (Facebook/Instagram)</h2>
              <div className="p-4 rounded-lg bg-gray-900/50 border border-white/5 text-gray-300">
                <p className="mb-4">
                  Quelyos Marketing utilise les APIs de Meta pour publier du contenu sur vos comptes 
                  Facebook et Instagram. En connectant vos comptes :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vous autorisez Quelyos à publier en votre nom</li>
                  <li>Nous accédons uniquement aux permissions nécessaires</li>
                  <li>Vos tokens sont stockés de manière sécurisée et chiffrée</li>
                  <li>Vous pouvez révoquer l&apos;accès à tout moment depuis vos paramètres Meta</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Conservation des données</h2>
              <p className="text-gray-300">
                Vos données sont conservées pendant la durée de votre abonnement et jusqu&apos;à 3 ans 
                après la fermeture de votre compte, conformément à nos obligations légales. 
                Les données de paiement sont conservées selon les exigences fiscales applicables.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Partage des données</h2>
              <p className="text-gray-300 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement avec :
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong>Meta (Facebook/Instagram) :</strong> pour la publication de contenu</li>
                <li><strong>Stripe :</strong> pour le traitement des paiements</li>
                <li><strong>Services d&apos;hébergement :</strong> pour le stockage sécurisé des données</li>
                <li><strong>Autorités légales :</strong> si requis par la loi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Sécurité</h2>
              <p className="text-gray-300">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                pour protéger vos données : chiffrement en transit (TLS) et au repos, 
                authentification forte, audits de sécurité réguliers, et accès limité aux données.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Vos droits (RGPD)</h2>
              <p className="text-gray-300 mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format lisible</li>
                <li><strong>Droit d&apos;opposition :</strong> vous opposer à certains traitements</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Pour exercer ces droits, contactez-nous à{" "}
                <a href="mailto:privacy@quelyos.com" className="text-emerald-400 hover:underline">
                  privacy@quelyos.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Cookies</h2>
              <p className="text-gray-300">
                Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies 
                analytiques (avec votre consentement) pour améliorer nos services. Vous pouvez 
                gérer vos préférences de cookies dans les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
              <div className="p-4 rounded-lg bg-gray-900/50 border border-white/5 text-gray-300">
                <p className="mb-2">Pour toute question relative à cette politique :</p>
                <p>
                  <strong>Email :</strong>{" "}
                  <a href="mailto:privacy@quelyos.com" className="text-emerald-400 hover:underline">
                    privacy@quelyos.com
                  </a>
                </p>
                <p>
                  <strong>Délégué à la protection des données :</strong> dpo@quelyos.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Modifications</h2>
              <p className="text-gray-300">
                Nous pouvons modifier cette politique de confidentialité à tout moment. 
                Les modifications seront publiées sur cette page avec une date de mise à jour. 
                Pour les changements significatifs, nous vous informerons par email.
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