/**
 * Composant Audit Trail - Historique Modifications Facture
 *
 * Affiche piste d'audit complète :
 * - Timeline modifications (date, utilisateur, changements)
 * - Diff visuel avant/après
 * - Alertes modifications suspectes (montants > 20%, état après validation)
 * - Notes audit (raison modifications)
 * - Export PDF piste d'audit
 */

import { useState } from 'react';
import {
  Clock,
  User,
  AlertTriangle,
  FileDown,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import {
  useInvoiceAuditTrail,
  useAddAuditNote,
  useExportAuditTrail,
  calculateAuditStats,
  type AuditEntry,
  type AuditChange,
} from '@/hooks/useInvoiceAudit';
import { Button } from '@/components/common';

interface AuditTrailProps {
  invoiceId: number;
}

export function AuditTrail({ invoiceId }: AuditTrailProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { data: auditTrail, isLoading, error } = useInvoiceAuditTrail(invoiceId);
  const addNoteMutation = useAddAuditNote();
  const exportMutation = useExportAuditTrail();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">Erreur chargement audit trail</p>
        </div>
      </div>
    );
  }

  if (!auditTrail || auditTrail.modification_count === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Aucune modification enregistrée pour cette facture
        </p>
      </div>
    );
  }

  const stats = calculateAuditStats(auditTrail);

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    addNoteMutation.mutate(
      {
        invoice_id: invoiceId,
        note: noteText,
      },
      {
        onSuccess: () => {
          setNoteText('');
          setShowAddNote(false);
        },
      }
    );
  };

  const handleExport = () => {
    exportMutation.mutate(invoiceId);
  };

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique des Modifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stats.total_modifications} modification{stats.total_modifications > 1 ? 's' : ''} •{' '}
            {stats.total_changes} changement{stats.total_changes > 1 ? 's' : ''} •{' '}
            {stats.unique_users} utilisateur{stats.unique_users > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Ajouter note
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Alertes modifications suspectes */}
      {stats.suspicious_count > 0 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {stats.suspicious_count} modification{stats.suspicious_count > 1 ? 's' : ''} suspecte
                {stats.suspicious_count > 1 ? 's' : ''} détectée{stats.suspicious_count > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Montants modifiés &gt;20%, changements état après validation, ou changements client
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire ajout note */}
      {showAddNote && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Raison de la modification
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Ex: Correction erreur saisie TVA suite audit EC"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={3}
          />
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNote}
              disabled={!noteText.trim() || addNoteMutation.isPending}
            >
              Ajouter note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddNote(false);
                setNoteText('');
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Timeline modifications */}
      <div className="space-y-4">
        {auditTrail.audit_entries.map((entry, index) => {
          const isSuspicious = stats.suspicious_changes.some(s => s.id === entry.id);

          return (
            <AuditEntryCard
              key={entry.id}
              entry={entry}
              isSuspicious={isSuspicious}
              isFirst={index === 0}
            />
          );
        })}
      </div>
    </div>
  );
}

interface AuditEntryCardProps {
  entry: AuditEntry;
  isSuspicious: boolean;
  isFirst: boolean;
}

function AuditEntryCard({ entry, isSuspicious, isFirst }: AuditEntryCardProps) {
  const [expanded, setExpanded] = useState(isFirst);

  return (
    <div
      className={`rounded-lg border p-4 ${
        isSuspicious
          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {entry.user_name}
              </p>
              {isSuspicious && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-3 w-3" />
                  Suspect
                </span>
              )}
            </div>

            {entry.user_email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {entry.user_email}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              {entry.date ? new Date(entry.date).toLocaleString('fr-FR') : 'Date inconnue'}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Masquer' : `Voir ${entry.changes.length} changement${entry.changes.length > 1 ? 's' : ''}`}
        </Button>
      </div>

      {/* Raison */}
      {entry.reason && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            📝 Raison :
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{entry.reason}</p>
        </div>
      )}

      {/* Changements détaillés */}
      {expanded && (
        <div className="space-y-2">
          {entry.changes.map((change, idx) => (
            <ChangeDetail key={idx} change={change} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ChangeDetailProps {
  change: AuditChange;
}

function ChangeDetail({ change }: ChangeDetailProps) {
  const hasDiff = change.diff_percent !== null;
  const isIncrease = hasDiff && (change.diff_percent ?? 0) > 0;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {change.field_label}
        </p>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {change.old_value || <span className="italic">vide</span>}
          </span>

          <ArrowRight className="h-4 w-4 text-gray-400" />

          <span className="font-medium text-gray-900 dark:text-white">
            {change.new_value || <span className="italic">vide</span>}
          </span>

          {hasDiff && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                isIncrease
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}
            >
              {isIncrease ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isIncrease ? '+' : ''}
              {change.diff_percent?.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
