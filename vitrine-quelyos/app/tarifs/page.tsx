"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  Sparkles,
  Calculator,
  ChevronDown,
  TrendingUp,
  Clock,
  Euro,
  Building2,
  Crown,
  Shield,
  Users,
  Zap,
  HelpCircle,
  Star,
  Quote,
  Plus,
  Minus,
  Wallet,
  Store,
  Package,
  Megaphone,
  UserCog,
  LifeBuoy,
  Monitor,
  Wrench,
  Globe,
  ShoppingBag,
  Briefcase,
  Heart,
  HardHat,
  Hotel,
  HandHeart,
  UtensilsCrossed,
  Percent,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Container from "../components/Container";
import {
  type PricingGrid,
  type ModulePlan,
  type SolutionPlan,
  FALLBACK_PRICING_GRID,
} from "@/app/lib/plans-api";

// ═══════════════════════════════════════════════════════════════════════════
// ICÔNES MAPPING
// ═══════════════════════════════════════════════════════════════════════════

const iconMap: Record<string, LucideIcon> = {
  Wallet, Store, Package, Users, Megaphone, UserCog, LifeBuoy, Monitor, Wrench,
  Crown, Building2, Shield, Star, Globe, ShoppingBag, Briefcase, Heart,
  HardHat, Hotel, HandHeart, UtensilsCrossed, Zap,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = iconMap[name] || Package;
  return <IconComponent className={className} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: FETCH PRICING GRID DYNAMIQUE
// ═══════════════════════════════════════════════════════════════════════════

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8069";

function usePricingGrid(): PricingGrid {
  const [grid, setGrid] = useState<PricingGrid>(FALLBACK_PRICING_GRID);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/public/pricing`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success && data.data) {
          setGrid(data.data);
        }
      } catch {
        // fallback silencieux
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return grid;
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE COLOR CLASSES
// ═══════════════════════════════════════════════════════════════════════════

const moduleColorMap: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", ring: "ring-emerald-500/50" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", ring: "ring-indigo-500/50" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", ring: "ring-amber-500/50" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", ring: "ring-violet-500/50" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400", ring: "ring-pink-500/50" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", ring: "ring-teal-500/50" },
  sky: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", ring: "ring-sky-500/50" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", ring: "ring-orange-500/50" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-400", ring: "ring-slate-500/50" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", ring: "ring-rose-500/50" },
};

function getModuleColors(color: string) {
  return moduleColorMap[color] || moduleColorMap.emerald;
}

// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL PROOF
// ═══════════════════════════════════════════════════════════════════════════

const testimonials = [
  {
    quote: "Quelyos a transform\u00E9 notre gestion. On passe 70% de temps en moins sur la compta et les pr\u00E9visions IA nous alertent avant les probl\u00E8mes.",
    author: "Marie D.",
    role: "Fondatrice @ModaShop",
    detail: "E-commerce mode \u2022 Plan Boutique + Finance",
  },
  {
    quote: "Le rapport qualit\u00E9-prix est imbattable. On a r\u00E9cup\u00E9r\u00E9 3 factures impay\u00E9es le premier mois. Rentabilis\u00E9 en 2 semaines.",
    author: "Thomas L.",
    role: "G\u00E9rant Cabinet Martin",
    detail: "Comptabilit\u00E9 \u2022 Module Finance seul",
  },
];

const trustMetrics = [
  { value: "+500", label: "entreprises accompagn\u00E9es" },
  { value: "92%", label: "de pr\u00E9cision IA sur 12 mois" },
  { value: "4.8/5", label: "note moyenne clients" },
];

// ═══════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════

const faqs = [
  {
    category: "Offre & Pricing",
    questions: [
      {
        q: "Comment fonctionne le pricing modulaire ?",
        a: "Vous payez un abonnement de base (9\u20AC/mois) qui inclut le module Home + 1 module au choix. Ensuite, ajoutez uniquement les modules dont vous avez besoin. Pas de pack inutile.",
      },
      {
        q: "Qu\u2019est-ce qu\u2019un pack m\u00E9tier (Solution) ?",
        a: "Les Solutions m\u00E9tier regroupent plusieurs modules en un pack sectoriel \u00E0 prix r\u00E9duit. Par exemple, Quelyos Resto combine POS + Stock + Finance pour 39\u20AC au lieu de 54\u20AC en modules s\u00E9par\u00E9s.",
      },
      {
        q: "Comment fonctionne l\u2019essai 30 jours ?",
        a: "30 jours d\u2019acc\u00E8s complet \u00E0 tous les modules. Aucune carte bancaire requise. \u00C0 la fin, choisissez vos modules ou restez sur le plan de base.",
      },
    ],
  },
  {
    category: "Tarifs & Facturation",
    questions: [
      {
        q: "Puis-je changer de modules \u00E0 tout moment ?",
        a: "Oui, ajout ou retrait instantan\u00E9. Le changement est proratis\u00E9 au jour pr\u00E8s sur votre facture.",
      },
      {
        q: "Y a-t-il un engagement ?",
        a: "Aucun engagement. Annulation en 1 clic. Satisfait ou rembours\u00E9 30 jours.",
      },
      {
        q: "Les tarifs sont-ils HT ou TTC ?",
        a: "Tous les tarifs affich\u00E9s sont HT. La TVA applicable sera ajout\u00E9e lors de la facturation.",
      },
    ],
  },
  {
    category: "S\u00E9curit\u00E9 & RGPD",
    questions: [
      {
        q: "O\u00F9 sont h\u00E9berg\u00E9es mes donn\u00E9es ?",
        a: "Infrastructure s\u00E9curis\u00E9e, datacenters certifi\u00E9s ISO 27001. Conformit\u00E9 RGPD garantie.",
      },
      {
        q: "Puis-je ajouter des utilisateurs suppl\u00E9mentaires ?",
        a: "Oui, par packs de 5 utilisateurs (15\u20AC/mois). 5 utilisateurs sont inclus dans le plan de base.",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CALCULATEUR ROI
// ═══════════════════════════════════════════════════════════════════════════

function ROICalculator() {
  const [hoursPerMonth, setHoursPerMonth] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);
  const [missedInvoices, setMissedInvoices] = useState(2);
  const [avgInvoiceAmount, setAvgInvoiceAmount] = useState(500);

  const timeSaved = hoursPerMonth * 0.7;
  const timeSavings = timeSaved * hourlyRate * 12;
  const invoiceSavings = missedInvoices * avgInvoiceAmount * 12 * 0.8;
  const totalSavings = timeSavings + invoiceSavings;
  const businessCost = 33 * 12;
  const roi = ((totalSavings - businessCost) / businessCost) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <Calculator className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Calculez vos \u00E9conomies
          </h3>
          <p className="text-sm text-slate-400">Estimation ROI annuel</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {[
            { label: "Heures/mois sur la gestion", value: hoursPerMonth, set: setHoursPerMonth, min: 2, max: 40, step: 1, unit: "h" },
            { label: "Votre taux horaire", value: hourlyRate, set: setHourlyRate, min: 20, max: 150, step: 5, unit: "\u20AC" },
            { label: "Factures oubli\u00E9es/mois", value: missedInvoices, set: setMissedInvoices, min: 0, max: 10, step: 1, unit: "" },
            { label: "Montant moyen facture", value: avgInvoiceAmount, set: setAvgInvoiceAmount, min: 100, max: 5000, step: 100, unit: "\u20AC" },
          ].map((item) => (
            <div key={item.label}>
              <label className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>{item.label}</span>
                <span className="font-medium text-white">{item.value}{item.unit}</span>
              </label>
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={item.value}
                onChange={(e) => item.set(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h4 className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-400">
            Vos \u00E9conomies estim\u00E9es
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400"><Clock size={14} />Temps gagn\u00E9/an</span>
              <span className="font-medium text-white">{(timeSaved * 12).toFixed(0)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400"><Euro size={14} />Valeur temps gagn\u00E9</span>
              <span className="font-medium text-white">{timeSavings.toLocaleString("fr-FR")}\u20AC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-400"><TrendingUp size={14} />Factures r\u00E9cup\u00E9r\u00E9es</span>
              <span className="font-medium text-white">{invoiceSavings.toLocaleString("fr-FR")}\u20AC</span>
            </div>

            <div className="my-3 border-t border-white/10" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{`Co\u00FBt moyen/an (base + 2 modules)`}</span>
              <span className="font-medium text-slate-400">-{businessCost}\u20AC</span>
            </div>

            <div className="rounded-lg bg-emerald-500/10 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400">\u00C9conomie nette/an</span>
                <span className="text-2xl font-bold text-emerald-400">
                  +{(totalSavings - businessCost).toLocaleString("fr-FR")}\u20AC
                </span>
              </div>
              <p className="mt-1 text-right text-xs text-emerald-400/70">ROI : {roi.toFixed(0)}%</p>
            </div>
          </div>

          <Link
            href="/register"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400"
          >
            Essayer gratuitement 30 jours
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ ACCORD\u00C9ON
// ═══════════════════════════════════════════════════════════════════════════

function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {faqs.map((category) => (
        <div key={category.category}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <HelpCircle size={18} className="text-indigo-400" />
            {category.category}
          </h3>
          <div className="space-y-2">
            {category.questions.map((faq, index) => {
              const itemId = `${category.category}-${index}`;
              const isOpen = openItems.includes(itemId);
              return (
                <div key={index} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                  <button
                    onClick={() => toggleItem(itemId)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-medium text-white">{faq.q}</span>
                    <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="border-t border-white/5 px-4 pb-4 pt-3">
                          <p className="text-sm leading-relaxed text-slate-400">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT MODULE CARD (Configurateur)
// ═══════════════════════════════════════════════════════════════════════════

function ModuleCard({
  mod,
  selected,
  isFreeChoice,
  onToggle,
  billingPeriod,
}: {
  mod: ModulePlan;
  selected: boolean;
  isFreeChoice: boolean;
  onToggle: () => void;
  billingPeriod: "monthly" | "yearly";
}) {
  const colors = getModuleColors(mod.color);
  const price = billingPeriod === "yearly" ? mod.annualPrice : mod.price;

  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all ${
        selected
          ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      {isFreeChoice && selected && (
        <span className="absolute -top-2 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
          OFFERT
        </span>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
          <DynamicIcon name={mod.icon} className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
          selected ? `${colors.border} ${colors.bg}` : "border-white/20"
        }`}>
          {selected && <Check size={12} className={colors.text} />}
        </div>
      </div>

      <h4 className="text-sm font-semibold text-white">{mod.name}</h4>
      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{mod.description}</p>

      <div className="mt-3 flex items-baseline gap-1">
        {isFreeChoice && selected ? (
          <span className="text-sm font-bold text-emerald-400">Inclus</span>
        ) : (
          <>
            <span className="text-lg font-bold text-white">{price}\u20AC</span>
            <span className="text-xs text-slate-500">/mois</span>
          </>
        )}
      </div>

      {mod.limits && (
        <p className="mt-2 text-[10px] text-slate-500">
          {mod.limits.included} {mod.limits.name} inclus
        </p>
      )}
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT SOLUTION CARD
// ═══════════════════════════════════════════════════════════════════════════

function SolutionCard({
  solution,
  modules,
  billingPeriod,
  onSelect,
}: {
  solution: SolutionPlan;
  modules: ModulePlan[];
  billingPeriod: "monthly" | "yearly";
  onSelect: (moduleKeys: string[]) => void;
}) {
  const colors = getModuleColors(solution.color);
  const price = billingPeriod === "yearly" ? solution.annualPrice : solution.price;

  const includedModuleNames = solution.modules
    .map((key) => modules.find((m) => m.key === key)?.name || key)
    .join(", ");

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:bg-white/[0.06]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
            <DynamicIcon name={solution.icon} className={`h-5 w-5 ${colors.text}`} />
          </div>
          <div>
            <h4 className="font-semibold text-white">{solution.name}</h4>
            <p className="text-xs text-slate-400">{solution.description}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold text-white">{price}\u20AC<span className="text-xs text-slate-500">/mois</span></div>
          {solution.savings > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Percent size={10} />-{solution.savings}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {solution.modules.map((key) => {
          const mod = modules.find((m) => m.key === key);
          if (!mod) return null;
          const mColors = getModuleColors(mod.color);
          return (
            <span key={key} className={`rounded-full ${mColors.bg} px-2 py-0.5 text-[10px] font-medium ${mColors.text}`}>
              {mod.name}
            </span>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] text-slate-500">Inclut : {includedModuleNames}</p>

      <button
        onClick={() => onSelect(solution.modules)}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg ${colors.bg} border ${colors.border} px-3 py-2 text-xs font-semibold ${colors.text} transition-all hover:bg-white/10`}
      >
        S\u00E9lectionner ce pack
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — CONFIGURATEUR INTERACTIF
// ═══════════════════════════════════════════════════════════════════════════

type ViewMode = "configurator" | "solutions";

export default function TarifsPage() {
  const grid = usePricingGrid();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [freeModuleKey, setFreeModuleKey] = useState<string | null>(null);
  const [extraUserPacks, setExtraUserPacks] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("configurator");

  const toggleModule = useCallback((key: string) => {
    setSelectedModules((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      // Si c'est le premier module sélectionné, il est offert
      if (next.length === 1 && !prev.includes(key)) {
        setFreeModuleKey(key);
      }
      // Si on désélectionne le module offert, attribuer au premier restant
      if (key === freeModuleKey) {
        setFreeModuleKey(next.length > 0 ? next[0] : null);
      }
      return next;
    });
  }, [freeModuleKey]);

  const selectSolutionModules = useCallback((moduleKeys: string[]) => {
    setSelectedModules(moduleKeys);
    setFreeModuleKey(moduleKeys[0] || null);
    setViewMode("configurator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Calculer le total dynamiquement
  const pricing = useMemo(() => {
    const isYearly = billingPeriod === "yearly";
    const basePrice = isYearly ? grid.base.annualPrice : grid.base.price;

    let modulesTotal = 0;
    for (const key of selectedModules) {
      if (key === freeModuleKey) continue;
      const mod = grid.modules.find((m) => m.key === key);
      if (mod) {
        modulesTotal += isYearly ? mod.annualPrice : mod.price;
      }
    }

    const userPackPrice = isYearly ? grid.userPacks.annualPrice : grid.userPacks.price;
    const usersTotal = extraUserPacks * userPackPrice;

    const monthly = basePrice + modulesTotal + usersTotal;
    const totalUsers = grid.base.usersIncluded + (extraUserPacks * grid.userPacks.size);

    const allModulesTotal = grid.modules.reduce((sum, m) => sum + (isYearly ? m.annualPrice : m.price), 0);
    const allInPrice = grid.allInDiscount
      ? (isYearly ? Math.round(grid.allInDiscount.discountedPrice * (1 - grid.base.yearlyDiscountPct / 100)) : grid.allInDiscount.discountedPrice)
      : allModulesTotal;

    return {
      basePrice,
      modulesTotal,
      usersTotal,
      monthly,
      totalUsers,
      selectedCount: selectedModules.length,
      freeModule: freeModuleKey,
      allInPrice: allInPrice + basePrice,
      allInRegular: (isYearly ? Math.round((grid.allInDiscount?.regularTotal || allModulesTotal) * (1 - grid.base.yearlyDiscountPct / 100)) : (grid.allInDiscount?.regularTotal || allModulesTotal)) + basePrice,
    };
  }, [selectedModules, freeModuleKey, extraUserPacks, billingPeriod, grid]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* PROMO BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center">
        <p className="text-sm font-medium text-white">
          <strong>Offre de lancement</strong> : 30 jours d&apos;essai gratuit + 1 module offert
          <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs">Sans carte bancaire</span>
        </p>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden pb-8 pt-16">
        <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />

        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
              <Sparkles size={14} />
              Composez votre ERP sur mesure
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Payez uniquement
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                ce dont vous avez besoin
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              {`Plan de base \u00E0 ${grid.base.price}\u20AC/mois + modules au choix. ${grid.base.usersIncluded} utilisateurs inclus. 1 module offert.`}
            </p>

            {/* Toggle Mensuel/Annuel */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={`text-sm transition-colors ${billingPeriod === "monthly" ? "text-white" : "text-slate-500"}`}>
                Mensuel
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
                className={`relative h-7 w-14 rounded-full transition-colors ${billingPeriod === "yearly" ? "bg-indigo-500" : "bg-white/20"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${billingPeriod === "yearly" ? "left-8" : "left-1"}`} />
              </button>
              <span className={`text-sm transition-colors ${billingPeriod === "yearly" ? "text-white" : "text-slate-500"}`}>
                Annuel
              </span>
              {billingPeriod === "yearly" && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  -{grid.base.yearlyDiscountPct}%
                </span>
              )}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* VIEW MODE TABS */}
      <section className="relative border-b border-white/10 bg-slate-900/30">
        <Container>
          <div className="flex items-center justify-center gap-4">
            {[
              { key: "configurator" as const, label: "Configurateur" },
              { key: "solutions" as const, label: "Solutions m\u00E9tier" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`relative px-6 py-4 text-sm font-medium transition-all ${
                  viewMode === tab.key ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
                {viewMode === tab.key && (
                  <motion.div
                    layoutId="viewTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIGURATEUR INTERACTIF
      ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === "configurator" && (
        <section className="relative py-12">
          <Container>
            <div className="grid gap-8 lg:grid-cols-3">
              {/* COLONNE GAUCHE : Modules (2/3) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Plan de base */}
                <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                        <Shield className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Plan de base</h3>
                        <p className="text-xs text-slate-400">
                          Home + {grid.base.usersIncluded} utilisateurs + 1 module offert
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">
                        {billingPeriod === "yearly" ? grid.base.annualPrice : grid.base.price}\u20AC
                      </span>
                      <span className="text-sm text-slate-400">/mois</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300">Dashboard & Analytics</span>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs text-indigo-300">Param\u00E8tres</span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">Essai {grid.base.trialDays}j gratuit</span>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300">1 module offert</span>
                  </div>
                </div>

                {/* Grille des modules */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Choisissez vos modules
                      {pricing.selectedCount > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({pricing.selectedCount} s\u00E9lectionn\u00E9{pricing.selectedCount > 1 ? "s" : ""})
                        </span>
                      )}
                    </h3>
                    {pricing.selectedCount === 0 && (
                      <span className="text-xs text-emerald-400">Le 1er module est offert</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {grid.modules.map((mod) => (
                      <ModuleCard
                        key={mod.key}
                        mod={mod}
                        selected={selectedModules.includes(mod.key)}
                        isFreeChoice={freeModuleKey === mod.key}
                        onToggle={() => toggleModule(mod.key)}
                        billingPeriod={billingPeriod}
                      />
                    ))}
                  </div>
                </div>

                {/* Utilisateurs suppl\u00E9mentaires */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                        <Users className="h-4 w-4 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Utilisateurs</h4>
                        <p className="text-xs text-slate-400">
                          {grid.base.usersIncluded} inclus \u2022 Packs de {grid.userPacks.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExtraUserPacks(Math.max(0, extraUserPacks - 1))}
                        disabled={extraUserPacks === 0}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <div className="text-center">
                        <span className="text-lg font-bold text-white">{pricing.totalUsers}</span>
                        <p className="text-[10px] text-slate-500">utilisateurs</p>
                      </div>
                      <button
                        onClick={() => setExtraUserPacks(Math.min(3, extraUserPacks + 1))}
                        disabled={extraUserPacks >= 3}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/10 disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {extraUserPacks > 0 && (
                    <p className="mt-2 text-right text-xs text-slate-400">
                      +{extraUserPacks} pack{extraUserPacks > 1 ? "s" : ""} = +{pricing.usersTotal}\u20AC/mois
                    </p>
                  )}

                  {extraUserPacks >= 3 && (
                    <p className="mt-2 text-xs text-amber-400">
                      {`Plus de ${grid.base.usersIncluded + 3 * grid.userPacks.size} utilisateurs ?`}{" "}
                      <Link href="/contact" className="underline hover:text-amber-300">Contactez-nous pour Enterprise</Link>
                    </p>
                  )}
                </div>
              </div>

              {/* COLONNE DROITE : R\u00E9capitulatif sticky (1/3) */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-transparent p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Votre abonnement</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Plan de base</span>
                      <span className="text-white">{pricing.basePrice}\u20AC</span>
                    </div>

                    {selectedModules.map((key) => {
                      const mod = grid.modules.find((m) => m.key === key);
                      if (!mod) return null;
                      const isFree = key === freeModuleKey;
                      const price = isFree ? 0 : (billingPeriod === "yearly" ? mod.annualPrice : mod.price);
                      return (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">
                            {mod.name}
                            {isFree && <span className="ml-1 text-emerald-400 text-xs">(offert)</span>}
                          </span>
                          <span className={isFree ? "text-emerald-400" : "text-white"}>
                            {isFree ? "0\u20AC" : `${price}\u20AC`}
                          </span>
                        </div>
                      );
                    })}

                    {extraUserPacks > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">+{extraUserPacks * grid.userPacks.size} utilisateurs</span>
                        <span className="text-white">{pricing.usersTotal}\u20AC</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-white">{pricing.monthly}\u20AC</span>
                        <span className="text-sm text-slate-400">/mois</span>
                      </div>
                    </div>

                    {billingPeriod === "yearly" && (
                      <p className="mt-1 text-right text-xs text-emerald-400">
                        Soit {pricing.monthly * 12}\u20AC/an
                      </p>
                    )}

                    <p className="mt-1 text-right text-xs text-slate-500">
                      {pricing.totalUsers} utilisateurs \u2022 {pricing.selectedCount} module{pricing.selectedCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* All-in promo */}
                  {pricing.selectedCount > 0 && pricing.selectedCount < grid.modules.length && (
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="text-xs text-amber-400">
                        <Star size={12} className="mr-1 inline" />
                        <strong>Tous les modules</strong> pour seulement{" "}
                        <span className="font-bold">{pricing.allInPrice}\u20AC/mois</span>
                        {pricing.allInRegular > pricing.allInPrice && (
                          <span className="ml-1 text-slate-500 line-through">{pricing.allInRegular}\u20AC</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/register?modules=${selectedModules.join(",")}&billing=${billingPeriod}&users=${pricing.totalUsers}`}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/25"
                  >
                    Essai gratuit {grid.base.trialDays} jours
                    <ArrowRight size={14} />
                  </Link>

                  <p className="mt-3 text-center text-[10px] text-slate-500">
                    Sans carte bancaire \u2022 Sans engagement \u2022 R\u00E9siliation en 1 clic
                  </p>
                </div>

                {/* Enterprise CTA */}
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <h4 className="text-sm font-semibold text-white">Enterprise</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Utilisateurs illimit\u00E9s, SLA 99.9%, account manager d\u00E9di\u00E9
                  </p>
                  <Link
                    href="/contact"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400 transition-all hover:bg-amber-500/20"
                  >
                    Contacter commercial
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SOLUTIONS M\u00C9TIER
      ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === "solutions" && (
        <section className="relative py-12">
          <Container>
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white">
                Solutions m\u00E9tier cl\u00E9s en main
              </h2>
              <p className="text-lg text-slate-400">
                Des packs sectoriels \u00E0 prix r\u00E9duit vs modules individuels. Le plan de base ({grid.base.price}\u20AC/mois) s&apos;ajoute.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {grid.solutions.map((solution, index) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <SolutionCard
                    solution={solution}
                    modules={grid.modules}
                    billingPeriod={billingPeriod}
                    onSelect={selectSolutionModules}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Vous ne trouvez pas votre secteur ?{" "}
                <Link href="/contact" className="text-indigo-400 hover:text-indigo-300">
                  Contactez-nous pour une solution sur mesure
                </Link>
              </p>
              <button
                onClick={() => setViewMode("configurator")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-all hover:bg-indigo-500/20"
              >
                Ou composez votre propre configuration
                <ArrowRight size={14} />
              </button>
            </div>
          </Container>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CALCULATEUR ROI
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16">
        <Container narrow>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Combien allez-vous \u00E9conomiser ?
            </h2>
            <p className="mt-2 text-slate-400">
              Calculez votre ROI en quelques secondes
            </p>
          </div>
          <ROICalculator />
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOCIAL PROOF
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/5 bg-slate-900/30 py-16">
        <Container>
          <div className="mb-12 grid gap-8 text-center md:grid-cols-3">
            {trustMetrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl font-bold text-white">{metric.value}</div>
                <div className="mt-1 text-sm text-slate-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <Quote className="mb-4 h-8 w-8 text-indigo-500/50" />
                <p className="text-slate-300">{testimonial.quote}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                    <Users size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                    <div className="text-xs text-slate-500">{testimonial.detail}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-sm text-emerald-400">
                Donn\u00E9es h\u00E9berg\u00E9es de mani\u00E8re s\u00E9curis\u00E9e (RGPD)
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16">
        <Container narrow>
          <h2 className="mb-8 text-center text-2xl font-bold text-white">
            Questions fr\u00E9quentes
          </h2>
          <FAQSection />
        </Container>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20">
        <Container narrow>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-8 text-center backdrop-blur-sm sm:p-12"
          >
            <Zap className="mx-auto mb-4 h-12 w-12 text-indigo-400" />
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Pr\u00EAt \u00E0 simplifier votre gestion ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              {grid.base.trialDays} jours d&apos;essai gratuit. Sans carte bancaire. Sans engagement.
            </p>
            <p className="mt-2 font-semibold text-emerald-400">
              {`\u00C0 partir de ${grid.base.price}\u20AC/mois \u2022 1 module offert`}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/25"
              >
                Essayer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                onClick={() => {
                  setViewMode("configurator");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
              >
                Configurer mon abonnement
              </button>
            </div>
          </motion.div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
