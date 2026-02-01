/**
 * Page : Workflows Marketing Automation
 *
 * Fonctionnalités :
 * 1. Liste workflows (actifs/inactifs, triggers, participants)
 * 2. Activation/désactivation workflow
 * 3. Voir détail workflow (activités séquencées)
 * 4. Liste participants workflow (état, progression)
 * 5. Suppression workflow
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common';
import { useMarketingAutomation } from '@/hooks/useMarketingAutomation';
import type { AutomationWorkflow, AutomationDetail } from '@/hooks/useMarketingAutomation';
import { Play, Square, Trash2, Activity, AlertCircle } from 'lucide-react';
import { logger } from '@quelyos/logger';

export function AutomationWorkflows() {
  const { listAutomations, getAutomation, startAutomation, stopAutomation, deleteAutomation, loading } = useMarketingAutomation();

  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationDetail | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadWorkflows();
  }, [filter]);

  const loadWorkflows = async () => {
    try {
      const params = filter === 'active' ? { active_only: true } : {};
      const data = await listAutomations(params);
      setWorkflows(data.automations);
    } catch (err) {
      logger.error('Erreur chargement workflows:', err);
    }
  };

  const handleToggleWorkflow = async (id: number, currentActive: boolean) => {
    try {
      if (currentActive) {
        await stopAutomation(id);
      } else {
        await startAutomation(id);
      }
      loadWorkflows();
    } catch (err) {
      logger.error('Erreur toggle workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    if (!confirm('Supprimer ce workflow ? Les participants seront également supprimés.')) return;
    
    try {
      await deleteAutomation(id);
      loadWorkflows();
      if (selectedWorkflow?.id === id) setSelectedWorkflow(null);
    } catch (err) {
      logger.error('Erreur suppression workflow:', err);
    }
  };

  const handleViewDetail = async (id: number) => {
    try {
      const detail = await getAutomation(id);
      setSelectedWorkflow(detail);
    } catch (err) {
      logger.error('Erreur chargement détail:', err);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (filter === 'active') return w.active;
    if (filter === 'inactive') return !w.active;
    return true;
  });

  const triggerLabels: Record<string, string> = {
    contact_created: 'Nouveau Contact',
    list_added: 'Ajout Liste',
    order_placed: 'Commande Passée',
    cart_abandoned: 'Panier Abandonné',
    birthday: 'Anniversaire',
    manual: 'Manuel',
  };

  if (loading && workflows.length === 0) {
    return (
      <Layout>
        <div className="p-6">
          <SkeletonTable rows={8} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Marketing', path: '/marketing' },
            { label: 'Automation Workflows' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflows Marketing Automation</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Automatisez vos campagnes marketing avec des workflows événementiels
            </p>
          </div>
        </div>

        {/* PageNotice config={marketingNotices.workflows} */}

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm rounded-lg ${
              filter === 'all'
                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Tous ({workflows.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm rounded-lg ${
              filter === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Actifs ({workflows.filter(w => w.active).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 text-sm rounded-lg ${
              filter === 'inactive'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border-2 border-gray-300 dark:border-gray-600'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Inactifs ({workflows.filter(w => !w.active).length})
          </button>
        </div>

        {/* Liste workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne workflows */}
          <div className="space-y-4">
            {filteredWorkflows.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Aucun workflow trouvé</p>
              </div>
            ) : (
              filteredWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-pink-300 dark:hover:border-pink-700 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(workflow.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{workflow.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Trigger : {triggerLabels[workflow.trigger_type] || workflow.trigger_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {workflow.active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Actif
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          Inactif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">Participants</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{workflow.participant_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">En cours</div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{workflow.active_participant_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">Terminés</div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">{workflow.completed_participant_count}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={(workflow.active ? Square : Play)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWorkflow(workflow.id, workflow.active);
                      }}
                    >
                      {workflow.active ? 'Arrêter' : 'Activer'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkflow(workflow.id);
                      }}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Colonne détail */}
          <div>
            {selectedWorkflow ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activités du Workflow</h2>
                <div className="space-y-3">
                  {selectedWorkflow.activities.map((activity, idx) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Type : {activity.activity_type}
                          {activity.wait_days > 0 && ` • Attente : ${activity.wait_days}j`}
                          {activity.wait_hours > 0 && ` • Attente : ${activity.wait_hours}h`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>Total activités : {selectedWorkflow.activities.length}</div>
                    <div className="mt-1">Filtre : {selectedWorkflow.filter_domain || 'Aucun'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Sélectionnez un workflow pour voir ses activités</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default AutomationWorkflows
