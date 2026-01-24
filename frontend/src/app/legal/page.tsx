import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales | Quelyos ERP',
  description: 'Mentions légales, licences et attributions de Quelyos ERP',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentions Légales</h1>

        {/* Section Quelyos */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Quelyos ERP
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Quelyos ERP est une solution e-commerce complète offrant une expérience
              utilisateur moderne et performante pour la gestion de boutiques en ligne.
            </p>
            <p className="mt-4">
              <strong>Version :</strong> 1.0.0<br />
              <strong>Date de publication :</strong> Janvier 2026
            </p>
          </div>
        </section>

        {/* Section Licences */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Licences et Composants
          </h2>

          {/* Frontend & Backoffice */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Interface Utilisateur (Frontend & Backoffice)
            </h3>
            <div className="prose prose-gray max-w-none">
              <p>
                L'interface utilisateur de Quelyos ERP, incluant la boutique en ligne
                (Frontend Next.js) et le backoffice d'administration (React), est
                développée par l'équipe Quelyos.
              </p>
              <p className="mt-2">
                <strong>Licence :</strong> Propriétaire<br />
                <strong>© 2026 Quelyos. Tous droits réservés.</strong>
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Le code source de l'interface utilisateur est protégé par le droit d'auteur
                et ne peut être redistribué ou modifié sans autorisation écrite.
              </p>
            </div>
          </div>

          {/* Backend Odoo */}
          <div className="mb-8 border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Backend et API
            </h3>
            <div className="prose prose-gray max-w-none">
              <p>
                Quelyos ERP utilise <strong>Odoo Community Edition</strong> comme
                backend pour la gestion des données et la logique métier.
              </p>
              <p className="mt-2">
                <strong>Odoo Community Edition</strong><br />
                © Odoo S.A.<br />
                Licence : GNU Lesser General Public License v3.0 (LGPL-3.0)
              </p>
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm">
                  <strong>Note importante :</strong> Odoo est une marque déposée d'Odoo S.A.
                  Quelyos ERP n'est pas affilié, approuvé ou sponsorisé par Odoo S.A.
                  L'utilisation d'Odoo Community Edition respecte intégralement les termes
                  de la licence LGPL-3.0.
                </p>
              </div>
              <p className="mt-4">
                Le code source d'Odoo Community Edition est disponible sur :
                <a
                  href="https://github.com/odoo/odoo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  github.com/odoo/odoo
                </a>
              </p>
            </div>
          </div>

          {/* Licence LGPL-3.0 */}
          <div className="mb-8 border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              À propos de la Licence LGPL-3.0
            </h3>
            <div className="prose prose-gray max-w-none text-sm">
              <p>
                La GNU Lesser General Public License v3.0 (LGPL-3.0) est une licence
                de logiciel libre publiée par la Free Software Foundation. Elle autorise
                l'utilisation, la modification et la redistribution du code source sous
                certaines conditions.
              </p>
              <p className="mt-4">
                <strong>Points clés de la LGPL-3.0 :</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Liberté d'utiliser le logiciel à toute fin</li>
                <li>Liberté d'étudier le fonctionnement du logiciel</li>
                <li>Liberté de redistribuer des copies</li>
                <li>Liberté d'améliorer le logiciel et de publier les améliorations</li>
                <li>
                  Les modifications du code LGPL doivent être publiées sous LGPL
                </li>
                <li>
                  Les applications utilisant une bibliothèque LGPL peuvent utiliser
                  d'autres licences (cas de Quelyos)
                </li>
              </ul>
              <p className="mt-4">
                Texte complet de la licence :
                <a
                  href="https://www.gnu.org/licenses/lgpl-3.0.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-2"
                >
                  www.gnu.org/licenses/lgpl-3.0.html
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Section Technologies Open Source */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Technologies Open Source
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Quelyos ERP est construit avec des technologies open source modernes :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Frontend</h4>
                <ul className="text-sm space-y-1">
                  <li>• Next.js 16 (MIT)</li>
                  <li>• React 18 (MIT)</li>
                  <li>• Tailwind CSS (MIT)</li>
                  <li>• TypeScript (Apache-2.0)</li>
                </ul>
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Backoffice</h4>
                <ul className="text-sm space-y-1">
                  <li>• React 18 (MIT)</li>
                  <li>• Vite (MIT)</li>
                  <li>• React Query (MIT)</li>
                  <li>• TypeScript (Apache-2.0)</li>
                </ul>
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Backend</h4>
                <ul className="text-sm space-y-1">
                  <li>• Odoo 19 Community (LGPL-3.0)</li>
                  <li>• Python 3.12 (PSF)</li>
                  <li>• PostgreSQL 15 (PostgreSQL)</li>
                </ul>
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Infrastructure</h4>
                <ul className="text-sm space-y-1">
                  <li>• Docker (Apache-2.0)</li>
                  <li>• Nginx (BSD-2-Clause)</li>
                  <li>• Node.js 20 (MIT)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section Contact */}
        <section className="mb-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Contact
          </h2>
          <div className="prose prose-gray max-w-none">
            <p>
              Pour toute question concernant les mentions légales ou les licences :
            </p>
            <p className="mt-4">
              <strong>Email :</strong>{' '}
              <a href="mailto:legal@quelyos.com" className="text-blue-600 hover:text-blue-800">
                legal@quelyos.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 border-t pt-8">
          <p>Dernière mise à jour : Janvier 2026</p>
          <p className="mt-2">
            © 2026 Quelyos. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}
