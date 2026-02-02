import { useState, useEffect } from "react";
import { useAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/finance/api";
import {
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Loader2,
  Copy,
  Monitor,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { logger } from '@quelyos/logger';

type Session = {
  id: number;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  isCurrent: boolean;
};

export default function SecurityPage() {
  const { user } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetupMode, setTwoFASetupMode] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAQRCode, setTwoFAQRCode] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityStatus();
    fetchSessions();
  }, []);

  async function fetchSecurityStatus() {
    try {
      const data = await api<{ twoFAEnabled: boolean }>("/user/security/status");
      setTwoFAEnabled(data.twoFAEnabled);
    } catch {
      // Silently fail - 2FA might not be implemented yet
    }
  }

  async function fetchSessions() {
    try {
      const data = await api<Session[]>("/user/sessions");
      setSessions(data);
    } catch {
      // Silently fail
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setPasswordLoading(true);

    try {
      await api("/user/change-password", {
        method: "POST",
        body: { currentPassword, newPassword } as { currentPassword: string; newPassword: string },
      });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      logger.error("Erreur:", err);
      setPasswordError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleSetup2FA() {
    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const data = await api<{ secret: string; qrCode: string }>("/user/2fa/setup", {
        method: "POST",
      });
      setTwoFASecret(data.secret);
      setTwoFAQRCode(data.qrCode);
      setTwoFASetupMode(true);
    } catch (err) {
      logger.error("Erreur:", err);
      setTwoFAError(err instanceof Error ? err.message : "Erreur lors de la configuration 2FA");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleVerify2FA() {
    if (twoFACode.length !== 6) {
      setTwoFAError("Le code doit contenir 6 chiffres");
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      await api("/user/2fa/verify", {
        method: "POST",
        body: { code: twoFACode } as { code: string },
      });
      setTwoFAEnabled(true);
      setTwoFASetupMode(false);
      setTwoFACode("");
    } catch (err) {
      logger.error("Erreur:", err);
      setTwoFAError(err instanceof Error ? err.message : "Code invalide");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleDisable2FA() {
    if (!confirm("Êtes-vous sûr de vouloir désactiver la 2FA ?")) return;

    setTwoFALoading(true);
    try {
      await api("/user/2fa/disable", { method: "POST" });
      setTwoFAEnabled(false);
    } catch (err) {
      logger.error("Erreur:", err);
      setTwoFAError(err instanceof Error ? err.message : "Erreur lors de la désactivation");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handleRevokeSession(sessionId: number) {
    if (!confirm("Déconnecter cette session ?")) return;

    try {
      await api(`/user/sessions/${sessionId}`, { method: "DELETE" });
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch {
      // Silently fail
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const strengthColors = ["bg-red-500", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Excellent"];

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
        {/* Password Change */}
        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Mot de passe</h2>
              <p className="text-sm text-slate-400">Modifiez votre mot de passe</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Hidden username field for password managers and accessibility */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={user?.email || (user as { username?: string } | undefined)?.username || ''}
              readOnly
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Current Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-white placeholder:text-slate-500 focus:border-red-400/50 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Force : <span className={passwordStrength >= 4 ? "text-green-400" : "text-amber-400"}>
                      {strengthLabels[passwordStrength - 1] || "Très faible"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                  confirmPassword && confirmPassword !== newPassword
                    ? "border-red-500/50 focus:border-red-400/50 focus:ring-red-400/20"
                    : "border-white/10 focus:border-red-400/50 focus:ring-red-400/20"
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="mt-1 text-xs text-red-400">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                <AlertTriangle className="h-4 w-4" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                <Check className="h-4 w-4" />
                Mot de passe modifié avec succès
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:from-red-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Modifier le mot de passe
                </>
              )}
            </button>
          </form>
        </section>

        {/* 2FA Setup */}
        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
              twoFAEnabled ? "from-green-500 to-emerald-500" : "from-slate-500 to-slate-600"
            }`}>
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Authentification 2FA</h2>
              <p className="text-sm text-slate-400">
                {twoFAEnabled ? "Activée" : "Désactivée"} — Double sécurité avec TOTP
              </p>
            </div>
            {twoFAEnabled && (
              <span className="ml-auto rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                ✓ Active
              </span>
            )}
          </div>

          {!twoFAEnabled && !twoFASetupMode && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Renforcez votre sécurité</p>
                    <p className="text-xs text-slate-400 mt-1">
                      L&apos;authentification à deux facteurs ajoute une couche de protection supplémentaire.
                      Vous aurez besoin d&apos;une application comme Google Authenticator ou Authy.
                    </p>
                  </div>
                </div>
              </Card>

              <button
                onClick={handleSetup2FA}
                disabled={twoFALoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-50"
              >
                {twoFALoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Activer la 2FA
                  </>
                )}
              </button>

              {twoFAError && (
                <Card>
                  <div className="flex items-center gap-2 text-rose-200">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{twoFAError}</span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {twoFASetupMode && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-300 mb-3">
                  Scannez ce QR code avec votre application d&apos;authentification
                </p>
                {twoFAQRCode && (
                  <div className="inline-block rounded-xl bg-white dark:bg-gray-800 p-4">
                    <img src={twoFAQRCode} alt="QR Code 2FA" className="w-40 h-40" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400 mb-2">Ou entrez ce code manuellement :</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-mono text-indigo-300">
                    {twoFASecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(twoFASecret)}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Code de vérification</label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {twoFAError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  {twoFAError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTwoFASetupMode(false);
                    setTwoFACode("");
                    setTwoFAError(null);
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  Annuler
                </button>
                <button
                  onClick={handleVerify2FA}
                  disabled={twoFALoading || twoFACode.length !== 6}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/25 transition hover:from-green-400 hover:to-emerald-400 disabled:opacity-50"
                >
                  {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Vérifier
                </button>
              </div>
            </div>
          )}

          {twoFAEnabled && !twoFASetupMode && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">2FA activée</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Votre compte est protégé par l&apos;authentification à deux facteurs.
                    </p>
                  </div>
                </div>
              </Card>

              <button
                onClick={handleDisable2FA}
                disabled={twoFALoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                {twoFALoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Désactiver la 2FA
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Active Sessions */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sessions actives</h2>
            <p className="text-sm text-slate-400">Gérez vos connexions sur différents appareils</p>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <p className="text-slate-400">Aucune session active trouvée</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`p-4 ${session.isCurrent ? "border-green-500/30 bg-green-500/5" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      session.isCurrent ? "bg-green-500/20" : "bg-slate-700/50"
                    }`}>
                      <Monitor className={`h-5 w-5 ${session.isCurrent ? "text-green-400" : "text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {session.userAgent || "Appareil inconnu"}
                        {session.isCurrent && (
                          <span className="ml-2 text-xs text-green-400">(Cette session)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{session.ipAddress || "IP inconnue"}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(session.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                    >
                      Déconnecter
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
