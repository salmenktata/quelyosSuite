"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Users,
  Shield,
  Ban,
  Gavel
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";

export default function CGUPage() {
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
          <h1 className="text-4xl lg:text-5xl font-bold">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2025</p>
        </div>

        <nav className="mb-12 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Sommaire
          </h2>
          <ol className="space-y-2 text-sm text-slate-400">
            <li><a href="#objet" className="hover:text-indigo-400 transition-colors">1. Objet</a></li>
            <li><a href="#acceptation" className="hover:text-indigo-400 transition-colors">2. Acceptation des CGU</a></li>
            <li><a href="#acces" className="hover:text-indigo-400 transition-colors">3. Accès au service</a></li>
            <li><a href="#inscription" className="hover:text-indigo-400 transition-colors">4. Inscription et compte</a></li>
            <li><a href="#utilisation" className="hover:text-indigo-400 transition-colors">5. Utilisation du service</a></li>
            <li><a href="#donnees" className="hover:text-indigo-400 transition-colors">6. Données personnelles</a></li>
            <li><a href="#litiges" className="hover:text-indigo-400 transition-colors">7. Litiges</a></li>
          </ol>
        </nav>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section id="objet" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Scale className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 1 – Objet</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les présentes CGU définissent les modalités d&apos;utilisation de la plateforme Quelyos,
                ainsi que les droits et obligations des parties.
              </p>
              <p className="m-0">
                Le Service est une suite de gestion permettant aux entreprises de gérer leur activité
                de manière centralisée et sécurisée.
              </p>
            </div>
          </section>

          <section id="acceptation" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 2 – Acceptation des CGU</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;utilisation du Service implique l&apos;acceptation pleine et entière des présentes CGU.
                En créant un compte ou en utilisant le Service, vous reconnaissez avoir lu et accepté ces conditions.
              </p>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="m-0 text-sm text-amber-200">
                  Les CGU peuvent être modifiées à tout moment. Vous serez informé de toute modification significative.
                </p>
              </div>
            </div>
          </section>

          <section id="acces" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 3 – Accès au service</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Le Service est accessible 24h/24 et 7j/7, sous réserve des interruptions pour maintenance.
              </p>
              <p className="m-0"><strong className="text-white">Conditions d&apos;accès :</strong></p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Disposer d&apos;une adresse email valide</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Accepter les présentes CGU</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Disposer d&apos;un navigateur compatible</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="inscription" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 4 – Inscription et compte</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;utilisation du Service nécessite la création d&apos;un compte. Vous vous engagez à fournir
                des informations exactes et à jour.
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Maintenir la confidentialité de vos identifiants</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Ne pas partager votre compte avec des tiers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Nous informer de toute utilisation non autorisée</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="utilisation" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 5 – Utilisation du service</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;utilisateur s&apos;engage à utiliser le Service de manière loyale, conformément à sa destination.
              </p>
              <p className="m-0"><strong className="text-white">Sont notamment interdits :</strong></p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                  <span>Toute utilisation à des fins illicites ou frauduleuses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                  <span>Les tentatives d&apos;accès non autorisé aux systèmes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                  <span>Le contournement des mesures de sécurité</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="donnees" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 6 – Données personnelles</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Le traitement des données personnelles est régi par notre{" "}
                <Link href="/confidentialite" className="text-indigo-400 hover:text-indigo-300 underline">
                  Politique de Confidentialité
                </Link>, qui fait partie intégrante des présentes CGU.
              </p>
              <p className="m-0">
                Quelyos s&apos;engage à respecter le RGPD et la réglementation applicable.
              </p>
            </div>
          </section>

          <section id="litiges" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 7 – Litiges</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Les présentes CGU sont soumises au droit français.</p>
              <p className="m-0">
                En cas de litige, les parties s&apos;engagent à rechercher une solution amiable.
                À défaut d&apos;accord, les tribunaux de Paris seront seuls compétents.
              </p>
              <p className="m-0">
                <strong className="text-white">Contact :</strong> legal@quelyos.com
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
