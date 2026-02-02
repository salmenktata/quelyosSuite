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

import config from "@/app/lib/config";
import { useDynamicLegalConfig } from "@/app/lib/useDynamicLegalConfig";
import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function CGUPage() {
  const legalConfig = useDynamicLegalConfig();

  useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50">
        <Container narrow className="py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Quelyos</span>
          </Link>
          <Link 
            href={config.finance.login} 
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Container>
      </header>

      {/* Content */}
      <main className="relative z-10">
        <Container narrow className="py-16">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">
            <FileText className="h-3.5 w-3.5" />
            Document légal
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-slate-400">Dernière mise à jour : {legalConfig.lastUpdate}</p>
        </div>
        
        {/* Table des matières */}
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
            <li><a href="#propriete" className="hover:text-indigo-400 transition-colors">6. Propriété intellectuelle</a></li>
            <li><a href="#donnees" className="hover:text-indigo-400 transition-colors">7. Données personnelles</a></li>
            <li><a href="#responsabilite" className="hover:text-indigo-400 transition-colors">8. Responsabilité</a></li>
            <li><a href="#modification" className="hover:text-indigo-400 transition-colors">9. Modification des CGU</a></li>
            <li><a href="#resiliation" className="hover:text-indigo-400 transition-colors">10. Résiliation</a></li>
            <li><a href="#litiges" className="hover:text-indigo-400 transition-colors">11. Litiges</a></li>
          </ol>
        </nav>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Article 1 */}
          <section id="objet" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Scale className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 1 – Objet</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») ont pour objet de définir 
                les modalités et conditions d&apos;utilisation de la plateforme Quelyos (ci-après « le Service »), 
                ainsi que les droits et obligations des parties dans ce cadre.
              </p>
              <p className="m-0">
                Le Service est une plateforme de gestion financière permettant aux entreprises de gérer leur 
                trésorerie, leurs comptes bancaires, leurs transactions et leurs budgets de manière centralisée 
                et sécurisée.
              </p>
            </div>
          </section>
          
          {/* Article 2 */}
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
                En créant un compte ou en utilisant le Service, vous reconnaissez avoir lu, compris et 
                accepté les présentes conditions.
              </p>
              <p className="m-0">
                Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
              </p>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="m-0 text-sm text-amber-200">
                  Les CGU peuvent être modifiées à tout moment. Vous serez informé de toute modification 
                  significative et invité à les accepter pour continuer à utiliser le Service.
                </p>
              </div>
            </div>
          </section>
          
          {/* Article 3 */}
          <section id="acces" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 3 – Accès au service</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Le Service est accessible 24h/24 et 7j/7, sous réserve des interruptions pour maintenance 
                ou cas de force majeure.
              </p>
              <p className="m-0">
                <strong className="text-white">Conditions d&apos;accès :</strong>
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Être une personne morale ou un professionnel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Disposer d&apos;une adresse email professionnelle valide</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Accepter les présentes CGU</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Disposer d&apos;une connexion internet et d&apos;un navigateur compatible</span>
                </li>
              </ul>
            </div>
          </section>
          
          {/* Article 4 */}
          <section id="inscription" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 4 – Inscription et compte</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;utilisation du Service nécessite la création d&apos;un compte. Lors de l&apos;inscription, 
                vous vous engagez à fournir des informations exactes et à jour.
              </p>
              <p className="m-0">
                <strong className="text-white">Responsabilités de l&apos;utilisateur :</strong>
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Maintenir la confidentialité de vos identifiants de connexion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Ne pas partager votre compte avec des tiers non autorisés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Nous informer immédiatement de toute utilisation non autorisée</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Mettre à jour vos informations en cas de changement</span>
                </li>
              </ul>
            </div>
          </section>
          
          {/* Article 5 */}
          <section id="utilisation" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 5 – Utilisation du service</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;utilisateur s&apos;engage à utiliser le Service de manière loyale, conformément à sa 
                destination et aux présentes CGU.
              </p>
              <p className="m-0">
                <strong className="text-white">Sont notamment interdits :</strong>
              </p>
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
                  <span>La copie ou l&apos;extraction de données à des fins commerciales</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                  <span>Le contournement des mesures de sécurité</span>
                </li>
                <li className="flex items-start gap-2">
                  <Ban className="h-4 w-4 text-red-400 flex-shrink-0 mt-1" />
                  <span>L&apos;utilisation de robots ou scripts automatisés</span>
                </li>
              </ul>
            </div>
          </section>
          
          {/* Article 6 */}
          <section id="propriete" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 6 – Propriété intellectuelle</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Tous les éléments du Service (interface, fonctionnalités, design, code, marques, etc.) 
                sont la propriété exclusive de Quelyos ou de ses partenaires.
              </p>
              <p className="m-0">
                L&apos;utilisateur bénéficie d&apos;un droit d&apos;utilisation personnel, non exclusif et non 
                transférable du Service, limité à ses besoins professionnels.
              </p>
              <p className="m-0">
                Les données saisies par l&apos;utilisateur restent sa propriété. En utilisant le Service, 
                vous accordez à Quelyos une licence limitée pour traiter ces données dans le cadre de 
                la fourniture du Service.
              </p>
            </div>
          </section>
          
          {/* Article 7 */}
          <section id="donnees" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 7 – Données personnelles</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Le traitement des données personnelles est régi par notre{" "}
                <Link href="/confidentialite" className="text-indigo-400 hover:text-indigo-300 underline">
                  Politique de Confidentialité
                </Link>, qui fait partie intégrante des présentes CGU.
              </p>
              <p className="m-0">
                Quelyos s&apos;engage à respecter le RGPD et la réglementation applicable en matière de 
                protection des données personnelles.
              </p>
            </div>
          </section>
          
          {/* Article 8 */}
          <section id="responsabilite" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 8 – Responsabilité</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Quelyos s&apos;engage à :</strong>
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Fournir un service conforme à la description</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Assurer la sécurité et la confidentialité des données</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span>Maintenir le Service en condition opérationnelle</span>
                </li>
              </ul>
              <p className="m-0 mt-4">
                Quelyos ne saurait être tenu responsable des dommages indirects, de la perte de données 
                due à une négligence de l&apos;utilisateur, ou de l&apos;utilisation des informations fournies 
                par le Service pour prendre des décisions financières.
              </p>
            </div>
          </section>
          
          {/* Article 9 */}
          <section id="modification" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 9 – Modification des CGU</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Quelyos se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs 
                seront informés des modifications par email et/ou par notification dans l&apos;application.
              </p>
              <p className="m-0">
                La poursuite de l&apos;utilisation du Service après modification des CGU vaut acceptation 
                des nouvelles conditions.
              </p>
            </div>
          </section>
          
          {/* Article 10 */}
          <section id="resiliation" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 10 – Résiliation</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Résiliation par l&apos;utilisateur :</strong> Vous pouvez 
                résilier votre compte à tout moment depuis les paramètres de votre compte ou en contactant 
                le support.
              </p>
              <p className="m-0">
                <strong className="text-white">Résiliation par Quelyos :</strong> Nous nous réservons le 
                droit de suspendre ou résilier un compte en cas de violation des CGU, après mise en demeure 
                restée sans effet.
              </p>
              <p className="m-0">
                En cas de résiliation, vous pouvez demander l&apos;export de vos données dans les 30 jours 
                suivant la fermeture du compte.
              </p>
            </div>
          </section>
          
          {/* Article 11 */}
          <section id="litiges" className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 11 – Litiges</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les présentes CGU sont régies par le {legalConfig.jurisdiction.law}.
              </p>
              <p className="m-0">
                {`En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute
                action judiciaire.`}
              </p>
              <p className="m-0">
                <strong className="text-white">Médiation :</strong> {legalConfig.mediator.info}
              </p>
              <p className="m-0">
                <strong className="text-white">Médiateur désigné :</strong> {legalConfig.mediator.name}
              </p>
              <p className="m-0">
                {`À défaut de résolution amiable ou de médiation, compétence est attribuée aux `}
                {legalConfig.jurisdiction.courts}.
              </p>
              <p className="m-0">
                <strong className="text-white">Contact :</strong> Pour toute question relative aux présentes
                CGU, vous pouvez nous contacter à {legalConfig.contact.legal}
              </p>
            </div>
          </section>
        </div>
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}