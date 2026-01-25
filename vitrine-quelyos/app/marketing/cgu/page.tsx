import Link from "next/link";

import Footer from "@/app/components/Footer";
export const metadata = {
  title: "Conditions Générales d'Utilisation — Quelyos Marketing",
  description: "Conditions générales d'utilisation de Quelyos Marketing",
};

export default function CGUPage() {
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
          <h1 className="text-3xl font-bold text-white mb-8">Conditions Générales d&apos;Utilisation</h1>
          
          <div className="prose prose-invert prose-emerald max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Objet</h2>
              <p className="text-gray-300">
                Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et 
                l&apos;utilisation de la plateforme Quelyos Marketing, un service de gestion 
                automatisée des réseaux sociaux destiné aux TPE/PME.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Acceptation des conditions</h2>
              <p className="text-gray-300">
                En créant un compte ou en utilisant nos services, vous acceptez sans réserve 
                les présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne pouvez pas 
                utiliser notre plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Description du service</h2>
              <p className="text-gray-300 mb-4">Quelyos Marketing propose :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Génération de contenu assistée par IA pour les réseaux sociaux</li>
                <li>Planification et publication automatique sur Facebook et Instagram</li>
                <li>Gestion centralisée des messages et commentaires</li>
                <li>Tableau de bord analytique orienté business</li>
                <li>Suggestions de réponses automatiques par IA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Inscription et compte</h2>
              <p className="text-gray-300 mb-4">Pour utiliser Quelyos Marketing, vous devez :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Être majeur et avoir la capacité juridique de contracter</li>
                <li>Fournir des informations exactes et complètes</li>
                <li>Maintenir la confidentialité de vos identifiants</li>
                <li>Avoir les droits nécessaires sur les comptes sociaux connectés</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Vous êtes responsable de toutes les activités effectuées depuis votre compte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Utilisation des APIs Meta</h2>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-gray-300">
                <p className="mb-4">
                  En connectant vos comptes Facebook et/ou Instagram, vous certifiez que :
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Vous êtes le propriétaire ou l&apos;administrateur autorisé de ces comptes</li>
                  <li>Vous respectez les conditions d&apos;utilisation de Meta</li>
                  <li>Le contenu publié respecte les règles communautaires de Meta</li>
                  <li>Vous n&apos;utilisez pas le service à des fins illicites ou trompeuses</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Contenu</h2>
              <h3 className="text-lg font-medium text-white mb-2">6.1 Votre contenu</h3>
              <p className="text-gray-300 mb-4">
                Vous conservez tous les droits sur le contenu que vous créez ou publiez via 
                notre plateforme. Vous nous accordez une licence limitée pour traiter, 
                stocker et publier ce contenu conformément à vos instructions.
              </p>
              
              <h3 className="text-lg font-medium text-white mb-2">6.2 Contenu interdit</h3>
              <p className="text-gray-300 mb-2">Il est interdit de publier du contenu :</p>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Illégal, diffamatoire, ou portant atteinte aux droits d&apos;autrui</li>
                <li>À caractère discriminatoire ou incitant à la haine</li>
                <li>Trompeur ou constituant de la publicité mensongère</li>
                <li>Contenant des virus ou codes malveillants</li>
                <li>Violant les droits de propriété intellectuelle</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Tarifs et paiement</h2>
              <p className="text-gray-300 mb-4">
                Les tarifs sont indiqués sur notre page de tarification. Le paiement est 
                effectué mensuellement ou annuellement selon le plan choisi.
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Les paiements sont traités de manière sécurisée par Stripe</li>
                <li>Les factures sont disponibles dans votre espace client</li>
                <li>Pas de frais cachés ni d&apos;engagement minimum</li>
                <li>Annulation possible à tout moment depuis vos paramètres</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Limitation de responsabilité</h2>
              <p className="text-gray-300 mb-4">
                Quelyos ne peut être tenu responsable :
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Des interruptions de service des plateformes tierces (Meta)</li>
                <li>Des modifications des APIs de Meta ou de leurs conditions</li>
                <li>Des pertes de données dues à des circonstances hors de notre contrôle</li>
                <li>Des résultats commerciaux générés par le contenu publié</li>
                <li>Des dommages indirects ou consécutifs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Propriété intellectuelle</h2>
              <p className="text-gray-300">
                La plateforme Quelyos Marketing, son code, son design, ses algorithmes et 
                sa documentation sont la propriété exclusive de Quelyos. Toute reproduction 
                ou utilisation non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Résiliation</h2>
              <p className="text-gray-300 mb-4">
                Vous pouvez résilier votre compte à tout moment depuis vos paramètres. 
                Nous pouvons suspendre ou résilier votre compte en cas de :
              </p>
              <ul className="list-disc pl-6 text-gray-300 space-y-2">
                <li>Violation des présentes CGU</li>
                <li>Utilisation frauduleuse du service</li>
                <li>Non-paiement des factures</li>
                <li>Demande des autorités compétentes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Modifications</h2>
              <p className="text-gray-300">
                Nous pouvons modifier ces CGU à tout moment. Les modifications significatives 
                seront notifiées par email au moins 30 jours avant leur entrée en vigueur. 
                La poursuite de l&apos;utilisation du service vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Droit applicable</h2>
              <p className="text-gray-300">
                Les présentes CGU sont régies par le droit français. Tout litige sera 
                soumis à la compétence exclusive des tribunaux de Paris, après une tentative 
                de résolution amiable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">13. Contact</h2>
              <p className="text-gray-300">
                Pour toute question concernant ces CGU :{" "}
                <a href="mailto:legal@quelyos.com" className="text-emerald-400 hover:underline">
                  legal@quelyos.com
                </a>
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