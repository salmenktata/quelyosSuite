"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Eye,
  Lock,
  Users,
  Clock,
  Database,
  Mail,
  Settings,
  Trash2,
  Download,
  AlertCircle
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";

export default function ConfidentialitePage() {
  useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-slate-800/50">
        <Container narrow className="py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Quelyos</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Container>
      </header>

      <main className="relative z-10">
        <Container narrow className="py-16">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-300">
            <Shield className="h-3.5 w-3.5" />
            Protection des données
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Politique de Confidentialité</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div className="mb-12 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Notre engagement</h2>
              <p className="text-slate-300 m-0">
                Chez Quelyos, la protection de vos données personnelles est une priorité absolue.
                Nous nous engageons à respecter le RGPD et les meilleures pratiques en matière de
                cybersécurité pour garantir la confidentialité de vos informations.
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Responsable du traitement</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Société :</strong> Quelyos SAS</p>
              <p className="m-0"><strong className="text-white">Adresse :</strong> 42 rue de la Finance, 75008 Paris, France</p>
              <p className="m-0"><strong className="text-white">Email :</strong> dpo@quelyos.com</p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Données collectées</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Nous collectons les données suivantes :</p>

              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-2">Données d&apos;identification</h3>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li>• Nom, prénom, adresse email</li>
                    <li>• Nom de l&apos;entreprise</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-2">Données techniques</h3>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li>• Adresse IP, logs de connexion</li>
                    <li>• Cookies techniques et analytiques</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Finalités du traitement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <ul className="space-y-3 list-none m-0 p-0">
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-sm font-semibold">1</span>
                  </span>
                  <div><strong className="text-white">Fourniture du service</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-sm font-semibold">2</span>
                  </span>
                  <div><strong className="text-white">Amélioration du service</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-sm font-semibold">3</span>
                  </span>
                  <div><strong className="text-white">Communication et support</strong></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-sm font-semibold">4</span>
                  </span>
                  <div><strong className="text-white">Sécurité</strong></div>
                </li>
              </ul>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Durée de conservation</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Données de compte</span>
                  <span className="text-sm text-indigo-400">Durée du contrat + 3 ans</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Logs de connexion</span>
                  <span className="text-sm text-indigo-400">1 an</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Cookies</span>
                  <span className="text-sm text-indigo-400">13 mois maximum</span>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Sécurité des données</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Lock className="h-6 w-6 text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Chiffrement</h3>
                  <p className="text-sm m-0">AES-256 pour les données au repos, TLS 1.3 en transit</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Shield className="h-6 w-6 text-indigo-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Authentification</h3>
                  <p className="text-sm m-0">JWT sécurisés, possibilité 2FA</p>
                </div>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Vos droits</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Conformément au RGPD, vous disposez des droits suivants :</p>
              <div className="grid gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  <strong className="text-white">Droit d&apos;accès</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Settings className="h-5 w-5 text-violet-400" />
                  <strong className="text-white">Droit de rectification</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <strong className="text-white">Droit à l&apos;effacement</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Download className="h-5 w-5 text-emerald-400" />
                  <strong className="text-white">Droit à la portabilité</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <strong className="text-white">Droit d&apos;opposition</strong>
                </div>
              </div>
              <p className="m-0 mt-4">
                <strong className="text-white">Contact :</strong>{" "}
                <a href="mailto:dpo@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                  dpo@quelyos.com
                </a>
              </p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Contact</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Email DPO :</strong> dpo@quelyos.com</p>
              <p className="m-0"><strong className="text-white">Adresse :</strong> Quelyos SAS, 42 rue de la Finance, 75008 Paris</p>
            </div>
          </section>
        </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
