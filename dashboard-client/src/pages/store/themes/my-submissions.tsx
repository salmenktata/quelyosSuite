/**
 * Page Mes Soumissions - Gestion soumissions designer
 *
 * Fonctionnalités :
 * - Liste toutes les soumissions du designer
 * - Statuts : draft, submitted, in_review, approved, rejected
 * - Statistiques par soumission (ventes, revenus)
 * - Actions : éditer draft, voir rejet reason
 * - Dashboard revenus global
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, PageNotice } from '@/components/common';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { logger } from '@quelyos/logger';
import type { ThemeCategory } from '@/types/theme';

interface Submission {
  id: number;
  name: string;
  description: string;
  category: ThemeCategory;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'suspended';
  is_premium: boolean;
  price: number;
  sales_count: number;
  total_revenue: number;
  designer_revenue: number;
  average_rating: number;
  submit_date: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
  },
  submitted: {
    label: 'Soumis',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  in_review: {
    label: 'En Review',
    icon: Eye,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  approved: {
    label: 'Approuvé',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  rejected: {
    label: 'Rejeté',
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  suspended: {
    label: 'Suspendu',
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
};

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_submissions: 0,
    approved_count: 0,
    total_sales: 0,
    total_revenue: 0,
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/themes/submissions/my`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: 1,
          }),
        }
      );

      const data = await response.json();

      if (data.result?.success && data.result.submissions) {
        const subs = data.result.submissions;
        setSubmissions(subs);

        // Calculer stats
        setStats({
          total_submissions: subs.length,
          approved_count: subs.filter((s: Submission) => s.status === 'approved').length,
          total_sales: subs.reduce((sum: number, s: Submission) => sum + s.sales_count, 0),
          total_revenue: subs.reduce((sum: number, s: Submission) => sum + s.designer_revenue, 0),
        });
      }
    } catch (error) {
      logger.error('[MySubmissions] Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Submission['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}
      >
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* 1. Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Mes Soumissions', href: '/store/themes/my-submissions' },
          ]}
        />

        {/* 2. Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mes Soumissions
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gérez vos thèmes soumis au marketplace
            </p>
          </div>
          <Button variant="primary" onClick={() => (window.location.href = '/store/themes/submit')}>
            Soumettre un Nouveau Thème
          </Button>
        </div>

        {/* 3. PageNotice */}
        <PageNotice
          config={{
            pageId: 'themes-my-submissions',
            title: 'Mes Soumissions',
            purpose: 'Suivez le statut de vos thèmes soumis et gérez vos revenus',
            icon: FileText,
            moduleColor: 'indigo',
            sections: [
              {
                title: 'Statuts',
                items: [
                  'Draft : Brouillon non soumis',
                  'Submitted / In Review : En cours de validation',
                  'Approved : Thème publié sur la marketplace',
                  'Rejected : Consultez la raison du rejet',
                  'Statistiques : Ventes et revenus par thème',
                ],
              },
            ],
          }}
        />

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Soumissions</span>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total_submissions}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Thèmes Approuvés</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.approved_count}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Ventes</span>
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total_sales}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Revenus Totaux</span>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total_revenue.toFixed(2)} <span className="text-lg text-gray-500">TND</span>
          </div>
        </div>
      </div>

      {/* Liste Soumissions */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucune Soumission
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vous n'avez pas encore soumis de thème au marketplace
          </p>
          <Button variant="primary" onClick={() => (window.location.href = '/store/themes/submit')}>
            Soumettre Votre Premier Thème
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {submission.name}
                    </h3>
                    {getStatusBadge(submission.status)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {submission.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <span className="capitalize">{submission.category}</span>
                    <span>•</span>
                    <span>
                      {submission.is_premium ? `${submission.price.toFixed(2)} TND` : 'Gratuit'}
                    </span>
                    {submission.submit_date && (
                      <>
                        <span>•</span>
                        <span>Soumis le {new Date(submission.submit_date).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats (si approuvé) */}
              {submission.status === 'approved' && (
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ventes</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {submission.sales_count}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus Totaux</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {submission.total_revenue.toFixed(2)} TND
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vos Revenus</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {submission.designer_revenue.toFixed(2)} TND
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Note Moyenne</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {submission.average_rating > 0 ? submission.average_rating.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                        Raison du rejet
                      </h4>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {submission.rejection_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {submission.status === 'approved' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/store/themes/marketplace/${submission.id}`)
                    }
                  >
                    Voir sur Marketplace
                  </Button>
                )}
                {submission.status === 'draft' && (
                  <Button variant="primary" size="sm">
                    Continuer l'Édition
                  </Button>
                )}
                {submission.status === 'rejected' && (
                  <Button variant="primary" size="sm">
                    Soumettre à Nouveau
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </Layout>
  );
}
