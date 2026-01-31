import Link from "next/link";
import { Linkedin, Mail, Sparkles } from "lucide-react";
import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/50">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Quelyos</p>
                <p className="text-xs text-slate-400">Suite TPE/PME</p>
              </div>
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Des solutions métier qui s&apos;adaptent à votre activité.
            </p>
          </div>

          {/* Solutions métier */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Solutions métier
            </h3>
            <ul className="space-y-2">
              <li><Link href="/solutions/restaurant" className="text-sm text-slate-400 hover:text-white">Quelyos Resto</Link></li>
              <li><Link href="/solutions/commerce" className="text-sm text-slate-400 hover:text-white">Quelyos Boutique</Link></li>
              <li><Link href="/solutions/ecommerce" className="text-sm text-slate-400 hover:text-white">Quelyos Store</Link></li>
              <li><Link href="/solutions/services" className="text-sm text-slate-400 hover:text-white">Quelyos Pro</Link></li>
              <li><Link href="/solutions/sante" className="text-sm text-slate-400 hover:text-white">Quelyos Care</Link></li>
              <li><Link href="/solutions/btp" className="text-sm text-slate-400 hover:text-white">Quelyos Build</Link></li>
              <li><Link href="/solutions/hotellerie" className="text-sm text-slate-400 hover:text-white">Quelyos Hotel</Link></li>
              <li><Link href="/solutions/associations" className="text-sm text-slate-400 hover:text-white">Quelyos Club</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Solutions
            </h3>
            <ul className="space-y-2">
              <li><Link href="/finance" className="text-sm text-slate-400 hover:text-white">Finance</Link></li>
              <li><Link href="/ecommerce" className="text-sm text-slate-400 hover:text-white">Boutique</Link></li>
              <li><Link href="/crm" className="text-sm text-slate-400 hover:text-white">CRM</Link></li>
              <li><Link href="/stock" className="text-sm text-slate-400 hover:text-white">Stock</Link></li>
              <li><Link href="/hr" className="text-sm text-slate-400 hover:text-white">RH</Link></li>
              <li><Link href="/pos" className="text-sm text-slate-400 hover:text-white">Point de Vente</Link></li>
              <li><Link href="/marketing" className="text-sm text-slate-400 hover:text-white">Marketing</Link></li>
            </ul>
          </div>

          {/* Démarrer */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Démarrer
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/register"
                  className="flex items-center gap-2 text-sm text-fuchsia-400 hover:text-fuchsia-300"
                >
                  <Sparkles className="h-3 w-3" />
                  Essai gratuit
                </Link>
              </li>
              <li>
                <Link
                  href="/tarifs"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Voir les tarifs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Ressources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@quelyos.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  contact@quelyos.com
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/salmenktata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2026 Quelyos. Fait avec ❤️ par Quelyos
          </p>
          <div className="flex gap-6">
            <Link
              href="/legal/mentions-legales"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Mentions légales
            </Link>
            <Link
              href="/legal/confidentialite"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Confidentialité
            </Link>
            <Link
              href="/legal/cgu"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              CGU
            </Link>
            <Link
              href="/legal/cgv"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              CGV
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
