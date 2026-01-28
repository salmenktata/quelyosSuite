"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  CreditCard,
  Euro,
  Calendar,
  RefreshCcw,
  Ban,
  Shield,
  Clock,
  Headphones
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";

export default function CGVPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">
            <FileText className="h-3.5 w-3.5" />
            Document légal
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Conditions Générales de Vente</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div className="mb-12 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
          <p className="text-slate-300 m-0">
            Les présentes CGV s&apos;appliquent à toute souscription d&apos;un abonnement aux services Quelyos.
            Elles complètent les{" "}
            <Link href="/cgu" className="text-indigo-400 hover:text-indigo-300 underline">
              Conditions Générales d&apos;Utilisation
            </Link>.
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Euro className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 1 – Offres et tarifs</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Quelyos propose plusieurs formules d&apos;abonnement adaptées aux besoins des entreprises :
              </p>

              <div className="grid gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white m-0">Starter</h3>
                    <span className="text-emerald-400 font-bold">Gratuit</span>
                  </div>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 1 utilisateur</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Fonctionnalités de base</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white m-0">Pro</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">Populaire</span>
                    </div>
                    <span className="text-indigo-300 font-bold">29€ HT/mois</span>
                  </div>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> 5 utilisateurs</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Toutes les fonctionnalités</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Support prioritaire</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white m-0">Enterprise</h3>
                    <span className="text-violet-400 font-bold">Sur devis</span>
                  </div>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-violet-400" /> Utilisateurs illimités</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-violet-400" /> SLA garanti 99.9%</li>
                  </ul>
                </div>
              </div>

              <p className="m-0 mt-4 text-sm">
                Les tarifs sont exprimés en euros hors taxes (HT). La TVA sera ajoutée lors de la facturation.
              </p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 2 – Commande et souscription</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                La souscription s&apos;effectue exclusivement en ligne. Le processus comprend :
              </p>
              <ol className="space-y-2 m-0 p-0 list-decimal list-inside">
                <li>Création d&apos;un compte utilisateur</li>
                <li>Sélection de l&apos;offre souhaitée</li>
                <li>Renseignement des informations de facturation</li>
                <li>Validation du mode de paiement</li>
                <li>Confirmation de la commande</li>
              </ol>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 3 – Modalités de paiement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0"><strong className="text-white">Moyens de paiement acceptés :</strong></p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Carte bancaire (Visa, Mastercard, American Express)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Prélèvement SEPA (abonnement annuel)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Virement bancaire (offre Enterprise)
                </li>
              </ul>
              <p className="m-0 mt-4">
                <strong className="text-white">Facturation :</strong> Mensuelle ou annuelle. Remise de 20% pour les engagements annuels.
              </p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <RefreshCcw className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 4 – Durée et renouvellement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les abonnements sont renouvelés automatiquement par tacite reconduction.
              </p>
              <p className="m-0"><strong className="text-white">Résiliation :</strong></p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  À la fin du mois en cours pour les abonnements mensuels
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  À la fin de la période annuelle pour les abonnements annuels
                </li>
              </ul>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 5 – Droit de rétractation</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Pour les professionnels :</strong> Pas de droit de rétractation (art. L221-3 Code de la consommation).
              </p>
              <p className="m-0">
                <strong className="text-white">Pour les consommateurs :</strong> Délai de 14 jours à compter de la souscription.
              </p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 6 – Garanties et niveau de service</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0"><strong className="text-white">Disponibilité :</strong> 99.9% (hors maintenance programmée)</p>
              <p className="m-0"><strong className="text-white">Sécurité :</strong> Chiffrement AES-256, datacenters ISO 27001 en France</p>
              <p className="m-0"><strong className="text-white">Sauvegardes :</strong> Quotidiennes, rétention 30 jours</p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 7 – Support client</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="grid gap-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Starter</span>
                  <span className="text-sm text-slate-400">Email (72h)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Pro</span>
                  <span className="text-sm text-indigo-400">Email + Chat (24h)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <span>Enterprise</span>
                  <span className="text-sm text-violet-400">Téléphone + Chat (4h) 24/7</span>
                </div>
              </div>
              <p className="m-0 mt-4"><strong className="text-white">Contact :</strong> support@quelyos.com</p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 8 – Médiation et litiges</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                En cas de litige, contactez notre service client pour trouver une solution amiable.
              </p>
              <p className="m-0">
                <strong className="text-white">Médiateur :</strong> CM2C - 14 rue Saint Jean, 75017 Paris (www.cm2c.net)
              </p>
              <p className="m-0">
                À défaut de résolution amiable, les tribunaux de Paris seront seuls compétents.
              </p>
            </div>
          </section>
        </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
