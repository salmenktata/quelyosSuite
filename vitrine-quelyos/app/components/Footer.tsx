import Link from "next/link";
import { Linkedin, Mail, Sparkles, Twitter } from "lucide-react";
import Container from "./Container";

const solutionsMetier = [
  { name: "Quelyos Resto", href: "/solutions/restaurant" },
  { name: "Quelyos Boutique", href: "/solutions/commerce" },
  { name: "Quelyos Store", href: "/solutions/ecommerce" },
  { name: "Quelyos Pro", href: "/solutions/services" },
  { name: "Quelyos Care", href: "/solutions/sante" },
  { name: "Quelyos Build", href: "/solutions/btp" },
  { name: "Quelyos Hotel", href: "/solutions/hotellerie" },
  { name: "Quelyos Club", href: "/solutions/associations" },
  { name: "Quelyos Immo", href: "/solutions/immobilier" },
  { name: "Quelyos Edu", href: "/solutions/education" },
  { name: "Quelyos Industrie", href: "/solutions/industrie" },
  { name: "Quelyos Logistique", href: "/solutions/logistique" },
];

const modules = [
  { name: "Finance", href: "/finance" },
  { name: "Boutique", href: "/ecommerce" },
  { name: "CRM", href: "/crm" },
  { name: "Stock", href: "/stock" },
  { name: "RH", href: "/hr" },
  { name: "Point de Vente", href: "/pos" },
  { name: "Marketing", href: "/marketing" },
  { name: "GMAO", href: "/gmao" },
];

const entreprise = [
  { name: "À propos", href: "/about" },
  { name: "Sécurité", href: "/security" },
  { name: "FAQ", href: "/faq" },
  { name: "Documentation", href: "/docs" },
  { name: "Support", href: "/support" },
];

const demarrer = [
  { name: "Essai gratuit", href: "/register", highlight: true },
  { name: "Voir les tarifs", href: "/tarifs" },
  { name: "Nous contacter", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/50">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Quelyos</p>
                <p className="text-xs text-slate-400">Suite TPE/PME</p>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              Des solutions métier qui s&apos;adaptent à votre activité.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="mailto:contact@quelyos.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/in/salmenktata"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/quelyos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Solutions métier — split en 2 sous-colonnes */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Solutions métier
            </h3>
            <ul className="columns-1 space-y-2 sm:columns-2 sm:gap-x-6 lg:columns-1">
              {solutionsMetier.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm text-slate-400 hover:text-white">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Modules
            </h3>
            <ul className="space-y-2">
              {modules.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="text-sm text-slate-400 hover:text-white">
                    {m.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Entreprise
            </h3>
            <ul className="space-y-2">
              {entreprise.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="text-sm text-slate-400 hover:text-white">
                    {e.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Démarrer */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Démarrer
            </h3>
            <ul className="space-y-2">
              {demarrer.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className={
                      d.highlight
                        ? "flex items-center gap-2 text-sm text-fuchsia-400 hover:text-fuchsia-300"
                        : "text-sm text-slate-400 hover:text-white"
                    }
                  >
                    {d.highlight && <Sparkles className="h-3 w-3" />}
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2026 Quelyos. Tous droits réservés.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/legal/mentions-legales" className="text-sm text-slate-500 hover:text-slate-300">
              Mentions légales
            </Link>
            <Link href="/legal/confidentialite" className="text-sm text-slate-500 hover:text-slate-300">
              Confidentialité
            </Link>
            <Link href="/legal/cgu" className="text-sm text-slate-500 hover:text-slate-300">
              CGU
            </Link>
            <Link href="/legal/cgv" className="text-sm text-slate-500 hover:text-slate-300">
              CGV
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
