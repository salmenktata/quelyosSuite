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

import config from "@/app/lib/config";
import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function CGVPage() {
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
          <h1 className="text-4xl lg:text-5xl font-bold">Conditions Générales de Vente</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2025</p>
        </div>
        
        {/* Préambule */}
        <div className="mb-12 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
          <p className="text-slate-300 m-0">
            Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent à toute souscription d&apos;un 
            abonnement aux services Quelyos. Elles complètent les{" "}
            <Link href="/cgu" className="text-indigo-400 hover:text-indigo-300 underline">
              Conditions Générales d&apos;Utilisation
            </Link>{" "}
            et priment sur celles-ci en cas de contradiction concernant les aspects commerciaux.
          </p>
        </div>
        
        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Offres et tarifs */}
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
              
              {/* Plans */}
              <div className="grid gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white m-0">Starter</h3>
                    <span className="text-emerald-400 font-bold">Gratuit</span>
                  </div>
                  <ul className="text-sm space-y-1 m-0 p-0 list-none">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 1 utilisateur</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 2 comptes bancaires</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Rapports basiques</li>
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
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Comptes illimités</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> IA & Analytics avancés</li>
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
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-violet-400" /> Accès API complet</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-violet-400" /> Account Manager dédié</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-violet-400" /> SLA garanti 99.9%</li>
                  </ul>
                </div>
              </div>
              
              <p className="m-0 mt-4 text-sm">
                Les tarifs sont exprimés en euros hors taxes (HT). La TVA applicable sera ajoutée lors 
                de la facturation selon le taux en vigueur.
              </p>
            </div>
          </section>
          
          {/* Commande et souscription */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 2 – Commande et souscription</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                La souscription à un abonnement Quelyos s&apos;effectue exclusivement en ligne sur notre 
                plateforme. Le processus de commande comprend :
              </p>
              <ol className="space-y-2 m-0 p-0 list-decimal list-inside">
                <li>Création d&apos;un compte utilisateur</li>
                <li>Sélection de l&apos;offre souhaitée</li>
                <li>Renseignement des informations de facturation</li>
                <li>Validation du mode de paiement</li>
                <li>Confirmation de la commande</li>
              </ol>
              <p className="m-0">
                La souscription est effective dès réception du paiement ou validation du mandat de 
                prélèvement SEPA.
              </p>
            </div>
          </section>
          
          {/* Paiement */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 3 – Modalités de paiement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Moyens de paiement acceptés :</strong>
              </p>
              <ul className="space-y-2 list-none m-0 p-0">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Carte bancaire (Visa, Mastercard, American Express)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Prélèvement SEPA (abonnement annuel uniquement)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Virement bancaire (offre Enterprise)
                </li>
              </ul>
              <p className="m-0 mt-4">
                <strong className="text-white">Facturation :</strong> Les abonnements sont facturés 
                mensuellement ou annuellement selon l&apos;option choisie. Une remise de 20% est accordée 
                pour les engagements annuels.
              </p>
              <p className="m-0">
                <strong className="text-white">Retard de paiement :</strong> En cas de retard de paiement, 
                des pénalités de retard au taux de 3 fois le taux d&apos;intérêt légal seront appliquées, 
                ainsi qu&apos;une indemnité forfaitaire de 40€ pour frais de recouvrement.
              </p>
            </div>
          </section>
          
          {/* Durée et renouvellement */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <RefreshCcw className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 4 – Durée et renouvellement</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les abonnements sont souscrits pour une durée d&apos;un mois ou d&apos;un an selon le choix 
                du client. Ils sont renouvelés automatiquement par tacite reconduction.
              </p>
              <p className="m-0">
                <strong className="text-white">Résiliation :</strong> Vous pouvez résilier votre abonnement 
                à tout moment depuis votre espace client. La résiliation prend effet :
              </p>
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
              <p className="m-0 mt-4">
                Aucun remboursement prorata temporis n&apos;est effectué en cas de résiliation anticipée.
              </p>
            </div>
          </section>
          
          {/* Droit de rétractation */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 5 – Droit de rétractation</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Pour les professionnels :</strong> Conformément à l&apos;article 
                L221-3 du Code de la consommation, les professionnels ne bénéficient pas du droit de 
                rétractation prévu pour les consommateurs.
              </p>
              <p className="m-0">
                <strong className="text-white">Pour les consommateurs :</strong> Si vous souscrivez à titre 
                personnel, vous disposez d&apos;un délai de 14 jours à compter de la souscription pour exercer 
                votre droit de rétractation sans avoir à justifier de motifs.
              </p>
              <p className="m-0">
                Toutefois, conformément à l&apos;article L221-28 du Code de la consommation, le droit de 
                rétractation ne peut être exercé si vous avez commencé à utiliser le service avant 
                l&apos;expiration du délai de rétractation et avez expressément renoncé à ce droit.
              </p>
            </div>
          </section>
          
          {/* Garanties */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 6 – Garanties et niveau de service</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                <strong className="text-white">Disponibilité :</strong> Quelyos s&apos;engage à assurer une 
                disponibilité du service de 99.9% (hors maintenance programmée).
              </p>
              <p className="m-0">
                <strong className="text-white">Sécurité :</strong> Vos données sont protégées par un 
                chiffrement de niveau bancaire (AES-256) et stockées dans des datacenters certifiés 
                ISO 27001 situés en France.
              </p>
              <p className="m-0">
                <strong className="text-white">Sauvegardes :</strong> Des sauvegardes quotidiennes sont 
                effectuées avec une rétention de 30 jours.
              </p>
              <p className="m-0">
                En cas de non-respect du niveau de service garanti, les clients Enterprise peuvent 
                bénéficier de crédits de service selon les termes de leur contrat.
              </p>
            </div>
          </section>
          
          {/* Support */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Article 7 – Support client</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Le support client est accessible selon votre formule :
              </p>
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
              <p className="m-0 mt-4">
                <strong className="text-white">Contact :</strong> support@quelyos.com
              </p>
            </div>
          </section>
          
          {/* Médiation */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-6">Article 8 – Médiation et litiges</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                En cas de litige, nous vous invitons à contacter notre service client pour trouver une 
                solution amiable.
              </p>
              <p className="m-0">
                Conformément à l&apos;article L612-1 du Code de la consommation, les consommateurs ont la 
                possibilité de recourir gratuitement à un médiateur de la consommation.
              </p>
              <p className="m-0">
                <strong className="text-white">Médiateur :</strong> CM2C - 14 rue Saint Jean, 75017 Paris
                <br />
                <strong className="text-white">Site :</strong> www.cm2c.net
              </p>
              <p className="m-0">
                À défaut de résolution amiable, les tribunaux de Paris seront seuls compétents.
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