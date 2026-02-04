/**
 * Test - Catégories Clients (Page de test)
 *
 * Fonctionnalités :
 * - Vérification fonctionnement du composant Layout
 * - Test rendu basique de page CRM
 * - Validation import et intégration des composants communs
 * - Page temporaire pour tests de développement
 * - Affichage message de confirmation Layout actif
 */
import { Layout } from '@/components/Layout';

export default function CustomerCategoriesTest() {
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test - Catégories Clients</h1>
        <p className="mt-4">Si vous voyez ce message, le Layout fonctionne correctement.</p>
      </div>
    </Layout>
  );
}
