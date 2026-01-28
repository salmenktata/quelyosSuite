"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
  Rocket,
  Crown,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Container from "@/app/components/Container";
import {
  createTenantAsync,
  pollJobStatus,
  type ProvisioningJob
} from "@/app/lib/onboarding-api";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: typeof Store;
  color: string;
}

interface FormData {
  // Étape 1: Plan
  plan: string;
  // Étape 2: Compte
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  // Étape 3: Boutique
  storeName: string;
  storeSlug: string;
  sector: string;
  primaryColor: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES
// ═══════════════════════════════════════════════════════════════════════════

const plans: Plan[] = [
  { id: "starter", name: "Starter", price: "29", period: "/mois", icon: Store, color: "emerald" },
  { id: "pro", name: "Pro", price: "79", period: "/mois", icon: Rocket, color: "indigo" },
  { id: "business", name: "Business", price: "199", period: "/mois", icon: Crown, color: "violet" },
  { id: "enterprise", name: "Enterprise", price: "Sur devis", period: "", icon: Building2, color: "amber" },
];

const sectors = [
  { id: "fashion", name: "Mode & Accessoires", emoji: "👗" },
  { id: "beauty", name: "Beauté & Cosmétiques", emoji: "💄" },
  { id: "food", name: "Alimentation & Boissons", emoji: "🍷" },
  { id: "home", name: "Maison & Décoration", emoji: "🏠" },
  { id: "electronics", name: "Électronique", emoji: "📱" },
  { id: "sports", name: "Sport & Loisirs", emoji: "⚽" },
  { id: "art", name: "Art & Artisanat", emoji: "🎨" },
  { id: "services", name: "Services", emoji: "💼" },
  { id: "other", name: "Autre", emoji: "📦" },
];

const brandColors = [
  { id: "indigo", value: "#6366f1", name: "Indigo" },
  { id: "emerald", value: "#10b981", name: "Émeraude" },
  { id: "rose", value: "#f43f5e", name: "Rose" },
  { id: "amber", value: "#f59e0b", name: "Ambre" },
  { id: "violet", value: "#8b5cf6", name: "Violet" },
  { id: "cyan", value: "#06b6d4", name: "Cyan" },
  { id: "orange", value: "#f97316", name: "Orange" },
  { id: "slate", value: "#475569", name: "Slate" },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════════════════

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
              index < currentStep
                ? "bg-emerald-500 text-white"
                : index === currentStep
                ? "bg-indigo-500 text-white"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 ${
                index < currentStep ? "bg-emerald-500" : "bg-gray-800"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PlanSelector({
  selectedPlan,
  onSelect,
}: {
  selectedPlan: string;
  onSelect: (id: string) => void;
}) {
  const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/50", icon: "text-emerald-400" },
    indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/50", icon: "text-indigo-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/50", icon: "text-violet-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/50", icon: "text-amber-400" },
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {plans.map((plan) => {
        const colors = colorMap[plan.color];
        const isSelected = selectedPlan === plan.id;
        const Icon = plan.icon;

        return (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? `${colors.bg} ${colors.border}`
                : "bg-gray-900/50 border-white/10 hover:border-white/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400">
                  {plan.price}
                  {plan.period && <span className="text-gray-500">{plan.period}</span>}
                </p>
              </div>
              {isSelected && (
                <Check className="w-5 h-5 text-emerald-400 ml-auto" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Step1Plan({
  formData,
  setFormData,
  onNext,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Choisissez votre plan
        </h2>
        <p className="text-gray-400">
          14 jours d&apos;essai gratuit, sans carte bancaire
        </p>
      </div>

      <PlanSelector
        selectedPlan={formData.plan}
        onSelect={(id) => setFormData({ ...formData, plan: id })}
      />

      <div className="flex justify-between pt-6">
        <Link
          href="/ecommerce/pricing"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voir les détails
        </Link>
        <button
          onClick={onNext}
          disabled={!formData.plan}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Step2Account({
  formData,
  setFormData,
  onNext,
  onBack,
  errors,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Créez votre compte
        </h2>
        <p className="text-gray-400">
          Vos informations de connexion
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email professionnel
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="vous@entreprise.com"
              className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/50 border ${
                errors.email ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="8 caractères minimum"
              className={`w-full pl-10 pr-12 py-3 rounded-lg bg-gray-900/50 border ${
                errors.password ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Répétez le mot de passe"
              className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/50 border ${
                errors.confirmPassword ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="terms"
            checked={formData.acceptTerms}
            onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-900 text-indigo-500 focus:ring-indigo-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-400">
            J&apos;accepte les{" "}
            <Link href="/cgu" className="text-indigo-400 hover:underline">
              conditions générales
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-indigo-400 hover:underline">
              politique de confidentialité
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-400">{errors.acceptTerms}</p>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Continuer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Step3Store({
  formData,
  setFormData,
  onNext,
  onBack,
  errors,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}) {
  // Auto-generate slug from store name
  const storeName = formData.storeName;
  useEffect(() => {
    const slug = storeName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData(prev => ({ ...prev, storeSlug: slug }));
  }, [storeName, setFormData]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Configurez votre boutique
        </h2>
        <p className="text-gray-400">
          Vous pourrez modifier ces paramètres plus tard
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom de votre boutique
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Ma Super Boutique"
              className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/50 border ${
                errors.storeName ? "border-red-500" : "border-white/10"
              } text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500`}
            />
          </div>
          {errors.storeName && (
            <p className="mt-1 text-sm text-red-400">{errors.storeName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL de votre boutique
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={formData.storeSlug}
              onChange={(e) => setFormData({ ...formData, storeSlug: e.target.value })}
              placeholder="ma-boutique"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              .quelyos.shop
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Vous pourrez ajouter un domaine personnalisé plus tard
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Secteur d&apos;activité
          </label>
          <div className="grid grid-cols-3 gap-2">
            {sectors.map((sector) => (
              <button
                key={sector.id}
                onClick={() => setFormData({ ...formData, sector: sector.id })}
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.sector === sector.id
                    ? "bg-indigo-500/10 border-indigo-500/50"
                    : "bg-gray-900/50 border-white/10 hover:border-white/30"
                }`}
              >
                <span className="text-xl block mb-1">{sector.emoji}</span>
                <span className="text-xs text-gray-300">{sector.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Couleur principale
          </label>
          <div className="flex flex-wrap gap-3">
            {brandColors.map((color) => (
              <button
                key={color.id}
                onClick={() => setFormData({ ...formData, primaryColor: color.value })}
                className={`w-10 h-10 rounded-full transition-all ${
                  formData.primaryColor === color.value
                    ? "ring-2 ring-offset-2 ring-offset-gray-950 ring-white"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Créer ma boutique
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Step4Creating({ formData }: { formData: FormData }) {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Initialisation...");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [jobState, setJobState] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function performOnboarding() {
      try {
        // Étape 1: Créer le tenant et démarrer le job async
        setCurrentTask("Création de votre compte...");
        const response = await createTenantAsync({
          name: formData.storeName,
          slug: formData.storeSlug,
          email: formData.email,
          password: formData.password,
          plan: formData.plan,
          sector: formData.sector,
          primary_color: formData.primaryColor,
        });

        if (!isMounted) return;

        if (!response.success || !response.job_id) {
          setError(response.error || "Une erreur est survenue lors de la création");
          return;
        }

        // Étape 2: Polling du job pour suivre la progression
        setJobState('running');

        const finalJob = await pollJobStatus(
          response.job_id,
          (job: ProvisioningJob) => {
            if (!isMounted) return;

            setProgress(job.progress);
            setCurrentTask(job.current_step);
            setCompletedSteps(job.completed_steps);
            setTotalSteps(job.total_steps);
            setJobState(job.state);
          },
          1500 // Poll toutes les 1.5 secondes
        );

        if (!isMounted) return;

        // Job terminé avec succès
        if (finalJob.state === 'completed') {
          setProgress(100);
          setCurrentTask("Votre boutique est prête !");
          setJobState('completed');

          // Redirect to success page avec les URLs
          setTimeout(() => {
            const params = new URLSearchParams({
              store: formData.storeSlug,
              store_url: finalJob.store_url || '',
              admin_url: finalJob.admin_url || '',
            });
            router.push(`/ecommerce/signup/success?${params.toString()}`);
          }, 1500);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Erreur de connexion au serveur";
          setError(errorMessage);
          setJobState('failed');
        }
      }
    }

    performOnboarding();

    return () => {
      isMounted = false;
    };
  }, [formData, router]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Oups, une erreur est survenue
        </h2>
        <p className="text-red-400 mb-8">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Réessayer
        </button>
      </motion.div>
    );
  }

  const isCompleted = jobState === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center ${
        isCompleted ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
      }`}>
        {isCompleted ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        ) : (
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">
        {isCompleted
          ? "Votre boutique est prête !"
          : "Création de votre boutique en cours..."}
      </h2>

      <p className="text-gray-400 mb-2">{currentTask}</p>
      {!isCompleted && (
        <p className="text-sm text-gray-500 mb-8">
          Étape {completedSteps + 1} sur {totalSteps}
        </p>
      )}

      <div className="max-w-md mx-auto">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
      </div>

      <div className="mt-8 p-4 rounded-lg bg-gray-900/50 border border-white/10 max-w-md mx-auto">
        <div className="flex items-center gap-3 text-left">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: formData.primaryColor + "30" }}
          >
            <Store className="w-5 h-5" style={{ color: formData.primaryColor }} />
          </div>
          <div>
            <p className="font-medium text-white">{formData.storeName || "Ma boutique"}</p>
            <p className="text-sm text-gray-400">{formData.storeSlug}.quelyos.shop</p>
          </div>
          {isCompleted && (
            <div className="ml-auto">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          )}
        </div>
      </div>

      {isCompleted && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-400 mt-6"
        >
          Redirection vers votre tableau de bord...
        </motion.p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    plan: searchParams.get("plan") || "pro",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    storeName: "",
    storeSlug: "",
    sector: "",
    primaryColor: "#6366f1",
  });

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.email) {
        newErrors.email = "L'email est requis";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email invalide";
      }
      if (!formData.password) {
        newErrors.password = "Le mot de passe est requis";
      } else if (formData.password.length < 8) {
        newErrors.password = "8 caractères minimum";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Vous devez accepter les conditions";
      }
    }

    if (stepNumber === 2) {
      if (!formData.storeName) {
        newErrors.storeName = "Le nom de la boutique est requis";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step < 3 && validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header simple */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <Container className="py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white">Quelyos</span>
          </Link>
          <Link
            href="/ecommerce/pricing"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Voir les tarifs
          </Link>
        </Container>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <Container className="max-w-xl mx-auto">
          {step < 3 && <StepIndicator currentStep={step} totalSteps={3} />}

          <div className="bg-gray-900/30 rounded-2xl border border-white/10 p-6 md:p-8">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <Step1Plan
                  key="step1"
                  formData={formData}
                  setFormData={setFormData}
                  onNext={nextStep}
                />
              )}
              {step === 1 && (
                <Step2Account
                  key="step2"
                  formData={formData}
                  setFormData={setFormData}
                  onNext={nextStep}
                  onBack={prevStep}
                  errors={errors}
                />
              )}
              {step === 2 && (
                <Step3Store
                  key="step3"
                  formData={formData}
                  setFormData={setFormData}
                  onNext={nextStep}
                  onBack={prevStep}
                  errors={errors}
                />
              )}
              {step === 3 && <Step4Creating key="step4" formData={formData} />}
            </AnimatePresence>
          </div>

          {step < 3 && (
            <p className="text-center text-gray-500 text-sm mt-6">
              Déjà inscrit ?{" "}
              <Link href="/login" className="text-indigo-400 hover:underline">
                Connexion
              </Link>
            </p>
          )}
        </Container>
      </main>
    </div>
  );
}
