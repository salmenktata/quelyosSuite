/**
 * Paramètres de sécurité 2FA - Super Admin
 *
 * Fonctionnalités :
 * - Affichage statut 2FA
 * - Activation 2FA : QR code + confirmation code TOTP
 * - Désactivation 2FA avec vérification code
 * - Régénération codes de secours
 * - Affichage backup codes après setup
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Download,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { Link } from 'react-router'

interface TwoFAStatus {
  enabled: boolean
  has_backup_codes: boolean
  backup_codes_remaining?: number
}

interface SetupResponse {
  qr_code: string
  secret: string
  issuer: string
}

interface ConfirmResponse {
  backup_codes: string[]
}

type Step = 'status' | 'setup' | 'confirm' | 'backup-codes' | 'disable' | 'regenerate'

export function SecuritySettings() {
  const [step, setStep] = useState<Step>('status')
  const [status, setStatus] = useState<TwoFAStatus | null>(null)
  const [setupData, setSetupData] = useState<SetupResponse | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null!)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.request<TwoFAStatus>({
        method: 'GET',
        path: '/api/auth/2fa/status',
      })
      setStatus(response.data)
    } catch (_err) {
      setError('Impossible de charger le statut 2FA')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (step === 'confirm' || step === 'disable' || step === 'regenerate') {
      setTimeout(() => codeInputRef.current?.focus(), 100)
    }
  }, [step])

  const handleSetup = useCallback(async () => {
    setActionLoading(true)
    setError('')
    try {
      const response = await api.request<SetupResponse>({
        method: 'POST',
        path: '/api/auth/2fa/setup',
      })
      setSetupData(response.data)
      setStep('setup')
    } catch (_err) {
      setError('Erreur lors de la configuration 2FA')
    } finally {
      setActionLoading(false)
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (code.length !== 6) return
    setActionLoading(true)
    setError('')
    try {
      const response = await api.request<ConfirmResponse>({
        method: 'POST',
        path: '/api/auth/2fa/confirm',
        body: { code },
      })
      setBackupCodes(response.data.backup_codes)
      setStep('backup-codes')
      setCode('')
      setSuccess('2FA activée avec succès')
    } catch (_err) {
      setError('Code invalide. Vérifiez votre application.')
      setCode('')
    } finally {
      setActionLoading(false)
    }
  }, [code])

  const handleDisable = useCallback(async () => {
    if (code.length !== 6) return
    setActionLoading(true)
    setError('')
    try {
      await api.request({
        method: 'POST',
        path: '/api/auth/2fa/disable',
        body: { code },
      })
      setStep('status')
      setCode('')
      setSuccess('2FA désactivée')
      fetchStatus()
    } catch (_err) {
      setError('Code invalide')
      setCode('')
    } finally {
      setActionLoading(false)
    }
  }, [code, fetchStatus])

  const handleRegenerateBackupCodes = useCallback(async () => {
    if (code.length !== 6) return
    setActionLoading(true)
    setError('')
    try {
      const response = await api.request<ConfirmResponse>({
        method: 'POST',
        path: '/api/auth/2fa/backup-codes/regenerate',
        body: { code },
      })
      setBackupCodes(response.data.backup_codes)
      setStep('backup-codes')
      setCode('')
      setSuccess('Nouveaux codes de secours générés')
    } catch (_err) {
      setError('Code invalide')
      setCode('')
    } finally {
      setActionLoading(false)
    }
  }, [code])

  const handleCodeChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
  }, [])

  const copyBackupCodes = useCallback(() => {
    const text = backupCodes.join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [backupCodes])

  const downloadBackupCodes = useCallback(() => {
    const text = `Codes de secours Quelyos 2FA\n${'='.repeat(30)}\n\n${backupCodes.join('\n')}\n\nConservez ces codes en lieu sûr.\nChaque code ne peut être utilisé qu'une seule fois.`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quelyos-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [backupCodes])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/security"
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Authentification à deux facteurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Protégez votre compte avec un code TOTP
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Status */}
      {step === 'status' && status && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center gap-4">
            {status.enabled ? (
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <ShieldOff className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {status.enabled ? '2FA activée' : '2FA désactivée'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {status.enabled
                  ? `${status.backup_codes_remaining ?? 0} code(s) de secours restant(s)`
                  : 'Votre compte est protégé uniquement par mot de passe'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {status.enabled ? (
              <>
                <button
                  onClick={() => { setStep('disable'); setError(''); setSuccess('') }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Désactiver la 2FA
                </button>
                <button
                  onClick={() => { setStep('regenerate'); setError(''); setSuccess('') }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Régénérer codes de secours
                </button>
              </>
            ) : (
              <button
                onClick={handleSetup}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Activer la 2FA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Setup — QR Code */}
      {step === 'setup' && setupData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scannez le QR code
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {`Utilisez votre application d'authentification (Google Authenticator, Authy, etc.)`}
            </p>
          </div>

          {/* QR Code Image */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <img
                src={setupData.qr_code}
                alt="QR Code 2FA"
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Secret manuel */}
          <div className="space-y-2">
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              {showSecret ? 'Masquer' : 'Afficher'} la clé secrète
            </button>
            {showSecret && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <code className="text-sm font-mono text-gray-900 dark:text-white flex-1 break-all">
                  {setupData.secret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(setupData.secret)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('status'); setSetupData(null); setError('') }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => { setStep('confirm'); setError('') }}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* Confirm — Saisie code */}
      {step === 'confirm' && (
        <CodeInputCard
          title="Confirmer la configuration"
          description="Saisissez le code à 6 chiffres affiché dans votre application"
          icon={<ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          iconBg="bg-teal-100 dark:bg-teal-900/30"
          code={code}
          onCodeChange={handleCodeChange}
          onSubmit={handleConfirm}
          onCancel={() => { setStep('setup'); setCode(''); setError('') }}
          loading={actionLoading}
          submitLabel="Confirmer"
          inputRef={codeInputRef}
        />
      )}

      {/* Disable — Saisie code */}
      {step === 'disable' && (
        <CodeInputCard
          title="Désactiver la 2FA"
          description="Saisissez votre code TOTP pour confirmer la désactivation"
          icon={<ShieldOff className="w-6 h-6 text-red-600 dark:text-red-400" />}
          iconBg="bg-red-100 dark:bg-red-900/30"
          code={code}
          onCodeChange={handleCodeChange}
          onSubmit={handleDisable}
          onCancel={() => { setStep('status'); setCode(''); setError('') }}
          loading={actionLoading}
          submitLabel="Désactiver"
          submitClassName="bg-red-600 hover:bg-red-700"
          inputRef={codeInputRef}
        />
      )}

      {/* Regenerate backup codes — Saisie code */}
      {step === 'regenerate' && (
        <CodeInputCard
          title="Régénérer les codes de secours"
          description="Saisissez votre code TOTP pour générer de nouveaux codes"
          icon={<RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          code={code}
          onCodeChange={handleCodeChange}
          onSubmit={handleRegenerateBackupCodes}
          onCancel={() => { setStep('status'); setCode(''); setError('') }}
          loading={actionLoading}
          submitLabel="Régénérer"
          inputRef={codeInputRef}
        />
      )}

      {/* Backup Codes Display */}
      {step === 'backup-codes' && backupCodes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Codes de secours
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sauvegardez ces codes. Chaque code ne peut être utilisé qu&apos;une seule fois.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((bCode) => (
                <code
                  key={bCode}
                  className="text-center py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 font-mono text-sm text-gray-900 dark:text-white"
                >
                  {bCode}
                </code>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyBackupCodes}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={downloadBackupCodes}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {`Ces codes ne seront plus affichés. Conservez-les dans un endroit sûr.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('status')
              setBackupCodes([])
              setSuccess('')
              fetchStatus()
            }}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            {`J'ai sauvegardé mes codes`}
          </button>
        </div>
      )}
    </div>
  )
}

function CodeInputCard({
  title,
  description,
  icon,
  iconBg,
  code,
  onCodeChange,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
  submitClassName = 'bg-teal-600 hover:bg-teal-700',
  inputRef,
}: {
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  loading: boolean
  submitLabel: string
  submitClassName?: string
  inputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="text-center">
        <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>

      <div>
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          disabled={loading}
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="000000"
          className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.length === 6) onSubmit()
          }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || code.length !== 6}
          className={`px-4 py-2 text-sm font-medium text-white ${submitClassName} rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2`}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
