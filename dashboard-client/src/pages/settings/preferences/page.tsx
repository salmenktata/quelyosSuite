/**
 * Page Préférences Utilisateur
 *
 * Fonctionnalités :
 * - Choix du module par défaut après connexion
 * - Sauvegarde dans localStorage
 * - Liste des modules accessibles uniquement
 */
import { Layout } from "@/components/Layout";
import { Breadcrumbs, Button } from "@/components/common";
import { useState, useEffect } from "react";
import { Home, CheckCircle2, AlertCircle } from "lucide-react";
import { MODULES, type ModuleId } from "@/config/modules";
import { usePermissions } from "@/hooks/usePermissions";

const DEFAULT_MODULE_KEY = 'default_module';

export default function PreferencesPage() {
  const { canAccessModule } = usePermissions();
  const [selectedModule, setSelectedModule] = useState<ModuleId>('home');
  const [saved, setSaved] = useState(false);

  // Charger la préférence sauvegardée
  useEffect(() => {
    const stored = localStorage.getItem(DEFAULT_MODULE_KEY);
    if (stored && canAccessModule(stored as ModuleId)) {
      setSelectedModule(stored as ModuleId);
    }
  }, [canAccessModule]);

  // Filtrer les modules accessibles
  const accessibleModules = MODULES.filter(module => canAccessModule(module.id));

  const handleSave = () => {
    localStorage.setItem(DEFAULT_MODULE_KEY, selectedModule);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Paramètres Généraux", href: "/settings" },
            { label: "Préférences" },
          ]}
        />

        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Home className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Module par défaut
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choisissez le module à afficher après votre connexion
              </p>
            </div>
          </div>
        </div>

        {/* Message de succès */}
        {saved && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Préférence sauvegardée avec succès !
              </p>
            </div>
          </div>
        )}

        {/* Sélection du module */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Qu'est-ce que le module par défaut ?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Après votre connexion, vous serez automatiquement redirigé vers le module sélectionné
                au lieu du tableau de bord général.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sélectionnez votre module préféré
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accessibleModules.map((module) => {
                const Icon = module.icon;
                const isSelected = selectedModule === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${module.bgColor} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${module.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          isSelected
                            ? 'text-indigo-900 dark:text-indigo-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {module.name}
                        </h3>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        isSelected
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {module.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="primary"
              onClick={handleSave}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Enregistrer la préférence
            </Button>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Note importante
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Cette préférence est stockée localement sur votre navigateur. Si vous vous connectez
                depuis un autre appareil ou navigateur, vous devrez configurer à nouveau votre module par défaut.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
