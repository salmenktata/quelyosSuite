"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Globe,
  Server,
  FileText,
  Sparkles
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";

export default function MentionsLegalesPage() {
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
          <h1 className="text-4xl lg:text-5xl font-bold">Mentions Légales</h1>
          <p className="text-slate-400">Dernière mise à jour : Janvier 2025</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <section className="mb-12 p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Éditeur du site</h2>
            </div>

            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Raison sociale :</strong> Quelyos SAS</p>
              <p className="m-0"><strong className="text-white">Forme juridique :</strong> Société par Actions Simplifiée</p>
              <p className="m-0"><strong className="text-white">Capital social :</strong> 10 000 €</p>
              <p className="m-0"><strong className="text-white">RCS :</strong> Paris B 123 456 789</p>
              <p className="m-0"><strong className="text-white">SIRET :</strong> 123 456 789 00012</p>
              <p className="m-0"><strong className="text-white">TVA Intracommunautaire :</strong> FR 12 123456789</p>
              <p className="m-0"><strong className="text-white">Siège social :</strong> 42 rue de la Finance, 75008 Paris, France</p>
            </div>
          </section>

          <section className="mb-12 p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Direction de la publication</h2>
            </div>

            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Directeur de publication :</strong> M. Jean Dupont, Président</p>
              <p className="m-0"><strong className="text-white">Contact :</strong> direction@quelyos.com</p>
              <p className="m-0"><strong className="text-white">Téléphone :</strong> +33 1 23 45 67 89</p>
            </div>
          </section>

          <section className="mb-12 p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Server className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Hébergement</h2>
            </div>

            <div className="space-y-3 text-slate-300">
              <p className="m-0"><strong className="text-white">Hébergeur :</strong> OVH SAS</p>
              <p className="m-0"><strong className="text-white">Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France</p>
              <p className="m-0"><strong className="text-white">Téléphone :</strong> +33 9 72 10 10 07</p>
              <p className="m-0"><strong className="text-white">Site web :</strong> www.ovhcloud.com</p>
            </div>
          </section>

          <section className="mb-12 p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold m-0">Propriété intellectuelle</h2>
            </div>

            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                L&apos;ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, sons, logiciels,
                base de données, etc.) est protégé par le droit d&apos;auteur et le droit des marques.
              </p>
              <p className="m-0">
                La marque <strong className="text-white">Quelyos</strong> et le logo associé sont des marques déposées.
                Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments
                du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
              </p>
            </div>
          </section>

          <section className="mb-12 p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-4">Protection des données personnelles</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès,
                de rectification, de suppression et d&apos;opposition sur vos données personnelles.
              </p>
              <p className="m-0">
                Pour plus d&apos;informations, consultez notre{" "}
                <Link href="/confidentialite" className="text-indigo-400 hover:text-indigo-300 underline">
                  Politique de Confidentialité
                </Link>.
              </p>
              <p className="m-0">
                <strong className="text-white">DPO :</strong> dpo@quelyos.com
              </p>
            </div>
          </section>

          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <h2 className="text-2xl font-bold mb-4">Droit applicable</h2>
            <div className="space-y-4 text-slate-300">
              <p className="m-0">
                Les présentes mentions légales sont régies par le droit français. En cas de litige,
                les tribunaux français seront seuls compétents.
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
