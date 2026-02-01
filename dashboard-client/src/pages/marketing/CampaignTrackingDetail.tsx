/**
 * Page : Tracking Détaillé Campagne Marketing
 *
 * Fonctionnalités :
 * 1. Stats détaillées (envoyés, ouverts, clics, engagement)
 * 2. Top clickers (contacts les + engagés)
 * 3. Contacts inactifs (jamais ouvert)
 * 4. Heatmap clics par lien
 * 5. Timeline chronologique interactions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { useMarketingTracking } from '@/hooks/useMarketingTracking';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import type { TrackingStats, HeatmapLink, TimelineEvent } from '@/hooks/useMarketingTracking';
import type { MarketingCampaign } from '@quelyos/types';
import { ArrowLeft, TrendingUp, Users, MousePointerClick, Clock } from 'lucide-react';
import { logger } from '@quelyos/logger';

export function CampaignTrackingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campaignId = id ? parseInt(id) : 0;

  const { getCampaign, loading: campaignLoading } = useMarketingCampaigns() as any;
  const { getCampaignTracking, getCampaignHeatmap, getCampaignTimeline, loading: trackingLoading } = useMarketingTracking() as any;

  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [tracking, setTracking] = useState<TrackingStats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapLink[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      const [campaignData, trackingData, heatmapData, timelineData] = await Promise.all([
        getCampaign(campaignId),
        getCampaignTracking(campaignId),
        getCampaignHeatmap(campaignId),
        getCampaignTimeline(campaignId, 50),
      ]);

      setCampaign(campaignData);
      setTracking(trackingData);
      setHeatmap(heatmapData);
      setTimeline(timelineData.timeline);
    } catch (err) {
      logger.error('Erreur chargement tracking:', err);
    }
  };

  const isLoading = campaignLoading || trackingLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <SkeletonTable rows={10} />
        </div>
      </Layout>
    );
  }

  if (!campaign || !tracking) {
    return (
      <Layout>
        <div className="p-6">
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
            Campagne non trouvée
          </div>
        </div>
      </Layout>
    );
  }

  const openRate = tracking.total_sent > 0 ? (tracking.unique_opens / tracking.total_sent) * 100 : 0;
  const clickRate = tracking.unique_opens > 0 ? (tracking.unique_clicks / tracking.unique_opens) * 100 : 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Marketing', path: '/marketing' },
            { label: 'Campagnes', path: '/marketing/campaigns' },
            { label: campaign.subject || 'Campagne' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tracking : {campaign.subject}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Stats détaillées et analyse engagement
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft as any}
            onClick={() => navigate('/marketing/campaigns')}
          >
            Retour
          </Button>
        </div>

        {/* Stats KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{openRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taux ouverture</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MousePointerClick className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{clickRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Taux clic</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{tracking.avg_engagement_score.toFixed(0)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score engagement</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{tracking.avg_open_time_hours.toFixed(1)}h</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Temps moyen ouverture</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clickers */}
        {tracking.top_clickers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Clickers ({tracking.top_clickers.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ouvertures</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tracking.top_clickers.map((clicker, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{clicker.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{clicker.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{clicker.opens}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          {clicker.engagement_score}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Heatmap Liens */}
        {heatmap.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Heatmap Liens ({heatmap.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clics</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Uniques</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {heatmap.map((link, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white truncate max-w-md">{link.url}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{link.clicks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{link.unique_clickers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline Interactions (50 dernières)</h2>
            </div>
            <div className="p-6 space-y-3">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                  <div className="flex-shrink-0">
                    {event.type === 'open' ? (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {event.email} — <span className="font-medium">{event.type === 'open' ? 'Ouverture' : 'Clic'}</span>
                      {event.url && <span className="text-gray-600 dark:text-gray-400"> → {event.url}</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(event.date).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts inactifs */}
        {tracking.inactive_count > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              {tracking.inactive_count} contacts inactifs (jamais ouvert)
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              Envisager relance ou nettoyage liste pour améliorer engagement
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default CampaignTrackingDetail
