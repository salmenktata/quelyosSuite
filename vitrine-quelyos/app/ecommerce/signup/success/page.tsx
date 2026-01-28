"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Store,
  Settings,
  Package,
  CreditCard,
  Mail,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Container from "@/app/components/Container";

function SignupSuccessContent() {
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get("store") || "ma-boutique";
  const storeUrl = searchParams.get("store_url") || `https://${storeSlug}.quelyos.shop`;
  const adminUrl = searchParams.get("admin_url") || `https://admin.${storeSlug}.quelyos.shop`;

  const nextSteps = [
    {
      icon: Package,
      title: "Ajoutez vos produits",
      description: "Importez ou créez vos premiers produits",
      href: `${adminUrl}/store/products/new`,
      color: "text-emerald-400",
    },
    {
      icon: Settings,
      title: "Personnalisez votre thème",
      description: "Logo, couleurs, typographie",
      href: `${adminUrl}/settings/theme`,
      color: "text-indigo-400",
    },
    {
      icon: CreditCard,
      title: "Configurez les paiements",
      description: "Stripe, PayPal, ou autres",
      href: `${adminUrl}/settings/payments`,
      color: "text-violet-400",
    },
  ];

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
        </Container>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <Container className="max-w-2xl mx-auto">
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-emerald-500/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              Votre boutique est prête !
            </h1>
            <p className="text-gray-400 text-lg">
              Bienvenue sur Quelyos. Votre essai gratuit de 14 jours commence maintenant.
            </p>
          </motion.div>

          {/* Store info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900/50 rounded-2xl border border-white/10 p-6 mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Store className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {storeSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </h2>
                <p className="text-gray-400">{storeSlug}.quelyos.shop</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Voir ma boutique
              </a>
              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                Accéder au backoffice
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Email confirmation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-8"
          >
            <Mail className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-amber-200 font-medium">Vérifiez votre email</p>
              <p className="text-amber-200/70 text-sm">
                Un email de confirmation a été envoyé. Cliquez sur le lien pour activer votre compte.
              </p>
            </div>
          </motion.div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Prochaines étapes
            </h3>
            <div className="space-y-3">
              {nextSteps.map((step) => (
                <a
                  key={step.title}
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/30 border border-white/10 hover:border-white/20 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Help section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-12 pt-8 border-t border-white/10"
          >
            <p className="text-gray-400">
              Besoin d'aide ?{" "}
              <Link href="/docs" className="text-indigo-400 hover:underline">
                Consultez la documentation
              </Link>{" "}
              ou{" "}
              <Link href="/contact" className="text-indigo-400 hover:underline">
                contactez le support
              </Link>
            </p>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}

// Export avec Suspense boundary pour useSearchParams
export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  );
}
