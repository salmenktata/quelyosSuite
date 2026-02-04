/**
 * Page Programme Fidélité - Gestion des récompenses clients
 *
 * Fonctionnalités :
 * - Configuration du programme de points
 * - Niveaux de fidélité avec avantages
 * - Liste des membres et leurs points
 * - Statistiques du programme
 * - Création/modification du programme
 */
import { useState, useEffect } from 'react';
import { Award, Users, TrendingUp, Star, Gift, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { apiFetchJson } from '@/lib/apiFetch';
import { logger } from '@quelyos/logger';

interface LoyaltyLevel {
  id: number;
  name: string;
  minPoints: number;
  pointsMultiplier: number;
  discountPercent: number;
  freeShipping: boolean;
  color: string;
}

interface LoyaltyProgram {
  id: number;
  name: string;
  isActive: boolean;
  pointsPerCurrency: number;
  pointsValue: number;
  minPointsRedeem: number;
  memberCount: number;
  levels: LoyaltyLevel[];
}

interface LoyaltyMember {
  id: number;
  partnerName: string;
  currentPoints: number;
  totalPointsEarned: number;
  levelName: string | null;
  joinDate: string;
}

export default function Loyalty() {
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProgram();
    fetchMembers();
  }, []);

  const fetchProgram = async () => {
    setError(null);
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; program: LoyaltyProgram } }>(
        '/api/admin/loyalty/program',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: {} }),
        }
      );
      if (data.result?.success) {
        setProgram(data.result.program);
      }
    } catch {
      logger.error("Erreur attrapée");
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await apiFetchJson<{ result?: { success: boolean; members: LoyaltyMember[] } }>(
        '/api/admin/loyalty/members',
        {
          method: 'POST',
          body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { limit: 20 } }),
        }
      );
      if (data.result?.success) {
        setMembers(data.result.members || []);
      }
    } catch {
      logger.error("Erreur attrapée");
      // Members fetch error silenced
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <SkeletonTable rows={6} columns={4} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Programme Fidélité' },
          ]}
        />

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programme Fidélité</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Récompensez vos clients fidèles avec un système de points
            </p>
          </div>
          {program && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.loyalty} className="mb-6" />

        {error && (
          <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchProgram} className="mt-2">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {!program && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Programme de fidélité
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Récompensez vos clients fidèles avec un système de points
            </p>
            <Button onClick={() => setEditing(true)}>
              Créer le programme
            </Button>
          </div>
        )}

        {program && (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{program.name}</h2>
                {program.isActive ? (
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Actif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                    Inactif
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {program.pointsPerCurrency} point(s) pour chaque 1 TND dépensé
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Membres</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{program.memberCount}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Points distribués</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.reduce((sum, m) => sum + m.totalPointsEarned, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Valeur point</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {program.pointsValue} TND
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Min. rédemption</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {program.minPointsRedeem} pts
                </p>
              </div>
            </div>

            {/* Levels */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Niveaux de fidélité</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {program.levels.map((level) => (
                  <div
                    key={level.id}
                    className="border rounded-lg p-4"
                    style={{ borderColor: level.color }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${level.color}20`, color: level.color }}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{level.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      À partir de {level.minPoints.toLocaleString()} points
                    </p>
                    <div className="space-y-1 text-xs">
                      {level.pointsMultiplier > 1 && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Star className="w-3 h-3" />
                          x{level.pointsMultiplier} points
                        </div>
                      )}
                      {level.discountPercent > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Gift className="w-3 h-3" />
                          -{level.discountPercent}% permanent
                        </div>
                      )}
                      {level.freeShipping && (
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Truck className="w-3 h-3" />
                          Livraison gratuite
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {program.levels.length === 0 && (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-4">
                    Aucun niveau configuré
                  </p>
                )}
              </div>
            </div>

            {/* Top Members */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top membres</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                      <th className="pb-3">Client</th>
                      <th className="pb-3">Niveau</th>
                      <th className="pb-3">Points actuels</th>
                      <th className="pb-3">Total gagné</th>
                      <th className="pb-3">Membre depuis</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="py-3 font-medium text-gray-900 dark:text-white">
                          {member.partnerName}
                        </td>
                        <td className="py-3">
                          {member.levelName ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded text-xs">
                              {member.levelName}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">
                          {member.currentPoints.toLocaleString()}
                        </td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">
                          {member.totalPointsEarned.toLocaleString()}
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">
                          {member.joinDate ? new Date(member.joinDate).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          Aucun membre inscrit
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
