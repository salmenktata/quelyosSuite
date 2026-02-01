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
  Globe,
  Database,
  Mail,
  Settings,
  Trash2,
  Download,
  AlertCircle
} from "lucide-react";

import config from "@/app/lib/config";
import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function ConfidentialitePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-300">
            <Shield className="h-3.5 w-3.5" />
            Protection des données
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Politique de Confidentialité</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2026</p>
        </div>
        
        {/* Engagement */}
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
          {/* Responsable du traitement */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Responsable du traitement</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Société :</strong> Quelyos SAS</p>
              <p className="m-0"><strong className="text-white">Adresse :</strong> Email : contact@quelyos.com</p>
              <p className="m-0"><strong className="text-white">Email :</strong> dpo@quelyos.com</p>
              <p className="m-0"><strong className="text-white">DPO (Délégué à la Protection des Données) :</strong> M. Pierre Martin</p>
            </div>
          </section>
          
          {/* Données collectées */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Données collectées</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Nous collectons les données suivantes dans le cadre de notre service :
              </p>
              
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-2">Données d&apos;identification</h3>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li>• Nom, prénom</li>
                    <li>• Adresse email professionnelle</li>
                    <li>• Nom de l&apos;entreprise</li>
                    <li>• Informations entreprise (optionnel)</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-2">Données financières</h3>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li>• Informations sur les comptes bancaires (nom, IBAN chiffré)</li>
                    <li>• Transactions financières saisies par l&apos;utilisateur</li>
                    <li>• Budgets et catégories</li>
                    <li>• Documents téléchargés (factures, justificatifs)</li>
                  </ul>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="font-semibold text-white mb-2">Données techniques</h3>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li>• Adresse IP</li>
                    <li>• Logs de connexion</li>
                    <li>• Type de navigateur et système d&apos;exploitation</li>
                    <li>• Cookies techniques et analytiques</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
          
          {/* Finalités */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Finalités du traitement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Vos données sont utilisées pour :</p>
              <ul className="space-y-3 list-none m-0 p-0">
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-sm font-semibold">1</span>
                  </span>
                  <div>
                    <strong className="text-white">Fourniture du service</strong>
                    <p className="text-sm m-0 mt-1">Création et gestion de votre compte, traitement de vos transactions, génération des rapports.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-sm font-semibold">2</span>
                  </span>
                  <div>
                    <strong className="text-white">Amélioration du service</strong>
                    <p className="text-sm m-0 mt-1">Analyse des usages pour améliorer les fonctionnalités et l&apos;expérience utilisateur.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-sm font-semibold">3</span>
                  </span>
                  <div>
                    <strong className="text-white">Communication</strong>
                    <p className="text-sm m-0 mt-1">Notifications de service, support client, informations importantes sur votre compte.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-sm font-semibold">4</span>
                  </span>
                  <div>
                    <strong className="text-white">Sécurité</strong>
                    <p className="text-sm m-0 mt-1">Détection des fraudes, protection contre les accès non autorisés, audit de sécurité.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-sm font-semibold">5</span>
                  </span>
                  <div>
                    <strong className="text-white">Obligations légales</strong>
                    <p className="text-sm m-0 mt-1">Respect des réglementations fiscales, comptables et de lutte contre le blanchiment.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>
          
          {/* Base légale */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Base légale du traitement</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Nos traitements reposent sur les bases légales suivantes :</p>
              <div className="grid gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Lock className="h-5 w-5 text-indigo-400" />
                  <span><strong className="text-white">Exécution du contrat</strong> – Pour la fourniture du service</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span><strong className="text-white">Consentement</strong> – Pour les communications marketing</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <span><strong className="text-white">Obligation légale</strong> – Pour les données comptables et fiscales</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Eye className="h-5 w-5 text-violet-400" />
                  <span><strong className="text-white">Intérêt légitime</strong> – Pour la sécurité et l&apos;amélioration du service</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Durée de conservation */}
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
                  <span>Données financières</span>
                  <span className="text-sm text-indigo-400">10 ans (obligation légale)</span>
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
              <p className="m-0 text-sm">
                Après ces délais, vos données sont supprimées ou anonymisées de manière irréversible.
              </p>
            </div>
          </section>
          
          {/* Partage des données */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Partage et transfert des données</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Vos données peuvent être partagées avec les catégories de destinataires suivantes :
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span><strong className="text-white">Prestataires techniques</strong> – Hébergement, paiement, envoi d&apos;emails (sous contrat)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-1" />
                  <span><strong className="text-white">Autorités légales</strong> – Sur requête légale uniquement</span>
                </li>
              </ul>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mt-4">
                <p className="m-0 text-emerald-200 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <strong>Vos données ne sont jamais vendues à des tiers.</strong>
                </p>
              </div>
              <p className="m-0 mt-4">
                <strong className="text-white">Transferts hors UE :</strong> Nos données sont hébergées de manière sécurisée . 
                En cas de transfert hors UE (ex : outils analytics), nous nous assurons de l&apos;existence de 
                garanties appropriées (clauses contractuelles types, Privacy Shield, etc.).
              </p>
            </div>
          </section>
          
          {/* Sécurité */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Sécurité des données</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Nous mettons en œuvre des mesures de sécurité robustes :
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Lock className="h-6 w-6 text-emerald-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Chiffrement</h3>
                  <p className="text-sm m-0">AES-256 pour les données au repos, TLS 1.3 pour les données en transit</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Shield className="h-6 w-6 text-indigo-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Authentification</h3>
                  <p className="text-sm m-0">JWT sécurisés, possibilité 2FA, politique de mots de passe forts</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Eye className="h-6 w-6 text-violet-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Audit</h3>
                  <p className="text-sm m-0">Logs d&apos;accès, détection d&apos;intrusion, tests de pénétration réguliers</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <Database className="h-6 w-6 text-amber-400 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Infrastructure</h3>
                  <p className="text-sm m-0">Datacenters ISO 27001, redondance, sauvegardes chiffrées</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Vos droits */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Vos droits</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <div className="grid gap-3 mt-4">
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  <div>
                    <strong className="text-white">Droit d&apos;accès</strong>
                    <p className="text-sm m-0">Obtenir une copie de vos données personnelles</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Settings className="h-5 w-5 text-violet-400" />
                  <div>
                    <strong className="text-white">Droit de rectification</strong>
                    <p className="text-sm m-0">Corriger vos données inexactes ou incomplètes</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-red-400" />
                  <div>
                    <strong className="text-white">Droit à l&apos;effacement</strong>
                    <p className="text-sm m-0">Demander la suppression de vos données</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <Download className="h-5 w-5 text-emerald-400" />
                  <div>
                    <strong className="text-white">Droit à la portabilité</strong>
                    <p className="text-sm m-0">Recevoir vos données dans un format structuré</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  <div>
                    <strong className="text-white">Droit d&apos;opposition</strong>
                    <p className="text-sm m-0">Vous opposer au traitement de vos données</p>
                  </div>
                </div>
              </div>
              <p className="m-0 mt-4">
                <strong className="text-white">Exercer vos droits :</strong> Contactez notre DPO à{" "}
                <a href="mailto:dpo@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                  dpo@quelyos.com
                </a>{" "}
                ou depuis les paramètres de votre compte.
              </p>
              <p className="m-0">
                Vous pouvez également introduire une réclamation auprès de la CNIL : www.cnil.fr
              </p>
            </div>
          </section>
          
          {/* Cookies */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Politique des cookies</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">Nous utilisons les types de cookies suivants :</p>
              <div className="grid gap-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <span className="font-medium text-white">Cookies essentiels</span>
                    <p className="text-xs text-slate-400 m-0">Nécessaires au fonctionnement</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Obligatoires</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <span className="font-medium text-white">Cookies analytiques</span>
                    <p className="text-xs text-slate-400 m-0">Mesure d&apos;audience anonyme</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">Optionnels</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                  <div>
                    <span className="font-medium text-white">Cookies de préférences</span>
                    <p className="text-xs text-slate-400 m-0">Sauvegarde de vos paramètres</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">Optionnels</span>
                </div>
              </div>
              <p className="m-0 mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment via le bandeau de consentement 
                ou les paramètres de votre navigateur.
              </p>
            </div>
          </section>
          
          {/* Contact */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Contact</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p className="m-0">
                Pour toute question relative à cette politique de confidentialité ou à vos données personnelles :
              </p>
              <p className="m-0"><strong className="text-white">Email DPO :</strong> dpo@quelyos.com</p>
              <p className="m-0"><strong className="text-white">Adresse :</strong> Quelyos SAS - DPO - Email : dpo@quelyos.com</p>
              <p className="m-0 text-sm mt-4">
                Nous nous engageons à répondre à vos demandes dans un délai maximum de 30 jours.
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